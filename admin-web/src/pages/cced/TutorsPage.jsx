import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

function renderStars(r) {
  const full = Math.floor(r), half = r - full >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function CcedTutorsPage() {
  const { authFetch } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/tutor');
        if (res?.ok) {
          const data = await res.json();
          setTutors(data);
        }
      } catch (err) {
        console.error("Error fetching tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, [authFetch]);

  return (
    <CcedLayout title="Tutors">
      <section className="welcome-section">
        <h2>Tutor Overview</h2>
        <p>View tutor profiles, session counts, hours, and performance ratings.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Tutors ({loading ? '...' : tutors.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tutor ID</th><th>Name</th><th>Program</th>
                <th>Sessions Done</th><th>Total Hours</th><th>Overall Rating</th>
                <th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : tutors.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No tutors found.</td></tr>
              ) : (
                tutors.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tutorId}</td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.courseProgram || 'N/A'}</td>
                    <td>{t.sessionsDone ?? 0}</td>
                    <td>{(t.totalHours || 0).toFixed(1)} hrs</td>
                    <td>
                      <span className="stars">{renderStars(t.rating || 0)}</span> {(t.rating || 0).toFixed(1)}
                    </td>
                    <td className="status-green">Active</td>
                    <td>
                      <Link 
                        to={`/cced/tutors/${t.id}`} 
                        style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: '500' }}
                      >
                        View Profile
                      </Link>
                    </td>
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
