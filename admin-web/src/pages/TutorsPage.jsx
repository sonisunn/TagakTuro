import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function TutorsPage() {
  const { authFetch } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/tutor');
        if (res?.ok) {
          const data = await res.json();
          setTutors(data);
        } else {
          setError('Failed to load tutors data');
        }
      } catch (err) {
        console.error("Error fetching tutors:", err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [authFetch]);

  return (
    <DashboardLayout title="Tutors">
      <section className="welcome-section">
        <h2>Tutor Management</h2>
        <p>View and manage approved tutors in the system.</p>
      </section>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Approved Tutors ({loading ? '...' : tutors.length})</div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tutor ID</th>
                <th>Name</th>
                <th>Program / Specialization</th>
                <th>Sessions Done</th>
                <th>Total Hours</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading tutors...</td>
                </tr>
              ) : tutors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No tutors found.</td>
                </tr>
              ) : (
                tutors.map((t, idx) => (
                  <tr key={`tutor-${t.id || idx}`}>
                    <td>{t.tutorId}</td>
                    <td>{t.name}</td>
                    <td>{t.courseProgram || 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}>{t.sessionsDone ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>{(t.totalHours || 0).toFixed(1)}h</td>
                    <td style={{ textAlign: 'center' }}>
                      {t.rating > 0 ? (
                        <span>⭐ {t.rating.toFixed(1)}</span>
                      ) : (
                        <span style={{ color: '#999' }}>No ratings</span>
                      )}
                    </td>
                    {/* The backend Tutor model doesn't store 'active/inactive' status, let's default to active for now */}
                    <td className="status-green">Active</td>
                    <td><button style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer' }}>View</button></td>
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
