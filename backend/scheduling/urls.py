"""
URL patterns for scheduling app.
"""

from django.urls import path
from .views import (
    SlotListCreateView,
    BulkSlotCreateView,
    SlotDetailView,
    BookingListCreateView,
    BookingDetailView,
    DoctorAvailableSlotsView,
)

urlpatterns = [
    # Slots
    path('slots/', SlotListCreateView.as_view(), name='slot_list_create'),
    path('slots/bulk/', BulkSlotCreateView.as_view(), name='bulk_slot_create'),
    path('slots/<int:pk>/', SlotDetailView.as_view(), name='slot_detail'),
    
    # Bookings
    path('bookings/', BookingListCreateView.as_view(), name='booking_list_create'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    
    # Doctor's available slots (for patients)
    path('doctors/<int:doctor_id>/slots/', DoctorAvailableSlotsView.as_view(), name='doctor_slots'),
]
