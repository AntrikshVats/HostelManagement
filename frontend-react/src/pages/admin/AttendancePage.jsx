import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { attendanceAPI } from '../../utils/api';

export default function AdminAttendancePage({ onLogout }) {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterId, setFilterId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadAttendance();
        const interval = setInterval(loadAttendance, 5000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    const loadAttendance = async () => {
        try {
            const response = await attendanceAPI.getTodayAttendance(selectedDate);
            // Ensure sorting by timestamp desc in case backend didn't
            const sortedData = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setAttendance(sortedData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading attendance:', error);
            setLoading(false);
        }
    };

    const filteredAttendance = attendance.filter(record =>
        record.student_id.toString().includes(filterId)
    );

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-green-400" />
                        Attendance Logs
                    </h1>
                    <p className="text-white/60">Real-time attendance monitoring for today</p>
                </motion.div>

                {/* Filter */}
                <div className="card mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-white/50" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="w-5 h-5 text-white/50" />
                        <input
                            type="text"
                            placeholder="Filter by Student ID"
                            value={filterId}
                            onChange={(e) => setFilterId(e.target.value)}
                            className="input-field w-full"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                                        </td>
                                    </tr>
                                ) : filteredAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-white/40">
                                            No attendance records for today
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttendance.map((record) => (
                                        <tr key={record.attendance_id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">{record.student_name || 'Student'}</span>
                                                    <span className="text-xs text-white/50 font-mono">{record.roll_number || record.student_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`badge ${record.type === 'IN' ? 'badge-success' : 'badge-warning'
                                                    }`}>
                                                    {record.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                                {record.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/40">
                                                {record.remarks || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
