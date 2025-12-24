import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        resetCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username) {
            newErrors.username = 'Username is required';
        }

        if (!formData.resetCode) {
            newErrors.resetCode = 'Reset code is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:3000/api/auth/forgot-password',
                {
                    username: formData.username,
                    resetCode: formData.resetCode,
                    newPassword: formData.newPassword
                }
            );

            showToast(response.data.message, 'success');
            setFormData({ username: '', resetCode: '', newPassword: '', confirmPassword: '' });
            setErrors({});
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to reset password';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ username: '', resetCode: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70" onClick={handleClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Reset Password
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        Contact your administrator for the reset code. Default code: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">HOSTEL2024</code>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="text"
                        label="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        error={errors.username}
                        placeholder="Enter your username"
                    />

                    <Input
                        type="text"
                        label="Reset Code"
                        value={formData.resetCode}
                        onChange={(e) => setFormData({ ...formData, resetCode: e.target.value })}
                        error={errors.resetCode}
                        placeholder="Enter reset code"
                    />

                    <Input
                        type="password"
                        label="New Password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        error={errors.newPassword}
                        placeholder="Enter new password (min 6 characters)"
                    />

                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        error={errors.confirmPassword}
                        placeholder="Confirm new password"
                    />

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="flex-1"
                        >
                            Reset Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
