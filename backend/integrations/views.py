"""
Views for Google Calendar OAuth integration.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect, get_object_or_404
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
import logging
import secrets

logger = logging.getLogger(__name__)


class ICalFeedView(APIView):
    """Serve calendar feed in ICS format."""
    
    permission_classes = []  # Publicly accessible via unique token
    
    def get(self, request, token):
        from accounts.models import UserProfile
        from scheduling.models import Booking, AvailabilitySlot
        
        # Get profile by token
        profile = get_object_or_404(UserProfile, ical_token=token)
        user = profile.user
        base_url = "http://localhost:5178" # Frontend URL
        
        # 1. Get confirmed bookings
        if profile.is_doctor:
            bookings = Booking.objects.filter(doctor=user).select_related('slot', 'patient')
        else:
            bookings = Booking.objects.filter(patient=user).select_related('slot', 'doctor')
            
        # 2. For patients, also show available slots they can book
        available_slots = []
        if not profile.is_doctor:
            # Show next 7 days of available slots
            now = timezone.now()
            next_week = now + timezone.timedelta(days=7)
            available_slots = AvailabilitySlot.objects.filter(
                is_booked=False,
                date__range=[now.date(), next_week.date()]
            ).select_related('doctor')

        # Build ICS content
        def format_dt(dt, tm):
            combined = timezone.datetime.combine(dt, tm)
            return combined.strftime('%Y%m%dT%H%M%SZ')

        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//HMS//Hospital Management System//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:HMS Appointments - {user.username}",
            "X-WR-TIMEZONE:UTC",
        ]
        
        # Add confirmed bookings
        for b in bookings:
            slot = b.slot
            start = format_dt(slot.date, slot.start_time)
            end = format_dt(slot.date, slot.end_time)
            
            summary = f"Confirmed: Dr. {b.doctor.get_full_name() or b.doctor.username}" if not profile.is_doctor else f"Patient: {b.patient.get_full_name() or b.patient.username}"
            
            description = b.notes if b.notes else "HMS Appointment"
            action_url = f"{base_url}/patient/bookings" if not profile.is_doctor else f"{base_url}/doctor/dashboard"
            description += f"\n\nManage this appointment: {action_url}"
            
            lines.extend([
                "BEGIN:VEVENT",
                f"UID:hms-booking-{b.id}@hms.local",
                f"DTSTAMP:{timezone.now().strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART:{start}",
                f"DTEND:{end}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{description}",
                f"URL;VALUE=URI:{action_url}",
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ])
            
        # Add available slots for patients
        for s in available_slots:
            start = format_dt(s.date, s.start_time)
            end = format_dt(s.date, s.end_time)
            
            summary = f"FREE: Slot with Dr. {s.doctor.get_full_name() or s.doctor.username}"
            booking_url = f"{base_url}/patient" # Link to dashboard for booking
            description = f"This slot is available for booking.\n\nBook now: {booking_url}"
            
            lines.extend([
                "BEGIN:VEVENT",
                f"UID:hms-slot-{s.id}@hms.local",
                f"DTSTAMP:{timezone.now().strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART:{start}",
                f"DTEND:{end}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{description}",
                f"URL;VALUE=URI:{booking_url}",
                "STATUS:TENTATIVE",
                "END:VEVENT",
            ])
            
        lines.append("END:VCALENDAR")
        
        content = "\r\n".join(lines)
        response = HttpResponse(content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="hms_calendar.ics"'
        return response
