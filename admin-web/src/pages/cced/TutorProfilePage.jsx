import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

function renderStars(r) {
  const full = Math.floor(r), half = r - full >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function CcedTutorProfilePage() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [tutor, setTutor] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setLoading(true);
        // Fetch tutor details
        const res = await authFetch(`/api/tutor/${id}`);
        if (res?.ok) {
          const tutorData = await res.json();
          setTutor(tutorData);

          // If tutor has a user, fetch their evaluations
          if (tutorData.userId) {
            const feedbackRes = await authFetch(`/api/feedback/user/${tutorData.userId}`);
            if (feedbackRes?.ok) {
              const feedbackData = await feedbackRes.json();
              setEvaluations(feedbackData);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching tutor profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorProfile();
  }, [id, authFetch]);

  if (loading) {
    return (
      <CcedLayout title="Tutor Profile">
        <p style={{ padding: '2rem' }}>Loading profile...</p>
      </CcedLayout>
    );
  }

  if (!tutor) {
    return (
      <CcedLayout title="Tutor Profile">
        <p style={{ color: 'var(--text-grey)', padding: '2rem' }}>Tutor not found.</p>
        <Link to="/cced/tutors" className="btn btn-outline" style={{ marginLeft: '2rem' }}>← Back</Link>
      </CcedLayout>
    );
  }

  const eligible = (tutor.totalHours || 0) >= 50 && (tutor.rating || 0) >= 4.0;

  return (
    <CcedLayout title="Tutor Profile">
      <section className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{tutor.name}</h2>
          <p>{tutor.courseProgram || 'N/A'} · {tutor.tutorId} · {tutor.email}</p>
        </div>
        <Link to="/cced/tutors" className="btn btn-outline">← Back</Link>
      </section>

      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-label">Sessions Completed</span>
          <span className="profile-stat-value">{tutor.sessionsDone ?? 0}</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Total Hours Done</span>
          <span className="profile-stat-value">{(tutor.totalHours || 0).toFixed(1)} hrs</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Overall Rating</span>
          <span className="profile-stat-value">
            <span className="stars">{renderStars(tutor.rating || 0)}</span> {(tutor.rating || 0).toFixed(1)}
          </span>
        </div>
      </div>

      <div className="eligibility-notice" style={eligible
        ? { background: '#dcfce7', borderColor: '#86efac', color: '#15803d' }
        : {}}>
        {eligible
          ? 'This tutor meets certificate eligibility (≥50 hrs & ≥4.0 rating).'
          : 'This tutor does not yet meet certificate eligibility (needs ≥50 hrs & ≥4.0 rating).'}
      </div>

      <section className="table-section">
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
                    <td><span className="stars">{renderStars(ev.rating)}</span> {ev.rating.toFixed(1)}</td>
                    <td style={{ textAlign: 'left' }}>{ev.comment}</td>
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
