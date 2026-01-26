import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    Calendar,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Stethoscope
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, isAuthenticated, isDoctor, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const dashboardPath = isDoctor ? '/doctor' : '/patient';

    return (
        <nav className="bg-primary-900 border-b border-primary-800 text-white sticky top-0 z-50 shadow-2xl">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-primary-400 transition-colors">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">HMS</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={dashboardPath}
                                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all ${location.pathname === dashboardPath
                                            ? 'bg-primary-500 text-white shadow-lg'
                                            : 'text-primary-300 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>

                                <Link
                                    to={`${dashboardPath}/bookings`}
                                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all ${location.pathname.includes('/bookings')
                                            ? 'bg-primary-500 text-white shadow-lg'
                                            : 'text-primary-300 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Appointments</span>
                                </Link>

                                <Link
                                    to="/settings"
                                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all ${location.pathname === '/settings'
                                            ? 'bg-primary-500 text-white shadow-lg'
                                            : 'text-primary-300 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </Link>

                                <div className="h-6 w-px bg-primary-800 mx-2"></div>

                                {/* User info */}
                                <div className="flex items-center space-x-3 px-2">
                                    <div className="text-right hidden lg:block">
                                        <p className="text-sm font-bold text-white leading-none">
                                            {user?.full_name || user?.username}
                                        </p>
                                        <p className="text-[10px] text-primary-400 uppercase tracking-widest font-semibold mt-1">
                                            {user?.profile?.role}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-primary-800 rounded-full flex items-center justify-center border border-primary-700 shadow-inner">
                                        <User className="w-5 h-5 text-primary-300" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-primary-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-primary-300 hover:text-white px-4 py-2 font-medium transition-colors">
                                    Login
                                </Link>
                                <Link to="/signup" className="bg-primary-500 text-white hover:bg-primary-400 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-primary-300 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100">
                        {isAuthenticated ? (
                            <div className="space-y-2">
                                <Link
                                    to={dashboardPath}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Home className="w-5 h-5 text-gray-500" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    to="/settings"
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    <span>Settings</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 rounded-lg hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="block px-3 py-2 rounded-lg bg-primary-600 text-white"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
