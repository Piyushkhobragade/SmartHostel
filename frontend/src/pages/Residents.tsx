import { useState, useEffect } from 'react'
import { residentsAPI, attendanceAPI, roomsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, Pencil, Trash2, X, User, Phone, Mail, Home, Clock, UserPlus } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
    email: string
    phone: string
    status: string
    roomId?: string | null
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

export default function Residents() {
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
        status: 'ACTIVE'
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ALLOCATED' | 'UNALLOCATED'>('ALL')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [residentsRes, roomsRes, attendanceRes] = await Promise.all([
                residentsAPI.getAll(),
                roomsAPI.getAll(),
                attendanceAPI.getAll()
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
            if (editingResident) {
                await residentsAPI.update(editingResident.id, formData)
                showToast('Resident updated successfully', 'success')
            } else {
                await residentsAPI.create(formData)
                showToast('Resident created successfully', 'success')
            }
            // Refresh residents only
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
            status: resident.status
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this resident?')) {
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
    }

    const resetForm = () => {
        setFormData({ fullName: '', email: '', phone: '', status: 'ACTIVE' })
        setEditingResident(null)
        setShowForm(false)
    }

    const getResidentRoom = (roomId?: string | null) => {
        if (!roomId) return null
        return rooms.find(r => r.id === roomId)
    }

    const getRecentAttendance = (residentId: string) => {
        return attendance
            .filter(a => a.residentId === residentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
    }

    const filteredResidents = residents.filter(resident => {
        const matchesSearch =
            resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resident.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter =
            filterStatus === 'ALL' ||
            (filterStatus === 'ALLOCATED' && resident.roomId) ||
            (filterStatus === 'UNALLOCATED' && !resident.roomId)

        return matchesSearch && matchesFilter
    })

    const columns = [
        {
            header: 'Name',
            accessor: (item: Resident) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                        {item.fullName.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.fullName}</span>
                </div>
            )
        },
        { header: 'Email', accessor: 'email' as keyof Resident },
        {
            header: 'Status',
            accessor: (item: Resident) => (
                <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    } `}>
                    {item.status}
                </span>
            )
        },
        {
            header: 'Room',
            accessor: (item: Resident) => {
                const room = getResidentRoom(item.roomId)
                return room ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Room {room.roomNumber}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:text-white">
                        Unallocated
                    </span>
                )
            }
        },
    ]

    return (
        <div className="flex h-[calc(100vh-theme(spacing.32))]">
            {/* Main Content */}
            <div className="flex-1 flex flex-col space-y-6 min-w-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Residents</h1>
                        <p className="text-gray-500 mt-1">Manage student registrations and room assignments</p>
                    </div>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Register Resident
                    </Button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setFilterStatus('ALL')}
                            className={`px - 3 py - 1.5 text - sm font - medium rounded - md transition - colors ${filterStatus === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                } `}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('ALLOCATED')}
                            className={`px - 3 py - 1.5 text - sm font - medium rounded - md transition - colors ${filterStatus === 'ALLOCATED' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                } `}
                        >
                            Allocated
                        </button>
                        <button
                            onClick={() => setFilterStatus('UNALLOCATED')}
                            className={`px - 3 py - 1.5 text - sm font - medium rounded - md transition - colors ${filterStatus === 'UNALLOCATED' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                } `}
                        >
                            Unallocated
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <Table
                        data={filteredResidents}
                        columns={columns}
                        isLoading={loading}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Search residents..."
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
                        actions={(resident) => (
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedResident(resident); }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <User className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(resident); }}
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(resident.id); }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div >

            {/* Detail Drawer */}
            {
                selectedResident && (
                    <div className="w-96 border-l border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 overflow-y-auto shadow-xl z-10 ml-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resident Details</h2>
                            <button onClick={() => setSelectedResident(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-3">
                                {selectedResident.fullName.charAt(0)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedResident.fullName}</h3>
                            <span className={`mt - 2 px - 3 py - 1 rounded - full text - xs font - medium ${selectedResident.roomId ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                } `}>
                                {selectedResident.roomId ? 'Resident' : 'Not Allocated'}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Contact Info</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                                        <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                        {selectedResident.email}
                                    </div>
                                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                                        <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                        {selectedResident.phone}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Room Allocation</h4>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {selectedResident.roomId ? (
                                        <div className="flex items-center">
                                            <Home className="w-5 h-5 text-blue-500 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Room {getResidentRoom(selectedResident.roomId)?.roomNumber}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Allocated</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                                            No room allocated
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Attendance</h4>
                                <div className="space-y-3">
                                    {getRecentAttendance(selectedResident.id).length > 0 ? (
                                        getRecentAttendance(selectedResident.id).map(record => (
                                            <div key={record.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(record.date).toLocaleDateString()}
                                                </div>
                                                <span className={`px - 2 py - 0.5 rounded text - xs font - medium ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    } `}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No attendance records found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add/Edit Modal */}
            {
                showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetForm} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingResident ? 'Edit Resident' : 'Add New Resident'}
                                </h2>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        {editingResident ? 'Update' : 'Create'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
