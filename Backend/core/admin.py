from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Academy

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("full_name",)

    list_display = ("full_name", "email", "role",
        "phone", "is_staff", "is_active",
    )

    search_fields = ("email", "full_name", "phone",)

    fieldsets = (
        (None, {
            "fields": ( "email", "password",)
        }),
        ("Personal Info", {
            "fields": ("full_name", "phone", "academy", "role",)
        }),
        ("Permissions", {
            "fields": ( "is_active", "is_staff", "is_superuser",
                "groups", "user_permissions",
            )
        }),
        ("Dates", {
            "fields": ("last_login", "created_at",)
        }),
    )

    readonly_fields = ("created_at", "last_login",)

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("full_name", "email", "phone", "academy","role", "parent_email",
                        "educational_level", "status", "password1", "password2",
            ),
        }),
    )

@admin.register(Academy)
class AcademyAdmin(admin.ModelAdmin):
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("name", "email", "phone", "address",
                "subscription_end", "setup_complete",
            ),
        }),
    )