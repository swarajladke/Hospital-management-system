"""
URL patterns for integrations app.
"""

from django.urls import path
from .views import (
    GoogleOAuthURLView,
    GoogleOAuthCallbackView,
    GoogleCalendarStatusView,
    GoogleCalendarDisconnectView,
)

urlpatterns = [
    # Google Calendar OAuth
    path('google/auth-url/', GoogleOAuthURLView.as_view(), name='google_oauth_url'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),
    path('google/status/', GoogleCalendarStatusView.as_view(), name='google_calendar_status'),
    path('google/disconnect/', GoogleCalendarDisconnectView.as_view(), name='google_calendar_disconnect'),
]
