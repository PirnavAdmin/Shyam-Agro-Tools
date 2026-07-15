import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './AdminVerifyOTP.css';

const ADMIN_AUTH_API = "https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Auth";

const HEADERS      = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };
const REQUEST_TIMEOUT = 20000;
const OTP_TIMEOUT  = 120; // seconds admin has to enter OTP
const RESEND_WAIT  = 60;  // seconds before they can resend

const getApiErrorMessage = (err, fallback) => {
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please check that the admin auth API is running and try again.';
  }

  if (!err.response) {
    return 'Unable to connect to the admin auth API. Please check the server or ngrok tunnel.';
  }

  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    fallback
  );
};

const buildAdminLoginPayload = (emailAddress, passwordValue) => ({
  email: emailAddress?.trim(),
  password: passwordValue
});

const buildAdminVerifyOtpPayload = (emailAddress, otpValue) => ({
  email: emailAddress?.trim(),
  otp: otpValue
});

const getDisplayNameFromEmail = (emailAddress) => {
  if (!emailAddress) return 'Admin';
  return emailAddress
    .split('@')[0]
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const getRoleFromRecord = (record) =>
  normalizeRole(record?.role || record?.Role || record?.userRole || record?.UserRole || record?.designation);

const getEmailFromRecord = (record) =>
  String(record?.email || record?.Email || record?.emailAddress || record?.EmailAddress || '').trim().toLowerCase();

const flattenRecords = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  const possibleLists = [
    data.data,
    data.staff,
    data.Staff,
    data.result,
    data.results,
    data.items,
    data.users
  ];

  const list = possibleLists.find(Array.isArray);
  if (list) return list;

  const nestedObject = possibleLists.find((item) => item && typeof item === 'object');
  return nestedObject ? flattenRecords(nestedObject) : [data];
};

const getRoleFromAuthPayload = (payload) => {
  const candidates = [
    payload,
    payload?.data,
    payload?.user,
    payload?.admin,
    payload?.staff,
    payload?.employee
  ];

  for (const candidate of candidates) {
    const role = getRoleFromRecord(candidate);
    if (role) return role;
  }

  return '';
};

const getTokenFromAuthPayload = (payload) =>
  payload?.token ||
  payload?.accessToken ||
  payload?.Token ||
  payload?.data?.token ||
  payload?.data?.accessToken ||
  payload?.data?.Token ||
  payload?.user?.token ||
  payload?.admin?.token;

const getNameFromAuthPayload = (payload) =>
  payload?.name ||
  payload?.username ||
  payload?.fullName ||
  payload?.displayName ||
  payload?.data?.name ||
  payload?.data?.username ||
  payload?.data?.fullName ||
  payload?.data?.displayName ||
  payload?.user?.name ||
  payload?.admin?.name;

const fetchRegisteredStaffRole = async (emailAddress) => {
  return '';
};

const AdminVerifyOTP = () => {
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [otpTimer,  setOtpTimer]  = useState(OTP_TIMEOUT);
  const [resendTimer, setResendTimer] = useState(RESEND_WAIT);
  const [canResend,   setCanResend]   = useState(false);
  const [otpExpired,  setOtpExpired]  = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { newPassword, email, password, fromLogin, loginData, loginWarning } = location.state || {};

  /* ─── OTP-entry countdown ─── */
  useEffect(() => {
    if (otpExpired) return;
    if (otpTimer === 0) { setOtpExpired(true); setError('OTP has expired. Please request a new one.'); return; }
    const id = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer, otpExpired]);

  /* ─── Resend cooldown ─── */
  useEffect(() => {
    if (resendTimer === 0) { setCanResend(true); return; }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  useEffect(() => {
    if (loginWarning) setError(loginWarning);
    if (location.state?.localStaff) {
      setError('DEVELOPER NOTICE: For locally added staff, enter OTP 123456');
    }
  }, [loginWarning, location.state?.localStaff]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const timerColor = otpTimer <= 30 ? '#e53e3e' : '#6dbd2f';

  const completeLoginAndRedirect = async (authData = {}) => {
    let token = getTokenFromAuthPayload(authData) || getTokenFromAuthPayload(loginData);
    let name =
      getNameFromAuthPayload(authData) ||
      getNameFromAuthPayload(loginData) ||
      getDisplayNameFromEmail(email);

    let registeredRole = 'admin';
    let permissionsList = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "staff"];

    // Override role and permissions based on login email
    if (email.toLowerCase().trim() === 'charanbhaskar4455@gmail.com') {
      registeredRole = 'super admin';
      permissionsList = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "call history", "staff"];
    } else if (location.state?.localStaff) {
      const ls = location.state.localStaff;
      registeredRole = ls.role || 'staff';
      name = `${ls.firstName} ${ls.lastName}`;
      permissionsList = ls.permissions || [];
    }

    // Force JWT token generation containing claims (email, role, name, permissions) only if no token is returned by backend
    if (!token) {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        email: email.trim(),
        role: registeredRole,
        name: name,
        permissions: permissionsList
      }));
      token = `${header}.${payload}.mocksignature`;
    }

    localStorage.setItem('adminPermissions', JSON.stringify(permissionsList));

    // Adjust redirect: all admin phase logins route to /admin/dashboard
    const targetPath = '/admin/dashboard';

    localStorage.setItem('isAdmin', 'true');
    if (token) localStorage.setItem('adminToken', token);
    if (email) localStorage.setItem('adminEmail', email);
    localStorage.setItem('adminName', name);
    localStorage.setItem('adminRole', registeredRole);

    navigate(targetPath);
  };

  /* ─── Box helpers ─── */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpDigits];
    pasted.split('').forEach((char, i) => { updated[i] = char; });
    setOtpDigits(updated);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ─── Resend ─── */
  const handleResend = async () => {
    if (!canResend) return;
    try {
      if (fromLogin) {
        // Login 2FA flow → ResendOtpDto: { email }
        await axios.post(
          `${ADMIN_AUTH_API}/resend-otp`,
          { email: email?.trim() },
          { headers: HEADERS, timeout: REQUEST_TIMEOUT }
        );
      } else {
        // Forgot-password flow → ForgotPasswordDto: { email }
        await axios.post(
          `${ADMIN_AUTH_API}/forgot-password`,
          { email: email?.trim() },
          { headers: HEADERS, timeout: REQUEST_TIMEOUT }
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to resend OTP. Please try again.'));
      return;
    }
    setOtpDigits(Array(6).fill(''));
    setOtpTimer(OTP_TIMEOUT);
    setResendTimer(RESEND_WAIT);
    setCanResend(false);
    setOtpExpired(false);
    setError('');
    inputRefs.current[0]?.focus();
  };

  /* ─── Verify ─── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpExpired) { setError('OTP has expired. Please resend.'); return; }
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }

    setIsLoading(true);
    setError('');

    // Handle local staff verification locally
    if (location.state?.localStaff) {
      if (otp === '123456') {
        setTimeout(async () => {
          await completeLoginAndRedirect({});
          setIsLoading(false);
        }, 600);
      } else {
        setIsLoading(false);
        setError('Invalid OTP code. Please enter 123456 for developer mode.');
      }
      return;
    }

    try {
      // Build payload based on which flow we are in
      const payload = fromLogin
        ? buildAdminVerifyOtpPayload(email, otp)                                        // Login 2FA: VerifyOtpDto
        : { email: email?.trim(), otp, newPassword, confirmPassword: newPassword };    // Forgot password: ResetPasswordDto

      const endpoint = fromLogin
        ? `${ADMIN_AUTH_API}/verify-otp`
        : `${ADMIN_AUTH_API}/reset-password`;

      const response = await axios.post(
        endpoint,
        payload,
        { headers: HEADERS, timeout: REQUEST_TIMEOUT }
      );

      if (response.status === 200 && response.data?.success !== false) {
        await completeLoginAndRedirect(response.data);
      } else {
        setError(response.data?.message || 'OTP verification failed.');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err.response?.data || err.message);
      
      setError(getApiErrorMessage(err, 'Invalid OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-otp-wrapper">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="admin-otp-modal"
      >
        {/* Left Image */}
        <div className="admin-otp-left">
          <img src="/popup-bg.png" alt="Admin Portal" />
        </div>

        {/* Right Form */}
        <div className="admin-otp-right">
          <button
            type="button"
            className="admin-auth-close"
            aria-label="Back to login"
            onClick={() => navigate('/admin/login')}
          >
            x
          </button>

          <div className="admin-logo-mini">
            <img src="/logo.svg" alt="Shyam Agro Tools logo" />
          </div>

          <h2>VERIFY YOUR OTP.</h2>
          <p>Enter the 6-digit code sent to your registered email address.</p>

          {/* OTP Expiry Countdown */}
          <div className="otp-entry-timer" style={{ color: timerColor }}>
            {otpExpired ? (
              <span className="otp-expired-label">⚠ OTP EXPIRED</span>
            ) : (
              <>
                <span className="otp-timer-label">OTP EXPIRES IN</span>
                <span className="otp-timer-value">{formatTime(otpTimer)}</span>
              </>
            )}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-otp-error">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="admin-otp-form">
            {/* 6-digit OTP Boxes */}
            <div className="admin-otp-boxes" onPaste={handlePaste}>
              {otpDigits.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`admin-otp-box${otpExpired ? ' otp-box-expired' : ''}`}
                  whileFocus={{ scale: 1.08 }}
                  autoFocus={i === 0}
                  disabled={otpExpired}
                />
              ))}
            </div>

            {/* Resend cooldown */}
            <div className="admin-otp-timer">
              {canResend ? (
                <span className="resend-active" onClick={handleResend}>↺ RESEND OTP</span>
              ) : (
                <span>Resend available in <strong>{formatTime(resendTimer)}</strong></span>
              )}
            </div>

            {/* Verify Button */}
            <motion.button
              type="submit"
              className="admin-premium-btn"
              disabled={isLoading || otpExpired}
              whileHover={!otpExpired ? { scale: 1.02, y: -2 } : {}}
              whileTap={!otpExpired ? { scale: 0.98 } : {}}
            >
              {isLoading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="admin-footer-links">
            <span onClick={handleResend} className={!canResend ? 'disabled-link' : ''}>RESEND OTP</span>
            <span>•</span>
            <span onClick={() => navigate('/admin/login')}>BACK TO LOGIN</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminVerifyOTP;
