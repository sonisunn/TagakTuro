import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CcedLayout({ children, title }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar cced-sidebar${sidebarOpen ? ' open' : ''}`} id="cced-sidebar">
        <div className="sidebar-header cced-sidebar-header">
          <div className="sidebar-brand cced-sidebar-brand">
            <h2>TagakTuro</h2>
            <span>CCED Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav cced-sidebar-nav">
          <div className="nav-section-title cced-nav-section-title">Main</div>
          <Link to="/cced/dashboard" className={`nav-link cced-nav-link ${pathname === '/cced/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/cced/bookings" className={`nav-link cced-nav-link ${pathname === '/cced/bookings' ? 'active' : ''}`}>
            Bookings
          </Link>
          <Link to="/cced/tutors" className={`nav-link cced-nav-link ${pathname.startsWith('/cced/tutors') ? 'active' : ''}`}>
            Tutors
          </Link>

          <div className="nav-section-title cced-nav-section-title">Reports</div>
          {/* <Link to="/cced/evaluations" className={`nav-link ${pathname === '/cced/evaluations' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Evaluations 
          </Link>  */}
          <Link to="/cced/certificates" className={`nav-link cced-nav-link ${pathname === '/cced/certificates' ? 'active' : ''}`}>
            Certificate
          </Link>
        </nav>

        <div className="sidebar-footer cced-sidebar-footer">
          <a href="#" className="nav-link cced-nav-link" onClick={(e) => { e.preventDefault(); logout(); }}>
            Sign Out
          </a>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h1 className="page-title">{title || 'Dashboard'}</h1>
          </div>
          <div className="header-right">
            <span className="header-date">{formattedDate}</span>
            <div className="admin-badge">
              <div className="admin-avatar">C</div>
              <span>{user?.name || 'CCED'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
