import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Box, Users, ShoppingCart, Target, 
  FolderOpen, BarChart2, Settings, ChevronRight, ChevronDown, FileText, Boxes,
  PhoneCall, FileSpreadsheet, Shield, MessageSquare, CreditCard, Ticket
} from 'lucide-react';
import './AdminMenuBar.css';

const AdminMenuBar = ({ expanded = false }) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState('super admin');
  const [userPermissions, setUserPermissions] = useState([]);

  const [openDropdowns, setOpenDropdowns] = useState({
    catalog: false,
    customers: false,
    orders: false,
    marketing: false,
    brands: false,
    blogs: false,
    settings: false,
    staff: false,
    suppliers: false,
    coins: false,
    invoices: false,
    testimonials: false
  });

  useEffect(() => {
    const email = localStorage.getItem('adminEmail') || '';
    let role = (localStorage.getItem('adminRole') || 'super admin').toLowerCase();
    if (email.toLowerCase().trim() === 'charanbhaskar4455@gmail.com') {
      role = 'super admin';
    }
    setUserRole(role);

    try {
      const perms = localStorage.getItem('adminPermissions');
      if (perms) {
        setUserPermissions(JSON.parse(perms));
      } else if (role === 'super admin') {
        // Fallback permissions for super admin
        setUserPermissions(["dashboard", "catalog", "customers", "orders", "tickets", "reports", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "call history", "staff"]);
      }
    } catch (e) {
      console.error("Error loading permissions", e);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!expanded) {
      setOpenDropdowns({
        catalog: false, customers: false, orders: false,
        marketing: false, brands: false, blogs: false, settings: false,
        staff: false, suppliers: false, coins: false, invoices: false
      });
      return;
    }
    const path = location.pathname;
    setOpenDropdowns({
      catalog:   path.includes('/admin/catalog'),
      customers: path.includes('/admin/customers') || path.includes('/admin/users'),
      orders:    path.includes('/admin/orders') || path.includes('/admin/returns'),
      marketing: path.includes('/admin/marketing'),
      brands:    path.includes('/admin/brands'),
      blogs:     path.includes('/admin/blogs'),
      settings:  path.includes('/admin/settings'),
      staff:     path.includes('/admin/staff'),
      suppliers: path.includes('/admin/suppliers'),
      coins:     path.includes('/admin/coins'),
      invoices:  path.includes('/admin/invoice'),
      testimonials: path.includes('/admin/testimonials')
    });
  }, [location.pathname, expanded]);

  const toggleDropdown = (menu) => {
    if (!expanded) return;
    setOpenDropdowns(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const hasAccess = (moduleName) => {
    if (moduleName === 'testimonials') return true;
    if (moduleName === 'tickets') return true;
    if (moduleName === 'reports') return true;
    if (moduleName === 'staff') return userRole === 'super admin' || userRole === 'admin';

    if (userRole === 'super admin') return true;

    // Check custom permissions first if they are explicitly stored (e.g. for locally configured staff)
    if (userPermissions.length > 0) {
      return userPermissions.includes(moduleName);
    }

    // Role-based defaults fallback
    if (userRole === 'admin') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices", "staff"];
      return allowed.includes(moduleName);
    }
    if (userRole === 'manager') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "stockupdates", "marketing", "brands", "blogs", "settings", "suppliers", "coins converter", "invoices"];
      return allowed.includes(moduleName);
    }
    if (userRole === 'staff') {
      const allowed = ["dashboard", "catalog", "customers", "orders", "call history", "invoices", "stockupdates", "marketing", "brands", "settings", "suppliers"];
      return allowed.includes(moduleName);
    }

    return false;
  };

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'super admin': return 'SUPER ADMIN';
      case 'admin': return 'ADMIN';
      case 'manager': return 'MANAGER';
      case 'staff': return 'STAFF';
      default: return 'USER';
    }
  };

  return (
    <div className={`stroyka-sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Brand Header */}
      <div className="sidebar-logo-area">
        <img
          src="/logo.svg"
          alt="SAT"
          className="sidebar-brand-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className={`sidebar-brand-info ${expanded ? 'visible' : 'hidden'}`}>
          <h2 className="stroyka-brand">SHYAM AGRO</h2>
          <span className={`admin-badge role-${userRole.replace(' ', '-')}`}>
            {getRoleLabel(userRole)}
          </span>
        </div>
      </div>

      <div className="sidebar-scrollable">
        <div className="menu-group">
          {expanded && <div className="menu-label">Console Modules</div>}

          <ul className="stroyka-menu">

            {/* Dashboard */}
            {hasAccess('dashboard') && (
              <li>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Dashboard"
                >
                  <div className="nav-left">
                    <Home size={18} className="nav-icon" />
                    {expanded && <span>Dashboard</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Catalog */}
            {hasAccess('catalog') && (
              <li>
                <div
                  onClick={() => toggleDropdown('catalog')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/catalog') ? 'active-parent' : ''}`}
                  title="Catalog"
                >
                  <div className="nav-left">
                    <Box size={18} className="nav-icon" />
                    {expanded && <span>Catalog</span>}
                  </div>
                  {expanded && (openDropdowns.catalog
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.catalog && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/catalog/categories"   className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Categories List</NavLink></li>
                  <li><NavLink to="/admin/catalog/category"     className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Category Form</NavLink></li>
                  <li><NavLink to="/admin/catalog/subcategories" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Subcategories List</NavLink></li>
                  <li><NavLink to="/admin/catalog/subcategory"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Subcategory Form</NavLink></li>
                  <li><NavLink to="/admin/catalog/products"     className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Products List</NavLink></li>
                  <li><NavLink to="/admin/catalog/products-form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Products Form</NavLink></li>
                </ul>
              </li>
            )}

            {/* Customers */}
            {hasAccess('customers') && (
              <li>
                <div
                  onClick={() => toggleDropdown('customers')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/customers') || location.pathname.includes('/admin/users') ? 'active-parent' : ''}`}
                  title="Customers"
                >
                  <div className="nav-left">
                    <Users size={18} className="nav-icon" />
                    {expanded && <span>Customers</span>}
                  </div>
                  {expanded && (openDropdowns.customers
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.customers && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/customers/list"     className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Customers List</NavLink></li>
                  <li><NavLink to="/admin/customers/customer" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Customer Profile</NavLink></li>
                </ul>
              </li>
            )}

            {/* Reports */}
            {hasAccess('reports') && (
              <li>
                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Reports"
                >
                  <div className="nav-left">
                    <BarChart2 size={18} className="nav-icon" />
                    {expanded && <span>Reports</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Tickets */}
            {hasAccess('tickets') && (
              <li>
                <NavLink
                  to="/admin/tickets"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Tickets"
                >
                  <div className="nav-left">
                    <Ticket size={18} className="nav-icon" />
                    {expanded && <span>Tickets</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Orders */}
            {hasAccess('orders') && (
              <li>
                <div
                  onClick={() => toggleDropdown('orders')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/orders') || location.pathname.includes('/admin/returns') ? 'active-parent' : ''}`}
                  title="Orders"
                >
                  <div className="nav-left">
                    <ShoppingCart size={18} className="nav-icon" />
                    {expanded && <span>Orders</span>}
                  </div>
                  {expanded && (openDropdowns.orders
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.orders && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/orders/list"    className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Orders List</NavLink></li>
                  <li><NavLink to="/admin/orders/tracking" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Tracking Order</NavLink></li>
                  <li><NavLink to="/admin/orders/shipping" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Shipping Order</NavLink></li>
                  <li><NavLink to="/admin/returns"         className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Returns & Refunds</NavLink></li>
                </ul>
              </li>
            )}

            {/* Invoices */}
            {hasAccess('invoices') && (
              <li>
                <div
                  onClick={() => toggleDropdown('invoices')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/invoice') ? 'active-parent' : ''}`}
                  title="Invoices"
                >
                  <div className="nav-left">
                    <FileSpreadsheet size={18} className="nav-icon" />
                    {expanded && <span>Invoices</span>}
                  </div>
                  {expanded && (openDropdowns.invoices
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.invoices && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/invoice"      className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Invoices List</NavLink></li>
                  <li><NavLink to="/admin/invoice/add"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Add Invoice</NavLink></li>
                </ul>
              </li>
            )}

            {/* Call History */}
            {hasAccess('call history') && (
              <li>
                <NavLink
                  to="/admin/call-history"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Call History"
                >
                  <div className="nav-left">
                    <PhoneCall size={18} className="nav-icon" />
                    {expanded && <span>Call History</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Stock Updates */}
            {hasAccess('stockupdates') && (
              <li>
                <NavLink
                  to="/admin/stock-updates"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Stock Updates"
                >
                  <div className="nav-left">
                    <Boxes size={18} className="nav-icon" />
                    {expanded && <span>Stock Updates</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Marketing */}
            {hasAccess('marketing') && (
              <li>
                <div
                  onClick={() => toggleDropdown('marketing')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/marketing') ? 'active-parent' : ''}`}
                  title="Marketing"
                >
                  <div className="nav-left">
                    <Target size={18} className="nav-icon" />
                    {expanded && <span>Marketing</span>}
                  </div>
                  {expanded && (openDropdowns.marketing
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.marketing && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/marketing/coupons" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Coupons List</NavLink></li>
                  <li><NavLink to="/admin/marketing/coupon"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Coupon Form</NavLink></li>
                </ul>
              </li>
            )}
            
            {/* Brands */}
            {hasAccess('brands') && (
              <li>
                <div
                  onClick={() => toggleDropdown('brands')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/brands') ? 'active-parent' : ''}`}
                  title="Brands"
                >
                  <div className="nav-left">
                    <Box size={18} className="nav-icon" />
                    {expanded && <span>Brands</span>}
                  </div>
                  {expanded && (openDropdowns.brands ? <ChevronDown size={15} className="nav-arrow" /> : <ChevronRight size={15} className="nav-arrow" />)}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.brands && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/brands/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Brands List</NavLink></li>
                  <li><NavLink to="/admin/brands/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Brand Form</NavLink></li>
                </ul>
              </li>
            )}
            
            {/* Blogs */}
            {hasAccess('blogs') && (
              <li>
                <div
                  onClick={() => toggleDropdown('blogs')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/blogs') ? 'active-parent' : ''}`}
                  title="Blogs"
                >
                  <div className="nav-left">
                    <FileText size={18} className="nav-icon" />
                    {expanded && <span>Blogs</span>}
                  </div>
                  {expanded && (openDropdowns.blogs
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.blogs && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/blogs/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Blogs List</NavLink></li>
                  <li><NavLink to="/admin/blogs/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Blog Form</NavLink></li>
                </ul>
              </li>
            )}

            {/* Testimonials */}
            {hasAccess('testimonials') && (
              <li>
                <div
                  onClick={() => toggleDropdown('testimonials')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/testimonials') ? 'active-parent' : ''}`}
                  title="Testimonials"
                >
                  <div className="nav-left">
                    <MessageSquare size={18} className="nav-icon" />
                    {expanded && <span>Testimonials</span>}
                  </div>
                  {expanded && (openDropdowns.testimonials
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.testimonials && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/testimonials/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Testimonial List</NavLink></li>
                  <li><NavLink to="/admin/testimonials/add"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Add Testimonial</NavLink></li>
                </ul>
              </li>
            )}

            {/* Staff */}
            {hasAccess('staff') && (
              <li>
                <div
                  onClick={() => toggleDropdown('staff')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/staff') ? 'active-parent' : ''}`}
                  title="Staff"
                >
                  <div className="nav-left">
                    <Shield size={18} className="nav-icon" />
                    {expanded && <span>Staff</span>}
                  </div>
                  {expanded && (openDropdowns.staff
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.staff && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/staff/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Staff List</NavLink></li>
                  <li><NavLink to="/admin/staff/add"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Add Staff</NavLink></li>
                </ul>
              </li>
            )}

            {/* Settings */}
            {hasAccess('settings') && (
              <li>
                <div
                  onClick={() => toggleDropdown('settings')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/settings') ? 'active-parent' : ''}`}
                  title="Settings"
                >
                  <div className="nav-left">
                    <Settings size={18} className="nav-icon" />
                    {expanded && <span>Settings</span>}
                  </div>
                  {expanded && (openDropdowns.settings
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.settings && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/settings/toc"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Table of Content</NavLink></li>
                  <li><NavLink to="/admin/settings/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Settings Form</NavLink></li>
                </ul>
              </li>
            )}

            {/* Suppliers */}
            {hasAccess('suppliers') && (
              <li>
                <div
                  onClick={() => toggleDropdown('suppliers')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/suppliers') ? 'active-parent' : ''}`}
                  title="Suppliers"
                >
                  <div className="nav-left">
                    <FolderOpen size={18} className="nav-icon" />
                    {expanded && <span>Suppliers</span>}
                  </div>
                  {expanded && (openDropdowns.suppliers
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.suppliers && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/suppliers/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Suppliers List</NavLink></li>
                  <li><NavLink to="/admin/suppliers/add"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Add Supplier</NavLink></li>
                  <li><NavLink to="/admin/suppliers/new"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>New Suppliers</NavLink></li>
                </ul>
              </li>
            )}

            {/* Coins Converter */}
            {hasAccess('coins converter') && (
              <li>
                <NavLink
                  to="/admin/coins"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Coins Converter"
                >
                  <div className="nav-left">
                    <BarChart2 size={18} className="nav-icon" />
                    {expanded && <span>Coins Converter</span>}
                  </div>
                </NavLink>
              </li>
            )}

            {/* Payment Settings */}
            {hasAccess('orders') && (
              <li>
                <NavLink
                  to="/admin/payments"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  title="Payment Settings"
                >
                  <div className="nav-left">
                    <CreditCard size={18} className="nav-icon" />
                    {expanded && <span>Payment Settings</span>}
                  </div>
                </NavLink>
              </li>
            )}

          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuBar;
