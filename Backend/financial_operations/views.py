from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Teachers, Enrollment, Payment
from .serializers import TeachersSerializer, EnrollmentSerializer, PaymentSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
# Create your views here.

class TeachersViewSet(viewsets.ModelViewSet):
    serializer_class = TeachersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Teachers.objects.filter(academy_id=self.request.user.academy_id).select_related('user_id')
    
    def perform_destroy(self, instance):
        user = instance.user_id
        user.is_active = False
        user.save()

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Enrollment.objects.filter(
            class_id__academy_id=self.request.user.academy_id
        )
        student_id = self.request.query_params.get('student_id')
        class_id = self.request.query_params.get('class_id')
        status = self.request.query_params.get('status')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(class_id=class_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        student_id = self.request.data.get('student_id')
        class_id = self.request.data.get('class_id')

        if Enrollment.objects.filter(student_id=student_id, class_id=class_id).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {'detail': 'Student is already enrolled in this class.'}
            )
        serializer.save()

    def perform_destroy(self, instance):
        instance.status = 'dropped'
        instance.save()

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Payment.objects.filter(
            enrollment_id__class_id__academy_id=self.request.user.academy_id
        )
        student_id = self.request.query_params.get('student_id')
        month = self.request.query_params.get('month')
        enrollment_id = self.request.query_params.get('enrollment_id')
        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        if student_id:
            queryset = queryset.filter(
                enrollment_id__student_id=student_id
            )
        if month:
            year, mon = month.split('-')
            queryset = queryset.filter(
                paid_on__year=year,
                paid_on__month=mon
            )    
        return queryset
    

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        academy = request.user.academy

        month = request.query_params.get('month')
        if month:
            year, mon = month.split('-')
            year, mon = int(year), int(mon)
        else:
            today = timezone.now()
            year, mon = today.year, today.month

        active_enrollments = Enrollment.objects.filter(
            class_id__academy_id=academy,
            status='active'
        )

        revenue_expected = active_enrollments.aggregate(
            total=Sum('fee_amount')
        )['total'] or 0

        revenue_collected = Payment.objects.filter(
            enrollment_id__class_id__academy_id=academy,
            paid_on__year=year,
            paid_on__month=mon
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        if revenue_expected > 0:
            collection_rate = round(
                (float(revenue_collected) / float(revenue_expected)) * 100, 1
            )
        else:
            collection_rate = 0.0

        paid_enrollment_ids = Payment.objects.filter(
            enrollment_id__class_id__academy_id=academy,
            paid_on__year=year,
            paid_on__month=mon
        ).values_list('enrollment_id', flat=True)

        overdue_enrollments = active_enrollments.exclude(
            id__in=paid_enrollment_ids
        )
        overdue_count = overdue_enrollments.count()
        overdue_total = overdue_enrollments.aggregate(
            total=Sum('fee_amount')
        )['total'] or 0

        return Response({
            'month': f'{year}-{str(mon).zfill(2)}',
            'revenue_expected': str(revenue_expected),
            'revenue_collected': str(revenue_collected),
            'collection_rate_pct': collection_rate,
            'overdue_count': overdue_count,
            'overdue_total': str(overdue_total),
        })