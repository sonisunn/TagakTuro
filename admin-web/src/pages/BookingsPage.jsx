import DashboardLayout from '../components/DashboardLayout';

export default function BookingsPage() {
  const mockBookings = [
    { id: 1, date: 'Mar 18, 2026', time: '10:00 AM - 11:00 AM', subject: 'Calculus I', tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'Confirmed' },
    { id: 2, date: 'Mar 19, 2026', time: '1:00 PM - 2:00 PM', subject: 'Java Programming', tutor: 'Jane Doe', student: 'Maria Santos', status: 'Pending' },
    { id: 3, date: 'Mar 19, 2026', time: '3:00 PM - 4:00 PM', subject: 'Data Structures', tutor: 'Jayson Partido', student: 'John Doe', status: 'Cancelled' },
  ];

  return (
    <DashboardLayout title="Bookings">
      <section className="welcome-section">
        <h2>Session Bookings</h2>
        <p>Monitor and manage all tutoring sessions across the platform.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Upcoming Sessions</div>
          <div className="table-filters">
            <span>Upcoming</span> <span className="light">| Past</span> <span className="light">| Cancelled</span>
          </div>
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
              {mockBookings.map((b, idx) => (
                <tr key={`booking-${idx}`}>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>{b.subject}</td>
                  <td>{b.tutor}</td>
                  <td>{b.student}</td>
                  <td className={b.status === 'Confirmed' ? 'status-green' : ''}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
