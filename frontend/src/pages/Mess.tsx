/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { messAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/Modal'
import StatusBadge from '../components/widgets/StatusBadge'

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

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns = [
        {
            header: 'Resident',
            accessor: (item: MessSubscription) => (
                <span style={{ color: 'rgb(var(--text-primary))' }} className="font-medium">{item.resident.fullName}</span>
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
        {
            header: 'Status',
            accessor: (item: MessSubscription) => (
                <StatusBadge
                    label={item.isActive ? 'Active' : 'Inactive'}
                    variant={item.isActive ? 'success' : 'muted'}
                />
            )
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Mess Management</h1>
                    <p className="mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Manage mess subscriptions and meal plans</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                </Button>
            </div>

            {/* Filters */}
            <div className="rounded-lg p-4 flex gap-4" style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
                <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    className="input-field w-auto"
                >
                    <option value="all">All Subscriptions</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                </select>
            </div>

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={resetForm} title="Add Mess Subscription">
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
            </Modal>

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
                                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                                style={{ color: 'rgb(var(--color-danger))' }}
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
