import React, { useState, useEffect } from 'react';
import { Phone, Search, Plus, Calendar, AlertCircle, RefreshCw, Star, X, Edit2, Trash2, Clock, UserCheck, MessageSquare } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { AnimatedEditButton, OutlookDeleteButton } from '../components/ActionButtons';
import '../catalog/adminModule.css';

export const formatFollowUpDate = (dateVal, isLead = false) => {
  if (!dateVal) {
    if (isLead) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(10, 0, 0, 0);
      return nextDay.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return '—';
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) {
    if (isLead) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(10, 0, 0, 0);
      return nextDay.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return '—';
  }

  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const CallHistoryScreen = () => {
  const [calls, setCalls] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    todayFollowUps: 0,
    totalFollowUps: 0,
    qualifiedLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

  // Form Modal state (Log New / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [highPriorityAutoApplied, setHighPriorityAutoApplied] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    calledByRep: 'Admin Rep',
    status: 'Completed',
    priority: 'Low',
    notesSummary: '',
    lastCallTime: '',
    callbackTime: '',
    isQualifiedLead: false
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'All Statuses') params.append('status', statusFilter);
      if (priorityFilter !== 'All Priorities') params.append('priority', priorityFilter);

      const res = await fetch(`${getApiDomain()}/api/CallHistory?${params.toString()}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const rawCalls = data.calls || data.Calls || [];
      const formattedCalls = rawCalls.map(c => {
        const isLead = Boolean(c.isQualifiedLead || c.status === 'Follow-Up');
        const rawCb = c.callback || c.callbackTime || c.nextFollowUp;
        return {
          ...c,
          isQualifiedLead: isLead,
          callbackFormatted: formatFollowUpDate(rawCb, isLead)
        };
      });

      setCalls(formattedCalls);
      setMetrics({
        totalCalls: data.totalCalls ?? data.TotalCalls ?? 0,
        todayFollowUps: data.todayFollowUps ?? data.TodayFollowUps ?? 0,
        totalFollowUps: data.totalFollowUps ?? data.TotalFollowUps ?? 0,
        qualifiedLeads: data.qualifiedLeads ?? data.QualifiedLeads ?? 0
      });
    } catch (err) {
      console.error("Error fetching call logs:", err);
      setError('Could not fetch call history from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, statusFilter, priorityFilter]);

  // Helper: next business day at 10:00 AM ISO string
  const getNextBusinessDayAt10AM = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // Skip Saturday (6) and Sunday (0)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newVal };

      // HIGH priority auto-workflow: upgrade status + schedule callback
      if (name === 'priority' && newVal === 'High') {
        const statusNeedsUpgrade = prev.status === 'Completed' || prev.status === 'Pending' || prev.status === 'No Answer' || prev.status === 'Busy';
        if (statusNeedsUpgrade) updated.status = 'Follow-Up';
        if (!prev.callbackTime) {
          const cb = getNextBusinessDayAt10AM();
          updated.callbackTime = cb.toISOString().slice(0, 16);
        }
        setHighPriorityAutoApplied(true);
      } else if (name === 'priority' && newVal !== 'High') {
        setHighPriorityAutoApplied(false);
      }

      return updated;
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      calledByRep: 'Admin Rep',
      status: 'Completed',
      priority: 'Low',
      notesSummary: '',
      lastCallTime: '',
      callbackTime: '',
      isQualifiedLead: false
    });
    setHighPriorityAutoApplied(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      customerName: c.customerName || '',
      customerPhone: c.customerPhone || '',
      customerEmail: c.customerEmail || '',
      calledByRep: c.calledByRep || 'Admin Rep',
      status: c.status || 'Completed',
      priority: c.priority || 'Low',
      notesSummary: c.notesSummary || '',
      lastCallTime: c.lastCall ? new Date(c.lastCall).toISOString().slice(0, 16) : '',
      callbackTime: c.callback ? new Date(c.callback).toISOString().slice(0, 16) : '',
      isQualifiedLead: Boolean(c.isQualifiedLead)
    });
    setHighPriorityAutoApplied(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setFormError('Customer Name and Phone are required.');
      return;
    }

    if (formData.callbackTime) {
      const selectedDate = new Date(formData.callbackTime);
      const now = new Date();
      if (selectedDate.getTime() < now.getTime() - 60000) {
        setFormError('Callback time cannot be in the past. Please select a future date and time.');
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    try {
      let finalCallbackIso = null;
      if (formData.callbackTime) {
        finalCallbackIso = new Date(formData.callbackTime).toISOString();
      } else if (formData.isQualifiedLead || formData.status === 'Follow-Up' || formData.priority === 'High') {
        // HIGH priority always gets a callback scheduled automatically
        finalCallbackIso = getNextBusinessDayAt10AM().toISOString();
      }

      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail?.trim() || '',
        calledByRep: formData.calledByRep?.trim() || 'Admin Rep',
        status: formData.status,
        priority: formData.priority,
        notesSummary: formData.notesSummary?.trim() || '',
        lastCallTime: formData.lastCallTime ? new Date(formData.lastCallTime).toISOString() : new Date().toISOString(),
        callbackTime: finalCallbackIso,
        callbackTimeSpecified: Boolean(finalCallbackIso),
        isQualifiedLead: formData.isQualifiedLead
      };

      const url = editingId 
        ? `${getApiDomain()}/api/CallHistory/${editingId}`
        : `${getApiDomain()}/api/CallHistory`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${editingId ? 'update' : 'create'} call log.`);
      }

      setIsModalOpen(false);
      setEditingId(null);
      fetchLogs();
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCall = async (id) => {
    if (!window.confirm('Are you sure you want to delete this CRM call log entry?')) return;
    try {
      const res = await fetch(`${getApiDomain()}/api/CallHistory/${id}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        setCalls(prev => prev.filter(c => String(c.id) !== String(id)));
      } else {
        alert('Failed to delete call log.');
      }
    } catch (err) {
      console.error('Delete call log error:', err);
      alert('Error deleting call log.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="catalog-page font-poppins" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      
      {/* Page Header */}
      <section className="catalog-header" style={{ padding: '20px 24px', marginBottom: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">CRM & Sales Operations</span>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>CRM & Call Logs</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#64748b' }}>Log customer interactions, advisory follow-ups, lead qualifications, and scheduled sales callbacks.</p>
        </div>
        <div className="catalog-header__actions">
          <button 
            onClick={handleOpenAddModal}
            className="catalog-btn catalog-btn--primary" 
            style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px', fontWeight: '700', gap: '8px' }}
          >
            <Plus size={16} /> Log New Call
          </button>
        </div>
      </section>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <span className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl"><Phone size={22} /></span>
          <div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Calls Logged</span>
            <strong className="text-2xl font-black text-slate-800">{metrics.totalCalls}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <span className="p-3.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={22} /></span>
          <div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Callbacks</span>
            <strong className="text-2xl font-black text-amber-600">{metrics.todayFollowUps}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <span className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={22} /></span>
          <div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Follow-ups</span>
            <strong className="text-2xl font-black text-slate-800">{metrics.totalFollowUps}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <span className="p-3.5 bg-sky-50 text-sky-600 rounded-xl"><Star size={22} /></span>
          <div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Qualified Leads</span>
            <strong className="text-2xl font-black text-sky-700">{metrics.qualifiedLeads}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="catalog-card" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {error && <div className="catalog-alert catalog-alert--danger" style={{ margin: '16px' }}>{error}</div>}
        
        {/* Toolbar Controls */}
        <div className="catalog-filterbar" style={{ padding: '16px 20px', background: '#fff', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '700px', alignItems: 'center' }}>
            <div className="catalog-search" style={{ maxWidth: '340px', flex: '1' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search Customer, Rep, Phone, Notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', fontSize: '13px', borderRadius: '10px' }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none', fontWeight: '600', color: '#334155' }}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Follow-Up">Follow-Up Needed</option>
              <option value="No Answer">No Answer</option>
              <option value="Busy">Line Busy</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none', fontWeight: '600', color: '#334155' }}
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
          
          <button 
            onClick={fetchLogs} 
            className="catalog-btn" 
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
        </div>

        {/* Call Logs Table */}
        <div className="catalog-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="catalog-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Representative</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Call</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Callback Schedule</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes & Detail Summary</th>
                <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="catalog-center-cell" style={{ padding: '40px', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin inline-block mr-2 text-emerald-600" /> Loading CRM interaction logs...
                  </td>
                </tr>
              ) : calls.length > 0 ? (
                calls.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Customer Info */}
                    <td style={{ padding: '14px 18px' }}>
                      <div className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                        {c.customerName}
                        {c.isQualifiedLead && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide border border-emerald-200">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-slate-400" /> {c.customerPhone}
                      </div>
                      {c.customerEmail && (
                        <div className="text-[11px] text-slate-400 mt-0.5 font-normal">{c.customerEmail}</div>
                      )}
                    </td>

                    {/* Sales Representative */}
                    <td style={{ padding: '14px 18px' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                          {getInitials(c.calledByRep)}
                        </span>
                        <span className="font-semibold text-slate-700 text-[13px]">{c.calledByRep || 'Admin Rep'}</span>
                      </div>
                    </td>

                    {/* Last Call Time */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }} className="text-slate-700 font-semibold text-[13px]">
                      {c.lastCall || '—'}
                    </td>

                    {/* Callback Schedule */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {c.callbackFormatted && c.callbackFormatted !== '—' ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold ${
                          c.isTodayFollowUp 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          <Clock size={13} className={c.isTodayFollowUp ? 'text-amber-700' : 'text-slate-500'} />
                          {c.callbackFormatted}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[12px]">No callback set</span>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                        c.priority === 'HIGH' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : c.priority === 'MEDIUM' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {c.priority || 'LOW'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide border ${
                        c.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : c.status === 'Follow-Up' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Notes Summary */}
                    <td style={{ padding: '14px 18px', maxWidth: '280px' }}>
                      {c.notesSummary ? (
                        <div className="text-slate-600 text-[12px] leading-relaxed line-clamp-2" title={c.notesSummary}>
                          {c.notesSummary}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[12px]">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        <AnimatedEditButton onClick={() => handleOpenEditModal(c)} tooltip="Edit Log" />
                        <OutlookDeleteButton onClick={() => handleDeleteCall(c.id)} tooltip="Delete Log" />
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="catalog-center-cell" style={{ padding: '40px', color: '#64748b' }}>
                    No call history records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Call Log Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                {editingId ? 'Edit CRM Call Log' : 'Log New Customer Interaction'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogCallSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && <div className="catalog-alert catalog-alert--danger" style={{ margin: 0 }}>{formError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Name *</label>
                  <input 
                    type="text" 
                    name="customerName" 
                    value={formData.customerName} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Phone *</label>
                  <input 
                    type="text" 
                    name="customerPhone" 
                    value={formData.customerPhone} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Email</label>
                <input 
                  type="email" 
                  name="customerEmail" 
                  value={formData.customerEmail} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Sales Representative</label>
                  <input 
                    type="text" 
                    name="calledByRep" 
                    value={formData.calledByRep} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Priority Level</label>
                  <select 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1px solid ${formData.priority === 'High' ? '#f97316' : '#cbd5e1'}`, borderRadius: '10px', background: '#fff', fontWeight: formData.priority === 'High' ? '700' : '400', color: formData.priority === 'High' ? '#ea580c' : 'inherit' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* High Priority Auto-Workflow Banner */}
              {highPriorityAutoApplied && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '16px', marginTop: '1px' }}>⚡</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', margin: '0 0 2px 0' }}>High Priority Workflow Applied</p>
                    <p style={{ fontSize: '11px', color: '#9a3412', margin: 0, lineHeight: '1.5' }}>
                      Status auto-set to <strong>Follow-Up</strong> and a callback has been scheduled for the next business day at <strong>10:00 AM</strong>. You can adjust the callback time below.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Interaction Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#fff' }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Follow-Up">Follow-Up Needed</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Line Busy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Callback Schedule (Optional)</label>
                  <input 
                    type="datetime-local" 
                    name="callbackTime" 
                    value={formData.callbackTime} 
                    onChange={handleInputChange} 
                    min={new Date().toISOString().slice(0, 16)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Last Call Time</label>
                  <input 
                    type="datetime-local" 
                    name="lastCallTime" 
                    value={formData.lastCallTime} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  name="isQualifiedLead" 
                  id="isQualifiedLead" 
                  checked={formData.isQualifiedLead} 
                  onChange={handleInputChange} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                />
                <label htmlFor="isQualifiedLead" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                  Mark client as a Qualified Lead
                </label>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Notes & Detail Summary</label>
                <textarea 
                  name="notesSummary" 
                  value={formData.notesSummary} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', minHeight: '80px', resize: 'vertical' }} 
                  placeholder="Enter interaction notes, product inquiries, or follow-up topics..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="catalog-btn" style={{ padding: '8px 16px', borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="catalog-btn catalog-btn--primary" style={{ padding: '8px 18px', borderRadius: '10px', fontWeight: '700' }} disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Update Log' : 'Save Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CallHistoryScreen;
