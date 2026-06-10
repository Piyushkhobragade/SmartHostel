import { useState } from 'react';
import Input from './Input';
import Button from './Button';
import Modal from './Modal';
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
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.oldPassword) newErrors.oldPassword = 'Current password is required';
        if (!formData.newPassword) newErrors.newPassword = 'New password is required';
        else if (formData.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
        if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (formData.oldPassword === formData.newPassword) newErrors.newPassword = 'New password must differ from current';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3001/api/auth/change-password',
                { oldPassword: formData.oldPassword, newPassword: formData.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Password changed successfully', 'success');
            handleClose();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            showToast(error.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="password"
                    label="Current Password"
                    value={formData.oldPassword}
                    onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
                    error={errors.oldPassword}
                    placeholder="Enter current password"
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
                        Change Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
