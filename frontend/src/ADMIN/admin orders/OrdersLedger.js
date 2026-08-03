import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Eye,
  X,
  Calendar,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Truck,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  DollarSign,
  Printer,
  Trash2
} from 'lucide-react';
import { getOrders, getOrder } from '../api/orders';
import { getApiDomain } from '../../utils/apiConfig';
import { Pagination } from '../components/ActionButtons';
import './adminOrders.css';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'INR 0';
  if (typeof amount === 'string' && amount.trim().startsWith('INR')) return amount;
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0).replace(/[^0-9.]/g, ''));
  return `INR ${(isNaN(num) ? 0 : num).toLocaleString('en-IN')}`;
};

export const statusMeta = {
  Completed: { icon: CheckCircle2, className: 'status-pill completed' },
  Processing: { icon: CheckCircle2, className: 'status-pill processing' },
  Confirmed: { icon: CheckCircle2, className: 'status-pill confirmed' },
  Dispatched: { icon: Truck, className: 'status-pill dispatched' },
  Cancelled: { icon: AlertCircle, className: 'status-pill cancelled' },
  Packed: { icon: Package, className: 'status-pill packed' },
  Pending: { icon: Clock3, className: 'status-pill pending' }
};

export const OrderStatusBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.Pending;
  const Icon = meta.icon;
  return (
    <span className={meta.className}>
      <Icon size={12} style={{ marginRight: '4px' }} />
      {status}
    </span>
  );
};

export const PaymentStatusBadge = ({ paymentStatus }) => {
  let icon = Clock3;
  let color = '#d97706';
  let bg = '#fffbeb';
  let text = paymentStatus || 'Pending';

  if (paymentStatus === 'Verified' || paymentStatus === 'Verified Paid' || paymentStatus === 'Paid' || paymentStatus === 'Success') {
    icon = ShieldCheck;
    color = '#059669'; // Green for Paid
    bg = '#ecfdf5';
    text = 'Verified';
  } else if (paymentStatus === 'Refunded') {
    icon = AlertCircle;
    color = '#7e22ce'; // Purple for Refunded
    bg = '#f3e8ff';
    text = 'Refunded';
  } else if (paymentStatus === 'Payment Not Applicable' || paymentStatus === 'N/A' || paymentStatus === 'Cancelled' || paymentStatus === 'Canceled') {
    icon = AlertCircle;
    color = '#64748b'; // Slate gray for Payment Not Applicable
    bg = '#f1f5f9';
    text = 'Payment Not Applicable';
  } else if (paymentStatus === 'Pending Verification' || paymentStatus === 'PendingVerification') {
    icon = Clock3;
    color = '#d97706'; // Orange for Pending Verification
    bg = '#fffbeb';
    text = 'Pending Verification';
  } else if (paymentStatus === 'Pending' || paymentStatus === 'Unpaid') {
    icon = Clock3;
    color = '#d97706'; // Orange/Yellow for Pending
    bg = '#fffbeb';
    text = 'Pending';
  }

  const IconComponent = icon;

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      fontSize: '11px', 
      fontWeight: 700, 
      color: color,
      backgroundColor: bg,
      padding: '4px 10px',
      borderRadius: '9999px',
      textTransform: 'uppercase'
    }}>
      <IconComponent size={12} />
      {text}
    </span>
  );
};

// Helper to parse amount safely
export const parseAmount = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

// Helper to map status
export const mapStatus = (status, paymentStatus) => {
  if (!status) return 'Pending';
  const s = status.toUpperCase();
  const ps = (paymentStatus || '').toUpperCase();
  const isPaid = ps === 'PAID' || ps === 'VERIFIED PAID' || ps === 'SUCCESS' || ps === 'PAID VERIFIED' || ps === 'VERIFIED';
  const isPendingPay = ps === 'PENDING' || ps === 'PENDING VERIFICATION' || ps === 'PENDINGVERIFICATION' || ps === 'UNPAID';

  if (s === 'CANCELLED' || s === 'CANCELED') return 'Cancelled';
  if (s === 'COMPLETED' || s === 'DELIVERED') return 'Completed';
  if (s === 'SHIPPED' || s === 'DISPATCHED') return 'Dispatched';
  if (s === 'PACKED') return 'Packed';
  if (isPaid && (s === 'PENDING' || s === 'PLACED' || s === 'PROCESSING')) return 'Confirmed';
  if (s === 'CONFIRMED') return isPendingPay ? 'Pending' : 'Confirmed';
  if (s === 'PROCESSING') return isPendingPay ? 'Pending' : 'Processing';
  return status;
};

export const normalizePaymentMethod = (pm) => {
  if (!pm) return 'Cash on Delivery';
  const clean = String(pm).trim().toUpperCase();
  if (clean === 'CASH' || clean === 'CASHONDELIVERY' || clean === 'CASH ON DELIVERY' || clean === 'COD') {
    return 'Cash on Delivery';
  }
  if (clean === 'UPI' || clean === 'QRPAYMENT' || clean === 'UPI / BANK TRANSFER' || clean === 'BANK TRANSFER') {
    return 'UPI / Bank Transfer';
  }
  if (clean === 'CARD' || clean === 'CREDIT CARD' || clean === 'DEBIT CARD') {
    return 'Card';
  }
  if (clean === 'NETBANKING' || clean === 'NET BANKING') {
    return 'Net Banking';
  }
  return pm;
};

// Helper to normalise order details
const normaliseOrder = (o) => {
  const totalVal = parseAmount(o.finalAmount || o.totalAmount || o.total);
  let statusMapped = mapStatus(o.fulfillment || o.status, o.paymentStatus);

  let payStatus = o.paymentStatus || 'Pending';
  const isCancelled = statusMapped === 'Cancelled' || (o.fulfillment || o.status || '').toUpperCase() === 'CANCELLED' || (o.fulfillment || o.status || '').toUpperCase() === 'CANCELED';
  const isPaid = (o.paymentStatus || '').toUpperCase() === 'PAID' || (o.paymentStatus || '').toUpperCase() === 'VERIFIED PAID' || (o.paymentStatus || '').toUpperCase() === 'REFUNDED';

  if (isCancelled) {
    payStatus = isPaid ? 'Refunded' : 'Payment Not Applicable';
  } else if (statusMapped === 'Completed' || (o.fulfillment || o.status || '').toUpperCase() === 'COMPLETED' || (o.fulfillment || o.status || '').toUpperCase() === 'DELIVERED') {
    payStatus = 'Verified';
  }
  
  return {
    id: o.id || o.orderId || '',
    invoiceNo: o.invoiceNo || o.invoiceNumber || `INV-${o.id}`,
    customer: o.customerName || o.customer || (o.customerDetails?.name) || 'Unknown',
    customerType: o.customerType || o.customerRole || (o.customerDetails?.type) || 'Farmer',
    phone: o.customerPhone || o.phone || (o.customerDetails?.phone) || '',
    email: o.customerEmail || o.email || (o.customerDetails?.email) || '',
    date: o.dateBooked ? o.dateBooked.slice(0, 10) : (o.orderDate ? o.orderDate.slice(0, 10) : (o.date ? o.date.slice(0, 10) : '')),
    deliveryDate: o.deliveryDate ? o.deliveryDate.slice(0, 10) : (o.expectedDelivery || 'TBD'),
    subtotal: parseAmount(o.totalAmount || 0),
    shippingFee: parseAmount(o.shippingFee || 0),
    gstAmount: parseAmount(o.gstAmount || 0),
    discountAmount: parseAmount(o.discountAmount || 0),
    total: totalVal,
    paid: o.paidAmount !== undefined ? parseAmount(o.paidAmount) : (o.paymentStatus === 'Paid' ? totalVal : 0),
    status: statusMapped,
    paymentStatus: payStatus,
    payMethod: normalizePaymentMethod(o.paymentMethod || o.payMethod),
    utr: o.utr || '',
    logistics: o.carrierName || o.logisticsPartner || o.logistics || '',
    trackingNo: o.trackingNumber || o.trackingNo || '',
    shippingAddress: o.shippingAddress || '',
    billingAddress: o.billingAddress || o.shippingAddress || '',
    notes: o.notes || o.adminNotes || '',
    // Packer / Shipper Details added
    isPacked: !!(o.packerName && o.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") || ['PACKED', 'DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()) || !!(o.carrierName || o.trackingNumber),
    packerName: (o.packerName && o.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") ? o.packerName : (!!(o.carrierName || o.trackingNumber) || ['PACKED', 'DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()) ? 'Warehouse Team' : ''),
    packerImage: o.packerPhotoUrl || o.packerImage || '',
    packedDate: o.packedDate || (o.packerName || !!(o.carrierName || o.trackingNumber) || ['PACKED', 'DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()) ? 'Verified' : ''),
    isShipped: !!(o.carrierName || o.trackingNumber) || ['DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()),
    shipperName: o.shipperName || o.carrierName || 'Warehouse Team',
    packageImage: o.packagePhotoUrl || o.packageImage || '',
    shippedDate: o.shippedDate || (o.carrierName || o.trackingNumber ? 'Verified' : ''),
    items: Array.isArray(o.items) ? o.items.map(i => ({
      sku: i.sku || i.productCode || '',
      name: i.name || i.productName || '',
      category: i.category || i.categoryName || '',
      qty: Number(i.quantity || i.qty || 0),
      price: Number(i.price || i.unitPrice || 0)
    })) : [],
    timeline: Array.isArray(o.timeline) ? o.timeline : (Array.isArray(o.timelineLogs) ? o.timelineLogs.map(t => ({
      label: t.status,
      date: `${t.date} ${t.time}`,
      completed: true,
      description: t.description
    })) : [])
  };
};

const formatDateToDMyLong = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[monthIndex]}-${year}`;
  }
  return dateStr;
};

const printInvoice = (order) => {
  const printWindow = window.open('', '_blank');
  
  const gstRate = order.gstAmount > 0 && order.subtotal > 0 
    ? (order.gstAmount / (order.subtotal - (order.discountAmount || 0))) 
    : 0.18;
    
  const itemsHtml = (order.items || []).map((item, idx) => {
    const unitPrice = item.price;
    const itemTax = unitPrice * gstRate * item.qty;
    const itemTotal = (unitPrice * item.qty) + itemTax;
    
    return `
      <tr>
        <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: ${item.sku}</div>
        </td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">₹${unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right;">₹${itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: 700; color: #0f172a;">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const cgst = (order.gstAmount / 2);
  const sgst = (order.gstAmount / 2);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - ${order.invoiceNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
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
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
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
            justify-content: space-between;
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
            <div>
              <div class="company-title">Shyam Agro Tools</div>
              <div class="company-subtitle">EQUIPMENTS & INDUSTRIAL MACHINERY</div>
              <div class="company-meta">
                Plot 42, GIDC Estate, Rajkot, Gujarat - 360002<br/>
                GSTIN: <strong>24DYYPP1677P1Z6</strong> | Phone: +91 98765 43210<br/>
                Email: sales@shyamagro.com | Web: www.shyamagrotools.com
              </div>
            </div>
            <div class="badge-tax-invoice">
              <div class="tax-title">TAX INVOICE</div>
              <div class="tax-subtitle">Original for Recipient</div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-block">
              <div class="info-block-title">Invoice & Order Details</div>
              <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${order.invoiceNo}</span></div>
              <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${formatDateToDMyLong(order.date)}</span></div>
              <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${order.id}</span></div>
              <div class="info-row"><span class="info-label">Place of Supply:</span><span class="info-val">Gujarat (24)</span></div>
            </div>
            <div class="info-block">
              <div class="info-block-title">Payment & Settlement Status</div>
              <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${order.payMethod || 'UPI / Bank Transfer'}</span></div>
              <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: #047857;">${order.paymentStatus || 'Paid'}</span></div>
              <div class="info-row"><span class="info-label">Billing Currency:</span><span class="info-val">INR (₹)</span></div>
            </div>
          </div>

          <!-- Customer & Shipping Addresses -->
          <div class="address-grid">
            <div class="address-card">
              <div class="address-card-title">Billed To (Customer Details)</div>
              <p>
                <strong>${order.customer}</strong><br/>
                ${order.phone ? `Phone: ${order.phone}<br/>` : ''}
                ${order.email ? `Email: ${order.email}<br/>` : ''}
              </p>
            </div>
            <div class="address-card">
              <div class="address-card-title">Shipped To (Delivery Destination)</div>
              <p>${(order.shippingAddress || 'Standard Client Delivery Destination').replace(/\n/g, '<br/>')}</p>
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
              <div class="bank-box-title">Remittance / Bank Account Details</div>
              <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-val">State Bank of India</span></div>
              <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-val">Shyam Agro Tools & Equipments</span></div>
              <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-val">50200012345678</span></div>
              <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-val">SBIN0001234</span></div>
              <div class="bank-row"><span class="bank-label">UPI VPA:</span><span class="bank-val">sales@shyamagro</span></div>
            </div>

            <div class="financial-totals">
              <div class="total-line"><span>Subtotal (Taxable Value)</span><span>₹${order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              ${order.discountAmount > 0 ? `<div class="total-line" style="color: #dc2626;"><span>Discount</span><span>-₹${order.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
              ${order.shippingFee > 0 ? `<div class="total-line"><span>Shipping Charges</span><span>₹${order.shippingFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
              <div class="total-line"><span>CGST (9%)</span><span>₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="total-line"><span>SGST (9%)</span><span>₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="grand-total-line">
                <span>Grand Total Due</span>
                <span>₹${order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="invoice-footer">
            <div>
              <strong>Terms & Memos:</strong><br/>
              1. Goods once sold will not be taken back without valid return approval.<br/>
              2. Subject to Rajkot Jurisdiction only.<br/>
              <em>This is a computer-generated tax invoice requiring no physical signature.</em>
            </div>
            <div class="signatory-box">
              <div class="signatory-line"></div>
              <strong>For Shyam Agro Tools</strong><br/>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const formatDateToDMY = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const OrdersLedger = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('All'); // 'All', 'Today', 'Week', 'Month', 'Custom'
  
  // Custom dates state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected order details popup modal state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle auto-opening order detail modal if passed via navigation state
  useEffect(() => {
    if (location.state?.selectedOrderId && orders.length > 0) {
      const matched = orders.find(o => String(o.id || o.orderId) === String(location.state.selectedOrderId));
      if (matched) {
        setSelectedOrder(matched);
      }
    }
  }, [location.state, orders]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getOrders();
        
        let customerMap = {};
        try {
          const custResponse = await fetch(`${getApiDomain()}/api/Customers`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Accept': 'application/json'
            }
          });
          if (custResponse.ok) {
            const customersList = await custResponse.json();
            customersList.forEach(c => {
              customerMap[c.id] = c;
            });
          }
        } catch (e) {
          console.warn("Failed to load customers for mapping:", e);
        }

        if (isMounted) {
          const list = Array.isArray(data) ? data : (data.orders || data.data || []);
          const normalizedList = list.map(o => {
            const normalized = normaliseOrder(o);
            const custInfo = customerMap[o.customerId];
            if (custInfo) {
              normalized.customer = custInfo.name || normalized.customer;
              normalized.customerType = custInfo.role || 'Farmer';
              normalized.phone = custInfo.phone || normalized.phone;
              normalized.email = custInfo.email || normalized.email;
              normalized.shippingAddress = custInfo.address || normalized.shippingAddress;
            }
            return normalized;
          });
          setOrders(normalizedList);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load orders.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Filter out orders that are NOT verified success in payment method screen
  const verifiedOrders = useMemo(() => {
    return orders;
  }, [orders]);

  // Apply filters: Search & Date preset/custom range
  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Get start of this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    // Get start of this month (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    return verifiedOrders.filter((order) => {
      // 1. Search filter
      const matchesSearch = [String(order.id), order.customer, order.invoiceNo, order.phone]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);

      // 2. Date filter
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = order.date === todayStr;
      } else if (dateFilter === 'Week') {
        matchesDate = order.date >= sevenDaysAgoStr && order.date <= todayStr;
      } else if (dateFilter === 'Month') {
        matchesDate = order.date >= thirtyDaysAgoStr && order.date <= todayStr;
      } else if (dateFilter === 'Custom') {
        if (startDate && endDate) {
          matchesDate = order.date >= startDate && order.date <= endDate;
        } else if (startDate) {
          matchesDate = order.date >= startDate;
        } else if (endDate) {
          matchesDate = order.date <= endDate;
        }
      }

      return matchesSearch && matchesDate;
    }).sort((a, b) => Number(b.id) - Number(a.id));
  }, [verifiedOrders, searchTerm, dateFilter, startDate, endDate]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, startDate, endDate]);

  // Metrics (revenue only for verified success orders)
  const metrics = useMemo(() => {
    return orders.reduce(
      (summary, order) => {
        const pStatus = order.paymentStatus?.toLowerCase() || '';
        const isPaid = pStatus.includes('paid') || pStatus.includes('verified') || pStatus.includes('success');
        return {
          revenue: summary.revenue + (isPaid ? order.total : 0),
          completed: summary.completed + (order.status === 'Completed' ? 1 : 0),
          dispatched: summary.dispatched + (order.status === 'Dispatched' ? 1 : 0),
          processing: summary.processing + (order.status === 'Processing' ? 1 : 0)
        };
      },
      { revenue: 0, completed: 0, dispatched: 0, processing: 0 }
    );
  }, [orders]);

  // Pagination details
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="orders-mgmt-container" style={{ padding: '24px' }}>
        <div className="orders-mgmt-header">
          <div className="orders-mgmt-title">
            <h1>Orders Ledger</h1>
            <p>Loading verified orders ledger...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-mgmt-container" style={{ padding: '24px' }}>
        <div className="orders-mgmt-header">
          <div className="orders-mgmt-title">
            <h1>Orders Ledger</h1>
            <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-mgmt-container" style={{ padding: '24px' }}>
      
      {/* Title & Stats */}
      <div className="orders-mgmt-header">
        <div className="orders-mgmt-title">
          <h1>Orders Ledger</h1>
          <p>Complete ledger of all orders with successfully verified payment credentials.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="orders-stats-grid">
        <div className="orders-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-card-info">
            <span>Verified Revenue</span>
            <strong>{formatCurrency(metrics.revenue)}</strong>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="stat-card-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock3 size={22} />
          </div>
          <div className="stat-card-info">
            <span>Processing</span>
            <strong>{metrics.processing}</strong>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="stat-card-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Truck size={22} />
          </div>
          <div className="stat-card-info">
            <span>Dispatched</span>
            <strong>{metrics.dispatched}</strong>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span>Completed</span>
            <strong>{metrics.completed}</strong>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="orders-toolbar">
        {/* Search */}
        <div className="orders-search-wrapper">
          <Search size={18} className="orders-search-icon" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by order ID, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Filters */}
        <div className="orders-filters-wrapper">
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
            Date Booked:
          </span>
          {['All', 'Today', 'Week', 'Month', 'Custom'].map((filter) => (
            <button
              key={filter}
              className={`date-preset-btn ${dateFilter === filter ? 'active' : ''}`}
              onClick={() => setDateFilter(filter)}
            >
              {filter}
            </button>
          ))}

          {/* Custom Date Picker Inputs */}
          {dateFilter === 'Custom' && (
            <div className="custom-date-container">
              <Calendar size={13} style={{ color: '#64748b' }} />
              <input
                type="date"
                className="custom-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>to</span>
              <input
                type="date"
                className="custom-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="orders-card-table-wrap">
        <table className="orders-modern-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date Booked</th>
              <th>Logistics Partner</th>
              <th>Payment Status</th>
              <th>Total Amount</th>
              <th>Fulfillment</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700, color: '#1e293b' }}>
                  #{order.id}
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>{order.invoiceNo}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.customer}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{order.customerType} • {order.phone}</div>
                </td>
                <td style={{ color: '#475569', fontWeight: 500 }}>{formatDateToDMY(order.date)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                    <Truck size={14} style={{ color: '#6366f1' }} />
                    <span>{order.logistics || 'Self Pickup'}</span>
                  </div>
                </td>
                <td>
                  <PaymentStatusBadge paymentStatus={order.paymentStatus} />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{order.payMethod}</div>
                </td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(order.total)}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      onClick={async () => {
                        try {
                          const fullOrder = await getOrder(order.id);
                          const norm = normaliseOrder(fullOrder);
                          norm.customer = order.customer;
                          norm.customerType = order.customerType;
                          norm.phone = order.phone;
                          norm.email = order.email;
                          norm.shippingAddress = order.shippingAddress;
                          norm.logistics = order.logistics || norm.logistics;
                          norm.trackingNo = order.trackingNo || norm.trackingNo;
                          setSelectedOrder(norm);
                        } catch (err) {
                          alert(`Failed to load order details: ${err.message}`);
                        }
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#059669'}
                      onMouseOut={(e) => e.target.style.background = '#10b981'}
                    >
                      <Eye size={14} />
                      Details
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete Order #${order.id}?`)) {
                          try {
                            const res = await fetch(`${getApiDomain()}/api/Orders/${order.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setOrders(prev => prev.filter(o => o.id !== order.id));
                            } else {
                              alert('Failed to delete order.');
                            }
                          } catch (err) {
                            alert(`Error: ${err.message}`);
                          }
                        }
                      }}
                      title="Delete Order"
                      style={{
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No verified success orders found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* DETAILED ORDER POPUP MODAL SCREEN */}
      {selectedOrder && (
        <div className="orders-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="orders-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="orders-modal-header">
              <div>
                <h2>Order Details</h2>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Order #{selectedOrder.id} • Invoice {selectedOrder.invoiceNo}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="catalog-btn catalog-btn--primary"
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Printer size={14} /> Print Invoice
                </button>
                <button className="orders-modal-close-btn" onClick={() => setSelectedOrder(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="orders-modal-body">
              
              {/* Order Status Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Fulfillment Status</span>
                  <div style={{ marginTop: '4px' }}>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Date Placed</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginTop: '4px' }}>{formatDateToDMY(selectedOrder.date)}</strong>
                </div>
              </div>

              {/* Items Card */}
              <div className="detail-section-card">
                <h3>Purchased Items</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '8px 0', textAlign: 'left' }}>Item Details</th>
                        <th style={{ padding: '8px 8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 8px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0' }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.sku} • {item.category}</div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two Column Layout for Customer & Operations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                
                {/* Customer Info Card */}
                <div className="detail-section-card" style={{ marginBottom: 0 }}>
                  <h3>Customer Profiles</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <User size={15} style={{ color: '#10b981', marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '13px', display: 'block' }}>{selectedOrder.customer}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedOrder.customerType}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                      <Phone size={14} style={{ color: '#64748b' }} />
                      <span>{selectedOrder.phone}</span>
                    </div>
                    {selectedOrder.email && (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <Mail size={14} style={{ color: '#64748b' }} />
                        <span style={{ wordBreak: 'break-all' }}>{selectedOrder.email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <MapPin size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: '#475569' }}>{selectedOrder.shippingAddress || 'No Address Provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Operations & Shipping Info Card */}
                <div className="detail-section-card" style={{ marginBottom: 0 }}>
                  <h3>Logistics & Fulfillment</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="detail-info-row" style={{ padding: 0, borderBottom: 'none' }}>
                      <span className="detail-info-label">Carrier:</span>
                      <strong className="detail-info-value">{selectedOrder.logistics || 'Self Pickup'}</strong>
                    </div>
                    <div className="detail-info-row" style={{ padding: 0, borderBottom: 'none' }}>
                      <span className="detail-info-label">Tracking No:</span>
                      <strong className="detail-info-value" style={{ fontFamily: 'monospace' }}>{selectedOrder.trackingNo || '—'}</strong>
                    </div>

                    {/* Packer details */}
                    {selectedOrder.isPacked && (
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Packer Details</span>
                        <div className="tracking-user-profile" style={{ padding: '6px', background: '#f0fdf4', margin: '4px 0 0 0' }}>
                          {selectedOrder.packerImage ? (
                            <img className="tracking-user-avatar" src={selectedOrder.packerImage} alt={selectedOrder.packerName} style={{ width: '28px', height: '28px' }} />
                          ) : (
                            <div className="tracking-user-avatar" style={{ width: '28px', height: '28px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '10px', fontWeight: 700 }}>
                              {selectedOrder.packerName?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="tracking-user-details">
                            <strong style={{ fontSize: '11px' }}>{selectedOrder.packerName}</strong>
                            <span style={{ fontSize: '9px' }}>Packed {selectedOrder.packedDate || 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipper details */}
                    {selectedOrder.isShipped && (
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Shipper Details</span>
                        <div className="tracking-user-profile" style={{ padding: '6px', background: '#e0e7ff', margin: '4px 0 0 0' }}>
                          <div className="tracking-user-details" style={{ width: '100%' }}>
                            <strong style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{selectedOrder.shipperName}</span>
                              <span style={{ fontSize: '9px', color: '#4f46e5' }}>Shipped {selectedOrder.shippedDate}</span>
                            </strong>
                            {selectedOrder.packageImage && (
                              <img className="tracking-package-img" src={selectedOrder.packageImage} alt="Package" style={{ maxWidth: '80px', marginTop: '4px', maxHeight: '50px' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Payment Summary Details Card */}
              <div className="detail-section-card">
                <h3>Billing & Payments</h3>
                <div className="detail-info-row">
                  <span className="detail-info-label">Payment Method:</span>
                  <span className="detail-info-value">{selectedOrder.payMethod}</span>
                </div>
                {selectedOrder.utr && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">UTR/Reference Code:</span>
                    <span className="detail-info-value" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {selectedOrder.utr}
                    </span>
                  </div>
                )}
                <div className="detail-info-row">
                  <span className="detail-info-label">Subtotal:</span>
                  <span className="detail-info-value">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.shippingFee > 0 && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">Shipping Fee:</span>
                    <span className="detail-info-value">{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                )}
                {selectedOrder.gstAmount > 0 && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">GST:</span>
                    <span className="detail-info-value">{formatCurrency(selectedOrder.gstAmount)}</span>
                  </div>
                )}
                {selectedOrder.discountAmount > 0 && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">Discount:</span>
                    <span className="detail-info-value" style={{ color: '#ef4444' }}>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="detail-info-row">
                  <span className="detail-info-label">Total Amount:</span>
                  <span className="detail-info-value" style={{ color: '#059669', fontWeight: 700 }}>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">Paid Amount:</span>
                  <span className="detail-info-value">{formatCurrency(selectedOrder.paid)}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">Balance Amount:</span>
                  <span className="detail-info-value" style={{ color: selectedOrder.total - selectedOrder.paid > 0 ? '#d97706' : '#059669', fontWeight: 700 }}>
                    {formatCurrency(selectedOrder.total - selectedOrder.paid)}
                  </span>
                </div>
              </div>

              {/* Interactive Timeline */}
              {selectedOrder.timeline && (
                <div className="detail-section-card">
                  <h3>Fulfillment Tracker</h3>
                  <div className="modern-timeline">
                    {/* Hardcoded workflow representing dynamic order status */}
                    <div className="timeline-event completed">
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-title">Order Created</span>
                        <span className="timeline-time">{formatDateToDMY(selectedOrder.date)}</span>
                      </div>
                    </div>
                    <div className="timeline-event completed">
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-title">Payment Verified</span>
                        <span className="timeline-time">Verified Success</span>
                      </div>
                    </div>
                    <div className={`timeline-event ${selectedOrder.isPacked ? 'completed' : selectedOrder.status === 'Processing' ? 'active' : ''}`}>
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-title">Packed / Prepared</span>
                        {selectedOrder.isPacked ? (
                          <>
                            <span className="timeline-time">
                              {selectedOrder.packedDate === 'Verified' ? 'Automatically Verified' : `Packed on ${selectedOrder.packedDate}`} by {selectedOrder.packerName}
                            </span>
                          </>
                        ) : (
                          <span className="timeline-time">Pending Packaging</span>
                        )}
                      </div>
                    </div>
                    <div className={`timeline-event ${selectedOrder.isShipped ? 'completed' : selectedOrder.status === 'Dispatched' ? 'active' : ''}`}>
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-title">Dispatched / Shipped</span>
                        {selectedOrder.isShipped ? (
                          <>
                            <span className="timeline-time">
                              {selectedOrder.shippedDate === 'Verified' ? 'Automatically Verified' : `Shipped on ${selectedOrder.shippedDate}`} via {selectedOrder.logistics || 'Courier'} {selectedOrder.shipperName !== (selectedOrder.logistics || 'Courier') ? `by ${selectedOrder.shipperName}` : ''}
                            </span>
                          </>
                        ) : (
                          <span className="timeline-time">Pending Shipment Dispatch</span>
                        )}
                      </div>
                    </div>
                    <div className={`timeline-event ${selectedOrder.status === 'Completed' ? 'completed' : ''}`}>
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-title">Delivered & Closed</span>
                        <span className="timeline-time">{selectedOrder.status === 'Completed' ? 'Fulfillment Successful' : 'Awaiting Delivery Confirmation'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersLedger;
