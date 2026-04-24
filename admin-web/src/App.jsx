import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';
import LoginPage from './pages/LoginPage';

// Admin pages
import DashboardPage    from './pages/DashboardPage';
import StudentsPage     from './pages/StudentsPage';
import TutorsPage       from './pages/TutorsPage';
import TutorProfilePage from './pages/TutorProfilePage';
import ApplicationsPage from './pages/ApplicationsPage';
import BookingsPage     from './pages/BookingsPage';

// CCED pages
import CcedDashboard    from './pages/cced/DashboardPage';
import CcedBookings     from './pages/cced/BookingsPage';
import CcedTutors       from './pages/cced/TutorsPage';
import CcedTutorProfile from './pages/cced/TutorProfilePage';
import CcedEvaluations  from './pages/cced/EvaluationsPage';
import CcedCertificates from './pages/cced/CertificatesPage';

const Admin = ({ children }) => <RoleRoute requiredRole="ROLE_ADMIN">{children}</RoleRoute>;
const Cced  = ({ children }) => <RoleRoute requiredRole="ROLE_CCED">{children}</RoleRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Shared login */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin routes */}
          <Route path="/dashboard"    element={<Admin><DashboardPage /></Admin>} />
          <Route path="/students"     element={<Admin><StudentsPage /></Admin>} />
          <Route path="/tutors"       element={<Admin><TutorsPage /></Admin>} />
          <Route path="/tutors/:id"   element={<Admin><TutorProfilePage /></Admin>} />
          <Route path="/applications" element={<Admin><ApplicationsPage /></Admin>} />
          <Route path="/bookings"     element={<Admin><BookingsPage /></Admin>} />

          {/* CCED routes */}
          <Route path="/cced/dashboard"       element={<Cced><CcedDashboard /></Cced>} />
          <Route path="/cced/bookings"        element={<Cced><CcedBookings /></Cced>} />
          <Route path="/cced/tutors"          element={<Cced><CcedTutors /></Cced>} />
          <Route path="/cced/tutors/:id"      element={<Cced><CcedTutorProfile /></Cced>} />
          <Route path="/cced/evaluations"     element={<Cced><CcedEvaluations /></Cced>} />
          <Route path="/cced/certificates"    element={<Cced><CcedCertificates /></Cced>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
