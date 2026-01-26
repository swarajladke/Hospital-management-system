import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Eye, EyeOff, Loader2, User, UserCog } from 'lucide-react';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        role: '',
        phone: '',
        specialization: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Basic validation
        if (!formData.role) {
            setErrors({ role: 'Please select a role' });
            setIsLoading(false);
            return;
        }

        const result = await signup(formData);

        if (result.success) {
            const role = result.user?.profile?.role;
            if (role === 'DOCTOR') {
                navigate('/doctor', { replace: true });
            } else {
                navigate('/patient', { replace: true });
            }
        } else {
            setErrors(result.errors || { general: 'Signup failed' });
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-700 to-primary-500 rounded-2xl mb-4">
                        <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create an account</h1>
                    <p className="text-primary-300 mt-2">Join the future of healthcare management</p>
                </div>

                {/* Signup Form */}
                <div className="card">
                    <div className="card-body p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errors.general && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {errors.general}
                                </div>
                            )}

                            {/* Role Selection */}
                            <div>
                                <label className="label">I am a</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleSelect('DOCTOR')}
                                        className={`p-5 rounded-2xl border-2 transition-all duration-300 ${formData.role === 'DOCTOR'
                                            ? 'border-primary-500 bg-primary-800 shadow-xl shadow-primary-500/10'
                                            : 'border-primary-800 bg-primary-900/50 hover:border-primary-700'
                                            }`}
                                    >
                                        <UserCog className={`w-10 h-10 mx-auto mb-3 transition-colors ${formData.role === 'DOCTOR' ? 'text-primary-400' : 'text-primary-700'
                                            }`} />
                                        <div className={`text-lg font-bold ${formData.role === 'DOCTOR' ? 'text-white' : 'text-primary-500'
                                            }`}>Doctor</div>
                                        <div className="text-[10px] uppercase tracking-widest text-primary-600 mt-2 font-bold leading-none">Manage availability</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRoleSelect('PATIENT')}
                                        className={`p-5 rounded-2xl border-2 transition-all duration-300 ${formData.role === 'PATIENT'
                                            ? 'border-primary-500 bg-primary-800 shadow-xl shadow-primary-500/10'
                                            : 'border-primary-800 bg-primary-900/50 hover:border-primary-700'
                                            }`}
                                    >
                                        <User className={`w-10 h-10 mx-auto mb-3 transition-colors ${formData.role === 'PATIENT' ? 'text-primary-400' : 'text-primary-700'
                                            }`} />
                                        <div className={`text-lg font-bold ${formData.role === 'PATIENT' ? 'text-white' : 'text-primary-500'
                                            }`}>Patient</div>
                                        <div className="text-[10px] uppercase tracking-widest text-primary-600 mt-2 font-bold leading-none">Book appointments</div>
                                    </button>
                                </div>
                                {errors.role && (
                                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                                )}
                            </div>

                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="first_name" className="label">First Name</label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={errors.first_name ? 'input-error' : 'input'}
                                        placeholder="John"
                                        required
                                    />
                                    {errors.first_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="last_name" className="label">Last Name</label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={errors.last_name ? 'input-error' : 'input'}
                                        placeholder="Doe"
                                        required
                                    />
                                    {errors.last_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="label">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={errors.username ? 'input-error' : 'input'}
                                    placeholder="johndoe"
                                    required
                                />
                                {errors.username && (
                                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="label">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'input-error' : 'input'}
                                    placeholder="john@example.com"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Specialization (Doctor only) */}
                            {formData.role === 'DOCTOR' && (
                                <div>
                                    <label htmlFor="specialization" className="label">Specialization</label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className={errors.specialization ? 'input-error' : 'input'}
                                        placeholder="e.g., Cardiologist, General Physician"
                                        required
                                    />
                                    {errors.specialization && (
                                        <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>
                                    )}
                                </div>
                            )}

                            {/* Phone (Optional) */}
                            <div>
                                <label htmlFor="phone" className="label">
                                    Phone <span className="text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`${errors.password ? 'input-error' : 'input'} pr-10`}
                                        placeholder="Min. 8 characters"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirm" className="label">Confirm Password</label>
                                <input
                                    type="password"
                                    id="password_confirm"
                                    name="password_confirm"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    className={errors.password_confirm ? 'input-error' : 'input'}
                                    placeholder="Repeat your password"
                                    required
                                />
                                {errors.password_confirm && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password_confirm}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Login link */}
                <p className="text-center text-primary-400 mt-8">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-300 hover:text-white font-semibold underline underline-offset-4 decoration-primary-500/30">
                        Sign in instead
                    </Link>
                </p>
            </div>
        </div>
    );
}
