import { useState, useEffect } from 'react';
import { residentsAPI, roomsAPI, maintenanceAPI, attendanceAPI, feesAPI } from '../services/api';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { Users, BedDouble, Wrench, Banknote, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DashboardStats {
    totalResidents: number;
    occupiedRooms: number;
    pendingMaintenance: number;
    monthlyFeeCollection: number;
}

interface AttendanceData {
    day: string;
    count: number;
    date: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalResidents: 0,
        occupiedRooms: 0,
        pendingMaintenance: 0,
        monthlyFeeCollection: 0,
    });
    const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setChartLoading(true);

            // Fetch all data in parallel
            const [residentsRes, roomsRes, maintenanceRes, feesRes] = await Promise.all([
                residentsAPI.getAll(),
                roomsAPI.getAll(),
                maintenanceAPI.getAll(),
                feesAPI.getInvoices(),
            ]);

            // Calculate stats
            const residents = residentsRes.data || [];
            const rooms = roomsRes.data || [];
            const maintenance = maintenanceRes.data || [];
            const invoices = feesRes.data || [];

            // Count occupied rooms
            const occupiedRooms = rooms.filter((room: any) =>
                room.currentOccupancy > 0
            ).length;

            // Count pending maintenance
            const pendingMaintenance = maintenance.filter((req: any) =>
                req.status === 'PENDING' || req.status === 'IN_PROGRESS'
            ).length;

            // Count pending fees (unpaid invoices)
            const pendingFees = invoices.filter((invoice: any) =>
                invoice.status === 'PENDING' || invoice.status === 'PARTIAL'
            ).length;

            setStats({
                totalResidents: residents.length,
                occupiedRooms,
                pendingMaintenance,
                monthlyFeeCollection: pendingFees,
            });

            // Fetch attendance data for last 7 days
            await fetchAttendanceData();

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceData = async () => {
        try {
            const last7Days: AttendanceData[] = [];
            const today = new Date();

            // Generate last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                try {
                    const response = await attendanceAPI.getAll({ date: dateStr });
                    const attendanceRecords = response.data || [];

                    last7Days.push({
                        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        count: attendanceRecords.length,
                        date: dateStr,
                    });
                } catch (err) {
                    // If no data for this day, add 0
                    last7Days.push({
                        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        count: 0,
                        date: dateStr,
                    });
                }
            }

            setAttendanceData(last7Days);
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
        } finally {
            setChartLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Residents',
            value: stats.totalResidents,
            icon: Users,
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50',
            bgDark: 'dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            trend: 'Active residents',
            delay: 'delay-0'
        },
        {
            title: 'Occupied Rooms',
            value: stats.occupiedRooms,
            icon: BedDouble,
            gradient: 'from-green-500 to-green-600',
            bgLight: 'bg-green-50',
            bgDark: 'dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400',
            trend: 'Currently occupied',
            delay: 'delay-75'
        },
        {
            title: 'Pending Maintenance',
            value: stats.pendingMaintenance,
            icon: Wrench,
            gradient: 'from-orange-500 to-orange-600',
            bgLight: 'bg-orange-50',
            bgDark: 'dark:bg-orange-900/20',
            textColor: 'text-orange-600 dark:text-orange-400',
            trend: 'Requests pending',
            delay: 'delay-150'
        },
        {
            title: 'Fees Pending',
            value: stats.monthlyFeeCollection,
            icon: Banknote,
            gradient: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50',
            bgDark: 'dark:bg-purple-900/20',
            textColor: 'text-purple-600 dark:text-purple-400',
            trend: 'Unpaid invoices',
            delay: 'delay-200'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of hostel operations</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700 animate-fadeIn ${card.delay}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                                        {card.value}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {card.trend}
                                    </p>
                                </div>
                                <div className={`${card.bgLight} ${card.bgDark} p-3 rounded-xl`}>
                                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly Attendance Trend Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 animate-fadeIn delay-300">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Weekly Attendance Trend
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Attendance count for the last 7 days
                        </p>
                    </div>
                </div>

                {chartLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : attendanceData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No attendance data available</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                            Start marking attendance to see trends
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                            <XAxis
                                dataKey="day"
                                stroke="#6b7280"
                                className="dark:stroke-slate-400"
                                tick={{ fill: '#6b7280' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                className="dark:stroke-slate-400"
                                tick={{ fill: '#6b7280' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.75rem',
                                    color: '#f1f5f9',
                                    padding: '12px'
                                }}
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                formatter={(value: any) => [`${value} residents`, 'Present']}
                            />
                            <Bar
                                dataKey="count"
                                fill="url(#colorGradient)"
                                radius={[8, 8, 0, 0]}
                            />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
