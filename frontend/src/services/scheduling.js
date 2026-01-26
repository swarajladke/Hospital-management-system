import api from './api';

// ==================== Slot Services ====================

export const slotService = {
    // Get all slots (doctors see their own, patients see available)
    getSlots: async (params = {}) => {
        const response = await api.get('/slots/', { params });
        return response.data;
    },

    // Create a new slot (doctor only)
    createSlot: async (slotData) => {
        const response = await api.post('/slots/', slotData);
        return response.data;
    },

    // Create multiple slots at once
    createBulkSlots: async (date, slots) => {
        const response = await api.post('/slots/bulk/', { date, slots });
        return response.data;
    },

    // Delete a slot (doctor only)
    deleteSlot: async (slotId) => {
        await api.delete(`/slots/${slotId}/`);
    },

    // Get available slots for a specific doctor (patient only)
    getDoctorSlots: async (doctorId, params = {}) => {
        const response = await api.get(`/doctors/${doctorId}/slots/`, { params });
        return response.data;
    },
};

// ==================== Booking Services ====================

export const bookingService = {
    // Get all bookings
    getBookings: async (params = {}) => {
        const response = await api.get('/bookings/', { params });
        return response.data;
    },

    // Create a booking (patient only)
    createBooking: async (slotId, notes = '') => {
        const response = await api.post('/bookings/', { slot_id: slotId, notes });
        return response.data;
    },

    // Get a specific booking
    getBooking: async (bookingId) => {
        const response = await api.get(`/bookings/${bookingId}/`);
        return response.data;
    },
};

// ==================== Doctor Services ====================

export const doctorService = {
    // Get list of all doctors (patient only)
    getDoctors: async () => {
        const response = await api.get('/auth/doctors/');
        return response.data;
    },
};

// ==================== Google Calendar Services ====================

export const calendarService = {
    // Get OAuth authorization URL
    getAuthUrl: async () => {
        const response = await api.get('/integrations/google/auth-url/');
        return response.data;
    },

    // Check if calendar is connected
    getStatus: async () => {
        const response = await api.get('/integrations/google/status/');
        return response.data;
    },

    // Disconnect Google Calendar
    disconnect: async () => {
        const response = await api.post('/integrations/google/disconnect/');
        return response.data;
    },
};
