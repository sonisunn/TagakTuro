import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AttachmentModal from '../components/AttachmentModal';
import { useAuth } from '../context/AuthContext';
import { sortByDateWithPriority, formatDateDisplay } from '../utils/dateUtils';

export default function ApplicationsPage() {
  const { authFetch } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/tutor/applications');
      if (res?.ok) {
        const data = await res.json();
        setApplications(data);
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [authFetch]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this application?')) return;
    try {
      const res = await authFetch(`/api/tutor/applications/${id}/accept`, {
        method: 'POST',
      });
      if (res?.ok) {
        alert('Application approved successfully');
        fetchApplications();
      } else {
        alert('Failed to approve application');
      }
    } catch (err) {
      console.error("Error approving application:", err);
      alert('An error occurred');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    try {
      const res = await authFetch(`/api/tutor/applications/${id}/reject`, {
        method: 'POST',
      });
      if (res?.ok) {
        alert('Application rejected successfully');
        fetchApplications();
      } else {
        alert('Failed to reject application');
      }
    } catch (err) {
      console.error("Error rejecting application:", err);
      alert('An error occurred');
    }
  };

  const handleViewAttachments = (applicant) => {
    setSelectedApplicant(applicant);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedApplicant(null);
  };

  const getDisplayedApplications = () => {
    const filtered = applications.filter(app => app.status === 'PENDING');
    return sortByDateWithPriority(filtered, 'createdAt', 'past');
  };

  const displayedApplications = getDisplayedApplications();

  return (
    <DashboardLayout title="Applications">
      <section className="welcome-section">
        <h2>Tutor Applications</h2>
        <p>Review and approve new applications to become a tutor.</p>
      </section>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">
            Pending Applications ({loading ? '...' : displayedApplications.length})
          </div>
          {/* <div className="table-filters">
            <span style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>Pending</span>
          </div> */}
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date Applied</th>
                <th>Applicant Name</th>
                <th>Course / Program</th>
                <th>Experience</th>
                <th>Attachments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading applications...</td>
                </tr>
              ) : displayedApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No applications found.</td>
                </tr>
              ) : (
                displayedApplications.map((app) => (
                  <tr key={`app-${app.id}`}>
                    <td>{formatDateDisplay(app.createdAt)}</td>
                    <td>{app.name}</td>
                    <td>{app.courseProgram}</td>
                    <td title={app.experience} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.experience}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewAttachments(app)}
                        style={{
                          background: 'var(--primary-blue)',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        View Attachments
                      </button>
                    </td>
                    <td>
                      {app.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApprove(app.id)}
                            style={{background: 'var(--status-green)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px'}}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(app.id)}
                            style={{background: '#f87171', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {app.status !== 'PENDING' && (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AttachmentModal 
        isOpen={modalOpen}
        onClose={handleCloseModal}
        application={selectedApplicant}
      />
    </DashboardLayout>
  );
}
