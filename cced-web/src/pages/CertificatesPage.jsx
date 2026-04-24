import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { mockTutors } from './TutorsPage';

// ─── Eligibility thresholds ───────────────────────────────────────────────────
const MIN_HOURS  = 50;
const MIN_RATING = 4.0;

// Only tutors who have met BOTH requirements appear on this page
const eligibleTutors = mockTutors.filter(
  (t) => t.totalHours >= MIN_HOURS && t.overallRating >= MIN_RATING
);

export default function CertificatesPage() {
  // Track issued state locally (would be persisted via API in production)
  const [issued, setIssued] = useState(
    () => Object.fromEntries(eligibleTutors.map((t) => [t.id, t.certIssued]))
  );
  const [modal, setModal]     = useState(null);  // tutor object or null
  const [success, setSuccess] = useState(null);  // tutor id or null

  const handleSend = (tutor) => {
    setIssued((prev) => ({ ...prev, [tutor.id]: true }));
    setModal(null);
    setSuccess(tutor.id);
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <DashboardLayout title="Certificates">
      <section className="welcome-section">
        <h2>Certificate Issuance</h2>
        <p>Only tutors who have completed <strong>≥ {MIN_HOURS} hours</strong> with an overall rating of <strong>≥ {MIN_RATING.toFixed(1)}</strong> are eligible.</p>
      </section>

      {/* Eligibility notice */}
      <div className="eligibility-notice">
        🏆 Showing <strong>{eligibleTutors.length}</strong> eligible tutor{eligibleTutors.length !== 1 ? 's' : ''} out of {mockTutors.length} total.
      </div>

      {/* Success banner */}
      {success && (
        <div className="success-banner">
          ✅ Certificate successfully sent to <strong>{eligibleTutors.find(t => t.id === success)?.name}</strong>!
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
                <th>Tutor ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Total Hours</th>
                <th>Overall Rating</th>
                <th>Certificate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {eligibleTutors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', color: 'var(--text-grey)' }}>
                    No tutors meet the eligibility criteria yet.
                  </td>
                </tr>
              ) : (
                eligibleTutors.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tutorId}</td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.program}</td>
                    <td>{t.totalHours} hrs</td>
                    <td>{t.overallRating.toFixed(1)}</td>
                    <td>
                      {issued[t.id] ? (
                        <span className="cert-badge issued">🏆 Issued</span>
                      ) : (
                        <span className="cert-badge not-issued">⏳ Not Issued</span>
                      )}
                    </td>
                    <td>
                      {issued[t.id] ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-grey)' }}>Already sent</span>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => setModal(t)}
                        >
                          🏆 Send Certificate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Certificate to {modal.name}?</h3>
            <p>
              This will issue an official completion certificate to <strong>{modal.name}</strong> ({modal.email}) for completing{' '}
              <strong>{modal.totalHours} hours</strong> of tutoring with an overall rating of{' '}
              <strong>{modal.overallRating.toFixed(1)}</strong>.
            </p>

            <div style={{ background: '#f0f7fc', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-grey)', marginBottom: '0.5rem' }}>
              📧 Certificate will be sent to: <strong>{modal.email}</strong>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleSend(modal)}>
                Confirm &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
