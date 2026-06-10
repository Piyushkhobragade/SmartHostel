/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { roomsAPI, residentsAPI } from '../services/api'
import DataGrid, { type ColumnDef, type BulkAction } from '../components/DataGrid'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import StatusBadge, { resolveVariant } from '../components/widgets/StatusBadge'
import { Plus, BedDouble, Wind, Ban, Users, UserPlus, UserMinus, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface ResidentMinimal {
    id: string
    fullName: string
    status: string
    roomId?: string | null
}

interface Room {
    id: string
    roomNumber: string
    capacity: number
    currentOccupancy: number
    type: string
    status: string
    floor?: string | null
    block?: string | null
    residents?: ResidentMinimal[]
}

function OccupancyBar({ room }: { room: Room }) {
    const pct = room.capacity > 0 ? (room.currentOccupancy / room.capacity) * 100 : 0
    const color = pct === 0
        ? 'rgb(var(--color-success))'
        : pct < 100
            ? 'rgb(var(--color-warning))'
            : 'rgb(var(--color-danger))'
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgb(var(--border-color))' }}>
                <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <span className="text-xs font-medium whitespace-nowrap" style={{ color }}>
                {room.currentOccupancy}/{room.capacity}
            </span>
        </div>
    )
}

export default function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [residents, setResidents] = useState<ResidentMinimal[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [formData, setFormData] = useState({
        roomNumber: '',
        capacity: 2,
        type: 'SINGLE',
        status: 'AVAILABLE',
        floor: '',
        block: '',
    })
    const [selectedResidentId, setSelectedResidentId] = useState('')
    const { showToast } = useToast()

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [roomsRes, residentsRes] = await Promise.all([
                roomsAPI.getAll(),
                residentsAPI.getAll(),
            ])
            setRooms(roomsRes.data)
            setResidents(residentsRes.data)
        } catch (_error) {
            console.error('Failed to fetch data:', _error)
            showToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload: any = {
                roomNumber: formData.roomNumber,
                capacity: formData.capacity,
                type: formData.type,
                status: formData.status,
            }
            if (formData.floor) payload.floor = formData.floor
            if (formData.block) payload.block = formData.block
            await roomsAPI.create(payload)
            showToast('Room created successfully', 'success')
            fetchData()
            resetForm()
        } catch (_error) {
            console.error('Failed to create room:', _error)
            showToast('Failed to create room', 'error')
        }
    }

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Delete this room?')) return
        try {
            await roomsAPI.delete(id)
            showToast('Room deleted successfully', 'success')
            fetchData()
        } catch (_error) {
            showToast('Failed to delete room', 'error')
        }
    }

    const handleBulkDelete = async (selected: Room[]) => {
        if (!confirm(`Delete ${selected.length} room(s)? Residents inside will become unallocated.`)) return
        for (const room of selected) {
            try { await roomsAPI.delete(room.id) } catch (_) { /* skip */ }
        }
        showToast(`${selected.length} room(s) deleted`, 'success')
        fetchData()
    }

    const handleAllocate = async () => {
        if (!selectedRoom || !selectedResidentId) return
        try {
            await residentsAPI.update(selectedResidentId, { roomId: selectedRoom.id })
            showToast('Resident allocated successfully', 'success')
            await fetchData()
            const updatedRooms = await roomsAPI.getAll()
            const updatedRoom = updatedRooms.data.find((r: Room) => r.id === selectedRoom.id)
            setSelectedRoom(updatedRoom ?? null)
            setSelectedResidentId('')
        } catch (_error) {
            showToast('Failed to allocate resident', 'error')
        }
    }

    const handleVacate = async (residentId: string) => {
        if (!confirm('Remove this resident from the room?')) return
        try {
            await residentsAPI.update(residentId, { roomId: null })
            showToast('Resident removed from room', 'success')
            await fetchData()
            const updatedRooms = await roomsAPI.getAll()
            const updatedRoom = updatedRooms.data.find((r: Room) => r.id === selectedRoom?.id)
            setSelectedRoom(updatedRoom ?? null)
        } catch (_error) {
            showToast('Failed to vacate resident', 'error')
        }
    }

    const resetForm = () => {
        setFormData({ roomNumber: '', capacity: 2, type: 'SINGLE', status: 'AVAILABLE', floor: '', block: '' })
        setShowForm(false)
    }

    const unallocatedResidents = residents.filter(r => !r.roomId)

    const columns: ColumnDef<Room>[] = [
        {
            key: 'roomNumber',
            header: 'Room',
            sortable: true,
            accessor: (room) => (
                <span className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                    #{room.roomNumber}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            filterOptions: [
                { label: 'Single', value: 'SINGLE' },
                { label: 'Double', value: 'DOUBLE' },
                { label: 'Triple', value: 'TRIPLE' },
                { label: 'Dormitory', value: 'DORMITORY' },
            ],
            accessor: (room) => (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: 'rgb(var(--bg-app))', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                    {room.type === 'SINGLE' ? <Wind className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    {room.type}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterOptions: [
                { label: 'Available', value: 'AVAILABLE' },
                { label: 'Occupied', value: 'OCCUPIED' },
                { label: 'Maintenance', value: 'MAINTENANCE' },
                { label: 'Reserved', value: 'RESERVED' },
            ],
            accessor: (room) => (
                <StatusBadge label={room.status} variant={resolveVariant(room.status)} />
            ),
        },
        {
            key: 'currentOccupancy',
            header: 'Occupancy',
            sortable: true,
            accessor: (room) => <OccupancyBar room={room} />,
        },
        {
            key: 'floor',
            header: 'Location',
            accessor: (room) => (
                <span style={{ color: 'rgb(var(--text-secondary))' }} className="text-xs">
                    {[room.floor && `Floor ${room.floor}`, room.block && `Block ${room.block}`].filter(Boolean).join(' · ') || '—'}
                </span>
            ),
        },
        {
            key: 'residents',
            header: 'Residents',
            accessor: (room) => {
                const res = room.residents ?? []
                if (res.length === 0) return <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Empty</span>
                return (
                    <div className="flex -space-x-1.5">
                        {res.slice(0, 3).map(r => (
                            <div key={r.id} className="w-6 h-6 rounded-full ring-2 flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(var(--color-primary),0.18)', color: 'rgb(var(--color-primary))', '--tw-ring-color': 'rgb(var(--bg-panel))' } as React.CSSProperties}>
                                {r.fullName.charAt(0)}
                            </div>
                        ))}
                        {res.length > 3 && (
                            <div className="w-6 h-6 rounded-full ring-2 flex items-center justify-center text-[10px] font-medium" style={{ background: 'rgb(var(--bg-app))', color: 'rgb(var(--text-muted))', '--tw-ring-color': 'rgb(var(--bg-panel))' } as React.CSSProperties}>
                                +{res.length - 3}
                            </div>
                        )}
                    </div>
                )
            },
        },
    ]

    const bulkActions: BulkAction<Room>[] = [
        {
            label: 'Delete Selected',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            variant: 'danger',
            onClick: handleBulkDelete,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Add Room Modal */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title="Add New Room"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Room Number"
                        value={formData.roomNumber}
                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                        placeholder="e.g. 101"
                        required
                    />
                    <Input
                        label="Capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        min="1"
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>Room Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className="py-2 px-3 rounded text-sm font-medium transition-colors"
                                    style={{
                                        border: `1px solid ${formData.type === t ? 'rgb(var(--color-primary))' : 'rgb(var(--border-color))'}`,
                                        background: formData.type === t ? 'rgba(var(--color-primary),0.1)' : 'transparent',
                                        color: formData.type === t ? 'rgb(var(--color-primary))' : 'rgb(var(--text-secondary))',
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Floor (optional)"
                            value={formData.floor}
                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                            placeholder="e.g. 2"
                        />
                        <Input
                            label="Block (optional)"
                            value={formData.block}
                            onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                            placeholder="e.g. A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-secondary))' }}>Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="input-field"
                            style={{ borderColor: 'rgb(var(--border-color))' }}
                        >
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="RESERVED">Reserved</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Create Room</Button>
                    </div>
                </form>
            </Modal>

            {/* Room Details & Allocation Modal */}
            <Modal
                isOpen={!!selectedRoom}
                onClose={() => setSelectedRoom(null)}
                title={selectedRoom ? `Room ${selectedRoom.roomNumber}` : ''}
                subtitle={selectedRoom ? `${selectedRoom.type} · Capacity: ${selectedRoom.capacity}` : undefined}
                maxWidth="lg"
            >
                {selectedRoom && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--text-muted))' }}>Current Residents</h3>
                            <div className="space-y-2">
                                {selectedRoom.residents && selectedRoom.residents.length > 0 ? (
                                    selectedRoom.residents.map(resident => (
                                        <div key={resident.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgb(var(--bg-app))' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(var(--color-primary),0.18)', color: 'rgb(var(--color-primary))' }}>
                                                    {resident.fullName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{resident.fullName}</span>
                                            </div>
                                            <button
                                                onClick={() => handleVacate(resident.id)}
                                                className="p-1.5 rounded-md transition-colors"
                                                style={{ color: 'rgb(var(--color-danger))' }}
                                                title="Vacate Room"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-center py-4 rounded-lg" style={{ color: 'rgb(var(--text-muted))', background: 'rgb(var(--bg-app))' }}>
                                        Room is currently empty
                                    </p>
                                )}
                            </div>
                        </div>
                        {selectedRoom.currentOccupancy < selectedRoom.capacity && (
                            <div className="pt-4" style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
                                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--text-muted))' }}>Allocate Resident</h3>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedResidentId}
                                        onChange={(e) => setSelectedResidentId(e.target.value)}
                                        className="input-field flex-1"
                                    >
                                        <option value="">Select resident...</option>
                                        {unallocatedResidents.map(r => (
                                            <option key={r.id} value={r.id}>{r.fullName}</option>
                                        ))}
                                    </select>
                                    <Button onClick={handleAllocate} disabled={!selectedResidentId}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Allocate
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* DataGrid */}
            <DataGrid
                data={rooms}
                columns={columns}
                loading={loading}
                selectable
                bulkActions={bulkActions}
                csvExport={{ filename: 'rooms' }}
                title="Rooms"
                subtitle="Manage room allocation and occupancy"
                toolbarActions={
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                    </Button>
                }
                searchFilter={(row, q) =>
                    row.roomNumber.toLowerCase().includes(q.toLowerCase()) ||
                    row.type.toLowerCase().includes(q.toLowerCase()) ||
                    row.status.toLowerCase().includes(q.toLowerCase()) ||
                    (row.floor ?? '').toLowerCase().includes(q.toLowerCase()) ||
                    (row.block ?? '').toLowerCase().includes(q.toLowerCase())
                }
                rowActions={(room) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRoom(room) }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'rgb(var(--color-primary))' }}
                            title="View details & allocate"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id) }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'rgb(var(--color-danger))' }}
                            title="Delete room"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                emptyState={
                    <EmptyState
                        icon={BedDouble}
                        title="No rooms configured"
                        description="Create rooms to start allocating residents."
                        action={
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Room
                            </Button>
                        }
                    />
                }
            />
        </div>
    )
}
