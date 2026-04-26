import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/modal.css';

export default function AttachmentModal({ isOpen, onClose, application }) {
  const { authFetch } = useAuth();
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (isOpen && application) {
      // Extract attachments from the application object
      const attachmentsList = [];
      
      if (application.reportOfGradesPath) {
        attachmentsList.push({
          filename: 'Report of Grades',
          type: 'report',
          id: application.id
        });
      }
      
      if (application.certificatesPath) {
        attachmentsList.push({
          filename: 'Certificates',
          type: 'certificate',
          id: application.id
        });
      }
      
      setAttachments(attachmentsList);
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const handleViewFile = async (attachment) => {
    try {
      const res = await authFetch(`/api/tutor/applications/${attachment.id}/download?fileType=${attachment.type}`);
      if (res && res.ok) {
        const blob = await res.blob();
        if (blob.size === 0) {
          alert('The file appears to be empty.');
          return;
        }
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      } else if (res) {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to load attachment: ${errorData.error || res.statusText || res.status}`);
      } else {
        alert('Failed to load attachment: Unauthorized or Session Expired');
      }
    } catch (err) {
      console.error('Error viewing attachment:', err);
      alert('An error occurred while loading the attachment');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-simple" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-simple">
          <h3>{application.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body-simple">
          {attachments.length === 0 ? (
            <div style={{ color: '#999', padding: '2rem', textAlign: 'center' }}>
              No files available
            </div>
          ) : (
            <div className="attachments-list-simple">
              {attachments.map((attachment, index) => (
                <div key={index} className="attachment-row-simple">
                  <div className="attachment-file-info-simple">
                    <span className="file-name">{attachment.filename}.pdf</span>
                  </div>
                  <button 
                    onClick={() => handleViewFile(attachment)}
                    className="btn-view-simple"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
