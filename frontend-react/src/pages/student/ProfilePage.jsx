import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Hash, BookOpen, PenTool } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { studentAPI } from '../../utils/api';

export default function StudentProfilePage({ onLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await studentAPI.getProfile();
            setProfile(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading profile:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout onLogout={onLogout}>
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout onLogout={onLogout}>
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-lg">
                        {profile.first_name[0]}{profile.last_name[0]}
                    </div>
                    <h1 className="text-3xl font-bold">{profile.first_name} {profile.last_name}</h1>
                    <p className="text-white/60">Student Profile</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard icon={<Mail />} label="Email" value={profile.email} delay={0.1} />
                    <InfoCard icon={<Hash />} label="Roll Number" value={profile.roll_number} delay={0.2} />
                    <InfoCard icon={<BookOpen />} label="Department" value={profile.department} delay={0.3} />
                    <InfoCard icon={<PenTool />} label="Year" value={`Year ${profile.year}`} delay={0.4} />

                    {/* Mess Preference */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="card md:col-span-2"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <UtensilsIcon className="w-5 h-5 text-orange-400" />
                            <p className="text-white/60 text-sm">Dietary Preference</p>
                        </div>
                        <p className="text-xl font-semibold capitalize">{profile.dietary_preference}</p>
                    </motion.div>
                </div>
            </div>
        </StudentLayout>
    );
}

function InfoCard({ icon, label, value, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className="card"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="text-blue-400 [&>svg]:w-5 [&>svg]:h-5">
                    {icon}
                </div>
                <p className="text-white/60 text-sm">{label}</p>
            </div>
            <p className="text-xl font-semibold">{value || 'N/A'}</p>
        </motion.div>
    );
}

function UtensilsIcon(props) {
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
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
}
