from django.contrib import admin
from .models import Class, ClassSchedule, ClassSessionEnrollment, TeacherClass


class ClassScheduleInline(admin.TabularInline):
    model = ClassSchedule
    extra = 1
    fields = ["day_of_week", "start_time", "end_time"]


class TeacherClassInline(admin.TabularInline):
    model = TeacherClass
    extra = 1
    fields = ["teacher", "assigned_at"]


class ClassSessionEnrollmentInline(admin.TabularInline):
    model = ClassSessionEnrollment
    extra = 0
    fields = ["session", "session_num"]
    readonly_fields = ["session_num"]


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "academy",
        "subject",
        "start_date",
        "end_date",
        "session_count",
        "is_active",
    ]
    list_filter = ["is_active", "academy", "subject"]
    search_fields = ["name"]
    inlines = [ClassScheduleInline, TeacherClassInline, ClassSessionEnrollmentInline]


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = [
        "class_obj",
        "get_day_of_week_display",
        "start_time",
        "end_time",
    ]
    list_filter = ["day_of_week", "class_obj"]


@admin.register(ClassSessionEnrollment)
class ClassSessionEnrollmentAdmin(admin.ModelAdmin):
    list_display = [
        "class_obj",
        "session",
        "session_num",
    ]
    list_filter = ["class_obj"]
    ordering = ["class_obj", "session_num"]


@admin.register(TeacherClass)
class TeacherClassAdmin(admin.ModelAdmin):
    list_display = [
        "teacher",
        "assigned_class",
        "assigned_at",
    ]
    list_filter = ["assigned_class"]
