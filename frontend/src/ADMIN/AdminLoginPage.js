import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';
import './AdminLoginPage.css';

const ADMIN_AUTH_API = `${getApiDomain()}/api/Auth`;
const HEADERS  = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };
const REQUEST_TIMEOUT = 8000;

const getLoginErrorMessage = (err) => {
  if (err.code === 'ECONNABORTED') {
    return 'Login request timed out. Please check that the admin auth API is running and try again.';
  }

  if (!err.response) {
    return 'Unable to connect to the admin auth API. Please check the server or ngrok tunnel.';
  }

  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    'Invalid email or password. Please try again.'
  );
};

const shouldContinueToOtpAfterLoginError = (err) =>
  err.code === 'ECONNABORTED' || !err.response;

const buildLoginPayload = (emailAddress, passwordValue) => ({
  email: emailAddress.trim(),
  password: passwordValue
});

const AdminLoginPage = () => {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if user is a locally added staff member
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const matchedStaff = localAccounts.find(acc => acc.email.toLowerCase() === email.trim().toLowerCase());

    if (matchedStaff) {
      if (matchedStaff.password === password) {
        setIsLoading(false);
        navigate('/admin/verify-otp', {
          state: {
            email: email.trim(),
            password,
            fromLogin: true,
            localStaff: matchedStaff
          }
        });
        return;
      } else {
        setIsLoading(false);
        setError('Invalid email or password. Please try again.');
        return;
      }
    }

    // Helper function to fetch profile & permissions from new API
    const fetchProfileAndPermissions = async (token, userEmail) => {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      };

      let profile = null;
      try {
        const res = await axios.get(`${getApiDomain()}/api/Auth/profile`, { headers, timeout: 5000 });
        if (res.data) {
          profile = res.data.data || res.data.value || res.data;
        }
      } catch (e) {
        console.warn('Auth profile fetch failed, trying Staff profile:', e.message);
        try {
          const res = await axios.get(`${getApiDomain()}/api/Staff/profile`, { headers, timeout: 5000 });
          if (res.data) {
            profile = res.data.data || res.data.value || res.data;
          }
        } catch (e2) {
          console.warn('Staff profile fetch failed:', e2.message);
        }
      }

      let permissions = [];
      try {
        const res = await axios.get(`${getApiDomain()}/api/Permission/my-permissions`, { headers, timeout: 5000 });
        const permsData = res.data?.data || res.data?.value || res.data;
        if (Array.isArray(permsData)) {
          permsData.forEach(p => {
            const name = p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName)) || (typeof p === 'string' ? p : '');
            if (name) {
              permissions.push(name.toLowerCase());
            }
          });
        } else if (permsData && typeof permsData === 'object') {
          Object.keys(permsData).forEach(k => {
            if (permsData[k] === true) {
              permissions.push(k.toLowerCase());
            }
          });
        }
      } catch (e) {
        console.warn('Permissions fetch failed:', e.message);
      }

      const role = (profile?.role || profile?.Role || 'staff').toLowerCase();
      if (permissions.length === 0) {
        if (role === 'super admin' || userEmail.toLowerCase().trim() === 'charanbhaskar4455@gmail.com') {
          permissions = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "call history", "staff"];
        } else if (role === 'admin') {
          permissions = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "staff"];
        } else if (role === 'manager') {
          permissions = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices"];
        } else {
          permissions = ["dashboard", "catalog", "customers", "orders", "call history", "invoices", "stockupdates", "marketing", "brands", "settings", "suppliers"];
        }
      }

      return { profile, permissions };
    };

    try {
      // 1. First, try authentication on the new API target (Direct Login, No OTP)
      try {
        console.log("Attempting login via new API...");
        const newResponse = await axios.post(
          `${getApiDomain()}/api/Auth/login`,
          buildLoginPayload(email, password),
          { headers: HEADERS, timeout: REQUEST_TIMEOUT }
        );

        const newData = newResponse.data;
        if (newData && (newData.status === true || newData.success === true || (newData.success === undefined && newData.token))) {
          const token = newData?.token || newData?.accessToken || newData?.Token || newData?.data?.token || newData?.data?.accessToken;
          if (token) {
            console.log("New API login success. Fetching profile & permissions...");
            const { profile, permissions } = await fetchProfileAndPermissions(token, email);
            
            const firstName = profile?.firstName || profile?.FirstName || '';
            const lastName = profile?.lastName || profile?.LastName || '';
            const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
            const role = profile?.role || profile?.Role || 'admin';

            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminEmail', email.trim());
            localStorage.setItem('adminName', name);
            localStorage.setItem('adminRole', role.toLowerCase());
            localStorage.setItem('adminPermissions', JSON.stringify(permissions));
            localStorage.setItem('authApiVersion', 'new');

            navigate('/admin/dashboard');
            return;
          }
        }
      } catch (newApiErr) {
        console.warn('New API auth failed or unavailable, falling back to previous API:', newApiErr.response?.data || newApiErr.message);
      }

      // 2. Fallback to previous OTP-based authentication API
      const response = await axios.post(
        `${ADMIN_AUTH_API}/login`,
        buildLoginPayload(email, password),
        { headers: HEADERS, timeout: REQUEST_TIMEOUT }
      );

      const data = response.data;

      if (data?.success === false) {
        setError(data?.message || 'Login failed. Please check your credentials.');
        return;
      }

      localStorage.setItem('authApiVersion', 'old');

      // Credentials accepted → go to OTP screen for 2-step verification
      navigate('/admin/verify-otp', {
        state: {
          email: email.trim(),
          password,
          fromLogin: true,
          loginData: data
        }
      });

    } catch (err) {
      console.error('Admin Login Error:', err.response?.data || err.message);

      if (shouldContinueToOtpAfterLoginError(err)) {
        localStorage.setItem('authApiVersion', 'old');
        navigate('/admin/verify-otp', {
          state: {
            email: email.trim(),
            password,
            fromLogin: true,
            loginWarning: getLoginErrorMessage(err)
          }
        });
        return;
      }
      
      setError(getLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-modal-container">
        {/* Left Side - Image */}
        <div className="admin-login-left">
          <img src="/popup-bg.png" alt="Admin Portal" />
        </div>

        {/* Right Side - Form */}
        <div className="admin-login-right">
          <button
            type="button"
            className="admin-auth-close"
            aria-label="Back to site"
            onClick={() => navigate('/')}
          >
            x
          </button>

          <div className="admin-logo-mini">
            <img src="/logo.svg" alt="Shyam Agro Tools logo" />
          </div>

          <h2>SIGN IN TO ADMIN.</h2>
          <p>Enter your registered email to continue to your dashboard.</p>

          {error && (
            <div style={{
              color: '#e53e3e', fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '12px', maxWidth: '300px', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="admin-form-container">
            <form onSubmit={handleLogin}>
              <input
                type="email"
                className="admin-premium-input"
                placeholder="ENTER EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="admin-premium-btn"
                disabled={isLoading}
              >
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

            <div className="admin-footer-links">
              <span onClick={() => navigate('/admin/forgot-password')}>FORGOT PASSWORD?</span>
              <span>•</span>
              <span onClick={() => navigate('/')}>BACK TO SITE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
