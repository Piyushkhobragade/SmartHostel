/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { maintenanceAPI, residentsAPI, assetsAPI } from '../services/api'
import DataGrid from '../components/DataGrid'
import type { ColumnDef, BulkAction } from '../components/DataGrid'
import Button from '../components/Button'
import Modal from '../components/Modal'
import StatusBadge, { resolveVariant } from '../components/widgets/StatusBadge'
import { Plus, Wrench, ArrowRight, CheckCircle, CheckCheck } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident { id: string; fullName: string }
interface Asset { id: string; name: string; category: string }
interface MaintenanceRequest {
    id: string
    category: string
    description: string
    status: string
    priority: string
    createdAt: string
    resident?: Resident | null
    asset?: Asset | null
}

function PriorityBadge({ priority }: { priority: string }) {
    const map: Record<string, { color: string; label: string }> = {
        URGENT: { color: 'rgb(242,73,92)', label: 'Urgent' },
        HIGH: { color: 'rgb(255,152,48)', label: 'High' },
        MEDIUM: { color: 'rgb(87,148,242)', label: 'Medium' },
        LOW: { color: 'rgb(102,102,119)', label: 'Low' },
    }
    const p = map[priority] ?? { color: 'rgb(102,102,119)', label: priority }
    return (
        <span className="text-xs font-medium" style={{ color: p.color }}>
            {p.label}
        </span>
    )
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
        priority: 'MEDIUM',
        residentId: '',
        assetId: '',
    })
    const { showToast } = useToast()

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [reqRes, resRes, assetRes] = await Promise.all([
                maintenanceAPI.getAll(),
                residentsAPI.getAll(),
                assetsAPI.getAll(),
            ])
            setRequests(reqRes.data)
            setResidents(resRes.data)
            setAssets(assetRes.data)
        } catch (_error) {
            console.error('Failed to fetch data:', _error)
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
                assetId: formData.assetId || undefined,
            }
            await maintenanceAPI.create(submitData)
            showToast('Maintenance request created successfully', 'success')
            fetchData()
            resetForm()
        } catch (_error) {
            console.error('Failed to create request:', _error)
            showToast('Failed to create maintenance request', 'error')
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await maintenanceAPI.updateStatus(id, newStatus)
            showToast('Status updated successfully', 'success')
            fetchData()
        } catch (_error) {
            showToast('Failed to update status', 'error')
        }
    }

    const handleBulkResolve = async (selected: MaintenanceRequest[]) => {
        const resolvable = selected.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS')
        for (const r of resolvable) {
            try { await maintenanceAPI.updateStatus(r.id, 'RESOLVED') } catch (_) { /* skip */ }
        }
        showToast(`${resolvable.length} request(s) marked resolved`, 'success')
        fetchData()
    }

    const resetForm = () => {
        setFormData({ category: 'Electrical', description: '', priority: 'MEDIUM', residentId: '', assetId: '' })
        setShowForm(false)
    }

    const columns: ColumnDef<MaintenanceRequest>[] = [
        {
            key: 'description',
            header: 'Issue',
            accessor: (item) => (
                <p className="max-w-xs truncate font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {item.description}
                </p>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            sortable: true,
            filterOptions: [
                { label: 'Electrical', value: 'Electrical' },
                { label: 'Plumbing', value: 'Plumbing' },
                { label: 'Cleaning', value: 'Cleaning' },
                { label: 'Furniture', value: 'Furniture' },
                { label: 'Other', value: 'Other' },
            ],
            accessor: (item) => (
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgb(var(--bg-app))', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    {item.category}
                </span>
            ),
        },
        {
            key: 'priority',
            header: 'Priority',
            sortable: true,
            filterOptions: [
                { label: 'Urgent', value: 'URGENT' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
            ],
            accessor: (item) => <PriorityBadge priority={item.priority} />,
        },
        {
            key: 'asset',
            header: 'Asset',
            accessor: (item) => (
                <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                    {item.asset?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'resident',
            header: 'Resident',
            accessor: (item) => (
                <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                    {item.resident?.fullName ?? '—'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterOptions: [
                { label: 'Open', value: 'OPEN' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' },
            ],
            accessor: (item) => (
                <StatusBadge label={item.status} variant={resolveVariant(item.status)} />
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            accessor: (item) => (
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            ),
        },
    ]

    const bulkActions: BulkAction<MaintenanceRequest>[] = [
        {
            label: 'Mark Resolved',
            icon: <CheckCheck className="w-3.5 h-3.5" />,
            variant: 'warning',
            onClick: handleBulkResolve,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Modal Form */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title="Report Maintenance Issue"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Category <span style={{ color: 'rgb(var(--color-danger))' }}>*</span></label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" required>
                            <option value="Electrical">Electrical</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Cleaning">Cleaning</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input-field">
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Description <span style={{ color: 'rgb(var(--color-danger))' }}>*</span></label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field resize-none"
                            rows={3}
                            placeholder="Describe the maintenance issue..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Asset (Optional)</label>
                        <select value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} className="input-field">
                            <option value="">No asset selected</option>
                            {assets.map((asset) => (<option key={asset.id} value={asset.id}>{asset.name} ({asset.category})</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Resident (Optional)</label>
                        <select value={formData.residentId} onChange={(e) => setFormData({ ...formData, residentId: e.target.value })} className="input-field">
                            <option value="">No resident selected</option>
                            {residents.map((r) => (<option key={r.id} value={r.id}>{r.fullName}</option>))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Create Request</Button>
                    </div>
                </form>
            </Modal>

            <DataGrid
                data={requests}
                columns={columns}
                loading={loading}
                selectable
                bulkActions={bulkActions}
                csvExport={{ filename: 'maintenance' }}
                title="Maintenance Requests"
                subtitle="Handle hostel complaints and maintenance tasks"
                toolbarActions={
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Report Issue
                    </Button>
                }
                searchFilter={(row, q) =>
                    row.description.toLowerCase().includes(q.toLowerCase()) ||
                    row.category.toLowerCase().includes(q.toLowerCase()) ||
                    (row.resident?.fullName ?? '').toLowerCase().includes(q.toLowerCase()) ||
                    (row.asset?.name ?? '').toLowerCase().includes(q.toLowerCase())
                }
                rowActions={(request) => (
                    <div className="flex justify-end gap-1">
                        {request.status === 'OPEN' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'IN_PROGRESS') }}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors"
                                style={{ color: 'rgb(255,152,48)', background: 'rgba(255,152,48,0.1)' }}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Start
                            </button>
                        )}
                        {request.status === 'IN_PROGRESS' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'RESOLVED') }}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors"
                                style={{ color: 'rgb(115,191,105)', background: 'rgba(115,191,105,0.1)' }}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Resolve
                            </button>
                        )}
                    </div>
                )}
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
            />
        </div>
    )
}
