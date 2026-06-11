from django.contrib import admin
from .models import ClassSession, Attendance


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ['session_num', 'class_obj', 'session_date', 'notes']
    list_filter = ['class_obj', 'session_date']
    search_fields = ['class_obj__name', 'notes']
    ordering = ['class_obj', 'session_num']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'session', 'present', 'recorded_at']
    list_filter = ['present', 'session__session_date']
    search_fields = ['enrollment__student_id__user__full_name']
    ordering = ['session', 'enrollment']