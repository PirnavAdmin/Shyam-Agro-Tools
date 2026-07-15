import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Filter,
  Percent,
  Plus,
  Search,
  Tag,
  X
} from 'lucide-react';
import '../catalog/adminModule.css';
import { fetchCoupons as getCoupons, updateCoupon, deleteCoupon as apiDeleteCoupon } from './api';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDiscount = (coupon) => {
  if (coupon.type === 'Percentage') return `${coupon.discount}%`;
  if (coupon.type === 'Shipping') return 'Free Delivery';
  return formatCurrency(coupon.discount);
};

const CouponStatusBadge = ({ status }) => (
  <span className={`coupon-status coupon-status--${status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
    {status === 'Active' ? <CheckCircle2 size={10} /> : <Tag size={10} />}
    {status}
  </span>
);

const CouponEditModal = ({ coupon, onClose, onSave }) => {
  const [formData, setFormData] = useState(coupon);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="coupon-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-coupon-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="coupon-modal" style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div className="coupon-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', fontWeight: 700 }}>Campaign Editor</span>
            <h2 id="edit-coupon-title" style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0' }}>Edit Coupon: {coupon.code}</h2>
          </div>
          <button className="catalog-btn catalog-btn--icon close-modal-btn" type="button" onClick={onClose} title="Close edit coupon popup" style={{ padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
        <div className="coupon-modal__summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#64748b', display: 'block' }}>Offer</span>
            <strong style={{ color: '#1e293b' }}>{formatDiscount(formData)}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block' }}>Min Cart</span>
            <strong style={{ color: '#1e293b' }}>{formatCurrency(formData.minSpend)}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block' }}>Valid</span>
            <strong style={{ color: '#1e293b' }}>{formData.endDate}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block' }}>Status</span>
            <CouponStatusBadge status={formData.status} />
          </div>
        </div>

        <form className="catalog-form coupon-edit-form" onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
          {/* General Information */}
          <div className="coupon-modal__form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>General Info</h3>
            <div className="coupon-modal__grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="edit-code">Coupon Code</label>
                <input id="edit-code" name="code" value={formData.code} onChange={handleChange} required />
              </div>
              <div className="catalog-field">
                <label htmlFor="edit-type">Discount Type</label>
                <select id="edit-type" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Percentage">Percentage</option>
                  <option value="Flat Amount">Flat Amount</option>
                  <option value="Shipping">Free Delivery</option>
                </select>
              </div>
            </div>
            <div className="catalog-field">
              <label htmlFor="edit-description">Description</label>
              <textarea id="edit-description" name="description" rows={2} value={formData.description} onChange={handleChange} required style={{ resize: 'none' }} />
            </div>
          </div>

          {/* Discount Rules */}
          <div className="coupon-modal__form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>Discount Rules &amp; Limits</h3>
            <div className="coupon-modal__grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="edit-discount">Discount Value</label>
                <input id="edit-discount" name="discount" value={formData.discount} onChange={handleChange} required />
              </div>
              <div className="catalog-field">
                <label htmlFor="edit-maxDiscount">Max Discount Cap</label>
                <input id="edit-maxDiscount" name="maxDiscount" type="number" value={formData.maxDiscount} onChange={handleChange} />
              </div>
            </div>
            <div className="coupon-modal__grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="edit-minSpend">Min Cart Value</label>
                <input id="edit-minSpend" name="minSpend" type="number" value={formData.minSpend} onChange={handleChange} />
              </div>
              <div className="catalog-field">
                <label htmlFor="edit-usageLimit">Usage Limit</label>
                <input id="edit-usageLimit" name="usageLimit" value={formData.usageLimit} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Schedule & Status */}
          <div className="coupon-modal__form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>Schedule &amp; Status</h3>
            <div className="coupon-modal__grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="catalog-field">
                <label htmlFor="edit-startDate">Start Date</label>
                <input id="edit-startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
              </div>
              <div className="catalog-field">
                <label htmlFor="edit-endDate">End Date</label>
                <input id="edit-endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
              </div>
              <div className="catalog-field">
                <label htmlFor="edit-status">Status</label>
                <select id="edit-status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          <div className="coupon-modal__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <button className="catalog-btn cancel-btn" type="button" onClick={onClose} style={{ fontSize: '12px' }}>Cancel</button>
            <button className="catalog-btn catalog-btn--primary save-btn" type="submit" style={{ fontSize: '12px' }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CouponsList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fetch coupons on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCoupons();
        setCoupons(data);
        setError(null);
      } catch (err) {
        setError('Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchesSearch = [coupon.code, coupon.description, coupon.type]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || coupon.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const summary = useMemo(() => {
    return coupons.reduce(
      (acc, coupon) => ({
        active: acc.active + (coupon.status === 'Active' ? 1 : 0),
        usage: acc.usage + Number(coupon.usedCount || 0),
        campaigns: acc.campaigns + 1
      }),
      { active: 0, usage: 0, campaigns: 0 }
    );
  }, [coupons]);

  const toggleCouponStatus = async (id, code) => {
    const target = coupons.find((c) => c.id === id);
    if (!target || target.status === 'Expired') return;
    const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateCoupon(id, { ...target, status: newStatus });
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      setToastMessage(`Coupon "${code}" status updated to ${newStatus}.`);
      setToastType('success');
    } catch (err) {
      setToastMessage(`Failed to update status for ${code}: ${err.message || err}`);
      setToastType('error');
    }
  };

  const deleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await apiDeleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setToastMessage(`Coupon "${code}" deleted successfully.`);
      setToastType('success');
    } catch (err) {
      setToastMessage(`Failed to delete coupon ${code}: ${err.message || err}`);
      setToastType('error');
    }
  };

  const saveEditedCoupon = async (updatedCoupon) => {
    try {
      await updateCoupon(updatedCoupon.id, updatedCoupon);
      setCoupons((prev) =>
        prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c))
      );
      setEditingCoupon(null);
      setToastMessage(`Coupon "${updatedCoupon.code}" saved successfully.`);
      setToastType('success');
    } catch (err) {
      setToastMessage(`Failed to save coupon: ${err.message || err}`);
      setToastType('error');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const pagedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="catalog-loader">Loading coupons...</div>;
  }

  return (
    <div className="coupons-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {error && <div className="catalog-alert catalog-alert--error">{error}</div>}
      
      {/* Compact Title Section */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Promotions &amp; Coupons</h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Manage campaign vouchers, cart rules, and seasonal discounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Active Coupons</span>
            <strong style={{ color: '#059669', fontSize: '15px' }}>{summary.active}</strong>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Total Uses</span>
            <strong style={{ color: '#2563eb', fontSize: '15px' }}>{summary.usage}</strong>
          </div>
        </div>
      </section>

      <section className="catalog-card" style={{ margin: 0 }}>
        <div className="catalog-card__header" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Active Campaigns</h2>
            <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>{filteredCoupons.length} coupons match active filter</p>
          </div>
          <Link className="catalog-btn catalog-btn--primary" to="/admin/marketing/coupon" style={{ fontSize: '11px', padding: '5px 10px' }}>
            <Plus size={13} style={{ marginRight: '4px' }} />
            Create Coupon
          </Link>
        </div>

        <div className="catalog-filterbar" style={{ padding: '8px 16px', gap: '10px' }}>
          <div className="catalog-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search coupon code, campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px 4px 32px' }}
            />
          </div>
          <label className="catalog-filter">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: '12px', padding: '4px' }}>
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </select>
          </label>
        </div>

        <div className="coupons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', padding: '16px' }}>
          {pagedCoupons.map((coupon) => (
            <article className={`coupon-card coupon-card--${coupon.status.toLowerCase()}`} key={coupon.code} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s' }}>
              <div className="coupon-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="coupon-code" style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{coupon.code}</span>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.3 }}>{coupon.description}</p>
                </div>
                <CouponStatusBadge status={coupon.status} />
              </div>

              <div className="coupon-value-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '10px', textAlign: 'center' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Discount</span>
                  <strong style={{ color: '#0f172a' }}>{formatDiscount(coupon)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Min Cart</span>
                  <strong style={{ color: '#0f172a' }}>{formatCurrency(coupon.minSpend)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Used</span>
                  <strong style={{ color: '#0f172a' }}>{coupon.usedCount}</strong>
                </div>
              </div>

              <div className="coupon-meta-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={11} /> {coupon.endDate}</span>
                <span>Cap {formatCurrency(coupon.maxDiscount)}</span>
              </div>

              <div className="coupon-card__footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className={`catalog-btn ${coupon.status === 'Active' ? 'catalog-btn--outline' : 'catalog-btn--success'}`}
                  type="button"
                  onClick={() => toggleCouponStatus(coupon.id, coupon.code)}
                  disabled={coupon.status === 'Expired'}
                  style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', minHeight: 'unset' }}
                >
                  {coupon.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <div className="catalog-inline-actions" style={{ display: 'flex', gap: '8px' }}>
                  <AnimatedEditButton onClick={() => setEditingCoupon(coupon)} title="Edit coupon" />
                  <OutlookDeleteButton onClick={() => deleteCoupon(coupon.id, coupon.code)} title="Delete coupon" />
                </div>
              </div>
            </article>
          ))}

          {!filteredCoupons.length && (
            <div className="catalog-empty-state coupons-empty" style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <Tag size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>No coupons found</h3>
              <p style={{ fontSize: '11px' }}>Try adjusting your search filters or create a new seasonal coupon campaign.</p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCoupons.length}
          itemsPerPage={itemsPerPage}
        />
      </section>

      {editingCoupon && (
        <CouponEditModal
          coupon={editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onSave={saveEditedCoupon}
        />
      )}
    </div>
  );
};

export default CouponsList;
