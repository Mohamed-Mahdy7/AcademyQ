import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from .email_utils import send_email

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "post"]

    def get_queryset(self):
        queryset = Notification.objects.filter(
            student__academy=self.request.user.academy
        ).select_related("student", "enrollment", "alert")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        channel = self.request.query_params.get("channel")
        if channel:
            queryset = queryset.filter(channel=channel)

        notification_type = self.request.query_params.get("type")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset

    @action(detail=False, methods=["post"], url_path="send-alert")
    def send_alert(self, request):
        """
        Send the AI-generated alert message to the parent via email.

        Expects:
            { "alert_id": "<uuid>" }

        The message is read directly from alert.message (already generated
        by POST /api/alerts/{id}/generate-message/ — Aly's endpoint).
        The frontend lets the owner edit the draft before hitting send;
        if the owner edited it, they must PATCH alert.message first,
        or pass an optional "message" override in this request body.

        On success:
            - Creates a Notification row (type=retention_alert, channel=email)
            - Marks alert.is_sent = True
            - Returns the created Notification
        """
        from ai.agent.models import Alert
        print("BODY:", request.body)
        print("DATA:", request.data)
        print("CONTENT TYPE:", request.content_type)

        alert_id = request.data.get("alert_id") or request.data.get("alertId") or request.data.get("id")
        if not alert_id:
            return Response(
                {"detail": "alert_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optional: frontend can pass an edited message override
        message_override = request.data.get("message")

        try:
            alert = Alert.objects.select_related(
                "enrollment__student_id",
                "enrollment__class_id__academy",
            ).get(
                id=alert_id,
                enrollment__class_id__academy_id=request.user.academy_id,
            )
        except Alert.DoesNotExist:
            return Response(
                {"detail": "Alert not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Use message override if provided, otherwise use the stored draft
        message = message_override or alert.message
        if not message:
            return Response(
                {
                    "detail": (
                        "No message to send. "
                        "Generate a message first via POST /api/alerts/{id}/generate-message/"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = alert.enrollment.student_id
        # Always prefer parent_email; fall back to the student's own email
        recipient = getattr(student, "parent_email", None) or student.user.email

        result = send_email(
            to_email=recipient,
            subject=f"AcademiQ — Important notice about {student.user.full_name}",
            message=message,
        )

        now = timezone.now()
        notification = Notification.objects.create(
            student=student,
            enrollment=alert.enrollment,
            alert=alert,
            channel="email",
            notification_type="retention_alert",
            message=message,
            status=result["status"],
            sent_at=now if result["status"] == "sent" else None,
        )

        # Mark alert as sent regardless of email success/failure —
        # the attempt was made; owner can resend if needed.
        alert.is_sent = True
        alert.save(update_fields=["is_sent"])

        return Response(
            {
                "success": result["status"] == "sent",
                "notification_id": str(notification.id),
                "status": result["status"],
                "sent_to": recipient,
                "notification": NotificationSerializer(notification).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="send-reminders")
    def send_reminders(self, request):
        """
        Manually trigger payment reminders for all overdue payments
        in the owner's academy.

        POST /api/notifications/send-reminders/
        """
        from .reminder_tasks import send_overdue_reminders

        academy_id = str(request.user.academy.id)
        results = send_overdue_reminders(academy_id)
        return Response(
            {
                "message": "Payment reminders processed.",
                "results": results,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        GET /api/notifications/stats/
        Returns delivery stats for the owner's academy.
        """
        today = timezone.now().date()
        week_start = today - timedelta(days=7)

        academy_qs = Notification.objects.filter(
            student__academy=request.user.academy
        )

        sent_today = academy_qs.filter(
            sent_at__date=today,
            status="sent",
        ).count()

        sent_this_week = academy_qs.filter(
            sent_at__date__gte=week_start,
            status="sent",
        ).count()

        failed_this_week = academy_qs.filter(
            sent_at__date__gte=week_start,
            status="failed",
        ).count()

        total_this_week = sent_this_week + failed_this_week
        delivery_rate = (
            round(sent_this_week / total_this_week * 100, 1)
            if total_this_week > 0
            else 0
        )

        return Response(
            {
                "sent_today": sent_today,
                "sent_this_week": sent_this_week,
                "failed_this_week": failed_this_week,
                "delivery_rate_pct": delivery_rate,
            }
        )