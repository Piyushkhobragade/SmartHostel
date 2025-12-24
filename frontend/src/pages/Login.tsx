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

    // Redirect if already authenticated
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
            // Navigation handled by AuthContext
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center animate-fadeIn">
                {/* Left Side - Branding */}
                <div className="hidden md:flex flex-col items-center justify-center text-center">
                    <div className="relative w-48 h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-105 transition-transform overflow-hidden">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_1] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        <Building2 className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
                        SmartHostel
                    </h1>
                    <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-2">
                        Modern Hostel Operations.
                    </p>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Simple. Organized. Smart.
                    </p>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile Logo */}
                    <div className="md:hidden text-center mb-8">
                        <div className="relative inline-flex w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-700 rounded-2xl items-center justify-center shadow-xl mb-4 overflow-hidden">
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_1] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            <Building2 className="w-10 h-10 text-white relative z-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                            SmartHostel
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">Hostel Management System</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                            Admin Login
                        </h2>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter username"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 dark:from-blue-500 dark:to-blue-700 dark:hover:from-blue-600 dark:hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        {/* Footer Note */}
                        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                            Secure authentication with JWT
                        </p>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}
