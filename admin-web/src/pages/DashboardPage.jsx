import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const { user, authFetch } = useAuth();

  const [stats, setStats] = useState({ totalUsers: 0, sessionsToday: 0, pendingTutors: 0 });
  const [sessions, setSessions] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [statsRes, bookingsRes, applicationsRes] = await Promise.all([
          authFetch('/api/admin/dashboard/stats'),
          authFetch('/api/booking'),
          authFetch('/api/tutor/applications')
        ]);

        if (statsRes?.ok && bookingsRes?.ok && applicationsRes?.ok) {
          const statsData = await statsRes.json();
          const bookingsData = await bookingsRes.json();
          const applicationsData = await applicationsRes.json();

          const today = new Date().toDateString();
          const todaysBookings = bookingsData.filter(b => 
            new Date(b.bookingDateTime).toDateString() === today
          );
          
          const pendingApps = applicationsData.filter(a => a.status === 'PENDING');

          setStats({
            totalUsers: statsData.totalUsers || 0,
            sessionsToday: todaysBookings.length,
            pendingTutors: pendingApps.length
          });

          // Sort bookings: most recent or upcoming first. 
          // Let's sort by date descending and take top 5
          const sortedBookings = [...bookingsData].sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime)).slice(0, 5);
          setSessions(sortedBookings);

          const sortedApps = [...pendingApps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
          setPendingApplications(sortedApps);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authFetch]);

  const formatTime = (dateString, durationMinutes) => {
    if (!dateString) return 'N/A';
    const start = new Date(dateString);
    const end = new Date(start.getTime() + (durationMinutes || 60) * 60000);
    
    const formatOpts = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${start.toLocaleTimeString([], formatOpts)} - ${end.toLocaleTimeString([], formatOpts)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardLayout title="Dashboard">
      <section className="welcome-section">
        <h2>{greeting}, {user?.name || 'Admin'}</h2>
        <p>Here's an overview of your platform</p>
      </section>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{loading ? '...' : stats.totalUsers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Number of sessions today</span>
          <span className="stat-value">{loading ? '...' : stats.sessionsToday}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tutors Pending for Approval</span>
          <span className="stat-value">{loading ? '...' : stats.pendingTutors}</span>
        </div>
      </section>

      {/* Sessions Table */}
      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Recent Sessions</div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Loading sessions...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No sessions found.</td></tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div>{formatDate(session.bookingDateTime)}</div>
                      <div style={{fontSize: '0.85em', color: '#666', marginTop: '4px'}}>{formatTime(session.bookingDateTime, session.durationMinutes)}</div>
                    </td>
                    <td>{session.venue || session.modality || 'N/A'}</td>
                    <td>{session.tutorName || 'Unassigned'}</td>
                    <td>{session.student?.name || 'N/A'}</td>
                    <td>
                      <span className={session.status?.toLowerCase() === 'confirmed' || session.status?.toLowerCase() === 'completed' ? 'status-green' : ''}>
                        {session.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tutors Pending Table */}
      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Tutors Pending for Approval</div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date Applied</th>
                <th>Name</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Loading applications...</td></tr>
              ) : pendingApplications.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No pending applications.</td></tr>
              ) : (
                pendingApplications.map((app) => (
                  <tr key={app.id}>
                    <td>{formatDate(app.createdAt)}</td>
                    <td>{app.name}</td>
                    <td>{app.studentId}</td>
                    <td>{app.courseProgram}</td>
                    <td>
                      <span style={{ color: '#e67e22', fontWeight: 500 }}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
