import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { sortByDateWithPriority, formatDateDisplay } from '../utils/dateUtils';

export default function StudentProfilePage() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [student, setStudent] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`/api/student/${id}`);
        if (res?.ok) {
          const studentData = await res.json();
          setStudent(studentData);

          // Fetch evaluations/feedback for this student using userId
          if (studentData.userId) {
            try {
              const feedbackRes = await authFetch(`/api/feedback/user/${studentData.userId}`);
              if (feedbackRes?.ok) {
                const feedbackData = await feedbackRes.json();
                setEvaluations(feedbackData);
              }
            } catch (err) {
              console.error('Error fetching student evaluations:', err);
              // If this endpoint fails, just continue without evaluations
              setEvaluations([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [id, authFetch]);

  if (loading) {
    return (
      <DashboardLayout title="Student Profile">
        <p style={{ padding: '2rem' }}>Loading profile...</p>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Profile">
        <p style={{ color: 'var(--text-grey)', padding: '2rem' }}>Student not found.</p>
        <Link to="/students" className="btn btn-outline" style={{ marginLeft: '2rem' }}>Back</Link>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const sessionsBooked = student.bookings ? student.bookings.length : 0;
  const overallRating = evaluations.length > 0
    ? (evaluations.reduce((sum, ev) => sum + (parseFloat(ev.rating) || 0), 0) / evaluations.length).toFixed(1)
    : 0;

  return (
    <DashboardLayout title="Student Profile">
      <section className="welcome-section tutor-profile-header">
        <div className="tutor-profile-meta">
          <h2>{student.name}</h2>
          <p>{student.courseProgram || 'N/A'} · {student.studentId} · {student.email}</p>
        </div>
        <Link to="/students" className="profile-back-btn">Back</Link>
      </section>

      <div className="profile-stats-grid student-profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-label">Sessions Booked</span>
          <span className="profile-stat-value">{sessionsBooked}</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Overall Rating</span>
          <span className="profile-stat-value">{overallRating}</span>
        </div>
      </div>

      <section className="table-section tutor-evaluations-section">
        <div className="table-header-row">
          <div className="table-title">Tutor Evaluations ({evaluations.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>Tutor</th><th>Date</th><th>Rating</th><th>Comment</th></tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '1.5rem', color: 'var(--text-grey)' }}>No evaluations yet.</td></tr>
              ) : (
                sortByDateWithPriority(evaluations, 'createdAt', 'past').map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td style={{ fontWeight: 600 }}>{ev.reviewerName || ev.reviewer?.name || 'N/A'}</td>
                    <td>{formatDateDisplay(ev.createdAt)}</td>
                    <td>{ev.rating?.toFixed(1) || 'N/A'}</td>
                    <td style={{ textAlign: 'left' }}>{ev.comments || '-'}</td>
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
