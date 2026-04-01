import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const sessionsData = [
    { id: 1, time: '9:30 AM - 10:30 AM', venue: 'Library', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'On-Going' },
    { id: 2, time: '9:30 AM - 10:30 AM', venue: 'Library', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'On-Going' },
    { id: 3, time: '9:30 AM - 10:30 AM', venue: 'Library', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'On-Going' },
    { id: 4, time: '9:30 AM - 10:30 AM', venue: 'Library', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'On-Going' },
    { id: 5, time: '9:30 AM - 10:30 AM', venue: 'Library', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'On-Going' },
  ];

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
          <span className="stat-value">67</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Number of sessions today</span>
          <span className="stat-value">6767</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tutors Pending for Approval</span>
          <span className="stat-value">67</span>
        </div>
      </section>

      {/* Sessions Table */}
      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Sessions</div>
          <div className="table-filters">
            <span>Today</span> <span className="light">| Yesterday</span>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time Scheduled</th>
                <th>Venue</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessionsData.map((session, idx) => (
                <tr key={`session-${idx}`}>
                  <td>{session.time}</td>
                  <td>{session.venue}</td>
                  <td>{session.tutor}</td>
                  <td>{session.student}</td>
                  <td className="status-green">{session.status}</td>
                </tr>
              ))}
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
                <th>Time Scheduled</th>
                <th>Venue</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessionsData.map((session, idx) => (
                <tr key={`pending-${idx}`}>
                  <td>{session.time}</td>
                  <td>{session.venue}</td>
                  <td>{session.tutor}</td>
                  <td>{session.student}</td>
                  <td className="status-green">{session.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
