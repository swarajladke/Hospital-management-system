"""
URL patterns for integrations app.
"""

from django.urls import path
from .views import (
    ICalFeedView,
)

urlpatterns = [
    # Generic ICal Feed
    path('calendar/feed/<uuid:token>/', ICalFeedView.as_view(), name='ical_feed'),
]
