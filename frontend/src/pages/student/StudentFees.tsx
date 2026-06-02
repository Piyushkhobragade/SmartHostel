import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Banknote, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
  issuedAt: string;
  payments: { id: string; amount: number; paidAt: string; method: string }[];
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: { label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PAID: { label: 'Paid', icon: <CheckCircle className="w-3.5 h-3.5" />, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  OVERDUE: { label: 'Overdue', icon: <AlertCircle className="w-3.5 h-3.5" />, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  PARTIAL: { label: 'Partial', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[invoice.status] || statusConfig.PENDING;
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.amount - totalPaid;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
          <Banknote className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{invoice.description}</p>
          <p className="text-xs text-slate-400 mt-0.5">Due: {formatDate(invoice.dueDate)} · Issued: {formatDate(invoice.issuedAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-slate-900 dark:text-white">₹{invoice.amount.toLocaleString()}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.className}`}>
            {config.icon} {config.label}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
          {/* Payment progress bar */}
          {invoice.payments.length > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Paid: ₹{totalPaid.toLocaleString()}</span>
                <span>Remaining: ₹{remaining.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.min((totalPaid / invoice.amount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {invoice.payments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Payment History</p>
              {invoice.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">₹{p.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{p.method} · {formatDate(p.paidAt)}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentFees() {
  const [data, setData] = useState<{ invoices: Invoice[]; summary: { totalOwed: number; totalPaid: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getFees()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const invoices = data?.invoices || [];
  const summary = data?.summary || { totalOwed: 0, totalPaid: 0 };
  const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Fees</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your invoices and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-amber-100 text-xs font-medium">Outstanding</p>
          <p className="text-3xl font-bold mt-1">₹{summary.totalOwed.toLocaleString()}</p>
          <p className="text-amber-200 text-xs mt-1">{pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} pending</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-green-100 text-xs font-medium">Total Paid</p>
          <p className="text-3xl font-bold mt-1">₹{summary.totalPaid.toLocaleString()}</p>
          <p className="text-green-200 text-xs mt-1">{paidInvoices.length} invoice{paidInvoices.length !== 1 ? 's' : ''} cleared</p>
        </div>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Pending / Due ({pendingInvoices.length})
          </h2>
          <div className="space-y-3">
            {pendingInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
          </div>
        </div>
      )}

      {/* Paid Invoices */}
      {paidInvoices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Paid ({paidInvoices.length})
          </h2>
          <div className="space-y-3">
            {paidInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div className="text-center py-16">
          <Banknote className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No invoices found.</p>
        </div>
      )}
    </div>
  );
}
