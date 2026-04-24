import { useEffect, useState } from 'react';
import CcedLayout from '../../components/CcedLayout';
import { useAuth } from '../../context/AuthContext';

const MIN_HOURS  = 50;
const MIN_RATING = 4.0;

export default function CcedCertificatesPage() {
  const { authFetch } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);

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

  const eligibleTutors = tutors.filter(
    (t) => (t.totalHours || 0) >= MIN_HOURS && (t.rating || 0) >= MIN_RATING
  );

  const formatHours = (value) => {
    const hours = Number(value || 0);
    return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
  };

  const handleSend = async (tutor) => {
    try {
      setProcessing(true);
      const res = await authFetch(`/api/tutor/${tutor.id}/issue-certificate`, {
        method: 'POST'
      });
      
      if (res?.ok) {
        // Update local state
        setTutors(prev => prev.map(t => t.id === tutor.id ? { ...t, isCertIssued: true } : t));
        setModal(null);
        setSuccess(tutor.name);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        alert("Failed to issue certificate. Please try again.");
      }
    } catch (err) {
      console.error("Error issuing certificate:", err);
      alert("An error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <CcedLayout title="Certificates">
      <section className="welcome-section">
        <h2>Certificate Issuance</h2>
        <p>
          Only tutors with <strong>≥ {MIN_HOURS} hours</strong> and a rating of{' '}
          <strong>≥ {MIN_RATING.toFixed(1)}</strong> are eligible.
        </p>
      </section>

      {success && (
        <div className="success-banner" style={{ background: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #86efac' }}>
          Certificate successfully issued and sent to <strong>{success}</strong>!
        </div>
      )}

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Eligible Tutors ({eligibleTutors.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Program</th>
                <th>Total Hours</th><th>Rating</th><th>Certificate</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading eligible tutors...</td></tr>
              ) : eligibleTutors.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', color: 'var(--text-grey)', textAlign: 'center' }}>No eligible tutors yet.</td></tr>
              ) : (
                eligibleTutors.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.courseProgram || 'N/A'}</td>
                    <td>{formatHours(t.totalHours)}</td>
                    <td>{(t.rating || 0).toFixed(1)}</td>
                    <td>{t.isCertIssued ? 'Issued' : 'Not Issued'}</td>
                    <td>
                      {t.isCertIssued
                        ? <span className="certificate-action-text">Already Sent</span>
                        : <button className="btn send-certificate-btn" onClick={() => setModal(t)}>Send Certificate</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModal(null)}>
          <div className="modal" style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Send Certificate to {modal.name}?</h3>
            <p>
              This will issue an official completion certificate to <strong>{modal.name}</strong> ({modal.email}) for{' '}
              <strong>{(modal.totalHours || 0).toFixed(1)} hours</strong> of tutoring with a rating of{' '}
              <strong>{(modal.rating || 0).toFixed(1)}</strong>.
            </p>
            <div style={{ background: '#f0f7fc', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '14px', color: '#444', marginBottom: '1.5rem' }}>
              Official notification will be sent to: <strong>{modal.email}</strong>
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModal(null)} disabled={processing}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleSend(modal)} disabled={processing}>
                {processing ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CcedLayout>
  );
}
