import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

/**
 * ChangePassword — First-Login Password Gate
 *
 * Shown when a student has mustChangePassword = true.
 * Blocks all other navigation until a new password is set.
 */
export default function ChangePassword() {
    const { user, token, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('New password must be different from your temporary password.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                `${API_BASE_URL}/auth/change-password`,
                { oldPassword: currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);

            // Update the user object in localStorage to clear the gate
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.mustChangePassword = false;
                localStorage.setItem('user', JSON.stringify(parsed));
            }

            // Logout and redirect to login so the user gets a fresh JWT without the flag
            setTimeout(() => {
                logout();
            }, 2500);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to change password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgb(var(--bg-app))' }}>
                <div className="max-w-md w-full rounded-2xl shadow-xl p-8 text-center"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(var(--color-success), 0.12)' }}>
                        <ShieldCheck className="w-8 h-8" style={{ color: 'rgb(var(--color-success))' }} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                        Password Changed
                    </h2>
                    <p style={{ color: 'rgb(var(--text-secondary))' }}>
                        Your password has been updated securely. You will be redirected to the login page to sign in with your new password.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgb(var(--bg-app))' }}>
            <div className="max-w-md w-full">
                {/* Warning Banner */}
                <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
                    style={{
                        background: 'rgba(var(--color-warning), 0.08)',
                        border: '1px solid rgba(var(--color-warning), 0.25)',
                    }}>
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--color-warning))' }} />
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'rgb(var(--color-warning))' }}>
                            Password Change Required
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Your account was created with a temporary password. You must set a personal password before continuing.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl shadow-xl p-8"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
                            <Lock className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                            Set New Password
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                            Welcome, {user?.username}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-sm"
                            style={{
                                background: 'rgba(var(--color-danger), 0.08)',
                                border: '1px solid rgba(var(--color-danger), 0.30)',
                                color: 'rgb(var(--color-danger))',
                            }}
                            role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="cp-current" className="block text-sm font-medium mb-1.5"
                                style={{ color: 'rgb(var(--text-secondary))' }}>
                                Temporary Password
                            </label>
                            <input
                                id="cp-current"
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="input-field"
                                placeholder="Enter the temporary password from your credential slip"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="cp-new" className="block text-sm font-medium mb-1.5"
                                style={{ color: 'rgb(var(--text-secondary))' }}>
                                New Password
                            </label>
                            <input
                                id="cp-new"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="input-field"
                                placeholder="Minimum 8 characters"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label htmlFor="cp-confirm" className="block text-sm font-medium mb-1.5"
                                style={{ color: 'rgb(var(--text-secondary))' }}>
                                Confirm New Password
                            </label>
                            <input
                                id="cp-confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="input-field"
                                placeholder="Re-enter new password"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                    Changing Password...
                                </>
                            ) : (
                                'Set New Password'
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        Your temporary password will be invalidated after this change.
                    </p>
                </div>
            </div>
        </div>
    );
}
