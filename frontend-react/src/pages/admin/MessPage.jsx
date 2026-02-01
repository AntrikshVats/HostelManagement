import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import { messAPI, adminAPI } from '../../utils/api';

export default function AdminMessPage({ onLogout }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const selectedDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        loadMessStats();
        const interval = setInterval(loadMessStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadMessStats = async () => {
        try {
            const response = await adminAPI.getDashboard();
            if (response.data && response.data.today_meal_attendance) {
                setStats(response.data.today_meal_attendance);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading mess stats:', error);
            setLoading(false);
        }
    };

    const chartData = Object.entries(stats).map(([meal, data]) => ({
        name: meal,
        expected: data.expected,
        optedOut: data.opted_out
    }));

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Utensils className="w-8 h-8 text-orange-400" />
                        Mess Management
                    </h1>
                    <p className="text-white/60">Monitor meal attendance and opt-outs</p>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Chart */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="card"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Today's Attendance ({selectedDate})
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#fff" />
                                    <YAxis stroke="#fff" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="expected" fill="#10b981" name="Expected" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="optedOut" fill="#ef4444" name="Opted Out" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Detailed Stats */}
                        <div className="space-y-6">
                            {['Breakfast', 'Lunch', 'Dinner'].map((meal, idx) => {
                                const mealData = stats[meal] || { expected: 0, opted_out: 0 };
                                return (
                                    <motion.div
                                        key={meal}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + (idx * 0.1) }}
                                        className="card"
                                    >
                                        <h3 className="font-bold text-lg mb-4">{meal}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-white/60 text-sm">Expected Students</p>
                                                <p className="text-2xl font-bold text-green-400">{mealData.expected}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-white/60 text-sm">Opted Out</p>
                                                <p className="text-2xl font-bold text-red-400">{mealData.opted_out}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
