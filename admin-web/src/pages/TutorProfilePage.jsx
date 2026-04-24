import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function TutorProfilePage() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [tutor, setTutor] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`/api/tutor/${id}`);
        if (res?.ok) {
          const tutorData = await res.json();
          setTutor(tutorData);

          if (tutorData.userId) {
            const feedbackRes = await authFetch(`/api/feedback/user/${tutorData.userId}`);
            if (feedbackRes?.ok) {
              const feedbackData = await feedbackRes.json();
              setEvaluations(feedbackData);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorProfile();
  }, [id, authFetch]);

  if (loading) {
    return (
      <DashboardLayout title="Tutor Profile">
        <p style={{ padding: '2rem' }}>Loading profile...</p>
      </DashboardLayout>
    );
  }

  if (!tutor) {
    return (
      <DashboardLayout title="Tutor Profile">
        <p style={{ color: 'var(--text-grey)', padding: '2rem' }}>Tutor not found.</p>
        <Link to="/tutors" className="btn btn-outline" style={{ marginLeft: '2rem' }}>Back</Link>
      </DashboardLayout>
    );
  }

  const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const sessionsCompleted = toNumber(tutor.sessionsDone ?? tutor.sessionsCompleted);
  const totalHoursDone = toNumber(tutor.totalHours ?? tutor.totalHoursDone);
  const overallRating = toNumber(tutor.rating ?? tutor.overallRating);
  const eligible = totalHoursDone >= 50 && overallRating >= 4.0;

  return (
    <DashboardLayout title="Tutor Profile">
      <section className="welcome-section tutor-profile-header">
        <div className="tutor-profile-meta">
          <h2>{tutor.name}</h2>
          <p>{tutor.courseProgram || 'N/A'} · {tutor.tutorId} · {tutor.email}</p>
        </div>
        <Link to="/tutors" className="profile-back-btn">Back</Link>
      </section>

      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-label">Sessions Completed</span>
          <span className="profile-stat-value">{sessionsCompleted}</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Total Hours Done</span>
          <span className="profile-stat-value">{totalHoursDone.toFixed(1)} hrs</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Overall Rating</span>
          <span className="profile-stat-value">{overallRating.toFixed(1)}</span>
        </div>
      </div>

      <div className={`eligibility-notice ${eligible ? 'eligibility-notice-success' : ''}`}>
        {eligible
          ? 'This tutor meets certificate eligibility (≥50 hrs & ≥4.0 rating).'
          : 'This tutor does not yet meet certificate eligibility (needs ≥50 hrs & ≥4.0 rating).'}
      </div>

      <section className="table-section tutor-evaluations-section">
        <div className="table-header-row">
          <div className="table-title">Student Evaluations ({evaluations.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comment</th></tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '1.5rem', color: 'var(--text-grey)' }}>No evaluations yet.</td></tr>
              ) : (
                evaluations.map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td style={{ fontWeight: 600 }}>{ev.reviewerName}</td>
                    <td>{new Date(ev.createdAt).toLocaleDateString()}</td>
                    <td>{ev.rating.toFixed(1)}</td>
                    <td style={{ textAlign: 'left' }}>{ev.comments}</td>
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
