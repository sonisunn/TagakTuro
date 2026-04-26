import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function StudentsPage() {
  const { authFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/student');
        if (res?.ok) {
          const data = await res.json();
          setStudents(data);
        } else {
          setError('Failed to load students data');
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [authFetch]);

  return (
    <DashboardLayout title="Students">
      <section className="welcome-section">
        <h2>Student Management</h2>
        <p>View and manage all registered students in the system.</p>
      </section>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Registered Students ({loading ? '...' : students.length})</div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course / Program</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No students found.</td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={`student-${s.id || idx}`}>
                    <td>{s.studentId}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.courseProgram || 'N/A'}</td>
                    {/* The backend Student model doesn't store 'active/inactive' status, let's default to active mune */}
                    {/* fix later */}
                    <td className="status-green">Active</td>
                    <td><Link to={`/students/${s.id}`} className="table-view-link">View</Link></td>
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
