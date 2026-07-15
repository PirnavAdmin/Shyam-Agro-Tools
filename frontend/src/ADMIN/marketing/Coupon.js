import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Percent,
  RotateCcw,
  Save,
  ShieldCheck,
  Tag
} from 'lucide-react';
import '../catalog/adminModule.css';
import { createCoupon } from './api';
import { Toast } from '../components/Toast';

const initialCoupon = {
  code: 'MONSOON20',
  description: '20% off on all organic seeds and seedlings',
  discount: '20',
  type: 'Percentage',
  minSpend: '1500',
  maxDiscount: '500',
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  usageLimit: '500',
  perCustomerLimit: '1',
  status: 'Active',
  audience: 'All Customers'
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const Coupon = () => {
  const [formData, setFormData] = useState(initialCoupon);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const navigate = useNavigate();

  const previewDiscount = React.useMemo(() => {
    if (formData.type === 'Percentage') return `${formData.discount || 0}%`;
    if (formData.type === 'Shipping') return 'Free Delivery';
    return formatCurrency(formData.discount);
  }, [formData.discount, formData.type]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
  };

  const handleReset = () => {
    setFormData(initialCoupon);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createCoupon(formData);
      setToastMessage('Coupon campaign created successfully!');
      setToastType('success');
      setTimeout(() => {
        navigate('/admin/marketing/coupons');
      }, 1000);
    } catch (err) {
      setToastMessage('Failed to create coupon. Please check details.');
      setToastType('error');
      setIsSaving(false);
    }
  };

  return (
    <div className="coupons-page coupon-form-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Row with Actions in Top-Right */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" to="/admin/marketing/coupons">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Marketing Campaign</span>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Create Coupon</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="catalog-btn" type="button" onClick={handleReset} disabled={isSaving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            <RotateCcw size={14} style={{ marginRight: '4px' }} />
            Reset
          </button>
          <button className="catalog-btn catalog-btn--primary" onClick={handleSubmit} disabled={isSaving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            <Save size={14} style={{ marginRight: '4px' }} />
            {isSaving ? 'Saving...' : 'Save Coupon'}
          </button>
        </div>
      </section>

      {/* Form and Preview Layout side-by-side */}
      <form onSubmit={handleSubmit} className="coupon-form-layout" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', alignItems: 'start' }}>
        <main className="catalog-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Campaign Details */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <div className="catalog-card__header" style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>Campaign Details</h2>
              <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>The customer-facing code, message, and discount type.</p>
            </div>
            <div className="catalog-form-grid" style={{ gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="code">Coupon Code</label>
                <input id="code" name="code" value={formData.code} onChange={handleInputChange} placeholder="MONSOON20" required style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="type">Discount Type</label>
                <select id="type" name="type" value={formData.type} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  <option value="Percentage">Percentage</option>
                  <option value="Flat Amount">Flat Amount</option>
                  <option value="Shipping">Free Delivery</option>
                </select>
              </div>
              <div className="catalog-field catalog-field--full">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={2} value={formData.description} onChange={handleInputChange} required style={{ padding: '6px 10px', fontSize: '12px', resize: 'none' }} />
              </div>
            </div>
          </section>

          {/* Discount Rules */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <div className="catalog-card__header" style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>Discount Rules</h2>
              <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>Control offer value, eligibility, caps, and usage limits.</p>
            </div>
            <div className="catalog-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="discount">Discount Value</label>
                <input id="discount" name="discount" type="number" value={formData.discount} onChange={handleInputChange} disabled={formData.type === 'Shipping'} required={formData.type !== 'Shipping'} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="maxDiscount">Max Discount Cap</label>
                <input id="maxDiscount" name="maxDiscount" type="number" value={formData.maxDiscount} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="minSpend">Min Cart Value</label>
                <input id="minSpend" name="minSpend" type="number" value={formData.minSpend} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="usageLimit">Usage Limit</label>
                <input id="usageLimit" name="usageLimit" type="number" value={formData.usageLimit} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="perCustomerLimit">Customer Limit</label>
                <input id="perCustomerLimit" name="perCustomerLimit" type="number" value={formData.perCustomerLimit} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
            </div>
          </section>

          {/* Validity & Audience */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <div className="catalog-card__header" style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>Validity &amp; Audience</h2>
              <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>Set campaign dates and target audience.</p>
            </div>
            <div className="catalog-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="startDate">Start Date</label>
                <input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="endDate">End Date</label>
                <input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="catalog-field">
                <label htmlFor="audience">Audience</label>
                <select id="audience" name="audience" value={formData.audience} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  <option value="All Customers">All Customers</option>
                  <option value="New Customers">New Customers</option>
                  <option value="Returning Customers">Returning Customers</option>
                  <option value="High Value Customers">High Value Customers</option>
                </select>
              </div>
            </div>
          </section>
        </main>

        <aside className="catalog-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live Preview */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <div className="catalog-card__header" style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>Live Preview</h2>
              <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>How the campaign reads at checkout.</p>
            </div>
            <div className="coupon-preview-card" style={{ padding: '16px', border: '2px dashed #059669', borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <Tag size={28} style={{ color: '#059669' }} />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', letterSpacing: '0.05em' }}>{formData.code || 'COUPON'}</span>
              <strong style={{ fontSize: '24px', fontWeight: 900, color: '#065f46' }}>{previewDiscount}</strong>
              <p style={{ fontSize: '11px', color: '#047857', margin: 0 }}>{formData.description || 'Coupon description will appear here.'}</p>
            </div>
          </section>

          {/* Rule Summary */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <div className="catalog-card__header" style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>Rule Summary</h2>
              <p className="catalog-card__subtitle" style={{ fontSize: '10px', margin: 0 }}>Quick operational checklist.</p>
            </div>
            <div className="coupon-summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={15} style={{ color: '#059669' }} /> <span>{previewDiscount} discount type: {formData.type}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={15} style={{ color: '#059669' }} /> <span>Min cart {formatCurrency(formData.minSpend)}, cap {formatCurrency(formData.maxDiscount)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={15} style={{ color: '#059669' }} /> <span>{formData.startDate} to {formData.endDate}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={15} style={{ color: '#059669' }} /> <span>{formData.usageLimit} total uses, {formData.perCustomerLimit} per customer</span></div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default Coupon;
