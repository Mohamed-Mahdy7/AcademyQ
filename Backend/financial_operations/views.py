from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Teachers, Enrollment, Payment
from .serializers import TeachersSerializer, EnrollmentSerializer, PaymentSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.utils import timezone
from datetime import timedelta
from structure.models import Class
from datetime import date, datetime
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError, NotFound
from core.models import Students

class TeachersViewSet(viewsets.ModelViewSet):
    serializer_class = TeachersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Teachers.objects.filter(
            academy_id=self.request.user.academy_id
        ).select_related('user_id')

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
            queryset = queryset.filter(student_id__user_id=student_id)
        if class_id:
            queryset = queryset.filter(class_id=class_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        class_id = self.request.data.get('class_id')
        start_date = self.request.data.get('start_date')

        try:
            enrollment = serializer.save()
        except IntegrityError:
            raise ValidationError(
                {'detail': 'Student is already enrolled in this class.'}
            )

        student = enrollment.student_id
        if student.status == Students.Status.PENDING:
            student.status = Students.Status.ACTIVE
            student.enrolled_at = timezone.now().date()
            student.save(update_fields=["status", "enrolled_at"])

        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            raise NotFound(
                detail=f'Class {class_id} not found.'
            )
        
        if class_obj.session_price and class_obj.session_count:
            amount = class_obj.session_count * class_obj.session_price
            if start_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                due = start + timedelta(days=3)
            else:
                due = date.today() + timedelta(days=3)

            Payment.objects.create(
                enrollment_id=enrollment,
                amount=amount,
                due_date=due,
                paid_on=None,
                notes="",
                status="pending",
            )

    def perform_destroy(self, instance):
        instance.status = 'dropped'
        instance.save()

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Payment.objects.filter(
            enrollment_id__class_id__academy_id=self.request.user.academy_id
        ).exclude(status='deleted') 

        student_id = self.request.query_params.get('student_id')
        month = self.request.query_params.get('month')
        enrollment_id = self.request.query_params.get('enrollment_id')
        status = self.request.query_params.get('status')

        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        if student_id:
            queryset = queryset.filter(enrollment_id__student_id=student_id)
        if month:
            year, mon = month.split('-')
            queryset = queryset.filter(
                due_date__year=year,
                due_date__month=mon
            )
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def perform_destroy(self, instance):
        instance.status = 'deleted'
        instance.save()

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        academy_id = request.user.academy_id

        month = request.query_params.get('month')
        if month:
            try:
                year, mon = month.split('-')
                year, mon = int(year), int(mon)
            except ValueError:
                raise ValidationError(
                    {'detail': 'Invalid month format. Use YYYY-MM.'}
                )
        else:
            today = timezone.now()
            year, mon = today.year, today.month

        class_price_expr = ExpressionWrapper(
            F('enrollment_id__class_id__session_count') * F('enrollment_id__class_id__session_price'),
            output_field=DecimalField(max_digits=10, decimal_places=2)
        )

        base_payments = Payment.objects.filter(
            enrollment_id__class_id__academy_id=academy_id,
            due_date__year=year,
            due_date__month=mon,
        ).exclude(status='deleted')

        revenue_expected = base_payments.annotate(
            class_price=class_price_expr
        ).aggregate(total=Sum('class_price'))['total'] or 0

        revenue_collected = base_payments.filter(
            status='completed'
        ).annotate(
            class_price=class_price_expr
        ).aggregate(total=Sum('class_price'))['total'] or 0

        if revenue_expected > 0:
            collection_rate = round(
                (float(revenue_collected) / float(revenue_expected)) * 100, 1
            )
        else:
            collection_rate = 0.0

        paid_enrollments = base_payments.filter(
            status='completed'
        ).values_list('enrollment_id', flat=True)

        overdue_enrollments = Enrollment.objects.filter(
            class_id__academy_id=academy_id,
            status='active',
            payments__status='pending',
            payments__due_date__year=year,
            payments__due_date__month=mon,
            payments__due_date__lt=date.today(), 
        ).distinct()

        overdue_count = overdue_enrollments.count()
        overdue_total = max(float(revenue_expected) - float(revenue_collected), 0)

        return Response({
            'month': f'{year}-{str(mon).zfill(2)}',
            'revenue_expected': str(revenue_expected),
            'revenue_collected': str(revenue_collected),
            'collection_rate_pct': collection_rate,
            'overdue_count': overdue_count,
            'overdue_total': str(overdue_total),
        })
