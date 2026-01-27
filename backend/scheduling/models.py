"""
Scheduling Models for HMS.
Contains AvailabilitySlot and Booking models with proper constraints.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date


class AvailabilitySlot(models.Model):
    """
    Represents a time slot when a doctor is available for appointments.
    
    Constraints:
        - Unique combination of doctor + date + start_time
        - End time must be after start time
        - Cannot create slots in the past
    """
    
    doctor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='availability_slots',
        limit_choices_to={'profile__role': 'DOCTOR'}
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'availability_slot'
        unique_together = ['doctor', 'date', 'start_time']
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['doctor', 'date', 'is_booked']),
            models.Index(fields=['date', 'is_booked']),
        ]
    
    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.date} {self.start_time}-{self.end_time}"
    
    def clean(self):
        """Validate slot data."""
        if self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        if self.date < date.today():
            raise ValidationError({
                'date': 'Cannot create slots in the past.'
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration_minutes(self):
        """Calculate slot duration in minutes."""
        from datetime import datetime, timedelta
        start = datetime.combine(self.date, self.start_time)
        end = datetime.combine(self.date, self.end_time)
        return int((end - start).total_seconds() / 60)
    
    @property
    def is_past(self):
        """Check if the slot is in the past."""
        from datetime import datetime
        slot_datetime = datetime.combine(self.date, self.start_time)
        return slot_datetime < datetime.now()


class Booking(models.Model):
    """
    Represents a confirmed appointment between a patient and doctor.
    
    The slot is linked via OneToOne to ensure no double-booking.
    """
    
    patient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='patient_bookings',
        limit_choices_to={'profile__role': 'PATIENT'}
    )
    doctor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='doctor_bookings',
        limit_choices_to={'profile__role': 'DOCTOR'}
    )
    slot = models.OneToOneField(
        AvailabilitySlot, 
        on_delete=models.CASCADE, 
        related_name='booking'
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional notes from the patient"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'booking'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'created_at']),
            models.Index(fields=['doctor', 'created_at']),
        ]
    
    def __str__(self):
        return f"Booking: {self.patient.get_full_name()} with Dr. {self.doctor.get_full_name()} on {self.slot.date}"
    
    @property
    def appointment_date(self):
        return self.slot.date
    
    @property
    def appointment_time(self):
        return self.slot.start_time
    
    @property
    def is_upcoming(self):
        """Check if the booking is in the future."""
        return not self.slot.is_past
