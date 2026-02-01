import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Activity, AlertCircle, Users, Download,
    BarChart3, PieChart as PieChartIcon, Clock, Calendar, AlertTriangle
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell
} from 'recharts';
import { analyticsAPI } from '../utils/api';
import AdminLayout from '../layouts/AdminLayout';

export default function AnalyticsDashboard({ onLogout }) {
    const [dailyTrends, setDailyTrends] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [occupancy, setOccupancy] = useState([]);
    const [mealStats, setMealStats] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [lateOuts, setLateOuts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
        const interval = setInterval(loadAnalytics, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadAnalytics = async () => {
        try {
            // Fetch real data from all endpoints
            const [trendsRes, peakRes, occRes, mealRes, anomRes, lateRes] = await Promise.all([
                analyticsAPI.getDailyTrends(30), // Last 30 days
                analyticsAPI.getPeakHours(7),    // Last 7 days
                analyticsAPI.getOccupancy(),
                analyticsAPI.getMealUtilization(30), // Last 30 days avg
                analyticsAPI.getAnomalies(),
                analyticsAPI.getLateOuts(30, 3)  // 3+ late outs in 30 days
            ]);

            setDailyTrends(trendsRes.data);
            setPeakHours(peakRes.data);
            setOccupancy(occRes.data);
            setMealStats(mealRes.data);
            setAnomalies(anomRes.data);
            setLateOuts(lateRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading analytics:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout onLogout={onLogout}>
                <div className="flex items-center justify-center h-screen">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                    />
                </div>
            </AdminLayout>
        );
    }

    // Process Data for Charts
    const trendData = dailyTrends.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        in_count: d.in_count,
        out_count: d.out_count,
        unique: d.unique_students
    }));

    const peakData = peakHours.map(h => ({
        hour: `${h.hour}:00`,
        in: h.in_count,
        out: h.out_count
    }));

    const mealData = mealStats.map(m => ({
        name: m.meal_time,
        attendance: m.avg_attendance,
        optOut: m.avg_optout_percentage
    }));

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-7xl mx-auto pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl mb-8 flex justify-between items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-purple-400" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-white/60">Real-time hostel insights</p>
                    </div>
                    {/* <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </button> */}
                </motion.div>

                {/* KPI Cards (Derived from Daily Trends) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        title="Avg Daily In"
                        value={Math.round(dailyTrends.reduce((acc, curr) => acc + curr.in_count, 0) / (dailyTrends.length || 1))}
                        icon={<Users className="text-emerald-400" />}
                        color="bg-emerald-500/10 border-emerald-500/20"
                    />
                    <KPICard
                        title="Avg Daily Out"
                        value={Math.round(dailyTrends.reduce((acc, curr) => acc + curr.out_count, 0) / (dailyTrends.length || 1))}
                        icon={<LogOutIcon className="text-amber-400" />}
                        color="bg-amber-500/10 border-amber-500/20"
                    />
                    <KPICard
                        title="Anomalies"
                        value={anomalies.length}
                        icon={<AlertCircle className="text-red-400" />}
                        color="bg-red-500/10 border-red-500/20"
                    />
                    <KPICard
                        title="Frequent Late Outs"
                        value={lateOuts.length}
                        icon={<Clock className="text-purple-400" />}
                        color="bg-purple-500/10 border-purple-500/20"
                    />
                </div>

                {/* Row 1: Daily Trends */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card mb-8"
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        30-Day Attendance Trends
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="in" name="In Entries" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="out" name="Out Entries" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Row 2: Peak Hours & Meal Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-400" />
                            Peak Activity Hours (Last 7 Days)
                        </h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={peakData}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                    <Area type="monotone" dataKey="in" name="IN" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" />
                                    <Area type="monotone" dataKey="out" name="OUT" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOut)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UtensilsIcon className="w-5 h-5 text-purple-400" />
                            Meal Utilization (Avg Attendance)
                        </h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mealData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                    <Bar dataKey="attendance" name="Avg Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Row 3: Occupancy & Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Occupancy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card lg:col-span-1"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-blue-400" />
                            Block Occupancy
                        </h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={occupancy} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                                    <YAxis dataKey="block" type="category" stroke="#9ca3af" width={50} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                    <Bar dataKey="occupancy_percentage" name="Occupancy %" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        {occupancy.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.occupancy_percentage > 90 ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Lists */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Anomalies */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="card border border-red-500/20"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-300">
                                <AlertTriangle className="w-5 h-5" />
                                Critical Anomalies
                            </h2>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {anomalies.length === 0 ? (
                                    <p className="text-white/40 text-sm text-center py-8">No anomalies detected.</p>
                                ) : (
                                    anomalies.map((a, i) => (
                                        <div key={i} className="bg-red-500/10 p-3 rounded-lg border border-red-500/10">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-red-200 text-sm">{a.student_name}</h3>
                                                <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded text-red-300">{a.anomaly_type}</span>
                                            </div>
                                            <p className="text-xs text-white/50 mt-1">{a.description}</p>
                                            <p className="text-[10px] text-white/30 mt-2 text-right">
                                                {new Date(a.detected_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* Late Outs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="card"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-300">
                                <Clock className="w-5 h-5" />
                                Frequent Late Arrivals
                            </h2>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {lateOuts.length === 0 ? (
                                    <p className="text-white/40 text-sm text-center py-8">No frequent late-outs recorded.</p>
                                ) : (
                                    lateOuts.map((l, i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium text-white/90 text-sm">{l.student_name}</h3>
                                                <p className="text-xs text-white/40">Last: {new Date(l.last_late_time).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-purple-400">{l.late_count}</span>
                                                <p className="text-[10px] uppercase text-white/30">Late Outs</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Subcomponents
function KPICard({ title, value, icon, color }) {
    return (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${color} backdrop-blur-sm`}>
            <div className="p-3 bg-white/10 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

function LogOutIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    )
}

function UtensilsIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
}
