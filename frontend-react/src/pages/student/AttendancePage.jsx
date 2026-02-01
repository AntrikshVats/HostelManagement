import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Filter } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { studentAPI } from '../../utils/api';

export default function StudentAttendancePage({ onLogout }) {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, IN, OUT

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            const response = await studentAPI.getAttendance();
            setAttendance(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading attendance:', error);
            setLoading(false);
        }
    };

    const filteredAttendance = attendance.filter(record => {
        if (filter === 'ALL') return true;
        return record.type === filter;
    });

    return (
        <StudentLayout onLogout={onLogout}>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Calendar className="w-8 h-8 text-green-400" />
                            Attendance History
                        </h1>
                        <p className="text-white/60">View your check-in and check-out records</p>
                    </div>

                    <div className="flex bg-white/10 p-1 rounded-lg">
                        {['ALL', 'IN', 'OUT'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="card">
                        {filteredAttendance.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No records found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAttendance.map((record, idx) => (
                                    <motion.div
                                        key={record.attendance_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${record.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {record.type === 'IN' ? <Clock className="w-6 h-6" /> : <LogOutIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    {record.type === 'IN' ? 'Checked In' : 'Checked Out'}
                                                </h3>
                                                <p className="text-white/60 text-sm flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {record.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right w-full md:w-auto">
                                            <p className="font-mono text-lg font-semibold">
                                                {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-white/40 text-sm">
                                                {new Date(record.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
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
