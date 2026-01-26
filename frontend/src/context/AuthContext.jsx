import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me/');
            setUser(response.data);
            setError(null);
        } catch (err) {
            setUser(null);
            // Only set error if it's not a 401/403 (expected when not logged in)
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                setError('Failed to check authentication status');
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            // Get CSRF token first
            await api.get('/auth/csrf/');

            const response = await api.post('/auth/login/', { username, password });
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            // Get CSRF token first
            await api.get('/auth/csrf/');

            const response = await api.post('/auth/signup/', userData);
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (err) {
            const errors = err.response?.data || { error: 'Signup failed' };
            setError(typeof errors === 'string' ? errors : 'Validation failed');
            return { success: false, errors };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout/');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
        }
    };

    const updateUser = async (userData) => {
        try {
            const response = await api.patch('/auth/me/', userData);
            setUser(response.data);
            return { success: true, user: response.data };
        } catch (err) {
            return { success: false, error: 'Failed to update profile' };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateUser,
        checkAuth,
        isAuthenticated: !!user,
        isDoctor: user?.profile?.role === 'DOCTOR',
        isPatient: user?.profile?.role === 'PATIENT',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
