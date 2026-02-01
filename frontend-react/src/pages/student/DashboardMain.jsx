import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, CheckCircle, XCircle, TrendingUp, QrCode, Utensils
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StudentLayout from '../../layouts/StudentLayout';
import { studentAPI } from '../../utils/api';

export default function StudentDashboardMain({ onLogout }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, attendanceRes] = await Promise.all([
                studentAPI.getProfile(),
                studentAPI.getAttendance(),
            ]);
            setProfile(profileRes.data);
            setAttendance(attendanceRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout onLogout={onLogout}>
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </StudentLayout>
        );
    }

    const checkIns = attendance.filter(a => a.type === 'IN').length;
    const checkOuts = attendance.filter(a => a.type === 'OUT').length;

    const chartData = [
        { name: 'Check In', value: checkIns, color: '#10b981' },
        { name: 'Check Out', value: checkOuts, color: '#f59e0b' },
    ];

    return (
        <StudentLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl mb-8"
                >
                    <h1 className="text-3xl font-bold">
                        Welcome back, {profile?.first_name}! 👋
                    </h1>
                    <p className="text-white/60 mt-2">Here's your overview</p>
                </motion.div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => navigate('/student/qr')}
                        className="glass p-6 rounded-2xl hover:scale-105 transition-transform text-left"
                    >
                        <QrCode className="w-12 h-12 text-blue-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Generate QR</h3>
                        <p className="text-white/60 text-sm">Quick attendance marking</p>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => navigate('/student/attendance')}
                        className="glass p-6 rounded-2xl hover:scale-105 transition-transform text-left"
                    >
                        <Calendar className="w-12 h-12 text-green-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">My Attendance</h3>
                        <p className="text-white/60 text-sm">View full history</p>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => navigate('/student/mess')}
                        className="glass p-6 rounded-2xl hover:scale-105 transition-transform text-left"
                    >
                        <Utensils className="w-12 h-12 text-orange-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Mess</h3>
                        <p className="text-white/60 text-sm">Manage meals</p>
                    </motion.button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                            This Month
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="stat-card">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-white/60">Check-ins</span>
                                </div>
                                <p className="text-3xl font-bold">{checkIns}</p>
                            </div>
                            <div className="stat-card">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="w-5 h-5 text-orange-400" />
                                    <span className="text-white/60">Check-outs</span>
                                </div>
                                <p className="text-3xl font-bold">{checkOuts}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4">Distribution</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: 'none',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            </div>
        </StudentLayout>
    );
}
