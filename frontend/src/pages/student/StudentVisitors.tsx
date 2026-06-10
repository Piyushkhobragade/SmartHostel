import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Users, Clock, CheckCircle, PlusCircle } from 'lucide-react';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import EmptyState from '../../components/ui/EmptyState';

interface Visitor {
  id: string;
  visitorName: string;
  purpose: string;
  idType: string;
  idLast4: string;
  checkInTime: string;
  checkOutTime: string | null;
  preRegistered: boolean;
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function StudentVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitorName: '', purpose: '', idType: 'Aadhar', idLast4: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVisitors = () => {
    studentAPI.getVisitors()
      .then(r => setVisitors(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.idLast4.length !== 4 || !/^\d+$/.test(form.idLast4)) {
      setFormError('Last 4 digits must be exactly 4 numbers.');
      return;
    }
    setSubmitting(true);
    try {
      await studentAPI.createVisitor(form);
      setShowForm(false);
      setForm({ visitorName: '', purpose: '', idType: 'Aadhar', idLast4: '' });
      fetchVisitors();
    } catch {
      setFormError('Failed to register visitor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeVisitors = visitors.filter(v => !v.checkOutTime);
  const pastVisitors = visitors.filter(v => v.checkOutTime);

  if (loading) {
    return <Spinner label="Loading visitors..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>My Visitors</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--text-secondary))' }}>Pre-register and track your visitors</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Pre-register Visitor</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Pre-register Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setFormError(''); }}
        title="Pre-register Visitor"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              Visitor Name *
            </label>
            <input
              value={form.visitorName}
              onChange={e => setForm({ ...form, visitorName: e.target.value })}
              required
              placeholder="Full name"
              className="input-field w-full text-sm"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              Purpose of Visit *
            </label>
            <input
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              required
              placeholder="e.g. Family visit, Project work..."
              className="input-field w-full text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-medium mb-1 block"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                ID Type *
              </label>
              <select
                value={form.idType}
                onChange={e => setForm({ ...form, idType: e.target.value })}
                className="input-field w-full text-sm"
              >
                {['Aadhar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1 block"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                Last 4 Digits *
              </label>
              <input
                value={form.idLast4}
                onChange={e => setForm({ ...form, idLast4: e.target.value.slice(0, 4) })}
                required
                placeholder="e.g. 7894"
                maxLength={4}
                className="input-field w-full text-sm"
              />
            </div>
          </div>
          {formError && (
            <p className="text-xs" style={{ color: 'rgb(var(--color-danger))' }}>{formError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(''); }}
              className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              style={{
                color: 'rgb(var(--text-secondary))',
                border: '1px solid rgb(var(--border-color))',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--bg-app), 0.6)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Registering...' : 'Register Visitor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Active Visitors */}
      {activeVisitors.length > 0 && (
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active / Pre-registered ({activeVisitors.length})
          </h2>
          <div className="space-y-3">
            {activeVisitors.map(v => (
              <div
                key={v.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: 'rgb(var(--bg-panel))',
                  border: '1px solid rgba(var(--color-success), 0.35)',
                }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                  {v.visitorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{v.visitorName}</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{v.purpose} · {v.idType} ••••{v.idLast4}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Checked in: {formatDateTime(v.checkInTime)}</p>
                </div>
                <span
                  className="flex items-center gap-1 text-xs font-medium shrink-0"
                  style={{ color: 'rgb(var(--color-success))' }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: 'rgb(var(--color-success))' }} />
                  {v.preRegistered && !v.checkOutTime ? 'Pre-reg' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Visitors */}
      {pastVisitors.length > 0 && (
        <div>
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Visit History ({pastVisitors.length})
          </h2>
          <div className="space-y-2">
            {pastVisitors.map(v => (
              <div
                key={v.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: 'rgb(var(--bg-panel))',
                  border: '1px solid rgb(var(--border-color))',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    background: 'rgb(var(--bg-app))',
                    border: '1px solid rgb(var(--border-color))',
                    color: 'rgb(var(--text-secondary))',
                  }}
                >
                  {v.visitorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{v.visitorName}</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{v.purpose} · {v.idType} ••••{v.idLast4}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                    {formatDateTime(v.checkInTime)} → {v.checkOutTime ? formatDateTime(v.checkOutTime) : '—'}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'rgb(var(--border-color))' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {visitors.length === 0 && (
        <EmptyState
          icon={Users}
          title="No visitors yet"
          description="Pre-register a visitor using the button above."
        />
      )}
    </div>
  );
}
