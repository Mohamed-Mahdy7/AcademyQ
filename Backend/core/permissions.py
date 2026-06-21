from rest_framework.permissions import BasePermission
from .models import User

class ActiveSubscriptionRequired(BasePermission):
    message = "Subscription expired."

    def has_permission(self, request, view):
        return bool(request.user.academy) and request.user.academy.has_active_subscription()


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Roles.OWNER
        )