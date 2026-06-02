import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { BedDouble, Banknote, Calendar, Users, Wrench, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  resident: { id: string; fullName: string; email: string; phone: string; status: string };
  room: { roomNumber: string; type: string; floor?: string; block?: string } | null;
  attendance: { rate: number; streak: number; presentDays: number; totalTracked: number };
  nextDueFee: { id: string; amount: number; dueDate: string; description: string; status: string } | null;
  recentVisitors: any[];
  openMaintenanceCount: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your hostel...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-500">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const daysUntilFee = data.nextDueFee
    ? Math.ceil((new Date(data.nextDueFee.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold mt-0.5">{data.resident.fullName} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {data.room ? `Room ${data.room.roomNumber}` : 'No room assigned'} · {data.resident.status}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
              SmartHostel X
            </span>
            <span className="text-blue-200 text-xs">Student Portal</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BedDouble className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">My Room</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {data.room?.roomNumber || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.room ? `${data.room.type}${data.room.floor ? ` · Floor ${data.room.floor}` : ''}` : 'Not assigned'}
          </p>
        </div>

        {/* Attendance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.attendance.rate}%</p>
          <p className="text-xs text-slate-400 mt-0.5">
            🔥 {data.attendance.streak} day streak
          </p>
        </div>

        {/* Fees */}
        <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm ${
          data.nextDueFee && daysUntilFee !== null && daysUntilFee <= 7
            ? 'border-amber-300 dark:border-amber-700'
            : 'border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              data.nextDueFee && daysUntilFee !== null && daysUntilFee <= 7
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-purple-100 dark:bg-purple-900/30'
            }`}>
              <Banknote className={`w-4 h-4 ${
                data.nextDueFee && daysUntilFee !== null && daysUntilFee <= 7
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-purple-600 dark:text-purple-400'
              }`} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Due</span>
          </div>
          {data.nextDueFee ? (
            <>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{data.nextDueFee.amount.toLocaleString()}
              </p>
              <p className={`text-xs mt-0.5 ${
                daysUntilFee !== null && daysUntilFee <= 7 ? 'text-amber-500' : 'text-slate-400'
              }`}>
                {daysUntilFee !== null && daysUntilFee >= 0 ? `${daysUntilFee} days left` : 'Overdue'}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-600">Clear</p>
              <p className="text-xs text-slate-400 mt-0.5">No pending fees</p>
            </>
          )}
        </div>

        {/* Maintenance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Open Issues</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.openMaintenanceCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">maintenance requests</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/student/room" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
            <BedDouble className="w-5 h-5 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">My Room</span>
          </Link>
          <Link to="/student/fees" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
            <Banknote className="w-5 h-5 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">My Fees</span>
          </Link>
          <Link to="/student/visitors" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 border border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700 transition-all group">
            <Users className="w-5 h-5 text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400">Visitors</span>
          </Link>
          <Link to="/student/room" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
            <Wrench className="w-5 h-5 text-slate-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400">Report Issue</span>
          </Link>
        </div>
      </div>

      {/* Recent Visitors */}
      {data.recentVisitors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Visitors</h2>
            <Link to="/student/visitors" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentVisitors.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                    {v.visitorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.visitorName}</p>
                    <p className="text-xs text-slate-400">{v.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  {v.checkOutTime ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" /> Checked out
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <Clock className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
