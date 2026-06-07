from django.contrib import admin

 
from .models import Grade
@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("enrollment", "session", "subject_name", "score", "max_score", "assigned_at"),
        }),
    )