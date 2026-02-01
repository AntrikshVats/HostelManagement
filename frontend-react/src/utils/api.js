import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

export const attendanceAPI = {
    generateQR: () => api.post('/attendance/generate-qr'),
    scanQR: (data) => api.post('/attendance/scan', data),
    scan: (token) => api.post('/attendance/scan', { token }),
    getHistory: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
    getStats: (studentId, year, month) => api.get(`/attendance/student/${studentId}/stats`, { params: { year, month } }),
    getTodayAttendance: (date) => api.get(`/attendance/daily/${date}`),
};

export const studentAPI = {
    getProfile: () => api.get('/student/profile'),
    updateProfile: (data) => api.put('/student/profile', data),
    getAttendance: () => api.get('/student/attendance'),
    getMessHistory: () => api.get('/student/mess/history'),
};

export const messAPI = {
    optOut: (data) => api.post('/mess/opt-out', data),
    getDailySummary: (date) => api.get('/mess/daily-summary', { params: { date } }),
    getMenu: (date) => api.get(`/mess/menu/${date}`),
    updatePreference: (preference) => api.put('/mess/preference', { dietary_preference: preference }),
    getForecast: (targetDate, mealTime) => api.get('/mess/demand-forecast', { params: { target_date: targetDate, meal_time: mealTime } }),
    getHistory: () => api.get('/mess/history'),
};

export const adminAPI = {
    getStudents: (params) => api.get('/admin/students', { params }),
    createStudent: (data) => api.post('/admin/students', data),
    assignRoom: (data) => api.post('/admin/rooms/assign', data),
    getViolations: (resolved = false) => api.get('/admin/violations', { params: { resolved } }),
    getFrequentAbsent: (days, threshold) => api.get('/admin/students/absent', { params: { days, threshold } }),
    getDashboard: () => api.get('/admin/dashboard'),
    resolveViolation: (violationId) => api.put(`/admin/violations/${violationId}/resolve`),
    checkCurfew: () => api.post('/admin/violations/check-curfew'),
    getAvailableRooms: (block) => api.get('/admin/rooms/available', { params: { block } }),
    registerStudent: (data) => api.post('/admin/register-student', data),
};

export const analyticsAPI = {
    getPeakHours: (days) => api.get('/analytics/peak-hours', { params: { days } }),
    getDailyTrends: (days) => api.get('/analytics/daily-trends', { params: { days } }),
    getMonthlyStats: (year, month) => api.get(`/analytics/monthly/${year}/${month}`),
    getLateOuts: (days, minCount) => api.get('/analytics/late-outs', { params: { days, min_count: minCount } }),
    getMealUtilization: (days) => api.get('/analytics/meal-utilization', { params: { days } }),
    getOccupancy: () => api.get('/analytics/occupancy'),
    getAnomalies: () => api.get('/analytics/anomalies'),
    exportCSV: (dataType, params) => api.get('/analytics/export/csv', { params: { data_type: dataType, ...params } }),
};

export const faceAPI = {
    register: (formData) => api.post('/admin/face/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    recognize: (formData) => api.post('/admin/face/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default api;
