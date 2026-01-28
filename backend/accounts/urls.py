"""
URL patterns for accounts app.
"""

from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    CurrentUserView,
    DoctorListView,
    CSRFTokenView
)
from .google_views import GoogleLoginView, GoogleCallbackView

urlpatterns = [
    path('csrf/', CSRFTokenView.as_view(), name='csrf'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),

    # Google Calendar Integration
    path('google/login/', GoogleLoginView.as_view(), name='google-login'),
    path('google/callback/', GoogleCallbackView.as_view(), name='google-callback'),
]
