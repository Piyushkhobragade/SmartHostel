import { useState, useEffect } from 'react'
import { maintenanceAPI, residentsAPI, assetsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import { Plus, X, Wrench, ArrowRight, CheckCircle } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
}

interface Asset {
    id: string
    name: string
    category: string
}

interface MaintenanceRequest {
    id: string
    category: string
    description: string
    status: string
    createdAt: string
    resident?: Resident | null
    asset?: Asset | null
}

export default function Maintenance() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        category: 'Electrical',
        description: '',
        residentId: '',
        assetId: ''
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL')
    const [filterCategory, setFilterCategory] = useState<'ALL' | string>('ALL')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [requestsRes, residentsRes, assetsRes] = await Promise.all([
                maintenanceAPI.getAll(),
                residentsAPI.getAll(),
                assetsAPI.getAll()
            ])
            setRequests(requestsRes.data)
            setResidents(residentsRes.data)
            setAssets(assetsRes.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('Failed to load maintenance requests', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const submitData = {
                ...formData,
                residentId: formData.residentId || undefined,
                assetId: formData.assetId || undefined
            }

            await maintenanceAPI.create(submitData)
            showToast('Maintenance request created successfully', 'success')
            fetchData()
            resetForm()
        } catch (error) {
            console.error('Failed to create request:', error)
            showToast('Failed to create maintenance request', 'error')
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await maintenanceAPI.updateStatus(id, newStatus)
            showToast('Status updated successfully', 'success')
            fetchData()
        } catch (error) {
            console.error('Failed to update status:', error)
            showToast('Failed to update status', 'error')
        }
    }

    const resetForm = () => {
        setFormData({
            category: 'Electrical',
            description: '',
            residentId: '',
            assetId: ''
        })
        setShowForm(false)
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
            RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
        }
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
            </span>
        )
    }

    const getCategoryBadge = (category: string) => {
        const styles = {
            Electrical: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            Plumbing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            Cleaning: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
            Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        }
        return (
            <span className={`px-2 py-1 inline-flex text-xs font-medium rounded ${styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {category}
            </span>
        )
    }

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.resident?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.asset?.name.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'ALL' ||
            req.status === filterStatus

        const matchesCategory =
            filterCategory === 'ALL' ||
            req.category === filterCategory

        return matchesSearch && matchesStatus && matchesCategory
    })

    const columns = [
        {
            header: 'Issue',
            accessor: (item: MaintenanceRequest) => (
                <div className="max-w-xs">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{item.description}</p>
                </div>
            )
        },
        {
            header: 'Category',
            accessor: (item: MaintenanceRequest) => getCategoryBadge(item.category)
        },
        {
            header: 'Asset',
            accessor: (item: MaintenanceRequest) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {item.asset?.name || '-'}
                </span>
            )
        },
        {
            header: 'Resident',
            accessor: (item: MaintenanceRequest) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {item.resident?.fullName || '-'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (item: MaintenanceRequest) => getStatusBadge(item.status)
        },
        {
            header: 'Created',
            accessor: (item: MaintenanceRequest) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </span>
            )
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Maintenance Requests</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Handle hostel complaints and maintenance tasks</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Report Issue
                </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
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
                            onClick={() => setFilterStatus('OPEN')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'OPEN'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Open
                        </button>
                        <button
                            onClick={() => setFilterStatus('IN_PROGRESS')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'IN_PROGRESS'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            In Progress
                        </button>
                        <button
                            onClick={() => setFilterStatus('RESOLVED')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'RESOLVED'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Resolved
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setFilterCategory('ALL')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterCategory === 'ALL'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterCategory('Electrical')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterCategory === 'Electrical'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Electrical
                        </button>
                        <button
                            onClick={() => setFilterCategory('Plumbing')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterCategory === 'Plumbing'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Plumbing
                        </button>
                        <button
                            onClick={() => setFilterCategory('Cleaning')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterCategory === 'Cleaning'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Cleaning
                        </button>
                        <button
                            onClick={() => setFilterCategory('Other')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterCategory === 'Other'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            Other
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <Table
                    data={filteredRequests}
                    columns={columns}
                    isLoading={loading}
                    onSearch={setSearchQuery}
                    searchPlaceholder="Search by issue, category, asset, or resident..."
                    emptyState={
                        <EmptyState
                            icon={Wrench}
                            title="No maintenance requests"
                            description="Requests raised by staff or residents will show up here."
                            action={
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Request
                                </Button>
                            }
                        />
                    }
                    actions={(request) => (
                        <div className="flex justify-end gap-2">
                            {request.status === 'OPEN' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusUpdate(request.id, 'IN_PROGRESS')
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                                    title="Start working on this request"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Start Progress
                                </button>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusUpdate(request.id, 'RESOLVED')
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                                    title="Mark as resolved"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Resolved
                                </button>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                    <Wrench className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Request</h2>
                            </div>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
                                    required
                                >
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Cleaning">Cleaning</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all resize-none"
                                    rows={4}
                                    placeholder="Describe the maintenance issue..."
                                    required
                                />
                            </div>

                            {/* Asset (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Asset (Optional)
                                </label>
                                <select
                                    value={formData.assetId}
                                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
                                >
                                    <option value="">No asset selected</option>
                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.name} ({asset.category})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Resident (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Resident (Optional)
                                </label>
                                <select
                                    value={formData.residentId}
                                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all"
                                >
                                    <option value="">No resident selected</option>
                                    {residents.map((resident) => (
                                        <option key={resident.id} value={resident.id}>
                                            {resident.fullName}
                                        </option>
                                    ))}
                                </select>
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
                                    Create Request
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
