import React from 'react';
import { X, Mail, Phone, MapPin, Shield, Calendar, Building, FileText, CheckCircle2, XCircle } from 'lucide-react';

const NewSupplierPopup = ({ registration, onClose, onStatusChange }) => {
  if (!registration) return null;

  const categoryLabels = {
    tools: 'Hand Tools',
    agri: 'Agri Equipment',
    power: 'Power Tools'
  };

  const getCategoryLabel = (cat) => categoryLabels[cat] || cat || 'Unassigned';

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
      style={{ zIndex: 9999 }} // Set extremely high z-index to stay above topbar
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-4 text-white flex justify-between items-center relative">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Registration Ticket Review
            </span>
            <h2 className="text-lg font-bold mt-1">{registration.businessName || 'Business Registration'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body in Landscape Layout */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Left Column: Tracking Card & Actions */}
          <div className="md:col-span-1 space-y-4 flex flex-col justify-between">
            {/* Tracking ID visual box */}
            <div className="bg-emerald-50/50 border border-dashed border-emerald-300 rounded-lg p-5 text-center flex flex-col items-center justify-center">
              <span className="text-slate-500 font-medium text-xs block mb-1">Your Request Tracking ID:</span>
              <strong className="text-emerald-600 font-extrabold text-2xl tracking-wide select-all">
                {registration.id}
              </strong>
              <div className="mt-2 flex items-center gap-2">
                <span style={{ fontSize: '10px' }} className="text-slate-400">Status:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadgeClass(registration.status)}`}>
                  {registration.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Action Buttons Panel */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2 text-center">
                Action Center
              </h4>
              {registration.status === 'Pending' && onStatusChange ? (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Approved')} 
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} /> Approve Ticket
                  </button>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Rejected')} 
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <XCircle size={14} /> Reject Ticket
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-2">
                  Ticket status is <strong>{registration.status}</strong>. No further action needed.
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: Registration Details Grid */}
          <div className="md:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Owner Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-emerald-600" /> Owner Details
                </h3>
                <div className="space-y-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <span className="font-semibold text-slate-800 text-sm">{registration.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile Number</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-slate-400" /> {registration.mobile || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-slate-400" /> {registration.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1 flex items-center gap-1.5">
                  <Building size={13} className="text-emerald-600" /> Business Details
                </h3>
                <div className="space-y-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Business / Shop Name</span>
                    <span className="font-semibold text-slate-800 text-sm">{registration.businessName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Product Category</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Shield size={11} className="text-slate-400" /> {getCategoryLabel(registration.category)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">GSTIN Number</span>
                    <span className="font-semibold text-slate-800 font-mono tracking-wider">{registration.gstin || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address & Timestamp */}
            <div className="space-y-3 pt-1">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider border-b pb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-600" /> Business Location &amp; Timestamp
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-slate-400 block text-[10px] mb-0.5">Registered Address</span>
                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {registration.address || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1 pl-5">
                  <Calendar size={11} />
                  <span>Ticket Raised At: {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors text-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSupplierPopup;
