import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Activity, LayoutDashboard, Building2, LayoutGrid } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <span>Queue<strong>Ease</strong></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            About
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className={isActive('/dashboard') ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>

              {/* Show Clinic Dashboard link only for clinic admins */}
              {user.role === 'clinic_admin' ? (
                <Link
                  to="/clinic-dashboard"
                  className={`clinic-dash-link ${isActive('/clinic-dashboard') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutGrid size={14} />
                  My Clinic
                </Link>
              ) : (
                <Link
                  to="/register-clinic"
                  className={`btn-outline ${isActive('/register-clinic') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Building2 size={14} />
                  Register Clinic
                </Link>
              )}

              <button className="btn-logout" onClick={handleLogout}>
                <LogOut size={14} />
                Logout
              </button>

              <div className="user-chip">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div className="user-chip-info">
                  <span>{user.name.split(' ')[0]}</span>
                  {user.role === 'clinic_admin' && <small>Clinic Admin</small>}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-plain" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn-nav-cta" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}