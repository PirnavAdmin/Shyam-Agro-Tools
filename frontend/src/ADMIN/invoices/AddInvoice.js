import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiDomain } from '../../utils/apiConfig';
import './invoices.css';

const AddInvoice = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Unpaid',
    clientName: '',
    emailAddress: '',
    contactNo: '',
    address: '',
    paymentMethod: 'UPI / Bank Transfer',
    subTotal: 0,
    taxAmount: 0,
    discount: 0,
    shippingCharge: 0,
    notes: ''
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sub = parseFloat(formData.subTotal) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;
    const ship = parseFloat(formData.shippingCharge) || 0;
    const disc = parseFloat(formData.discount) || 0;
    setTotalAmount(sub + tax + ship - disc);
  }, [formData.subTotal, formData.taxAmount, formData.shippingCharge, formData.discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName) {
      setError('Client Name is required.');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        subTotal: parseFloat(formData.subTotal) || 0,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        discount: parseFloat(formData.discount) || 0,
        shippingCharge: parseFloat(formData.shippingCharge) || 0,
        totalAmount: totalAmount
      };

      const response = await fetch(`${getApiDomain()}/api/Invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create invoice.');
      }

      navigate('/admin/invoice');
    } catch (err) {
      setError(err.message || 'An error occurred while saving invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="invoices-ledger-container">
      {/* Header */}
      <div className="invoices-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <Link to="/admin/invoice" className="back-link-invoices">
            <ArrowLeft size={16} /> Back to Invoices
          </Link>
          <h1 className="invoices-title" style={{ marginTop: '8px' }}>Create Manual Invoice</h1>
        </div>
      </div>

      {error && (
        <div className="invoice-form-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="invoice-form-card">
        <div className="invoice-form-grid">
          
          {/* Group 1: General Info */}
          <div className="form-section-group">
            <h3 className="section-group-title">Invoice & Billing Details</h3>
            
            <div className="form-input-row-2">
              <div className="form-input-field">
                <label>Invoice Number (Optional)</label>
                <input
                  type="text"
                  name="invoiceNo"
                  placeholder="e.g. INV-10045"
                  value={formData.invoiceNo}
                  onChange={handleChange}
                />
              </div>
              <div className="form-input-field">
                <label>Invoice Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-input-row-2">
              <div className="form-input-field">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div className="form-input-field">
                <label>Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Client Info */}
          <div className="form-section-group">
            <h3 className="section-group-title">Customer Information</h3>
            
            <div className="form-input-field">
              <label>Client / Customer Name</label>
              <input
                type="text"
                name="clientName"
                placeholder="Enter client full name"
                value={formData.clientName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-input-row-2">
              <div className="form-input-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="emailAddress"
                  placeholder="client@example.com"
                  value={formData.emailAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="form-input-field">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="contactNo"
                  placeholder="Enter 10-digit mobile"
                  value={formData.contactNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-input-field">
              <label>Billing & Delivery Address</label>
              <textarea
                name="address"
                placeholder="Enter client delivery destination address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </div>

        </div>

        {/* Group 3: Financial Calculations */}
        <div className="invoice-form-financial-card">
          <h3 className="section-group-title">Calculations & Pricing Summary</h3>
          
          <div className="financial-form-grid">
            <div className="form-input-field">
              <label>Subtotal (Rs.)</label>
              <input
                type="number"
                name="subTotal"
                min="0"
                step="0.01"
                value={formData.subTotal}
                onChange={handleChange}
              />
            </div>

            <div className="form-input-field">
              <label>Tax Amount (GST 18%) (Rs.)</label>
              <input
                type="number"
                name="taxAmount"
                min="0"
                step="0.01"
                value={formData.taxAmount}
                onChange={handleChange}
              />
            </div>

            <div className="form-input-field">
              <label>Discount Amount (Rs.)</label>
              <input
                type="number"
                name="discount"
                min="0"
                step="0.01"
                value={formData.discount}
                onChange={handleChange}
              />
            </div>

            <div className="form-input-field">
              <label>Shipping / Freight (Rs.)</label>
              <input
                type="number"
                name="shippingCharge"
                min="0"
                step="0.01"
                value={formData.shippingCharge}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Grand Total display */}
          <div className="grand-total-invoice-flex">
            <div className="form-input-field" style={{ flexGrow: 1, marginBottom: 0 }}>
              <label>Administrative Notes</label>
              <textarea
                name="notes"
                placeholder="Add special delivery instructions or billing memos"
                value={formData.notes}
                onChange={handleChange}
                rows={1}
              />
            </div>
            <div className="grand-total-amount-box">
              <span className="grand-total-label">Grand Total Due:</span>
              <h2 className="grand-total-value">
                Rs. {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </div>

        {/* Action Flex */}
        <div className="invoice-form-actions-flex">
          <Link to="/admin/invoice" className="cancel-invoice-form-btn">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="save-invoice-form-btn">
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving Invoice...
              </>
            ) : (
              <>
                <Save size={16} /> Save & Generate Invoice
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddInvoice;
