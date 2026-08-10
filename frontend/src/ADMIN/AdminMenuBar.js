import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Box, Users, ShoppingCart, Target, 
  FolderOpen, BarChart2, Settings, ChevronRight, ChevronDown, FileText, Boxes,
  PhoneCall, FileSpreadsheet, Shield, MessageSquare, CreditCard, Ticket
} from 'lucide-react';
import './AdminMenuBar.css';

const AdminMenuBar = ({ expanded = false, onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('admin');
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
    let role = (localStorage.getItem('adminRole') || 'admin').toLowerCase();
    if (role === 'super admin' || role === 'superadmin') {
      role = 'admin';
      localStorage.setItem('adminRole', 'admin');
    }
    setUserRole(role);

    try {
      const perms = localStorage.getItem('adminPermissions');
      if (perms) {
        setUserPermissions(JSON.parse(perms));
      } else {
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

  const toggleDropdown = (menu, defaultRoute) => {
    if (!expanded) {
      if (onToggleSidebar) onToggleSidebar();
      if (defaultRoute) navigate(defaultRoute);
      return;
    }
    setOpenDropdowns(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const hasAccess = (moduleName) => {
    if (moduleName === 'testimonials') return true;
    if (moduleName === 'tickets') return true;
    if (moduleName === 'reports') return true;
    if (moduleName === 'staff') return userRole === 'super admin' || userRole === 'admin';

    if (userRole === 'super admin') return true;

    if (userPermissions.length > 0) {
      return userPermissions.includes(moduleName);
    }

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

  return (
    <div className={`stroyka-sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Brand Header Card */}
      <div className="sidebar-logo-card">
        <div className="sidebar-brand-inner">
          <img
            src="/logo.png"
            alt="ADMIN"
            className="sidebar-brand-logo"
            onError={(e) => { e.target.src = '/logo.svg'; }}
          />
          {expanded && (
            <div className="sidebar-brand-info">
              <h2 className="stroyka-brand">ADMIN</h2>
              <span className="stroyka-brand-sub">Shyam Agro Tools</span>
            </div>
          )}
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
                  data-tooltip="Dashboard"
                  title={!expanded ? "Dashboard" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Home size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Dashboard</span>
                  </div>
                </NavLink>
              </li>
            )}

            {/* Catalog */}
            {hasAccess('catalog') && (
              <li>
                <div
                  onClick={() => toggleDropdown('catalog', '/admin/catalog/categories')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/catalog') ? 'active-parent' : ''}`}
                  data-tooltip="Catalog"
                  title={!expanded ? "Catalog" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Box size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Catalog</span>
                  </div>
                  {expanded && (openDropdowns.catalog
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.catalog && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/catalog/categories"   className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Categories List</NavLink></li>
                  <li><NavLink to="/admin/catalog/category"     className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Category</NavLink></li>
                  <li><NavLink to="/admin/catalog/subcategories" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Subcategories List</NavLink></li>
                  <li><NavLink to="/admin/catalog/subcategory"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Subcategory</NavLink></li>
                  <li><NavLink to="/admin/catalog/products"     className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Products List</NavLink></li>
                  <li><NavLink to="/admin/catalog/products-form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Products</NavLink></li>
                </ul>
              </li>
            )}

            {/* Customers */}
            {hasAccess('customers') && (
              <li>
                <div
                  onClick={() => toggleDropdown('customers', '/admin/customers/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/customers') || location.pathname.includes('/admin/users') ? 'active-parent' : ''}`}
                  data-tooltip="Customers"
                  title={!expanded ? "Customers" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Users size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Customers</span>
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
                  data-tooltip="Reports"
                  title={!expanded ? "Reports" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><BarChart2 size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Reports</span>
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
                  data-tooltip="Tickets"
                  title={!expanded ? "Tickets" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Ticket size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Tickets</span>
                  </div>
                </NavLink>
              </li>
            )}

            {/* Orders */}
            {hasAccess('orders') && (
              <li>
                <div
                  onClick={() => toggleDropdown('orders', '/admin/orders/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/orders') || location.pathname.includes('/admin/returns') ? 'active-parent' : ''}`}
                  data-tooltip="Orders"
                  title={!expanded ? "Orders" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><ShoppingCart size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Orders</span>
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
                  onClick={() => toggleDropdown('invoices', '/admin/invoice')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/invoice') ? 'active-parent' : ''}`}
                  data-tooltip="Invoices"
                  title={!expanded ? "Invoices" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><FileSpreadsheet size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Invoices</span>
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
                  data-tooltip="Call History"
                  title={!expanded ? "Call History" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><PhoneCall size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Call History</span>
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
                  data-tooltip="Stock Updates"
                  title={!expanded ? "Stock Updates" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Boxes size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Stock Updates</span>
                  </div>
                </NavLink>
              </li>
            )}

            {/* Marketing */}
            {hasAccess('marketing') && (
              <li>
                <div
                  onClick={() => toggleDropdown('marketing', '/admin/marketing/banners')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/marketing') ? 'active-parent' : ''}`}
                  data-tooltip="Marketing"
                  title={!expanded ? "Marketing" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Target size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Marketing</span>
                  </div>
                  {expanded && (openDropdowns.marketing
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.marketing && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/marketing/banners" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Hero & Banners</NavLink></li>
                  <li><NavLink to="/admin/marketing/coupons" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Coupons List</NavLink></li>
                  <li><NavLink to="/admin/marketing/coupon"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Coupon</NavLink></li>
                </ul>
              </li>
            )}
            
            {/* Brands */}
            {hasAccess('brands') && (
              <li>
                <div
                  onClick={() => toggleDropdown('brands', '/admin/brands/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/brands') ? 'active-parent' : ''}`}
                  data-tooltip="Brands"
                  title={!expanded ? "Brands" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Box size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Brands</span>
                  </div>
                  {expanded && (openDropdowns.brands ? <ChevronDown size={15} className="nav-arrow" /> : <ChevronRight size={15} className="nav-arrow" />)}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.brands && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/brands/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Brands List</NavLink></li>
                  <li><NavLink to="/admin/brands/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Brand</NavLink></li>
                </ul>
              </li>
            )}
            
            {/* Blogs */}
            {hasAccess('blogs') && (
              <li>
                <div
                  onClick={() => toggleDropdown('blogs', '/admin/blogs/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/blogs') ? 'active-parent' : ''}`}
                  data-tooltip="Blogs"
                  title={!expanded ? "Blogs" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><FileText size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Blogs</span>
                  </div>
                  {expanded && (openDropdowns.blogs
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.blogs && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/blogs/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Blogs List</NavLink></li>
                  <li><NavLink to="/admin/blogs/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Blog</NavLink></li>
                </ul>
              </li>
            )}

            {/* Testimonials */}
            {hasAccess('testimonials') && (
              <li>
                <div
                  onClick={() => toggleDropdown('testimonials', '/admin/testimonials/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/testimonials') ? 'active-parent' : ''}`}
                  data-tooltip="Testimonials"
                  title={!expanded ? "Testimonials" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><MessageSquare size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Testimonials</span>
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
                  onClick={() => toggleDropdown('staff', '/admin/staff/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/staff') ? 'active-parent' : ''}`}
                  data-tooltip="Staff"
                  title={!expanded ? "Staff" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Shield size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Staff</span>
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
                  onClick={() => toggleDropdown('settings', '/admin/settings/toc')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/settings') ? 'active-parent' : ''}`}
                  data-tooltip="Settings"
                  title={!expanded ? "Settings" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><Settings size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Settings</span>
                  </div>
                  {expanded && (openDropdowns.settings
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.settings && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/settings/toc"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Table of Content</NavLink></li>
                  <li><NavLink to="/admin/settings/form" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Settings</NavLink></li>
                </ul>
              </li>
            )}

            {/* Suppliers */}
            {hasAccess('suppliers') && (
              <li>
                <div
                  onClick={() => toggleDropdown('suppliers', '/admin/suppliers/list')}
                  className={`stroyka-nav-link dropdown-header ${location.pathname.includes('/admin/suppliers') ? 'active-parent' : ''}`}
                  data-tooltip="Suppliers"
                  title={!expanded ? "Suppliers" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><FolderOpen size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Suppliers</span>
                  </div>
                  {expanded && (openDropdowns.suppliers
                    ? <ChevronDown size={15} className="nav-arrow" />
                    : <ChevronRight size={15} className="nav-arrow" />
                  )}
                </div>
                <ul className={`stroyka-submenu ${openDropdowns.suppliers && expanded ? 'show-submenu' : ''}`}>
                  <li><NavLink to="/admin/suppliers/list" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Suppliers List</NavLink></li>
                  <li><NavLink to="/admin/suppliers/add"  className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>Add Supplier</NavLink></li>
                </ul>
              </li>
            )}

            {/* Coins Converter */}
            {hasAccess('coins converter') && (
              <li>
                <NavLink
                  to="/admin/coins"
                  className={({ isActive }) => isActive ? 'stroyka-nav-link active' : 'stroyka-nav-link'}
                  data-tooltip="Coins Converter"
                  title={!expanded ? "Coins Converter" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><BarChart2 size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Coins Converter</span>
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
                  data-tooltip="Payment Settings"
                  title={!expanded ? "Payment Settings" : undefined}
                >
                  <div className="nav-left">
                    <div className="icon-box"><CreditCard size={18} className="nav-icon" /></div>
                    <span className="nav-label-text">Payment Settings</span>
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
