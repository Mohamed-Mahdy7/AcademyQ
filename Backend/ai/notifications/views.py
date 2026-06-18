from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer, SendNotificationSerializer
from ai.agent.models import Alert


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(academy=self.request.user.academy)

        channel = self.request.query_params.get("channel")
        if channel:
            qs = qs.filter(channel=channel)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    @action(detail=False, methods=["post"], url_path="send")
    def send_notification(self, request):
        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        alert = None
        if data.get("alert_id"):
            try:
                alert = Alert.objects.get(
                    id=data["alert_id"], academy=request.user.academy
                )
            except Alert.DoesNotExist:
                return Response(
                    {"detail": "Alert not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        notification = Notification.objects.create(
            academy=request.user.academy,
            alert=alert,
            recipient_name=data["recipient_name"],
            recipient_email=data["recipient_email"],
            channel="email",
            message=data["message"],
            status="pending",
        )

        try:
            send_mail(
                subject=f"AcademiQ — Message regarding {data['recipient_name']}",
                message=data["message"],
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[data["recipient_email"]],
                fail_silently=False,
            )
            notification.status = "sent"
            notification.sent_at = timezone.now()
        except Exception:
            notification.status = "failed"

        notification.save()
        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timezone.timedelta(days=now.weekday())

        qs = Notification.objects.filter(academy=request.user.academy)

        sent_today = qs.filter(status="sent", sent_at__gte=today_start).count()
        this_week = qs.filter(status="sent", sent_at__gte=week_start).count()
        failed = qs.filter(status="failed").count()

        total_attempted = qs.exclude(status="pending").count()
        total_sent = qs.filter(status="sent").count()
        delivery_rate = round(
            (total_sent / total_attempted * 100) if total_attempted else 0
        )

        return Response(
            {
                "sent_today": sent_today,
                "this_week": this_week,
                "failed": failed,
                "delivery_rate": delivery_rate,
            }
        )