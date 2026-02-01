import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';

// Student Pages
import StudentDashboardMain from './pages/student/DashboardMain';
import StudentQRPage from './pages/student/QRCodePage';
import StudentAttendancePage from './pages/student/AttendancePage';
import StudentMessPage from './pages/student/MessPage';
import StudentProfilePage from './pages/student/ProfilePage';

// Admin Pages  
import AdminDashboardMain from './pages/admin/DashboardMain';
import AdminStudentsPage from './pages/admin/StudentsPage';
import StudentRegistrationPage from './pages/admin/StudentRegistrationPage';
import FaceAttendancePage from './pages/admin/FaceAttendancePage';
import AdminAttendancePage from './pages/admin/AttendancePage';
import AdminViolationsPage from './pages/admin/ViolationsPage';
import AdminMessPage from './pages/admin/MessPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import QRScanner from './pages/QRScanner';

// Protected Route wrapper
function ProtectedRoute({ children, isAuthenticated, allowedRoles, userRole }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, check if user's role is in the allowed list
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on their actual role
      const redirectTo = userRole === 'student' ? '/student' : '/admin';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}

// Public Route wrapper (redirects if already authenticated)
function PublicRoute({ children, isAuthenticated, userRole }) {
  if (isAuthenticated) {
    const redirectTo = userRole === 'student' ? '/student' : '/admin';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Only run once on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
      setIsAuthenticated(true);
      // Normalize role to lowercase
      setUserRole(role ? role.toLowerCase() : null);
    }

    setLoading(false);
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

  // Show loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute isAuthenticated={isAuthenticated} userRole={userRole}>
              <Login onLogin={handleLogin} />
            </PublicRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['student']}
              userRole={userRole}
            >
              <StudentDashboardMain onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/qr"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['student']}
              userRole={userRole}
            >
              <StudentQRPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['student']}
              userRole={userRole}
            >
              <StudentAttendancePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/mess"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['student']}
              userRole={userRole}
            >
              <StudentMessPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['student']}
              userRole={userRole}
            >
              <StudentProfilePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <AdminDashboardMain onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <AdminStudentsPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students/register"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <StudentRegistrationPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <AdminAttendancePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/violations"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <AdminViolationsPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/mess"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <AdminMessPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scanner"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <QRScanner onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/face-attendance"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'warden']}
              userRole={userRole}
            >
              <FaceAttendancePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin']}
              userRole={userRole}
            >
              <AnalyticsDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
