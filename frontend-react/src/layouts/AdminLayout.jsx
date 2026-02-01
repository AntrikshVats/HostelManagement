import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scan, ScanFace, Users, AlertTriangle, BarChart3,
    Calendar, Utensils, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Scan, label: 'QR Scanner', path: '/scanner' },
    { icon: ScanFace, label: 'Face Attendance', path: '/admin/face-attendance' },
    { icon: Users, label: 'Students', path: '/admin/students' },
    { icon: Calendar, label: 'Attendance', path: '/admin/attendance' },
    { icon: AlertTriangle, label: 'Violations', path: '/admin/violations' },
    { icon: Utensils, label: 'Mess', path: '/admin/mess' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export default function AdminLayout({ children, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -300 }}
                animate={{ x: sidebarOpen ? 0 : -300 }}
                className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-50"
            >
                <div className="p-6">
                    {/* Logo */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                Admin Panel
                            </h2>
                            <p className="text-white/40 text-sm">SmartHostel</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-white/60 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 transition-all mt-8"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Menu Button */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-40 lg:hidden glass p-3 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
            )}

            {/* Main Content */}
            <div className={`flex-1 transition-all ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
