import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role permission
    const userRole = user?.profile?.role;
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'DOCTOR') {
            return <Navigate to="/doctor" replace />;
        } else if (userRole === 'PATIENT') {
            return <Navigate to="/patient" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Render child routes
    return <Outlet />;
}
