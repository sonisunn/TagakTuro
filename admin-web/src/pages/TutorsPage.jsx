import DashboardLayout from '../components/DashboardLayout';

export default function TutorsPage() {
  const mockTutors = [
    { id: 1, tutorId: 'T2021001', name: 'Jayson Partido', program: 'BS Computer Science', rating: '4.8', status: 'Active' },
    { id: 2, tutorId: 'T2021002', name: 'Jane Doe', program: 'BS Mathematics', rating: '4.9', status: 'Active' },
    { id: 3, tutorId: 'T2021003', name: 'Robert Smith', program: 'BS Information Technology', rating: '4.5', status: 'On Leave' },
  ];

  return (
    <DashboardLayout title="Tutors">
      <section className="welcome-section">
        <h2>Tutor Management</h2>
        <p>View and manage approved tutors in the system.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">Approved Tutors ({mockTutors.length})</div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tutor ID</th>
                <th>Name</th>
                <th>Program / Specialization</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTutors.map((t, idx) => (
                <tr key={`tutor-${idx}`}>
                  <td>{t.tutorId}</td>
                  <td>{t.name}</td>
                  <td>{t.program}</td>
                  <td>{t.rating}</td>
                  <td className={t.status === 'Active' ? 'status-green' : ''}>{t.status}</td>
                  <td><a href="#" style={{color: 'var(--primary-blue)'}}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
