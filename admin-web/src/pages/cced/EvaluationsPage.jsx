import CcedLayout from '../../components/CcedLayout';

const allEvaluations = [
  { tutor: 'Jayson Partido', reviewer: 'Christian Baldesco', date: 'Mar 10, 2026', rating: 5.0, comment: 'Very patient and knowledgeable!' },
  { tutor: 'Jayson Partido', reviewer: 'Leo Ramos',          date: 'Mar 12, 2026', rating: 4.8, comment: 'Explains concepts clearly.'       },
  { tutor: 'Jayson Partido', reviewer: 'Ana Reyes',          date: 'Mar 15, 2026', rating: 5.0, comment: 'Best tutor I have ever had!'      },
  { tutor: 'Jane Doe',       reviewer: 'Maria Santos',       date: 'Mar 11, 2026', rating: 4.7, comment: 'Great session, very helpful.'     },
  { tutor: 'Jane Doe',       reviewer: 'Carlo Santos',       date: 'Mar 14, 2026', rating: 4.7, comment: 'Clear explanations, highly recommended.' },
  { tutor: 'Robert Smith',   reviewer: 'John Doe',           date: 'Mar 9, 2026',  rating: 4.5, comment: 'Good session overall.'            },
  { tutor: 'Robert Smith',   reviewer: 'Ben Cruz',           date: 'Mar 13, 2026', rating: 4.5, comment: 'Helpful but a bit rushed.'        },
  { tutor: 'Ana Rivera',     reviewer: 'Pia Dela Cruz',      date: 'Mar 8, 2026',  rating: 3.8, comment: 'Decent but needs improvement.'    },
  { tutor: 'Mark Tan',       reviewer: 'Ben Cruz',           date: 'Mar 5, 2026',  rating: 4.6, comment: 'Very engaging and fun session.'   },
];

function renderStars(r) {
  const full = Math.floor(r), half = r - full >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function CcedEvaluationsPage() {
  return (
    <CcedLayout title="Evaluations">
      <section className="welcome-section">
        <h2>Tutor Evaluations</h2>
        <p>All student reviews and ratings given to tutors.</p>
      </section>

      <section className="table-section">
        <div className="table-header-row">
          <div className="table-title">All Reviews ({allEvaluations.length})</div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Tutor</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comment</th></tr>
            </thead>
            <tbody>
              {allEvaluations.map((ev, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{ev.tutor}</td>
                  <td>{ev.reviewer}</td>
                  <td>{ev.date}</td>
                  <td><span className="stars">{renderStars(ev.rating)}</span> {ev.rating.toFixed(1)}</td>
                  <td style={{ textAlign: 'left', maxWidth: '280px' }}>{ev.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </CcedLayout>
  );
}
