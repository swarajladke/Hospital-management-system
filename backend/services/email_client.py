"""
Email Client Service.
HTTP client for the serverless email Lambda function.
"""

import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_email(action, recipient, data=None):
    """
    Send an email via the serverless Lambda function.
    
    Args:
        action: Email action type (SIGNUP_WELCOME, BOOKING_CONFIRMATION)
        recipient: Email address to send to
        data: Additional data for the email template
    
    Returns:
        bool: True if email was sent successfully
    
    Raises:
        Exception: If the email service is unavailable or returns an error
    """
    email_service_url = getattr(settings, 'EMAIL_SERVICE_URL', None)
    
    if not email_service_url:
        logger.warning("EMAIL_SERVICE_URL not configured, skipping email")
        return False
    
    payload = {
        'action': action,
        'recipient': recipient,
        'data': data or {}
    }
    
    try:
        response = requests.post(
            email_service_url,
            json=payload,
            timeout=10  # 10 second timeout
        )
        
        if response.status_code == 200:
            logger.info(f"Email sent successfully: {action} to {recipient}")
            return True
        else:
            logger.error(
                f"Email service returned error: {response.status_code} - {response.text}"
            )
            return False
            
    except requests.exceptions.Timeout:
        logger.error(f"Email service timeout for action {action}")
        raise
        
    except requests.exceptions.ConnectionError:
        logger.warning(
            f"Could not connect to email service at {email_service_url}. "
            "Is serverless-offline running?"
        )
        # Don't raise in development - email service might not be running
        return False
        
    except Exception as e:
        logger.error(f"Email service error: {e}")
        raise


def send_welcome_email(user):
    """
    Send a welcome email to a newly registered user.
    
    Args:
        user: Django User object
    """
    return send_email(
        action='SIGNUP_WELCOME',
        recipient=user.email,
        data={
            'name': user.get_full_name() or user.username,
            'role': user.profile.role if hasattr(user, 'profile') else 'USER'
        }
    )


def send_booking_confirmation_email(booking):
    """
    Send a booking confirmation email to the patient.
    
    Args:
        booking: Booking model instance
    """
    return send_email(
        action='BOOKING_CONFIRMATION',
        recipient=booking.patient.email,
        data={
            'patient_name': booking.patient.get_full_name() or booking.patient.username,
            'doctor': booking.doctor.get_full_name() or booking.doctor.username,
            'specialization': booking.doctor.profile.specialization,
            'date': str(booking.slot.date),
            'time': str(booking.slot.start_time),
            'notes': booking.notes
        }
    )
