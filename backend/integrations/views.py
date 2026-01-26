"""
Views for Google Calendar OAuth integration.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect
from django.conf import settings
import logging
import secrets

from .google_calendar import (
    get_authorization_url,
    exchange_code_for_tokens,
)

logger = logging.getLogger(__name__)


class GoogleOAuthURLView(APIView):
    """Get Google OAuth authorization URL."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if Google OAuth is configured
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {'error': 'Google Calendar integration is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state in session
        request.session['google_oauth_state'] = state
        
        try:
            authorization_url, _ = get_authorization_url(state=state)
            
            return Response({
                'authorization_url': authorization_url,
                'message': 'Redirect user to this URL to connect Google Calendar'
            })
        except Exception as e:
            logger.error(f"Failed to generate OAuth URL: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleOAuthCallbackView(APIView):
    """Handle Google OAuth callback."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get parameters from callback
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        
        # Frontend URL to redirect to after OAuth
        frontend_url = 'http://localhost:5178'
        
        if error:
            logger.warning(f"OAuth error: {error}")
            return redirect(f"{frontend_url}/settings?error=oauth_denied")
        
        if not code:
            return redirect(f"{frontend_url}/settings?error=no_code")
        
        # Verify state for CSRF protection
        stored_state = request.session.get('google_oauth_state')
        if not stored_state or stored_state != state:
            logger.warning("OAuth state mismatch - possible CSRF attack")
            return redirect(f"{frontend_url}/settings?error=invalid_state")
        
        try:
            # Exchange code for tokens
            tokens = exchange_code_for_tokens(code)
            
            # Store refresh token in user profile
            profile = request.user.profile
            profile.google_refresh_token = tokens.get('refresh_token')
            profile.save()
            
            logger.info(f"Google Calendar connected for user {request.user.username}")
            
            # Clear state from session
            del request.session['google_oauth_state']
            
            return redirect(f"{frontend_url}/settings?success=calendar_connected")
            
        except Exception as e:
            logger.error(f"OAuth callback failed: {e}")
            return redirect(f"{frontend_url}/settings?error=token_exchange_failed")


class GoogleCalendarStatusView(APIView):
    """Check if Google Calendar is connected for current user."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        has_calendar = request.user.profile.has_google_calendar
        
        return Response({
            'connected': has_calendar,
            'message': 'Google Calendar is connected' if has_calendar else 'Google Calendar not connected'
        })


class GoogleCalendarDisconnectView(APIView):
    """Disconnect Google Calendar for current user."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        profile = request.user.profile
        
        if not profile.google_refresh_token:
            return Response(
                {'error': 'Google Calendar is not connected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clear the refresh token
        profile.google_refresh_token = None
        profile.save()
        
        logger.info(f"Google Calendar disconnected for user {request.user.username}")
        
        return Response({
            'message': 'Google Calendar disconnected successfully'
        })
