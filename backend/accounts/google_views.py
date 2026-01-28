from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.shortcuts import redirect
import logging
from services.google_calendar import GoogleCalendarService

logger = logging.getLogger(__name__)

class GoogleLoginView(APIView):
    """Initiate Google OAuth flow."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            flow = GoogleCalendarService.get_flow()
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'  # Force consent to ensure refresh token is returned
            )
            )
            return redirect(authorization_url)
        except Exception as e:
            logger.error(f"Failed to generate Google Login URL: {e}")
            return Response({'error': str(e)}, status=500)

class GoogleCallbackView(APIView):
    """Handle Google OAuth callback."""
    permission_classes = [IsAuthenticated]  # Require auth to link to user
    
    def get(self, request):
        code = request.query_params.get('code')
        error = request.query_params.get('error')
        
        frontend_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:5178'
        
        if error:
            logger.error(f"Google OAuth error: {error}")
            return redirect(f'{frontend_url}/profile?error=oauth_failed')
            
        if not code:
            return redirect(f'{frontend_url}/profile?error=no_code')
            
        try:
            # Exchange code for token
            flow = GoogleCalendarService.get_flow()
            flow.fetch_token(code=code)
            
            credentials = flow.credentials
            
            user_profile = request.user.profile
            
            # CRITICAL: We need the refresh token to work offline. 
            # If prompt='consent' was used, we should get it.
            if credentials.refresh_token:
                user_profile.google_refresh_token = credentials.refresh_token
                user_profile.save(update_fields=['google_refresh_token'])
                logger.info(f"Google Calendar connected for {request.user.username} (Refresh Token saved)")
                return redirect(f'{frontend_url}/profile?success=google_connected')
            else:
                logger.warning(f"No refresh token returned for {request.user.username}. Possibly already granted without prompts.")
                # If we don't get a refresh token, we might already have one or Google didn't send it.
                # But we should only update if we got one.
                if not user_profile.google_refresh_token:
                     return redirect(f'{frontend_url}/profile?error=no_refresh_token')
                return redirect(f'{frontend_url}/profile?success=google_reconnected')
                 
        except Exception as e:
            logger.error(f"Error in Google Callback: {e}")
            return redirect(f'{frontend_url}/profile?error=exception')
