import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Key, MapPin } from 'lucide-react';
import { Toast } from '../components/Toast';
import './AdminAccountSettings.css';

const AdminAccountSettings = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const storedName = localStorage.getItem('adminName') || 'Admin User';
    const storedEmail = localStorage.getItem('adminEmail') || 'admin@shyamagro.com';
    const storedRole = localStorage.getItem('adminRole') || 'admin';
    const storedAddress = localStorage.getItem('adminAddress') || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401';
    
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const matched = localAccounts.find(acc => acc.email.toLowerCase() === storedEmail.toLowerCase());

    setFormData(prev => ({
      ...prev,
      name: storedName,
      email: storedEmail,
      mobile: matched?.mobile || '9912649265',
      address: storedAddress || matched?.address || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401'
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    let errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address';
    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile) errs.mobile = 'Mobile number is required';
    else if (cleanMobile.length !== 10) errs.mobile = 'Must be exactly 10 digits';
    else if (!/^[6-9]\d{9}$/.test(cleanMobile)) errs.mobile = 'Must start with 6, 7, 8, or 9';
    if (!formData.address.trim()) errs.address = 'Address is required';

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        errs.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setToastMessage('Please fix validation errors');
      setToastType('warning');
      return;
    }

    // Role cannot be edited by the user themselves in self settings
    const role = localStorage.getItem('adminRole') || 'admin';

    setIsSaving(true);
    try {
      // 1. Update general localStorage
      localStorage.setItem('adminName', formData.name.trim());
      localStorage.setItem('adminEmail', formData.email.trim());
      localStorage.setItem('adminAddress', formData.address.trim());
      
      // 2. Update within added_staff_accounts if it is a staff account
      const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
      const index = localAccounts.findIndex(acc => acc.email.toLowerCase() === formData.email.toLowerCase());
      
      if (index > -1) {
        const updatedUser = {
          ...localAccounts[index],
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          mobile: formData.mobile.trim(),
          address: formData.address.trim()
        };
        if (formData.newPassword) {
          updatedUser.password = formData.newPassword;
        }
        localAccounts[index] = updatedUser;
        localStorage.setItem('added_staff_accounts', JSON.stringify(localAccounts));
      } else if (role !== 'super admin') {
        // If not found in local accounts but is admin/manager/staff, create record so details persist
        const newRecord = {
          id: `AD-${Date.now().toString().slice(-4)}`,
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email.toLowerCase().trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          role: role,
          permissions: JSON.parse(localStorage.getItem('adminPermissions') || '[]')
        };
        if (formData.newPassword) {
          newRecord.password = formData.newPassword;
        }
        localAccounts.push(newRecord);
        localStorage.setItem('added_staff_accounts', JSON.stringify(localAccounts));
      }

      setToastMessage('Account settings updated successfully.');
      setToastType('success');
      
      setTimeout(() => {
        setIsSaving(false);
        navigate('/admin/profile');
      }, 1000);
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to update account settings.');
      setToastType('error');
      setIsSaving(false);
    }
  };

  return (
    <div className="account-settings-container">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header Panel */}
      <section className="settings-header-row">
        <div className="settings-header-left">
          <button className="back-btn" onClick={() => navigate('/admin/profile')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="settings-kicker">Account Manager</span>
            <h2>Account Settings</h2>
          </div>
        </div>
      </section>

      {/* Settings Form Layout */}
      <div className="settings-form-card">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Credentials */}
          <div className="form-section">
            <h3 className="section-title"><User size={16} /> Profile Details</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-field">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label>Mobile Number</label>
                <div className="mobile-input-wrap">
                  <span className="mobile-prefix">+91</span>
                  <input 
                    type="text" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <span className="field-error">{errors.mobile}</span>}
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> Address
                </label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="Enter full address, town/taluk, district, pin code"
                  rows={2}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Security Credentials */}
          <div className="form-section pt-4">
            <h3 className="section-title"><Key size={16} /> Change Account Password</h3>
            <p className="section-subtitle">Leave password fields blank if you do not wish to change your password.</p>
            
            <div className="form-grid">
              <div className="form-field">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={formData.newPassword} 
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
              </div>

              <div className="form-field">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="form-actions-footer">
            <button type="button" className="cancel-btn" onClick={() => navigate('/admin/profile')}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAccountSettings;
