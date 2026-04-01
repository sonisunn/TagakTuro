import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import TutorsPage from './pages/TutorsPage';
import TutorProfilePage from './pages/TutorProfilePage';
import EvaluationsPage from './pages/EvaluationsPage';
import CertificatesPage from './pages/CertificatesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/tutors" element={<ProtectedRoute><TutorsPage /></ProtectedRoute>} />
          <Route path="/tutors/:id" element={<ProtectedRoute><TutorProfilePage /></ProtectedRoute>} />
          <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
