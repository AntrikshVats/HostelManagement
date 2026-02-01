import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, CheckCircle, XCircle, AlertCircle, Zap, ArrowRight, LogIn, LogOut as LogOutIcon, RotateCcw } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { attendanceAPI } from '../utils/api';

export default function QRScanner({ onLogout }) {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [recentScans, setRecentScans] = useState([]);

    // Scanner Mode: 'AUTO', 'IN', 'OUT'
    const [scanMode, setScanMode] = useState('AUTO');

    const handleScan = async (result) => {
        if (!result || processing) return;

        const qrData = result[0]?.rawValue;
        if (!qrData) return;

        setProcessing(true);
        setError(null);

        try {
            // Prepare payload
            const payload = { token: qrData };
            if (scanMode !== 'AUTO') {
                payload.type = scanMode;
            }

            // Send QR token to backend for attendance marking
            const response = await attendanceAPI.scanQR(payload);

            setResult({
                success: true,
                message: `Attendance marked successfully`,
                student: `Student ID: ${response.data.student_id}`,
                type: response.data.type,
                timestamp: new Date(response.data.timestamp).toLocaleTimeString()
            });

            // Add to recent scans
            setRecentScans(prev => [
                {
                    student: `Student ID: ${response.data.student_id}`,
                    type: response.data.type,
                    time: new Date(response.data.timestamp).toLocaleTimeString(),
                    success: true
                },
                ...prev.slice(0, 9) // Keep last 10
            ]);

            // Auto-clear result after 3 seconds
            setTimeout(() => {
                setResult(null);
                setProcessing(false);
            }, 3000);

        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to process QR code';
            setError(errorMsg);

            setRecentScans(prev => [
                {
                    student: 'Unknown',
                    type: 'ERROR',
                    time: new Date().toLocaleTimeString(),
                    success: false,
                    error: errorMsg
                },
                ...prev.slice(0, 9)
            ]);

            setTimeout(() => {
                setError(null);
                setProcessing(false);
            }, 3000);
        }
    };

    const handleError = (error) => {
        console.error('QR Scanner Error:', error);
    };

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Camera className="w-8 h-8 text-blue-400" />
                        QR Code Scanner
                    </h1>
                    <p className="text-white/60">Scan student QR codes for attendance</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Scanner Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="card h-full flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                    Live Scanner
                                </h2>

                                {/* Mode Selector */}
                                <div className="flex bg-white/10 p-1 rounded-lg">
                                    <button
                                        onClick={() => setScanMode('AUTO')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${scanMode === 'AUTO'
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Auto
                                    </button>
                                    <button
                                        onClick={() => setScanMode('IN')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${scanMode === 'IN'
                                                ? 'bg-green-500 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Check IN
                                    </button>
                                    <button
                                        onClick={() => setScanMode('OUT')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${scanMode === 'OUT'
                                                ? 'bg-orange-500 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <LogOutIcon className="w-4 h-4" />
                                        Check OUT
                                    </button>
                                </div>
                            </div>

                            {/* Scanner */}
                            <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video flex-grow">
                                {scanning && (
                                    <Scanner
                                        onScan={handleScan}
                                        onError={handleError}
                                        constraints={{
                                            facingMode: 'environment'
                                        }}
                                        styles={{
                                            container: {
                                                width: '100%',
                                                height: '100%',
                                            }
                                        }}
                                    />
                                )}

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className={`absolute inset-0 border-4 rounded-xl transition-colors duration-300 ${scanMode === 'IN' ? 'border-green-500/50' :
                                            scanMode === 'OUT' ? 'border-orange-500/50' :
                                                'border-blue-500/50'
                                        }`}>
                                        <div className={`absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 ${scanMode === 'IN' ? 'border-green-400' :
                                                scanMode === 'OUT' ? 'border-orange-400' :
                                                    'border-blue-400'
                                            }`}></div>
                                        <div className={`absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 ${scanMode === 'IN' ? 'border-green-400' :
                                                scanMode === 'OUT' ? 'border-orange-400' :
                                                    'border-blue-400'
                                            }`}></div>
                                        <div className={`absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 ${scanMode === 'IN' ? 'border-green-400' :
                                                scanMode === 'OUT' ? 'border-orange-400' :
                                                    'border-blue-400'
                                            }`}></div>
                                        <div className={`absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 ${scanMode === 'IN' ? 'border-green-400' :
                                                scanMode === 'OUT' ? 'border-orange-400' :
                                                    'border-blue-400'
                                            }`}></div>
                                    </div>

                                    {!processing && (
                                        <motion.div
                                            animate={{ y: [0, 300, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${scanMode === 'IN' ? 'green' :
                                                    scanMode === 'OUT' ? 'orange' :
                                                        'blue'
                                                }-400 to-transparent`}
                                        />
                                    )}

                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg">
                                        <p className="text-white text-sm flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-blue-400" />
                                            {processing ? 'Processing...' :
                                                scanMode === 'AUTO' ? 'Scanning (Auto-Detect mode)' :
                                                    scanMode === 'IN' ? 'Scanning (Forcing Check In)' :
                                                        'Scanning (Forcing Check Out)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Result Display */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="mt-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-green-300 text-lg">{result.message}</h3>
                                                <p className="text-white/80 mt-1">
                                                    <span className="font-semibold">{result.student}</span>
                                                    {' • '}
                                                    <span className={`badge ${result.type === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                                                        {result.type}
                                                    </span>
                                                    {' • '}
                                                    {result.timestamp}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-red-300">Scan Failed</h3>
                                                <p className="text-white/80 mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Instructions */}
                            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Scanner Mode: {scanMode}
                                </h3>
                                <div className="text-sm text-white/70">
                                    {scanMode === 'AUTO' && "Determines IN/OUT status automatically based on last record."}
                                    {scanMode === 'IN' && "Forces status to 'IN' regardless of history."}
                                    {scanMode === 'OUT' && "Forces status to 'OUT' regardless of history."}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Scans Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-1"
                    >
                        <div className="card sticky top-4">
                            <h2 className="text-xl font-bold mb-4">📋 Recent Scans</h2>

                            {recentScans.length === 0 ? (
                                <div className="text-center py-12 text-white/40">
                                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No scans yet</p>
                                    <p className="text-sm mt-1">Start scanning QR codes</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {recentScans.map((scan, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-3 rounded-lg border ${scan.success
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : 'bg-red-500/10 border-red-500/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm">{scan.student}</span>
                                                {scan.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-white/60">
                                                <span className={`badge ${scan.type === 'IN' ? 'badge-success' :
                                                    scan.type === 'OUT' ? 'badge-warning' :
                                                        'badge-danger'
                                                    }`}>
                                                    {scan.type}
                                                </span>
                                                <span>{scan.time}</span>
                                            </div>
                                            {scan.error && (
                                                <p className="text-xs text-red-300 mt-1">{scan.error}</p>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
