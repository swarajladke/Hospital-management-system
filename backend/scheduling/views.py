"""
Views for scheduling app.
Contains the critical transaction-safe booking logic.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, OperationalError
from django.contrib.auth.models import User
from datetime import date, timedelta
import logging

from .models import AvailabilitySlot, Booking
from .serializers import (
    SlotSerializer, 
    SlotCreateSerializer,
    BulkSlotCreateSerializer,
    BookingSerializer,
    BookingCreateSerializer,
)
from accounts.permissions import IsDoctor, IsPatient
from services.email_client import send_email

logger = logging.getLogger(__name__)


# ==================== SLOT VIEWS ====================

class SlotListCreateView(APIView):
    """
    GET: List slots (doctors see their own, patients see available slots)
    POST: Create a new slot (doctors only)
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Query parameters for filtering
        doctor_id = request.query_params.get('doctor_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        show_booked = request.query_params.get('show_booked', 'false').lower() == 'true'
        
        # Base queryset
        if user.profile.is_doctor:
            # Doctors see their own slots
            queryset = AvailabilitySlot.objects.filter(doctor=user)
        else:
            # Patients see all available slots from all doctors
            queryset = AvailabilitySlot.objects.filter(is_booked=False)
            
            if doctor_id:
                queryset = queryset.filter(doctor_id=doctor_id)
        
        # Apply date filters
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        else:
            # Default: only show future slots
            queryset = queryset.filter(date__gte=date.today())
        
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # For doctors, optionally hide booked slots
        if user.profile.is_doctor and not show_booked:
            queryset = queryset.filter(is_booked=False)
        
        queryset = queryset.select_related('doctor', 'doctor__profile')
        serializer = SlotSerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    def post(self, request):
        # Check if user is a doctor
        user_role = getattr(request.user.profile, 'role', None) if hasattr(request.user, 'profile') else None
        
        if user_role != 'DOCTOR':
            return Response(
                {'error': 'Access denied. Only users with the DOCTOR role can create availability slots.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SlotCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for overlapping slots
        data = serializer.validated_data
        existing = AvailabilitySlot.objects.filter(
            doctor=request.user,
            date=data['date'],
            start_time=data['start_time']
        ).exists()
        
        if existing:
            return Response(
                {'error': 'A slot already exists at this time.'},
                status=status.HTTP_409_CONFLICT
            )
        
        slot = AvailabilitySlot.objects.create(
            doctor=request.user,
            date=data['date'],
            start_time=data['start_time'],
            end_time=data['end_time']
        )
        
        logger.info(f"Slot created: {slot}")
        
        return Response(
            SlotSerializer(slot).data,
            status=status.HTTP_201_CREATED
        )


class BulkSlotCreateView(APIView):
    """Create multiple slots at once (doctors only)."""
    
    permission_classes = [IsAuthenticated, IsDoctor]
    
    def post(self, request):
        serializer = BulkSlotCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        created_slots = []
        errors = []
        
        for i, slot_data in enumerate(data['slots']):
            try:
                # Parse time strings
                from datetime import datetime
                start_time = datetime.strptime(slot_data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(slot_data['end_time'], '%H:%M').time()
                
                # Check for existing slot
                if AvailabilitySlot.objects.filter(
                    doctor=request.user,
                    date=data['date'],
                    start_time=start_time
                ).exists():
                    errors.append(f"Slot {i+1}: Already exists at {start_time}")
                    continue
                
                slot = AvailabilitySlot.objects.create(
                    doctor=request.user,
                    date=data['date'],
                    start_time=start_time,
                    end_time=end_time
                )
                created_slots.append(slot)
                
            except Exception as e:
                errors.append(f"Slot {i+1}: {str(e)}")
        
        return Response({
            'created': SlotSerializer(created_slots, many=True).data,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_slots else status.HTTP_400_BAD_REQUEST)


class SlotDetailView(APIView):
    """Get, update, or delete a specific slot."""
    
    permission_classes = [IsAuthenticated, IsDoctor]
    
    def get_object(self, pk, user):
        try:
            return AvailabilitySlot.objects.get(pk=pk, doctor=user)
        except AvailabilitySlot.DoesNotExist:
            return None
    
    def get(self, request, pk):
        slot = self.get_object(pk, request.user)
        if not slot:
            return Response(
                {'error': 'Slot not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(SlotSerializer(slot).data)
    
    def delete(self, request, pk):
        slot = self.get_object(pk, request.user)
        if not slot:
            return Response(
                {'error': 'Slot not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if slot.is_booked:
            return Response(
                {'error': 'Cannot delete a booked slot. Cancel the booking first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if slot.is_past:
            return Response(
                {'error': 'Cannot delete past slots.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slot.delete()
        logger.info(f"Slot deleted: {pk} by {request.user.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== BOOKING VIEWS ====================

class BookingListCreateView(APIView):
    """
    GET: List bookings (doctors and patients see their own)
    POST: Create a booking (patients only) - TRANSACTION SAFE
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.profile.is_doctor:
            queryset = Booking.objects.filter(doctor=user)
        else:
            queryset = Booking.objects.filter(patient=user)
        
        # Filter by upcoming/past
        show_past = request.query_params.get('show_past', 'false').lower() == 'true'
        if not show_past:
            queryset = queryset.filter(slot__date__gte=date.today())
        
        queryset = queryset.select_related(
            'patient', 'patient__profile',
            'doctor', 'doctor__profile',
            'slot'
        ).order_by('slot__date', 'slot__start_time')
        
        serializer = BookingSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """
        CRITICAL: Transaction-safe booking with row locking.
        Prevents race conditions and double-booking.
        """
        
        # Only patients can book
        if not request.user.profile.is_patient:
            return Response(
                {'error': 'Only patients can book appointments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BookingCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        slot_id = serializer.validated_data['slot_id']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            with transaction.atomic():
                # Row-level locking to prevent race conditions
                # nowait=True means it will fail immediately if locked (no waiting)
                try:
                    slot = AvailabilitySlot.objects.select_for_update(nowait=True).get(
                        id=slot_id,
                        is_booked=False
                    )
                except AvailabilitySlot.DoesNotExist:
                    return Response(
                        {'error': 'Slot is no longer available.'},
                        status=status.HTTP_409_CONFLICT
                    )
                
                # Double-check slot state (defense in depth)
                if slot.is_booked:
                    return Response(
                        {'error': 'Slot was just booked by someone else.'},
                        status=status.HTTP_409_CONFLICT
                    )
                
                if slot.is_past:
                    return Response(
                        {'error': 'Cannot book a slot in the past.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Mark slot as booked
                slot.is_booked = True
                slot.save()
                
                # Create booking
                booking = Booking.objects.create(
                    patient=request.user,
                    doctor=slot.doctor,
                    slot=slot,
                    notes=notes
                )
                
                logger.info(
                    f"Booking created: {booking.id} - "
                    f"{request.user.username} with Dr. {slot.doctor.username} "
                    f"on {slot.date} at {slot.start_time}"
                )
        
        except OperationalError as e:
            # Row lock was not available (concurrent booking attempt)
            logger.warning(f"Concurrent booking attempt for slot {slot_id}: {e}")
            return Response(
                {'error': 'Slot is currently being booked. Please try again.'},
                status=status.HTTP_409_CONFLICT
            )
        
        # === Post-booking operations (outside transaction) ===
        
        # Send confirmation email
        try:
            send_email(
                action='BOOKING_CONFIRMATION',
                recipient=request.user.email,
                data={
                    'patient_name': request.user.get_full_name() or request.user.username,
                    'doctor': slot.doctor.get_full_name() or slot.doctor.username,
                    'date': str(slot.date),
                    'time': str(slot.start_time),
                }
            )
        except Exception as e:
            logger.error(f"Failed to send booking confirmation email: {e}")
        
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )


class BookingDetailView(APIView):
    """Get details of a specific booking."""
    
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        try:
            if user.profile.is_doctor:
                return Booking.objects.get(pk=pk, doctor=user)
            else:
                return Booking.objects.get(pk=pk, patient=user)
        except Booking.DoesNotExist:
            return None
    
    def get(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(BookingSerializer(booking).data)


class DoctorAvailableSlotsView(APIView):
    """Get available slots for a specific doctor (for patients)."""
    
    permission_classes = [IsAuthenticated, IsPatient]
    
    def get(self, request, doctor_id):
        try:
            doctor = User.objects.get(id=doctor_id, profile__role='DOCTOR')
        except User.DoesNotExist:
            return Response(
                {'error': 'Doctor not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get date range from query params
        date_from = request.query_params.get('date_from', str(date.today()))
        date_to = request.query_params.get('date_to', str(date.today() + timedelta(days=30)))
        
        slots = AvailabilitySlot.objects.filter(
            doctor=doctor,
            is_booked=False,
            date__gte=date_from,
            date__lte=date_to
        ).order_by('date', 'start_time')
        
        serializer = SlotSerializer(slots, many=True)
        
        return Response({
            'doctor': {
                'id': doctor.id,
                'name': doctor.get_full_name() or doctor.username,
                'specialization': doctor.profile.specialization
            },
            'slots': serializer.data
        })
