"""
Views for user authentication and profile management.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
import logging

from .serializers import (
    SignupSerializer, 
    LoginSerializer, 
    UserSerializer,
    DoctorListSerializer
)
from .permissions import IsPatient
from services.email_client import send_email

logger = logging.getLogger(__name__)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """Get CSRF token for session-based authentication."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'csrfToken': get_token(request)
        })


class SignupView(APIView):
    """Handle user registration."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Send welcome email via Lambda
            try:
                send_email(
                    action='SIGNUP_WELCOME',
                    recipient=user.email,
                    data={
                        'name': user.get_full_name() or user.username,
                        'role': user.profile.role
                    }
                )
            except Exception as e:
                # Don't fail signup if email fails
                logger.error(f"Failed to send welcome email: {e}")
            
            # Auto-login the user to establish session
            login(request, user)
            logger.info(f"New user registered and logged in: {user.username} as {user.profile.role}")
            
            return Response({
                'message': 'Registration successful',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Handle user login with session authentication."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            logger.warning(f"Failed login attempt for username: {username}")
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not hasattr(user, 'profile'):
            logger.error(f"User {username} has no profile")
            return Response({
                'error': 'Account configuration error. Please contact support.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        login(request, user)
        logger.info(f"User logged in: {user.username}")
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    """Handle user logout."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        username = request.user.username
        logout(request)
        logger.info(f"User logged out: {username}")
        
        return Response({
            'message': 'Logout successful'
        })


class CurrentUserView(APIView):
    """Get current authenticated user's information."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def patch(self, request):
        """Update current user's profile."""
        user = request.user
        
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()
        
        # Update profile fields
        profile = user.profile
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        if 'specialization' in request.data and profile.is_doctor:
            profile.specialization = request.data['specialization']
        profile.save()
        
        return Response(UserSerializer(user).data)


class DoctorListView(APIView):
    """List all doctors (for patients to browse)."""
    
    permission_classes = [IsAuthenticated, IsPatient]
    
    def get(self, request):
        doctors = User.objects.filter(
            profile__role='DOCTOR'
        ).select_related('profile').order_by('first_name', 'last_name')
        
        serializer = DoctorListSerializer(doctors, many=True)
        return Response(serializer.data)
