import traceback
from drf_spectacular.utils import extend_schema, inline_serializer, extend_schema_view
from rest_framework import serializers
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from core.mixins import AcademyScopedMixin
from core.permissions import IsOwner, ActiveSubscriptionRequired
from core.exceptions import UpstreamError, RateLimitedError
from .models import Alert, ScanLog
from .serializers import AlertSerializer, ScanLogSerializer
from rest_framework.decorators import action
from ai.utils.prompt_builder import build_risk_alert_prompt
from ai.utils.gemini_client import generate_text
from ai.utils.rag_engine import get_student_context
from ai.agent.tasks import run_risk_scan

MANUAL_SCAN_DAILY_LIMIT = 3

@extend_schema_view(
    list=extend_schema(tags=["Alert"]),
    retrieve=extend_schema(tags=["Alert"]),
    create=extend_schema(tags=["Alert"]),
    partial_update=extend_schema(tags=["Alert"]),
    stats=extend_schema(tags=["Alert"]),
    generate_message=extend_schema(tags=["Alert"]),
    retranslate_alerts=extend_schema(tags=["Alert"]),
)
class AlertViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsOwner, ActiveSubscriptionRequired]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Alert.objects.none()
        
        qs = Alert.objects.filter(
            enrollment__class_id__academy_id=self.request.user.academy_id
        ).select_related(
            "enrollment__student_id",
            "enrollment__class_id",
        ).order_by("-risk_score")

        risk_level = self.request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(risk_level=risk_level)

        is_dismissed = self.request.query_params.get("is_dismissed")
        if is_dismissed == "false":
            qs = qs.filter(reviewed_at__isnull=True)
        elif is_dismissed == "true":
            qs = qs.filter(reviewed_at__isnull=False)

        return qs

    def partial_update(self, request, *args, **kwargs):
        alert = self.get_object()

        is_dismissed = request.data.get("is_dismissed")
        is_sent = request.data.get("is_sent")
        notes = request.data.get("notes")

        if is_dismissed is True or is_dismissed == "true":
            alert.reviewed_at = timezone.now()
        elif is_dismissed is False or is_dismissed == "false":
            alert.reviewed_at = None

        if is_sent is not None:
            alert.is_sent = is_sent in [True, "true"]

        if notes is not None:
            alert.notes = notes

        alert.save()
        return Response(AlertSerializer(alert).data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from datetime import timedelta
        from django.utils import timezone

        academy_id = request.user.academy_id
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        base_qs = Alert.objects.filter(
            enrollment__class_id__academy_id=academy_id
        )

        total_open = base_qs.filter(reviewed_at__isnull=True).count()
        high_risk_count = base_qs.filter(
            reviewed_at__isnull=True,
            risk_level="high"
        ).count()
        medium_risk_count = base_qs.filter(
            reviewed_at__isnull=True,
            risk_level="medium"
        ).count()
        sent_this_week = base_qs.filter(
            is_sent=True,
            created_at__gte=week_ago
        ).count()

        return Response({
            "total_open": total_open,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "sent_this_week": sent_this_week,
        })

    @action(detail=True, methods=["post"], url_path="generate-message")
    def generate_message(self, request, pk=None):
        from ai.utils.prompt_builder import build_risk_alert_prompt, build_payment_reminder_prompt
        from ai.utils.gemini_client import generate_text
        from ai.utils.rag_engine import get_student_context
        from ai.agent.helpers.context_builder import build_risk_context
        from django.utils.translation import get_language

        alert = self.get_object()
        enrollment = alert.enrollment

        try:
            context = get_student_context(enrollment.student_id.pk)
        except Exception as e:
            return Response(
                {"detail": f"Failed to retrieve student context: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        context["risk_score"] = alert.risk_score

        try:
            prompt = build_risk_alert_prompt(context)

            risk_context = build_risk_context(enrollment.id)
            overdue_days = risk_context.get("overdue_days")

            if overdue_days is not None:
                payment_context = {
                    "student_name": context.get("student_name", "Unknown"),
                    "parent_name": "Parent",
                    "outstanding_balance": enrollment.class_id.session_price or 0,
                    "due_date": overdue_days,
                }
                payment_prompt = build_payment_reminder_prompt(payment_context)
                prompt = prompt + "\n\n" + payment_prompt

            # language instruction
            active_lang = get_language() or "en"
            if active_lang.startswith("ar"):
                prompt += "\n\nIMPORTANT: Write the entire generated message in Arabic."
            else:
                prompt += "\n\nIMPORTANT: Write the entire generated message in English."

            message = generate_text(
                prompt,
                feature="risk_alert",
                academy=enrollment.class_id.academy,
            )
        except Exception as e:
            return Response(
                {"detail": f"LLM call failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        alert.message = message
        alert.save()

        return Response(
            {"message": message},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="retranslate-alerts")
    def retranslate_alerts(self, request):
        from ai.agent.helpers.risk_scorer import risk_scorer
        from ai.agent.helpers.context_builder import build_risk_context

        alerts = Alert.objects.filter(
            enrollment__class_id__academy_id=request.user.academy_id,
            reviewed_at__isnull=True,
        ).select_related("enrollment__class_id__academy")

        updated = 0
        errors = 0

        for alert in alerts:
            try:
                context = build_risk_context(alert.enrollment.id)
                result = risk_scorer(context)
                alert.primary_reason = result["primary_reason"]
                alert.recommended_action = result["recommended_action"]
                alert.save(update_fields=["primary_reason", "recommended_action"])
                updated += 1
            except Exception:
                errors += 1
                continue

        return Response({
            "updated": updated,
            "errors": errors,
        }, status=status.HTTP_200_OK)   
@extend_schema(
    tags=["AI Agent"],
    request=None,
    responses={
        202: ScanLogSerializer,
        429: inline_serializer(
            "ScanRateLimitResponse",
            fields={"detail": serializers.CharField()},
        ),
        500: inline_serializer(
            "ScanFailedResponse",
            fields={"detail": serializers.CharField(), "error": serializers.CharField()},
        ),
    },
)
class RunScanView(APIView):
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def post(self, request):
        from datetime import date
        academy_id = request.user.academy_id

        # rate limit: 3 manual scans per day
        today_scans = ScanLog.objects.filter(
            academy_id=academy_id,
            triggered_by="manual",
            started_at__date=date.today(),
        ).count()

        if today_scans >= MANUAL_SCAN_DAILY_LIMIT:
            raise RateLimitedError(f"Manual scan limit reached ({MANUAL_SCAN_DAILY_LIMIT}/day). Try again tomorrow.")

        scan_log = ScanLog.objects.create(
            academy=request.user.academy,
            triggered_by="manual",
            status=ScanLog.STATUS_RUNNING,
        )

        try:
            run_risk_scan(academy_id, scan_log)
        except Exception as e:
            scan_log.status = ScanLog.STATUS_FAILED
            scan_log.error_log = str(e)
            scan_log.completed_at = timezone.now()
            scan_log.save()
            raise UpstreamError("Scan failed. Please try again.")

        scan_log.status = ScanLog.STATUS_COMPLETE
        scan_log.completed_at = timezone.now()
        scan_log.save()

        return Response(
            ScanLogSerializer(scan_log).data,
            status=status.HTTP_202_ACCEPTED,
        )

@extend_schema(
    tags=["AI Agent"],
    responses={200: ScanLogSerializer(many=True)},
)
class ScanLogListView(APIView):
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get(self, request):
        logs = ScanLog.objects.filter(
            academy_id=request.user.academy_id
        )
        serializer = ScanLogSerializer(logs, many=True)
        return Response(serializer.data)