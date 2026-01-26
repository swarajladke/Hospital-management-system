import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorService, slotService, bookingService } from '../services/scheduling';
import {
    Search,
    Calendar,
    Clock,
    User,
    Loader2,
    CheckCircle,
    AlertCircle,
    Star,
    ChevronRight,
    X
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Booking flow state
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctorSlots, setDoctorSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingNotes, setBookingNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'doctors') {
                const data = await doctorService.getDoctors();
                setDoctors(data);
            } else {
                const data = await bookingService.getBookings();
                setBookings(data);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = async (doctor) => {
        setSelectedDoctor(doctor);
        setLoadingSlots(true);
        setDoctorSlots([]);
        setSelectedSlot(null);

        try {
            const response = await slotService.getDoctorSlots(doctor.id);
            setDoctorSlots(response.slots || []);
        } catch (err) {
            setError('Failed to load doctor slots');
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBookSlot = async () => {
        if (!selectedSlot) return;

        setBookingLoading(true);
        setError(null);

        try {
            await bookingService.createBooking(selectedSlot.id, bookingNotes);
            setBookingSuccess(true);
            setSelectedSlot(null);
            setSelectedDoctor(null);
            setBookingNotes('');

            // Reload bookings
            setTimeout(() => {
                setBookingSuccess(false);
                setActiveTab('bookings');
                loadData();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to book appointment');
        } finally {
            setBookingLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group slots by date
    const groupedSlots = doctorSlots.reduce((acc, slot) => {
        const date = slot.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
    }, {});

    // Stats
    const upcomingBookings = bookings.filter(b => b.is_upcoming).length;
    const totalDoctors = doctors.length;

    return (
        <div className="animate-in">
            {/* Success Toast */}
            {bookingSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-up">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                        <p className="font-semibold">Appointment Booked!</p>
                        <p className="text-sm opacity-90">Check your email for confirmation.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    Welcome, {user?.first_name || user?.username}
                </h1>
                <p className="text-primary-400 mt-2 text-lg font-medium opacity-90">
                    Find and book appointments with top-rated doctors
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard
                    icon={<User className="w-6 h-6" />}
                    label="Available Doctors"
                    value={totalDoctors}
                    color="primary"
                />
                <StatCard
                    icon={<Calendar className="w-6 h-6" />}
                    label="Upcoming Appointments"
                    value={upcomingBookings}
                    color="secondary"
                />
                <StatCard
                    icon={<Star className="w-6 h-6" />}
                    label="Total Bookings"
                    value={bookings.length}
                    color="navy"
                />
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-primary-900/40 rounded-xl p-1.5 mb-8 w-fit border border-primary-800/50">
                <button
                    onClick={() => setActiveTab('doctors')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'doctors'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        : 'text-primary-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Find Doctors
                </button>
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'bookings'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        : 'text-primary-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    My Appointments
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            {activeTab === 'doctors' ? (
                <div>
                    {/* Search */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, specialization, or hospital..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 py-4 bg-primary-800 border-primary-700 text-white rounded-2xl shadow-xl focus:shadow-primary-500/10 placeholder:text-primary-500"
                        />
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : filteredDoctors.length === 0 ? (
                        <EmptyState message="No doctors found" />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDoctors.map((doctor) => (
                                <DoctorCard
                                    key={doctor.id}
                                    doctor={doctor}
                                    onSelect={() => handleSelectDoctor(doctor)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {loading ? (
                        <LoadingState />
                    ) : bookings.length === 0 ? (
                        <EmptyState message="No appointments yet. Book one now!" />
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <PatientBookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Doctor Slots Modal */}
            {selectedDoctor && (
                <Modal onClose={() => {
                    setSelectedDoctor(null);
                    setSelectedSlot(null);
                    setDoctorSlots([]);
                }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold">{selectedDoctor.full_name}</h2>
                            <p className="text-gray-500">{selectedDoctor.specialization}</p>
                        </div>
                        <button
                            onClick={() => setSelectedDoctor(null)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {loadingSlots ? (
                        <LoadingState />
                    ) : Object.keys(groupedSlots).length === 0 ? (
                        <EmptyState message="No available slots for this doctor" />
                    ) : (
                        <div className="space-y-6 max-h-[400px] overflow-y-auto">
                            {Object.entries(groupedSlots).map(([date, slots]) => (
                                <div key={date}>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        {isToday(parseISO(date))
                                            ? 'Today'
                                            : isTomorrow(parseISO(date))
                                                ? 'Tomorrow'
                                                : format(parseISO(date), 'EEEE, MMMM d')}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.id}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-lg border text-center transition-all ${selectedSlot?.id === slot.id
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Clock className="w-4 h-4 mx-auto mb-1 opacity-60" />
                                                <span className="text-sm font-medium">
                                                    {slot.start_time.slice(0, 5)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedSlot && (
                        <div className="mt-6 pt-6 border-t">
                            <label className="label">Notes (Optional)</label>
                            <textarea
                                value={bookingNotes}
                                onChange={(e) => setBookingNotes(e.target.value)}
                                className="input"
                                rows={3}
                                placeholder="Any specific concerns or notes for the doctor..."
                            />

                            <button
                                onClick={handleBookSlot}
                                disabled={bookingLoading}
                                className="btn-success w-full mt-4"
                            >
                                {bookingLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Booking...</>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Booking - {format(parseISO(selectedSlot.date), 'MMM d')} at {selectedSlot.start_time.slice(0, 5)}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}

// Helper Components
function StatCard({ icon, label, value, color }) {
    const colors = {
        primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
        secondary: 'bg-secondary-500/10 text-secondary-400 border border-secondary-500/20',
        navy: 'bg-primary-400/10 text-primary-300 border border-primary-400/20',
    };

    return (
        <div className="card group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center space-x-4 p-5">
                <div className={`p-4 rounded-2xl shadow-lg shadow-black/20 ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
                    <p className="text-xs text-primary-400 font-bold uppercase tracking-[0.15em] mt-0.5">{label}</p>
                </div>
            </div>
        </div>
    );
}

function DoctorCard({ doctor, onSelect }) {
    return (
        <div
            className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onSelect}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-primary-800 rounded-2xl flex items-center justify-center text-primary-400 font-black text-xl border border-primary-700/50 shadow-inner">
                        {doctor.full_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-white tracking-tight">{doctor.full_name}</h3>
                        <p className="text-xs text-primary-400 font-bold uppercase tracking-[0.1em] mt-0.5">{doctor.specialization}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <button className="btn-primary w-full mt-4 text-sm py-2">
                View Available Slots
            </button>
        </div>
    );
}

function PatientBookingCard({ booking }) {
    return (
        <div className="card p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-5">
                    <div className="w-14 h-14 bg-secondary-900/30 rounded-2xl flex items-center justify-center text-secondary-400 font-black text-xl border border-secondary-500/20 shadow-inner">
                        {booking.doctor_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-white tracking-tight">
                            Dr. {booking.doctor_name}
                        </h3>
                        <p className="text-sm text-primary-300 mt-1 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                            {format(parseISO(booking.slot_details.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-primary-400 mt-1 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                            {booking.slot_details.start_time.slice(0, 5)} - {booking.slot_details.end_time.slice(0, 5)}
                        </p>
                        {booking.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                                "{booking.notes}"
                            </p>
                        )}
                    </div>
                </div>
                <span className={`badge ${booking.is_upcoming ? 'badge-success' : 'badge-warning'}`}>
                    {booking.is_upcoming ? 'Upcoming' : 'Past'}
                </span>
            </div>
        </div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
                <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{message}</p>
        </div>
    );
}
