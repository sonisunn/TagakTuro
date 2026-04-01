import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { mockTutors } from './TutorsPage';

const evaluationsByTutor = {
  1: [
    { reviewer: 'Christian Baldesco', date: 'Mar 10, 2026', rating: 5.0, comment: 'Very patient and knowledgeable!' },
    { reviewer: 'Leo Ramos',          date: 'Mar 12, 2026', rating: 4.8, comment: 'Explains concepts clearly.'       },
    { reviewer: 'Ana Reyes',          date: 'Mar 15, 2026', rating: 5.0, comment: 'Best tutor I have ever had!'      },
  ],
  2: [
    { reviewer: 'Maria Santos', date: 'Mar 11, 2026', rating: 4.7, comment: 'Great session, very helpful.'  },
    { reviewer: 'Carlo Santos', date: 'Mar 14, 2026', rating: 4.7, comment: 'Clear explanations, highly recommended.' },
  ],
  3: [
    { reviewer: 'John Doe',  date: 'Mar 9, 2026',  rating: 4.5, comment: 'Good session overall.'      },
    { reviewer: 'Ben Cruz',  date: 'Mar 13, 2026', rating: 4.5, comment: 'Helpful but a bit rushed.'  },
  ],
  4: [
    { reviewer: 'Pia Dela Cruz', date: 'Mar 8, 2026',  rating: 3.8, comment: 'Decent explanations but needs improvement.' },
  ],
  5: [
    { reviewer: 'Ben Cruz', date: 'Mar 5, 2026', rating: 4.6, comment: 'Very engaging and fun session.' },
  ],
};

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function TutorProfilePage() {
  const { id } = useParams();
  const tutor = mockTutors.find((t) => String(t.id) === id);

  if (!tutor) {
    return (
      <DashboardLayout title="Tutor Profile">
        <p style={{ color: 'var(--text-grey)', padding: '2rem' }}>Tutor not found.</p>
        <Link to="/tutors" className="btn btn-outline" style={{ marginLeft: '2rem' }}>← Back to Tutors</Link>
      </DashboardLayout>
    );
  }

  const evaluations = evaluationsByTutor[tutor.id] || [];

  return (
    <DashboardLayout title="Tutor Profile">
      <section className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{tutor.name}</h2>
          <p>{tutor.program} · {tutor.tutorId} · {tutor.email}</p>
        </div>
        <Link to="/tutors" className="btn btn-outline">← Back</Link>
      </section>

      {/* Stats */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-label">Sessions Completed</span>
          <span className="profile-stat-value">{tutor.sessionsCompleted}</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Total Hours Done</span>
          <span className="profile-stat-value">{tutor.totalHours} hrs</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-label">Overall Rating</span>
          <span className="profile-stat-value">
            <span className="stars">{renderStars(tutor.overallRating)}</span> {tutor.overallRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Certificate eligibility notice */}
      {tutor.totalHours >= 50 && tutor.overallRating >= 4.0 ? (
        <div className="eligibility-notice" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#15803d' }}>
          🏆 This tutor meets the certificate eligibility requirements (≥50 hrs &amp; ≥4.0 rating).
        </div>
      ) : (
        <div className="eligibility-notice">
          ℹ️ This tutor does not yet meet certificate eligibility requirements (needs ≥50 hrs &amp; ≥4.0 rating).
        </div>
      )}

      {/* Evaluations table */}
      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Student Evaluations ({evaluations.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Date</th>
                <th>Rating</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '1.5rem', color: 'var(--text-grey)' }}>No evaluations yet.</td></tr>
              ) : (
                evaluations.map((ev, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{ev.reviewer}</td>
                    <td>{ev.date}</td>
                    <td><span className="stars">{renderStars(ev.rating)}</span> {ev.rating.toFixed(1)}</td>
                    <td style={{ textAlign: 'left' }}>{ev.comment}</td>
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
