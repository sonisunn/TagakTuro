import DashboardLayout from '../components/DashboardLayout';

export default function StudentsPage() {
  const mockStudents = [
    { id: 1, studentId: 'S2021001', name: 'Christian Baldesco', program: 'BS Computer Science', status: 'Active' },
    { id: 2, studentId: 'S2021002', name: 'Maria Santos', program: 'BS Information Technology', status: 'Active' },
    { id: 3, studentId: 'S2021003', name: 'John Doe', program: 'BS Computer Science', status: 'Inactive' },
  ];

  return (
    <DashboardLayout title="Students">
      <section className="welcome-section">
        <h2>Student Management</h2>
        <p>View and manage all registered students in the system.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Registered Students ({mockStudents.length})</div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Course / Program</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((s, idx) => (
                <tr key={`student-${idx}`}>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.program}</td>
                  <td className={s.status === 'Active' ? 'status-green' : ''}>{s.status}</td>
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
