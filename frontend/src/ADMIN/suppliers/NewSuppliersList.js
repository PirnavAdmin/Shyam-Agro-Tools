import React, { useMemo, useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Mail, 
  Phone
} from 'lucide-react';
import '../catalog/adminModule.css';
import { Pagination } from '../components/ActionButtons';
import NewSupplierPopup from './NewSupplierPopup';
import { fetchSuppliers, updateSupplierStatus } from './suppliersApi';



const categoryLabels = {
  tools: 'Hand Tools',
  agri: 'Agri Equipment',
  power: 'Power Tools'
};

const NewSuppliersList = () => {
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Popup detail state
  const [activePopupReg, setActivePopupReg] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load from local storage
  const loadRegistrations = async () => {
    try {
      const data = await fetchSuppliers();
      const tickets = (data || []).filter(s => s.status === 'Pending' || s.status === 'Approved' || s.status === 'Rejected');
      setRegistrations(tickets);
    } catch (err) {
      console.error('Failed to load registrations from API:', err);
      setRegistrations([]);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSupplierStatus(id, newStatus);
      setRegistrations(prev => prev.map(reg => reg.id === id ? { ...reg, status: newStatus } : reg));
      if (activePopupReg && activePopupReg.id === id) {
        setActivePopupReg(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status on API:', err);
      alert('Failed to update status on server: ' + err.message);
    }
  };

  const filteredRegistrations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return registrations.filter((reg) => {
      const matchesSearch = [
        reg.id,
        reg.name,
        reg.businessName,
        reg.email,
        reg.mobile,
        reg.gstin,
        reg.address
      ].join(' ').toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'All' || reg.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || reg.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [registrations, searchTerm, statusFilter, categoryFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const summary = useMemo(() => {
    return registrations.reduce(
      (acc, reg) => ({
        pending: acc.pending + (reg.status === 'Pending' ? 1 : 0),
        approved: acc.approved + (reg.status === 'Approved' ? 1 : 0),
        rejected: acc.rejected + (reg.status === 'Rejected' ? 1 : 0)
      }),
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [registrations]);

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const pagedRegistrations = filteredRegistrations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
            <CheckCircle size={10} /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
            <XCircle size={10} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
            <Clock size={10} /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="suppliers-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      
      {/* Metrics Row */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Procurement</span>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>New Seller Tickets</h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Review and verify self-registered sellers requesting to join Shyam Agro.</p>
        </div>

        <div className="suppliers-metrics" style={{ display: 'flex', gap: '12px' }}>
          <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-center min-w-[90px]">
            <span style={{ fontSize: '9px', color: '#b45309', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Pending</span>
            <strong style={{ fontSize: '14px', color: '#b45309' }}>{summary.pending}</strong>
          </div>
          <div className="bg-green-50/50 p-2.5 rounded-lg border border-green-100 text-center min-w-[90px]">
            <span style={{ fontSize: '9px', color: '#047857', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Approved</span>
            <strong style={{ fontSize: '14px', color: '#047857' }}>{summary.approved}</strong>
          </div>
          <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100 text-center min-w-[90px]">
            <span style={{ fontSize: '9px', color: '#b91c1c', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Rejected</span>
            <strong style={{ fontSize: '14px', color: '#b91c1c' }}>{summary.rejected}</strong>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="catalog-card" style={{ margin: 0 }}>
        <div className="catalog-card__header" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Registration Tickets</h2>
            <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>{filteredRegistrations.length} tickets matching filters</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="catalog-filterbar suppliers-filterbar" style={{ padding: '8px 16px', gap: '10px' }}>
          <div className="catalog-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search by ID, name, business, phone, GSTIN..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px 4px 32px' }}
            />
          </div>

          <label className="catalog-filter">
            <Filter size={14} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ fontSize: '12px', padding: '4px' }}>
              <option value="All">All categories</option>
              <option value="tools">Hand Tools</option>
              <option value="agri">Agri Equipment</option>
              <option value="power">Power Tools</option>
            </select>
          </label>

          <label className="catalog-filter">
            <Clock size={14} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ fontSize: '12px', padding: '4px' }}>
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>
        </div>

        {/* Grid Table */}
        <div className="catalog-table-wrap">
          <table className="catalog-table suppliers-table">
            <thead>
              <tr style={{ fontSize: '11px' }}>
                <th style={{ padding: '8px 12px' }}>Reference ID</th>
                <th style={{ padding: '8px 12px' }}>Business Details</th>
                <th style={{ padding: '8px 12px' }}>Contact Person</th>
                <th style={{ padding: '8px 12px' }}>Product Category</th>
                <th style={{ padding: '8px 12px' }}>GSTIN Number</th>
                <th style={{ padding: '8px 12px' }}>Date Raised</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '8px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRegistrations.map((reg) => (
                <tr 
                  key={reg.id} 
                  style={{ fontSize: '12px', cursor: 'pointer' }}
                  onClick={() => setActivePopupReg(reg)}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f766e' }}>
                    {reg.id}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {reg.businessName}
                    </div>
                    <div className="supplier-location" style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                      {reg.address}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                      {reg.name}
                    </div>
                    <div className="supplier-contact-line" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      <Phone size={10} /> {reg.mobile}
                    </div>
                    <div className="supplier-contact-line" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b' }}>
                      <Mail size={10} /> {reg.email}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="catalog-badge" style={{ fontSize: '10px' }}>
                      {categoryLabels[reg.category] || reg.category}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 500 }}>
                    {reg.gstin}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>
                    {new Date(reg.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {getStatusBadge(reg.status)}
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '8px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="catalog-btn catalog-btn--icon" 
                      type="button" 
                      title="View Registration Details"
                      onClick={() => setActivePopupReg(reg)}
                      style={{ padding: '4px 6px' }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredRegistrations.length && (
                <tr>
                  <td colSpan="8">
                    <div className="suppliers-empty" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No new seller registration tickets match the current filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRegistrations.length}
          itemsPerPage={itemsPerPage}
        />
      </section>

      {/* Detail popup modal */}
      {activePopupReg && (
        <NewSupplierPopup 
          registration={activePopupReg} 
          onClose={() => setActivePopupReg(null)} 
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default NewSuppliersList;
