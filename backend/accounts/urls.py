"""
URL patterns for accounts app.
"""

from django.urls import path
from .views import (
    CSRFTokenView,
    SignupView,
    LoginView,
    LogoutView,
    CurrentUserView,
    DoctorListView,
)

urlpatterns = [
    # CSRF token for session auth
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    
    # Authentication
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # User info
    path('me/', CurrentUserView.as_view(), name='current_user'),
    
    # Doctor listing (for patients)
    path('doctors/', DoctorListView.as_view(), name='doctor_list'),
]
