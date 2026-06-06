from django.contrib import admin
from .models import Subject, Class, TeacherClass

class TeacherClassInline(admin.TabularInline):
    model = TeacherClass
    extra = 0

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "academy", "session_count", "is_active")
    list_filter = ("academy", "is_active")
    search_fields = ("name", "academy__name")

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("name", "academy", "subject", "start_date", "end_date", "is_active")
    list_filter = ("academy", "subject", "is_active")
    search_fields = ("name",)
    inlines = (TeacherClassInline,)

@admin.register(TeacherClass)
class TeacherClassAdmin(admin.ModelAdmin):
    list_display = ("assigned_class", "teacher", "assigned_at")
    list_filter = ("assigned_at", "teacher")
    search_fields = ("assigned_class__name",)
