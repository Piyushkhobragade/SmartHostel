import { useState, useEffect } from 'react'
import { roomsAPI, residentsAPI } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, X, BedDouble, Wind, Ban, UserPlus, UserMinus } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
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
    residents?: Resident[]
}

export default function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [formData, setFormData] = useState({
        roomNumber: '',
        capacity: 2,
        type: 'NON_AC',
        status: 'AVAILABLE'
    })
    const [selectedResidentId, setSelectedResidentId] = useState('')
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [roomsRes, residentsRes] = await Promise.all([
                roomsAPI.getAll(),
                residentsAPI.getAll()
            ])
            setRooms(roomsRes.data)
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
            await roomsAPI.create(formData)
            showToast('Room created successfully', 'success')
            fetchData()
            resetForm()
        } catch (error) {
            console.error('Failed to create room:', error)
            showToast('Failed to create room', 'error')
        }
    }



    const handleAllocate = async () => {
        if (!selectedRoom || !selectedResidentId) return
        try {
            await residentsAPI.update(selectedResidentId, { roomId: selectedRoom.id })
            showToast('Resident allocated successfully', 'success')
            await fetchData()
            // Update selected room to reflect changes immediately
            const updatedRooms = await roomsAPI.getAll()
            const updatedRoom = updatedRooms.data.find((r: Room) => r.id === selectedRoom.id)
            setSelectedRoom(updatedRoom)
            setSelectedResidentId('')
        } catch (error) {
            console.error('Failed to allocate resident:', error)
            showToast('Failed to allocate resident', 'error')
        }
    }

    const handleVacate = async (residentId: string) => {
        if (!confirm('Remove this resident from the room?')) return
        try {
            await residentsAPI.update(residentId, { roomId: null })
            showToast('Resident removed from room', 'success')
            await fetchData()
            // Update selected room
            const updatedRooms = await roomsAPI.getAll()
            const updatedRoom = updatedRooms.data.find((r: Room) => r.id === selectedRoom?.id)
            setSelectedRoom(updatedRoom)
        } catch (error) {
            console.error('Failed to vacate resident:', error)
            showToast('Failed to vacate resident', 'error')
        }
    }

    const resetForm = () => {
        setFormData({ roomNumber: '', capacity: 2, type: 'NON_AC', status: 'AVAILABLE' })
        setShowForm(false)
    }

    const getOccupancyColor = (room: Room) => {
        const percentage = (room.currentOccupancy / room.capacity) * 100
        if (percentage === 0) return 'bg-green-50 border-green-200 text-green-700'
        if (percentage < 100) return 'bg-yellow-50 border-yellow-200 text-yellow-700'
        return 'bg-red-50 border-red-200 text-red-700'
    }

    const unallocatedResidents = residents.filter(r => !r.roomId)

    const filteredRooms = rooms.filter(room => {
        if (filterStatus === 'ALL') return true
        if (filterStatus === 'AVAILABLE') return room.currentOccupancy < room.capacity
        if (filterStatus === 'OCCUPIED') return room.currentOccupancy > 0
        return true
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rooms</h1>
                    <p className="text-gray-500 mt-1">Manage room allocation and occupancy</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                </Button>
            </div>

            {/* Add Room Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Room</h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'AC' })}
                                        className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${formData.type === 'AC'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Wind className="w-4 h-4 mr-2" />
                                        AC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'NON_AC' })}
                                        className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${formData.type === 'NON_AC'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Non-AC
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Create Room
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Details & Allocation Modal */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedRoom(null)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Room {selectedRoom.roomNumber}</h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{selectedRoom.type} • Capacity: {selectedRoom.capacity}</span>
                            </div>
                            <button onClick={() => setSelectedRoom(null)} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Current Residents */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Current Residents</h3>
                                <div className="space-y-2">
                                    {selectedRoom.residents && selectedRoom.residents.length > 0 ? (
                                        selectedRoom.residents.map(resident => (
                                            <div key={resident.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                                                        {resident.fullName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">{resident.fullName}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleVacate(resident.id)}
                                                    className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                    title="Vacate Room"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                            Room is currently empty
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Allocate New Resident */}
                            {selectedRoom.currentOccupancy < selectedRoom.capacity && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Allocate Resident</h3>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedResidentId}
                                            onChange={(e) => setSelectedResidentId(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select resident...</option>
                                            {unallocatedResidents.map(r => (
                                                <option key={r.id} value={r.id}>{r.fullName}</option>
                                            ))}
                                        </select>
                                        <Button
                                            onClick={handleAllocate}
                                            disabled={!selectedResidentId}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Allocate
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
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
                        onClick={() => setFilterStatus('AVAILABLE')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'AVAILABLE'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Available
                    </button>
                    <button
                        onClick={() => setFilterStatus('OCCUPIED')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'OCCUPIED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Occupied
                    </button>
                </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={BedDouble}
                            title={filterStatus === 'ALL' ? "No rooms configured" : "No rooms found"}
                            description={filterStatus === 'ALL' ? "Create rooms to start allocating residents." : `No ${filterStatus.toLowerCase()} rooms available.`}
                            action={
                                filterStatus === 'ALL' ? (
                                    <Button onClick={() => setShowForm(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Room
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : (
                    filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className={`px-4 py-3 border-b flex justify-between items-center ${getOccupancyColor(room).split(' ')[0]} ${getOccupancyColor(room).split(' ')[1]}`}>
                                <span className={`font-bold ${getOccupancyColor(room).split(' ')[2]}`}>
                                    Room {room.roomNumber}
                                </span>
                                <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-slate-700 bg-opacity-50 rounded-full">
                                    {room.type}
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Occupancy</span>
                                    <span className="font-medium">{room.currentOccupancy} / {room.capacity}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-4">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${room.currentOccupancy >= room.capacity ? 'bg-red-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${(room.currentOccupancy / room.capacity) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex -space-x-2 overflow-hidden py-1">
                                    {room.residents?.slice(0, 3).map((r, i) => (
                                        <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                            {r.fullName.charAt(0)}
                                        </div>
                                    ))}
                                    {room.residents && room.residents.length > 3 && (
                                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                            +{room.residents.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
