/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { assetsAPI } from '../services/api'
import DataGrid from '../components/DataGrid'
import type { ColumnDef, BulkAction } from '../components/DataGrid'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import StatusBadge, { resolveVariant } from '../components/widgets/StatusBadge'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Asset {
    id: string
    name: string
    category: string
    status: string
    location: string
    purchasedAt?: string | null
    createdAt: string
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        category: 'Furniture',
        status: 'WORKING',
        location: '',
        purchasedAt: '',
    })
    const { showToast } = useToast()

    useEffect(() => { fetchAssets() }, [])

    const fetchAssets = async () => {
        setLoading(true)
        try {
            const res = await assetsAPI.getAll()
            setAssets(res.data)
        } catch (_error) {
            console.error('Failed to fetch assets:', _error)
            showToast('Failed to load assets', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload: any = {
                name: formData.name,
                category: formData.category,
                status: formData.status,
                location: formData.location,
            }
            if (formData.purchasedAt) payload.purchasedAt = formData.purchasedAt
            if (editingAsset) {
                await assetsAPI.update(editingAsset.id, payload)
                showToast('Asset updated successfully', 'success')
            } else {
                await assetsAPI.create(payload)
                showToast('Asset created successfully', 'success')
            }
            fetchAssets()
            resetForm()
        } catch (_error) {
            console.error('Failed to save asset:', _error)
            showToast('Failed to save asset', 'error')
        }
    }

    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset)
        setFormData({
            name: asset.name,
            category: asset.category,
            status: asset.status,
            location: asset.location,
            purchasedAt: asset.purchasedAt ? new Date(asset.purchasedAt).toISOString().split('T')[0] : '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return
        try {
            await assetsAPI.delete(id)
            showToast('Asset deleted successfully', 'success')
            fetchAssets()
        } catch (_error) {
            showToast('Failed to delete asset', 'error')
        }
    }

    const handleBulkDelete = async (selected: Asset[]) => {
        if (!confirm(`Delete ${selected.length} asset(s)? This cannot be undone.`)) return
        for (const a of selected) {
            try { await assetsAPI.delete(a.id) } catch (_) { /* skip */ }
        }
        showToast(`${selected.length} asset(s) deleted`, 'success')
        fetchAssets()
    }

    const resetForm = () => {
        setFormData({ name: '', category: 'Furniture', status: 'WORKING', location: '', purchasedAt: '' })
        setEditingAsset(null)
        setShowForm(false)
    }

    const columns: ColumnDef<Asset>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            accessor: (item) => (
                <span className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {item.name}
                </span>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            sortable: true,
            filterOptions: [
                { label: 'Furniture', value: 'Furniture' },
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Appliances', value: 'Appliances' },
                { label: 'Other', value: 'Other' },
            ],
            accessor: (item) => (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgb(var(--bg-app))', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    {item.category}
                </span>
            ),
        },
        {
            key: 'location',
            header: 'Location',
            accessor: (item) => (
                <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{item.location}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterOptions: [
                { label: 'Functional', value: 'FUNCTIONAL' },
                { label: 'Working', value: 'WORKING' },
                { label: 'Under Repair', value: 'REPAIR' },
                { label: 'Maintenance', value: 'UNDER_MAINTENANCE' },
                { label: 'Broken', value: 'BROKEN' },
                { label: 'Retired', value: 'RETIRED' },
                { label: 'Lost', value: 'LOST' },
            ],
            accessor: (item) => (
                <StatusBadge label={item.status} variant={resolveVariant(item.status)} />
            ),
        },
        {
            key: 'purchasedAt',
            header: 'Purchased',
            accessor: (item) => (
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString('en-IN') : 'N/A'}
                </span>
            ),
        },
    ]

    const bulkActions: BulkAction<Asset>[] = [
        {
            label: 'Delete Selected',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            variant: 'danger',
            onClick: handleBulkDelete,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={editingAsset ? 'Edit Asset' : 'Add Asset'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Asset Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Study Table #1"
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>Category</label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                            <option value="Furniture">Furniture</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Appliances">Appliances</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                            <option value="WORKING">Working</option>
                            <option value="FUNCTIONAL">Functional</option>
                            <option value="REPAIR">Under Repair</option>
                            <option value="UNDER_MAINTENANCE">Maintenance</option>
                            <option value="BROKEN">Broken</option>
                            <option value="RETIRED">Retired</option>
                            <option value="LOST">Lost</option>
                        </select>
                    </div>
                    <Input
                        label="Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Room 101"
                        required
                    />
                    <Input
                        label="Purchase Date (Optional)"
                        type="date"
                        value={formData.purchasedAt}
                        onChange={(e) => setFormData({ ...formData, purchasedAt: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">{editingAsset ? 'Update' : 'Create'} Asset</Button>
                    </div>
                </form>
            </Modal>

            <DataGrid
                data={assets}
                columns={columns}
                loading={loading}
                selectable
                bulkActions={bulkActions}
                csvExport={{ filename: 'assets' }}
                title="Asset Inventory"
                subtitle="Track and manage hostel assets and inventory"
                toolbarActions={
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Asset
                    </Button>
                }
                searchFilter={(row, q) =>
                    row.name.toLowerCase().includes(q.toLowerCase()) ||
                    row.category.toLowerCase().includes(q.toLowerCase()) ||
                    row.location.toLowerCase().includes(q.toLowerCase())
                }
                rowActions={(asset) => (
                    <div className="flex justify-end gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(asset) }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'rgb(var(--color-primary))' }}
                            title="Edit asset"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(asset.id) }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'rgb(var(--color-danger))' }}
                            title="Delete asset"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                emptyState={
                    <EmptyState
                        icon={Package}
                        title="No assets tracked"
                        description="Add hostel assets to keep track of inventory and condition."
                        action={
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Asset
                            </Button>
                        }
                    />
                }
            />
        </div>
    )
}
