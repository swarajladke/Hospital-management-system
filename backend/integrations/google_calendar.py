"""
Google Calendar Integration Service.
Handles OAuth2 flow and calendar event creation.
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Google Calendar API scopes
SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]


def get_oauth_flow(redirect_uri=None):
    """
    Create and return an OAuth2 flow for Google Calendar.
    """
    try:
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri or settings.GOOGLE_REDIRECT_URI
        )
        
        return flow
    except Exception as e:
        logger.error(f"Failed to create OAuth flow: {e}")
        raise


def get_authorization_url(state=None):
    """
    Generate the Google OAuth authorization URL.
    
    Args:
        state: Optional state parameter for CSRF protection
    
    Returns:
        tuple: (authorization_url, state)
    """
    flow = get_oauth_flow()
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',  # Request refresh token
        include_granted_scopes='true',
        prompt='consent',  # Force consent to get refresh token
        state=state
    )
    
    return authorization_url, state


def exchange_code_for_tokens(code):
    """
    Exchange authorization code for access and refresh tokens.
    
    Args:
        code: Authorization code from OAuth callback
    
    Returns:
        dict: Token information including refresh_token
    """
    flow = get_oauth_flow()
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }
    except Exception as e:
        logger.error(f"Failed to exchange code for tokens: {e}")
        raise


def get_credentials_from_refresh_token(refresh_token):
    """
    Create credentials object from a stored refresh token.
    
    Args:
        refresh_token: Stored refresh token
    
    Returns:
        Credentials: Google OAuth credentials
    """
    if not refresh_token:
        return None
    
    credentials = Credentials(
        token=None,  # Will be refreshed automatically
        refresh_token=refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES
    )
    
    return credentials


def create_calendar_event(user, summary, description, date, start_time, end_time):
    """
    Create a calendar event for a user.
    
    Args:
        user: Django User object with profile containing google_refresh_token
        summary: Event title
        description: Event description
        date: Event date (date object)
        start_time: Event start time (time object)
        end_time: Event end time (time object)
    
    Returns:
        str: Created event ID, or None if failed
    """
    if not hasattr(user, 'profile') or not user.profile.google_refresh_token:
        logger.warning(f"User {user.username} has no Google Calendar connected")
        return None
    
    credentials = get_credentials_from_refresh_token(user.profile.google_refresh_token)
    
    if not credentials:
        logger.error(f"Failed to create credentials for user {user.username}")
        return None
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Combine date and time
        start_datetime = datetime.combine(date, start_time)
        end_datetime = datetime.combine(date, end_time)
        
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 30},  # 30 minutes before
                ],
            },
        }
        
        created_event = service.events().insert(
            calendarId='primary',
            body=event
        ).execute()
        
        event_id = created_event.get('id')
        logger.info(f"Calendar event created: {event_id} for user {user.username}")
        
        return event_id
        
    except HttpError as e:
        logger.error(f"Google Calendar API error for user {user.username}: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to create calendar event: {e}")
        return None


def delete_calendar_event(user, event_id):
    """
    Delete a calendar event.
    
    Args:
        user: Django User object
        event_id: Google Calendar event ID
    
    Returns:
        bool: True if deleted successfully
    """
    if not user.profile.google_refresh_token:
        return False
    
    credentials = get_credentials_from_refresh_token(user.profile.google_refresh_token)
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        service.events().delete(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        logger.info(f"Calendar event deleted: {event_id}")
        return True
        
    except HttpError as e:
        logger.error(f"Failed to delete calendar event {event_id}: {e}")
        return False
