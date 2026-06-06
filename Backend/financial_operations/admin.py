from django.contrib import admin
from .models import Teachers, Enrollment, Payment
# Register your models here.

@admin.register(Teachers)
class TeachersAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'academy_id', 'rate_per_session', 'session_duration']
    search_fields = ['user_id__full_name', 'user_id__email']
    list_filter = ['academy_id']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'student_id', 'class_id', 'fee_amount', 'status', 'start_date']
    search_fields = ['student_id__user__full_name']
    list_filter = ['status']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'enrollment_id', 'amount', 'paid_on']
    search_fields = ['enrollment_id__id']
    list_filter = ['paid_on']