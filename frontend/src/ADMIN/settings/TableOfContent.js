import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Box, Users, ShoppingCart, Target, Mail, Award, FileText, ChevronRight } from 'lucide-react';

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
        { name: 'Orders Ledger', path: '/admin/orders/list', icon: <ShoppingCart size={16} /> },
        { name: 'Tracking Order', path: '/admin/orders/tracking', icon: <ShoppingCart size={16} /> },
        { name: 'Shipping Order', path: '/admin/orders/shipping', icon: <ShoppingCart size={16} /> }
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
          <h2 className="text-2xl font-bold">SHYAM AGRO Tools Admin Control</h2>
          <p className="text-emerald-100/90 text-sm leading-relaxed max-w-xl font-medium">
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

      {/* Quick stats footer info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-600 text-xs font-semibold">
        <FileText size={16} className="text-slate-400" />
        <span>Platform Security Active. System operating under secure JWT keys. Last backup taken: Today at 04:00 AM.</span>
      </div>
    </div>
  );
};

export default TableOfContent;
