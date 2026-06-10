import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { BedDouble, Users, Wrench, ChevronRight, CheckCircle, PlusCircle } from 'lucide-react';
import Spinner from '../../components/Spinner';
import StatusBadge, { resolveVariant } from '../../components/widgets/StatusBadge';
import ScoreRing from '../../components/widgets/ScoreRing';

interface RoomData {
  room: { id: string; roomNumber: string; type: string; status: string; capacity: number; currentOccupancy: number; floor?: string; block?: string } | null;
  roommates: { id: string; fullName: string; email: string; phone: string }[];
  maintenance: { id: string; category: string; description: string; status: string; priority: string; createdAt: string }[];
}

const priorityStyle = (priority: string): React.CSSProperties => {
  if (priority === 'URGENT') return { background: 'rgba(var(--color-danger), 0.12)', color: 'rgb(var(--color-danger))', border: '1px solid rgba(var(--color-danger), 0.30)' };
  if (priority === 'HIGH')   return { background: 'rgba(var(--color-warning), 0.12)', color: 'rgb(var(--color-warning))', border: '1px solid rgba(var(--color-warning), 0.30)' };
  if (priority === 'MEDIUM') return { background: 'rgba(var(--color-info), 0.12)', color: 'rgb(var(--color-info))', border: '1px solid rgba(var(--color-info), 0.30)' };
  return { background: 'rgba(var(--border-color), 0.5)', color: 'rgb(var(--text-muted))', border: '1px solid rgb(var(--border-color))' };
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
    return <Spinner label="Loading room..." />;
  }

  if (!data?.room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BedDouble className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>No room assigned yet. Contact hostel management.</p>
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
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>My Room</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Room details and status</p>
      </div>

      {/* Room Card — gradient hero, accent colours intentional */}
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
            <ScoreRing
              score={occupancyPct}
              label={`${room.currentOccupancy}/${room.capacity}`}
              color={occupancyPct > 90 ? 'rgb(var(--color-danger))' : occupancyPct >= 60 ? 'rgb(var(--color-success))' : 'rgb(var(--color-warning))'}
              size={64}
            />
            <p className="text-xs text-blue-200 mt-1">{occupancyPct}% full</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Roommates */}
        <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: 'rgb(var(--color-primary))' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
              Roommates ({roommates.length})
            </h2>
          </div>
          {roommates.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'rgb(var(--text-muted))' }}>No other residents in this room.</p>
          ) : (
            <div className="space-y-3">
              {roommates.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  {/* Avatar gradient — accent colour, acceptable */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {r.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{r.fullName}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{r.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
                Open Issues ({maintenance.length})
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </div>

          {submitted && (
            <div
              className="mb-3 p-2 rounded-lg text-xs flex items-center gap-2"
              style={{ background: 'rgba(var(--color-success), 0.10)', color: 'rgb(var(--color-success))' }}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Issue reported successfully!
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmitIssue} className="mb-4 p-3 rounded-lg space-y-2" style={{ background: 'rgb(var(--bg-app))' }}>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm input-field"
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
                className="w-full text-sm input-field resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="flex-1 text-sm input-field"
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
            <p className="text-sm text-center py-4" style={{ color: 'rgb(var(--text-muted))' }}>No open issues. All good! ✓</p>
          ) : (
            <div className="space-y-2">
              {maintenance.map(m => (
                <div
                  key={m.id}
                  className="flex items-start gap-2 py-2 last:border-0"
                  style={{ borderBottom: '1px solid rgb(var(--border-color))' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{m.category}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={priorityStyle(m.priority)}
                      >
                        {m.priority}
                      </span>
                      <StatusBadge label={m.status} variant={resolveVariant(m.status)} />
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgb(var(--text-secondary))' }}>{m.description}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                      Opened {Math.max(0, Math.floor((Date.now() - new Date(m.createdAt).getTime()) / 86400000))} days ago
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 shrink-0 mt-1" style={{ color: 'rgb(var(--text-muted))' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
