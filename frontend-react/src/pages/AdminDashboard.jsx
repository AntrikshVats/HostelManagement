import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, LogOut, AlertTriangle, Home, TrendingUp,
    CheckCircle, XCircle, Clock, Utensils, Scan, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI, attendanceAPI } from '../utils/api';

export default function AdminDashboard({ onLogout }) {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [students, setStudents] = useState([]);
    const [violations, setViolations] = useState([]);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            loadRecentAttendance();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const [dashRes, studentsRes, violationsRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getStudents({}),
                adminAPI.getViolations(false),
            ]);

            setDashboard(dashRes.data);
            setStudents(studentsRes.data);
            setViolations(violationsRes.data);

            // Load today's attendance
            await loadRecentAttendance();

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    const loadRecentAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await attendanceAPI.getTodayAttendance(today);
            setRecentAttendance(response.data.slice(0, 10)); // Last 10 records
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const checkCurfewViolations = async () => {
        try {
            const response = await adminAPI.checkCurfew();
            alert(response.data.message);
            await loadDashboard();
        } catch (error) {
            alert('Error checking curfew: ' + error.response?.data?.detail);
        }
    };

    const resolveViolation = async (violationId) => {
        if (!confirm('Mark this violation as resolved?')) return;
        try {
            await adminAPI.resolveViolation(violationId);
            await loadDashboard();
        } catch (error) {
            alert('Error resolving violation');
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
    const mealData = Object.entries(dashboard?.today_meal_attendance || {}).map(([meal, data]) => ({
        name: meal,
        expected: data.expected,
        optedOut: data.opted_out,
    }));

    const statusData = [
        { name: 'Present', value: dashboard?.present_students || 0, color: '#10b981' },
        { name: 'Out', value: dashboard?.out_students || 0, color: '#f59e0b' },
    ];

    const filteredStudents = students.filter(s =>
        (!filterDept || s.department === filterDept) &&
        (!filterYear || s.year === parseInt(filterYear))
    );

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
                        <div>
                            <h1 className="text-3xl font-bold">👔 Admin Dashboard</h1>
                            <p className="text-white/60">Hostel Management & Monitoring</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate('/scanner')} className="btn-primary flex items-center gap-2">
                                <Scan className="w-4 h-4" />
                                QR Scanner
                            </button>
                            <button onClick={checkCurfewViolations} className="btn-secondary flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Check Curfew
                            </button>
                            <button onClick={onLogout} className="btn-secondary flex items-center gap-2">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Meal Attendance */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-orange-400" />
                            Today's Meal Attendance
                        </h2>
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

                    {/* Student Status */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-4">📊 Current Status</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={100}
                                    fill="#8884d8"
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

                {/* Recent Attendance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="card mb-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-400" />
                            Today's Attendance ({recentAttendance.length})
                        </h2>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {recentAttendance.length === 0 ? (
                        <div className="text-center py-12 text-white/40">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No attendance records today</p>
                            <p className="text-sm mt-1">Records will appear here after QR scans</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-white/80">Time</th>
                                        <th className="text-left py-3 px-4 text-white/80">Student ID</th>
                                        <th className="text-left py-3 px-4 text-white/80">Type</th>
                                        <th className="text-left py-3 px-4 text-white/80">Location</th>
                                        <th className="text-left py-3 px-4 text-white/80">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAttendance.map((record, idx) => (
                                        <motion.tr
                                            key={record.attendance_id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="border-b border-white/5 hover:bg-white/5"
                                        >
                                            <td className="py-3 px-4">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-blue-300">
                                                {record.student_id}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`badge ${record.type === 'IN' ? 'badge-success' : 'badge-warning'
                                                    }`}>
                                                    {record.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-white/60">{record.location}</td>
                                            <td className="py-3 px-4 text-white/50 text-sm">{record.remarks}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Violations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="card mb-8"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        Recent Violations ({violations.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80">Student</th>
                                    <th className="text-left py-3 px-4 text-white/80">Type</th>
                                    <th className="text-left py-3 px-4 text-white/80">Date</th>
                                    <th className="text-left py-3 px-4 text-white/80">Description</th>
                                    <th className="text-left py-3 px-4 text-white/80">Severity</th>
                                    <th className="text-left py-3 px-4 text-white/80">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {violations.slice(0, 10).map((v, idx) => (
                                    <motion.tr
                                        key={v.violation_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-white/5 hover:bg-white/5"
                                    >
                                        <td className="py-3 px-4">{v.student_name}</td>
                                        <td className="py-3 px-4">
                                            <span className="badge badge-warning">{v.violation_type}</span>
                                        </td>
                                        <td className="py-3 px-4">{new Date(v.violation_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-white/60 text-sm">{v.description}</td>
                                        <td className="py-3 px-4">
                                            <span className={`badge ${v.severity === 'High' ? 'badge-danger' :
                                                v.severity === 'Medium' ? 'badge-warning' :
                                                    'badge-info'
                                                }`}>
                                                {v.severity}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => resolveViolation(v.violation_id)}
                                                className="text-sm bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded-lg transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Student Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="card"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6  h-6 text-blue-400" />
                            Student Management ({filteredStudents.length})
                        </h2>
                        <div className="flex gap-3">
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="input-field py-2 px-4"
                            >
                                <option value="">All Departments</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="input-field py-2 px-4"
                            >
                                <option value="">All Years</option>
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80">Roll Number</th>
                                    <th className="text-left py-3 px-4 text-white/80">Name</th>
                                    <th className="text-left py-3 px-4 text-white/80">Department</th>
                                    <th className="text-left py-3 px-4 text-white/80">Year</th>
                                    <th className="text-left py-3 px-4 text-white/80">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.slice(0, 15).map((s, idx) => (
                                    <motion.tr
                                        key={s.student_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5"
                                    >
                                        <td className="py-3 px-4 font-mono text-blue-300">{s.roll_number}</td>
                                        <td className="py-3 px-4">{s.first_name} {s.last_name}</td>
                                        <td className="py-3 px-4 text-white/60">{s.department}</td>
                                        <td className="py-3 px-4">{s.year}</td>
                                        <td className="py-3 px-4 text-sm text-white/50">{s.email}</td>
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
