import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    QrCode, LogOut, UserCircle, TrendingUp, Calendar,
    Utensils, Clock, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { studentAPI, attendanceAPI, messAPI } from '../utils/api';

export default function StudentDashboard({ onLogout }) {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [qrExpiry, setQrExpiry] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [messHistory, setMessHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [optOutForm, setOptOutForm] = useState({ date: '', meal_time: 'Breakfast', reason: '' });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [profileRes, attendanceRes, messRes] = await Promise.all([
                studentAPI.getProfile(),
                studentAPI.getAttendance(),
                studentAPI.getMessHistory(),
            ]);

            setProfile(profileRes.data);
            setAttendanceHistory(attendanceRes.data.slice(0, 10));
            setMessHistory(messRes.data.recent_opt_outs || []);

            // Get current month stats
            const now = new Date();
            const statsRes = await attendanceAPI.getStats(
                profileRes.data.student_id,
                now.getFullYear(),
                now.getMonth() + 1
            );
            setStats(statsRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    const generateQR = async () => {
        try {
            const response = await attendanceAPI.generateQR();
            setQrCode(response.data.qr_image_base64);
            setQrExpiry(new Date(response.data.expires_at));

            // Auto-hide QR after 5 minutes
            setTimeout(() => {
                setQrCode(null);
            }, 5 * 60 * 1000);
        } catch (error) {
            alert('Error generating QR code: ' + error.response?.data?.detail);
        }
    };

    const handleOptOut = async (e) => {
        e.preventDefault();
        try {
            await messAPI.optOut({
                date: optOutForm.date,
                meal_time: optOutForm.meal_time,
                opt: 'Y',
                reason: optOutForm.reason,
            });
            alert('Successfully opted out!');
            setOptOutForm({ date: '', meal_time: 'Breakfast', reason: '' });
            loadDashboard();
        } catch (error) {
            alert('Error: ' + error.response?.data?.detail);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // Prepare chart data
    const attendanceChartData = attendanceHistory.map((record, idx) => ({
        name: new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: record.type,
    })).reverse();

    const statsData = [
        { name: 'Check-Ins', value: stats?.in_count || 0, color: '#10b981' },
        { name: 'Check-Outs', value: stats?.out_count || 0, color: '#f59e0b' },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <UserCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Welcome, {profile?.first_name}!</h1>
                                <p className="text-white/60">{profile?.roll_number} • {profile?.department}</p>
                            </div>
                        </div>
                        <button onClick={onLogout} className="btn-secondary flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<CheckCircle2 />}
                        label="Current Status"
                        value={stats?.current_status || 'Unknown'}
                        color="from-green-500 to-emerald-600"
                        delay={0.1}
                    />
                    <StatCard
                        icon={<TrendingUp />}
                        label="Monthly Attendance"
                        value={`${stats?.monthly_percentage || 0}%`}
                        color="from-blue-500 to-cyan-600"
                        delay={0.2}
                    />
                    <StatCard
                        icon={<Clock />}
                        label="Total Check-ins"
                        value={stats?.in_count || 0}
                        color="from-purple-500 to-pink-600"
                        delay={0.3}
                    />
                    <StatCard
                        icon={<Calendar />}
                        label="This Month"
                        value={`${stats?.in_count || 0} days`}
                        color="from-orange-500 to-red-600"
                        delay={0.4}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* QR Code Generator */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-blue-400" />
                            QR Attendance
                        </h2>
                        <div className="text-center">
                            {!qrCode ? (
                                <div className="space-y-4">
                                    <p className="text-white/60">Generate your QR code for attendance marking</p>
                                    <button onClick={generateQR} className="btn-primary">
                                        Generate QR Code
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-white p-4 rounded-xl inline-block">
                                        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                                    </div>
                                    <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Expires: {qrExpiry?.toLocaleTimeString()}
                                    </p>
                                    <p className="text-white/60 text-sm">Scan this code at the gate</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Attendance Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4">📊 Attendance Overview</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={statsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Mess Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="card mb-8"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-orange-400" />
                        Mess Management
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Opt-Out Form */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Opt-Out from Meals</h3>
                            <form onSubmit={handleOptOut} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/80 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={optOutForm.date}
                                        onChange={(e) => setOptOutForm({ ...optOutForm, date: e.target.value })}
                                        className="input-field"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/80 mb-2">Meal Time</label>
                                    <select
                                        value={optOutForm.meal_time}
                                        onChange={(e) => setOptOutForm({ ...optOutForm, meal_time: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snacks">Snacks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-white/80 mb-2">Reason (Optional)</label>
                                    <input
                                        type="text"
                                        value={optOutForm.reason}
                                        onChange={(e) => setOptOutForm({ ...optOutForm, reason: e.target.value })}
                                        className="input-field"
                                        placeholder="Going home..."
                                    />
                                </div>
                                <button type="submit" className="btn-primary w-full">
                                    Opt-Out
                                </button>
                            </form>
                        </div>

                        {/* Recent Opt-Outs */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Opt-Outs</h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {messHistory.length === 0 ? (
                                    <p className="text-white/60 text-center py-8">No recent opt-outs</p>
                                ) : (
                                    messHistory.map((opt, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-white/5 rounded-lg p-4 border border-white/10"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{new Date(opt.date).toLocaleDateString()}</p>
                                                    <p className="text-sm text-white/60">{opt.meal_time}</p>
                                                </div>
                                                <span className="badge badge-warning">{opt.opt === 'Y' ? 'Opted Out' : 'Active'}</span>
                                            </div>
                                            {opt.reason && <p className="text-sm text-white/70 mt-2">{opt.reason}</p>}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Attendance History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="card"
                >
                    <h2 className="text-2xl font-bold mb-6">📋 Recent Attendance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80">Date</th>
                                    <th className="text-left py-3 px-4 text-white/80">Time</th>
                                    <th className="text-left py-3 px-4 text-white/80">Type</th>
                                    <th className="text-left py-3 px-4 text-white/80">Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceHistory.map((record, idx) => (
                                    <motion.tr
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-white/5 hover:bg-white/5"
                                    >
                                        <td className="py-3 px-4">{new Date(record.timestamp).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{new Date(record.timestamp).toLocaleTimeString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`badge ${record.type === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-white/60">{record.location}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="stat-card"
        >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-white/60 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </motion.div>
    );
}
