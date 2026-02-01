import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Home, Check, AlertCircle } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { adminAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function StudentRegistrationPage({ onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        roll_number: '',
        department: 'CSE',
        year: 1,
        dietary_preference: 'Veg',
        room_no: '',
        phone_number: ''
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setLoadingRooms(true);
        try {
            const response = await adminAPI.getAvailableRooms();
            setRooms(response.data);
            setLoadingRooms(false);
        } catch (err) {
            console.error("Failed to load rooms", err);
            setError("Failed to load available rooms");
            setLoadingRooms(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Transform form data to match API schema
            const payload = {
                first_name: formData.first_name,
                middle_name: formData.middle_name || null,
                last_name: formData.last_name,
                email: formData.email,
                password: formData.password,
                roll_number: formData.roll_number,
                department: formData.department,
                year: parseInt(formData.year),
                dietary_preference: formData.dietary_preference,
                room_no: formData.room_no,
                phone_numbers: [
                    {
                        phone_number: formData.phone_number,
                        phone_type: "Mobile"
                    }
                ]
            };

            await adminAPI.registerStudent(payload);
            setSuccess(true);
            setLoading(false);

            // Redirect after delay
            setTimeout(() => {
                navigate('/admin/students');
            }, 2000);

        } catch (err) {
            console.error("Registration failed", err);
            setError(err.response?.data?.detail || "Registration failed");
            setLoading(false);
        }
    };

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <UserPlus className="w-8 h-8 text-green-400" />
                        Register New Student
                    </h1>
                    <p className="text-white/60">Create student account and assign room</p>
                </motion.div>

                <div className="card">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <p>Student registered and room assigned successfully! Redirecting...</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-white/80 border-b border-white/10 pb-2">Personal Info</h3>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">First Name *</label>
                                    <input required name="first_name" value={formData.first_name} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Middle Name</label>
                                    <input name="middle_name" value={formData.middle_name} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Last Name *</label>
                                    <input required name="last_name" value={formData.last_name} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Email *</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Password *</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Phone Number *</label>
                                    <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input-field" />
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-white/80 border-b border-white/10 pb-2">Academic Info</h3>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Roll Number *</label>
                                    <input required name="roll_number" value={formData.roll_number} onChange={handleChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Department *</label>
                                    <select required name="department" value={formData.department} onChange={handleChange} className="input-field">
                                        <option value="CSE">CSE</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option>
                                        <option value="MECH">MECH</option>
                                        <option value="CIVIL">CIVIL</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Year *</label>
                                    <select required name="year" value={formData.year} onChange={handleChange} className="input-field">
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                            </div>

                            {/* Hostel Details */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-white/80 border-b border-white/10 pb-2">Hostel & Mess</h3>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Dietary Preference</label>
                                    <select name="dietary_preference" value={formData.dietary_preference} onChange={handleChange} className="input-field">
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                        <option value="Protein">Protein</option>
                                        <option value="Jain">Jain</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Assign Room *</label>
                                    {loadingRooms ? (
                                        <div className="text-sm text-white/40 animate-pulse">Loading rooms...</div>
                                    ) : (
                                        <select required name="room_no" value={formData.room_no} onChange={handleChange} className="input-field font-mono">
                                            <option value="">Select available room...</option>
                                            {rooms.map(room => (
                                                <option key={room.room_no} value={room.room_no}>
                                                    {room.block}-{room.room_no} ({room.available} slots left)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="text-xs text-white/40 mt-1">Shows only rooms with vacancy</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/students')}
                                className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Register & Assign
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
