import { useState, useEffect } from 'react'
import { assetsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, X, Edit, Trash2, Package } from 'lucide-react'
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
        status: 'FUNCTIONAL',
        location: '',
        purchasedAt: '',
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const { showToast } = useToast()

    useEffect(() => {
        fetchAssets()
    }, [categoryFilter, statusFilter])

    const fetchAssets = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (categoryFilter) params.category = categoryFilter
            if (statusFilter) params.status = statusFilter

            const res = await assetsAPI.getAll(params)
            setAssets(res.data)
        } catch (error) {
            console.error('Failed to fetch assets:', error)
            showToast('Failed to load assets', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingAsset) {
                await assetsAPI.update(editingAsset.id, formData)
                showToast('Asset updated successfully', 'success')
            } else {
                await assetsAPI.create(formData)
                showToast('Asset created successfully', 'success')
            }
            fetchAssets()
            resetForm()
        } catch (error) {
            console.error('Failed to save asset:', error)
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
        } catch (error) {
            console.error('Failed to delete asset:', error)
            showToast('Failed to delete asset', 'error')
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Furniture',
            status: 'FUNCTIONAL',
            location: '',
            purchasedAt: '',
        })
        setEditingAsset(null)
        setShowForm(false)
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            FUNCTIONAL: 'bg-green-100 text-green-800 border-green-200',
            REPAIR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            BROKEN: 'bg-red-100 text-red-800 border-red-200',
        }
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        )
    }

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns = [
        { header: 'Name', accessor: (item: Asset) => <span className="font-medium text-gray-900 dark:text-white">{item.name}</span> },
        { header: 'Category', accessor: 'category' as keyof Asset },
        { header: 'Location', accessor: 'location' as keyof Asset },
        { header: 'Status', accessor: (item: Asset) => getStatusBadge(item.status) },
        {
            header: 'Purchased',
            accessor: (item: Asset) => item.purchasedAt
                ? new Date(item.purchasedAt).toLocaleDateString('en-IN')
                : 'N/A'
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Asset Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage hostel assets and inventory</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex gap-4">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                    <option value="">All Categories</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Other">Other</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                    <option value="">All Status</option>
                    <option value="FUNCTIONAL">Functional</option>
                    <option value="REPAIR">Under Repair</option>
                    <option value="BROKEN">Broken</option>
                </select>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingAsset ? 'Edit Asset' : 'Add Asset'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Asset Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Study Table #1"
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                    <option value="Furniture">Furniture</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Appliances">Appliances</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                    <option value="FUNCTIONAL">Functional</option>
                                    <option value="REPAIR">Under Repair</option>
                                    <option value="BROKEN">Broken</option>
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
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {editingAsset ? 'Update' : 'Create'} Asset
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Table
                data={filteredAssets}
                columns={columns}
                isLoading={loading}
                onSearch={setSearchQuery}
                searchPlaceholder="Search assets..."
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
                actions={(asset) => (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(asset); }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit asset"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete asset"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />
        </div>
    )
}
