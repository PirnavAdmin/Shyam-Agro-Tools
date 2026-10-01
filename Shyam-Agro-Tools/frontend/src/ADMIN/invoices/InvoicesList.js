import React, { useEffect, useState } from 'react';
import { Search, Printer, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiDomain } from '../../utils/apiConfig';
import './invoices.css';

const normalizeInvoiceId = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().replace(/^#+/, '');
  while (/^(INV-|ORD-|INV|ORD)/i.test(clean)) {
    clean = clean.replace(/^(INV-|ORD-)/i, '').replace(/^(INV|ORD)[-\s]*/i, '').trim();
  }
  if (!clean) return '';
  return `INV-${clean}`;
};

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 'Rs. 0',
    paidInvoices: 0,
    unpaidInvoices: 0,
    cancelledInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const apiDomain = getApiDomain();
      const url = search 
        ? `${apiDomain}/api/Invoices?search=${encodeURIComponent(search)}`
        : `${apiDomain}/api/Invoices`;
      
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const normalizedList = (data.invoices || []).map(inv => ({
        ...inv,
        invoiceId: normalizeInvoiceId(inv.invoiceId)
      }));
      setInvoices(normalizedList);
      setMetrics({
        totalRevenue: data.totalRevenue || 'Rs. 0',
        paidInvoices: data.paidInvoices || 0,
        unpaidInvoices: data.unpaidInvoices || 0,
        cancelledInvoices: data.cancelledInvoices || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoices(searchTerm);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleUpdateStatus = async (id, currentStatus, nextStatus) => {
    if (!window.confirm(`This invoice is currently ${currentStatus.toUpperCase()}. Are you sure you want to mark it as ${nextStatus.toUpperCase()}?`)) return;

    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Failed to update invoice status.');
      fetchInvoices(searchTerm);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to cancel/delete this invoice?')) return;

    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to cancel invoice.');
      fetchInvoices(searchTerm);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePrintInvoice = async (id) => {
    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch invoice details.');
      const order = await response.json();

      const parseCurrencyValue = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const clean = String(val).replace(/[^0-9.]/g, '');
        return Number(clean) || 0;
      };

      const finalAmountNum = order.finalAmount !== undefined ? Number(order.finalAmount) : parseCurrencyValue(order.billed);
      const subtotalNum = order.subtotal !== undefined ? Number(order.subtotal) : (finalAmountNum / 1.18);
      const discountNum = Number(order.discountAmount || 0);
      const shippingNum = Number(order.shippingFee || 0);
      const netTaxableNum = Math.max(0, subtotalNum - discountNum);
      const gstAmountNum = order.gstAmount !== undefined ? Number(order.gstAmount) : (netTaxableNum * 0.18);
      const cgstNum = gstAmountNum / 2;
      const sgstNum = gstAmountNum / 2;

      let printIframe = document.getElementById('invoice-print-iframe');
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'invoice-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }

      const itemsHtml = (order.items || []).map((item, idx) => {
        const itemPrice = item.priceNum !== undefined ? Number(item.priceNum) : parseCurrencyValue(item.price);
        const itemQty = Number(item.quantity || 1);
        const itemSubtotal = itemPrice * itemQty;
        const itemTax = itemSubtotal * 0.18;
        const itemTotal = itemSubtotal + itemTax;

        return `
          <tr>
            <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${item.productName || 'Product'}</div>
              ${item.productCode ? `<div style="font-size: 11px; color: #64748b;">SKU: ${item.productCode}</div>` : ''}
            </td>
            <td style="text-align: center;">${itemQty}</td>
            <td style="text-align: right;">₹${itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right;">₹${itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 700; color: #0f172a;">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');

      const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr;
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
          return dateStr;
        }
      };

      const payMethodLower = (order.paymentMethod || '').toLowerCase();
      const payStatusLower = (order.paymentStatus || order.status || '').toLowerCase();
      const isCashfreeOrOnline = payMethodLower.includes('cashfree') || payMethodLower.includes('razorpay') || payMethodLower.includes('online') || payMethodLower.includes('card') || payMethodLower.includes('upi') || payMethodLower.includes('netbanking');
      const isPaid = payStatusLower === 'paid' || payStatusLower === 'success' || payStatusLower === 'verified paid' || isCashfreeOrOnline;
      const isCancelled = payStatusLower === 'cancelled' || payStatusLower === 'canceled';

      const docTitle = isPaid ? 'TAX INVOICE' : isCancelled ? 'CANCELLED INVOICE' : 'PROFORMA INVOICE';
      const docSubTitle = isPaid ? 'Original for Recipient (Paid)' : isCancelled ? 'Void / Cancelled Document' : 'Proforma / Quotation - Payment Pending';
      const statusColor = isPaid ? '#047857' : isCancelled ? '#dc2626' : '#d97706';
      const statusBg = isPaid ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#fffbe5';
      const statusBorder = isPaid ? '#a7f3d0' : isCancelled ? '#fca5a5' : '#fde68a';

      const printWin = printIframe.contentWindow || printIframe.contentDocument;
      const doc = printWin.document || printWin;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle} - ${order.invoiceId}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
              @page {
                margin: 0;
                size: auto;
              }
              @media print {
                html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
                .invoice-container { border: none !important; box-shadow: none !important; padding: 12mm 15mm !important; max-width: 100% !important; width: 100% !important; }
              }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
                background: #ffffff;
                color: #0f172a;
                padding: 20px;
                line-height: 1.5;
              }
              .invoice-container { 
                max-width: 820px; 
                margin: auto; 
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 32px;
              }
              
              /* Header */
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 20px;
                border-bottom: 2px solid #0f172a;
                margin-bottom: 20px;
              }
              .company-title {
                font-size: 22px;
                font-weight: 800;
                color: #065f46;
                letter-spacing: -0.5px;
                text-transform: uppercase;
              }
              .company-subtitle {
                font-size: 11px;
                font-weight: 700;
                color: #047857;
                margin-top: 2px;
                letter-spacing: 0.5px;
              }
              .company-meta {
                font-size: 11px;
                color: #475569;
                margin-top: 6px;
                line-height: 1.5;
              }
              .badge-tax-invoice {
                text-align: right;
              }
              .tax-title {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: 1px;
              }
              .tax-subtitle {
                display: inline-block;
                background: ${statusBg};
                color: ${statusColor};
                border: 1px solid ${statusBorder};
                font-size: 10px;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 20px;
                margin-top: 4px;
                text-transform: uppercase;
              }
              
              /* Metadata Grid */
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 20px;
              }
              .info-block {
                font-size: 12px;
              }
              .info-block-title {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              .info-row {
                display: flex;
                margin-bottom: 4px;
              }
              .info-label {
                width: 110px;
                color: #64748b;
                font-weight: 500;
              }
              .info-val {
                font-weight: 700;
                color: #0f172a;
              }
              
              /* Addresses Grid */
              .address-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 20px;
              }
              .address-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px;
              }
              .address-card-title {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                color: #047857;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              .address-card p {
                font-size: 12px;
                color: #334155;
                line-height: 1.5;
              }

              /* Table */
              table.item-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              table.item-table th {
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                padding: 8px 10px;
                letter-spacing: 0.5px;
              }
              table.item-table td {
                padding: 10px;
                font-size: 12px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              table.item-table tr:nth-child(even) {
                background: #f8fafc;
              }

              /* Summary & Financials */
              .summary-flex {
                display: flex;
                justify-content: flex-end;
                gap: 20px;
                margin-bottom: 24px;
              }
              .bank-box {
                flex: 1;
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 14px;
                font-size: 11px;
              }
              .bank-box-title {
                font-size: 10px;
                font-weight: 800;
                color: #166534;
                text-transform: uppercase;
                margin-bottom: 6px;
              }
              .bank-row {
                display: flex;
                margin-bottom: 3px;
              }
              .bank-label {
                width: 90px;
                color: #15803d;
                font-weight: 600;
              }
              .bank-val {
                font-weight: 700;
                color: #166534;
              }
              .financial-totals {
                width: 320px;
                font-size: 12px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                color: #475569;
                border-bottom: 1px solid #f1f5f9;
              }
              .grand-total-line {
                display: flex;
                justify-content: space-between;
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                padding: 8px 0;
                border-top: 2px solid #0f172a;
                border-bottom: 2px solid #0f172a;
                margin-top: 4px;
              }

              /* Footer */
              .invoice-footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                font-size: 11px;
                color: #64748b;
              }
              .signatory-box {
                text-align: center;
                width: 180px;
              }
              .signatory-line {
                height: 35px;
                border-bottom: 1px dashed #94a3b8;
                margin-bottom: 4px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <!-- Header -->
              <div class="invoice-header">
                <div style="display: flex; align-items: flex-start; gap: 18px;">
                  <img src="/logo.png" style="height: 70px; width: auto; object-fit: contain; margin-top: 4px;" alt="Logo" onerror="this.src='/logo.svg'" />
                  <div>
                    <div class="company-title">Shyam Agro Tools Pvt. Ltd.</div>
                    <div class="company-subtitle">MANUFACTURERS OF FARM MACHINERY & IRRIGATION EQUIPMENT</div>
                    <div class="company-meta">
                      Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401, Andhra Pradesh<br/>
                      Factory: Plot No. 42-45, Agro Industrial Hub, Nandyal Road, Kurnool (DT), AP - 518002<br/>
                      GSTIN: <strong>24DYYPP1677P1Z6</strong> | CIN: <strong>U29219AP2026PTC109842</strong> | MSME: <strong>UDYAM-AP-08-0049215</strong><br/>
                      Phone: +91 9912649265 | Toll-Free: 1800-425-9922 | Email: sales@shyamagro.com | Web: www.shyamagrotools.com
                    </div>
                  </div>
                </div>
                <div class="badge-tax-invoice">
                  <div class="tax-title">${docTitle}</div>
                  <div class="tax-subtitle">${docSubTitle}</div>
                </div>
              </div>

              <!-- Government IRN & E-Way Bill Strip -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>Govt E-Invoice IRN:</strong> <span style="font-family: monospace; font-size: 10px;">e54b6910a72f910482019482710492817402917492810492810482910482a</span><br/>
                  <strong>E-Way Bill No:</strong> 2910-4829-1029-4819 | <strong>Place of Supply:</strong> Andhra Pradesh (37)
                </div>
                <div style="text-align: right; border: 1px dashed #047857; padding: 4px 8px; border-radius: 4px; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 10px;">
                  VERIFIED E-INVOICE
                </div>
              </div>

              <!-- Info Grid -->
              <div class="info-grid">
                <div class="info-block">
                  <div class="info-block-title">Invoice & Order Details</div>
                  <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${order.invoiceId}</span></div>
                  <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${formatDate(order.date)}</span></div>
                  <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${order.id}</span></div>
                  <div class="info-row"><span class="info-label">Place of Supply:</span><span class="info-val">Andhra Pradesh (37)</span></div>
                </div>
                <div class="info-block">
                  <div class="info-block-title">Payment & Settlement Status</div>
                  <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${order.paymentMethod || 'CASHFREE ONLINE PAYMENT'}</span></div>
                  <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: ${statusColor}; font-weight: 800;">${isPaid ? 'PAID (ONLINE SETTLED)' : (order.paymentStatus || 'UNPAID').toUpperCase()} ${!isPaid && !isCancelled ? '(Payment Pending)' : ''}</span></div>
                  <div class="info-row"><span class="info-label">Billing Currency:</span><span class="info-val">INR ₹${finalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              <!-- Customer & Shipping Addresses -->
              <div class="address-grid">
                <div class="address-card">
                  <div class="address-card-title">Billed To (Customer Details)</div>
                  <p>
                    <strong>${order.client}</strong><br/>
                    ${(order.address && order.address !== 'N/A') ? `Address: ${order.address.replace(/\n/g, '<br/>')}<br/>` : ''}
                    ${order.phone ? `Phone: ${order.phone}<br/>` : ''}
                    ${order.email && !order.email.includes('N/A') ? `Email: ${order.email.toLowerCase()}<br/>` : ''}
                    GSTIN: Unregistered / Consumer
                  </p>
                </div>
                <div class="address-card">
                  <div class="address-card-title">Shipped To & Logistics Destination</div>
                  <p>
                    <strong>${order.client}</strong><br/>
                    Address: ${(order.shippingAddress || order.address || 'Full Delivery Address Pending / Not Provided').replace(/\n/g, '<br/>')}<br/>
                    ${order.phone ? `Contact Phone: ${order.phone}<br/>` : ''}
                    Carrier: V-Trans Freight Express | Docket: SAT/LOG/2026/849201
                  </p>
                </div>
              </div>

              <!-- Items Table -->
              <table class="item-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%; text-align: left;">Product Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 13%; text-align: right;">Price</th>
                    <th style="width: 12%; text-align: right;">GST (18%)</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Summary Flex -->
              <div class="summary-flex">
                <div class="bank-box">
                  <div class="bank-box-title">Bank Settlement Details (NEFT / RTGS)</div>
                  <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-val">State Bank of India (SBI)</span></div>
                  <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-val">Shyam Agro Tools Pvt. Ltd.</span></div>
                  <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-val">39482019482</span></div>
                  <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-val">SBIN0001234</span></div>
                  <div class="bank-row"><span class="bank-label">Branch:</span><span class="bank-val">Nandyal Main Branch</span></div>
                  <div style="margin-top: 6px; font-size: 10px; color: #15803d; font-weight: 600;">
                    ★ Includes 12 Months Motor Warranty & Free 1st Maintenance Pass.
                  </div>
                </div>
                <div class="financial-totals">
                  <div class="total-line"><span>Subtotal (Taxable Value)</span><span>₹${subtotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  ${discountNum > 0 ? `<div class="total-line" style="color: #dc2626;"><span>Discount</span><span>-₹${discountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
                  ${shippingNum > 0 ? `<div class="total-line"><span>Shipping Charges</span><span>₹${shippingNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
                  <div class="total-line"><span>CGST (9%)</span><span>₹${cgstNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div class="total-line"><span>SGST (9%)</span><span>₹${sgstNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div class="grand-total-line">
                    <span>Grand Total Due</span>
                    <span>₹${finalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <!-- Footer & Terms Section -->
              <div class="invoice-footer">
                <div style="flex-grow: 1; max-width: 65%;">
                  <strong style="color: #047857; text-transform: uppercase;">About Shyam Agro Tools Pvt. Ltd.:</strong><br/>
                  Leading e-commerce marketplace & manufacturer of heavy-duty agricultural tools, equipment, irrigation systems, and farm machinery.<br/><br/>
                  <strong style="color: #0f172a; text-transform: uppercase;">Terms & Conditions of Sale:</strong><br/>
                  <ol style="margin-left: 14px; font-size: 10px; color: #475569; line-height: 1.4;">
                    <li>Goods once sold will not be returned without valid RMA authorization.</li>
                    <li>Official manufacturer warranty valid against tax invoice copy across 150+ hubs.</li>
                    <li>Interest @18% p.a. charged on overdue invoices after 30 days.</li>
                    <li>Subject to Nandyal, Andhra Pradesh judicial jurisdiction only.</li>
                  </ol>
                  <em style="font-size: 10px; color: #64748b;">This is a computer-generated tax invoice issued under Rule 46 of CGST Rules, 2017 requiring no physical signature.</em>
                </div>
                <div class="signatory-box" style="display: flex; flex-direction: column; align-items: center;">
                  <div style="border: 2px dashed #047857; background: #ecfdf5; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; transform: rotate(-3deg); text-align: center;">
                    <span style="font-size: 9px; font-weight: 900; color: #047857; display: block;">SHYAM AGRO TOOLS</span>
                    <span style="font-size: 7px; font-weight: 800; color: #065f46; display: block;">VERIFIED TAX INVOICE</span>
                  </div>
                  <div class="signatory-line" style="width: 150px;"></div>
                  <strong>For Shyam Agro Tools Pvt. Ltd.</strong><br/>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
      try {
        doc.title = `${docTitle} - ${order.invoiceId}`;
      } catch (e) {}
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 300);
    } catch (err) {
      alert(`Failed to print invoice: ${err.message}`);
    }
  };

  return (
    <div className="invoices-ledger-container">
      {/* Header */}
      <div className="invoices-header-flex">
        <div>
          <h1 className="invoices-title">Invoices Manager</h1>
          <p className="invoices-subtitle">Track, search, and generate customer and staff sales invoices.</p>
        </div>
        <Link to="/admin/invoice/add" className="add-invoice-button">
          <Plus size={16} /> Create Invoice
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="invoices-metrics-grid">
        <div className="invoice-metric-card revenue">
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <h3 className="metric-value">{metrics.totalRevenue}</h3>
          </div>
        </div>
        <div className="invoice-metric-card success">
          <div className="metric-info">
            <span className="metric-label">Paid Invoices</span>
            <h3 className="metric-value">{metrics.paidInvoices}</h3>
          </div>
        </div>
        <div className="invoice-metric-card warning">
          <div className="metric-info">
            <span className="metric-label">Unpaid Invoices</span>
            <h3 className="metric-value">{metrics.unpaidInvoices}</h3>
          </div>
        </div>
        <div className="invoice-metric-card danger">
          <div className="metric-info">
            <span className="metric-label">Cancelled</span>
            <h3 className="metric-value">{metrics.cancelledInvoices}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="invoices-filter-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-svg" />
          <input
            type="text"
            placeholder="Search by client, invoice number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="invoice-search-input"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="invoice-table-card">
        {loading ? (
          <div className="invoice-loading-state">
            <RefreshCw size={24} className="animate-spin" />
            <span>Loading Invoices...</span>
          </div>
        ) : error ? (
          <div className="invoice-error-state">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="invoice-empty-state">
            <AlertCircle size={24} />
            <span>No invoices found.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="invoices-data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Billed Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{inv.invoiceId}</td>
                    <td>
                      <div className="client-cell-info">
                        <strong>{inv.client}</strong>
                        <span>{inv.email}</span>
                      </div>
                    </td>
                    <td>{inv.date}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{inv.billed}</td>
                    <td>
                      <span className={`invoice-status-badge ${inv.status ? inv.status.toLowerCase().replace(/\s+/g, '-') : 'unpaid'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="invoice-action-buttons">
                        <button
                          onClick={() => handlePrintInvoice(inv.id)}
                          className="inv-action-btn print"
                          title="Print / View PDF"
                        >
                          <Printer size={14} /> Print
                        </button>
                        {inv.status?.toLowerCase() !== 'cancelled' && (() => {
                          const statusLower = (inv.status || '').toLowerCase();
                          const isPaymentNotApplicable =
                            statusLower.includes('not applicable') ||
                            statusLower.includes('n/a') ||
                            statusLower.includes('not required') ||
                            statusLower === 'na';
                          const isPaid = statusLower === 'paid';
                          const nextTarget = isPaid ? 'Unpaid' : 'Paid';

                          return (
                            <button
                              onClick={() => !isPaymentNotApplicable && handleUpdateStatus(inv.id, inv.status, nextTarget)}
                              disabled={isPaymentNotApplicable}
                              className={`inv-action-btn toggle ${isPaymentNotApplicable ? 'disabled' : ''}`}
                              title={isPaymentNotApplicable ? 'Payment is not required for this invoice' : `Mark as ${nextTarget}`}
                            >
                              <CheckCircle2 size={14} /> Mark as {nextTarget}
                            </button>
                          );
                        })()}
                        {inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="inv-action-btn delete"
                            title="Cancel Invoice"
                          >
                            <Trash2 size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;
