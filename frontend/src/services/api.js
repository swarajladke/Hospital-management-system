import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for session-based auth
});

// Request interceptor to add CSRF token
api.interceptors.request.use((config) => {
    // Get CSRF token from cookie
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific error cases
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login if not already there
                    if (!window.location.pathname.includes('/login')) {
                        console.log('Session expired, redirecting to login');
                        // Don't redirect automatically, let the component handle it
                    }
                    break;
                case 403:
                    console.log('Access forbidden');
                    break;
                case 500:
                    console.error('Server error');
                    break;
                default:
                    break;
            }
        }
        return Promise.reject(error);
    }
);

// Helper to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

export default api;
