import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { mockTutors } from './TutorsPage';

const evaluationsByTutor = {
  1: [
    { reviewer: 'Christian Baldesco', date: 'Mar 10, 2026', rating: 4.8, comment: 'Very patient and knowledgeable!' },
    { reviewer: 'Jane Doe',           date: 'Mar 14, 2026', rating: 4.9, comment: 'Explains concepts clearly.' },
    { reviewer: 'Robert Smith',       date: 'Mar 18, 2026', rating: 4.5, comment: 'Best tutor I have ever had!' },
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

export default function TutorProfilePage() {
  const { id } = useParams();
  const tutor = mockTutors.find((t) => String(t.id) === id);

  if (!tutor) {
    return (
      <DashboardLayout title="Tutor Profile">
        <p style={{ color: 'var(--text-grey)', padding: '2rem' }}>Tutor not found.</p>
        <Link to="/tutors" className="btn btn-outline" style={{ marginLeft: '2rem' }}>Back to Tutors</Link>
      </DashboardLayout>
    );
  }

  const evaluations = evaluationsByTutor[tutor.id] || [];

  return (
    <DashboardLayout title="Tutor Profile">
      <section className="welcome-section tutor-profile-header">
        <div className="tutor-profile-meta">
          <h2>{tutor.name}</h2>
          <p>{tutor.program} · {tutor.tutorId} · {tutor.email}</p>
        </div>
        <Link to="/tutors" className="profile-back-btn">Back</Link>
      </section>

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
          <span className="profile-stat-value">{tutor.overallRating.toFixed(1)}</span>
        </div>
      </div>

      {tutor.totalHours >= 50 && tutor.overallRating >= 4.0 ? (
        <div className="eligibility-notice eligibility-notice-success">
          This tutor meets certificate eligibility (&ge;50 hrs &amp; &ge;4.0 rating).
        </div>
      ) : (
        <div className="eligibility-notice">
          This tutor does not yet meet certificate eligibility (needs &ge;50 hrs &amp; &ge;4.0 rating).
        </div>
      )}

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
                    <td>{ev.rating.toFixed(1)}</td>
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
