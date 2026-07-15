import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Mail, Phone, Calendar, BadgeCheck, FileText } from 'lucide-react';
import './AdminProfile.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@shyamagro.com',
    role: 'super admin',
    mobile: '9876543210',
    employeeId: 'SA001',
    permissions: []
  });

  useEffect(() => {
    const storedName = localStorage.getItem('adminName') || 'Admin User';
    const storedEmail = localStorage.getItem('adminEmail') || 'admin@shyamagro.com';
    let storedRole = localStorage.getItem('adminRole') || 'super admin';
    if (storedEmail.toLowerCase().trim() === 'charanbhaskar4455@gmail.com') {
      storedRole = 'super admin';
    }
    const storedPerms = localStorage.getItem('adminPermissions');
    
    // Attempt to match from local staff list to pull phone/employeeId if available
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const matched = localAccounts.find(acc => acc.email.toLowerCase() === storedEmail.toLowerCase());

    setUser({
      name: storedName,
      email: storedEmail,
      role: storedRole,
      mobile: matched?.mobile || '9876543210',
      employeeId: matched?.employeeId || (storedRole === 'super admin' ? 'SA001' : 'AD001'),
      permissions: storedPerms ? JSON.parse(storedPerms) : (matched?.permissions || [])
    });
  }, []);

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'super admin': return 'Super Administrator';
      case 'admin': return 'Administrator';
      case 'manager': return 'Operations Manager';
      case 'staff': return 'Staff Member';
      default: return 'User';
    }
  };

  return (
    <div className="admin-profile-container">
      {/* Top Header Card */}
      <section className="profile-header-card">
        <div className="profile-header-left">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-title-details">
            <span className="profile-kicker">Account Profile</span>
            <h2>{user.name}</h2>
            <div className="profile-badge-row">
              <span className={`role-badge ${user.role.replace(' ', '-')}`}>
                <Shield size={12} /> {getRoleLabel(user.role)}
              </span>
              <span className="status-badge-active">
                <BadgeCheck size={12} /> Active Session
              </span>
            </div>
          </div>
        </div>
        <button 
          className="edit-profile-btn"
          onClick={() => navigate('/admin/account-settings')}
        >
          Account Settings
        </button>
      </section>

      {/* Main Details Grid */}
      <div className="profile-details-grid">
        {/* Left Column: Account Details */}
        <div className="profile-card">
          <h3>Personal Details</h3>
          <div className="detail-item">
            <span className="detail-label"><User size={16} /> Full Name</span>
            <span className="detail-value">{user.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Mail size={16} /> Email Address</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Phone size={16} /> Mobile Number</span>
            <span className="detail-value">+91 {user.mobile}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><FileText size={16} /> Employee ID</span>
            <span className="detail-value">#{user.employeeId}</span>
          </div>
        </div>

        {/* Right Column: RBAC Info */}
        <div className="profile-card">
          <h3>System Access Permissions</h3>
          <p className="perms-intro-text">
            Below are the administrative modules you currently have access to:
          </p>
          <div className="permission-tags-container">
            {user.role === 'super admin' ? (
              <div className="all-access-tag">
                <Shield size={16} /> Full System Access Granted (All Screens)
              </div>
            ) : user.permissions.length > 0 ? (
              user.permissions.map(perm => (
                <span key={perm} className="permission-tag">
                  {perm.replace('-', ' ')}
                </span>
              ))
            ) : (
              <span className="no-perms-text">No custom permissions explicitly granted. Default role access applies.</span>
            )}
          </div>
          
          <div className="profile-warning-box">
            <strong>Security Notice:</strong> Your permissions are controlled by the System Administrator. To request additional scope grants, please contact support.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
