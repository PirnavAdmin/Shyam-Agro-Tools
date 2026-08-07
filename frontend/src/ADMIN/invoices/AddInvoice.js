import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, RefreshCw, Plus, Trash2, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
    transactionRef: '',
    paymentDate: new Date().toISOString().split('T')[0],
    subTotal: 0,
    taxAmount: 0,
    discount: 0,
    shippingCharge: 0,
    notes: 'Official tax invoice issued by Shyam Agro Tools for high-quality agricultural equipment, machinery, and farm supplies. Subject to standard commercial warranty and sales terms.'
  });

  const [items, setItems] = useState([
    { productName: '', productCode: '', quantity: 1, price: 0 }
  ]);

  const [productList, setProductList] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${getApiDomain()}/api/products`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProductList(Array.isArray(data) ? data : (data.products || []));
        }
      } catch (err) {
        console.error('Failed to fetch product list', err);
      }
    };
    fetchProducts();
  }, []);

  const [totalAmount, setTotalAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill subTotal & default taxAmount when items list changes
  useEffect(() => {
    const sub = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
    const disc = parseFloat(formData.discount) || 0;
    const netTaxable = Math.max(0, sub - disc);
    const tax = Math.round(netTaxable * 0.18 * 100) / 100;
    
    setFormData(prev => ({
      ...prev,
      subTotal: sub,
      taxAmount: tax
    }));
  }, [items]);

  // Recalculate Grand Total whenever subTotal, taxAmount, discount, or shippingCharge change
  useEffect(() => {
    const sub = parseFloat(formData.subTotal) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;
    const ship = parseFloat(formData.shippingCharge) || 0;
    const disc = parseFloat(formData.discount) || 0;
    
    setTotalAmount(sub + tax + ship - disc);
  }, [formData.subTotal, formData.taxAmount, formData.shippingCharge, formData.discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'emailAddress') {
      finalValue = value.toLowerCase().trimStart();
    }
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleProductNameChange = (index, value) => {
    handleItemChange(index, 'productName', value);
    if (!value) return;
    const selectedProd = productList.find(p => (p.productName || '').trim().toLowerCase() === value.trim().toLowerCase());
    if (selectedProd) {
      handleItemChange(index, 'productCode', selectedProd.sku || '');
      handleItemChange(index, 'price', selectedProd.sellingPrice || selectedProd.mrp || 0);
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { productName: '', productCode: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      setItems([{ productName: '', productCode: '', quantity: 1, price: 0 }]);
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client / Customer Name Validation
    const nameTrim = (formData.clientName || '').trim();
    if (!nameTrim) {
      setError('Client / Customer Name is required.');
      return;
    }
    if (nameTrim.length < 2 || !/^[a-zA-Z\s.'-]+$/.test(nameTrim)) {
      setError('Please enter a valid Customer Name (minimum 2 letters, no numbers or special symbols).');
      return;
    }

    // 2. Contact Number Validation (10-digit mobile starting 6-9)
    const phoneClean = (formData.contactNo || '').replace(/[\s\-\+\(\)]/g, '');
    if (!formData.contactNo || !phoneClean) {
      setError('Contact Number is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneClean.slice(-10))) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9 (e.g. 9876543210).');
      return;
    }

    // 3. Email Address Validation (if provided)
    if (formData.emailAddress && formData.emailAddress.trim()) {
      const rawEmail = formData.emailAddress.trim();
      const cleanEmail = rawEmail.toLowerCase();

      // Lowercase enforcement check
      if (rawEmail !== cleanEmail) {
        setError('Email address must be written in lowercase letters only.');
        return;
      }

      // Reject invalid @gmail.in domain extension
      if (/@gmail\.in$/i.test(cleanEmail)) {
        setError('Invalid email domain "@gmail.in". Gmail addresses must end with @gmail.com.');
        return;
      }

      // Strict email regex matching valid formats (.com, .org, .net, .in, .co.in, etc.)
      const strictEmailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|org|net|edu|gov|co\.in|in|io|co|biz|info|me|farm|agro)$/;
      if (!strictEmailRegex.test(cleanEmail)) {
        setError('Please enter a valid lowercase email address ending with a valid extension (e.g., .com, .org, .net, .in, .co.in).');
        return;
      }
    }

    // 4. Full Delivery Address Compliance Validation
    const addressTrim = (formData.address || '').trim();
    if (!addressTrim) {
      setError('Billing & Delivery Address is required.');
      return;
    }
    if (addressTrim.length < 15) {
      setError('Please enter a complete delivery address (minimum 15 characters including street, city, state and pincode).');
      return;
    }
    const hasPincode = /\b\d{5,6}\b/.test(addressTrim);
    const hasAddressStructure = addressTrim.includes(',') || addressTrim.includes('-') || addressTrim.split(/\s+/).length >= 4;
    if (!hasPincode && !hasAddressStructure) {
      setError('Improper address format. Please enter a full delivery address with Street, City/District, State, and 6-digit Pincode (e.g. 123 Farm Road, Anand, Gujarat - 388001).');
      return;
    }

    // 5. Product Items Validation
    if (items.length === 0) {
      setError('At least one product item row is required.');
      return;
    }
    const invalidItem = items.some(item => !item.productName.trim());
    if (invalidItem) {
      setError('Product Name is required for all item rows.');
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
        totalAmount: totalAmount,
        notes: formData.transactionRef
          ? `[Txn Ref / UTR: ${formData.transactionRef}] ${formData.notes || ''}`.trim()
          : formData.notes,
        items: items.map(item => ({
          productName: item.productName,
          productCode: item.productCode || 'PROD-GEN',
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0
        }))
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
          </div>

          {/* Group 2: Client Info */}
          <div className="form-section-group">
            <h3 className="section-group-title">Customer Information</h3>
            
            <div className="form-input-field">
              <label>Client / Customer Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                name="clientName"
                placeholder="e.g. Ramesh Patel"
                value={formData.clientName}
                onChange={handleChange}
                pattern="[a-zA-Z\s.'-]{2,}"
                title="Please enter a valid full name (minimum 2 letters)"
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
                <label>Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="tel"
                  name="contactNo"
                  placeholder="e.g. 9876543210"
                  value={formData.contactNo}
                  onChange={handleChange}
                  maxLength={13}
                  required
                />
              </div>
            </div>

            <div className="form-input-field">
              <label>Billing & Delivery Address <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                name="address"
                placeholder="Enter client full street address, city, state and 6-digit pincode (e.g., 45 Green Park, Station Road, Anand, Gujarat - 388001)"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                minLength={15}
                required
              />
            </div>
          </div>

        </div>

        {/* Group 2.2: Payment & Settlement Details */}
        <div className="payment-section-card">
          <h3 className="section-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CreditCard size={18} style={{ color: '#10b981' }} /> Payment & Settlement Details
          </h3>

          <div className="form-input-row-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-input-field">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                <option value="Net Banking / NEFT / RTGS">Net Banking / NEFT / RTGS</option>
              </select>
            </div>

            <div className="form-input-field">
              <label>Payment Status</label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
              >
                <option value="Unpaid">Unpaid (Proforma Invoice)</option>
                <option value="Paid">Paid (Tax Invoice)</option>
                <option value="Payment Not Applicable">Payment Not Applicable</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {formData.paymentStatus === 'Unpaid' && (
                <span style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  ℹ️ Unpaid invoices will be issued as a <strong>Proforma Invoice</strong>. Tax Invoice (Original for Recipient) is issued upon payment confirmation.
                </span>
              )}
            </div>

            <div className="form-input-field">
              <label>Transaction / UTR Ref No. (Optional)</label>
              <input
                type="text"
                name="transactionRef"
                placeholder="e.g. UTR-987654321 / UPI-8849"
                value={formData.transactionRef}
                onChange={handleChange}
              />
            </div>

            <div className="form-input-field">
              <label>Payment Received Date</label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Official Receiving Account Box */}
          <div className="seller-bank-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '12px' }}>
              <ShieldCheck size={16} /> Official Seller Receiving Account (Shyam Agro Tools)
            </div>
            <div className="seller-bank-grid">
              <div className="seller-bank-item">
                <label>Bank Name</label>
                <span>State Bank of India</span>
              </div>
              <div className="seller-bank-item">
                <label>Account Name</label>
                <span>Shyam Agro Tools & Equipments</span>
              </div>
              <div className="seller-bank-item">
                <label>Account Number</label>
                <span>50200012345678</span>
              </div>
              <div className="seller-bank-item">
                <label>IFSC Code</label>
                <span>SBIN0001234</span>
              </div>
              <div className="seller-bank-item">
                <label>UPI ID</label>
                <span>sales@shyamagro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Group 2.5: Product Details List */}
        <div className="invoice-products-section" style={{ marginBottom: '24px' }}>
          <h3 className="section-group-title" style={{ marginBottom: '16px' }}>Product Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="invoice-products-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product Name</th>
                  <th style={{ width: '20%' }}>SKU / Code</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '13%', textAlign: 'right', paddingRight: '12px' }}>Price (Rs.)</th>
                  <th style={{ width: '12%', textAlign: 'right', paddingRight: '12px' }}>Total (Rs.)</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="invoice-item-input"
                        placeholder="Type name or search catalog..."
                        value={item.productName}
                        onChange={(e) => handleProductNameChange(index, e.target.value)}
                        list={`product-options-${index}`}
                        required
                        autoComplete="off"
                      />
                      <datalist id={`product-options-${index}`}>
                        {productList.map((p, pIdx) => (
                          <option key={pIdx} value={p.productName}>
                            SKU: {p.sku} | Price: ₹{(p.sellingPrice || p.mrp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="invoice-item-input"
                        placeholder="e.g. WM-102"
                        value={item.productCode}
                        onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="invoice-item-input"
                        style={{ textAlign: 'center' }}
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="invoice-item-input"
                        style={{ textAlign: 'right' }}
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td>
                      <span className="invoice-item-readonly" style={{ textAlign: 'right' }}>
                        ₹{((Number(item.quantity || 0) * Number(item.price || 0)) * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="remove-item-btn"
                        title="Remove product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="add-item-btn"
            style={{ marginTop: '12px' }}
          >
            <Plus size={14} /> Add Product Row
          </button>
        </div>

        {/* Group 3: Financial Calculations */}
        <div className="invoice-form-financial-card">
          <h3 className="section-group-title">Calculations & Pricing Summary</h3>
          
          <div className="financial-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
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
              <label>About Invoice & Company Memos</label>
              <textarea
                name="notes"
                placeholder="Company info, special delivery instructions or invoice notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
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
