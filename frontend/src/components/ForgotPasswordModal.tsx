/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { Info } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        resetCode: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.username)       newErrors.username    = 'Username is required';
        if (!formData.resetCode)      newErrors.resetCode   = 'Reset code is required';
        if (!formData.newPassword)    newErrors.newPassword = 'New password is required';
        else if (formData.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
        if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const response = await authAPI.forgotPassword({
                username: formData.username,
                resetCode: formData.resetCode,
                newPassword: formData.newPassword,
            });
            showToast(response.data.message, 'success');
            handleClose();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ username: '', resetCode: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
            {/* Info banner */}
            <div
                className="flex gap-2 p-3 rounded-lg mb-4 text-sm"
                style={{
                    background: 'rgba(var(--color-info), 0.10)',
                    border: '1px solid rgba(var(--color-info), 0.30)',
                    color: 'rgb(var(--color-info))',
                }}
            >
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                    Contact your system administrator to obtain your password reset code.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="text"
                    label="Username"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    error={errors.username}
                    placeholder="Enter your username"
                />
                <Input
                    type="text"
                    label="Reset Code"
                    value={formData.resetCode}
                    onChange={e => setFormData({ ...formData, resetCode: e.target.value })}
                    error={errors.resetCode}
                    placeholder="Enter reset code"
                />
                <Input
                    type="password"
                    label="New Password"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    error={errors.newPassword}
                    placeholder="Enter new password (min 6 characters)"
                />
                <Input
                    type="password"
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    placeholder="Confirm new password"
                />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose} fullWidth>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
                        Reset Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
