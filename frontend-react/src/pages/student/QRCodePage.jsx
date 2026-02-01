import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode as QrCodeIcon, Clock, RefreshCw } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { attendanceAPI } from '../../utils/api';

export default function StudentQRPage({ onLogout }) {
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    const generateQR = async () => {
        setLoading(true);
        try {
            const response = await attendanceAPI.generateQR();
            setQrCode(response.data);
            startCountdown(response.data.expires_at);
        } catch (error) {
            alert('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const startCountdown = (expiresAt) => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft('Expired');
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);
    };

    useEffect(() => {
        generateQR();
    }, []);

    return (
        <StudentLayout onLogout={onLogout}>
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-8 rounded-2xl text-center"
                >
                    <QrCodeIcon className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <h1 className="text-3xl font-bold mb-2">Your QR Code</h1>
                    <p className="text-white/60 mb-8">Show this to the admin for attendance</p>

                    {qrCode && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-white p-6 rounded-2xl inline-block mb-6"
                        >
                            <img
                                src={`data:image/png;base64,${qrCode.qr_image_base64}`}
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        </motion.div>
                    )}

                    {timeLeft && (
                        <div className="flex items-center justify-center gap-2 text-lg mb-6">
                            <Clock className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-mono">{timeLeft}</span>
                            <span className="text-white/60">remaining</span>
                        </div>
                    )}

                    <button
                        onClick={generateQR}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Generating...' : 'Generate New Code'}
                    </button>

                    <p className="text-white/40 text-sm mt-6">
                        QR codes are valid for 5 minutes
                    </p>
                </motion.div>
            </div>
        </StudentLayout>
    );
}
