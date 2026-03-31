import { useState } from 'react';
import CcedLayout from '../../components/CcedLayout';
import { mockTutors } from './TutorsPage';

const MIN_HOURS  = 50;
const MIN_RATING = 4.0;

const eligibleTutors = mockTutors.filter(
  (t) => t.totalHours >= MIN_HOURS && t.overallRating >= MIN_RATING
);

function renderStars(r) {
  const full = Math.floor(r), half = r - full >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function CcedCertificatesPage() {
  const [issued, setIssued] = useState(
    () => Object.fromEntries(eligibleTutors.map((t) => [t.id, t.certIssued]))
  );
  const [modal, setModal]   = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSend = (tutor) => {
    setIssued((prev) => ({ ...prev, [tutor.id]: true }));
    setModal(null);
    setSuccess(tutor.id);
    setTimeout(() => setSuccess(null), 4000);
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

      <div className="eligibility-notice">
        Showing <strong>{eligibleTutors.length}</strong> eligible tutor{eligibleTutors.length !== 1 ? 's' : ''} out of {mockTutors.length} total.
      </div>

      {success && (
        <div className="success-banner">
          Certificate sent to <strong>{eligibleTutors.find(t => t.id === success)?.name}</strong>!
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
                <th>Tutor ID</th><th>Name</th><th>Program</th>
                <th>Total Hours</th><th>Overall Rating</th><th>Certificate</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {eligibleTutors.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', color: 'var(--text-grey)' }}>No eligible tutors yet.</td></tr>
              ) : (
                eligibleTutors.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tutorId}</td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.program}</td>
                    <td>{t.totalHours} hrs</td>
                    <td><span className="stars">{renderStars(t.overallRating)}</span> {t.overallRating.toFixed(1)}</td>
                    <td>
                      {issued[t.id]
                        ? <span className="cert-badge issued">Issued</span>
                        : <span className="cert-badge not-issued">Not Issued</span>}
                    </td>
                    <td>
                      {issued[t.id]
                        ? <span style={{ fontSize: '13px', color: 'var(--text-grey)' }}>Already sent</span>
                        : <button className="btn btn-success" onClick={() => setModal(t)}>Send Certificate</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Certificate to {modal.name}?</h3>
            <p>
              This will issue an official completion certificate to <strong>{modal.name}</strong> ({modal.email}) for{' '}
              <strong>{modal.totalHours} hours</strong> of tutoring with a rating of{' '}
              <strong>{modal.overallRating.toFixed(1)}</strong>.
            </p>
            <div style={{ background: '#f0f7fc', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '14px', color: 'var(--text-grey)', marginBottom: '0.5rem' }}>
              Will be sent to: <strong>{modal.email}</strong>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleSend(modal)}>Confirm &amp; Send</button>
            </div>
          </div>
        </div>
      )}
    </CcedLayout>
  );
}
