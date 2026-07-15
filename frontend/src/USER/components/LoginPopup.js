import React, { useRef, useState } from 'react';
import apiClient from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import headerLogo from '../../asset/header logo.png';
import './LoginPopup.css';

const DIRECT_API_BASE_URL = "http://shyamagrotools.com";
const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

const getAuthApiBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_AUTH_API_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1'
    ? ''
    : DIRECT_API_BASE_URL;
};

const normalizeMobileNumber = (value) => {
  const digits = String(value || '').trim().replace(/\D/g, '');
  return digits.length > 10 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getApiErrorMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;
  const firstValidationError = errors && Object.values(errors).flat()[0];

  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    firstValidationError ||
    fallback
  );
};

const LoginPopup = ({ isOpen, onClose, redirectTo }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState({ name: '', email: '' });
  const [otp, setOtp] = useState('');
  const [loginApiData, setLoginApiData] = useState({
    success: false,
    isNewUser: false,
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestLock = useRef(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setPhone(value);
  };

  const completeLogin = async (authData = {}) => {
    const normalizedPhone = normalizeMobileNumber(phone);
    const apiUser = authData.user || authData.data?.user || authData.data || {};
    const user = {
      ...(apiUser || {}),
      phone: apiUser?.phone || apiUser?.mobileNumber || apiUser?.MobileNumber || normalizedPhone,
      role: apiUser?.role || authData.role || 'Grower',
      isActive: apiUser?.isActive ?? true,
      name: apiUser?.name || apiUser?.fullName || apiUser?.FullName || authData.name || details.name || 'User',
      email: apiUser?.email || apiUser?.Email || details.email || '',
      token: authData.token || authData.accessToken || authData.jwtToken || authData.authToken
        || apiUser?.token || apiUser?.accessToken || apiUser?.jwtToken || apiUser?.authToken || '',
      refreshToken: authData.refreshToken || apiUser?.refreshToken || '',
      loggedIn: true,
    };

    login(authData, user);
    onClose();
    navigate(redirectTo || '/account');
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || requestLock.current) return;

    const normalizedPhone = normalizeMobileNumber(phone);
    if (normalizedPhone.length !== 10) {
      setError("Please enter a valid 10-digit number");
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

      const nextLoginApiData = {
        success: response.data?.success === true,
        isNewUser: response.data?.isNewUser === true,
        otp: response.data?.otp || '',
      };
      setLoginApiData(nextLoginApiData);

      if (nextLoginApiData.success) {
        setStep(nextLoginApiData.isNewUser ? 'details' : 'otp');
      } else {
        setError(response.data?.message || "Unable to continue. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(getApiErrorMessage(err, "Unable to connect to server."));
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

    if (details.email.trim() && !isValidEmail(details.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    try {
      if (!loginApiData.isNewUser) {
        setStep('otp');
      } else {
        const response = await apiClient.post(
          `${getAuthApiBaseUrl()}/test-auth/save-name`,
          {
            mobileNumber: normalizeMobileNumber(phone),
            fullName: details.name.trim(),
            email: details.email.trim(),
          },
          { headers: API_HEADERS, skipAuth: true }
        );

        if (response.data?.success === true) {
          setStep('otp');
        } else {
          setError(response.data?.message || "Failed to register user.");
        }
      }
    } catch (err) {
      console.error("Save Name Error:", err.response?.data || err.message);
      setError(getApiErrorMessage(err, "Failed to register user. Please try again."));
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (isLoading || requestLock.current) return;

    if (otp.trim().length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post(
        `${getAuthApiBaseUrl()}/test-auth/verify-otp`,
        {
          mobileNumber: normalizeMobileNumber(phone),
          otp: otp.trim(),
        },
        { headers: API_HEADERS, skipAuth: true }
      );

      if (response.data?.success === false) {
        setError(response.data?.message || "OTP verification failed. Please check the code.");
      } else {
        await completeLogin(response.data || {});
      }
    } catch (err) {
      console.error("Verify OTP Error:", err.response?.data || err.message);
      setError(getApiErrorMessage(err, "OTP verification failed. Please check the code."));
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    requestLock.current = false;
    setStep('phone');
    setPhone('');
    setDetails({ name: '', email: '' });
    setOtp('');
    setLoginApiData({ success: false, isNewUser: false, otp: '' });
    setError('');
    onClose();
  };

  const backToPhone = () => {
    requestLock.current = false;
    setStep('phone');
    setOtp('');
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

          <h2>SIGN UP TO GET OFFERS.</h2>
          <p>SIGN UP to get the best offers and discount today.</p>

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
                  placeholder="Enter MOBILE NUMBER Here"
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
                  {isLoading ? 'CHECKING...' : 'SUBSCRIBE'}
                </button>
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
                  {isLoading ? 'REGISTERING...' : 'CONTINUE'}
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

            {step === 'otp' && (
              <form onSubmit={handleVerify}>
                <input
                  type="text"
                  name="otp"
                  className="premium-input-field"
                  placeholder="ENTER 4-DIGIT OTP"
                  maxLength="4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />

                <button
                  type="submit"
                  className="premium-action-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
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
                  CHANGE NUMBER
                </div>
              </form>
            )}

            <div className="remember-me-container">
              <input type="checkbox" id="remember-me" />
              <label htmlFor="remember-me">REMEMBER ME .....!</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
