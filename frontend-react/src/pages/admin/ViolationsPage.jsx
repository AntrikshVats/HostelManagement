import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { adminAPI } from '../../utils/api';

export default function AdminViolationsPage({ onLogout }) {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadViolations();
        const interval = setInterval(loadViolations, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadViolations = async () => {
        try {
            const response = await adminAPI.getViolations(false); // Get unresolved
            setViolations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading violations:', error);
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!confirm('Mark violation as resolved?')) return;
        try {
            await adminAPI.resolveViolation(id, 'Resolved by admin');
            loadViolations();
        } catch (error) {
            alert('Failed to resolve violation');
        }
    };

    const handleCheckCurfew = async () => {
        try {
            await adminAPI.checkCurfew();
            alert('Curfew check triggered successfully');
            loadViolations();
        } catch (error) {
            alert('Failed to trigger curfew check');
        }
    };

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                            Violations
                        </h1>
                        <p className="text-white/60">Manage disciplinary issues and curfew violations</p>
                    </div>

                    <button
                        onClick={handleCheckCurfew}
                        className="btn-primary bg-gradient-to-r from-red-500 to-orange-600"
                    >
                        Trigger Curfew Check
                    </button>
                </motion.div>

                {/* Violations List */}
                <div className="card">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : violations.length === 0 ? (
                        <div className="text-center py-12 text-white/40">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                            <p>No pending violations</p>
                            <p className="text-sm mt-1">Great job maintaining discipline!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {violations.map((v, idx) => (
                                <motion.div
                                    key={v.violation_id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${v.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">
                                                {v.student_name} <span className="text-sm font-normal text-white/40">({v.violation_date})</span>
                                            </h3>
                                            <p className="text-red-300 font-medium">{v.violation_type}</p>
                                            {v.description && <p className="text-white/60 text-sm mt-1">{v.description}</p>}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleResolve(v.violation_id)}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
                                    >
                                        Resolve
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
