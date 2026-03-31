import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const recentBookings = [
  { date: 'Mar 20, 2026', time: '8:00 AM – 9:00 AM', subject: 'Calculus I', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'Confirmed' },
  { date: 'Mar 20, 2026', time: '10:00 AM – 11:00 AM', subject: 'Data Structures', tutor: 'Jane Doe', student: 'Maria Santos', status: 'Confirmed' },
  { date: 'Mar 21, 2026', time: '1:00 PM – 2:00 PM', subject: 'Java Programming', tutor: 'Robert Smith', student: 'John Doe', status: 'Pending' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <DashboardLayout title="Dashboard">
      <section className="welcome-section">
        <h2>{greeting}, {user?.name || 'CCED Admin'} 👋</h2>
        <p>Here's an overview of tutor activity and bookings.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Active Tutors</span>
          <span className="stat-value">12</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sessions This Month</span>
          <span className="stat-value">84</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Rating</span>
          <span className="stat-value">4.7 ⭐</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Certificates Issued</span>
          <span className="stat-value">5</span>
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
                <th>Date</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b, i) => (
                <tr key={`rb-${i}`}>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>{b.subject}</td>
                  <td>{b.tutor}</td>
                  <td>{b.student}</td>
                  <td className={b.status === 'Confirmed' ? 'status-green' : 'status-orange'}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
