import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import AdminTopBar from './AdminTopBar';
import AdminMenuBar from './AdminMenuBar';
import { Toast } from './components/Toast';
import './AdminLayout.css';

const AdminLayout = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [globalToast, setGlobalToast] = useState(null);

  const userEmail = localStorage.getItem('adminEmail') || '';
  let userRole = (localStorage.getItem('adminRole') || 'super admin').toLowerCase();
  if (userEmail.toLowerCase().trim() === 'charanbhaskar4455@gmail.com') {
    userRole = 'super admin';
  }
  
  // Load custom permissions from localStorage
  let userPermissions = [];
  try {
    const raw = localStorage.getItem('adminPermissions');
    if (raw) {
      userPermissions = JSON.parse(raw);
    } else if (userRole === 'super admin') {
      userPermissions = ["dashboard", "catalog", "customers", "orders", "tickets", "reports", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "call history", "staff"];
    }
  } catch (e) {}

  // Intercept data mutations for Manager role (Read-Only)
  useEffect(() => {
    if (userRole !== 'manager') return;

    const handleFormSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setGlobalToast({ message: "Read-Only Mode: Manager accounts are not allowed to submit form data.", type: "warning" });
    };

    const handleButtonClick = (e) => {
      const btn = e.target.closest('button, input[type="submit"], a.catalog-btn--primary');
      if (!btn) return;
      
      const text = (btn.textContent || btn.value || '').toLowerCase().trim();
      const isDelete = text.includes('delete') || text.includes('remove') || text.includes('trash');
      const isSave = text.includes('save') || text.includes('create') || text.includes('add') || text.includes('update') || text.includes('submit');
      
      if (isDelete || isSave) {
        e.preventDefault();
        e.stopPropagation();
        setGlobalToast({ message: "Read-Only Mode: Manager accounts are not allowed to modify data.", type: "warning" });
      }
    };

    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('click', handleButtonClick, true);

    return () => {
      document.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, [userRole]);

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  // Helper to verify path authorization
  const isPathAllowed = (pathname) => {
    // Normalize path to get the first segment
    const path = pathname.replace('/admin/', '').split('/')[0];
    if (path === 'staff') return userRole === 'super admin' || userRole === 'admin';

    if (userRole === 'super admin') return true;
    
    // Always allowed pages
    if (path === 'dashboard' || path === 'profile' || path === 'account-settings' || path === 'testimonials' || path === 'tickets' || path === 'reports' || path === '') return true;

    let moduleKey = path;
    if (path === 'stock-updates' || path === 'stock') moduleKey = 'stockupdates';
    if (path === 'coins') moduleKey = 'coins converter';
    if (path === 'call-history') moduleKey = 'call history';
    if (path === 'invoice') moduleKey = 'invoices';
    if (path === 'returns') moduleKey = 'orders';
    if (path === 'categories' || path === 'products' || path === 'descriptions' || path === 'image-categorizer') moduleKey = 'catalog';
    if (path === 'users') moduleKey = 'customers';
    if (path === 'contact-card' || path === 'footer' || path === 'payments') moduleKey = 'settings';

    // If explicit permissions list exists, check it first
    if (userPermissions.length > 0) {
      return userPermissions.includes(moduleKey);
    }

    if (userRole === 'admin') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "staff"];
      return allowed.includes(moduleKey);
    }
    if (userRole === 'manager') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices"];
      return allowed.includes(moduleKey);
    }
    if (userRole === 'staff') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "call history", "invoices", "stockupdates", "marketing", "brands", "settings", "suppliers"];
      return allowed.includes(moduleKey);
    }
    return false;
  };

  const allowed = isPathAllowed(location.pathname);

  return (
    <div className={`admin-layout ${sidebarExpanded ? 'sidebar-open' : 'sidebar-closed'}`}>
      {globalToast && (
        <Toast 
          message={globalToast.message} 
          type={globalToast.type} 
          onClose={() => setGlobalToast(null)} 
        />
      )}

      <aside
        className="admin-sidebar-area"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <AdminMenuBar expanded={sidebarExpanded} />
      </aside>
      <header className="admin-topbar-area">
        <AdminTopBar />
      </header>
      <main className="admin-main-content">
        {/* Manager Read-Only Warning Banner */}
        {userRole === 'manager' && (
          <div className="manager-read-only-banner">
            <AlertTriangle size={16} />
            <span><strong>Read-Only Mode:</strong> Operations Manager accounts are restricted from saving, modifying, or deleting records.</span>
          </div>
        )}

        {allowed ? (
          <Outlet />
        ) : (
          <div className="access-denied-view">
            <ShieldAlert size={64} className="text-red-500" />
            <h2>Access Denied</h2>
            <p>
              Your security role (<strong>{userRole.toUpperCase()}</strong>) does not have permissions to access the path <code>{location.pathname}</code>.
            </p>
            <button onClick={() => navigate('/admin/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
