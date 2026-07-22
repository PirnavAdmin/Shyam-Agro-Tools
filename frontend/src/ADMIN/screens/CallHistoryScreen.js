import React, { useState, useEffect } from 'react';
import { Phone, Search, Filter, Plus, Calendar, ShieldCheck, AlertCircle, RefreshCw, Star, X } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

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

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    calledByRep: 'Admin Rep',
    status: 'Completed',
    priority: 'Low',
    notesSummary: '',
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
      
      setCalls(data.calls || data.Calls || []);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone) {
      setFormError('Customer Name and Phone are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        calledByRep: formData.calledByRep,
        status: formData.status,
        priority: formData.priority,
        notesSummary: formData.notesSummary,
        lastCallTime: new Date().toISOString(),
        callbackTime: formData.callbackTime ? new Date(formData.callbackTime).toISOString() : null,
        isQualifiedLead: formData.isQualifiedLead
      };

      const res = await fetch(`${getApiDomain()}/api/CallHistory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create call log.');

      setIsModalOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        calledByRep: 'Admin Rep',
        status: 'Completed',
        priority: 'Low',
        notesSummary: '',
        callbackTime: '',
        isQualifiedLead: false
      });
      fetchLogs();
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="catalog-page font-poppins" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      
      {/* Header */}
      <section className="catalog-header" style={{ padding: '16px 20px', marginBottom: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Operations ledger</span>
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Call History</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Log customer interactions, advisory follow-ups, and sales callbacks.</p>
        </div>
        <div className="catalog-header__actions">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="catalog-btn catalog-btn--primary" 
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            <Plus size={14} /> Log Call
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <span className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Phone size={20} /></span>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Total Logged Calls</span>
            <strong className="text-xl font-bold text-slate-700">{metrics.totalCalls}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <span className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Calendar size={20} /></span>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Today's Callbacks</span>
            <strong className="text-xl font-bold text-slate-700">{metrics.todayFollowUps}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <span className="p-3 bg-red-50 text-red-600 rounded-lg"><Phone size={20} /></span>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Total Follow-ups</span>
            <strong className="text-xl font-bold text-slate-700">{metrics.totalFollowUps}</strong>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Star size={20} /></span>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Qualified Leads</span>
            <strong className="text-xl font-bold text-slate-700">{metrics.qualifiedLeads}</strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="catalog-card" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        {error && <div className="catalog-alert catalog-alert--danger">{error}</div>}
        <div className="catalog-filterbar" style={{ padding: '12px 16px', background: '#fff', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '70%', alignItems: 'center' }}>
            <div className="catalog-search" style={{ maxWidth: '320px', flex: '1' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search Customer name, Rep, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 32px', fontSize: '13px' }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
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
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button onClick={fetchLogs} className="catalog-btn" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Data Table */}
        <div className="catalog-table-wrap">
          <table className="catalog-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px' }}>Customer</th>
                <th style={{ padding: '10px 16px' }}>Representative</th>
                <th style={{ padding: '10px 16px' }}>Last Call</th>
                <th style={{ padding: '10px 16px' }}>Callback Time</th>
                <th style={{ padding: '10px 16px' }}>Priority</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px' }}>Notes & Detail Summary</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px' }}>Loading interactions...</td>
                </tr>
              ) : calls.length > 0 ? (
                calls.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        {c.customerName}
                        {c.isQualifiedLead && <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-black">LEAD</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.customerPhone}</div>
                      {c.customerEmail && <div className="text-[11px] text-slate-400">{c.customerEmail}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }} className="font-semibold text-slate-600">{c.calledByRep}</td>
                    <td style={{ padding: '12px 16px' }} className="text-slate-500">{c.lastCall}</td>
                    <td style={{ padding: '12px 16px' }} className="text-slate-500 font-medium">
                      {c.callback ? (
                        <span className={c.isTodayFollowUp ? 'text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded' : ''}>
                          {c.callback}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`catalog-badge ${c.priority === 'HIGH' ? 'catalog-badge--low' : (c.priority === 'MEDIUM' ? 'catalog-badge--stock' : 'catalog-badge--out')}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'Completed' ? 'bg-green-100 text-green-700' : (c.status === 'Follow-Up' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }} className="text-slate-600 truncate" title={c.notesSummary}>
                      {c.notesSummary}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px' }}>No interaction logs recorded matching parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Popup Log Call Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyBetween: 'true', alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Log Customer Call</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleLogCallSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formError && <div className="catalog-alert catalog-alert--danger" style={{ margin: 0 }}>{formError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Customer Phone *</label>
                  <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Customer Email</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Representative Name</label>
                  <input type="text" name="calledByRep" value={formData.calledByRep} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Priority Level</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Interaction Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                    <option value="Completed">Completed</option>
                    <option value="Follow-Up">Follow-Up Needed</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Line Busy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Callback Schedule (Optional)</label>
                  <input type="datetime-local" name="callbackTime" value={formData.callbackTime} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="isQualifiedLead" id="isQualifiedLead" checked={formData.isQualifiedLead} onChange={handleInputChange} />
                <label htmlFor="isQualifiedLead" style={{ fontSize: '12px', fontWeight: 'semibold', color: '#475569', cursor: 'pointer' }}>Mark this client as a Qualified Lead</label>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes & Detail Summary</label>
                <textarea name="notesSummary" value={formData.notesSummary} onChange={handleInputChange} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="catalog-btn" style={{ padding: '6px 12px' }}>Cancel</button>
                <button type="submit" className="catalog-btn catalog-btn--primary" style={{ padding: '6px 12px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Log'}
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
