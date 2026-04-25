import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Megaphone, Settings, Search, Bell, Palette, LogOut, Users } from 'lucide-react';
import './Layout.css';

const Layout = ({ setAuth }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('chemsroot_auth');
    setAuth(false);
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Activity size={28} />
          <span>Chemsroot Ads</span>
        </div>
        
        <div className="sidebar-nav-container">
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                <LayoutDashboard size={20} />
                Overview
              </NavLink>
            </li>
            <li>
              <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Megaphone size={20} />
                Campaign Auto
              </NavLink>
            </li>
            <li>
              <NavLink to="/creative" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Palette size={20} />
                Creative Studio
              </NavLink>
            </li>
            <li>
              <NavLink to="/leads" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Users size={20} />
                Incoming Leads
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Settings size={20} />
                Settings
              </NavLink>
            </li>
          </ul>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="nav-item logout-btn">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" placeholder="Search campaigns, analytics..." />
          </div>
          
          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <span className="subtitle">Admin</span>
              <div className="avatar">C</div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
