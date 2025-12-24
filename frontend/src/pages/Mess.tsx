import { useState, useEffect } from 'react'
import { messAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { Plus, X, UtensilsCrossed } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
    email: string
}

interface MessSubscription {
    id: string
    residentId: string
    planName: string
    monthlyFee: number
    startDate: string
    endDate?: string | null
    isActive: boolean
    resident: Resident
    createdAt: string
}

export default function Mess() {
    const [subscriptions, setSubscriptions] = useState<MessSubscription[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        residentId: '',
        planName: 'Standard Veg',
        monthlyFee: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterActive, setFilterActive] = useState<string>('all')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [filterActive])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = filterActive !== 'all' ? { isActive: filterActive } : {}
            const [subsRes, residentsRes] = await Promise.all([
                messAPI.getAll(params),
                residentsAPI.getAll()
            ])
            setSubscriptions(subsRes.data)
            setResidents(residentsRes.data)
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
            await messAPI.create({
                ...formData,
                monthlyFee: parseFloat(formData.monthlyFee)
            })
            showToast('Mess subscription created successfully', 'success')
            fetchData()
            resetForm()
        } catch (error) {
            console.error('Failed to create subscription:', error)
            showToast('Failed to create subscription', 'error')
        }
    }

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this subscription?')) return
        try {
            await messAPI.deactivate(id)
            showToast('Subscription deactivated successfully', 'success')
            fetchData()
        } catch (error) {
            console.error('Failed to deactivate subscription:', error)
            showToast('Failed to deactivate subscription', 'error')
        }
    }

    const resetForm = () => {
        setFormData({
            residentId: '',
            planName: 'Standard Veg',
            monthlyFee: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
        })
        setShowForm(false)
    }

    const getStatusBadge = (isActive: boolean) => {
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                }`}>
                {isActive ? 'Active' : 'Inactive'}
            </span>
        )
    }

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns = [
        {
            header: 'Resident',
            accessor: (item: MessSubscription) => (
                <span className="font-medium text-gray-900 dark:text-white">{item.resident.fullName}</span>
            )
        },
        { header: 'Plan', accessor: 'planName' as keyof MessSubscription },
        {
            header: 'Monthly Fee',
            accessor: (item: MessSubscription) => `₹${item.monthlyFee.toLocaleString()}`
        },
        {
            header: 'Start Date',
            accessor: (item: MessSubscription) => new Date(item.startDate).toLocaleDateString('en-IN')
        },
        {
            header: 'End Date',
            accessor: (item: MessSubscription) => item.endDate
                ? new Date(item.endDate).toLocaleDateString('en-IN')
                : '-'
        },
        { header: 'Status', accessor: (item: MessSubscription) => getStatusBadge(item.isActive) },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mess Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage mess subscriptions and meal plans</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex gap-4">
                <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                    <option value="all">All Subscriptions</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                </select>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Mess Subscription</h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Select
                                label="Resident"
                                value={formData.residentId}
                                onChange={(value) => setFormData({ ...formData, residentId: value })}
                                options={residents.map(r => ({ value: r.id, label: r.fullName }))}
                                placeholder="Select a resident"
                                required
                            />
                            <Select
                                label="Plan"
                                value={formData.planName}
                                onChange={(value) => setFormData({ ...formData, planName: value })}
                                options={[
                                    { value: 'Standard Veg', label: 'Standard Veg' },
                                    { value: 'Standard Non-Veg', label: 'Standard Non-Veg' },
                                    { value: 'Premium Veg', label: 'Premium Veg' },
                                    { value: 'Premium Non-Veg', label: 'Premium Non-Veg' },
                                ]}
                                required
                            />
                            <Input
                                label="Monthly Fee *"
                                type="number"
                                value={formData.monthlyFee}
                                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                                placeholder="e.g., 3000"
                                required
                                min="0"
                                step="0.01"
                            />
                            <Input
                                label="Start Date *"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                            <Input
                                label="End Date (Optional)"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Create Subscription
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Table
                data={filteredSubscriptions}
                columns={columns}
                isLoading={loading}
                onSearch={setSearchQuery}
                searchPlaceholder="Search subscriptions..."
                emptyState={
                    <EmptyState
                        icon={UtensilsCrossed}
                        title="No mess subscriptions found"
                        description="Add mess subscriptions to manage meal plans and billing."
                        action={
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Subscription
                            </Button>
                        }
                    />
                }
                actions={(subscription) => (
                    <div className="flex justify-end">
                        {subscription.isActive && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeactivate(subscription.id); }}
                                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Deactivate subscription"
                            >
                                Deactivate
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    )
}
