/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { attendanceAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import StatusBadge, { resolveVariant } from '../components/widgets/StatusBadge'
import { Plus, CalendarCheck, Calendar } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
    email: string
}

interface Attendance {
    id: string
    residentId: string
    date: string
    status: string
    checkInTime?: string
    method: string
    resident: Resident
}

export default function Attendance() {
    const [attendance, setAttendance] = useState<Attendance[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [formData, setFormData] = useState({
        residentId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        checkInTime: new Date().toISOString().slice(0, 16),
        method: 'MANUAL'
    })
    const [searchQuery, setSearchQuery] = useState('')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [selectedDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (selectedDate) params.date = selectedDate

            const [attendanceRes, residentsRes] = await Promise.all([
                attendanceAPI.getAll(params),
                residentsAPI.getAll()
            ])
            setAttendance(attendanceRes.data)
            setResidents(residentsRes.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('Failed to load attendance data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await attendanceAPI.mark(formData)
            showToast('Attendance marked successfully', 'success')
            fetchData()
            resetForm()
        } catch (error) {
            console.error('Failed to mark attendance:', error)
            showToast('Failed to mark attendance', 'error')
        }
    }

    const resetForm = () => {
        setFormData({
            residentId: '',
            date: new Date().toISOString().split('T')[0],
            status: 'PRESENT',
            checkInTime: new Date().toISOString().slice(0, 16),
            method: 'MANUAL'
        })
        setShowForm(false)
    }

    const filteredAttendance = attendance.filter(record =>
        record.resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.resident.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns = [
        {
            header: 'Resident',
            accessor: (item: Attendance) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                        style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary-hover)))' }}>
                        {item.resident.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{item.resident.fullName}</span>
                        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{item.resident.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Date',
            accessor: (item: Attendance) => (
                <span style={{ color: 'rgb(var(--text-secondary))' }}>
                    {new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (item: Attendance) => (
                <StatusBadge label={item.status} variant={resolveVariant(item.status)} />
            )
        },
        {
            header: 'Check-in Time',
            accessor: (item: Attendance) => (
                <span style={{ color: 'rgb(var(--text-secondary))' }}>
                    {item.checkInTime
                        ? new Date(item.checkInTime).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        : '-'
                    }
                </span>
            )
        },
        {
            header: 'Method',
            accessor: (item: Attendance) => (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono"
                    style={{ background: 'rgb(var(--bg-app))', border: '1px solid rgb(var(--border-color))', color: 'rgb(var(--text-secondary))' }}>
                    {item.method}
                </span>
            )
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: 'rgb(var(--text-primary))' }}
                    >
                        Attendance
                    </h1>
                    <p
                        className="mt-1"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Track daily resident presence and timely check-ins
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Mark Attendance
                </Button>
            </div>

            {/* Date Filter Card */}
            <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center" style={{ color: 'rgb(var(--text-secondary))' }}>
                        <Calendar className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Filter by Date:</span>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-field w-auto"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="text-sm font-medium transition-colors"
                            style={{ color: 'rgb(var(--color-primary))' }}
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-color))' }}>
                <Table
                    data={filteredAttendance}
                    columns={columns}
                    isLoading={loading}
                    onSearch={setSearchQuery}
                    searchPlaceholder="Search by resident name or email..."
                    emptyState={
                        <EmptyState
                            icon={CalendarCheck}
                            title="No attendance records found"
                            description="Mark attendance for residents to see records here."
                            action={
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Mark Attendance
                                </Button>
                            }
                        />
                    }
                />
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title="Record Attendance"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Resident Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Resident <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.residentId}
                            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                            className="input-field"
                            required
                        >
                            <option value="">Select a resident</option>
                            {residents.map((resident) => (
                                <option key={resident.id} value={resident.id}>
                                    {resident.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Status <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status })}
                                    className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${formData.status === status
                                        ? 'border-[rgb(var(--color-primary))]'
                                        : 'border-[rgb(var(--border-color))]'
                                        }`}
                                    style={formData.status === status
                                        ? { background: 'rgba(var(--color-primary), 0.10)', color: 'rgb(var(--color-primary))' }
                                        : { background: 'rgb(var(--bg-panel))', color: 'rgb(var(--text-secondary))' }
                                    }
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Check-in Time */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Check-in Time
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.checkInTime}
                            onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={resetForm}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Save Record
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
