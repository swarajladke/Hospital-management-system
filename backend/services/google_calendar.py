import logging
from django.conf import settings
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    SCOPES = ['https://www.googleapis.com/auth/calendar.events']
    
    @staticmethod
    def get_flow(redirect_uri=None):
        """Create OAuth flow instance."""
        try:
            return Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=GoogleCalendarService.SCOPES,
                redirect_uri=redirect_uri or settings.GOOGLE_REDIRECT_URI
            )
        except Exception as e:
            logger.error(f"Failed to create Google OAuth flow: {e}")
            raise

    @staticmethod
    def get_credentials(user):
        """Get valid credentials for user."""
        if not hasattr(user, 'profile') or not user.profile.google_refresh_token:
            return None
            
        try:
            creds = Credentials(
                None,  # Access token (will be refreshed)
                refresh_token=user.profile.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=GoogleCalendarService.SCOPES
            )
            return creds
        except Exception as e:
            logger.error(f"Failed to create credentials from token: {e}")
            return None

    @staticmethod
    def create_event(booking):
        """Create a calendar event for a booking."""
        doctor = booking.doctor
        
        creds = GoogleCalendarService.get_credentials(doctor)
        if not creds:
            logger.info(f"Doctor {doctor.username} does not have Google Calendar connected.")
            return None
            
        service = build('calendar', 'v3', credentials=creds)
        
        event_data = {
            'summary': f"Appointment with {booking.patient.get_full_name() or booking.patient.username}",
            'description': f"Notes: {booking.notes}",
            'start': {
                'dateTime': f"{booking.slot.date}T{booking.slot.start_time}",
                'timeZone': 'UTC',  # Assuming UTC or server time, ideally should use timezone settings
            },
            'end': {
                'dateTime': f"{booking.slot.date}T{booking.slot.end_time}",
                'timeZone': 'UTC',
            },
            'attendees': [
                {'email': booking.patient.email},
            ],
            'reminders': {
                'useDefault': True,
            },
        }
        
        try:
            event = service.events().insert(calendarId='primary', body=event_data).execute()
            logger.info(f"Google Calendar event created: {event.get('id')}")
            
            # Save event ID to booking
            booking.google_event_id = event.get('id')
            booking.save(update_fields=['google_event_id'])
            
            return event.get('id')
            
        except HttpError as error:
            logger.error(f"An error occurred creating Google Calendar event: {error}")
            return None
            
    @staticmethod
    def delete_event(booking):
        """Delete a calendar event."""
        if not booking.google_event_id:
            return
            
        doctor = booking.doctor
        creds = GoogleCalendarService.get_credentials(doctor)
        if not creds:
            return
            
        service = build('calendar', 'v3', credentials=creds)
        
        try:
            service.events().delete(calendarId='primary', eventId=booking.google_event_id).execute()
            logger.info(f"Google Calendar event deleted: {booking.google_event_id}")
            
            booking.google_event_id = ''
            booking.save(update_fields=['google_event_id'])
            
        except HttpError as error:
            logger.error(f"An error occurred deleting Google Calendar event: {error}")
