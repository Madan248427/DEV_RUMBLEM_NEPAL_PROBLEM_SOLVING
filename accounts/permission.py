from rest_framework.permissions import BasePermission, SAFE_METHODS
class IsUser(BasePermission):
    def has_permission(self,request,view):
        return request.user.is_authenticated and request.user.Role == 'citizen'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.Role == 'admin'


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.Role == 'organizer'


class IsAdminOrEmployee(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.Role in ['admin', 'organizer']
        )


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
    
    