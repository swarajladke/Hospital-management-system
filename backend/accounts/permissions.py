"""
Role-based permission classes for HMS.
These permissions ensure doctors and patients can only access their respective endpoints.
"""

from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)


class IsDoctor(BasePermission):
    """
    Permission class that only allows doctors to access the view.
    """
    message = "Only doctors can access this resource."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            logger.warning(f"User {request.user.username} has no profile")
            return False
        
        return request.user.profile.role == 'DOCTOR'


class IsPatient(BasePermission):
    """
    Permission class that only allows patients to access the view.
    """
    message = "Only patients can access this resource."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            logger.warning(f"User {request.user.username} has no profile")
            return False
        
        return request.user.profile.role == 'PATIENT'


class IsDoctorOrReadOnly(BasePermission):
    """
    Permission class that allows doctors full access,
    but only read access to patients.
    """
    message = "Only doctors can modify this resource."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        # Allow read-only for patients
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        
        # Write access only for doctors
        return request.user.profile.role == 'DOCTOR'
