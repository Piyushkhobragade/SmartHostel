import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Building2 } from 'lucide-react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
            setError((err as { message?: string }).message ?? msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'rgb(var(--bg-app))' }}
        >
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center animate-fadeIn">

                {/* Left Side — Branding */}
                <div className="hidden md:flex flex-col items-center justify-center text-center">
                    <div className="relative w-48 h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-105 transition-transform overflow-hidden">
                        {/* Shimmer */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_1] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <Building2 className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-bold mb-3" style={{ color: 'rgb(var(--text-primary))' }}>
                        SmartHostel
                    </h1>
                    <p className="text-xl font-medium mb-2" style={{ color: 'rgb(var(--color-primary))' }}>
                        Modern Hostel Operations.
                    </p>
                    <p className="text-lg" style={{ color: 'rgb(var(--text-secondary))' }}>
                        Simple. Organized. Smart.
                    </p>
                </div>

                {/* Right Side — Login Form */}
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile Logo */}
                    <div className="md:hidden text-center mb-8">
                        <div className="relative inline-flex w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl items-center justify-center shadow-xl mb-4 overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_1] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <Building2 className="w-10 h-10 text-white relative z-10" />
                        </div>
                        <h1 className="text-3xl font-bold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                            SmartHostel
                        </h1>
                        <p style={{ color: 'rgb(var(--text-secondary))' }}>Hostel Management System</p>
                    </div>

                    {/* Login Card */}
                    <div
                        className="rounded-2xl shadow-xl p-8"
                        style={{
                            background: 'rgb(var(--bg-panel))',
                            border: '1px solid rgb(var(--border-color))',
                        }}
                    >
                        <h2
                            className="text-2xl font-bold mb-6 text-center"
                            style={{ color: 'rgb(var(--text-primary))' }}
                        >
                            Admin Login
                        </h2>

                        {/* Error Message */}
                        {error && (
                            <div
                                className="mb-4 p-3 rounded-lg text-sm"
                                style={{
                                    background: 'rgba(var(--color-danger), 0.08)',
                                    border: '1px solid rgba(var(--color-danger), 0.30)',
                                    color: 'rgb(var(--color-danger))',
                                }}
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {/* Username */}
                            <div>
                                <label
                                    htmlFor="login-username"
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: 'rgb(var(--text-secondary))' }}
                                >
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5" style={{ color: 'rgb(var(--text-muted))' }} />
                                    </div>
                                    <input
                                        id="login-username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="Enter username"
                                        required
                                        autoFocus
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="login-password"
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: 'rgb(var(--text-secondary))' }}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5" style={{ color: 'rgb(var(--text-muted))' }} />
                                    </div>
                                    <input
                                        id="login-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="Enter password"
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm font-medium transition-colors hover:opacity-70"
                                    style={{ color: 'rgb(var(--color-primary))' }}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <p
                            className="mt-6 text-center text-xs"
                            style={{ color: 'rgb(var(--text-muted))' }}
                        >
                            Secure authentication with JWT
                        </p>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}
