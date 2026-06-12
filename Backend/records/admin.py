from django.contrib import admin
from .models import ClassSession, Attendance


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ['session_date', 'session_time', 'notes']
    list_filter = ['session_date']
    search_fields = ['notes']
    ordering = ['session_date', 'session_time']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'session', 'present', 'recorded_at']
    list_filter = ['present', 'session__session_date']
    search_fields = ['enrollment__student_id__full_name']
    ordering = ['session', 'enrollment']