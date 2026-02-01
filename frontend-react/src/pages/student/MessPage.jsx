import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Calendar, AlertCircle, History, Clock } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { messAPI } from '../../utils/api';

export default function StudentMessPage({ onLogout }) {
    const [menu, setMenu] = useState(null);
    const [history, setHistory] = useState([]);
    const [optOutReason, setOptOutReason] = useState('');
    const [loading, setLoading] = useState(true);

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [menuRes, historyRes] = await Promise.all([
                messAPI.getMenu(selectedDate).catch(() => ({ data: [] })),
                messAPI.getHistory().catch(() => ({ data: [] }))
            ]);
            setMenu(menuRes.data);
            setHistory(historyRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading mess data:', error);
            setLoading(false);
        }
    };

    const handleOptOut = async (mealTime) => {
        if (!confirm(`Are you sure you want to opt-out of ${mealTime}?`)) return;

        try {
            await messAPI.optOut({
                date: selectedDate,
                meal_time: mealTime,
                opt: 'N',
                reason: optOutReason || 'Not eating'
            });
            alert('Opt-out successful');
            loadData(); // Refresh history
        } catch (error) {
            alert('Failed to opt-out: ' + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <StudentLayout onLogout={onLogout}>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Utensils className="w-8 h-8 text-orange-400" />
                        Mess Management
                    </h1>
                    <p className="text-white/60">View menu and manage meals</p>
                </motion.div>

                {/* Date Selector */}
                <div className="card mb-8">
                    <label className="block text-sm font-medium text-white/80 mb-2">Select Date for Opt-Out</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-field max-w-xs"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Menu / Opt-Out Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Breakfast', 'Lunch', 'Dinner'].map((meal, idx) => (
                                <motion.div
                                    key={meal}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="card"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-bold">{meal}</h2>
                                        <button
                                            onClick={() => handleOptOut(meal)}
                                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded transition-colors font-medium border border-red-500/30"
                                        >
                                            Opt-Out
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-white/60 text-sm">Menu items for {meal}</p>
                                        {/* Placeholder for menu items */}
                                        <div className="h-12 bg-white/5 rounded animate-pulse" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Opt-Out History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <History className="w-6 h-6 text-blue-400" />
                                Opt-Out History
                            </h2>

                            {history.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <p>No opt-outs requests found</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {history.map((record) => (
                                        <div
                                            key={record.opt_id}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                                    <Utensils className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{record.meal_time}</h3>
                                                    <p className="text-white/60 text-sm flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="badge badge-danger">Optimization: {record.opt}</span>
                                                <p className="text-white/40 text-xs mt-1 italic">{record.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
