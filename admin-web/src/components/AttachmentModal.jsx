import { useEffect, useState } from 'react';
import '../styles/modal.css';

export default function AttachmentModal({ isOpen, onClose, application }) {
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

  const handleViewFile = (attachment) => {
    // Use the backend endpoint to download the file
    const url = `/api/tutor/applications/${attachment.id}/download?fileType=${attachment.type}`;
    window.open(url, '_blank');
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
