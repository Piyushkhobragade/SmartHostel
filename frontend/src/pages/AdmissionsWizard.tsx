import { useState, useEffect } from 'react';
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

interface RoomOption {
    id: string;
    roomNumber: string;
    block: string;
    floor: string;
    type: string;
    capacity: number;
    currentOccupancy: number;
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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [completed, setCompleted] = useState(false);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [residentId, setResidentId] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Form state
    const [personalInfo, setPersonalInfo] = useState({
        fullName: '', email: '', phone: '', dateOfBirth: '', bloodGroup: '', address: '',
    });
    const [guardianInfo, setGuardianInfo] = useState({
        guardianName: '', guardianPhone: '', guardianEmail: '', relationship: '', guardianAddress: '',
    });
    const [roomId, setRoomId] = useState('');
    const [feePlan, setFeePlan] = useState({ amount: 5500, description: 'Monthly Hostel Fee' });

    // Load all rooms on mount — show available ones first, full ones grayed out
    useEffect(() => {
        roomsAPI.getAll()
            .then(r => {
                const all: RoomOption[] = Array.isArray(r.data)
                    ? r.data
                    : Array.isArray(r.data?.data)
                        ? r.data.data
                        : [];
                // Sort: available first, full last
                const sorted = [...all].sort((a, b) => {
                    const aFull = a.currentOccupancy >= a.capacity;
                    const bFull = b.currentOccupancy >= b.capacity;
                    if (aFull === bFull) return a.roomNumber.localeCompare(b.roomNumber);
                    return aFull ? 1 : -1;
                });
                setRooms(sorted);
            })
            .catch(() => setRooms([]));
    }, []);

    const selectedRoom = rooms.find(r => r.id === roomId);

    /* ── Step validation — purely local, no API ─────────── */
    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 1: return !!(personalInfo.fullName.trim() && personalInfo.email.trim() && personalInfo.phone.trim());
            case 2: return !!(guardianInfo.guardianName.trim() && guardianInfo.guardianPhone.trim());
            case 3: return !!roomId;
            case 4: return feePlan.amount > 0 && !!feePlan.description.trim();
            default: return true;
        }
    };

    /* ── Navigation — instant, no API calls ─────────────── */
    const handleNext = () => {
        if (!isStepValid(currentStep)) return;
        setError('');
        setCurrentStep(s => Math.min(s + 1, 5));
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(s => Math.max(s - 1, 1));
    };

    /* ── Final submission — create draft + complete ──────── */
    const handleComplete = async () => {
        setSubmitting(true);
        setError('');
        try {
            // Step 1: create draft with all collected data
            const draftRes = await admissionsAPI.createDraft({
                payload: { personalInfo, guardianInfo, roomId, feePlan }
            });
            const draftId = draftRes.data.id;

            // Step 2: complete admission (creates resident, user account, fee invoice)
            const completeRes = await admissionsAPI.complete({
                draftId,
                feePlan: { amount: feePlan.amount, description: feePlan.description }
            });

            setCredentials(completeRes.data.credentials);
            setResidentId(completeRes.data.residentId || draftId);
            setCompleted(true);
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string; message?: string } } })
                    .response?.data?.error ||
                (e as { response?: { data?: { message?: string } } })
                    .response?.data?.message ||
                'Admission failed. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Credential slip helpers ─────────────────────────── */
    const slipData = credentials ? {
        hostelName: 'Sunrise Boys Hostel',
        hostelPhone: '+91-9876543210',
        hostelEmail: 'warden@sunrisehostel.in',
        studentName: personalInfo.fullName,
        roomNumber: selectedRoom?.roomNumber || 'N/A',
        residentId,
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
                        <div className="flex items-center justify-between p-3 rounded-lg mb-2"
                            style={{ background: 'rgb(var(--bg-app))' }}>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Username</p>
                                <p className="text-lg font-mono font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                                    {credentials.username}
                                </p>
                            </div>
                            <button onClick={() => handleCopy(credentials.username, 'username')}
                                className="p-2 rounded-lg transition-colors hover:bg-black/5">
                                {copied === 'username'
                                    ? <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
                                    : <Copy className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between p-3 rounded-lg"
                            style={{ background: 'rgb(var(--bg-app))' }}>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Temporary Password</p>
                                <p className="text-lg font-mono font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                                    {credentials.tempPassword}
                                </p>
                            </div>
                            <button onClick={() => handleCopy(credentials.tempPassword, 'password')}
                                className="p-2 rounded-lg transition-colors hover:bg-black/5">
                                {copied === 'password'
                                    ? <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
                                    : <Copy className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                        <button onClick={() => slipData && downloadCredentialSlip(slipData)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)' }}>
                            <Download className="w-5 h-5" />
                            Download Credential Slip
                        </button>
                        <button onClick={() => slipData && printCredentialSlip(slipData)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow hover:shadow-md"
                            style={{
                                background: 'rgb(var(--bg-panel))',
                                border: '1px solid rgb(var(--border-color))',
                                color: 'rgb(var(--text-primary))',
                            }}>
                            <Printer className="w-5 h-5" />
                            Print Credential Slip
                        </button>
                    </div>

                    {/* Confirmation */}
                    <div className="rounded-xl p-4 mb-6" style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input type="checkbox" checked={confirmed}
                                onChange={e => setConfirmed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded accent-blue-600" />
                            <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                                I confirm the credentials have been securely recorded.
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={() => navigate('/residents')}
                        disabled={!confirmed}
                        className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                        style={{ background: confirmed ? 'rgb(var(--color-success))' : 'rgb(var(--text-muted))' }}
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
        <div className="animate-fadeIn" style={{ padding: '1.5rem 2rem', maxWidth: '860px', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>New Admission</h1>
                    <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                        Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
                    </p>
                </div>
                <button onClick={() => navigate('/residents')}
                    className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    Cancel
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-1 mb-8">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;
                    return (
                        <div key={step.id} className="flex items-center gap-1" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all`}
                                style={{
                                    background: isActive ? 'rgb(var(--color-primary))' : isDone ? 'rgba(var(--color-success), 0.12)' : 'rgb(var(--bg-panel))',
                                    color: isActive ? '#fff' : isDone ? 'rgb(var(--color-success))' : 'rgb(var(--text-muted))',
                                    border: `1px solid ${isActive ? 'transparent' : isDone ? 'rgba(var(--color-success), 0.3)' : 'rgb(var(--border-color))'}`,
                                    boxShadow: isActive ? '0 2px 8px rgba(var(--color-primary),0.3)' : 'none',
                                }}>
                                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{step.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1"
                                    style={{ background: isDone ? 'rgb(var(--color-success))' : 'rgb(var(--border-color))' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{
                    background: 'rgba(var(--color-danger), 0.08)',
                    border: '1px solid rgba(var(--color-danger), 0.3)',
                    color: 'rgb(var(--color-danger))',
                }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Step Content Card */}
            <div className="rounded-2xl shadow-lg p-6 mb-6" style={{
                background: 'rgb(var(--bg-panel))',
                border: '1px solid rgb(var(--border-color))',
            }}>

                {/* ── Step 1: Personal Info ── */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-lg font-bold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>
                            Student Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Full Name *</label>
                                <input className="input-field" value={personalInfo.fullName}
                                    onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))}
                                    placeholder="e.g. Arjun Sharma" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Email Address *</label>
                                <input className="input-field" type="email" value={personalInfo.email}
                                    onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))}
                                    placeholder="e.g. arjun@college.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Phone Number *</label>
                                <input className="input-field" value={personalInfo.phone}
                                    onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="e.g. 9876543210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Date of Birth</label>
                                <input className="input-field" type="date" value={personalInfo.dateOfBirth}
                                    onChange={e => setPersonalInfo(p => ({ ...p, dateOfBirth: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Blood Group</label>
                                <select className="input-field" value={personalInfo.bloodGroup}
                                    onChange={e => setPersonalInfo(p => ({ ...p, bloodGroup: e.target.value }))}>
                                    <option value="">Select</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg =>
                                        <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Home Address</label>
                                <textarea className="input-field" rows={2} value={personalInfo.address}
                                    onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))}
                                    placeholder="Residential address" />
                            </div>
                        </div>
                        <p className="text-xs mt-4" style={{ color: 'rgb(var(--text-muted))' }}>* Required fields</p>
                    </div>
                )}

                {/* ── Step 2: Guardian Info ── */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-lg font-bold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>
                            Parent / Guardian Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Name *</label>
                                <input className="input-field" value={guardianInfo.guardianName}
                                    onChange={e => setGuardianInfo(g => ({ ...g, guardianName: e.target.value }))}
                                    placeholder="e.g. Ramesh Sharma" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Phone *</label>
                                <input className="input-field" value={guardianInfo.guardianPhone}
                                    onChange={e => setGuardianInfo(g => ({ ...g, guardianPhone: e.target.value }))}
                                    placeholder="e.g. 9876501234" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Email</label>
                                <input className="input-field" type="email" value={guardianInfo.guardianEmail}
                                    onChange={e => setGuardianInfo(g => ({ ...g, guardianEmail: e.target.value }))}
                                    placeholder="e.g. ramesh@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Relationship</label>
                                <select className="input-field" value={guardianInfo.relationship}
                                    onChange={e => setGuardianInfo(g => ({ ...g, relationship: e.target.value }))}>
                                    <option value="">Select</option>
                                    {['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Other'].map(r =>
                                        <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Guardian Address</label>
                                <textarea className="input-field" rows={2} value={guardianInfo.guardianAddress}
                                    onChange={e => setGuardianInfo(g => ({ ...g, guardianAddress: e.target.value }))}
                                    placeholder="Guardian's address" />
                            </div>
                        </div>
                        <p className="text-xs mt-4" style={{ color: 'rgb(var(--text-muted))' }}>* Required fields</p>
                    </div>
                )}

                {/* ── Step 3: Room Selection ── */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-lg font-bold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>Room Assignment</h2>
                        {rooms.length === 0 ? (
                            <p className="text-center py-12" style={{ color: 'rgb(var(--text-muted))' }}>
                                Loading rooms...
                            </p>
                        ) : (
                            <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {rooms.map(room => {
                                    const isSelected = roomId === room.id;
                                    const isFull = room.currentOccupancy >= room.capacity;
                                    const spotsLeft = room.capacity - room.currentOccupancy;
                                    return (
                                        <button key={room.id} onClick={() => setRoomId(room.id)}
                                            className="p-4 rounded-xl text-left transition-all"
                                            style={{
                                                background: isSelected
                                                    ? 'rgba(var(--color-primary), 0.08)'
                                                    : isFull
                                                        ? 'rgba(var(--border-color), 0.3)'
                                                        : 'rgb(var(--bg-app))',
                                                border: `2px solid ${isSelected
                                                    ? 'rgb(var(--color-primary))'
                                                    : isFull
                                                        ? 'rgba(var(--border-color), 0.5)'
                                                        : 'rgb(var(--border-color))'}`,
                                                opacity: isFull && !isSelected ? 0.6 : 1,
                                                boxShadow: isSelected ? '0 0 0 3px rgba(var(--color-primary),0.15)' : 'none',
                                            }}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-base" style={{ color: 'rgb(var(--text-primary))' }}>
                                                    Room {room.roomNumber}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                                    background: isFull
                                                        ? 'rgba(var(--color-danger), 0.10)'
                                                        : 'rgba(var(--color-success), 0.12)',
                                                    color: isFull
                                                        ? 'rgb(var(--color-danger))'
                                                        : 'rgb(var(--color-success))',
                                                }}>
                                                    {isFull ? 'FULL' : `${spotsLeft} free`}
                                                </span>
                                            </div>
                                            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                                                Block {room.block || '—'} • Floor {room.floor || '—'} • {room.type}
                                            </p>
                                            <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                                                style={{ background: 'rgba(var(--border-color), 0.5)' }}>
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min((room.currentOccupancy / room.capacity) * 100, 100)}%`,
                                                        background: isFull
                                                            ? 'rgb(var(--color-danger))'
                                                            : 'rgb(var(--color-success))',
                                                    }} />
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                                {room.currentOccupancy}/{room.capacity} occupied
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs mt-3" style={{ color: 'rgb(var(--text-muted))' }}>
                                Available rooms are shown first. Full rooms can still be selected if needed.
                            </p>
                            </>
                        )}

                        {!roomId && (
                            <p className="text-xs mt-4" style={{ color: 'rgb(var(--color-warning))' }}>
                                Please select a room to continue.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Step 4: Fee Plan ── */}
                {currentStep === 4 && (
                    <div>
                        <h2 className="text-lg font-bold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>Initial Fee Plan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                                    Fee Amount (₹) *
                                </label>
                                <input className="input-field" type="number" min="1"
                                    value={feePlan.amount}
                                    onChange={e => setFeePlan(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                                    Description *
                                </label>
                                <input className="input-field" value={feePlan.description}
                                    onChange={e => setFeePlan(f => ({ ...f, description: e.target.value }))}
                                    placeholder="e.g. Monthly Hostel Fee — June 2026" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 5: Review & Confirm ── */}
                {currentStep === 5 && (
                    <div>
                        <h2 className="text-lg font-bold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>
                            Review & Confirm Admission
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
                                    style={{ color: 'rgb(var(--color-primary))' }}>Personal Information</h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    {[
                                        ['Name', personalInfo.fullName],
                                        ['Email', personalInfo.email],
                                        ['Phone', personalInfo.phone],
                                        ['Blood Group', personalInfo.bloodGroup || '—'],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <span style={{ color: 'rgb(var(--text-muted))' }}>{label}: </span>
                                            <span style={{ color: 'rgb(var(--text-primary))' }}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
                                    style={{ color: 'rgb(var(--color-primary))' }}>Guardian Information</h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    {[
                                        ['Name', guardianInfo.guardianName],
                                        ['Phone', guardianInfo.guardianPhone],
                                        ['Relation', guardianInfo.relationship || '—'],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <span style={{ color: 'rgb(var(--text-muted))' }}>{label}: </span>
                                            <span style={{ color: 'rgb(var(--text-primary))' }}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2"
                                        style={{ color: 'rgb(var(--color-primary))' }}>Room</h3>
                                    <p className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                                        {selectedRoom?.roomNumber}
                                    </p>
                                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                                        Block {selectedRoom?.block} • Floor {selectedRoom?.floor}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: 'rgb(var(--bg-app))' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2"
                                        style={{ color: 'rgb(var(--color-primary))' }}>Initial Fee</h3>
                                    <p className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                                        ₹{feePlan.amount.toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                                        {feePlan.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button onClick={handleBack} disabled={currentStep === 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {currentStep < 5 ? (
                    <button onClick={handleNext} disabled={!isStepValid(currentStep)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: isStepValid(currentStep)
                                ? 'linear-gradient(135deg, #1d4ed8, #4338ca)'
                                : 'rgb(var(--text-muted))',
                            boxShadow: isStepValid(currentStep) ? '0 4px 14px rgba(29,78,216,0.4)' : 'none',
                        }}>
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleComplete} disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: '0 4px 14px rgba(22,163,74,0.4)' }}>
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                            : <><CheckCircle2 className="w-4 h-4" /> Complete Admission</>
                        }
                    </button>
                )}
            </div>
        </div>
    );
}
