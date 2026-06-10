import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Banknote, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '../../components/Spinner';
import StatusBadge, { resolveVariant } from '../../components/widgets/StatusBadge';
import ProgressBar from '../../components/widgets/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';

interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
  issuedAt: string;
  payments: { id: string; amount: number; paidAt: string; method: string }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.amount - totalPaid;
  const payPct = Math.min(Math.round((totalPaid / invoice.amount) * 100), 100);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgb(var(--border-color))' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 transition-colors text-left"
        style={{ background: 'rgb(var(--bg-panel))' }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
          <Banknote className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {invoice.description}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            Due: {formatDate(invoice.dueDate)} · Issued: {formatDate(invoice.issuedAt)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-lg font-bold"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            ₹{invoice.amount.toLocaleString()}
          </p>
          <StatusBadge label={invoice.status} variant={resolveVariant(invoice.status)} />
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
        }
      </button>

      {expanded && (
        <div
          className="border-t p-4"
          style={{ borderColor: 'rgb(var(--border-color))', background: 'rgb(var(--bg-app))' }}
        >
          {/* Payment progress bar */}
          {invoice.payments.length > 0 && (
            <div className="mb-3">
              <div
                className="flex justify-between text-xs mb-1"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                <span>Paid: ₹{totalPaid.toLocaleString()}</span>
                <span>Remaining: ₹{remaining.toLocaleString()}</span>
              </div>
              <ProgressBar
                pct={payPct}
                color="rgb(var(--color-success))"
                height={6}
                showLabel={false}
              />
            </div>
          )}

          {invoice.payments.length === 0 ? (
            <p
              className="text-xs text-center py-2"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Payment History
              </p>
              {invoice.payments.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0"
                  style={{ borderColor: 'rgb(var(--border-color))' }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'rgb(var(--text-primary))' }}
                    >
                      ₹{p.amount.toLocaleString()}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'rgb(var(--text-muted))' }}
                    >
                      {p.method} · {formatDate(p.paidAt)}
                    </p>
                  </div>
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: 'rgb(var(--color-success))' }}
                  />
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
    return <Spinner label="Loading fees..." />;
  }

  const invoices = data?.invoices || [];
  const summary = data?.summary || { totalOwed: 0, totalPaid: 0 };
  const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'rgb(var(--text-primary))' }}
        >
          My Fees
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          Your invoices and payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Outstanding */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(var(--color-warning), 0.10)',
            border: '1px solid rgba(var(--color-warning), 0.30)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: 'rgb(var(--color-warning))' }}
          >
            Outstanding
          </p>
          <p
            className="text-3xl font-bold mt-1"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            ₹{summary.totalOwed.toLocaleString()}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} pending
          </p>
        </div>
        {/* Total Paid */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(var(--color-success), 0.10)',
            border: '1px solid rgba(var(--color-success), 0.30)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: 'rgb(var(--color-success))' }}
          >
            Total Paid
          </p>
          <p
            className="text-3xl font-bold mt-1"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            ₹{summary.totalPaid.toLocaleString()}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            {paidInvoices.length} invoice{paidInvoices.length !== 1 ? 's' : ''} cleared
          </p>
        </div>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div>
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
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
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            Paid ({paidInvoices.length})
          </h2>
          <div className="space-y-3">
            {paidInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <EmptyState
          icon={Banknote}
          title="No invoices found"
          description="Your fee invoices will appear here."
        />
      )}
    </div>
  );
}
