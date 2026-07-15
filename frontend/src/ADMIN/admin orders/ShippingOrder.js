import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Package,
  Truck,
  Image as ImageIcon,
  UserCheck,
  Compass,
  AlertCircle
} from 'lucide-react';
import { getOrdersShipping, getOrderShipping, packOrder, dispatchOrder, updateOrderStatus } from '../api/orders';
import { OrderStatusBadge, mapStatus } from './OrdersLedger';
import './adminOrders.css';

// Preset avatar list for packers
const PRESET_PACKERS = [
  { name: 'Ramesh Sawant', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
  { name: 'Karan Malhotra', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' },
  { name: 'Sanjay Dutt', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' }
];

// Preset images for packages
const PRESET_PACKAGES = [
  { name: 'Standard Box', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=150&auto=format&fit=crop&q=60' },
  { name: 'Wooden Crate', url: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=150&auto=format&fit=crop&q=60' }
];

const ShippingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Packing Form State
  const [packerName, setPackerName] = useState('');
  const [packerImage, setPackerImage] = useState('');

  // Shipping Form State
  const [shipperName, setShipperName] = useState('');
  const [packageImage, setPackageImage] = useState('');
  const [logisticsName, setLogisticsName] = useState('Delhivery');
  const [trackingNo, setTrackingNo] = useState('');

  const [formMsg, setFormMsg] = useState({ text: '', isError: false });

  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrdersShipping();
      const list = Array.isArray(data) ? data : (data.orders || data.data || []);
      setOrders(list);
      
      if (list.length > 0 && !selectedOrderId) {
        setSelectedOrderId(list[0].id || list[0].orderId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load shipping ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full details when selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setActiveOrderDetails(null);
      return;
    }
    let isMounted = true;
    const loadDetails = async () => {
      try {
        setDetailsLoading(true);
        const details = await getOrderShipping(selectedOrderId);
        if (isMounted) {
          const statusUpper = String(details.currentStatus || '').toUpperCase();
          const isPacked = ['TO BE SHIPPED', 'SHIPPED', 'DISPATCHED', 'PACKED'].includes(statusUpper);
          const isShipped = ['SHIPPED', 'DISPATCHED', 'COMPLETED'].includes(statusUpper);

          const mappedDetails = {
            ...details,
            id: details.orderId,
            status: mapStatus(details.currentStatus),
            isPacked,
            isShipped,
            destination: details.destination || 'Self Pickup',
            packerName: (details.packerName && details.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") ? details.packerName : '',
            packerImage: details.packerPhotoUrl || '',
            shipperName: details.shipperName || details.carrierName || '',
            packageImage: details.packagePhotoUrl || '',
            logistics: details.carrierName || '',
            trackingNo: details.trackingNumber || '',
            items: Array.isArray(details.packageContent) ? details.packageContent.map(i => ({
              name: i.productName || '',
              sku: i.productCode || '',
              qty: i.quantity || 0
            })) : []
          };
          setActiveOrderDetails(mappedDetails);
          setPackerName(mappedDetails.packerName || '');
          setPackerImage(mappedDetails.packerImage || '');
          setShipperName(mappedDetails.shipperName || '');
          setPackageImage(mappedDetails.packageImage || '');
          setLogisticsName(mappedDetails.logistics || 'Delhivery');
          setTrackingNo(mappedDetails.trackingNo || '');
          setFormMsg({ text: '', isError: false });
        }
      } catch (err) {
        if (isMounted) {
          setFormMsg({ text: `Failed to load shipping details: ${err.message}`, isError: true });
        }
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };
    loadDetails();
    return () => { isMounted = false; };
  }, [selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter(o => 
      String(o.id || o.orderId).toLowerCase().includes(q) ||
      (o.customerName || o.customer || '').toLowerCase().includes(q)
    );
  }, [orders, searchTerm]);

  // Handle file uploads (converts image files to Base64)
  const handleImageFileChange = (e, targetType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select a photo smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (targetType === 'packer') {
        setPackerImage(reader.result);
      } else {
        setPackageImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Mark as Packed
  const handleMarkPacked = async () => {
    if (!selectedOrderId) return;
    if (!packerName.trim()) {
      setFormMsg({ text: 'Packer name is required.', isError: true });
      return;
    }

    try {
      // Sync via pack API (url encoded)
      await packOrder(selectedOrderId, {
        packerName,
        packerPhotoUrl: packerImage || ''
      });

      // Sync via status update
      await updateOrderStatus(selectedOrderId, 'Packed');

      setFormMsg({ text: `Order marked as PACKED by ${packerName}!`, isError: false });

      // Reload details
      const details = await getOrderShipping(selectedOrderId);
      const statusUpper = String(details.currentStatus || '').toUpperCase();
      const isPacked = ['TO BE SHIPPED', 'SHIPPED', 'DISPATCHED', 'PACKED'].includes(statusUpper);
      const isShipped = ['SHIPPED', 'DISPATCHED', 'COMPLETED'].includes(statusUpper);
      const mappedDetails = {
        ...details,
        id: details.orderId,
        status: mapStatus(details.currentStatus),
        isPacked,
        isShipped,
        destination: details.destination || 'Self Pickup',
        packerName: (details.packerName && details.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") ? details.packerName : '',
        packerImage: details.packerPhotoUrl || '',
        shipperName: details.shipperName || details.carrierName || '',
        packageImage: details.packagePhotoUrl || '',
        logistics: details.carrierName || '',
        trackingNo: details.trackingNumber || '',
        items: Array.isArray(details.packageContent) ? details.packageContent.map(i => ({
          name: i.productName || '',
          sku: i.productCode || '',
          qty: i.quantity || 0
        })) : []
      };
      setActiveOrderDetails(mappedDetails);
      
      // Reload lists
      await loadOrders();
    } catch (e) {
      setFormMsg({ text: e.message || 'Error updating packing details.', isError: true });
    }
  };

  // Mark as Shipped
  const handleMarkShipped = async () => {
    if (!selectedOrderId) return;
    if (!shipperName.trim()) {
      setFormMsg({ text: 'Shipper name is required.', isError: true });
      return;
    }
    if (!logisticsName.trim()) {
      setFormMsg({ text: 'Logistics partner name is required.', isError: true });
      return;
    }
    if (!trackingNo.trim()) {
      setFormMsg({ text: 'Shipment tracking number is required.', isError: true });
      return;
    }

    try {
      // Sync via dispatch API (url encoded)
      await dispatchOrder(selectedOrderId, {
        shipperName,
        packagePhotoUrl: packageImage || '',
        carrierName: logisticsName,
        trackingNumber: trackingNo
      });

      // Sync via status update
      await updateOrderStatus(selectedOrderId, 'Dispatched');

      setFormMsg({ text: `Order marked as SHIPPED via ${logisticsName}! Tracking: ${trackingNo}`, isError: false });

      // Reload details
      const details = await getOrderShipping(selectedOrderId);
      const statusUpper = String(details.currentStatus || '').toUpperCase();
      const isPacked = ['TO BE SHIPPED', 'SHIPPED', 'DISPATCHED', 'PACKED'].includes(statusUpper);
      const isShipped = ['SHIPPED', 'DISPATCHED', 'COMPLETED'].includes(statusUpper);
      const mappedDetails = {
        ...details,
        id: details.orderId,
        status: mapStatus(details.currentStatus),
        isPacked,
        isShipped,
        destination: details.destination || 'Self Pickup',
        packerName: (details.packerName && details.packerName !== "Thank you for shopping with Shyam Agro Tools & Equipment!") ? details.packerName : '',
        packerImage: details.packerPhotoUrl || '',
        shipperName: details.shipperName || details.carrierName || '',
        packageImage: details.packagePhotoUrl || '',
        logistics: details.carrierName || '',
        trackingNo: details.trackingNumber || '',
        items: Array.isArray(details.packageContent) ? details.packageContent.map(i => ({
          name: i.productName || '',
          sku: i.productCode || '',
          qty: i.quantity || 0
        })) : []
      };
      setActiveOrderDetails(mappedDetails);

      // Reload lists
      await loadOrders();
    } catch (e) {
      setFormMsg({ text: e.message || 'Error updating dispatch status.', isError: true });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-mgmt-container" style={{ padding: '24px' }}>
        <h2>Shipping & Dispatch Center</h2>
        <p>Loading logistics ledger...</p>
      </div>
    );
  }

  return (
    <div className="orders-mgmt-container" style={{ padding: '24px' }}>
      
      {/* Title */}
      <div className="orders-mgmt-header" style={{ marginBottom: '24px' }}>
        <div className="orders-mgmt-title">
          <h1>Shipping Order</h1>
          <p>Manage packaging logs, dispatch logistics, shipper records, and package photographs.</p>
        </div>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

      <div className="shipping-grid">
        
        {/* Left Side: Order Picker List */}
        <div className="orders-card-table-wrap" style={{ padding: '16px', background: 'white' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800 }}>Orders ledger</h3>
          <div className="orders-search-wrapper" style={{ marginBottom: '16px' }}>
            <Search size={16} className="orders-search-icon" />
            <input
              type="text"
              className="orders-search-input"
              style={{ padding: '8px 12px 8px 38px', fontSize: '13px' }}
              placeholder="Search ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredOrders.map(o => {
              // Determine current shipping phase status
              let stepLabel = 'To be Packed';
              let stepStyle = { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
              
              const statusUpper = String(o.status || '').toUpperCase();
              if (statusUpper === 'TO BE SHIPPED' || statusUpper === 'PACKED') {
                stepLabel = 'To be Shipped';
                stepStyle = { background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe' };
              } else if (statusUpper === 'SHIPPED' || statusUpper === 'DISPATCHED' || statusUpper === 'COMPLETED') {
                stepLabel = 'Shipped';
                stepStyle = { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
              }

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`orders-stat-card order-picker-card ${String(o.id || o.orderId) === String(selectedOrderId) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: '#1e293b' }}>Order #{o.id}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {o.customerName || o.customer || 'Unknown'} • {o.itemsCount || (o.items?.length ? `${o.items.length} items` : '0 items')}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      ...stepStyle
                    }}
                  >
                    {stepLabel}
                  </span>
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
                No active logistics orders found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Fulfillment Action Panel */}
        {detailsLoading ? (
          <div className="orders-card-table-wrap" style={{ padding: '32px', background: 'white', textAlign: 'center', color: '#64748b' }}>
            Loading shipping details from API...
          </div>
        ) : activeOrderDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Order Metadata and Item Details Card */}
            <div className="orders-card-table-wrap" style={{ padding: '20px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Fulfillment Details • #{activeOrderDetails.id}</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Customer: <strong>{activeOrderDetails.customerName}</strong> • Destination: {activeOrderDetails.destination}
                  </span>
                </div>
                <OrderStatusBadge status={activeOrderDetails.status} />
              </div>

              {/* Items Summary list */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  Package Content
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeOrderDetails.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justify: 'space-between', fontSize: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {item.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({item.sku})</span>
                      </span>
                      <strong style={{ color: '#0f172a' }}>x{item.qty}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION CARD: STEP 1 - PACKING */}
            <div className="orders-card-table-wrap" style={{ padding: '24px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} style={{ color: '#d97706' }} />
                  Step 1: Packing & Preparation
                </h3>
                {activeOrderDetails.isPacked ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    Packed Successfully
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', background: '#fff7df', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    To be Packed
                  </span>
                )}
              </div>

              {activeOrderDetails.isPacked ? (
                /* Packed Info Panel */
                <div className="tracking-user-profile" style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  {activeOrderDetails.packerImage ? (
                    <img className="tracking-user-avatar" src={activeOrderDetails.packerImage} alt={activeOrderDetails.packerName} style={{ width: '48px', height: '48px' }} />
                  ) : (
                    <div className="tracking-user-avatar" style={{ width: '48px', height: '48px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                      {activeOrderDetails.packerName ? activeOrderDetails.packerName.slice(0, 2).toUpperCase() : 'PK'}
                    </div>
                  )}
                  <div className="tracking-user-details">
                    <span>Assigned Packer</span>
                    <strong style={{ fontSize: '14px', color: '#166534' }}>{activeOrderDetails.packerName || 'Self / Packer'}</strong>
                    <span style={{ marginTop: '2px' }}>Packed date: {activeOrderDetails.packedDate || 'Verified'}</span>
                  </div>
                </div>
              ) : (
                /* Packing Form */
                <div className="shipping-action-card" style={{ background: '#fbfbfb' }}>
                  <div className="action-form-group">
                    <div>
                      <label className="action-label">Packer Name</label>
                      <input
                        type="text"
                        className="action-input"
                        placeholder="Enter packer's name..."
                        value={packerName}
                        onChange={(e) => setPackerName(e.target.value)}
                      />
                      
                      {/* Redesigned Preset Packers with Avatars */}
                      <div className="preset-grid">
                        {PRESET_PACKERS.map((p, index) => {
                          const isActive = packerName === p.name;
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                setPackerName(p.name);
                                setPackerImage(p.avatar);
                              }}
                              className={`preset-card-bubble ${isActive ? 'active' : ''}`}
                            >
                              <img src={p.avatar} alt={p.name} />
                              <span>{p.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="action-label">Packer ID Photo / Signature Image</label>
                      
                      <div className="img-uploader-container" style={{ marginTop: '4px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          className="img-uploader-input"
                          onChange={(e) => handleImageFileChange(e, 'packer')}
                        />
                        <div className="img-uploader-preview">
                          {packerImage ? (
                            <img src={packerImage} alt="Packer Upload" />
                          ) : (
                            <ImageIcon size={22} style={{ color: '#94a3b8' }} />
                          )}
                          <span className="img-uploader-text">
                            {packerImage ? 'Change Packer Photo' : 'Drag & drop or Click to upload Packer Photo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleMarkPacked}
                      className="date-preset-btn active"
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '6px',
                        background: '#d97706',
                        borderColor: '#d97706'
                      }}
                    >
                      <UserCheck size={15} /> Confirm Packed Items
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION CARD: STEP 2 - SHIPPING */}
            <div className="orders-card-table-wrap" style={{ padding: '24px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} style={{ color: '#4f46e5' }} />
                  Step 2: Logistics Handover & Shipping
                </h3>
                {activeOrderDetails.isShipped ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    Shipped & In Transit
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: activeOrderDetails.isPacked ? '#4b5563' : '#9ca3af',
                      background: activeOrderDetails.isPacked ? '#f3f4f6' : '#f9fafb',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      border: activeOrderDetails.isPacked ? '1px solid #e5e7eb' : '1px solid #f3f4f6'
                    }}
                  >
                    To be Shipped
                  </span>
                )}
              </div>

              {!activeOrderDetails.isPacked ? (
                /* Packaging block alert */
                <div style={{ padding: '14px', borderRadius: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
                  <AlertCircle size={16} />
                  <span>Please complete <strong>Step 1: Packing & Preparation</strong> before registering logistics dispatch details.</span>
                </div>
              ) : activeOrderDetails.isShipped ? (
                /* Shipped Info Panel */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="tracking-user-profile" style={{ padding: '12px', background: '#e0e7ff', border: '1px solid #c7d2fe' }}>
                    <div className="tracking-user-details" style={{ width: '100%' }}>
                      <span>Logistics Handover Details</span>
                      <strong style={{ fontSize: '14px', color: '#4338ca', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <span>Carrier: {activeOrderDetails.logistics}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Shipper: {activeOrderDetails.shipperName}</span>
                      </strong>
                      <span style={{ marginTop: '4px', fontFamily: 'monospace' }}>Waybill Tracking Reference: {activeOrderDetails.trackingNo}</span>
                      <span>Dispatched on: {activeOrderDetails.shippedDate || 'Verified'}</span>
                    </div>
                  </div>

                  {activeOrderDetails.packageImage && (
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Package Dispatch Photograph</span>
                      <img className="tracking-package-img" src={activeOrderDetails.packageImage} alt="Package photograph" style={{ maxWidth: '280px', maxHeight: '180px' }} />
                    </div>
                  )}
                </div>
              ) : (
                /* Shipping Form */
                <div className="shipping-action-card" style={{ background: '#fbfbfb' }}>
                  <div className="action-form-group">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="action-label">Logistics Provider Name</label>
                        <select
                          className="action-input"
                          value={logisticsName}
                          onChange={(e) => setLogisticsName(e.target.value)}
                        >
                          <option value="Delhivery">Delhivery</option>
                          <option value="Safexpress">Safexpress</option>
                          <option value="BlueDart">BlueDart</option>
                          <option value="Ecom Express">Ecom Express</option>
                          <option value="Professional Couriers">Professional Couriers</option>
                          <option value="Self Delivery">Self Delivery</option>
                        </select>
                      </div>

                      <div>
                        <label className="action-label">Logistics Tracking / Reference No</label>
                        <input
                          type="text"
                          className="action-input"
                          placeholder="e.g. DLV88372621"
                          value={trackingNo}
                          onChange={(e) => setTrackingNo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="action-label">Shipper / Dispatch Rider Name</label>
                      <input
                        type="text"
                        className="action-input"
                        placeholder="Enter shipper's name..."
                        value={shipperName}
                        onChange={(e) => setShipperName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="action-label">Package Photograph (Verify Shipment State)</label>
                      <div className="img-uploader-container" style={{ marginTop: '4px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          className="img-uploader-input"
                          onChange={(e) => handleImageFileChange(e, 'package')}
                        />
                        <div className="img-uploader-preview">
                          {packageImage ? (
                            <img src={packageImage} alt="Package Upload" />
                          ) : (
                            <ImageIcon size={22} style={{ color: '#94a3b8' }} />
                          )}
                          <span className="img-uploader-text">
                            {packageImage ? 'Change Package Image' : 'Upload package photo showing waybill label'}
                          </span>
                        </div>
                      </div>

                      {/* Redesigned Preset Packages with Thumbnails */}
                      <div className="preset-grid">
                        {PRESET_PACKAGES.map((pkg, index) => {
                          const isActive = packageImage === pkg.url;
                          return (
                            <div
                              key={index}
                              onClick={() => setPackageImage(pkg.url)}
                              className={`preset-card-bubble ${isActive ? 'active' : ''}`}
                            >
                              <img src={pkg.url} alt={pkg.name} style={{ borderRadius: '4px' }} />
                              <span>{pkg.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleMarkShipped}
                      className="date-preset-btn active"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '6px',
                        background: '#4f46e5',
                        borderColor: '#4f46e5'
                      }}
                    >
                      <Compass size={15} /> Confirm Handover & Ship Order
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Result Alerts */}
            {formMsg.text && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: formMsg.isError ? '#fef2f2' : '#f0fdf4',
                  color: formMsg.isError ? '#b91c1c' : '#166534',
                  border: formMsg.isError ? '1px solid #fecaca' : '1px solid #bbf7d0'
                }}
              >
                {formMsg.text}
              </div>
            )}

          </div>
        ) : (
          <div className="orders-card-table-wrap" style={{ padding: '32px', background: 'white', textAlign: 'center', color: '#64748b' }}>
            Select an order to dispatch, log packer data, register logistics waybills, and capture cargo images.
          </div>
        )}
      </div>

    </div>
  );
};

export default ShippingOrder;
