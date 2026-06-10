import { useState, useEffect } from 'react'
import { analyticsAPI } from '../services/api'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'
import { useToast } from '../context/ToastContext'

interface OccupancyData {
    date: string
    totalBeds: number
    occupiedBeds: number
}

interface FeesData {
    date: string
    totalInvoiced: number
    totalPaid: number
}

interface ForecastData {
    date: string
    predictedOccupancyRate: number
    method: string
}

export default function Analytics() {
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
    const [feesData, setFeesData] = useState<FeesData[]>([])
    const [forecastData, setForecastData] = useState<ForecastData[]>([])
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [occupancyRes, feesRes, forecastRes] = await Promise.all([
                analyticsAPI.getOccupancy(),
                analyticsAPI.getFees(),
                analyticsAPI.getForecast(),
            ])
            setOccupancyData(occupancyRes.data)
            setFeesData(feesRes.data)
            setForecastData(forecastRes.data.forecast)
        } catch (error) {
            console.error('Failed to fetch analytics data:', error)
            showToast('Failed to load analytics data', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Transform occupancy data to include occupancy rate
    const occupancyChartData = occupancyData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        occupancyRate: item.totalBeds > 0 ? Math.round((item.occupiedBeds / item.totalBeds) * 100) : 0,
        occupied: item.occupiedBeds,
        total: item.totalBeds
    }))

    // Transform fees data for chart
    const feesChartData = feesData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        invoiced: item.totalInvoiced,
        paid: item.totalPaid
    }))

    // Calculate summary stats
    const avgOccupancy = occupancyChartData.length > 0
        ? Math.round(occupancyChartData.reduce((sum, item) => sum + item.occupancyRate, 0) / occupancyChartData.length)
        : 0

    const totalInvoiced = feesData.reduce((sum, item) => sum + item.totalInvoiced, 0)
    const totalPaid = feesData.reduce((sum, item) => sum + item.totalPaid, 0)
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1
                    className="text-2xl font-bold"
                    style={{ color: 'rgb(var(--text-primary))' }}
                >
                    Analytics &amp; Reports
                </h1>
                <p
                    className="mt-1"
                    style={{ color: 'rgb(var(--text-muted))' }}
                >
                    Track occupancy trends and fee collection over time
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Avg Occupancy */}
                <div
                    className="rounded-xl shadow-sm p-6"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{ color: 'rgb(var(--text-secondary))' }}
                            >
                                Avg Occupancy
                            </p>
                            <p
                                className="text-3xl font-bold mt-2"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                {avgOccupancy}%
                            </p>
                        </div>
                        <div style={{ background: 'rgba(var(--color-primary), 0.12)', borderRadius: '8px', padding: '12px' }}>
                            <TrendingUp className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
                        </div>
                    </div>
                    <p
                        className="text-sm mt-4"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Last 30 days
                    </p>
                </div>

                {/* Total Invoiced */}
                <div
                    className="rounded-xl shadow-sm p-6"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{ color: 'rgb(var(--text-secondary))' }}
                            >
                                Total Invoiced
                            </p>
                            <p
                                className="text-3xl font-bold mt-2"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                ₹{totalInvoiced.toLocaleString()}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(var(--color-success), 0.12)', borderRadius: '8px', padding: '12px' }}>
                            <DollarSign className="w-6 h-6" style={{ color: 'rgb(var(--color-success))' }} />
                        </div>
                    </div>
                    <p
                        className="text-sm mt-4"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Last 30 days
                    </p>
                </div>

                {/* Total Collected */}
                <div
                    className="rounded-xl shadow-sm p-6"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{ color: 'rgb(var(--text-secondary))' }}
                            >
                                Total Collected
                            </p>
                            <p
                                className="text-3xl font-bold mt-2"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                ₹{totalPaid.toLocaleString()}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(var(--color-info), 0.12)', borderRadius: '8px', padding: '12px' }}>
                            <DollarSign className="w-6 h-6" style={{ color: 'rgb(var(--color-info))' }} />
                        </div>
                    </div>
                    <p
                        className="text-sm mt-4"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Last 30 days
                    </p>
                </div>

                {/* Collection Rate */}
                <div
                    className="rounded-xl shadow-sm p-6"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{ color: 'rgb(var(--text-secondary))' }}
                            >
                                Collection Rate
                            </p>
                            <p
                                className="text-3xl font-bold mt-2"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                {collectionRate}%
                            </p>
                        </div>
                        <div style={{ background: 'rgba(var(--color-warning), 0.12)', borderRadius: '8px', padding: '12px' }}>
                            <TrendingUp className="w-6 h-6" style={{ color: 'rgb(var(--color-warning))' }} />
                        </div>
                    </div>
                    <p
                        className="text-sm mt-4"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        Paid vs Invoiced
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Occupancy Rate Chart */}
                <div
                    className="p-6 rounded-xl shadow-sm"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <h3
                        className="text-lg font-semibold mb-4"
                        style={{ color: 'rgb(var(--text-primary))' }}
                    >
                        Occupancy Rate Trend
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={occupancyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload
                                            return (
                                                <div style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))', borderRadius: '8px', padding: '12px' }} className="shadow-lg">
                                                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{data.date}</p>
                                                    <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                                                        Occupancy: <span className="font-semibold" style={{ color: '#3B82F6' }}>{data.occupancyRate}%</span>
                                                    </p>
                                                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                                        {data.occupied} / {data.total} beds
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="occupancyRate"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fee Collection Chart */}
                <div
                    className="p-6 rounded-xl shadow-sm"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <h3
                        className="text-lg font-semibold mb-4"
                        style={{ color: 'rgb(var(--text-primary))' }}
                    >
                        Fee Collection Trend
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feesChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))', borderRadius: '8px', padding: '12px' }} className="shadow-lg">
                                                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{payload[0].payload.date}</p>
                                                    <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-success))' }}>
                                                        Invoiced: <span className="font-semibold">₹{payload[0].value?.toLocaleString()}</span>
                                                    </p>
                                                    <p className="text-sm" style={{ color: '#3B82F6' }}>
                                                        Collected: <span className="font-semibold">₹{payload[1]?.value?.toLocaleString() || 0}</span>
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="invoiced" fill="#10B981" name="Invoiced" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="paid" fill="#3B82F6" name="Collected" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Forecast Chart */}
            {forecastData.length > 0 && (
                <div
                    className="p-6 rounded-xl shadow-sm"
                    style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3
                                className="text-lg font-semibold"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                Forecast Occupancy Trend
                            </h3>
                            <p
                                className="text-sm mt-1"
                                style={{ color: 'rgb(var(--text-muted))' }}
                            >
                                Statistical Forecast (Linear Regression + Moving Average) - Next 7 Days
                            </p>
                        </div>
                        <div style={{ background: 'rgba(var(--color-info), 0.10)', color: 'rgb(var(--color-info))', border: '1px solid rgba(var(--color-info), 0.30)', borderRadius: '9999px', padding: '2px 12px', fontSize: '12px', fontWeight: 600 }}>
                            Educational Forecast
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastData.map(item => ({
                                date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                                predicted: item.predictedOccupancyRate
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    domain={[0, 100]}
                                    label={{ value: 'Predicted Occupancy %', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))', borderRadius: '8px', padding: '12px' }} className="shadow-lg">
                                                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{payload[0].payload.date}</p>
                                                    <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-info))' }}>
                                                        Predicted: <span className="font-semibold">{payload[0].value}%</span>
                                                    </p>
                                                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                                        Statistical forecast
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#9333EA"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={{ r: 5, fill: '#9333EA', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ background: 'rgb(var(--bg-app))', border: '1px solid rgb(var(--border-color))', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                        <p style={{ color: 'rgb(var(--text-muted))' }} className="text-xs">
                            <strong>Note:</strong> This forecast uses simple linear regression combined with 7-day moving average
                            for educational purposes. It analyzes historical occupancy patterns to predict future trends.
                            Not intended as financial or operational advice.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
