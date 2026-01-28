import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Settings,
    Calendar,
    User,
    Loader2,
    CheckCircle,
    AlertCircle,
    Save,
    Copy,
} from 'lucide-react';

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
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
    }, [user]);

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

    // Check for success/error messages in URL but skip Google logic
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            setSuccess('Settings updated successfully!');
            window.history.replaceState({}, '', '/settings');
        } else if (params.get('error')) {
            setError('An error occurred. Please try again.');
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
            {user?.profile?.role === 'DOCTOR' && (
                <div className="card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            Google Calendar Integration
                        </h2>
                    </div>
                    <div className="card-body">
                        <p className="text-sm text-gray-600 mb-4">
                            Sync your appointments directly to your Google Calendar.
                        </p>

                        {user?.profile?.google_calendar_connected ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Connected to Google Calendar</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => window.location.href = 'http://localhost:8000/api/accounts/google/login/'}
                                className="btn-primary bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                Connect Google Calendar
                            </button>
                        )}
                    </div>
                </div>
            )}

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
