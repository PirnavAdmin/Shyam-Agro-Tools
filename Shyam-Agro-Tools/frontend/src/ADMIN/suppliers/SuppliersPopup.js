import React from 'react';
import { X, Mail, Phone, MapPin, Truck, DollarSign, Award, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatSupplierCurrency } from './SuppliersList';

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified' || s === 'approved') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
        <CheckCircle2 size={10} /> Verified
      </span>
    );
  }
  if (s.includes('reject') || s === 'inactive') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
        <XCircle size={10} /> {status || 'Rejected'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
      <Clock size={10} /> {status || 'Pending'}
    </span>
  );
};

const SuppliersPopup = ({ supplier, onClose }) => {
  if (!supplier) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-fade-in" 
      onClick={onClose}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          fontFamily: 'Inter, system-ui, sans-serif',
          marginTop: '40px',
          marginBottom: '40px',
          flexShrink: 0
        }}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex justify-between items-start relative flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              {supplier.category || 'General'}
            </span>
            <h2 className="text-xl font-bold mt-2">{supplier.name}</h2>
            <p className="text-emerald-100 text-xs mt-0.5">Supplier Profile: #{supplier.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          
          {/* Quick Metrics Row */}
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Rating</span>
              <strong className="text-slate-800 text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                <Award size={14} className="text-amber-500" /> {supplier.rating || 'N/A'}/5
              </strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Active POs</span>
              <strong className="text-slate-800 text-sm font-bold block mt-0.5">{supplier.activePo ?? 0}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Monthly Spend</span>
              <strong className="text-slate-800 text-sm font-bold block mt-0.5">{formatSupplierCurrency(supplier.monthlySpend)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Contact Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-600" /> Contact Info
              </h3>
              <div className="space-y-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Contact Person</span>
                  <span className="font-semibold text-slate-800">{supplier.contactPerson || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><Mail size={12} /> {supplier.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><Phone size={12} /> {supplier.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Commercial Terms */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" /> Commercial Terms
              </h3>
              <div className="space-y-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Payment Terms</span>
                  <span className="font-semibold text-slate-800">{supplier.terms || 'COD'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lead Time</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5"><Truck size={12} /> {supplier.leadTime || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Onboarding Status</span>
                  <div className="mt-1">
                    {getStatusBadge(supplier.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address and Products Coverage */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-600" /> Procurement Coverage &amp; Notes
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">Registered Location</span>
                  <span className="text-slate-700">{supplier.city || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Supplied Products</span>
                <p className="text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">{supplier.products || 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuppliersPopup;
