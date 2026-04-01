import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

// Shared mock data – also imported by TutorProfilePage & CertificatesPage
export const mockTutors = [
  {
    id: 1,
    tutorId: 'T2021001',
    name: 'Jayson Partido',
    program: 'BS Computer Science',
    sessionsCompleted: 62,
    totalHours: 58,
    overallRating: 4.9,
    email: 'jayson.partido@umak.edu.ph',
    phone: '09171234567',
    status: 'Active',
    certIssued: false,
  },
  {
    id: 2,
    tutorId: 'T2021002',
    name: 'Jane Doe',
    program: 'BS Mathematics',
    sessionsCompleted: 55,
    totalHours: 52,
    overallRating: 4.7,
    email: 'jane.doe@umak.edu.ph',
    phone: '09189876543',
    status: 'Active',
    certIssued: true,
  },
  {
    id: 3,
    tutorId: 'T2021003',
    name: 'Robert Smith',
    program: 'BS Information Technology',
    sessionsCompleted: 38,
    totalHours: 35,
    overallRating: 4.5,
    email: 'robert.smith@umak.edu.ph',
    phone: '09221112222',
    status: 'Active',
    certIssued: false,
  },
  {
    id: 4,
    tutorId: 'T2021004',
    name: 'Ana Rivera',
    program: 'BS Civil Engineering',
    sessionsCompleted: 70,
    totalHours: 65,
    overallRating: 3.8,
    email: 'ana.rivera@umak.edu.ph',
    phone: '09334445555',
    status: 'Active',
    certIssued: false,
  },
  {
    id: 5,
    tutorId: 'T2021005',
    name: 'Mark Tan',
    program: 'BA English',
    sessionsCompleted: 28,
    totalHours: 25,
    overallRating: 4.6,
    email: 'mark.tan@umak.edu.ph',
    phone: '09176667788',
    status: 'On Leave',
    certIssued: false,
  },
];

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function TutorsPage() {
  return (
    <DashboardLayout title="Tutors">
      <section className="welcome-section">
        <h2>Tutor Overview</h2>
        <p>View tutor profiles, session counts, hours, and performance ratings.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Tutors ({mockTutors.length})</div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tutor ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Sessions Done</th>
                <th>Total Hours</th>
                <th>Overall Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockTutors.map((t) => (
                <tr key={t.id}>
                  <td>{t.tutorId}</td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td>{t.program}</td>
                  <td>{t.sessionsCompleted}</td>
                  <td>{t.totalHours} hrs</td>
                  <td>
                    <span className="stars">{renderStars(t.overallRating)}</span>{' '}
                    {t.overallRating.toFixed(1)}
                  </td>
                  <td className={t.status === 'Active' ? 'status-green' : 'status-orange'}>{t.status}</td>
                  <td>
                    <Link to={`/tutors/${t.id}`} className="btn btn-outline">View Profile</Link>
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
