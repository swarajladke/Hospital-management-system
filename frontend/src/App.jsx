import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import SettingsPage from './pages/SettingsPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-primary-950 font-sans">
                    <Navbar />
                    <main className="container mx-auto px-4 py-10">
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />

                            {/* Doctor-only routes */}
                            <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                                <Route path="/doctor" element={<DoctorDashboard />} />
                                <Route path="/doctor/*" element={<DoctorDashboard />} />
                            </Route>

                            {/* Patient-only routes */}
                            <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                                <Route path="/patient" element={<PatientDashboard />} />
                                <Route path="/patient/*" element={<PatientDashboard />} />
                            </Route>

                            {/* Settings (authenticated) */}
                            <Route element={<ProtectedRoute allowedRoles={['DOCTOR', 'PATIENT']} />}>
                                <Route path="/settings" element={<SettingsPage />} />
                            </Route>

                            {/* Redirect root based on role */}
                            <Route path="/" element={<RoleBasedRedirect />} />

                            {/* 404 */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

function RoleBasedRedirect() {
    // This component checks auth status and redirects accordingly
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.profile?.role === 'DOCTOR') {
        return <Navigate to="/doctor" replace />;
    }

    return <Navigate to="/patient" replace />;
}

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-8xl font-black text-primary-800">404</h1>
            <p className="text-2xl text-primary-400 mt-4 font-bold">Page not found</p>
            <a href="/" className="btn-primary mt-8 px-10">Return to Portal</a>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-primary-800 border-t-primary-500 rounded-full animate-spin shadow-2xl"></div>
        </div>
    );
}

// Import useAuth hook
import { useAuth } from './context/AuthContext';

export default App;
