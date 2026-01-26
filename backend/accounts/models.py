"""
User Profile Model for HMS.
Extends Django's built-in User model with role and OAuth token storage.
"""

from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """
    Extended user profile storing role and Google OAuth tokens.
    
    Roles:
        DOCTOR - Can create availability slots and view their bookings
        PATIENT - Can view doctors, available slots, and book appointments
    """
    
    ROLE_CHOICES = [
        ('DOCTOR', 'Doctor'),
        ('PATIENT', 'Patient'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES,
        db_index=True
    )
    google_refresh_token = models.TextField(
        blank=True, 
        null=True,
        help_text="Encrypted Google OAuth refresh token for calendar access"
    )
    phone = models.CharField(max_length=15, blank=True)
    specialization = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Doctor's specialization (only for doctors)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.username} ({self.role})"
    
    @property
    def is_doctor(self):
        return self.role == 'DOCTOR'
    
    @property
    def is_patient(self):
        return self.role == 'PATIENT'
    
    @property
    def has_google_calendar(self):
        return bool(self.google_refresh_token)
