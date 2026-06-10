/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { twinAPI } from '../../services/api';
import { Map, Users, Wrench, Banknote, Filter, RefreshCw } from 'lucide-react';

interface RoomData {
    id: string;
    roomNumber: string;
    capacity: number;
    currentOccupancy: number;
    status: string;
    type: string;
}

interface Layout {
    [block: string]: {
        [floor: string]: RoomData[];
    }
}

interface HeatmapData {
    roomId: string;
    value: number; // Normalized 0 to 1
    label: string;
}

interface RoomProfile extends RoomData {
    activeMaintenance: any[];
    totalPendingFees: number;
}

type HeatmapMode = 'none' | 'occupancy' | 'maintenance' | 'cost';

export default function DigitalTwin() {
    const [layout, setLayout] = useState<Layout>({});
    const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
    const [mode, setMode] = useState<HeatmapMode>('none');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Side panel state
    const [selectedRoom, setSelectedRoom] = useState<RoomProfile | null>(null);
    const [roomLoading, setRoomLoading] = useState(false);

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        if (mode !== 'none') {
            loadHeatmap(mode);
        } else {
            setHeatmap([]);
        }
    }, [mode]);

    const loadOverview = async () => {
        try {
            setLoading(true);
            const res = await twinAPI.getOverview();
            setLayout(res.data);
        } catch (error) {
            console.error('Failed to load twin overview', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHeatmap = async (type: HeatmapMode) => {
        if (type === 'none') return;
        try {
            setRefreshing(true);
            const res = await twinAPI.getHeatmap(type as 'occupancy' | 'maintenance' | 'cost');
            setHeatmap(res.data);
        } catch (error) {
            console.error('Failed to load heatmap', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRoomClick = async (roomId: string) => {
        try {
            setRoomLoading(true);
            const res = await twinAPI.getRoomProfile(roomId);
            setSelectedRoom(res.data);
        } catch (error) {
            console.error('Failed to load room profile', error);
        } finally {
            setRoomLoading(false);
        }
    };

    const getRoomColor = (roomId: string, baseOccupancy: number, capacity: number) => {
        if (mode === 'none') {
            if (baseOccupancy === 0) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
            if (baseOccupancy >= capacity) return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600';
            return 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700';
        }

        const point = heatmap.find(h => h.roomId === roomId);
        const value = point ? point.value : 0; // 0 to 1

        if (mode === 'occupancy') {
            if (value === 0) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
            if (value < 1) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
            return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
        }
        
        if (mode === 'maintenance') {
            if (value === 0) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50';
            if (value < 0.5) return 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300';
            return 'bg-orange-500 dark:bg-orange-600 border-orange-600 text-white shadow-md';
        }

        if (mode === 'cost') {
            if (value === 0) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50';
            if (value < 0.5) return 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300';
            return 'bg-purple-500 dark:bg-purple-600 border-purple-600 text-white shadow-md';
        }

        return 'bg-white';
    };

    const getRoomLabel = (roomId: string) => {
        if (mode === 'none') return '';
        const point = heatmap.find(h => h.roomId === roomId);
        return point ? point.label : '';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Initializing Digital Twin...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 bg-slate-50 dark:bg-slate-900/50">
            
            {/* Top Bar */}
            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Map className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Digital Twin Map</h1>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Spatial Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setMode('none')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'none' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Standard View
                    </button>
                    <button 
                        onClick={() => setMode('occupancy')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${mode === 'occupancy' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Users className="w-4 h-4" /> Occupancy
                    </button>
                    <button 
                        onClick={() => setMode('maintenance')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${mode === 'maintenance' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Wrench className="w-4 h-4" /> Maintenance
                    </button>
                    <button 
                        onClick={() => setMode('cost')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${mode === 'cost' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Banknote className="w-4 h-4" /> Financial Risk
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Canvas (Map) */}
                <div className="flex-1 overflow-auto p-8 relative">
                    {refreshing && (
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 z-20">
                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rendering Heatmap...</span>
                        </div>
                    )}
                    
                    <div className="max-w-6xl mx-auto space-y-12 pb-12">
                        {Object.entries(layout).map(([block, floors]) => (
                            <div key={block} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-8 w-2 bg-indigo-500 rounded-full"></div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        Block {block}
                                    </h2>
                                </div>
                                
                                <div className="space-y-8 pl-4">
                                    {Object.entries(floors).sort(([a],[b]) => a.localeCompare(b)).map(([floor, rooms]) => (
                                        <div key={floor} className="relative">
                                            <div className="absolute -left-12 top-2 text-slate-400 font-bold text-xl w-8 text-right">
                                                {floor}F
                                            </div>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {rooms.map(room => (
                                                    <button
                                                        key={room.id}
                                                        onClick={() => handleRoomClick(room.id)}
                                                        className={`relative flex flex-col items-center justify-center p-3 h-24 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${getRoomColor(room.id, room.currentOccupancy, room.capacity)} ${selectedRoom?.id === room.id ? 'ring-4 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 z-10' : ''}`}
                                                    >
                                                        <span className="text-lg font-bold font-mono tracking-tighter">{room.roomNumber}</span>
                                                        
                                                        {mode === 'none' ? (
                                                            <div className="mt-2 flex gap-1">
                                                                {Array.from({ length: room.capacity }).map((_, i) => (
                                                                    <div key={i} className={`w-2 h-2 rounded-full ${i < room.currentOccupancy ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 text-[10px] font-bold text-center leading-tight bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                                {getRoomLabel(room.id) || '-'}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel (Room Profile) */}
                <div className={`w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${selectedRoom ? 'translate-x-0' : 'translate-x-full opacity-0 overflow-hidden'}`} style={!selectedRoom ? { width: 0, border: 0 } : {}}>
                    {selectedRoom && (
                        <>
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        Room {selectedRoom.roomNumber}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">{selectedRoom.type} • Capacity: {selectedRoom.capacity}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedRoom(null)}
                                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                                >
                                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {roomLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-center">
                                                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 mb-1">Occupancy</div>
                                                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{selectedRoom.currentOccupancy}/{selectedRoom.capacity}</div>
                                            </div>
                                            <div className={`p-3 rounded-xl border text-center ${selectedRoom.activeMaintenance.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                                <div className={`text-[10px] uppercase font-bold mb-1 ${selectedRoom.activeMaintenance.length > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500'}`}>Issues</div>
                                                <div className={`text-xl font-black ${selectedRoom.activeMaintenance.length > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>{selectedRoom.activeMaintenance.length}</div>
                                            </div>
                                        </div>

                                        {/* Financial Risk */}
                                        {selectedRoom.totalPendingFees > 0 && (
                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Banknote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    <h4 className="font-bold text-purple-800 dark:text-purple-300 text-sm">Financial Risk</h4>
                                                </div>
                                                <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                                                    ₹{selectedRoom.totalPendingFees.toLocaleString('en-IN')}
                                                </p>
                                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">Pending dues from residents</p>
                                            </div>
                                        )}

                                        {/* Maintenance List */}
                                        {selectedRoom.activeMaintenance.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                                                    <Wrench className="w-4 h-4 text-orange-500" /> Open Maintenance
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedRoom.activeMaintenance.map((m: any) => (
                                                        <div key={m.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{m.category}</span>
                                                                <span className={`text-[10px] font-bold px-1.5 rounded ${m.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'text-slate-400'}`}>{m.priority}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{m.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
