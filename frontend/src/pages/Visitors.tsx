import { useState, useEffect } from 'react'
import { visitorsAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, X, LogOut, UserPlus } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
}

interface Visitor {
    id: string
    visitorName: string
    purpose: string
    idType: string
    idLast4: string
    checkInTime: string
    checkOutTime?: string | null
    resident: Resident
}

export default function Visitors() {
    const [visitors, setVisitors] = useState<Visitor[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        visitorName: '',
        residentId: '',
        purpose: '',
        idType: 'AADHAR',
        idLast4: '',
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'INSIDE' | 'EXITED'>('ALL')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [visitorsRes, residentsRes] = await Promise.all([
                visitorsAPI.getAll(),
                residentsAPI.getAll(),
            ])
            setVisitors(visitorsRes.data)
            setResidents(residentsRes.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('Failed to load visitor data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await visitorsAPI.create(formData)
            showToast('Visitor checked in successfully', 'success')
            fetchData()
            resetForm()
        } catch (error) {
            console.error('Failed to check in visitor:', error)
            showToast('Failed to check in visitor', 'error')
        }
    }

    const handleCheckout = async (id: string) => {
        if (!confirm('Check out this visitor?')) return
        try {
            await visitorsAPI.checkout(id)
            showToast('Visitor checked out successfully', 'success')
            fetchData()
        } catch (error) {
            console.error('Failed to checkout visitor:', error)
            showToast('Failed to checkout visitor', 'error')
        }
    }

    const resetForm = () => {
        setFormData({
            visitorName: '',
            residentId: '',
            purpose: '',
            idType: 'AADHAR',
            idLast4: '',
        })
        setShowForm(false)
    }

    const getStatusBadge = (visitor: Visitor) => {
        const isInside = !visitor.checkOutTime
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${isInside
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                {isInside ? 'Inside' : 'Exited'}
            </span>
        )
    }

    const filteredVisitors = visitors.filter(visitor => {
        const matchesSearch = visitor.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            visitor.resident.fullName.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'ALL' ||
            (filterStatus === 'INSIDE' && !visitor.checkOutTime) ||
            (filterStatus === 'EXITED' && visitor.checkOutTime)

        return matchesSearch && matchesStatus
    })

    const columns = [
        {
            header: 'Visitor Name',
            accessor: (item: Visitor) => <span className="font-medium text-gray-900 dark:text-white">{item.visitorName}</span>
        },
        {
            header: 'Resident',
            accessor: (item: Visitor) => <span className="text-gray-700 dark:text-gray-300">{item.resident.fullName}</span>
        },
        { header: 'Purpose', accessor: 'purpose' as keyof Visitor },
        {
            header: 'Check-in',
            accessor: (item: Visitor) => new Date(item.checkInTime).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        {
            header: 'Check-out',
            accessor: (item: Visitor) => item.checkOutTime
                ? new Date(item.checkOutTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '-'
        },
        { header: 'Status', accessor: (item: Visitor) => getStatusBadge(item) },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Visitors</h1>
                    <p className="text-gray-500 mt-1">Log and review hostel visitor entries and exits</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Visitor
                </Button>
            </div>

            {/* Add Visitor Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Check-in Visitor</h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Visitor Name"
                                value={formData.visitorName}
                                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                                placeholder="Enter visitor name"
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Visiting Resident
                                </label>
                                <select
                                    value={formData.residentId}
                                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select resident</option>
                                    {residents.map((resident) => (
                                        <option key={resident.id} value={resident.id}>
                                            {resident.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Purpose of Visit"
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                placeholder="e.g., Personal visit, Delivery"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID Type
                                    </label>
                                    <select
                                        value={formData.idType}
                                        onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="AADHAR">Aadhar</option>
                                        <option value="PAN">PAN</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                        <option value="PASSPORT">Passport</option>
                                    </select>
                                </div>
                                <Input
                                    label="ID Last 4 Digits"
                                    value={formData.idLast4}
                                    onChange={(e) => setFormData({ ...formData, idLast4: e.target.value })}
                                    placeholder="1234"
                                    maxLength={4}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Check In
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'ALL'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('INSIDE')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'INSIDE'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Inside
                    </button>
                    <button
                        onClick={() => setFilterStatus('EXITED')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'EXITED'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Exited
                    </button>
                </div>
            </div>

            <Table
                data={filteredVisitors}
                columns={columns}
                isLoading={loading}
                onSearch={setSearchQuery}
                searchPlaceholder="Search visitors or residents..."
                emptyState={
                    <EmptyState
                        icon={UserPlus}
                        title="No visitor entries"
                        description="New visitor check-ins will appear in this list."
                    />
                }
                actions={(visitor) => (
                    <div className="flex justify-end">
                        {!visitor.checkOutTime && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCheckout(visitor.id); }}
                                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Check out visitor"
                            >
                                <LogOut className="w-4 h-4 mr-1" />
                                Checkout
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    )
}
