import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  Trash2,
  Edit
} from 'lucide-react';
import '../catalog/adminModule.css';
import { Pagination } from '../components/ActionButtons';
import SuppliersPopup from './SuppliersPopup';
import { fetchSuppliers, deleteSupplier } from './suppliersApi';

export const supplierCategories = [
  'Farm Tools',
  'Irrigation',
  'Machinery',
  'Seeds & Inputs',
  'Safety Gear',
  'Packaging'
];

export const suppliers = [
  {
    id: 'SUP-001',
    name: 'KisanKraft Ltd.',
    category: 'Farm Tools',
    contactPerson: 'Amit Sharma',
    email: 'procurement@kisankraft.in',
    phone: '+91 80411-23456',
    city: 'Bengaluru, Karnataka',
    status: 'Verified',
    leadTime: '4-6 days',
    rating: 4.8,
    activePo: 7,
    monthlySpend: 286000,
    lastSupply: '2026-05-27',
    terms: 'Net 15',
    products: 'Tillers, pruning tools, crop cutters'
  },
  {
    id: 'SUP-002',
    name: 'AgroEquip Co.',
    category: 'Irrigation',
    contactPerson: 'Neha Patel',
    email: 'orders@agroequip.co.in',
    phone: '+91 98250-88221',
    city: 'Ahmedabad, Gujarat',
    status: 'Verified',
    leadTime: '3-5 days',
    rating: 4.6,
    activePo: 4,
    monthlySpend: 174500,
    lastSupply: '2026-05-24',
    terms: 'Advance 30%',
    products: 'Drip kits, pumps, hose connectors'
  },
  {
    id: 'SUP-003',
    name: 'Bharat Agro Machinery',
    category: 'Machinery',
    contactPerson: 'Rakesh Verma',
    email: 'sales@bharatagromachinery.com',
    phone: '+91 98110-77144',
    city: 'Ludhiana, Punjab',
    status: 'Review',
    leadTime: '8-12 days',
    rating: 4.1,
    activePo: 2,
    monthlySpend: 412000,
    lastSupply: '2026-05-18',
    terms: 'Net 30',
    products: 'Brush cutters, seed drill attachments'
  },
  {
    id: 'SUP-004',
    name: 'GreenSafe Protective Works',
    category: 'Safety Gear',
    contactPerson: 'Farhan Khan',
    email: 'dispatch@greensafe.in',
    phone: '+91 99888-44112',
    city: 'Delhi NCR',
    status: 'Verified',
    leadTime: '2-4 days',
    rating: 4.7,
    activePo: 3,
    monthlySpend: 68400,
    lastSupply: '2026-05-29',
    terms: 'Net 7',
    products: 'Farm gloves, masks, eye protection'
  },
  {
    id: 'SUP-005',
    name: 'Krishi Seed & Inputs',
    category: 'Seeds & Inputs',
    contactPerson: 'Sandeep Rao',
    email: 'hello@krishiinputs.in',
    phone: '+91 99002-66718',
    city: 'Hyderabad, Telangana',
    status: 'Pending',
    leadTime: '5-7 days',
    rating: 3.9,
    activePo: 1,
    monthlySpend: 92000,
    lastSupply: '2026-05-11',
    terms: 'Advance 50%',
    products: 'Hybrid seeds, soil additives'
  },
  {
    id: 'SUP-006',
    name: 'PackRight Rural Logistics',
    category: 'Packaging',
    contactPerson: 'Meera Iyer',
    email: 'support@packright.in',
    phone: '+91 94444-21890',
    city: 'Chennai, Tamil Nadu',
    status: 'Inactive',
    leadTime: '6-9 days',
    rating: 3.5,
    activePo: 0,
    monthlySpend: 18500,
    lastSupply: '2026-04-30',
    terms: 'COD',
    products: 'Cartons, tapes, woven sacks'
  }
];

export const formatSupplierCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const supplierStatusMeta = {
  Verified: { icon: CheckCircle2, className: 'supplier-status--verified' },
  Pending: { icon: AlertTriangle, className: 'supplier-status--pending' },
  Review: { icon: ShieldCheck, className: 'supplier-status--review' },
  Inactive: { icon: AlertTriangle, className: 'supplier-status--inactive' }
};

const SupplierStatusBadge = ({ status }) => {
  const meta = supplierStatusMeta[status] || supplierStatusMeta.Pending;
  const Icon = meta.icon;

  return (
    <span className={`supplier-status ${meta.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '12px' }}>
      <Icon size={12} />
      {status}
    </span>
  );
};

const SuppliersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Popup detail state
  const [activePopupSupplier, setActivePopupSupplier] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [suppliersList, setSuppliersList] = useState([]);

  const loadSuppliers = async () => {
    try {
      const data = await fetchSuppliers();
      const approvedOnly = (data || []).filter(s => s.status !== 'Pending' && s.status !== 'Rejected');
      setSuppliersList(approvedOnly);
    } catch (err) {
      console.error('Failed to fetch suppliers from API:', err);
      setSuppliersList([]);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteSupplier(id);
      setSuppliersList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      alert('Failed to delete supplier: ' + err.message);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return suppliersList.filter((supplier) => {
      const matchesSearch = [
        supplier.id,
        supplier.name,
        supplier.contactPerson,
        supplier.email,
        supplier.phone,
        supplier.city,
        supplier.products
      ].join(' ').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || supplier.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliersList, categoryFilter, searchTerm, statusFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const summary = useMemo(() => {
    return suppliersList.reduce(
      (acc, supplier) => ({
        verified: acc.verified + (supplier.status === 'Verified' ? 1 : 0),
        activePo: acc.activePo + supplier.activePo,
        spend: acc.spend + supplier.monthlySpend
      }),
      { verified: 0, activePo: 0, spend: 0 }
    );
  }, [suppliersList]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const pagedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="suppliers-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      
      {/* Compact Header Section with Sized Down Metrics */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Procurement</span>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Supplier Management</h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Manage approved vendors, contacts, categories, and payment terms.</p>
        </div>

        <div className="suppliers-metrics" style={{ display: 'flex', gap: '12px' }}>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center min-w-[90px]">
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Verified</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{summary.verified}</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center min-w-[90px]">
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Active POs</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{summary.activePo}</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center min-w-[120px]">
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Spend</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{formatSupplierCurrency(summary.spend)}</strong>
          </div>
        </div>
      </section>

      <section className="catalog-card" style={{ margin: 0 }}>
        <div className="catalog-card__header" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Vendor Directory</h2>
            <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>{filteredSuppliers.length} suppliers match current filters</p>
          </div>
          <Link className="catalog-btn catalog-btn--primary" to="/admin/suppliers/add" style={{ fontSize: '11px', padding: '5px 10px' }}>
            <Plus size={13} style={{ marginRight: '4px' }} />
            Add Supplier
          </Link>
        </div>

        <div className="catalog-filterbar suppliers-filterbar" style={{ padding: '8px 16px', gap: '10px' }}>
          <div className="catalog-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search supplier, contact, city, phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px 4px 32px' }}
            />
          </div>

          <label className="catalog-filter">
            <Filter size={14} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ fontSize: '12px', padding: '4px' }}>
              <option value="All">All categories</option>
              {supplierCategories.map((category) => (
                <option value={category} key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="catalog-filter">
            <ShieldCheck size={14} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ fontSize: '12px', padding: '4px' }}>
              <option value="All">All statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Review">Review</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table suppliers-table">
            <thead>
              <tr style={{ fontSize: '11px' }}>
                <th style={{ padding: '8px 12px' }}>Supplier</th>
                <th style={{ padding: '8px 12px' }}>Contact</th>
                <th style={{ padding: '8px 12px' }}>Category</th>
                <th style={{ padding: '8px 12px' }}>Lead Time</th>
                <th className="catalog-center-cell" style={{ padding: '8px 12px' }}>Active POs</th>
                <th className="catalog-number-cell" style={{ padding: '8px 12px' }}>Monthly Spend</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '8px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedSuppliers.map((supplier) => (
                <tr 
                  key={supplier.id} 
                  style={{ fontSize: '12px', cursor: 'pointer' }}
                  onClick={() => setActivePopupSupplier(supplier)}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td style={{ padding: '6px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600 }}>{supplier.name}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>{supplier.id} | Rating {supplier.rating}/5</div>
                    <div className="supplier-location" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      <MapPin size={11} />
                      {supplier.city}
                    </div>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600 }}>{supplier.contactPerson}</div>
                    <div className="supplier-contact-line" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b' }}>
                      <Phone size={11} />
                      {supplier.phone}
                    </div>
                    <div className="supplier-contact-line" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b' }}>
                      <Mail size={11} />
                      {supplier.email}
                    </div>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span className="catalog-badge" style={{ fontSize: '10px' }}>{supplier.category}</span>
                    <div className="catalog-table__muted" style={{ fontSize: '10px', marginTop: '2px' }}>{supplier.products}</div>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <div className="supplier-lead-time" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <Truck size={12} />
                      {supplier.leadTime}
                    </div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>Last: {supplier.lastSupply}</div>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '6px 12px', fontWeight: 600 }}>{supplier.activePo}</td>
                  <td className="catalog-number-cell" style={{ padding: '6px 12px', fontWeight: 600 }}>{formatSupplierCurrency(supplier.monthlySpend)}</td>
                  <td style={{ padding: '6px 12px' }}><SupplierStatusBadge status={supplier.status} /></td>
                  <td className="catalog-center-cell" style={{ padding: '6px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button 
                        className="catalog-btn catalog-btn--icon" 
                        type="button" 
                        title="View supplier snapshot"
                        onClick={() => setActivePopupSupplier(supplier)}
                        style={{ padding: '4px 6px' }}
                      >
                        <Eye size={14} />
                      </button>
                      <Link 
                        className="catalog-btn catalog-btn--icon text-blue-600 hover:text-blue-800" 
                        to={`/admin/suppliers/edit/${supplier.id}`}
                        title="Edit supplier"
                        style={{ padding: '4px 6px', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Edit size={14} />
                      </Link>
                      <button 
                        className="catalog-btn catalog-btn--icon text-red-600 hover:text-red-800" 
                        type="button" 
                        title="Delete supplier"
                        onClick={() => handleDelete(supplier.id)}
                        style={{ padding: '4px 6px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredSuppliers.length && (
                <tr>
                  <td colSpan="8">
                    <div className="suppliers-empty">No suppliers match the current search or filters.</div>
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
          totalItems={filteredSuppliers.length}
          itemsPerPage={itemsPerPage}
        />
      </section>

      {/* Render details popup */}
      {activePopupSupplier && (
        <SuppliersPopup 
          supplier={activePopupSupplier} 
          onClose={() => setActivePopupSupplier(null)} 
        />
      )}
    </div>
  );
};

export default SuppliersList;
