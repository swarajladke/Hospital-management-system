"""
Admin configuration for scheduling app.
"""

from django.contrib import admin
from .models import AvailabilitySlot, Booking


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'date', 'start_time', 'end_time', 'is_booked', 'created_at']
    list_filter = ['is_booked', 'date', 'doctor']
    search_fields = ['doctor__username', 'doctor__first_name', 'doctor__last_name']
    date_hierarchy = 'date'
    readonly_fields = ['created_at']
    
    fieldsets = (
        (None, {
            'fields': ('doctor', 'date', 'start_time', 'end_time')
        }),
        ('Status', {
            'fields': ('is_booked',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'doctor', 'appointment_date', 'appointment_time', 'created_at']
    list_filter = ['created_at', 'doctor', 'slot__date']
    search_fields = [
        'patient__username', 'patient__first_name', 'patient__last_name',
        'doctor__username', 'doctor__first_name', 'doctor__last_name'
    ]
    readonly_fields = ['created_at', 'doctor_calendar_event_id', 'patient_calendar_event_id']
    raw_id_fields = ['patient', 'doctor', 'slot']
    
    fieldsets = (
        (None, {
            'fields': ('patient', 'doctor', 'slot')
        }),
        ('Details', {
            'fields': ('notes',)
        }),
        ('Calendar Sync', {
            'fields': ('doctor_calendar_event_id', 'patient_calendar_event_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
