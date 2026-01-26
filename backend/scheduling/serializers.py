"""
Serializers for scheduling app.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import AvailabilitySlot, Booking
from datetime import date, datetime


class SlotSerializer(serializers.ModelSerializer):
    """Serializer for AvailabilitySlot model."""
    
    doctor_name = serializers.SerializerMethodField()
    duration_minutes = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    
    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'doctor', 'doctor_name', 'date', 'start_time', 
            'end_time', 'is_booked', 'duration_minutes', 'is_past', 'created_at'
        ]
        read_only_fields = ['id', 'doctor', 'is_booked', 'created_at']
    
    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class SlotCreateSerializer(serializers.Serializer):
    """Serializer for creating availability slots."""
    
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    
    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Cannot create slots in the past.")
        return value
    
    def validate(self, attrs):
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        # Check minimum duration (15 minutes)
        start = datetime.combine(attrs['date'], attrs['start_time'])
        end = datetime.combine(attrs['date'], attrs['end_time'])
        duration = (end - start).total_seconds() / 60
        
        if duration < 15:
            raise serializers.ValidationError({
                'end_time': 'Slot must be at least 15 minutes long.'
            })
        
        if duration > 240:  # 4 hours max
            raise serializers.ValidationError({
                'end_time': 'Slot cannot exceed 4 hours.'
            })
        
        return attrs


class BulkSlotCreateSerializer(serializers.Serializer):
    """Serializer for creating multiple slots at once."""
    
    date = serializers.DateField()
    slots = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=20
    )
    
    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Cannot create slots in the past.")
        return value
    
    def validate_slots(self, value):
        for i, slot in enumerate(value):
            if 'start_time' not in slot or 'end_time' not in slot:
                raise serializers.ValidationError(
                    f"Slot {i+1} must have start_time and end_time."
                )
        return value


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking model."""
    
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    slot_details = SlotSerializer(source='slot', read_only=True)
    appointment_date = serializers.ReadOnlyField()
    appointment_time = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'slot', 'slot_details', 'notes', 'appointment_date', 
            'appointment_time', 'is_upcoming', 'created_at'
        ]
        read_only_fields = ['id', 'patient', 'doctor', 'created_at']
    
    def get_patient_name(self, obj):
        return obj.patient.get_full_name() or obj.patient.username
    
    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class BookingCreateSerializer(serializers.Serializer):
    """Serializer for creating a booking."""
    
    slot_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_slot_id(self, value):
        try:
            slot = AvailabilitySlot.objects.get(id=value)
        except AvailabilitySlot.DoesNotExist:
            raise serializers.ValidationError("Slot not found.")
        
        if slot.is_booked:
            raise serializers.ValidationError("This slot is already booked.")
        
        if slot.is_past:
            raise serializers.ValidationError("Cannot book a slot in the past.")
        
        return value


class DoctorSlotsSerializer(serializers.Serializer):
    """Serializer for getting a doctor's available slots."""
    
    doctor_id = serializers.IntegerField()
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    
    def validate_doctor_id(self, value):
        try:
            doctor = User.objects.get(id=value, profile__role='DOCTOR')
        except User.DoesNotExist:
            raise serializers.ValidationError("Doctor not found.")
        return value
