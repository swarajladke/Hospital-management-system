"""
Serializers for user accounts and authentication.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    google_calendar_connected = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'specialization', 'ical_token', 'created_at', 'google_calendar_connected']
        read_only_fields = ['role', 'ical_token', 'created_at', 'google_calendar_connected']

    def get_google_calendar_connected(self, obj):
        return bool(obj.google_refresh_token)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with nested profile."""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile']
        read_only_fields = ['id', 'username']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class SignupSerializer(serializers.Serializer):
    """Serializer for user registration."""
    
    username = serializers.CharField(max_length=150, min_length=3)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=['DOCTOR', 'PATIENT'])
    
    # Optional fields
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    specialization = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        
        # Require specialization for doctors
        if attrs['role'] == 'DOCTOR' and not attrs.get('specialization'):
            raise serializers.ValidationError({
                'specialization': "Specialization is required for doctors."
            })
        
        return attrs
    
    def create(self, validated_data):
        # Extract profile fields
        role = validated_data.pop('role')
        phone = validated_data.pop('phone', '')
        specialization = validated_data.pop('specialization', '')
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            specialization=specialization
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class DoctorListSerializer(serializers.ModelSerializer):
    """Serializer for listing doctors (used by patients)."""
    
    full_name = serializers.SerializerMethodField()
    specialization = serializers.CharField(source='profile.specialization')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'specialization']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
