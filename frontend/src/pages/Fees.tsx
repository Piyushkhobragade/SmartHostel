/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { feesAPI, residentsAPI } from '../services/api'
import { DataGrid } from '../components/DataGrid'
import type { ColumnDef } from '../components/DataGrid'
import Modal from '../components/Modal'
import StatusBadge from '../components/widgets/StatusBadge'
import type { StatusVariant } from '../components/widgets/StatusBadge'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, DollarSign, Banknote } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'

interface Resident {
    id: string
    fullName: string
}

interface Payment {
    id: string
    amount: number
    paidAt: string
    method: string
    reference?: string
}

interface Invoice {
    id: string
    amount: number
    dueDate: string
    description: string
    status: string
    issuedAt: string
    resident: Resident
    payments: Payment[]
}

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
    PAID: 'success',
    PARTIAL: 'warning',
    PENDING: 'danger',
}

export default function Fees() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [invoiceFormData, setInvoiceFormData] = useState({
        residentId: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        description: '',
    })
    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        method: 'CASH',
        reference: '',
    })
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'PARTIAL'>('ALL')
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [invoicesRes, residentsRes] = await Promise.all([
                feesAPI.getInvoices(),
                residentsAPI.getAll(),
            ])
            setInvoices(invoicesRes.data)
            setResidents(residentsRes.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('Failed to load fee data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleInvoiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await feesAPI.createInvoice({
                ...invoiceFormData,
                amount: parseFloat(invoiceFormData.amount)
            })
            showToast('Invoice created successfully', 'success')
            fetchData()
            resetInvoiceForm()
        } catch (error) {
            console.error('Failed to create invoice:', error)
            showToast('Failed to create invoice', 'error')
        }
    }

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedInvoice) return

        try {
            await feesAPI.createPayment({
                invoiceId: selectedInvoice.id,
                amount: parseFloat(paymentFormData.amount),
                method: paymentFormData.method,
                reference: paymentFormData.reference || undefined
            })
            showToast('Payment recorded successfully', 'success')
            fetchData()
            resetPaymentForm()
        } catch (error: any) {
            console.error('Failed to record payment:', error)
            const errorMessage = error.response?.data?.error || 'Failed to record payment'
            showToast(errorMessage, 'error')
        }
    }

    const resetInvoiceForm = () => {
        setInvoiceFormData({
            residentId: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0],
            description: '',
        })
        setShowInvoiceForm(false)
    }

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            method: 'CASH',
            reference: '',
        })
        setSelectedInvoice(null)
        setShowPaymentForm(false)
    }

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
        const remaining = invoice.amount - totalPaid
        setPaymentFormData({
            amount: remaining.toString(),
            method: 'CASH',
            reference: '',
        })
        setShowPaymentForm(true)
    }

    const getTotalPaid = (invoice: Invoice) => {
        return invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    }

    const filteredInvoices = invoices.filter(invoice => {
        const matchesStatus =
            filterStatus === 'ALL' ||
            invoice.status === filterStatus
        return matchesStatus
    })

    const columns: ColumnDef<Invoice>[] = [
        {
            key: 'resident',
            header: 'Resident',
            accessor: (item) => (
                <span style={{ color: 'rgb(var(--text-primary))', fontWeight: 500 }}>
                    {item.resident.fullName}
                </span>
            ),
            sortable: true,
        },
        {
            key: 'description',
            header: 'Description',
            accessor: 'description',
        },
        {
            key: 'amount',
            header: 'Amount',
            accessor: (item) => {
                const totalPaid = getTotalPaid(item)
                return (
                    <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, color: 'rgb(var(--text-primary))' }}>
                            ₹{item.amount.toFixed(2)}
                        </div>
                        {totalPaid > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
                                Paid: ₹{totalPaid.toFixed(2)}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            accessor: (item) =>
                new Date(item.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (item) => (
                <StatusBadge
                    label={item.status}
                    variant={STATUS_VARIANT_MAP[item.status] ?? 'muted'}
                />
            ),
        },
    ]

    const filterPills: { label: string; value: 'ALL' | 'PENDING' | 'PAID' | 'PARTIAL' }[] = [
        { label: 'All', value: 'ALL' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Partial', value: 'PARTIAL' },
    ]

    return (
        <div className="space-y-6">
            {/* Create Invoice Modal */}
            <Modal
                isOpen={showInvoiceForm}
                onClose={resetInvoiceForm}
                title="Create Invoice"
                maxWidth="md"
            >
                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'rgb(var(--text-secondary))',
                                marginBottom: '0.25rem',
                            }}
                        >
                            Resident
                        </label>
                        <select
                            value={invoiceFormData.residentId}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, residentId: e.target.value })}
                            className="input-field w-full"
                            required
                        >
                            <option value="">Select resident</option>
                            {residents.map((resident) => (
                                <option key={resident.id} value={resident.id}>
                                    {resident.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Amount (₹)"
                        type="number"
                        step="0.01"
                        value={invoiceFormData.amount}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
                        placeholder="Enter amount"
                        required
                    />
                    <Input
                        label="Due Date"
                        type="date"
                        value={invoiceFormData.dueDate}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                        required
                    />
                    <Input
                        label="Description"
                        value={invoiceFormData.description}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                        placeholder="e.g., Monthly Rent - November 2024"
                        required
                    />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={resetInvoiceForm} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Create Invoice
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentForm && selectedInvoice !== null}
                onClose={resetPaymentForm}
                title="Record Payment"
                maxWidth="md"
            >
                {selectedInvoice && (
                    <>
                        <div
                            style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(var(--border-color), 0.20)',
                            }}
                        >
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                Invoice for:{' '}
                                <span style={{ fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                                    {selectedInvoice.resident.fullName}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                                Total Amount:{' '}
                                <span style={{ fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                                    ₹{selectedInvoice.amount.toFixed(2)}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                                Paid:{' '}
                                <span style={{ fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                                    ₹{getTotalPaid(selectedInvoice).toFixed(2)}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                                Remaining:{' '}
                                <span style={{ fontWeight: 500, color: 'rgb(var(--color-success))' }}>
                                    ₹{(selectedInvoice.amount - getTotalPaid(selectedInvoice)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <Input
                                label="Payment Amount (₹)"
                                type="number"
                                step="0.01"
                                value={paymentFormData.amount}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                                placeholder="Enter payment amount"
                                required
                            />
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'rgb(var(--text-secondary))',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    Payment Method
                                </label>
                                <select
                                    value={paymentFormData.method}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value })}
                                    className="input-field w-full"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="ONLINE">Online Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>
                            <Input
                                label="Reference / Transaction ID (Optional)"
                                value={paymentFormData.reference}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                                placeholder="Enter reference number"
                            />
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetPaymentForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Record Payment
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </Modal>

            {/* Filter Pill Buttons */}
            <div className="flex items-center space-x-4 mb-4">
                <div
                    className="flex items-center space-x-2 rounded-lg p-1"
                    style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}
                >
                    {filterPills.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setFilterStatus(value)}
                            style={
                                filterStatus === value
                                    ? {
                                          background: 'rgba(var(--color-primary), 0.12)',
                                          color: 'rgb(var(--color-primary))',
                                          border: '1px solid rgba(var(--color-primary), 0.30)',
                                      }
                                    : {
                                          background: 'transparent',
                                          color: 'rgb(var(--text-secondary))',
                                          border: '1px solid rgb(var(--border-color))',
                                      }
                            }
                            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <DataGrid<Invoice>
                title="Fee Management"
                data={filteredInvoices}
                columns={columns}
                loading={loading}
                searchFilter={(row, q) =>
                    row.resident.fullName.toLowerCase().includes(q.toLowerCase()) ||
                    row.description.toLowerCase().includes(q.toLowerCase())
                }
                csvExport={{ filename: 'fees' }}
                toolbarActions={
                    <Button onClick={() => setShowInvoiceForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                    </Button>
                }
                emptyState={
                    <EmptyState
                        icon={Banknote}
                        title="No fee invoices"
                        description="Create invoices to manage hostel fee payments and tracking."
                        action={
                            <Button onClick={() => setShowInvoiceForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                        }
                    />
                }
                rowActions={(invoice) => (
                    <div className="flex justify-end">
                        {invoice.status !== 'PAID' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); openPaymentModal(invoice); }}
                                title="Record payment"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.375rem 0.75rem',
                                    fontSize: '0.875rem',
                                    borderRadius: '0.5rem',
                                    color: 'rgb(var(--color-success))',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background =
                                        'rgba(var(--color-success), 0.10)'
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                                }}
                            >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Pay
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    )
}
