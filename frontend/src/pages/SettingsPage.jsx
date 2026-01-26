import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calendarService } from '../services/scheduling';
import {
    Settings,
    Calendar,
    User,
    Link2,
    Link2Off,
    Loader2,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Save
} from 'lucide-react';

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [calendarStatus, setCalendarStatus] = useState({ connected: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialization: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.profile?.phone || '',
                specialization: user.profile?.specialization || '',
            });
        }
        loadCalendarStatus();
    }, [user]);

    const loadCalendarStatus = async () => {
        setLoading(true);
        try {
            const status = await calendarService.getStatus();
            setCalendarStatus(status);
        } catch (err) {
            console.error('Failed to load calendar status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectCalendar = async () => {
        try {
            const { authorization_url } = await calendarService.getAuthUrl();
            window.location.href = authorization_url;
        } catch (err) {
            setError('Failed to connect Google Calendar');
        }
    };

    const handleDisconnectCalendar = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

        try {
            await calendarService.disconnect();
            setCalendarStatus({ connected: false });
            setSuccess('Google Calendar disconnected');
        } catch (err) {
            setError('Failed to disconnect calendar');
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        const result = await updateUser(formData);

        if (result.success) {
            setSuccess('Profile updated successfully');
        } else {
            setError(result.error);
        }

        setSaving(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Check URL params for OAuth callback status
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'calendar_connected') {
            setSuccess('Google Calendar connected successfully!');
            loadCalendarStatus();
            // Clean URL
            window.history.replaceState({}, '', '/settings');
        } else if (params.get('error')) {
            setError('Failed to connect Google Calendar. Please try again.');
            window.history.replaceState({}, '', '/settings');
        }
    }, []);

    return (
        <div className="max-w-2xl mx-auto animate-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary-600" />
                    Settings
                </h1>
                <p className="text-gray-500 mt-1">Manage your account and integrations</p>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Profile Section */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        Profile Information
                    </h2>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        {user?.profile?.role === 'DOCTOR' && (
                            <div>
                                <label className="label">Specialization</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="e.g., Cardiologist"
                                />
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Google Calendar Section */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        Google Calendar Integration
                    </h2>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : calendarStatus.connected ? (
                        <div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Link2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-green-800">Connected</p>
                                    <p className="text-sm text-green-600">
                                        Your Google Calendar is synced. New appointments will be added automatically.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDisconnectCalendar}
                                className="btn-danger"
                            >
                                <Link2Off className="w-4 h-4 mr-2" />
                                Disconnect Calendar
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Link2Off className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Not Connected</p>
                                    <p className="text-sm text-gray-500">
                                        Connect your Google Calendar to automatically sync appointments.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleConnectCalendar}
                                className="btn-primary"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Connect Google Calendar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Username: <strong>{user?.username}</strong></span>
                    <span>Role: <span className="badge-primary">{user?.profile?.role}</span></span>
                </div>
            </div>
        </div>
    );
}
