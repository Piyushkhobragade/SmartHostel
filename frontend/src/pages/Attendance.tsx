import { useState, useEffect } from 'react'
import { attendanceAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import { Plus, X, CalendarCheck, Calendar } from 'lucide-react'
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

    const getStatusBadge = (status: string) => {
        const styles = {
            PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
            ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
            LATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
            LEAVE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        }
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                {status}
            </span>
        )
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
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                        {item.resident.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white">{item.resident.fullName}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.resident.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Date',
            accessor: (item: Attendance) => (
                <span className="text-gray-700 dark:text-gray-300">
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
            accessor: (item: Attendance) => getStatusBadge(item.status)
        },
        {
            header: 'Check-in Time',
            accessor: (item: Attendance) => (
                <span className="text-gray-700 dark:text-gray-300">
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
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track daily resident presence and timely check-ins</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Mark Attendance
                </Button>
            </div>

            {/* Date Filter Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Filter by Date:</span>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
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
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <CalendarCheck className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mark Attendance</h2>
                            </div>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Resident Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Resident <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.residentId}
                                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status })}
                                            className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${formData.status === status
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Check-in Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Check-in Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.checkInTime}
                                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
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
                    </div>
                </div>
            )}
        </div>
    )
}
