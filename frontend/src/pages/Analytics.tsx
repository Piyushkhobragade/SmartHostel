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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics & Reports</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Track occupancy trends and fee collection over time</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Occupancy</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{avgOccupancy}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 30 days</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoiced</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalInvoiced.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 30 days</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 30 days</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Collection Rate</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{collectionRate}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-100">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Paid vs Invoiced</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Occupancy Rate Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Rate Trend</h3>
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
                                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.date}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Occupancy: <span className="font-semibold text-blue-600">{data.occupancyRate}%</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Collection Trend</h3>
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
                                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].payload.date}</p>
                                                    <p className="text-sm text-green-600 mt-1">
                                                        Invoiced: <span className="font-semibold">₹{payload[0].value?.toLocaleString()}</span>
                                                    </p>
                                                    <p className="text-sm text-blue-600">
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Forecast Occupancy Trend</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Statistical Forecast (Linear Regression + Moving Average) - Next 7 Days
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
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
                                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].payload.date}</p>
                                                    <p className="text-sm text-purple-600 mt-1">
                                                        Predicted: <span className="font-semibold">{payload[0].value}%</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
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
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
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
