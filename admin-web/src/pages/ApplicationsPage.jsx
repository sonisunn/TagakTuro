import DashboardLayout from '../components/DashboardLayout';

export default function ApplicationsPage() {
  const mockApplications = [
    { id: 1, date: 'Mar 18, 2026', applicant: 'Alice Johnson', program: 'BS Biology', status: 'Pending Review' },
    { id: 2, date: 'Mar 17, 2026', applicant: 'Bob Smith', program: 'BS Accountancy', status: 'Pending Review' },
    { id: 3, date: 'Mar 15, 2026', applicant: 'Charlie Brown', program: 'BS Information Technology', status: 'Rejected' },
  ];

  return (
    <DashboardLayout title="Applications">
      <section className="welcome-section">
        <h2>Tutor Applications</h2>
        <p>Review and approve new applications to become a tutor.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Pending Applications ({mockApplications.filter(a => a.status === 'Pending Review').length})</div>
          <div className="table-filters">
            <span>Pending</span> <span className="light">| All</span>
          </div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date Applied</th>
                <th>Applicant Name</th>
                <th>Course / Program</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockApplications.map((app, idx) => (
                <tr key={`app-${idx}`}>
                  <td>{app.date}</td>
                  <td>{app.applicant}</td>
                  <td>{app.program}</td>
                  <td>{app.status}</td>
                  <td>
                    <button style={{background: 'var(--status-green)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px'}}>Approve</button>
                    <button style={{background: '#f87171', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
