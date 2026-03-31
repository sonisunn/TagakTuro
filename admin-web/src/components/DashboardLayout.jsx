import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children, title }) {
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
      {/* Thin blue strip on the left like the mockup */}
      <div className="sidebar-minimal"></div>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2>TagakTuro</h2>
            <span>OVPSSCD Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          <Link to="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Dashboard
          </Link>
          <Link to="/students" className={`nav-link ${pathname === '/students' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Students
          </Link>
          <Link to="/tutors" className={`nav-link ${pathname === '/tutors' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Tutors
          </Link>

          <div className="nav-section-title">Management</div>
          <Link to="/applications" className={`nav-link ${pathname === '/applications' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Applications
          </Link>
          <Link to="/bookings" className={`nav-link ${pathname === '/bookings' ? 'active' : ''}`}>
            <span className="nav-icon"></span> Bookings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); logout(); }}>
            <span className="nav-icon"></span> Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h1 className="page-title">{title || 'Dashboard'}</h1>
          </div>
          <div className="header-right">
            <span className="header-date">{formattedDate}</span>
            <div className="admin-badge">
              <div className="admin-avatar">A</div>
              <span>{user?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
