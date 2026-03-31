import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

const allBookings = [
  { id: 1, date: 'Mar 18, 2026', time: '10:00 AM – 11:00 AM', subject: 'Calculus I',       tutor: 'Jayson Partido', student: 'Christian Baldesco', status: 'Confirmed'  },
  { id: 2, date: 'Mar 19, 2026', time: '1:00 PM – 2:00 PM',   subject: 'Java Programming', tutor: 'Jane Doe',       student: 'Maria Santos',      status: 'Pending'    },
  { id: 3, date: 'Mar 19, 2026', time: '3:00 PM – 4:00 PM',   subject: 'Data Structures',  tutor: 'Jayson Partido', student: 'John Doe',           status: 'Cancelled'  },
  { id: 4, date: 'Mar 20, 2026', time: '8:00 AM – 9:00 AM',   subject: 'Calculus II',      tutor: 'Robert Smith',   student: 'Ana Reyes',          status: 'Confirmed'  },
  { id: 5, date: 'Mar 21, 2026', time: '2:00 PM – 3:00 PM',   subject: 'Physics',          tutor: 'Jane Doe',       student: 'Carlo Santos',       status: 'Confirmed'  },
  { id: 6, date: 'Mar 21, 2026', time: '4:00 PM – 5:00 PM',   subject: 'Algebra',          tutor: 'Ana Rivera',     student: 'Ben Cruz',           status: 'Pending'    },
  { id: 7, date: 'Mar 15, 2026', time: '9:00 AM – 10:00 AM',  subject: 'English Lit.',     tutor: 'Mark Tan',       student: 'Pia Dela Cruz',      status: 'Cancelled'  },
  { id: 8, date: 'Mar 22, 2026', time: '10:00 AM – 11:00 AM', subject: 'Chemistry',        tutor: 'Jayson Partido', student: 'Leo Ramos',          status: 'Confirmed'  },
];

const today = new Date('2026-03-20');

const FILTERS = ['All', 'Upcoming', 'Past', 'Cancelled'];

function statusClass(status) {
  if (status === 'Confirmed') return 'status-green';
  if (status === 'Pending')   return 'status-orange';
  if (status === 'Cancelled') return 'status-red';
  return '';
}

export default function BookingsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = allBookings.filter((b) => {
    const bDate = new Date(b.date);
    if (filter === 'Upcoming')  return bDate >= today && b.status !== 'Cancelled';
    if (filter === 'Past')      return bDate < today  && b.status !== 'Cancelled';
    if (filter === 'Cancelled') return b.status === 'Cancelled';
    return true;
  });

  return (
    <DashboardLayout title="Bookings">
      <section className="welcome-section">
        <h2>Scheduled Bookings</h2>
        <p>View all tutoring sessions across the platform.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Sessions ({filtered.length})</div>
          <div className="table-filters">
            {FILTERS.map((f, i) => (
              <span key={f}>
                {i > 0 && ' | '}
                <span
                  className={filter === f ? '' : 'light'}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '1.5rem', color: 'var(--text-grey)' }}>No bookings found.</td></tr>
              ) : (
                filtered.map((b, idx) => (
                  <tr key={`booking-${b.id}`}>
                    <td>{idx + 1}</td>
                    <td>{b.date}</td>
                    <td>{b.time}</td>
                    <td>{b.subject}</td>
                    <td>{b.tutor}</td>
                    <td>{b.student}</td>
                    <td className={statusClass(b.status)}>{b.status}</td>
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
