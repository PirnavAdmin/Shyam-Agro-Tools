import { getApiDomain } from "../../utils/apiConfig";
import React, { useRef, useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import headerLogo from '../../asset/headerlogo-new.png';
import { isValidName, isValidMobileNumber } from '../../utils/validation';
import './LoginPopup.css';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

const getAuthApiBaseUrl = () => {
  return getApiDomain().replace(/\/$/, '');
};

const normalizeMobileNumber = (value) => {
  const digits = String(value || '').trim().replace(/\D/g, '');
  return digits.length > 10 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const LoginPopup = ({ isOpen, onClose, redirectTo }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'details'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [phone, setPhone] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otp, setOtp] = useState('');
  const [details, setDetails] = useState({ name: '', email: '' });
  const [loginApiData, setLoginApiData] = useState({
    success: false,
    isNewUser: false,
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestLock = useRef(false);

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timerId = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setPhone(value);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 4);

    setOtp(value);
  };

  const completeLogin = async (authData = {}) => {
    const normalizedPhone = normalizeMobileNumber(phone);
    const apiUser = authData.user || authData.data?.user || authData.data || {};
    const validToken = authData.token || authData.accessToken || authData.jwtToken || authData.authToken
      || apiUser?.token || apiUser?.accessToken || apiUser?.jwtToken || apiUser?.authToken
      || `usr_token_${normalizedPhone || 'session'}_${Date.now()}`;

    const user = {
      ...(apiUser || {}),
      phone: apiUser?.phone || apiUser?.mobileNumber || apiUser?.MobileNumber || normalizedPhone,
      role: apiUser?.role || authData.role || 'Grower',
      isActive: apiUser?.isActive ?? true,
      name: apiUser?.name || apiUser?.fullName || apiUser?.FullName || authData.name || details.name || 'User',
      email: apiUser?.email || apiUser?.Email || details.email || '',
      token: validToken,
      refreshToken: authData.refreshToken || apiUser?.refreshToken || '',
      loggedIn: true,
    };

    login(authData, user);
    localStorage.setItem('hasSignedUp', 'true');
    localStorage.setItem('isLoggedIn', 'true');
    showToast(`Welcome ${user.name}!`);

    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    } else if (onClose) {
      onClose();
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || requestLock.current) return;

    const normalizedPhone = normalizeMobileNumber(phone);
    if (!isValidMobileNumber(normalizedPhone)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post(
        `${getAuthApiBaseUrl()}/test-auth/login`,
        { mobileNumber: normalizedPhone },
        { headers: API_HEADERS, skipAuth: true }
      );

      const responseOtp = response.data?.otp || response.data?.OTP || '';
      const nextLoginApiData = {
        success: response.data?.success === true || response.data?.Success === true,
        isNewUser: response.data?.isNewUser === true || response.data?.IsNewUser === true,
        otp: responseOtp || Math.floor(1000 + Math.random() * 9000).toString(),
      };
      setLoginApiData(nextLoginApiData);

      if (nextLoginApiData.success) {
        if (authMode === 'signin' && nextLoginApiData.isNewUser) {
          setError("This mobile number is not registered. Please sign up first.");
          return;
        }
        if (authMode === 'signup' && !nextLoginApiData.isNewUser) {
          setError("This mobile number is already registered. Please sign in instead.");
          return;
        }

        setStep('otp');
        setOtp('');
        setResendTimer(60);
        showToast(`OTP generated: ${nextLoginApiData.otp}`, 'success', 30000);
      } else {
        setError(response.data?.message || "Unable to continue. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      if (authMode === 'signin') {
        setError("This mobile number is not registered. Please sign up first.");
      } else {
        const generatedRandomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setLoginApiData({ success: true, isNewUser: true, otp: generatedRandomOtp });
        setStep('otp');
        setOtp('');
        setResendTimer(60);
        showToast(`OTP generated: ${generatedRandomOtp}`, 'success', 30000);
      }
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isLoading || requestLock.current || resendTimer > 0) return;

    const normalizedPhone = normalizeMobileNumber(phone);
    if (!isValidMobileNumber(normalizedPhone)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');
    setOtp('');

    try {
      const response = await apiClient.post(
        `${getAuthApiBaseUrl()}/test-auth/login`,
        { mobileNumber: normalizedPhone },
        { headers: API_HEADERS, skipAuth: true }
      );

      const responseOtp = response.data?.otp || response.data?.OTP || '';
      const nextLoginApiData = {
        success: response.data?.success === true || response.data?.Success === true,
        isNewUser: response.data?.isNewUser === true || response.data?.IsNewUser === true,
        otp: responseOtp || Math.floor(1000 + Math.random() * 9000).toString(),
      };
      setLoginApiData(nextLoginApiData);

      if (nextLoginApiData.success) {
        setResendTimer(60);
        showToast(`OTP resent: ${nextLoginApiData.otp}`, 'success', 30000);
      } else {
        setError(response.data?.message || "Unable to resend OTP. Please try again.");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err.response?.data || err.message);
      const generatedRandomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setLoginApiData({ success: true, isNewUser: true, otp: generatedRandomOtp });
      setResendTimer(60);
      showToast(`OTP resent: ${generatedRandomOtp}`, 'success', 30000);
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || requestLock.current) return;

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    const normalizedPhone = normalizeMobileNumber(phone);
    try {
      const response = await apiClient.post(
        `${getAuthApiBaseUrl()}/test-auth/verify-otp`,
        {
          mobileNumber: normalizedPhone,
          otp: otp.trim(),
        },
        { headers: API_HEADERS, skipAuth: true }
      );

      if (response.data?.success !== false) {
        if (loginApiData.isNewUser) {
          setStep('details');
        } else {
          await completeLogin(response.data || {});
        }
      } else {
        setError(response.data?.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err.response?.data || err.message);
      const expectedOtp = String(loginApiData.otp || '').trim();
      if (expectedOtp && otp.trim() === expectedOtp) {
        if (loginApiData.isNewUser) {
          setStep('details');
        } else {
          await completeLogin({
            user: {
              phone: normalizedPhone,
              name: 'User',
              email: '',
            },
          });
        }
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || requestLock.current) return;

    if (!details.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!isValidName(details.name.trim())) {
      setError("Please enter a valid, meaningful name (no gibberish or invalid characters allowed)");
      return;
    }

    if (details.email.trim() && !isValidEmail(details.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    const normalizedPhone = normalizeMobileNumber(phone);
    try {
      const response = await apiClient.post(
        `${getAuthApiBaseUrl()}/test-auth/save-name`,
        {
          mobileNumber: normalizedPhone,
          fullName: details.name.trim(),
          email: details.email.trim(),
        },
        { headers: API_HEADERS, skipAuth: true }
      );

      await completeLogin(response.data || {
        user: {
          phone: normalizedPhone,
          name: details.name.trim(),
          email: details.email.trim(),
        }
      });
    } catch (err) {
      console.error("Save Name Error:", err.response?.data || err.message);
      await completeLogin({ user: { phone: normalizedPhone, name: details.name.trim(), email: details.email.trim() } });
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    requestLock.current = false;
    setAuthMode('signin');
    setStep('phone');
    setPhone('');
    setOtp('');
    setDetails({ name: '', email: '' });
    setLoginApiData({ success: false, isNewUser: false, otp: '' });
    setError('');
    if (onClose) onClose();
  };

  const backToPhone = () => {
    requestLock.current = false;
    setOtp('');
    setStep('phone');
    setLoginApiData({ success: false, isNewUser: false, otp: '' });
    setError('');
  };

  return (
    <div
      className="login-overlay"
      onClick={(e) => {
        if (e.target.className === 'login-overlay') resetForm();
      }}
    >
      <div className="login-modal-container">
        <div className="login-left-image">
          <img src="/popup-bg.png" alt="Agriculture" />
        </div>

        <div className="login-right-content">
          <button
            type="button"
            className="close-button-circular"
            onClick={resetForm}
          >
            <i className="fas fa-times"></i>
          </button>

          <div className="login-logo-mini">
            <img src={headerLogo} alt="Shyam Agro Logo" />
          </div>

          {step === 'phone' && authMode === 'signin' && (
            <>
              <h2>SIGN IN</h2>
              <p>Sign in to your account using your mobile number.</p>
            </>
          )}

          {step === 'phone' && authMode === 'signup' && (
            <>
              <h2>SIGN UP</h2>
              <p>Create a new account with your mobile number.</p>
            </>
          )}

          {step === 'otp' && (
            <>
              <h2>VERIFY MOBILE</h2>
              <p>Please enter the OTP to verify ownership of this number.</p>
              {loginApiData.otp && (
                <div
                  style={{
                    backgroundColor: '#eefbdf',
                    color: '#388e3c',
                    border: '1px solid #c8e6c9',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    margin: '10px 0',
                    textAlign: 'center'
                  }}
                >
                  Your OTP is: <span style={{ fontSize: '16px', letterSpacing: '2px', color: '#2e7d32' }}>{loginApiData.otp}</span>
                </div>
              )}
            </>
          )}

          {step === 'details' && (
            <>
              <h2>COMPLETE YOUR PROFILE</h2>
              <p>Please enter your name and email to complete registration.</p>
            </>
          )}

          {error && (
            <div
              className="login-error-msg"
              style={{
                color: '#ff4d4d',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '10px',
                textTransform: 'uppercase'
              }}
            >
              {error}
            </div>
          )}

          <div className="login-form-wrapper">
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit}>
                <input
                  type="tel"
                  name="mobileNumber"
                  className="premium-input-field"
                  placeholder="ENTER MOBILE NUMBER HERE"
                  maxLength="10"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  autoFocus
                />

                <button
                  type="submit"
                  className="premium-action-btn"
                  disabled={isLoading}
                >
                  {authMode === 'signin' ? (isLoading ? 'LOGGING IN...' : 'SIGN IN') : (isLoading ? 'SENDING OTP...' : 'SIGN UP')}
                </button>

                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  {authMode === 'signin' ? (
                    <span>
                      New user?{' '}
                      <strong
                        style={{ color: 'var(--primary-color, #58B82E)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          setAuthMode('signup');
                          setError('');
                        }}
                      >
                        Sign Up
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <strong
                        style={{ color: 'var(--primary-color, #58B82E)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          setAuthMode('signin');
                          setError('');
                        }}
                      >
                        Sign In
                      </strong>
                    </span>
                  )}
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit}>
                <input
                  type="text"
                  name="otp"
                  className="premium-input-field"
                  placeholder="ENTER 4-DIGIT OTP"
                  maxLength="4"
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  autoFocus
                />

                <button
                  type="submit"
                  className="premium-action-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '0 5px' }}>
                  <div
                    style={{
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#64748b',
                      textDecoration: 'underline',
                      fontWeight: '500'
                    }}
                    onClick={backToPhone}
                  >
                    Back
                  </div>

                  <div>
                    {resendTimer > 0 ? (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Resend OTP in {resendTimer}s
                      </span>
                    ) : (
                      <span
                        style={{
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--primary-color, #58B82E)',
                          textDecoration: 'underline',
                          fontWeight: '600'
                        }}
                        onClick={handleResendOtp}
                      >
                        Resend OTP
                      </span>
                    )}
                  </div>
                </div>
              </form>
            )}

            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit}>
                <input
                  type="text"
                  name="name"
                  className="premium-input-field"
                  placeholder="ENTER FULL NAME"
                  required
                  value={details.name}
                  onChange={(e) =>
                    setDetails({ ...details, name: e.target.value })
                  }
                  autoFocus
                />

                <input
                  type="email"
                  name="email"
                  className="premium-input-field"
                  placeholder="ENTER EMAIL ID"
                  value={details.email}
                  onChange={(e) =>
                    setDetails({ ...details, email: e.target.value })
                  }
                />

                <button
                  type="submit"
                  className="premium-action-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'LOGGING IN...' : 'CONTINUE'}
                </button>

                <div
                  style={{
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#888',
                    marginTop: '5px'
                  }}
                  onClick={backToPhone}
                >
                  BACK
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
