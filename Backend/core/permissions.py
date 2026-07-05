from rest_framework.permissions import BasePermission
from .models import User

class ActiveSubscriptionRequired(BasePermission):
    message = "Subscription expired."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return bool(request.user.academy) and request.user.academy.has_active_subscription()

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Roles.OWNER
            )

class IsOwnerOrAdminOrSelf(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # owners and admins can access any student profile
        if request.user.role in (User.Roles.OWNER, User.Roles.ADMIN):
            return True
        # students can only access their own profile
        if request.user.role == User.Roles.STUDENT:
            pk = view.kwargs.get("pk")
            return str(request.user.pk) == str(pk)
        return False