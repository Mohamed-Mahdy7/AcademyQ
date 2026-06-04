from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)

    list_display = ("email", "full_name", "role",
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
            "fields": ("email", "full_name", "phone", "academy",
                "role", "password1", "password2",
            ),
        }),
    )