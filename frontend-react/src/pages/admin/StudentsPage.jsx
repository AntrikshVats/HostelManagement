import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Filter } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { adminAPI } from '../../utils/api';

export default function AdminStudentsPage({ onLogout }) {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');

    useEffect(() => {
        loadStudents();
        const interval = setInterval(loadStudents, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStudents = async () => {
        try {
            const response = await adminAPI.getStudents({});
            setStudents(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading students:', error);
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.roll_number.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = filterDept ? student.department === filterDept : true;

        return matchesSearch && matchesDept;
    });

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex justify-between items-end"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="w-8 h-8 text-blue-400" />
                            Student Management
                        </h1>
                        <p className="text-white/60">Manage student records and details</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/students/register')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Register Student
                    </button>
                </motion.div>

                {/* Filters */}
                <div className="card mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or roll number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    <div className="w-full md:w-64">
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Departments</option>
                            <option value="CSE">CSE</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="MECH">MECH</option>
                        </select>
                    </div>
                </div>

                {/* Students Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Dept / Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Room</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-white/40">
                                            No students found matching criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.student_id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                                                        {student.first_name[0]}{student.last_name[0]}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                        <div className="text-sm text-white/40">
                                                            {student.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 font-mono">
                                                {student.roll_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {student.department} - Year {student.year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {student.room_no ? (
                                                    <span className="bg-white/10 px-2 py-1 rounded text-xs">
                                                        {student.block}-{student.room_no}
                                                    </span>
                                                ) : (
                                                    <span className="text-white/40 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {student.phone_numbers?.[0]?.phone_number || 'N/A'}
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
