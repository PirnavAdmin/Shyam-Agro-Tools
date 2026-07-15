import React, { useEffect, useState, useMemo } from 'react';
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
  DollarSign
} from 'lucide-react';
import { getOrders, getOrder } from '../api/orders';
import { Pagination } from '../components/ActionButtons';
import './adminOrders.css';

export const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

export const statusMeta = {
  Completed: { icon: CheckCircle2, className: 'status-pill completed' },
  Processing: { icon: Clock3, className: 'status-pill processing' },
  Dispatched: { icon: Truck, className: 'status-pill dispatched' },
  Cancelled: { icon: AlertCircle, className: 'status-pill cancelled' },
  Packed: { icon: Package, className: 'status-pill packed' }
};

export const OrderStatusBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.Processing;
  const Icon = meta.icon;
  return (
    <span className={meta.className}>
      <Icon size={12} style={{ marginRight: '4px' }} />
      {status}
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
export const mapStatus = (status) => {
  if (!status) return 'Processing';
  const s = status.toUpperCase();
  if (s === 'PENDING' || s === 'PROCESSING') return 'Processing';
  if (s === 'PACKED') return 'Packed';
  if (s === 'SHIPPED' || s === 'DISPATCHED') return 'Dispatched';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  return status;
};

// Helper to normalise order details
const normaliseOrder = (o) => {
  const totalVal = parseAmount(o.finalAmount || o.totalAmount || o.total);
  const statusMapped = mapStatus(o.fulfillment || o.status);
  
  return {
    id: o.id || o.orderId || '',
    invoiceNo: o.invoiceNo || o.invoiceNumber || `INV-${o.id}`,
    customer: o.customerName || o.customer || (o.customerDetails?.name) || 'Unknown',
    customerType: o.customerType || o.customerRole || (o.customerDetails?.type) || 'Farmer',
    phone: o.customerPhone || o.phone || (o.customerDetails?.phone) || '',
    email: o.customerEmail || o.email || (o.customerDetails?.email) || '',
    date: o.dateBooked ? o.dateBooked.slice(0, 10) : (o.orderDate ? o.orderDate.slice(0, 10) : (o.date ? o.date.slice(0, 10) : '')),
    deliveryDate: o.deliveryDate ? o.deliveryDate.slice(0, 10) : (o.expectedDelivery || 'TBD'),
    total: totalVal,
    paid: o.paidAmount !== undefined ? parseAmount(o.paidAmount) : (o.paymentStatus === 'Paid' ? totalVal : 0),
    status: statusMapped,
    paymentStatus: o.paymentStatus || 'Pending',
    payMethod: o.paymentMethod || o.payMethod || '',
    utr: o.utr || '',
    logistics: o.carrierName || o.logisticsPartner || o.logistics || '',
    trackingNo: o.trackingNumber || o.trackingNo || '',
    shippingAddress: o.shippingAddress || '',
    billingAddress: o.billingAddress || o.shippingAddress || '',
    notes: o.notes || o.adminNotes || '',
    // Packer / Shipper Details added
    isPacked: !!(o.packerName && o.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") || ['PACKED', 'DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()),
    packerName: (o.packerName && o.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") ? o.packerName : '',
    packerImage: o.packerPhotoUrl || o.packerImage || '',
    packedDate: o.packedDate || (o.packerName ? 'Verified' : ''),
    isShipped: !!(o.carrierName || o.trackingNumber) || ['DISPATCHED', 'SHIPPED', 'COMPLETED'].includes((o.fulfillment || o.status || '').toUpperCase()),
    shipperName: o.shipperName || o.carrierName || '',
    packageImage: o.packagePhotoUrl || o.packageImage || '',
    shippedDate: o.shippedDate || (o.carrierName ? 'Verified' : ''),
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

const OrdersLedger = () => {
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
          const custResponse = await fetch('https://shyamagrotools.com/api/Customers', {
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
  // Verified success means: paymentStatus is 'Paid', 'Verified', or 'Success' (case-insensitive)
  const verifiedOrders = useMemo(() => {
    return orders.filter(o => 
      ['paid', 'verified', 'success'].includes(o.paymentStatus?.toLowerCase())
    );
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
    });
  }, [verifiedOrders, searchTerm, dateFilter, startDate, endDate]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, startDate, endDate]);

  // Metrics (only verified success orders)
  const metrics = useMemo(() => {
    return verifiedOrders.reduce(
      (summary, order) => ({
        revenue: summary.revenue + order.total,
        completed: summary.completed + (order.status === 'Completed' ? 1 : 0),
        dispatched: summary.dispatched + (order.status === 'Dispatched' ? 1 : 0),
        processing: summary.processing + (order.status === 'Processing' ? 1 : 0)
      }),
      { revenue: 0, completed: 0, dispatched: 0, processing: 0 }
    );
  }, [verifiedOrders]);

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
                <td style={{ color: '#475569', fontWeight: 500 }}>{order.date}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                    <Truck size={14} style={{ color: '#6366f1' }} />
                    <span>{order.logistics || 'Self Pickup'}</span>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                    <ShieldCheck size={14} />
                    Verified Paid
                  </span>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{order.payMethod}</div>
                </td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(order.total)}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={async () => {
                      try {
                        const fullOrder = await getOrder(order.id);
                        setSelectedOrder(normaliseOrder(fullOrder));
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
              <button className="orders-modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
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
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginTop: '4px' }}>{selectedOrder.date}</strong>
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
                        <span className="timeline-time">{selectedOrder.date}</span>
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
                            <span className="timeline-time">Packed on {selectedOrder.packedDate} by {selectedOrder.packerName}</span>
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
                            <span className="timeline-time">Shipped on {selectedOrder.shippedDate} via {selectedOrder.logistics || 'Delhivery'} by {selectedOrder.shipperName}</span>
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
