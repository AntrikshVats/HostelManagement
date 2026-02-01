import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Lock, Mail, Sparkles, UserCircle, Shield } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('student'); // student or admin
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill credentials based on role
    const fillCredentials = (role) => {
        setSelectedRole(role);
        if (role === 'student') {
            setEmail('rahul.sharma@student.smarthostel.com');
            setPassword('student123');
        } else {
            setEmail('admin@smarthostel.com');
            setPassword('admin123');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, password);
            const { access_token, role } = response.data;

            // Normalize role to lowercase for consistency
            const normalizedRole = role.toLowerCase();

            onLogin(access_token, normalizedRole);
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl"
                    >
                        <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        SmartHostel
                    </h1>
                    <p className="text-white/60 mt-2">AI-Powered Hostel Management</p>
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-8 rounded-2xl"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <LogIn className="w-6 h-6 text-blue-400" />
                        Sign In
                    </h2>

                    {/* Role Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white/80 mb-3">
                            Login As
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => fillCredentials('student')}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'student'
                                        ? 'bg-blue-500/20 border-blue-500 shadow-lg'
                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                    }`}
                            >
                                <UserCircle className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'student' ? 'text-blue-400' : 'text-white/60'
                                    }`} />
                                <p className={`font-semibold ${selectedRole === 'student' ? 'text-blue-300' : 'text-white/80'
                                    }`}>
                                    Student
                                </p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => fillCredentials('admin')}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'admin'
                                        ? 'bg-purple-500/20 border-purple-500 shadow-lg'
                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                    }`}
                            >
                                <Shield className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'admin' ? 'text-purple-400' : 'text-white/60'
                                    }`} />
                                <p className={`font-semibold ${selectedRole === 'admin' ? 'text-purple-300' : 'text-white/80'
                                    }`}>
                                    Admin
                                </p>
                            </motion.button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="your.email@smarthostel.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-sm text-white/60 text-center">
                            <span className="block mb-2">👆 Click Student or Admin to auto-fill credentials</span>
                            <span className="text-white/40 text-xs">Or enter manually</span>
                        </p>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-white/40 text-sm mt-6"
                >
                    Powered by AI • Secured with JWT
                </motion.p>
            </motion.div>
        </div>
    );
}
