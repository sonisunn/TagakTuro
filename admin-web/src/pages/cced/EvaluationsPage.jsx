import { useEffect, useState } from 'react';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

export default function CcedEvaluationsPage() {
  const { authFetch } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllEvaluations = async () => {
      try {
        setLoading(true);
        // 1. Get all tutors to get their userIds
        const tutorsRes = await authFetch('/api/tutor');
        if (tutorsRes?.ok) {
          const tutorsData = await tutorsRes.json();
          
          // 2. Fetch feedback for each tutor in parallel
          const feedbackPromises = tutorsData
            .filter(t => t.userId)
            .map(t => authFetch(`/api/feedback/user/${t.userId}`).then(res => res.ok ? res.json() : []));
          
          const results = await Promise.all(feedbackPromises);
          
          // 3. Flatten and sort by date descending
          const allFeedback = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setEvaluations(allFeedback);
        }
      } catch (err) {
        console.error("Error fetching evaluations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllEvaluations();
  }, [authFetch]);

  return (
    <CcedLayout title="Evaluations">
      <section className="welcome-section">
        <h2>Tutor Evaluations</h2>
        <p>All student reviews and ratings given to tutors.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Reviews ({loading ? '...' : evaluations.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Tutor</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comment</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading evaluations...</td></tr>
              ) : evaluations.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', color: 'var(--text-grey)', textAlign: 'center' }}>No reviews found.</td></tr>
              ) : (
                evaluations.map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{ev.revieweeName}</td>
                    <td>{ev.reviewerName}</td>
                    <td>{new Date(ev.createdAt).toLocaleDateString()}</td>
                    <td>{ev.rating.toFixed(1)}</td>
                    <td style={{ textAlign: 'left', maxWidth: '280px' }}>{ev.comments}</td>
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
