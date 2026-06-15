import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer
from .reminder_tasks import send_payment_reminder, send_overdue_reminders

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        queryset = Notification.objects.filter(
            student__academy=self.request.user.academy
        )
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)

        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        return queryset

    @action(detail=False, methods=['post'], url_path='send-reminders')
    def send_reminders(self, request):
        """
        Manually trigger payment reminders for the academy.
        POST /api/notifications/send-reminders/
        """
        academy_id = str(request.user.academy.id)
        results = send_overdue_reminders(academy_id)

        return Response({
            'message': 'Payment reminders processed',
            'results': results,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='resend')
    def resend(self, request, pk=None):
        """
        Resend a failed notification.
        POST /api/notifications/{id}/resend/
        """
        notification = self.get_object()

        if notification.status == 'sent':
            return Response(
                {'detail': 'Notification already sent.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = send_payment_reminder(
            str(notification.enrollment.payments.first().id)
        )

        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Notification statistics.
        GET /api/notifications/stats/
        """
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        week_start = today - timedelta(days=7)

        academy_notifications = Notification.objects.filter(
            student__academy=request.user.academy
        )

        sent_today = academy_notifications.filter(
            sent_at__date=today,
            status='sent'
        ).count()

        sent_this_week = academy_notifications.filter(
            sent_at__date__gte=week_start,
            status='sent'
        ).count()

        failed_this_week = academy_notifications.filter(
            sent_at__date__gte=week_start,
            status='failed'
        ).count()

        total_this_week = sent_this_week + failed_this_week
        delivery_rate = round(
            (sent_this_week / total_this_week * 100), 1
        ) if total_this_week > 0 else 0

        return Response({
            'sent_today': sent_today,
            'sent_this_week': sent_this_week,
            'failed_this_week': failed_this_week,
            'delivery_rate_pct': delivery_rate,
        })