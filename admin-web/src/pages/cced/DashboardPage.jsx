import { useEffect, useState } from 'react';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

export default function CcedDashboardPage() {
  const { user, authFetch } = useAuth();
  const [summary, setSummary] = useState({
    totalTutors: 0,
    sessionsThisMonth: 0,
    avgRating: 0.0,
    certsIssued: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch summary stats
        const summaryRes = await authFetch('/api/admin/summary');
        if (summaryRes?.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }

        // Fetch recent bookings (last 5)
        const bookingsRes = await authFetch('/api/booking');
        if (bookingsRes?.ok) {
          const bookingsData = await bookingsRes.json();
          // Sort by date descending and take top 5
          const sorted = [...bookingsData].sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime));
          setRecentBookings(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authFetch]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const formatTimeRange = (dateTimeStr, durationMinutes) => {
    if (!dateTimeStr) return 'N/A';
    const start = new Date(dateTimeStr);
    const end = new Date(start.getTime() + (durationMinutes || 60) * 60000);
    
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString([], options)}`;
  };

  return (
    <CcedLayout title="Dashboard">
      <section className="welcome-section">
        <h2>{greeting}, {user?.name || 'CCED Admin'}</h2>
        <p>Here's an overview of tutor activity and bookings.</p>
      </section>

      <section className="stats-grid stats-grid-4">
        <div className="stat-card">
          <span className="stat-label">Total Active Tutors</span>
          <span className="stat-value">{loading ? '...' : summary.totalTutors}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sessions This Month</span>
          <span className="stat-value">{loading ? '...' : summary.sessionsThisMonth}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Rating</span>
          <span className="stat-value">{loading ? '...' : summary.avgRating.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Certificates Issued</span>
          <span className="stat-value">{loading ? '...' : summary.certsIssued}</span>
        </div>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Recent Bookings</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Time</th><th>Subject</th><th>Tutor</th><th>Student</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : recentBookings.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No recent bookings.</td></tr>
              ) : (
                recentBookings.map((b, i) => (
                  <tr key={b.id || i}>
                    <td>{new Date(b.bookingDateTime).toLocaleDateString()}</td>
                    <td>{formatTimeRange(b.bookingDateTime, b.durationMinutes)}</td>
                    <td>{b.subject}</td>
                    <td>{b.tutorName || 'Unassigned'}</td>
                    <td>{b.student?.name || 'Unknown'}</td>
                    <td className={b.status === 'CONFIRMED' ? 'status-green' : b.status === 'PENDING' ? 'status-orange' : 'status-red'}>
                      {b.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </CcedLayout>
  );
}
