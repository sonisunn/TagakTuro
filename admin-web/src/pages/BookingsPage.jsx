import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function BookingsPage() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('UPCOMING'); // 'UPCOMING', 'PAST', 'CANCELLED'

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/booking');
      if (res?.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [authFetch]);

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeRange = (dateTimeString, durationMinutes = 60) => {
    if (!dateTimeString) return 'N/A';
    const start = new Date(dateTimeString);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    
    const format = (date) => date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${format(start)} - ${format(end)}`;
  };

  const getFilteredBookings = () => {
    if (filter === 'UPCOMING') {
      return bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
    } else if (filter === 'PAST') {
      return bookings.filter(b => b.status === 'COMPLETED');
    } else if (filter === 'CANCELLED') {
      return bookings.filter(b => b.status === 'CANCELLED');
    }
    return bookings;
  };

  const displayedBookings = getFilteredBookings();

  return (
    <DashboardLayout title="Bookings">
      <section className="welcome-section">
        <h2>Session Bookings</h2>
        <p>Monitor and manage all tutoring sessions across the platform.</p>
      </section>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">
            {filter.charAt(0) + filter.slice(1).toLowerCase()} Sessions ({loading ? '...' : displayedBookings.length})
          </div>
          <div className="table-filters">
            <span 
              onClick={() => setFilter('UPCOMING')} 
              style={{ cursor: 'pointer', fontWeight: filter === 'UPCOMING' ? 'bold' : 'normal', color: filter === 'UPCOMING' ? 'var(--primary-blue)' : 'inherit' }}
            >
              Upcoming
            </span> 
            <span className="light"> | </span>
            <span 
              onClick={() => setFilter('PAST')} 
              style={{ cursor: 'pointer', fontWeight: filter === 'PAST' ? 'bold' : 'normal', color: filter === 'PAST' ? 'var(--primary-blue)' : 'inherit' }}
            >
              Past
            </span>
            <span className="light"> | </span>
            <span 
              onClick={() => setFilter('CANCELLED')} 
              style={{ cursor: 'pointer', fontWeight: filter === 'CANCELLED' ? 'bold' : 'normal', color: filter === 'CANCELLED' ? 'var(--primary-blue)' : 'inherit' }}
            >
              Cancelled
            </span>
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
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading bookings...</td>
                </tr>
              ) : displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No bookings found.</td>
                </tr>
              ) : (
                displayedBookings.map((b) => (
                  <tr key={`booking-${b.id}`}>
                    <td>{formatDate(b.bookingDateTime)}</td>
                    <td>{formatTimeRange(b.bookingDateTime, b.durationMinutes)}</td>
                    <td>{b.subject}</td>
                    <td>{b.tutorName || 'Unassigned'}</td>
                    <td>{b.student?.name || 'N/A'}</td>
                    <td className={
                      b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'status-green' : 
                      b.status === 'CANCELLED' ? 'status-red' : ''
                    }>
                      {b.status}
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
