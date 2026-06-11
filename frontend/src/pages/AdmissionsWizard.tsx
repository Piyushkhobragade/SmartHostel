import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { admissionsAPI, roomsAPI } from '../services/api';
import { downloadCredentialSlip, printCredentialSlip } from '../utils/generateCredentialSlip';
import {
    ChevronLeft, ChevronRight, User, Users, DoorOpen,
    CreditCard, FileCheck, CheckCircle2, Download, Printer,
    AlertTriangle, Copy, Check, Loader2
} from 'lucide-react';

/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */

interface DraftPayload {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        dateOfBirth?: string;
        bloodGroup?: string;
        address?: string;
    };
    guardianInfo: {
        guardianName: string;
        guardianPhone: string;
        guardianEmail?: string;
        relationship?: string;
        guardianAddress?: string;
    };
    roomId: string;
    feePlan: {
        amount: number;
        description: string;
    };
}

interface RoomOption {
    id: string;
    roomNumber: string;
    block: string;
    floor: string;
    type: string;
    capacity: number;
    currentOccupancy: number;
    status: string;
}

interface Credentials {
    username: string;
    tempPassword: string;
}

/* ════════════════════════════════════════════════════════
   Step Configuration
   ════════════════════════════════════════════════════════ */

const STEPS = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Guardian Info', icon: Users },
    { id: 3, label: 'Room Selection', icon: DoorOpen },
    { id: 4, label: 'Fee Plan', icon: CreditCard },
    { id: 5, label: 'Review & Confirm', icon: FileCheck },
];

/* ════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════ */

export default function AdmissionsWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [completed, setCompleted] = useState(false);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [residentId, setResidentId] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Form data
    const [personalInfo, setPersonalInfo] = useState({
        fullName: '', email: '', phone: '', dateOfBirth: '', bloodGroup: '', address: '',
    });
    const [guardianInfo, setGuardianInfo] = useState({
        guardianName: '', guardianPhone: '', guardianEmail: '', relationship: '', guardianAddress: '',
    });
    const [roomId, setRoomId] = useState('');
    const [feePlan, setFeePlan] = useState({ amount: 5500, description: 'Monthly Hostel Fee' });

    // Load rooms once
    useEffect(() => {
        roomsAPI.getAll().then(r => {
            const available = (r.data as RoomOption[]).filter(
                (rm: RoomOption) => rm.currentOccupancy < rm.capacity
            );
            setRooms(available);
        }).catch(() => {});
    }, []);

    const selectedRoom = rooms.find(r => r.id === roomId);

    /* ── Draft persistence ─────────────────────────────── */

    const saveDraft = useCallback(async () => {
        const payload: DraftPayload = { personalInfo, guardianInfo, roomId, feePlan };
        setSaving(true);
        setError('');
        try {
            if (!draftId) {
                const res = await admissionsAPI.createDraft({ payload });
                setDraftId(res.data.id);
            } else {
                await admissionsAPI.updateDraft(draftId, { payload });
            }
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to save draft.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    }, [draftId, personalInfo, guardianInfo, roomId, feePlan]);

    /* ── Step validation ───────────────────────────────── */

    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(personalInfo.fullName.trim() && personalInfo.email.trim() && personalInfo.phone.trim());
            case 2:
                return !!(guardianInfo.guardianName.trim() && guardianInfo.guardianPhone.trim());
            case 3:
                return !!roomId;
            case 4:
                return feePlan.amount > 0 && !!feePlan.description.trim();
            default:
                return true;
        }
    };

    const handleNext = async () => {
        if (!isStepValid(currentStep)) return;
        await saveDraft();
        setCurrentStep(s => Math.min(s + 1, 5));
    };

    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

    /* ── Submission ─────────────────────────────────────── */

    const handleComplete = async () => {
        if (!draftId) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await admissionsAPI.complete({ draftId, feePlan });
            setCredentials(res.data.credentials);
            setResidentId(res.data.residentId || draftId);
            setCompleted(true);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Admission failed.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Credential slip helpers ────────────────────────── */

    const slipData = credentials ? {
        hostelName: 'Sunrise Boys Hostel',
        hostelPhone: '+91-9876543210',
        hostelEmail: 'warden@sunrisehostel.in',
        studentName: personalInfo.fullName,
        roomNumber: selectedRoom?.roomNumber || 'N/A',
        residentId: residentId,
        username: credentials.username,
        tempPassword: credentials.tempPassword,
        issuedBy: user?.username || 'admin',
    } : null;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    /* ════════════════════════════════════════════════════
       COMPLETION SCREEN
       ════════════════════════════════════════════════════ */

    if (completed && credentials && slipData) {
        return (
            <div className="animate-fadeIn" style={{ padding: '2rem' }}>
                <div className="max-w-2xl mx-auto">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(var(--color-success), 0.12)' }}>
                            <CheckCircle2 className="w-10 h-10" style={{ color: 'rgb(var(--color-success))' }} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                            Admission Complete
                        </h1>
                        <p style={{ color: 'rgb(var(--text-secondary))' }}>
                            {personalInfo.fullName} has been admitted to Room {selectedRoom?.roomNumber}.
                        </p>
                    </div>

                    {/* Credential Card */}
                    <div className="rounded-2xl shadow-lg p-6 mb-6" style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
                            Login Credentials
                        </h2>

                        {/* Warning Banner */}
                        <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{
                            background: 'rgba(var(--color-warning), 0.08)',
                            border: '1px solid rgba(var(--color-warning), 0.25)',
                        }}>
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--color-warning))' }} />
                            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                                These credentials will <strong>NOT</strong> be shown again. Download or print the credential slip before leaving this page.
                            </p>
                        </div>

                        {/* Username */}
                        <div className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: 'rgb(var(--bg-app))' }}>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Username</p>
                                <p className="text-lg font-mono font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{credentials.username}</p>
                            </div>
                            <button onClick={() => handleCopy(credentials.username, 'username')} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                                {copied === 'username' ? <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} /> : <Copy className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgb(var(--bg-app))' }}>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Temporary Password</p>
                                <p className="text-lg font-mono font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{credentials.tempPassword}</p>
                            </div>
                            <button onClick={() => handleCopy(credentials.tempPassword, 'password')} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                                {copied === 'password' ? <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} /> : <Copy className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={() => downloadCredentialSlip(slipData)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-5 h-5" />
                            Download Credential Slip
                        </button>
                        <button
                            onClick={() => printCredentialSlip(slipData)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow hover:shadow-md"
                            style={{
                                background: 'rgb(var(--bg-panel))',
                                border: '1px solid rgb(var(--border-color))',
                                color: 'rgb(var(--text-primary))',
                            }}
                        >
                            <Printer className="w-5 h-5" />
                            Print Credential Slip
                        </button>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="rounded-xl p-4 mb-6" style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={e => setConfirmed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded accent-blue-600"
                            />
                            <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                                I confirm the credentials have been securely recorded.
                            </span>
                        </label>
                    </div>

                    {/* Done */}
                    <button
                        onClick={() => navigate('/residents')}
                        disabled={!confirmed}
                        className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: confirmed ? 'rgb(var(--color-success))' : 'rgb(var(--bg-panel))',
                            color: confirmed ? '#fff' : 'rgb(var(--text-muted))',
                            border: confirmed ? 'none' : '1px solid rgb(var(--border-color))',
                        }}
                    >
                        Done — Return to Residents
                    </button>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════
       WIZARD STEPS
       ════════════════════════════════════════════════════ */

    return (
        <div className="animate-fadeIn" style={{ padding: '1.5rem 2rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>New Admission</h1>
                    <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Complete all steps to admit a new resident.</p>
                </div>
                <button onClick={() => navigate('/residents')} className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    Cancel
                </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;
                    return (
                        <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'shadow-md' : ''}`}
                                style={{
                                    background: isActive ? 'rgb(var(--color-primary))' : isDone ? 'rgba(var(--color-success), 0.10)' : 'rgb(var(--bg-panel))',
                                    color: isActive ? '#fff' : isDone ? 'rgb(var(--color-success))' : 'rgb(var(--text-muted))',
                                    border: `1px solid ${isActive ? 'transparent' : isDone ? 'rgba(var(--color-success), 0.25)' : 'rgb(var(--border-color))'}`,
                                }}>
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                <span className="hidden sm:inline">{step.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="w-6 h-0.5" style={{ background: isDone ? 'rgb(var(--color-success))' : 'rgb(var(--border-color))' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{
                    background: 'rgba(var(--color-danger), 0.08)',
                    border: '1px solid rgba(var(--color-danger), 0.30)',
                    color: 'rgb(var(--color-danger))',
                }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div className="rounded-2xl shadow-lg p-6 mb-6" style={{
                background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))',
            }}>
                {/* ── Step 1: Personal Info ──────────────────── */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Student Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Full Name *</label>
                                <input className="input-field" value={personalInfo.fullName} onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Arjun Sharma" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Email *</label>
                                <input className="input-field" type="email" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} placeholder="e.g. arjun@student.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Phone *</label>
                                <input className="input-field" value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Date of Birth</label>
                                <input className="input-field" type="date" value={personalInfo.dateOfBirth} onChange={e => setPersonalInfo(p => ({ ...p, dateOfBirth: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Blood Group</label>
                                <select className="input-field" value={personalInfo.bloodGroup} onChange={e => setPersonalInfo(p => ({ ...p, bloodGroup: e.target.value }))}>
                                    <option value="">Select</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Address</label>
                                <textarea className="input-field" rows={2} value={personalInfo.address} onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))} placeholder="Residential address" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Guardian Info ──────────────────── */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Parent / Guardian Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Name *</label>
                                <input className="input-field" value={guardianInfo.guardianName} onChange={e => setGuardianInfo(g => ({ ...g, guardianName: e.target.value }))} placeholder="e.g. Ramesh Sharma" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Phone *</label>
                                <input className="input-field" value={guardianInfo.guardianPhone} onChange={e => setGuardianInfo(g => ({ ...g, guardianPhone: e.target.value }))} placeholder="e.g. 9876501234" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Email</label>
                                <input className="input-field" type="email" value={guardianInfo.guardianEmail} onChange={e => setGuardianInfo(g => ({ ...g, guardianEmail: e.target.value }))} placeholder="e.g. ramesh@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Relationship</label>
                                <select className="input-field" value={guardianInfo.relationship} onChange={e => setGuardianInfo(g => ({ ...g, relationship: e.target.value }))}>
                                    <option value="">Select</option>
                                    {['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Address</label>
                                <textarea className="input-field" rows={2} value={guardianInfo.guardianAddress} onChange={e => setGuardianInfo(g => ({ ...g, guardianAddress: e.target.value }))} placeholder="Guardian's residential address" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Room Selection ─────────────────── */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Room Assignment</h2>
                        {rooms.length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'rgb(var(--text-muted))' }}>No rooms with available capacity found.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {rooms.map(room => {
                                    const isSelected = roomId === room.id;
                                    const spotsLeft = room.capacity - room.currentOccupancy;
                                    return (
                                        <button
                                            key={room.id}
                                            onClick={() => setRoomId(room.id)}
                                            className="p-4 rounded-xl text-left transition-all"
                                            style={{
                                                background: isSelected ? 'rgba(var(--color-primary), 0.08)' : 'rgb(var(--bg-app))',
                                                border: `2px solid ${isSelected ? 'rgb(var(--color-primary))' : 'rgb(var(--border-color))'}`,
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{room.roomNumber}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                                    background: 'rgba(var(--color-success), 0.10)',
                                                    color: 'rgb(var(--color-success))',
                                                }}>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''}</span>
                                            </div>
                                            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                                                Block {room.block} • Floor {room.floor} • {room.type}
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                                {room.currentOccupancy} / {room.capacity} occupied
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 4: Fee Plan ───────────────────────── */}
                {currentStep === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Initial Fee Plan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Fee Amount (₹) *</label>
                                <input className="input-field" type="number" value={feePlan.amount} onChange={e => setFeePlan(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Description *</label>
                                <input className="input-field" value={feePlan.description} onChange={e => setFeePlan(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Monthly Hostel Fee — June 2026" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 5: Review & Confirm ──────────────── */}
                {currentStep === 5 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Review & Confirm Admission</h2>

                        <div className="space-y-4">
                            {/* Personal */}
                            <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--color-primary))' }}>Personal Information</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span style={{ color: 'rgb(var(--text-muted))' }}>Name:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{personalInfo.fullName}</span></div>
                                    <div><span style={{ color: 'rgb(var(--text-muted))' }}>Email:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{personalInfo.email}</span></div>
                                    <div><span style={{ color: 'rgb(var(--text-muted))' }}>Phone:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{personalInfo.phone}</span></div>
                                    {personalInfo.bloodGroup && <div><span style={{ color: 'rgb(var(--text-muted))' }}>Blood:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{personalInfo.bloodGroup}</span></div>}
                                </div>
                            </div>

                            {/* Guardian */}
                            <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--color-primary))' }}>Guardian Information</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span style={{ color: 'rgb(var(--text-muted))' }}>Name:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{guardianInfo.guardianName}</span></div>
                                    <div><span style={{ color: 'rgb(var(--text-muted))' }}>Phone:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{guardianInfo.guardianPhone}</span></div>
                                    {guardianInfo.relationship && <div><span style={{ color: 'rgb(var(--text-muted))' }}>Relation:</span> <span style={{ color: 'rgb(var(--text-primary))' }}>{guardianInfo.relationship}</span></div>}
                                </div>
                            </div>

                            {/* Room & Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                    <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--color-primary))' }}>Room</h3>
                                    <p className="text-lg font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{selectedRoom?.roomNumber || '—'}</p>
                                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Block {selectedRoom?.block} • Floor {selectedRoom?.floor}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                    <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--color-primary))' }}>Fee</h3>
                                    <p className="text-lg font-bold" style={{ color: 'rgb(var(--text-primary))' }}>₹{feePlan.amount.toLocaleString()}</p>
                                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{feePlan.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
                <button onClick={handleBack} disabled={currentStep === 1} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving draft...</>}
                    {draftId && !saving && <span>Draft saved</span>}
                </div>

                {currentStep < 5 ? (
                    <button onClick={handleNext} disabled={!isStepValid(currentStep) || saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleComplete} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CheckCircle2 className="w-4 h-4" /> Complete Admission</>}
                    </button>
                )}
            </div>
        </div>
    );
}
