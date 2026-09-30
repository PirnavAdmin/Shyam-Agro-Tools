import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Box, Users, ShoppingCart, Target, Mail, Award, ChevronRight, Shield, KeyRound, ClipboardCheck, HardDrive, Lock, RefreshCw } from 'lucide-react';

const TableOfContent = () => {
  const sections = [
    {
      title: 'Catalog & Inventory Operations',
      desc: 'Create, update, and manage seeds, nutrients, weeders, and irrigation equipment listings.',
      links: [
        { name: 'Products Listing', path: '/admin/catalog/products', icon: <Box size={16} /> },
        { name: 'Products Form', path: '/admin/catalog/products-form', icon: <Box size={16} /> },
        { name: 'Categories Ledger', path: '/admin/catalog/categories', icon: <Box size={16} /> },
        { name: 'Category Form', path: '/admin/catalog/category', icon: <Box size={16} /> },
        { name: 'Subcategories Ledger', path: '/admin/catalog/subcategories', icon: <Box size={16} /> },
        { name: 'Subcategory Form', path: '/admin/catalog/subcategory', icon: <Box size={16} /> }
      ]
    },
    {
      title: 'Growers & Buyer Directory',
      desc: 'Analyze registered grower accounts, field land allocations, crop focuses, and bulk purchase files.',
      links: [
        { name: 'Customers Directory', path: '/admin/customers/list', icon: <Users size={16} /> },
        { name: 'Customer Profile Layout', path: '/admin/customers/customer', icon: <Users size={16} /> }
      ]
    },
    {
      title: 'Order Processing & Shipments',
      desc: 'Process payments, monitor dispatch shipments, track AC-Docket numbers, and print agricultural bills.',
      links: [
        { name: 'Orders List', path: '/admin/orders/list', icon: <ShoppingCart size={16} /> },
        { name: 'Tracking Order', path: '/admin/orders/tracking', icon: <ShoppingCart size={16} /> },
        { name: 'Shipping Order', path: '/admin/orders/shipping', icon: <ShoppingCart size={16} /> },
        { name: 'Returns & Refunds', path: '/admin/returns', icon: <RefreshCw size={16} /> }
      ]
    },
    {
      title: 'Marketing & Support Desk',
      desc: 'Set seasonal discount vouchers, process support messages, and post agricultural advisories.',
      links: [
        { name: 'Vouchers List', path: '/admin/marketing/coupons', icon: <Target size={16} /> },
        { name: 'Voucher Builder', path: '/admin/marketing/coupon', icon: <Target size={16} /> },
        { name: 'Farmers Advisory Inbox', path: '/admin/inbox/list', icon: <Mail size={16} /> },
        { name: 'Chat Diagnostics Layout', path: '/admin/inbox/conversation', icon: <Mail size={16} /> }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Area */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-xl shadow-md border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Background leaf texture decor */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
          <Award size={200} />
        </div>
        <div className="space-y-1.5 z-10">
          <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.01em', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>SHYAM AGRO Tools Admin Control</h2>
          <p style={{ color: '#d1fae5', fontSize: '13.5px', fontWeight: 500, lineHeight: 1.6, maxWidth: '520px', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
            Welcome to the Central Administration Interface. Below is an index of all available features, controls, forms, and database listings.
          </p>
        </div>
        <NavLink 
          to="/admin/settings/form" 
          className="flex items-center gap-2 bg-white text-emerald-900 font-bold hover:bg-emerald-50 px-4 py-2.5 rounded-lg shadow transition-colors text-sm z-10"
        >
          <Settings size={16} /> Quick Settings
        </NavLink>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">{section.title}</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed font-medium">{section.desc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {section.links.map((link, lIdx) => (
                <NavLink 
                  key={lIdx} 
                  to={link.path} 
                  className="flex items-center justify-between border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-200 p-3 rounded-lg transition-all text-xs font-semibold text-slate-700 hover:text-emerald-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">{link.icon}</span>
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight size={12} className="text-slate-400" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Security status bar */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Shield size={14} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Security Status</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#15803d' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            All Systems Secure
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '6px 10px', flex: '1 1 auto', minWidth: '160px' }}>
            <KeyRound size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>JWT Key Rotation</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>Every 30 days · Next: 15 Aug 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '6px 10px', flex: '1 1 auto', minWidth: '160px' }}>
            <ClipboardCheck size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Audit</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>01 Aug 2026 · Passed (0 violations)</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '6px 10px', flex: '1 1 auto', minWidth: '160px' }}>
            <HardDrive size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Backup</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>Today at 04:00 AM · Auto-snapshot ✓</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '6px 10px', flex: '1 1 auto', minWidth: '160px' }}>
            <Lock size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Encryption</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>TLS 1.3 · AES-256 at rest</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableOfContent;
