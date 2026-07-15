import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Truck,
  Check
} from 'lucide-react';
import { supplierCategories } from './SuppliersList';
import '../catalog/adminModule.css';
import { Toast } from '../components/Toast';
import { fetchSupplier, createSupplier, updateSupplier } from './suppliersApi';

const initialSupplier = {
  name: '',
  contactPerson: '',
  category: supplierCategories[0],
  status: 'Pending',
  email: '',
  phone: '',
  city: '',
  address: '',
  gstin: '',
  leadTime: '',
  paymentTerms: 'Net 15',
  productLines: '',
  notes: ''
};

const SuppliersForm = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(initialSupplier);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const loadSupplierData = async () => {
      try {
        const data = await fetchSupplier(id);
        if (data) {
          setSupplier(data);
        }
      } catch (err) {
        console.error('Failed to load supplier details:', err);
        setToastMessage('Failed to load supplier profile.');
        setToastType('warning');
      }
    };
    loadSupplierData();
  }, [id]);

  const completionScore = useMemo(() => {
    const requiredFields = ['name', 'contactPerson', 'email', 'phone', 'city', 'address', 'productLines'];
    const completed = requiredFields.filter((field) => supplier[field] && String(supplier[field]).trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [supplier]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supplier.name.trim() || !supplier.contactPerson.trim() || !supplier.email.trim() || !supplier.phone.trim()) {
      setToastMessage('Please fill in all required fields.');
      setToastType('warning');
      return;
    }
    
    setIsSaving(true);
    try {
      if (id) {
        await updateSupplier(id, supplier);
        setToastMessage(`${supplier.name} has been updated.`);
      } else {
        await createSupplier(supplier);
        setToastMessage(`${supplier.name} has been submitted for onboarding review.`);
      }
      setToastType('success');
      
      setTimeout(() => {
        navigate('/admin/suppliers/list');
      }, 1200);
    } catch (err) {
      console.error('Failed to save supplier:', err);
      setToastMessage('Failed to save supplier details: ' + err.message);
      setToastType('warning');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSupplier(initialSupplier);
  };

  return (
    <div className="suppliers-page supplier-form-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Row with Actions in Top-Right */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" to="/admin/suppliers/list">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Procurement</span>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Add Supplier Profile</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="catalog-btn" type="button" onClick={handleReset} disabled={isSaving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            <RotateCcw size={14} style={{ marginRight: '4px' }} />
            Reset
          </button>
          <button className="catalog-btn catalog-btn--primary" onClick={handleSubmit} disabled={isSaving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            <Save size={14} style={{ marginRight: '4px' }} />
            Save Supplier
          </button>
        </div>
      </section>

      {/* Completion Score Sleek Progress Indicator */}
      <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Profile Setup Progress</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <div style={{ width: '200px', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completionScore}%`, height: '100%', backgroundColor: completionScore === 100 ? '#10b981' : '#2563eb', transition: 'width 0.3s' }}></div>
            </div>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{completionScore}%</strong>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Fill required fields to complete the onboarding record.
        </span>
      </section>

      {/* Grid Layout: Form and Sidebar */}
      <form className="supplier-form-layout" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', alignItems: 'start' }}>
        <main className="catalog-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Company Information */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0 0 12px 0' }}>
              Company Details
            </h3>

            <div className="catalog-form-grid" style={{ gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="name">Supplier Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={supplier.name}
                  onChange={handleChange}
                  placeholder="e.g. KisanKraft Ltd."
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="contactPerson">Contact Person</label>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  value={supplier.contactPerson}
                  onChange={handleChange}
                  placeholder="Procurement contact name"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={supplier.category} onChange={handleChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  {supplierCategories.map((category) => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="catalog-field">
                <label htmlFor="status">Approval Status</label>
                <select id="status" name="status" value={supplier.status} onChange={handleChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  <option value="Pending">Pending</option>
                  <option value="Review">Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="catalog-field">
                <label htmlFor="gstin">GSTIN / Tax ID</label>
                <input
                  id="gstin"
                  name="gstin"
                  type="text"
                  value={supplier.gstin}
                  onChange={handleChange}
                  placeholder="Optional tax registration"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="productLines">Product Lines</label>
                <input
                  id="productLines"
                  name="productLines"
                  type="text"
                  value={supplier.productLines}
                  onChange={handleChange}
                  placeholder="Tillers, pumps, drip kits"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
            </div>
          </section>

          {/* Contact & Address */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0 0 12px 0' }}>
              Contact &amp; Location
            </h3>

            <div className="catalog-form-grid" style={{ gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={supplier.email}
                  onChange={handleChange}
                  placeholder="orders@supplier.com"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={supplier.phone}
                  onChange={handleChange}
                  placeholder="+91 98765-43210"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="city">City / Region</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={supplier.city}
                  onChange={handleChange}
                  placeholder="City, State"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="leadTime">Average Lead Time</label>
                <input
                  id="leadTime"
                  name="leadTime"
                  type="text"
                  value={supplier.leadTime}
                  onChange={handleChange}
                  placeholder="e.g. 4-6 days"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field catalog-field--full">
                <label htmlFor="address">Registered Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={supplier.address}
                  onChange={handleChange}
                  placeholder="Street, industrial area, city, state, PIN"
                  required
                  rows={2}
                  style={{ padding: '6px 10px', fontSize: '12px', resize: 'none' }}
                />
              </div>
            </div>
          </section>
        </main>

        <aside className="catalog-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Commercial Terms */}
          <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0 0 12px 0' }}>
              Procurement Terms
            </h3>

            <div className="catalog-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="paymentTerms">Payment Terms</label>
                <select id="paymentTerms" name="paymentTerms" value={supplier.paymentTerms} onChange={handleChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Advance 30%">Advance 30%</option>
                  <option value="Advance 50%">Advance 50%</option>
                  <option value="COD">COD</option>
                </select>
              </div>

              <div className="catalog-field">
                <label htmlFor="notes">Internal Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={supplier.notes}
                  onChange={handleChange}
                  placeholder="Quality parameters, preferred dispatch days, logistics defaults..."
                  rows={3}
                  style={{ padding: '6px 10px', fontSize: '12px', resize: 'none' }}
                />
              </div>
            </div>
          </section>

          {/* Supplier Snapshot Card */}
          <section className="catalog-card supplier-preview-card" style={{ padding: '16px', margin: 0 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0 0 12px 0' }}>
              Live Review
            </h3>

            <div className="supplier-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={15} style={{ color: '#059669' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{supplier.name || 'Vendor Name'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} style={{ color: '#059669' }} />
                <span>{supplier.status} | {supplier.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} style={{ color: '#059669' }} />
                <span>{supplier.phone || 'Phone Number'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} style={{ color: '#059669' }} />
                <span>{supplier.email || 'Email Address'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} style={{ color: '#059669' }} />
                <span>{supplier.city || 'City / Region'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={15} style={{ color: '#059669' }} />
                <span>{supplier.leadTime || 'Lead time not specified'}</span>
              </div>
            </div>
          </section>

          {/* Bottom Actions inside Sidebar */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Link to="/admin/suppliers/list" className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1"
            >
              <Check size={14} /> Save Supplier
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default SuppliersForm;
