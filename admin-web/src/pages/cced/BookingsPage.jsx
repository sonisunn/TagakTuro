import { useEffect, useState } from 'react';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['All', 'Upcoming', 'Past', 'Cancelled'];

function sortByBookingDateDesc(items) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.bookingDateTime).getTime();
    const timeB = new Date(b.bookingDateTime).getTime();
    return timeB - timeA;
  });
}

function statusClass(s) {
  if (s === 'CONFIRMED') return 'status-green';
  if (s === 'PENDING') return 'status-orange';
  if (s === 'CANCELLED') return 'status-red';
  if (s === 'COMPLETED') return 'status-green';
  return '';
}

export default function CcedBookingsPage() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/booking');
        if (res?.ok) {
          const data = await res.json();
          setBookings(sortByBookingDateDesc(data));
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [authFetch]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getFiltered = () => {
    const filteredBookings = bookings.filter((b) => {
      const bDate = new Date(b.bookingDateTime);
      bDate.setHours(0, 0, 0, 0);

      if (filter === 'Upcoming') {
        return bDate >= today && b.status !== 'CANCELLED' && b.status !== 'COMPLETED';
      }
      if (filter === 'Past') {
        return bDate < today || b.status === 'COMPLETED';
      }
      if (filter === 'Cancelled') {
        return b.status === 'CANCELLED';
      }
      return true;
    });

    return sortByBookingDateDesc(filteredBookings);
  };

  const formatTimeRange = (dateTimeStr, durationMinutes) => {
    if (!dateTimeStr) return 'N/A';
    const start = new Date(dateTimeStr);
    const end = new Date(start.getTime() + (durationMinutes || 60) * 60000);
    
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${start.toLocaleTimeString([], options)} – ${end.toLocaleTimeString([], options)}`;
  };

  const filtered = getFiltered();

  return (
    <CcedLayout title="Bookings">
      <section className="welcome-section">
        <h2>Scheduled Bookings</h2>
        <p>View all tutoring sessions across the platform.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Sessions ({loading ? '...' : filtered.length})</div>
          <div className="table-filters">
            {FILTERS.map((f, i) => (
              <span key={f}>
                {i > 0 && ' | '}
                <span 
                  className={filter === f ? 'active-filter' : 'light clickable'} 
                  onClick={() => setFilter(f)}
                  style={{ cursor: 'pointer', fontWeight: filter === f ? 'bold' : 'normal' }}
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
              <tr><th>#</th><th>Date</th><th>Time</th><th>Subject</th><th>Tutor</th><th>Student</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '1.5rem', color: 'var(--text-grey)', textAlign: 'center' }}>No bookings found.</td></tr>
              ) : (
                filtered.map((b, idx) => (
                  <tr key={b.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{new Date(b.bookingDateTime).toLocaleDateString()}</td>
                    <td>{formatTimeRange(b.bookingDateTime, b.durationMinutes)}</td>
                    <td>{b.subject}</td>
                    <td>{b.tutorName || 'Unassigned'}</td>
                    <td>{b.student?.name || 'Unknown'}</td>
                    <td className={statusClass(b.status)}>{b.status}</td>
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
