# backend/accounts/permissions.py

from rest_framework.permissions import BasePermission

class IsAdministrator(BasePermission):
    """
    Allows access only to users in the 'Administrators' group.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.groups.filter(name="Administrators").exists()


from rest_framework.permissions import BasePermission

class IsAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name__in=['Administrators', 'Editors']).exists()
        )
