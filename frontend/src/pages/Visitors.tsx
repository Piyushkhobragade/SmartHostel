/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { visitorsAPI, residentsAPI } from '../services/api'
import DataGrid from '../components/DataGrid'
import type { ColumnDef } from '../components/DataGrid'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import StatusBadge from '../components/widgets/StatusBadge'
import { Plus, LogOut, UserPlus } from 'lucide-react'
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

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const ID_TYPE_FILTER_OPTIONS = [
    { label: 'Aadhar', value: 'AADHAR' },
    { label: 'PAN', value: 'PAN' },
    { label: 'Driving License', value: 'DRIVING_LICENSE' },
    { label: 'Passport', value: 'PASSPORT' },
]

const STATUS_FILTER_OPTIONS = [
    { label: 'Inside', value: 'INSIDE' },
    { label: 'Exited', value: 'EXITED' },
]

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

    // Client-side status pre-filter — keeps DataGrid data prop clean
    const displayedVisitors: Visitor[] = visitors.filter((v) => {
        if (filterStatus === 'INSIDE') return !v.checkOutTime
        if (filterStatus === 'EXITED') return !!v.checkOutTime
        return true
    })

    const columns: ColumnDef<Visitor>[] = [
        {
            key: 'visitorName',
            header: 'Visitor Name',
            accessor: (row) => (
                <span className="font-medium text-[rgb(var(--text-primary))]">
                    {row.visitorName}
                </span>
            ),
            sortable: true,
        },
        {
            key: 'residentName',
            header: 'Visiting Resident',
            accessor: (row) => row.resident.fullName,
        },
        {
            key: 'purpose',
            header: 'Purpose',
            accessor: 'purpose',
        },
        {
            key: 'idType',
            header: 'ID Type',
            accessor: 'idType',
            filterOptions: ID_TYPE_FILTER_OPTIONS,
        },
        {
            key: 'checkInTime',
            header: 'Check-in',
            accessor: (row) => formatDateTime(row.checkInTime),
            sortable: true,
        },
        {
            key: 'checkOutTime',
            header: 'Check-out',
            accessor: (row) =>
                row.checkOutTime ? formatDateTime(row.checkOutTime) : '—',
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (row) => (
                <StatusBadge
                    label={row.checkOutTime ? 'Exited' : 'Inside'}
                    variant={row.checkOutTime ? 'muted' : 'info'}
                />
            ),
            filterOptions: STATUS_FILTER_OPTIONS,
            align: 'center',
        },
    ]

    const pillBase = 'px-3 py-1.5 text-sm font-medium rounded-md transition-colors'
    const isPillActive = (val: string) => filterStatus === val

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: 'rgb(var(--text-primary))' }}
                    >
                        Visitors
                    </h1>
                    <p
                        className="mt-1"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Log and review hostel visitor entries and exits
                    </p>
                </div>
            </div>

            {/* Add Visitor Modal */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title="Add Visitor"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Visitor Name"
                        value={formData.visitorName}
                        onChange={(e) =>
                            setFormData({ ...formData, visitorName: e.target.value })
                        }
                        placeholder="Enter visitor name"
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Visiting Resident
                        </label>
                        <select
                            value={formData.residentId}
                            onChange={(e) =>
                                setFormData({ ...formData, residentId: e.target.value })
                            }
                            className="input-field w-full"
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
                        onChange={(e) =>
                            setFormData({ ...formData, purpose: e.target.value })
                        }
                        placeholder="e.g., Personal visit, Delivery"
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                                ID Type
                            </label>
                            <select
                                value={formData.idType}
                                onChange={(e) =>
                                    setFormData({ ...formData, idType: e.target.value })
                                }
                                className="input-field w-full"
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
                            onChange={(e) =>
                                setFormData({ ...formData, idLast4: e.target.value })
                            }
                            placeholder="1234"
                            maxLength={4}
                            required
                        />
                    </div>
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
                            Check In
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Status pill filter (outside DataGrid) */}
            <div className="flex items-center space-x-4">
                <div
                    className="flex items-center space-x-2 rounded-lg p-1"
                    style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}
                >
                    {(
                        [
                            { label: 'All', value: 'ALL' },
                            { label: 'Inside', value: 'INSIDE' },
                            { label: 'Exited', value: 'EXITED' },
                        ] as const
                    ).map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setFilterStatus(value)}
                            className={pillBase}
                            style={isPillActive(value) ? {
                                background: 'rgba(var(--color-primary), 0.12)',
                                color: 'rgb(var(--color-primary))',
                                border: '1px solid rgba(var(--color-primary), 0.30)',
                            } : {
                                color: 'rgb(var(--text-secondary))',
                                border: '1px solid transparent',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* DataGrid */}
            <DataGrid<Visitor>
                title="Visitors Log"
                data={displayedVisitors}
                columns={columns}
                loading={loading}
                selectable={false}
                csvExport={{ filename: 'visitors' }}
                searchFilter={(row, query) => {
                    const q = query.toLowerCase()
                    return (
                        row.visitorName.toLowerCase().includes(q) ||
                        row.resident.fullName.toLowerCase().includes(q)
                    )
                }}
                emptyState={
                    <EmptyState
                        icon={UserPlus}
                        title="No visitor entries"
                        description="New visitor check-ins will appear in this list."
                    />
                }
                toolbarActions={
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Visitor
                    </Button>
                }
                rowActions={(visitor) =>
                    !visitor.checkOutTime ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleCheckout(visitor.id)
                            }}
                            className="flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors hover:opacity-80"
                            style={{ color: 'rgb(var(--color-danger))' }}
                            title="Check out visitor"
                        >
                            <LogOut className="w-4 h-4 mr-1" />
                            Checkout
                        </button>
                    ) : null
                }
            />
        </div>
    )
}
