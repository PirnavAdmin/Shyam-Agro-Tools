import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  User, 
  Settings, 
  LogOut
} from 'lucide-react';
import NotificationsDropdown from './components/NotificationsDropdown';
import './AdminTopBar.css';

const AdminTopBar = () => {
  const navigate = useNavigate();
  
  // Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Read actual admin login details
  const [adminEmail, setAdminEmail] = useState('admin@shyamagro.com');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const storedEmail = localStorage.getItem('adminEmail');
    const storedName = localStorage.getItem('adminName');
    if (storedEmail) setAdminEmail(storedEmail);
    if (storedName) setAdminName(storedName);
  }, []);
  
  // Refs for click outside detection
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    const apiVersion = localStorage.getItem('authApiVersion');
    
    if (apiVersion === 'new' && token) {
      try {
        console.log("Calling new API logout...");
        await fetch('https://satin-eastcoast-musky.ngrok-free.dev/api/Auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }
    }

    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminPermissions');
    localStorage.removeItem('authApiVersion');
    
    navigate('/admin/login');
  };

  return (
    <div className="stroyka-topbar">
      {/* Left: Project Brand */}
      <div className="topbar-left">
        <div className="topbar-brand">
          <img
            src="/logo.png"
            alt="SAT Logo"
            className="topbar-brand-logo"
          />
          <div className="topbar-brand-text">
            <span className="topbar-brand-name">Shyam Agro Tools</span>
            <span className="topbar-brand-sub">Admin Control Panel</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        
        {/* Notifications Bell with Dropdown */}
        <NotificationsDropdown />

        {/* User Profile dropdown */}
        <div className="topbar-user-profile" ref={profileRef}>
          <div 
            className="user-profile-btn" 
            onClick={() => { 
              setIsProfileOpen(!isProfileOpen); 
            }} 
            title="Profile details"
          >
            <div className="user-avatar-initial">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="user-text">
              <span className="user-name">{adminName}</span>
              <span className="user-email">{adminEmail}</span>
            </div>
            <ChevronDown size={12} className={`chevron-arrow ${isProfileOpen ? 'rotate' : ''} text-gray-500`} />
          </div>

          {isProfileOpen && (
            <div className="topbar-dropdown-menu profile-dropdown">
              <div className="profile-dropdown-header">
                <strong>{adminName}</strong>
                <span>System Administrator</span>
              </div>
              <div className="profile-dropdown-list">
                <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); navigate('/admin/profile'); }}>
                  <User size={15} />
                  <span>My Profile</span>
                </button>
                <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); navigate('/admin/account-settings'); }}>
                  <Settings size={15} />
                  <span>Account Settings</span>
                </button>
                <div className="profile-divider"></div>
                <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;

