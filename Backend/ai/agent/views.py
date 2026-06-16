from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from core.permissions import IsOwner, ActiveSubscriptionRequired
from .models import Alert, ScanLog
from .serializers import AlertSerializer, ScanLogSerializer
from rest_framework.decorators import action
from ai.utils.prompt_builder import build_risk_alert_prompt
from ai.utils.gemini_client import generate_text
from ai.utils.rag_engine import get_student_context

MANUAL_SCAN_DAILY_LIMIT = 3

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsOwner, ActiveSubscriptionRequired]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        qs = Alert.objects.filter(
            enrollment__class_id__academy_id=self.request.user.academy_id
        ).select_related(
            "enrollment__student_id",
            "enrollment__class_id",
        )

        risk_level = self.request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(risk_level=risk_level)

        reviewed = self.request.query_params.get("reviewed")
        if reviewed == "false":
            qs = qs.filter(reviewed_at__isnull=True)
        elif reviewed == "true":
            qs = qs.filter(reviewed_at__isnull=False)

        return qs

    def partial_update(self, request, *args, **kwargs):
        alert = self.get_object()
        reviewed = request.data.get("reviewed")
        notes = request.data.get("notes")

        if reviewed is True or reviewed == "true":
            alert.reviewed_at = timezone.now()
        elif reviewed is False or reviewed == "false":
            alert.reviewed_at = None

        if notes is not None:
            alert.notes = notes

        alert.save()
        return Response(AlertSerializer(alert).data)
    
    @action(detail=True, methods=["post"], url_path="generate-message")
    def generate_message(self, request, pk=None):
        alert = self.get_object()

        try:
            context = get_student_context(alert.enrollment.student_id)
        except Exception as e:
            return Response(
                {"detail": f"Failed to retrieve student context: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        context["risk_score"] = alert.risk_score

        try:
            prompt = build_risk_alert_prompt(context)
            message = generate_text(prompt)
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
            return Response(
                {
                    "detail": f"Manual scan limit reached ({MANUAL_SCAN_DAILY_LIMIT}/day). Try again tomorrow."
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        scan_log = ScanLog.objects.create(
            academy=request.user.academy,
            triggered_by="manual",
            status=ScanLog.STATUS_RUNNING,
        )

        # TODO: execute scan logic here once Celery is configured.
        # Will call: run_risk_scan(academy_id, scan_log)

        scan_log.status = ScanLog.STATUS_COMPLETE
        scan_log.completed_at = timezone.now()
        scan_log.save()

        return Response(
            ScanLogSerializer(scan_log).data,
            status=status.HTTP_202_ACCEPTED,
        )


class ScanLogListView(APIView):
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get(self, request):
        logs = ScanLog.objects.filter(
            academy_id=request.user.academy_id
        )
        serializer = ScanLogSerializer(logs, many=True)
        return Response(serializer.data)