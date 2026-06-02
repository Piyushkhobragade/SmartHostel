import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Users, Clock, CheckCircle, PlusCircle, X } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Visitors</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Pre-register and track your visitors</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-md shadow-blue-200 dark:shadow-none"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Pre-register Visitor</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Pre-register Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pre-register Visitor</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Visitor Name *</label>
                <input
                  value={form.visitorName}
                  onChange={e => setForm({ ...form, visitorName: e.target.value })}
                  required
                  placeholder="Full name"
                  className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Purpose of Visit *</label>
                <input
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  required
                  placeholder="e.g. Family visit, Project work..."
                  className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">ID Type *</label>
                  <select
                    value={form.idType}
                    onChange={e => setForm({ ...form, idType: e.target.value })}
                    className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Aadhar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Last 4 Digits *</label>
                  <input
                    value={form.idLast4}
                    onChange={e => setForm({ ...form, idLast4: e.target.value.slice(0, 4) })}
                    required
                    placeholder="e.g. 7894"
                    maxLength={4}
                    className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {formError && (
                <p className="text-xs text-red-500">{formError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
          </div>
        </div>
      )}

      {/* Active Visitors */}
      {activeVisitors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active / Pre-registered ({activeVisitors.length})
          </h2>
          <div className="space-y-3">
            {activeVisitors.map(v => (
              <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-900/40 shadow-sm p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                  {v.visitorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v.visitorName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{v.purpose} · {v.idType} ••••{v.idLast4}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Checked in: {formatDateTime(v.checkInTime)}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
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
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Visit History ({pastVisitors.length})
          </h2>
          <div className="space-y-2">
            {pastVisitors.map(v => (
              <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                  {v.visitorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v.visitorName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{v.purpose} · {v.idType} ••••{v.idLast4}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(v.checkInTime)} → {v.checkOutTime ? formatDateTime(v.checkOutTime) : '—'}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {visitors.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No visitors yet. Pre-register one above.</p>
        </div>
      )}
    </div>
  );
}
