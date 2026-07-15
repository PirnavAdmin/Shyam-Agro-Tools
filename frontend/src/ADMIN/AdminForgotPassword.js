import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './AdminForgotPassword.css';

const ADMIN_AUTH_API = "http://shyamagrotools.com/api/Auth";
const HEADERS  = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

const AdminForgotPassword = () => {
  const [email, setEmail]                     = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your registered admin email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      // ForgotPasswordDto only accepts { email }
      const response = await axios.post(
        `${ADMIN_AUTH_API}/forgot-password`,
        { email: email.trim() },
        { headers: HEADERS }
      );

      if (response.status === 200 || response.data?.success !== false) {
        // Pass newPassword in state so OTP screen can call /reset-password
        navigate('/admin/verify-otp', { state: { email: email.trim(), newPassword, confirmPassword } });
      } else {
        setError(response.data?.message || 'Request failed. Please try again.');
      }
    } catch (err) {
      console.error('Forgot Password Error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-forgot-wrapper">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="admin-forgot-modal-container"
      >
        {/* Left Side - Image */}
        <div className="admin-forgot-left">
          <img src="/popup-bg.png" alt="Admin Portal" />
        </div>

        {/* Right Side - Form */}
        <div className="admin-forgot-right">
          <div className="admin-logo-mini">
            <img src="/logo.svg" alt="Shyam Agro Tools logo" />
          </div>

          <h2>RESET PASSWORD</h2>
          <p>Enter your registered admin email and set a new password.</p>

          {error && (
            <div style={{
              color: '#e53e3e', fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
              maxWidth: '300px', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="admin-form-container">
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                className="admin-premium-input"
                placeholder="ENTER ADMIN EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="ENTER NEW PASSWORD"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="CONFIRM NEW PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="admin-premium-btn"
                disabled={isLoading}
              >
                {isLoading ? 'PROCESSING...' : 'UPDATE PASSWORD'}
              </motion.button>
            </form>

            <div className="admin-footer-links">
              <span onClick={() => navigate('/admin/login')}>BACK TO LOGIN</span>
              <span>•</span>
              <span onClick={() => navigate('/contact-support')}>CONTACT SUPPORT</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminForgotPassword;
