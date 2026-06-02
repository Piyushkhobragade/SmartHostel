import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { BedDouble, Users, Wrench, ChevronRight, AlertCircle, CheckCircle, Clock, PlusCircle } from 'lucide-react';

interface RoomData {
  room: { id: string; roomNumber: string; type: string; status: string; capacity: number; currentOccupancy: number; floor?: string; block?: string } | null;
  roommates: { id: string; fullName: string; email: string; phone: string }[];
  maintenance: { id: string; category: string; description: string; status: string; priority: string; createdAt: string }[];
}

const priorityColor: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcon = (status: string) => {
  if (status === 'RESOLVED') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'IN_PROGRESS') return <Clock className="w-4 h-4 text-blue-500" />;
  return <AlertCircle className="w-4 h-4 text-amber-500" />;
};

export default function StudentRoom() {
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  // Report issue form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Plumbing', description: '', priority: 'MEDIUM' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    studentAPI.getRoom()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await studentAPI.createMaintenance(form);
      setSubmitted(true);
      setShowForm(false);
      // Refresh
      const r = await studentAPI.getRoom();
      setData(r.data);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No room assigned yet. Contact hostel management.</p>
        </div>
      </div>
    );
  }

  const { room, roommates, maintenance } = data;
  const occupancyPct = Math.round((room.currentOccupancy / room.capacity) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Room</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Room details and status</p>
      </div>

      {/* Room Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Current Room</p>
            <p className="text-5xl font-bold mt-1">{room.roomNumber}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{room.type}</span>
              {room.floor && <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">Floor {room.floor}</span>}
              {room.block && <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">Block {room.block}</span>}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                room.status === 'OCCUPIED' ? 'bg-green-400/30 text-green-100' : 'bg-amber-400/30 text-amber-100'
              }`}>{room.status}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-full bg-white/20 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{room.currentOccupancy}</span>
              <span className="text-[10px] text-blue-200">of {room.capacity}</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">{occupancyPct}% full</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Roommates */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Roommates ({roommates.length})
            </h2>
          </div>
          {roommates.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No other residents in this room.</p>
          ) : (
            <div className="space-y-3">
              {roommates.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {r.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.fullName}</p>
                    <p className="text-xs text-slate-400">{r.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Open Issues ({maintenance.length})
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </div>

          {submitted && (
            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" /> Issue reported successfully!
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmitIssue} className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {['Plumbing', 'Electrical', 'Furniture', 'Cleaning', 'Internet', 'AC', 'Other'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue..."
                required
                rows={2}
                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}

          {maintenance.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No open issues. All good! ✓</p>
          ) : (
            <div className="space-y-2">
              {maintenance.map(m => (
                <div key={m.id} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  {statusIcon(m.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor[m.priority] || priorityColor.MEDIUM}`}>
                        {m.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{m.description}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
