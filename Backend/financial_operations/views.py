from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsOwner
from core.mixins import AcademyScopedMixin
from .models import Teachers, Enrollment, Payment
from .serializers import TeachersSerializer, EnrollmentSerializer, PaymentSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.utils import timezone
from datetime import timedelta
from structure.models import Class
from datetime import date, datetime
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError, NotFound
from core.models import Students

@extend_schema_view(
    list=extend_schema(tags=["Teacher"]),
    retrieve=extend_schema(tags=["Teacher"]),
    create=extend_schema(tags=["Teacher"]),
    update=extend_schema(tags=["Teacher"]),
    partial_update=extend_schema(tags=["Teacher"]),
    destroy=extend_schema(tags=["Teacher"]),
    
)
class TeachersViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = TeachersSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Teachers.objects.none()
        
        return Teachers.objects.filter(
            academy_id=self.request.user.academy_id,
            user_id__is_active=True,
        ).select_related('user_id')

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')

        existing = Teachers.objects.filter(user_id=user_id).first()
        if existing:
            existing.user_id.is_active = True
            existing.user_id.save(update_fields=['is_active'])
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        user = instance.user_id
        user.is_active = False
        user.save()

@extend_schema_view(
    list=extend_schema(tags=["Enrollment"]),
    retrieve=extend_schema(tags=["Enrollment"]),
    create=extend_schema(tags=["Enrollment"]),
    update=extend_schema(tags=["Enrollment"]),
    partial_update=extend_schema(tags=["Enrollment"]),
    destroy=extend_schema(tags=["Enrollment"]),
)
class EnrollmentViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Enrollment.objects.none()
        
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

@extend_schema_view(
    list=extend_schema(tags=["Payment"]),
    retrieve=extend_schema(tags=["Payment"]),
    create=extend_schema(tags=["Payment"]),
    update=extend_schema(tags=["Payment"]),
    partial_update=extend_schema(tags=["Payment"]),
    destroy=extend_schema(tags=["Payment"]),
    summary=extend_schema(tags=["Payment"]),
)
class PaymentViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Payment.objects.none()
        
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
                enrollment_id__start_date__year=year,
                enrollment_id__start_date__month=mon,
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

        from django.db.models import Q
        
        revenue_expected_qs = Payment.objects.filter(
            enrollment_id__class_id__academy_id=academy_id,
        ).exclude(status='deleted').filter(
            Q(status='completed', paid_on__year=year, paid_on__month=mon) |
            Q(~Q(status='completed'), due_date__year=year, due_date__month=mon)
        )

        revenue_expected = revenue_expected_qs.annotate(
            class_price=class_price_expr
        ).aggregate(total=Sum('class_price'))['total'] or 0

        revenue_collected = Payment.objects.filter(
            enrollment_id__class_id__academy_id=academy_id,
            paid_on__year=year,
            paid_on__month=mon,
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