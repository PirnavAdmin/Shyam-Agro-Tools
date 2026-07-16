import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Headphones, MapPin, Package, RefreshCw, Truck, FileText, Download, Upload, X, AlertTriangle, Plus } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getOrderTracking, getOrders } from '../utils/orders';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import { getCurrentUserOrdersFromApi } from '../../services/orderService';
import { getOrCreateInvoiceForOrder } from '../../services/invoiceService';
import * as returnsService from '../../services/returnsService';
import { getAddresses, createAddress } from '../../services/customerAddressService';
import { jsPDF } from 'jspdf';
import './MyOrdersPage.css';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getUserMobile = (user) => user?.phone || user?.mobileNumber || user?.MobileNumber || '';

const mergeOrders = (apiOrders = [], localOrders = []) => {
  const merged = new Map();

  [...localOrders, ...apiOrders].forEach((order) => {
    if (order?.id) merged.set(String(order.id), order);
  });

  return Array.from(merged.values()).sort((a, b) => (
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ));
};

const MyOrdersPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [backendOrders, setBackendOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const mobileNumber = getUserMobile(user);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const filteredOrders = useMemo(() => {
    if (!backendOrders || backendOrders.length === 0) return [];
    if (dateFilter === 'all') return backendOrders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return backendOrders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);

      if (dateFilter === 'today') {
        return orderDate >= startOfToday;
      }

      if (dateFilter === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }

      if (dateFilter === 'month') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }

      if (dateFilter === 'custom') {
        let isMatch = true;
        if (customStartDate) {
          const startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          isMatch = isMatch && orderDate >= startDate;
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          isMatch = isMatch && orderDate <= endDate;
        }
        return isMatch;
      }

      return true;
    });
  }, [backendOrders, dateFilter, customStartDate, customEndDate]);

  const orders = filteredOrders;
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0] || null;
  const tracking = selectedOrder ? getOrderTracking(selectedOrder) : null;
  const ordersHeaderText = orders.length > 0 ? 'Here are your orders' : 'No orders placed yet';

  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const [orderReturns, setOrderReturns] = useState([]);
  const [returnsConfig, setReturnsConfig] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [activeReturnItem, setActiveReturnItem] = useState(null);

  const returnsByOrderItemId = useMemo(() => {
    const map = new Map();
    if (Array.isArray(orderReturns)) {
      orderReturns.forEach((ret) => {
        if (ret && ret.orderItemId) {
          map.set(String(ret.orderItemId), ret);
        }
      });
    }
    return map;
  }, [orderReturns]);

  // Load Returns Config and User Addresses
  useEffect(() => {
    let isMounted = true;
    returnsService.getReturnsConfig()
      .then(config => {
        if (isMounted && config?.success) setReturnsConfig(config);
      })
      .catch(err => console.warn('Failed to load returns config:', err));

    if (isAuthenticated) {
      getAddresses()
        .then(res => {
          if (isMounted) setAddresses(res);
        })
        .catch(err => console.warn('Failed to fetch addresses:', err));
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Load returns for selected order
  useEffect(() => {
    let isMounted = true;
    const fetchOrderReturns = async () => {
      if (!selectedOrder) {
        setOrderReturns([]);
        return;
      }
      try {
        const res = await returnsService.getReturnByOrderId(selectedOrder.id);
        if (isMounted && res) {
          const retList = Array.isArray(res) ? res : (res.items || [res].filter(Boolean));
          setOrderReturns(retList);
        }
      } catch (err) {
        console.warn('Failed to fetch order returns:', err.message);
        if (isMounted) setOrderReturns([]);
      }
    };

    fetchOrderReturns();

    return () => {
      isMounted = false;
    };
  }, [selectedOrder]);

  const handleInitiateReturn = async (item) => {
    try {
      const check = await returnsService.checkEligibility(item.orderItemId);
      if (check && check.success === false) {
        alert(check.message || 'This item is not eligible for return.');
        return;
      }
      setActiveReturnItem(item);
    } catch (err) {
      console.warn('Eligibility check failed, proceeding to modal fallback:', err);
      setActiveReturnItem(item);
    }
  };

  const openSupportForOrder = (orderId, issueType = 'Order issue') => {
    navigate(`/contact-support?orderId=${encodeURIComponent(orderId)}&issue=${encodeURIComponent(issueType)}#contact-us`);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInvoiceData = async () => {
      if (!selectedOrder) {
        setInvoice(null);
        return;
      }
      setInvoiceLoading(true);
      setInvoiceError('');
      try {
        const invData = await getOrCreateInvoiceForOrder(selectedOrder);
        if (isMounted) {
          setInvoice(invData);
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
        if (isMounted) {
          setInvoiceError('Unable to load invoice.');
        }
      } finally {
        if (isMounted) {
          setInvoiceLoading(false);
        }
      }
    };

    fetchInvoiceData();

    return () => {
      isMounted = false;
    };
  }, [selectedOrder]);

  const handleDownloadPdf = (order, inv) => {
    if (!order || !inv) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors matching premium layout
      const primaryGreen = [15, 94, 78];     // Forest Green #0F5E4E
      const lightBg = [245, 247, 248];       // Light gray-teal background
      const darkText = [45, 55, 72];         // Charcoal text
      const grayText = [113, 128, 150];      // Slate gray for labels
      const borderLine = [226, 232, 240];    // Light border color

      // 1. Accent Line at the top
      doc.setFillColor(...primaryGreen);
      doc.rect(15, 12, 180, 2, 'F');

      // 2. Header Row
      // Brand Text "SHYAM AGRO TOOLS"
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('SHYAM AGRO TOOLS', 15, 24);

      // Sub-brand / Tagline
      doc.setTextColor(...grayText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('High-Quality Agricultural Tools & Equipment', 15, 28);

      // TAX INVOICE Header on the right
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('TAX INVOICE', 195, 24, { align: 'right' });

      // Invoice metadata on the right
      const invNo = inv.invoiceNo || order.id;
      const invDate = formatDate(inv.date || order.createdAt);
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Invoice No: ${invNo}`, 195, 29, { align: 'right' });
      doc.text(`Date: ${invDate}`, 195, 33, { align: 'right' });

      // Horizontal separator line
      doc.setDrawColor(...borderLine);
      doc.setLineWidth(0.3);
      doc.line(15, 37, 195, 37);

      // Helper to split address beautifully into wrapped lines
      const formatAddressLines = (addrObj) => {
        if (!addrObj) return ['N/A'];
        if (typeof addrObj === 'string') {
          return doc.splitTextToSize(addrObj, 75);
        }
        const mainAddr = addrObj.address || addrObj.Address || '';
        const city = addrObj.city || addrObj.City || '';
        const state = addrObj.state || addrObj.State || '';
        const zip = addrObj.zip || addrObj.Zip || addrObj.postalCode || addrObj.PostalCode || '';
        const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
        
        const lines = [];
        if (mainAddr) {
          lines.push(...doc.splitTextToSize(mainAddr, 75));
        }
        if (cityStateZip) {
          lines.push(...doc.splitTextToSize(cityStateZip, 75));
        }
        return lines.length > 0 ? lines : ['N/A'];
      };

      // 3. Grid Sections
      // Row 1: Sold By & Order Details (y = 42)
      const row1Y = 42;
      
      // Sold By
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Sold By:', 15, row1Y);
      
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('SHYAM AGRO TOOLS', 15, row1Y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Sidhpur, Gujarat - 384151', 15, row1Y + 9);
      doc.text('GSTIN: 24DYYPP1677P1Z6', 15, row1Y + 13);
      doc.text('PAN: DYYPP1677P', 15, row1Y + 17);

      // Order Details
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Order Details:', 110, row1Y);
      
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Order ID: ${order.id}`, 110, row1Y + 5);
      doc.text(`Order Date: ${formatDate(order.createdAt)}`, 110, row1Y + 9);
      doc.text(`Payment Method: ${order.paymentMethod || 'COD'}`, 110, row1Y + 13);
      doc.text(`Payment Status: ${order.paymentStatus || 'Payment Pending'}`, 110, row1Y + 17);

      // Horizontal separator line
      doc.line(15, row1Y + 22, 195, row1Y + 22);

      // Row 2: Billing & Shipping Address (y = row1Y + 26 = 68)
      const row2Y = row1Y + 26;

      // Billing Address
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Billing Address:', 15, row2Y);
      
      const billName = inv.billingName || order.billingDetails?.name || 'Customer';
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(billName, 15, row2Y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const billAddrLines = formatAddressLines(order.billingDetails?.address || inv.billingAddress || order.shippingAddress);
      let billY = row2Y + 9;
      billAddrLines.forEach(line => {
        doc.text(line, 15, billY);
        billY += 4;
      });
      if (order.billingDetails?.phone || inv.billingPhone) {
        doc.text(`Phone: ${order.billingDetails?.phone || inv.billingPhone}`, 15, billY);
      }

      // Shipping Address
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Shipping Address:', 110, row2Y);
      
      const shipName = inv.shippingName || order.shippingAddress?.name || 'Customer';
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(shipName, 110, row2Y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const shipAddrLines = formatAddressLines(inv.shippingAddress || order.shippingAddress);
      let shipY = row2Y + 9;
      shipAddrLines.forEach(line => {
        doc.text(line, 110, shipY);
        shipY += 4;
      });
      if (order.shippingAddress?.phone || inv.shippingPhone) {
        doc.text(`Phone: ${order.shippingAddress?.phone || inv.shippingPhone}`, 110, shipY);
      }

      // 4. Product Details Table
      let tableY = Math.max(billY, shipY) + 6;
      if (tableY > 120) {
        doc.addPage();
        tableY = 20;
      }

      // Header block
      doc.setFillColor(...primaryGreen);
      doc.rect(15, tableY, 180, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text('S.No.', 17, tableY + 5.5);
      doc.text('Product Description', 24, tableY + 5.5);
      doc.text('SKU', 85, tableY + 5.5);
      doc.text('Qty', 113, tableY + 5.5, { align: 'right' });
      doc.text('Rate', 133, tableY + 5.5, { align: 'right' });
      doc.text('Taxable Value', 153, tableY + 5.5, { align: 'right' });
      doc.text('GST', 173, tableY + 5.5, { align: 'right' });
      doc.text('Total', 193, tableY + 5.5, { align: 'right' });

      // Table Rows
      let currentY = tableY + 8;
      const items = order.items || [];
      
      let totalQty = 0;
      let totalDiscount = 0;
      let totalTaxable = 0;
      let totalTax = 0;
      let totalAmount = 0;

      items.forEach((item, index) => {
        const prodName = item.name || 'Product';
        const splitName = doc.splitTextToSize(prodName, 58);
        const rowHeight = Math.max(splitName.length * 4.2, 8);

        if (currentY + rowHeight > 255) {
          doc.addPage();
          currentY = 20;
        }

        // Math Calculations
        const qty = Number(item.quantity) || 1;
        const grossAmount = (Number(item.price) || 0) * qty;
        
        // Distribute discount proportionally
        const orderSubtotal = Number(order.subtotal || order.total || 0);
        const ratio = orderSubtotal > 0 ? (grossAmount / orderSubtotal) : (1 / items.length);
        const discountVal = (Number(order.discount) || 0) * ratio;

        const taxableValue = grossAmount - discountVal;
        const taxVal = Number(item.taxAmount) || 0;
        const rowTotal = taxableValue + taxVal;

        // Sum Aggregators
        totalQty += qty;
        totalDiscount += discountVal;
        totalTaxable += taxableValue;
        totalTax += taxVal;
        totalAmount += rowTotal;

        // Draw Row Border
        doc.setDrawColor(...borderLine);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Content
        doc.setTextColor(...darkText);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        // Columns alignment matching table headers:
        // S.No (17), Description (24), SKU (85), Qty (113), Rate (133), Taxable (153), GST (173), Total (193)
        doc.text(String(index + 1), 17, currentY + 5.5);
        doc.text(splitName, 24, currentY + 5.5);
        doc.text(String(item.sku || '-'), 85, currentY + 5.5);
        doc.text(String(qty), 113, currentY + 5.5, { align: 'right' });
        doc.text(`Rs. ${Number(item.price || 0).toFixed(2)}`, 133, currentY + 5.5, { align: 'right' });
        doc.text(`Rs. ${taxableValue.toFixed(2)}`, 153, currentY + 5.5, { align: 'right' });
        doc.text(`Rs. ${taxVal.toFixed(2)}`, 173, currentY + 5.5, { align: 'right' });
        doc.text(`Rs. ${rowTotal.toFixed(2)}`, 193, currentY + 5.5, { align: 'right' });

        currentY += rowHeight;
      });

      // Sum Aggregation Row
      if (currentY + 8 > 255) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFillColor(...lightBg);
      doc.rect(15, currentY, 180, 8, 'F');

      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text('Total', 24, currentY + 5.5);
      doc.text(String(totalQty), 113, currentY + 5.5, { align: 'right' });
      doc.text(`Rs. ${totalTaxable.toFixed(2)}`, 153, currentY + 5.5, { align: 'right' });
      doc.text(`Rs. ${totalTax.toFixed(2)}`, 173, currentY + 5.5, { align: 'right' });
      doc.text(`Rs. ${totalAmount.toFixed(2)}`, 193, currentY + 5.5, { align: 'right' });

      currentY += 8;

      // 5. Footer and Totals
      let footerY = currentY + 10;
      if (footerY + 45 > 280) {
        doc.addPage();
        footerY = 20;
      }

      // Draw footer divider
      doc.setDrawColor(...borderLine);
      doc.line(15, footerY - 2, 195, footerY - 2);

      // Left Side: Bank details and terms
      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Bank Details', 15, footerY + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...darkText);
      doc.text('Bank Name: State Bank of India', 15, footerY + 8);
      doc.text('Account Name: Shyam Agro Tools', 15, footerY + 12);
      doc.text('Account No: 39482019482', 15, footerY + 16);
      doc.text('IFSC Code: SBIN0001234', 15, footerY + 20);

      doc.setTextColor(...primaryGreen);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Terms & Conditions', 15, footerY + 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...darkText);
      doc.text('1. Goods once sold will not be returned.', 15, footerY + 33);
      doc.text('2. Subject to Gujarat jurisdiction.', 15, footerY + 37);

      // Right Side: Summary Card
      const summaryX = 135;
      doc.setFillColor(...lightBg);
      doc.rect(summaryX, footerY, 60, 24, 'F');
      doc.setDrawColor(...borderLine);
      doc.rect(summaryX, footerY, 60, 24, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...darkText);
      
      doc.text('Subtotal:', summaryX + 4, footerY + 5);
      doc.text(`Rs. ${totalTaxable.toFixed(2)}`, 191, footerY + 5, { align: 'right' });

      doc.text('Discount:', summaryX + 4, footerY + 10);
      doc.text(`Rs. ${totalDiscount.toFixed(2)}`, 191, footerY + 10, { align: 'right' });

      doc.text('GST Total:', summaryX + 4, footerY + 15);
      doc.text(`Rs. ${totalTax.toFixed(2)}`, 191, footerY + 15, { align: 'right' });

      // Draw horizontal line inside summary
      doc.line(summaryX, footerY + 17, summaryX + 60, footerY + 17);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Grand Total:', summaryX + 4, footerY + 21);
      doc.text(`Rs. ${totalAmount.toFixed(2)}`, 191, footerY + 21, { align: 'right' });

      // Signatory
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('For SHYAM AGRO TOOLS', 190, footerY + 33, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Authorized Signatory', 190, footerY + 41, { align: 'right' });

      // 6. Computer Generated Disclaimer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...grayText);
      doc.text('This is a computer generated invoice and does not require signature.', 15, 283);

      // Save PDF with custom name
      doc.save(`Shyam_Agro_Tools_Invoice_${invNo}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (authLoading) return;
      if (!isAuthenticated) {
        setBackendOrders([]);
        setIsOrdersLoading(false);
        return;
      }

      setIsOrdersLoading(true);
      setOrdersError('');

      try {
        const apiOrders = await getCurrentUserOrdersFromApi();
        const localOrders = getOrders(mobileNumber);
        if (isMounted) setBackendOrders(mergeOrders(apiOrders, localOrders));
      } catch (error) {
        console.error('Unable to refresh orders.', error);
        if (isMounted) {
          const localOrders = getOrders(mobileNumber);
          setBackendOrders(localOrders);
          setOrdersError('');
        }
      } finally {
        if (isMounted) setIsOrdersLoading(false);
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, mobileNumber]);

  return (
    <div className="my-orders-shell flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="my-orders-container">
        <div className="my-orders-header">
          <span>Account</span>
          <h1>My Orders</h1>
          <p>{ordersHeaderText}</p>
          {isOrdersLoading && (
            <small className="orders-refresh-note"><RefreshCw size={13} className="animate-spin" /> Refreshing orders...</small>
          )}
          {ordersError && <small className="orders-refresh-note warning">{ordersError}</small>}
        </div>

        {backendOrders.length === 0 ? (
          <section className="my-orders-empty">
            <span className="my-orders-empty-icon"><Package size={30} /></span>
            <h2>No orders placed yet</h2>
            <p>Your placed orders will appear here after checkout.</p>
            <button type="button" onClick={() => navigate('/categories')}>Shop Categories</button>
          </section>
        ) : (
          <div className="my-orders-layout">
            <section className="orders-history-panel" aria-label="Order history">
              <div className="orders-panel-title">
                <span className="orders-panel-title-text">
                  <Package size={18} />
                  <h2>Order History</h2>
                </span>
                <div className="orders-filter-container">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="orders-filter-select"
                    aria-label="Filter orders by date"
                  >
                    <option value="all">All Orders</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {dateFilter === 'custom' && (
                <div className="custom-date-inputs">
                  <div className="date-input-group">
                    <label htmlFor="filter-start-date">From:</label>
                    <input
                      id="filter-start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="custom-date-field"
                    />
                  </div>
                  <div className="date-input-group">
                    <label htmlFor="filter-end-date">To:</label>
                    <input
                      id="filter-end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="custom-date-field"
                    />
                  </div>
                </div>
              )}

              <div className="orders-history-list">
                {orders.length === 0 ? (
                  <div className="orders-filter-empty">
                    <p>No orders match this filter.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`order-history-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  >
                    <span className="order-history-top">
                      <strong>{order.id}</strong>
                      <span>{order.status || 'Order Placed'}</span>
                    </span>
                    <span className="order-history-products">
                      {(order.items || []).map((item) => item.name).join(', ') || 'Order products'}
                    </span>
                    <span className="order-history-meta">
                      <span><CalendarDays size={14} /> {formatDate(order.createdAt)}</span>
                      <span>{formatCurrency(order.total)}</span>
                    </span>
                  </button>
                )))}
              </div>
            </section>

            {selectedOrder && (
              <section className="order-detail-panel" aria-label="Order details">
                <div className="order-detail-header">
                  <div>
                    <span>Order Details</span>
                    <h2>{selectedOrder.id}</h2>
                  </div>
                  <div className="order-detail-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/track-order?orderId=${encodeURIComponent(selectedOrder.id)}`)}
                    >
                      <Truck size={16} /> Track
                    </button>
                    <button
                      type="button"
                      onClick={() => openSupportForOrder(selectedOrder.id)}
                    >
                      <Headphones size={16} /> Support
                    </button>
                  </div>
                </div>

                <div className="order-summary-grid">
                  <div><span>Order Date</span><strong>{formatDate(selectedOrder.createdAt)}</strong></div>
                  <div><span>Total Amount</span><strong>{formatCurrency(selectedOrder.total)}</strong></div>
                  <div><span>Payment Status</span><strong>{selectedOrder.paymentStatus || 'Payment Pending'}</strong></div>
                  <div><span>Quantity</span><strong>{(selectedOrder.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong></div>
                </div>

                <div className="ordered-products">
                  <h3>Ordered Products</h3>
                  {(selectedOrder.items || []).map((item) => {
                    const existingReturn = returnsByOrderItemId.get(String(item.orderItemId));
                    return (
                      <div key={`${selectedOrder.id}-${item.id}`} className="ordered-product-row flex-wrap">
                        <span className="ordered-product-image">
                          <img src={getProductImage(item)} alt={item.name} loading="lazy" onError={handleProductImageError} />
                        </span>
                        <span className="flex-1">
                          <strong>{item.name}</strong>
                          <small>Qty {item.quantity} x {formatCurrency(item.price)}</small>
                          {existingReturn && (
                            <span className={`return-status-badge ${existingReturn.status?.toLowerCase() || 'pending'}`}>
                              Return: {existingReturn.status || 'Pending'}
                            </span>
                          )}
                        </span>
                        <div className="ordered-product-right">
                          <b>{formatCurrency(item.total)}</b>
                          {!existingReturn && (
                            <button
                              type="button"
                              onClick={() => handleInitiateReturn(item)}
                              className="item-return-btn"
                            >
                              Return / Refund
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                 <div className="order-info-grid">
                   <div className="order-info-card">
                     <h3><MapPin size={16} /> Shipping Address</h3>
                     <p>{selectedOrder.shippingAddress?.address || '-'}</p>
                     <p>{[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.zip].filter(Boolean).join(', ')}</p>
                   </div>
                   <div className="order-info-card">
                     <h3><CreditCard size={16} /> Billing & Payment</h3>
                     <p>{selectedOrder.billingDetails?.name || '-'}</p>
                     <p>{selectedOrder.billingDetails?.email || ''}</p>
                     <p>{selectedOrder.paymentMethod || '-'} · {selectedOrder.paymentStatus || 'Payment Pending'}</p>
                   </div>
                 </div>

                 <div className="order-invoice-section">
                   <div className="order-info-card invoice-info-card">
                     <div className="invoice-card-header">
                       <h3><FileText size={16} /> Tax Invoice</h3>
                       {invoice && (
                         <button
                           type="button"
                           onClick={() => handleDownloadPdf(selectedOrder, invoice)}
                           className="download-invoice-btn"
                           title="Download Invoice as PDF"
                         >
                           <Download size={14} /> Download PDF
                         </button>
                       )}
                     </div>
                     
                     {invoiceLoading ? (
                       <div className="invoice-status-message">
                         <RefreshCw size={14} className="animate-spin animate-spin-slow" /> Loading invoice details...
                       </div>
                     ) : invoiceError ? (
                       <div className="invoice-status-message error">
                         {invoiceError}
                       </div>
                     ) : invoice ? (
                       <div className="invoice-details-grid">
                         <div>
                           <span>Invoice No</span>
                           <strong>{invoice.invoiceNo || selectedOrder.id}</strong>
                         </div>
                         <div>
                           <span>Invoice Date</span>
                           <strong>{formatDate(invoice.date || selectedOrder.createdAt)}</strong>
                         </div>
                         <div>
                           <span>Sub Total</span>
                           <strong>{formatCurrency(Number(invoice.subTotal) || selectedOrder.subtotal || selectedOrder.total || 0)}</strong>
                         </div>
                         <div>
                           <span>Tax Amount (GST)</span>
                           <strong>{formatCurrency(Number(invoice.taxAmount) || selectedOrder.gst || 0)}</strong>
                         </div>
                         <div>
                           <span>Discount</span>
                           <strong>{formatCurrency(Number(invoice.discount) || selectedOrder.discount || 0)}</strong>
                         </div>
                         <div>
                           <span>Grand Total</span>
                           <strong>{formatCurrency(Number(invoice.totalAmount) || selectedOrder.total || 0)}</strong>
                         </div>
                       </div>
                     ) : (
                       <div className="invoice-status-message">
                         No invoice available for this order.
                       </div>
                     )}
                   </div>
                 </div>

                {tracking && (
                  <div className="my-order-tracking" style={{ '--order-progress': `${tracking.progressPercent}%` }}>
                    <div className="tracking-title">
                      <h3>Order Tracking</h3>
                      <span>{tracking.status}</span>
                    </div>
                    <div className="tracking-progress" aria-hidden="true">
                      <span></span>
                    </div>
                    <div className="tracking-step-grid">
                      {tracking.steps.map((step, index) => (
                        <div key={step.label} className={`tracking-step-card ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                          <span>{step.completed ? <i className="fas fa-check"></i> : index + 1}</span>
                          <strong>{step.label}</strong>
                          <small>{step.date}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {activeReturnItem && (
        <ReturnRequestModal
          item={activeReturnItem}
          order={selectedOrder}
          config={returnsConfig}
          addresses={addresses}
          onAddressCreated={(newAddr) => setAddresses([...addresses, newAddr])}
          onClose={() => setActiveReturnItem(null)}
          onSubmitSuccess={() => {
            setActiveReturnItem(null);
            returnsService.getReturnByOrderId(selectedOrder.id)
              .then(res => {
                const retList = Array.isArray(res) ? res : (res?.items || [res].filter(Boolean));
                setOrderReturns(retList);
              })
              .catch(err => console.error(err));
          }}
        />
      )}
    </div>
  );
};

const ReturnRequestModal = ({ item, order, config, addresses, onAddressCreated, onClose, onSubmitSuccess }) => {
  const [requestType, setRequestType] = useState('RETURN_REFUND');
  const [reasonCode, setReasonCode] = useState('PRODUCT_DAMAGED');
  const [description, setDescription] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT_METHOD');
  const [pickupAddressId, setPickupAddressId] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    email: order.billingDetails?.email || '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  useEffect(() => {
    if (config) {
      if (config.requestTypes?.length > 0) setRequestType(config.requestTypes[0].code);
      if (config.reasons?.length > 0) setReasonCode(config.reasons[0].code);
      if (config.refundMethods?.length > 0) setRefundMethod(config.refundMethods[0].code);
    }
  }, [config]);

  useEffect(() => {
    if (addresses?.length > 0 && !pickupAddressId) {
      setPickupAddressId(addresses[0].addressId || addresses[0].id || '');
    }
  }, [addresses, pickupAddressId]);

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (!newAddress.firstName || !newAddress.lastName || !newAddress.fullAddress || !newAddress.city || !newAddress.state || !newAddress.pincode || !newAddress.phoneNumber) {
      alert('Please fill in all required address fields.');
      return;
    }
    setAddressSubmitting(true);
    try {
      const created = await createAddress(newAddress);
      if (created) {
        onAddressCreated(created);
        setPickupAddressId(created.addressId || created.id);
        setShowAddAddress(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add address.');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = config?.maximumEvidenceFiles || 4;
    const maxSize = (config?.maximumFileSizeMb || 5) * 1024 * 1024;
    const allowedTypes = config?.allowedFileTypes || ['image/jpeg', 'image/png', 'image/webp'];

    if (evidenceFiles.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} evidence files.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds the size limit of ${config?.maximumFileSizeMb || 5}MB.`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}.`);
        continue;
      }
      validFiles.push(file);
    }

    setEvidenceFiles([...evidenceFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pickupAddressId) {
      setErrorMsg('Please select or add a pickup address.');
      return;
    }

    const currentReason = config?.reasons?.find(r => r.code === reasonCode);
    if (currentReason?.descriptionRequired && !description.trim()) {
      setErrorMsg('Please provide a detailed description for this return reason.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('OrderId', String(order.backendId || order.id || ''));
      formData.append('OrderItemId', String(item.orderItemId || ''));
      formData.append('RequestType', requestType);
      formData.append('ReasonCode', reasonCode);
      formData.append('Description', description);
      formData.append('RequestedQuantity', String(requestedQuantity));
      
      if (requestType === 'RETURN_REFUND') {
        formData.append('RefundMethod', refundMethod);
      }
      
      formData.append('PickupAddressId', String(pickupAddressId));
      
      evidenceFiles.forEach((file) => {
        formData.append('EvidenceFiles', file);
      });

      const res = await returnsService.submitReturnRequest(formData);
      if (res && (res.success || res.id)) {
        alert('Return request submitted successfully!');
        onSubmitSuccess();
      } else {
        setErrorMsg(res.message || 'Failed to submit return request.');
      }
    } catch (err) {
      console.error(err);
      const detailMsg = err.response?.data?.message || 
                        err.response?.data?.title || 
                        (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : '') || 
                        err.message || 
                        'Error submitting return request.';
      setErrorMsg(detailMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="return-modal-overlay" role="dialog" aria-modal="true">
      <div className="return-modal-content">
        <div className="return-modal-header">
          <h2>Return & Refund Request</h2>
          <button type="button" onClick={onClose} className="return-modal-close-btn"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="return-modal-form">
          <div className="return-product-summary">
            <span>Returning:</span>
            <strong>{item.name}</strong>
            <small>Qty ordered: {item.quantity} · Price: {formatCurrency(item.price)}</small>
          </div>

          {errorMsg && (
            <div className="return-form-error">
              <AlertTriangle size={14} /> {errorMsg}
            </div>
          )}

          <div className="return-form-row">
            <div className="return-form-group">
              <label>Request Type</label>
              <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                {config?.requestTypes?.map(t => (
                  <option key={t.code} value={t.code}>{t.title}</option>
                )) || (
                  <>
                    <option value="RETURN_REFUND">Return & Refund</option>
                    <option value="REPLACEMENT_EXCHANGE">Replacement & Exchange</option>
                  </>
                )}
              </select>
            </div>

            <div className="return-form-group">
              <label>Quantity to Return</label>
              <input
                type="number"
                min="1"
                max={item.quantity}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="return-form-group">
            <label>Return Reason</label>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
              {config?.reasons?.map(r => (
                <option key={r.code} value={r.code}>{r.title}</option>
              )) || (
                <>
                  <option value="PRODUCT_DAMAGED">Product arrived damaged</option>
                  <option value="WRONG_PRODUCT">Wrong product received</option>
                  <option value="OTHER">Other</option>
                </>
              )}
            </select>
          </div>

          {requestType === 'RETURN_REFUND' && (
            <div className="return-form-group">
              <label>Refund Method</label>
              <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                {config?.refundMethods?.map(m => (
                  <option key={m.code} value={m.code}>{m.title}</option>
                )) || (
                  <>
                    <option value="ORIGINAL_PAYMENT_METHOD">Original Payment Method</option>
                    <option value="SAT_WALLET">SAT Wallet</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className="return-form-group">
            <label>Detailed Description</label>
            <textarea
              rows="3"
              placeholder="Provide details about the issue..."
              maxLength={config?.maximumDescriptionLength || 600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <small className="char-counter">
              {description.length}/{config?.maximumDescriptionLength || 600} chars
            </small>
          </div>

          <div className="return-form-group">
            <label>Pickup Address</label>
            {!showAddAddress ? (
              <div className="address-selector-row">
                <select value={pickupAddressId} onChange={(e) => setPickupAddressId(e.target.value)}>
                  <option value="">-- Select saved address --</option>
                  {addresses.map(addr => {
                    const addressId = addr.addressId || addr.id;
                    return (
                      <option key={addressId} value={addressId}>
                        {(addr.firstName || addr.name || '')} {(addr.lastName || '')} - {addr.fullAddress || addr.address || ''}, {addr.city || ''}
                      </option>
                    );
                  })}
                </select>
                <button type="button" onClick={() => setShowAddAddress(true)} className="add-address-btn">
                  <Plus size={14} /> Add New
                </button>
              </div>
            ) : (
              <div className="new-address-form-box">
                <h4>Add New Pickup Address</h4>
                <div className="address-form-grid">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newAddress.firstName}
                    onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newAddress.lastName}
                    onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newAddress.phoneNumber}
                    onChange={(e) => setNewAddress({...newAddress, phoneNumber: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newAddress.fullAddress}
                    onChange={(e) => setNewAddress({...newAddress, fullAddress: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Pincode / ZIP"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                  />
                </div>
                <div className="new-address-actions">
                  <button type="button" onClick={handleAddAddressSubmit} disabled={addressSubmitting} className="save-address-btn">
                    {addressSubmitting ? 'Saving...' : 'Save & Select'}
                  </button>
                  <button type="button" onClick={() => setShowAddAddress(false)} className="cancel-address-btn">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="return-form-group">
            <label>Evidence Files (Photos/Proof)</label>
            <div className="file-uploader-box">
              <input
                type="file"
                multiple
                accept={config?.allowedFileTypes?.join(',') || 'image/*'}
                onChange={handleFileChange}
                id="return-evidence-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="return-evidence-input" className="file-upload-dropzone">
                <Upload size={20} />
                <span>Click to upload evidence photos</span>
                <small>Max {config?.maximumEvidenceFiles || 4} files (up to {config?.maximumFileSizeMb || 5}MB each)</small>
              </label>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="evidence-previews">
                {evidenceFiles.map((file, idx) => (
                  <div key={idx} className="evidence-preview-card">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx)} className="remove-file-btn"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="return-modal-actions">
            <button type="button" onClick={onClose} className="return-cancel-btn" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="return-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyOrdersPage;
