import { useState } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.oldPassword) {
            newErrors.oldPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.oldPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/auth/change-password',
                {
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            showToast('Password changed successfully', 'success');
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setErrors({});
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to change password';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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
                        Change Password
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        label="Current Password"
                        value={formData.oldPassword}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        error={errors.oldPassword}
                        placeholder="Enter current password"
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
                            Change Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
