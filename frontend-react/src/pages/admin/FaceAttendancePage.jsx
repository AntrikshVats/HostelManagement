import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { ScanFace, UserPlus, Check, X, Camera, RefreshCw } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { faceAPI, adminAPI } from '../../utils/api';

export default function FaceAttendancePage({ onLogout }) {
    const [mode, setMode] = useState('attendance'); // 'attendance' or 'register'
    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Registration State
    const [studentId, setStudentId] = useState('');
    const [students, setStudents] = useState([]);
    const webcamRef = useRef(null);

    // Fetch students list for registration
    const loadStudents = async () => {
        try {
            const res = await adminAPI.getStudents({});
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to load students", err);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setCapturedImage(null);
        setResult(null);
        setError(null);
    };

    // Helper to convert base64 to Blob
    const dataURLtoBlob = (dataurl) => {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    const handleAttendance = async () => {
        if (!capturedImage) return;
        setLoading(true);
        setError(null);

        try {
            const blob = dataURLtoBlob(capturedImage);
            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');

            const res = await faceAPI.recognize(formData);

            if (res.data.match) {
                setResult({
                    type: 'success',
                    message: `Welcome ${res.data.name}`,
                    details: `Marked: ${res.data.status} (Conf: ${Math.round(res.data.confidence * 100)}%)`
                });
            } else {
                setError(res.data.message || "Face not recognized");
            }
        } catch (err) {
            setError("Failed to process image. " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRegistration = async () => {
        if (!capturedImage || !studentId) {
            setError("Please select a student and capture image");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const blob = dataURLtoBlob(capturedImage);
            const formData = new FormData();
            formData.append('image', blob, 'face.jpg');
            formData.append('student_id', studentId);

            await faceAPI.register(formData);
            setResult({
                type: 'success',
                message: "Face Registered Successfully",
                details: "Student can now use face attendance"
            });
        } catch (err) {
            setError("Registration failed. " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout onLogout={onLogout}>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex justify-between items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ScanFace className="w-8 h-8 text-purple-400" />
                            Face Attendance System
                        </h1>
                        <p className="text-white/60">Automated attendance using facial recognition</p>
                    </div>

                    <div className="flex bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setMode('attendance')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'attendance' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Attendance Mode
                        </button>
                        <button
                            onClick={() => { setMode('register'); loadStudents(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Register Face
                        </button>
                    </div>
                </motion.div>

                {/* Main Card */}
                <div className="card grid md:grid-cols-2 gap-8">
                    {/* Camera Section */}
                    <div className="relative bg-black/40 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center border border-white/10">
                        {!capturedImage ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "user" }}
                            />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        )}

                        {/* Camera Controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            {!capturedImage ? (
                                <button
                                    onClick={capture}
                                    className="w-12 h-12 rounded-full bg-white text-purple-600 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <Camera className="w-6 h-6" />
                                </button>
                            ) : (
                                <button
                                    onClick={retake}
                                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Controls & Results Section */}
                    <div className="flex flex-col justify-center space-y-6">
                        {mode === 'register' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-400" />
                                    Register New Face
                                </h2>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Select Student</label>
                                    <select
                                        className="input-field"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                    >
                                        <option value="">-- Choose Student --</option>
                                        {students.map(s => (
                                            <option key={s.student_id} value={s.student_id}>
                                                {s.first_name} {s.last_name} ({s.roll_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleRegistration}
                                    disabled={loading || !capturedImage || !studentId}
                                    className="btn-primary w-full flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Processing...' : 'Save Face Data'}
                                </button>
                            </div>
                        )}

                        {mode === 'attendance' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ScanFace className="w-5 h-5 text-green-400" />
                                    Mark Attendance
                                </h2>
                                <p className="text-white/60 text-sm">
                                    Position face within the frame and capture to mark attendance automatically.
                                </p>
                                <button
                                    onClick={handleAttendance}
                                    disabled={loading || !capturedImage}
                                    className="btn-primary w-full flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Analyzing...' : 'Identify & Mark'}
                                </button>
                            </div>
                        )}

                        {/* Status Messages */}
                        {(result || error) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border ${result ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {result ? <Check className="w-6 h-6 mt-0.5" /> : <X className="w-6 h-6 mt-0.5" />}
                                    <div>
                                        <h3 className="font-bold">{result ? result.message : 'Error'}</h3>
                                        <p className="text-sm opacity-80">{result ? result.details : error}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
