import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import { adminAPI } from '../../utils/api';

export default function AdminDashboardMain({ onLogout }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 5000); // Auto-refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await adminAPI.getDashboard();
            setDashboard(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout onLogout={onLogout}>
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    const statusData = [
        { name: 'Present', value: dashboard?.present_students || 0, color: '#10b981' },
        { name: 'Out', value: dashboard?.out_students || 0, color: '#f59e0b' },
    ];

    const mealData = Object.entries(dashboard?.today_meal_attendance || {}).map(([meal, data]) => ({
        name: meal,
        expected: data.expected,
        optedOut: data.opted_out,
    }));

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2">Dashboard Overview</h1>
                    <p className="text-white/60">Monitor hostel operations</p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<Users />}
                        label="Total Students"
                        value={dashboard?.total_students || 0}
                        color="from-blue-500 to-cyan-600"
                        delay={0.1}
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        label="Currently Present"
                        value={dashboard?.present_students || 0}
                        color="from-green-500 to-emerald-600"
                        delay={0.2}
                    />
                    <StatCard
                        icon={<XCircle />}
                        label="Currently Out"
                        value={dashboard?.out_students || 0}
                        color="from-orange-500 to-red-600"
                        delay={0.3}
                    />
                    <StatCard
                        icon={<AlertTriangle />}
                        label="Pending Violations"
                        value={dashboard?.pending_violations || 0}
                        color="from-red-500 to-pink-600"
                        delay={0.4}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4">Today's Meal Attendance</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mealData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#fff" />
                                <YAxis stroke="#fff" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="expected" fill="#10b981" name="Expected" />
                                <Bar dataKey="optedOut" fill="#ef4444" name="Opted Out" />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4">Current Status</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={100}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
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
            </div>
        </AdminLayout>
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
