import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { slotService, bookingService } from '../services/scheduling';
import {
    Calendar,
    Clock,
    Users,
    Plus,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO, isToday } from 'date-fns';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('slots');
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Slot creation state
    const [showCreateSlot, setShowCreateSlot] = useState(false);
    const [newSlot, setNewSlot] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '09:30'
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Calendar state
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'slots') {
                const data = await slotService.getSlots({ show_booked: 'true' });
                setSlots(data);
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

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setError(null);

        try {
            await slotService.createSlot(newSlot);
            setShowCreateSlot(false);
            setNewSlot({
                date: format(new Date(), 'yyyy-MM-dd'),
                start_time: '09:00',
                end_time: '09:30'
            });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create slot');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm('Are you sure you want to delete this slot?')) return;

        try {
            await slotService.deleteSlot(slotId);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete slot');
        }
    };

    const getWeekDays = () => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
    };

    const getSlotsForDate = (date) => {
        return slots.filter(slot => isSameDay(parseISO(slot.date), date));
    };

    // Stats
    const totalSlots = slots.length;
    const bookedSlots = slots.filter(s => s.is_booked).length;
    const availableSlots = totalSlots - bookedSlots;
    const upcomingBookings = bookings.filter(b => b.is_upcoming).length;

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    Welcome, Dr. {user?.last_name || user?.username}
                </h1>
                <p className="text-primary-400 mt-2 text-lg font-medium opacity-90">
                    {user?.profile?.specialization || 'Hospital management and availability dashboard'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Calendar className="w-6 h-6" />}
                    label="Total Slots"
                    value={totalSlots}
                    color="primary"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    label="Booked"
                    value={bookedSlots}
                    color="secondary"
                />
                <StatCard
                    icon={<Clock className="w-6 h-6" />}
                    label="Available"
                    value={availableSlots}
                    color="blue"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    label="Upcoming"
                    value={upcomingBookings}
                    color="navy"
                />
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-primary-900/40 rounded-xl p-1.5 mb-8 w-fit border border-primary-800/50">
                <button
                    onClick={() => setActiveTab('slots')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'slots'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        : 'text-primary-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Availability Slots
                </button>
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'bookings'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        : 'text-primary-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Appointments
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Content */}
            {activeTab === 'slots' ? (
                <div>
                    {/* Create Slot Button */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-medium">
                                {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
                            </span>
                            <button
                                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowCreateSlot(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slot
                        </button>
                    </div>

                    {/* Week Calendar View */}
                    {loading ? (
                        <LoadingState />
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {getWeekDays().map((day) => (
                                <div key={day.toISOString()} className="min-h-[200px]">
                                    <div className={`text-center p-2 rounded-t-lg ${isToday(day) ? 'bg-primary-100' : 'bg-gray-100'
                                        }`}>
                                        <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                                        <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary-600' : 'text-gray-900'
                                            }`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                    <div className="border border-t-0 border-gray-200 rounded-b-lg p-2 space-y-1">
                                        {getSlotsForDate(day).map((slot) => (
                                            <div
                                                key={slot.id}
                                                className={`p-2 rounded text-xs ${slot.is_booked
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-50 text-blue-800'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{slot.start_time.slice(0, 5)}</span>
                                                    {!slot.is_booked && !slot.is_past && (
                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] opacity-75">
                                                    {slot.is_booked ? 'Booked' : 'Available'}
                                                </div>
                                            </div>
                                        ))}
                                        {getSlotsForDate(day).length === 0 && (
                                            <div className="text-xs text-gray-400 text-center py-4">
                                                No slots
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {loading ? (
                        <LoadingState />
                    ) : bookings.length === 0 ? (
                        <EmptyState message="No appointments yet" />
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create Slot Modal */}
            {showCreateSlot && (
                <Modal onClose={() => setShowCreateSlot(false)}>
                    <h2 className="text-xl font-semibold mb-4">Create Availability Slot</h2>
                    <form onSubmit={handleCreateSlot} className="space-y-4">
                        <div>
                            <label className="label">Date</label>
                            <input
                                type="date"
                                value={newSlot.date}
                                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                                className="input"
                                min={format(new Date(), 'yyyy-MM-dd')}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Start Time</label>
                                <input
                                    type="time"
                                    value={newSlot.start_time}
                                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">End Time</label>
                                <input
                                    type="time"
                                    value={newSlot.end_time}
                                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateSlot(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="btn-primary"
                            >
                                {createLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                                ) : (
                                    'Create Slot'
                                )}
                            </button>
                        </div>
                    </form>
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
        blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
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

function BookingCard({ booking }) {
    return (
        <div className="card p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        {booking.patient_name}
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
                        <p className="text-sm text-gray-500 mt-2">
                            Notes: {booking.notes}
                        </p>
                    )}
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
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
                <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
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
