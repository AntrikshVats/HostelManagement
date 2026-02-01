import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages to help with debugging
const Login = () => {
    return (
        <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
            <h1>Login Page Loading...</h1>
            <p>If you see this, React is working!</p>
        </div>
    );
};

const StudentDashboard = () => <div style={{ color: 'white', padding: '20px' }}>Student Dashboard</div>;
const AdminDashboard = () => <div style={{ color: 'white', padding: '20px' }}>Admin Dashboard</div>;
const AnalyticsDashboard = () => <div style={{ color: 'white', padding: '20px' }}>Analytics Dashboard</div>;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            if (token) {
                setIsAuthenticated(true);
                setUserRole(role);
            }
        } catch (error) {
            console.error('Error reading localStorage:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogin = (token, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        setIsAuthenticated(true);
        setUserRole(role);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        setUserRole(null);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated ?
                            <Navigate to={userRole === 'student' ? '/student' : '/admin'} /> :
                            <Login />
                    }
                />
                <Route
                    path="/student"
                    element={
                        isAuthenticated && userRole === 'student' ?
                            <StudentDashboard /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/admin"
                    element={
                        isAuthenticated && (userRole === 'Admin' || userRole === 'Warden') ?
                            <AdminDashboard /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/analytics"
                    element={
                        isAuthenticated ?
                            <AnalyticsDashboard /> :
                            <Navigate to="/login" />
                    }
                />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
