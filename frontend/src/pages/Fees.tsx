import { useState, useEffect } from 'react'
import { feesAPI, residentsAPI } from '../services/api'
import Table from '../components/Table'
import Button from '../components/Button'
import Input from '../components/Input'
import { Plus, X, DollarSign, Banknote } from 'lucide-react'
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
    const [searchQuery, setSearchQuery] = useState('')
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

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            PARTIAL: 'bg-blue-100 text-blue-800 border-blue-200',
            PAID: 'bg-green-100 text-green-800 border-green-200',
        }
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        )
    }

    const getTotalPaid = (invoice: Invoice) => {
        return invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    }

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'ALL' ||
            invoice.status === filterStatus

        return matchesSearch && matchesStatus
    })

    const columns = [
        {
            header: 'Resident',
            accessor: (item: Invoice) => <span className="font-medium text-gray-900 dark:text-white">{item.resident.fullName}</span>
        },
        {
            header: 'Description',
            accessor: 'description' as keyof Invoice
        },
        {
            header: 'Amount',
            accessor: (item: Invoice) => {
                const totalPaid = getTotalPaid(item)
                return (
                    <div className="text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">₹{item.amount.toFixed(2)}</div>
                        {totalPaid > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Paid: ₹{totalPaid.toFixed(2)}</div>
                        )}
                    </div>
                )
            }
        },
        {
            header: 'Due Date',
            accessor: (item: Invoice) => new Date(item.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        },
        { header: 'Status', accessor: (item: Invoice) => getStatusBadge(item.status) },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fee Management</h1>
                    <p className="text-gray-500 mt-1">Manage invoices and track payments</p>
                </div>
                <Button onClick={() => setShowInvoiceForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            {/* Create Invoice Modal */}
            {showInvoiceForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetInvoiceForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Invoice</h2>
                            <button onClick={resetInvoiceForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Resident
                                </label>
                                <select
                                    value={invoiceFormData.residentId}
                                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, residentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentForm && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetPaymentForm} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h2>
                            <button onClick={resetPaymentForm} className="text-gray-400 hover:text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Invoice for: <span className="font-medium text-gray-900 dark:text-white">{selectedInvoice.resident.fullName}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Total Amount: <span className="font-medium text-gray-900 dark:text-white">₹{selectedInvoice.amount.toFixed(2)}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Paid: <span className="font-medium text-gray-900 dark:text-white">₹{getTotalPaid(selectedInvoice).toFixed(2)}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Remaining: <span className="font-medium text-green-600">₹{(selectedInvoice.amount - getTotalPaid(selectedInvoice)).toFixed(2)}</span></div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentFormData.method}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'ALL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDING')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'PENDING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilterStatus('PAID')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'PAID'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Paid
                    </button>
                    <button
                        onClick={() => setFilterStatus('PARTIAL')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'PARTIAL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Partial
                    </button>
                </div>
            </div>

            <Table
                data={filteredInvoices}
                columns={columns}
                isLoading={loading}
                onSearch={setSearchQuery}
                searchPlaceholder="Search invoices..."
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
                actions={(invoice) => (
                    <div className="flex justify-end">
                        {invoice.status !== 'PAID' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); openPaymentModal(invoice); }}
                                className="flex items-center px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Record payment"
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
