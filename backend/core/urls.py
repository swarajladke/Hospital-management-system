"""
URL Configuration for HMS Backend.
API versioning with /api/v1/ prefix for future compatibility.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/', include('scheduling.urls')),
    path('api/integrations/', include('integrations.urls')),
]
