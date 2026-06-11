/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { residentsAPI, attendanceAPI, roomsAPI } from '../services/api'
import { DataGrid } from '../components/DataGrid'
import type { ColumnDef, BulkAction } from '../components/DataGrid'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import StatusBadge, { resolveVariant } from '../components/widgets/StatusBadge'
import { Plus, Pencil, Trash2, X, User, Phone, Mail, Home, Clock, UserPlus, ClipboardList } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResidentRoom {
    id: string
    roomNumber: string
}

interface Resident {
    id: string
    fullName: string
    email: string
    phone: string
    status: string
    room: ResidentRoom | null
}

interface Attendance {
    id: string
    date: string
    status: string
    residentId: string
}

interface Room {
    id: string
    roomNumber: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Residents() {
    const navigate = useNavigate()
    const [residents, setResidents] = useState<Resident[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [attendance, setAttendance] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingResident, setEditingResident] = useState<Resident | null>(null)
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        roomId: '',
    })
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [residentsRes, roomsRes, attendanceRes] = await Promise.all([
                residentsAPI.getAll(),
                roomsAPI.getAll(),
                attendanceAPI.getAll(),
            ])
            setResidents(residentsRes.data)
            setRooms(roomsRes.data)
            setAttendance(attendanceRes.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                ...(formData.roomId ? { roomId: formData.roomId } : {}),
            }
            if (editingResident) {
                await residentsAPI.update(editingResident.id, payload)
                showToast('Resident updated successfully', 'success')
            } else {
                await residentsAPI.create(payload)
                showToast('Resident created successfully', 'success')
            }
            const res = await residentsAPI.getAll()
            setResidents(res.data)
            resetForm()
        } catch (error) {
            console.error('Failed to save resident:', error)
            showToast('Failed to save resident', 'error')
        }
    }

    const handleEdit = (resident: Resident) => {
        setEditingResident(resident)
        setFormData({
            fullName: resident.fullName,
            email: resident.email,
            phone: resident.phone,
            status: resident.status,
            roomId: resident.room?.id ?? '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resident?')) return
        try {
            await residentsAPI.delete(id)
            showToast('Resident deleted successfully', 'success')
            const res = await residentsAPI.getAll()
            setResidents(res.data)
            if (selectedResident?.id === id) setSelectedResident(null)
        } catch (error) {
            console.error('Failed to delete resident:', error)
            showToast('Failed to delete resident', 'error')
        }
    }

    const handleBulkDelete = async (selected: Resident[]) => {
        if (!confirm(`Delete ${selected.length} resident(s)? This cannot be undone.`)) return
        try {
            await Promise.all(selected.map((r) => residentsAPI.delete(r.id)))
            showToast(`${selected.length} resident(s) deleted`, 'success')
            const res = await residentsAPI.getAll()
            setResidents(res.data)
            if (selectedResident && selected.some((r) => r.id === selectedResident.id)) {
                setSelectedResident(null)
            }
        } catch (error) {
            console.error('Failed to bulk delete residents:', error)
            showToast('Failed to delete some residents', 'error')
        }
    }

    const resetForm = () => {
        setFormData({ fullName: '', email: '', phone: '', status: 'ACTIVE', roomId: '' })
        setEditingResident(null)
        setShowForm(false)
    }

    const handleCloseForm = () => {
        resetForm()
    }

    const getRecentAttendance = (residentId: string) =>
        attendance
            .filter((a) => a.residentId === residentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)

    // ── Column definitions ──────────────────────────────────────────────────

    const columns: ColumnDef<Resident>[] = [
        {
            key: 'fullName',
            header: 'Name',
            accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{
                            background: 'rgba(var(--color-primary), 0.15)',
                            color: 'rgb(var(--color-primary))',
                        }}
                    >
                        {row.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[rgb(var(--text-primary))]">{row.fullName}</span>
                </div>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            accessor: 'email',
            sortable: true,
        },
        {
            key: 'phone',
            header: 'Phone',
            accessor: 'phone',
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (r) => <StatusBadge label={r.status} variant={resolveVariant(r.status)} />,
            sortable: true,
            filterOptions: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
            ],
        },
        {
            key: 'room',
            header: 'Room',
            accessor: (row) =>
                row.room ? (
                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            background: 'rgba(var(--color-success), 0.12)',
                            color: 'rgb(var(--color-success))',
                        }}
                    >
                        Room {row.room.roomNumber}
                    </span>
                ) : (
                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            background: 'rgba(var(--border-color), 0.4)',
                            color: 'rgb(var(--text-muted))',
                        }}
                    >
                        Unallocated
                    </span>
                ),
        },
    ]

    // ── Bulk actions ────────────────────────────────────────────────────────

    const bulkActions: BulkAction<Resident>[] = [
        {
            label: 'Delete Selected',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            variant: 'danger',
            onClick: handleBulkDelete,
        },
    ]

    // ── Search filter ───────────────────────────────────────────────────────

    const searchFilter = (row: Resident, query: string) => {
        const q = query.toLowerCase()
        return (
            row.fullName.toLowerCase().includes(q) ||
            row.email.toLowerCase().includes(q) ||
            row.phone.toLowerCase().includes(q)
        )
    }

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100vh-theme(spacing.32))] gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col">
                <DataGrid<Resident>
                    data={residents}
                    columns={columns}
                    loading={loading}
                    title="Residents"
                    subtitle="Manage student registrations and room assignments"
                    selectable={true}
                    bulkActions={bulkActions}
                    searchFilter={searchFilter}
                    csvExport={{ filename: 'residents' }}
                    toolbarActions={
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => navigate('/admissions/new')}>
                                <ClipboardList className="w-4 h-4 mr-2" />
                                New Admission
                            </Button>
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Register Resident
                            </Button>
                        </div>
                    }
                    emptyState={
                        <EmptyState
                            icon={UserPlus}
                            title="No residents found"
                            description="Add new resident registrations here."
                            action={
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Register Resident
                                </Button>
                            }
                        />
                    }
                    rowActions={(resident) => (
                        <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedResident(resident) }}
                                className="p-1.5 rounded text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.1)] transition-colors"
                                title="View details"
                            >
                                <User className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(resident) }}
                                className="p-1.5 rounded text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--border-color),0.4)] transition-colors"
                                title="Edit resident"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(resident.id) }}
                                className="p-1.5 rounded text-[rgb(var(--color-danger))] hover:bg-[rgba(var(--color-danger),0.1)] transition-colors"
                                title="Delete resident"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Detail Drawer */}
            {selectedResident && (
                <div className="w-96 flex-shrink-0 border-l border-[rgb(var(--border-color))] bg-[rgb(var(--bg-panel))] p-6 overflow-y-auto shadow-xl z-10">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Resident Details</h2>
                        <button
                            onClick={() => setSelectedResident(null)}
                            className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                            style={{
                                background: 'rgba(var(--color-primary), 0.15)',
                                color: 'rgb(var(--color-primary))',
                            }}
                        >
                            {selectedResident.fullName.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
                            {selectedResident.fullName}
                        </h3>
                        <span
                            className="mt-2 px-3 py-1 rounded-full text-xs font-medium"
                            style={
                                selectedResident.room
                                    ? { background: 'rgba(var(--color-success), 0.12)', color: 'rgb(var(--color-success))' }
                                    : { background: 'rgba(var(--color-warning), 0.12)', color: 'rgb(var(--color-warning))' }
                            }
                        >
                            {selectedResident.room ? 'Resident' : 'Not Allocated'}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div>
                            <h4 className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-3">
                                Contact Info
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center text-[rgb(var(--text-secondary))]">
                                    <Mail className="w-4 h-4 mr-3 text-[rgb(var(--text-muted))]" />
                                    {selectedResident.email}
                                </div>
                                <div className="flex items-center text-[rgb(var(--text-secondary))]">
                                    <Phone className="w-4 h-4 mr-3 text-[rgb(var(--text-muted))]" />
                                    {selectedResident.phone}
                                </div>
                            </div>
                        </div>

                        {/* Room Allocation */}
                        <div>
                            <h4 className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-3">
                                Room Allocation
                            </h4>
                            <div className="rounded-lg p-4" style={{ background: 'rgba(var(--border-color), 0.2)' }}>
                                {selectedResident.room ? (
                                    <div className="flex items-center">
                                        <Home className="w-5 h-5 mr-3" style={{ color: 'rgb(var(--color-primary))' }} />
                                        <div>
                                            <p className="font-medium text-[rgb(var(--text-primary))]">
                                                Room {selectedResident.room.roomNumber}
                                            </p>
                                            <p className="text-sm text-[rgb(var(--text-muted))]">Allocated</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-[rgb(var(--text-muted))]">
                                        No room allocated
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div>
                            <h4 className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-3">
                                Recent Attendance
                            </h4>
                            <div className="space-y-3">
                                {getRecentAttendance(selectedResident.id).length > 0 ? (
                                    getRecentAttendance(selectedResident.id).map((record) => (
                                        <div key={record.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-[rgb(var(--text-secondary))]">
                                                <Clock className="w-4 h-4 mr-2 text-[rgb(var(--text-muted))]" />
                                                {new Date(record.date).toLocaleDateString()}
                                            </div>
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-medium"
                                                style={
                                                    record.status === 'PRESENT'
                                                        ? { background: 'rgba(var(--color-success), 0.12)', color: 'rgb(var(--color-success))' }
                                                        : record.status === 'ABSENT'
                                                            ? { background: 'rgba(var(--color-danger), 0.12)', color: 'rgb(var(--color-danger))' }
                                                            : { background: 'rgba(var(--color-warning), 0.12)', color: 'rgb(var(--color-warning))' }
                                                }
                                            >
                                                {record.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-[rgb(var(--text-muted))] italic">
                                        No attendance records found
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={showForm}
                onClose={handleCloseForm}
                title={editingResident ? 'Edit Resident' : 'Register Resident'}
                maxWidth="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="input-field w-full"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                            Room Allocation
                        </label>
                        <select
                            value={formData.roomId}
                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                            className="input-field w-full"
                        >
                            <option value="">— Unallocated —</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    Room {room.roomNumber}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseForm}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingResident ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
