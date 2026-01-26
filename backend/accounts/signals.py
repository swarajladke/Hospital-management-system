"""
Django signals for the accounts app.
Handles automatic profile creation on user signup.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


# Note: We don't auto-create profiles here because the role must be specified
# during signup. Profile creation is handled in the signup view.

@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """Log when a new user is created."""
    if created:
        logger.info(f"New user created: {instance.username}")
