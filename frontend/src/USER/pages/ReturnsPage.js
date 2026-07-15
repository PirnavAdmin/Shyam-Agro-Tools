import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginPopup from '../components/LoginPopup';
import { getOrders } from '../../ADMIN/api/orders';
import { 
  getMyReturns, 
  checkReturnEligibility, 
  createReturnRequest, 
  getReturnsConfig 
} from '../../ADMIN/api/returns';
import { 
  Package, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Truck, 
  CreditCard, 
  FileText, 
  Upload, 
  ShieldCheck,
  ChevronRight,
  Eye
} from 'lucide-react';
import './ReturnsPage.css';

const ReturnsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my-returns'); // 'my-returns' or 'request-return'
  
  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab 1: My Returns
  const [myReturnsList, setMyReturnsList] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null); // Detail view modal

  // Tab 2: Request Return
  const [orderSearchId, setOrderSearchId] = useState('');
  const [foundOrder, setFoundOrder] = useState(null);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [returnsConfig, setReturnsConfig] = useState(null);

  // Return Request Form States
  const [requestType, setRequestType] = useState('Refund');
  const [reasonCode, setReasonCode] = useState('Damaged Product');
  const [requestedQty, setRequestedQty] = useState(1);
  const [refundMethod, setRefundMethod] = useState('Wallet');
  const [description, setDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    // Load config
    loadConfig();
  }, []);

  useEffect(() => {
    if (user) {
      loadMyReturns();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const config = await getReturnsConfig();
      setReturnsConfig(config);
      if (config.reasonCodes && config.reasonCodes.length > 0) {
        setReasonCode(config.reasonCodes[0].label);
      }
    } catch (err) {
      console.error("Failed to load returns config:", err);
    }
  };

  const loadMyReturns = async () => {
    setLoading(true);
    try {
      const data = await getMyReturns();
      setMyReturnsList(data.returns || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load your return requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSearch = async (e) => {
    e.preventDefault();
    setError('');
    setFoundOrder(null);
    setSelectedItemForReturn(null);
    setEligibilityData(null);
    setLoading(true);

    try {
      const orders = await getOrders();
      const match = orders.find(o => 
        String(o.id || o.orderId).toUpperCase() === orderSearchId.trim().toUpperCase()
      );

      if (match) {
        setFoundOrder(match);
        setPickupAddress(match.shippingAddress || '');
      } else {
        setError('Order not found. Please verify the Order ID.');
      }
    } catch (err) {
      console.error(err);
      setError('Error searching for your order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckItemEligibility = async (item, index) => {
    setLoading(true);
    setError('');
    try {
      // Use orderId-itemIndex as simulated orderItemId
      const orderItemId = `${foundOrder.id}-${index + 1}`;
      const eligibility = await checkReturnEligibility(orderItemId);
      
      if (eligibility && eligibility.eligible) {
        setSelectedItemForReturn(item);
        setEligibilityData({
          ...eligibility,
          itemIndex: index + 1
        });
        setRequestedQty(1);
      } else {
        setError(eligibility?.reason || 'This item is not eligible for return.');
      }
    } catch (err) {
      console.error(err);
      setError('Eligibility check failed.');
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop simulation handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr = Array.from(e.dataTransfer.files);
      setEvidenceFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const filesArr = Array.from(e.target.files);
      setEvidenceFiles(prev => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('OrderId', foundOrder.id);
      formData.append('OrderItemId', eligibilityData.itemIndex);
      formData.append('RequestType', requestType);
      formData.append('ReasonCode', reasonCode);
      formData.append('Description', description);
      formData.append('RequestedQuantity', requestedQty);
      formData.append('RefundMethod', refundMethod);
      formData.append('PickupAddressId', 101); // Simulated Address ID
      
      // Append files
      evidenceFiles.forEach((file) => {
        formData.append('EvidenceFiles', file);
      });

      await createReturnRequest(formData);

      setSuccessMsg('Your return request has been submitted successfully.');
      setActiveTab('my-returns');
      
      // Reset form states
      setOrderSearchId('');
      setFoundOrder(null);
      setSelectedItemForReturn(null);
      setEligibilityData(null);
      setDescription('');
      setEvidenceFiles([]);
      
      // Reload returns list
      loadMyReturns();
    } catch (err) {
      console.error(err);
      setError('Failed to submit your return request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'pickup scheduled': return 'badge-pickup';
      case 'refunded': return 'badge-refunded';
      case 'completed': return 'badge-completed';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-default';
    }
  };

  const getTimelineStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'pickup scheduled': return 3;
      case 'refunded':
      case 'completed':
        return 4;
      case 'rejected':
        return -1; // rejected is handled separately
      default: return 1;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-poppins">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-8 py-8">
        
        {/* Banner Section */}
        <div className="return-hero-banner">
          <div className="banner-content">
            <h1>Returns & Refund Hub</h1>
            <p>Track your claims, view status updates, and request easy returns or replacements.</p>
          </div>
          <div className="banner-decor">ðŸ“¦</div>
        </div>

        {!user ? (
          /* Login Alert State */
          <div className="login-req-container">
            <AlertCircle size={40} className="text-amber-500 mb-4" />
            <h2>Authentication Required</h2>
            <p className="mb-6">Please log in to your account to view your claims or file a new return request.</p>
            <button className="login-primary-btn" onClick={() => setIsLoginOpen(true)}>
              Login / Register
            </button>
          </div>
        ) : (
          /* Main Workspace Dashboard */
          <div className="returns-workspace mt-8">
            
            {/* Tabs Header */}
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'my-returns' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('my-returns');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                <Clock size={16} /> My Return Requests
              </button>
              <button 
                className={`tab-btn ${activeTab === 'request-return' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('request-return');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                <RefreshCw size={16} /> Request Return / Refund
              </button>
            </div>

            {/* Notifications Panel */}
            {successMsg && (
              <div className="alert-box success-alert">
                <CheckCircle size={18} />
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg('')}>&times;</button>
              </div>
            )}
            {error && (
              <div className="alert-box error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
                <button onClick={() => setError('')}>&times;</button>
              </div>
            )}

            {/* TAB CONTENT: MY RETURNS LIST */}
            {activeTab === 'my-returns' && (
              <div className="tab-pane">
                {loading && myReturnsList.length === 0 ? (
                  <div className="loading-spinner-container">
                    <div className="spinner"></div>
                    <p>Fetching your claims...</p>
                  </div>
                ) : myReturnsList.length === 0 ? (
                  <div className="empty-state-card">
                    <Package size={48} className="text-slate-300 mb-3" />
                    <h3>No returns requested yet</h3>
                    <p>If you have any issues with your orders, you can file a claim in the next tab.</p>
                    <button className="action-link-btn" onClick={() => setActiveTab('request-return')}>
                      File a claim now <ChevronRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="returns-list-grid">
                    {myReturnsList.map((ret) => (
                      <div key={ret.id} className="return-item-card">
                        <div className="card-top">
                          <span className="req-date">{new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className={`status-badge ${getStatusBadgeClass(ret.status)}`}>{ret.status}</span>
                        </div>
                        
                        <div className="card-middle">
                          <div className="info-row">
                            <span className="info-lbl">Return ID</span>
                            <span className="info-val">#RET-{1000 + ret.id}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-lbl">Order Ref</span>
                            <span className="info-val">#{ret.orderId}</span>
                          </div>
                          <div className="info-row mt-2">
                            <span className="info-lbl font-semibold">Product</span>
                            <span className="info-val font-semibold truncate text-slate-800">{ret.productName}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-lbl">Reason</span>
                            <span className="info-val text-slate-600">{ret.reasonCode}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-lbl">Quantity</span>
                            <span className="info-val font-bold text-slate-700">{ret.requestedQuantity} Qty</span>
                          </div>
                        </div>

                        <div className="card-bottom">
                          <button className="details-view-btn" onClick={() => setSelectedReturn(ret)}>
                            <Eye size={14} /> View Tracking & Steps
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: REQUEST A NEW RETURN */}
            {activeTab === 'request-return' && (
              <div className="tab-pane">
                
                {/* Step 1: Lookup Order */}
                {!foundOrder && (
                  <div className="search-order-container">
                    <div className="search-box-card">
                      <h3>Initiate a Return</h3>
                      <p>Enter your Order ID (found on your invoice or order confirmation, e.g., ORD10214) to verify eligibility and select items.</p>
                      
                      <form onSubmit={handleOrderSearch} className="search-form mt-6">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            placeholder="Enter Order Reference (e.g. ORD10214)"
                            value={orderSearchId}
                            onChange={(e) => setOrderSearchId(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" disabled={loading} className="search-submit-btn">
                          {loading ? 'Searching...' : 'Find Order'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Step 2: Show Order Items for Selection */}
                {foundOrder && !selectedItemForReturn && (
                  <div className="order-items-selection mt-4">
                    <div className="flex justify-between items-center mb-6">
                      <button className="back-nav-btn" onClick={() => setFoundOrder(null)}>
                        <ArrowLeft size={16} /> Back to Search
                      </button>
                      <span className="text-sm text-slate-500 font-bold">Order #{foundOrder.id} ({new Date(foundOrder.orderDate).toLocaleDateString()})</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-4">Select the items you wish to return</h3>
                      
                      <div className="divide-y divide-slate-100">
                        {foundOrder.items?.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center justify-between py-5 gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-[240px]">
                              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                <p className="text-xs text-slate-400">SKU: {item.sku} | Price: â‚¹{item.unitPrice?.toLocaleString()}</p>
                                <p className="text-xs font-semibold text-slate-600 mt-1">Purchased Quantity: {item.quantity}</p>
                              </div>
                            </div>

                            <button 
                              className="claim-initiate-btn"
                              onClick={() => handleCheckItemEligibility(item, idx)}
                              disabled={loading}
                            >
                              Check Return Eligibility
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Fill Return Form for the Selected Eligible Item */}
                {selectedItemForReturn && eligibilityData && (
                  <div className="return-form-container mt-4">
                    <div className="flex justify-between items-center mb-6">
                      <button className="back-nav-btn" onClick={() => { setSelectedItemForReturn(null); setEligibilityData(null); }}>
                        <ArrowLeft size={16} /> Back to Items
                      </button>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-100 flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Eligible for Return
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Product Preview Card */}
                      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
                        <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3 mb-4">Item to Return</h3>
                        <div className="product-summary">
                          <h4 className="font-bold text-slate-800">{selectedItemForReturn.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">SKU: {selectedItemForReturn.sku}</p>
                          
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-100 flex justify-between items-center text-sm">
                            <span className="text-slate-400">Unit Price</span>
                            <span className="font-bold text-slate-800">â‚¹{selectedItemForReturn.unitPrice?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-2">
                            <span className="text-slate-400">Eligible Quantity</span>
                            <span className="font-bold text-slate-800">{eligibilityData.maxQuantity} Qty</span>
                          </div>
                        </div>
                      </div>

                      {/* Return Request Form */}
                      <form onSubmit={handleSubmitReturn} className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-2">Claim Details</h3>

                        {/* Request Type */}
                        <div>
                          <label className="form-label">What action do you request?</label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div 
                              className={`action-option-card ${requestType === 'Refund' ? 'selected' : ''}`}
                              onClick={() => setRequestType('Refund')}
                            >
                              <CreditCard size={20} />
                              <div>
                                <strong>Return & Refund</strong>
                                <span>Get money back</span>
                              </div>
                            </div>
                            <div 
                              className={`action-option-card ${requestType === 'Replacement' ? 'selected' : ''}`}
                              onClick={() => setRequestType('Replacement')}
                            >
                              <RefreshCw size={20} />
                              <div>
                                <strong>Replacement</strong>
                                <span>Get a new unit shipped</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row: Qty and Reason */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="form-label" htmlFor="qty-select">Return Quantity</label>
                            <select 
                              id="qty-select"
                              value={requestedQty}
                              onChange={(e) => setRequestedQty(Number(e.target.value))}
                              className="form-control mt-2"
                            >
                              {[...Array(eligibilityData.maxQuantity)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} Unit{i > 0 ? 's' : ''}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="form-label" htmlFor="reason-select">Reason for Claim</label>
                            <select 
                              id="reason-select"
                              value={reasonCode}
                              onChange={(e) => setReasonCode(e.target.value)}
                              className="form-control mt-2"
                            >
                              {returnsConfig?.reasonCodes?.map((rc, i) => (
                                <option key={i} value={rc.label}>{rc.label}</option>
                              )) || (
                                <>
                                  <option value="Damaged Product">Damaged Product</option>
                                  <option value="Defective / Faulty">Defective / Faulty</option>
                                  <option value="Incorrect / Wrong Item Delivered">Incorrect / Wrong Item Delivered</option>
                                  <option value="Missing / Short Quantity">Missing / Short Quantity</option>
                                  <option value="Quality Not as Expected">Quality Not as Expected</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Refund Method (Only visible if Refund) */}
                        {requestType === 'Refund' && (
                          <div>
                            <label className="form-label">Preferred Refund Destination</label>
                            <div className="flex gap-6 mt-2">
                              <label className="radio-label">
                                <input 
                                  type="radio" 
                                  name="refund-method" 
                                  value="Wallet"
                                  checked={refundMethod === 'Wallet'} 
                                  onChange={() => setRefundMethod('Wallet')}
                                />
                                <span>SAT Wallet (Instant)</span>
                              </label>
                              <label className="radio-label">
                                <input 
                                  type="radio" 
                                  name="refund-method" 
                                  value="Bank Transfer"
                                  checked={refundMethod === 'Bank Transfer'} 
                                  onChange={() => setRefundMethod('Bank Transfer')}
                                />
                                <span>Bank Account / UPI (2-3 Days)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Pickup Address */}
                        <div>
                          <label className="form-label" htmlFor="pickup-addr">Pickup Location</label>
                          <textarea 
                            id="pickup-addr"
                            rows="2"
                            value={pickupAddress}
                            onChange={(e) => setPickupAddress(e.target.value)}
                            placeholder="Enter the complete address where the shipping agent should pick up the package."
                            required
                            className="form-control mt-2"
                          />
                        </div>

                        {/* Detailed Description */}
                        <div>
                          <label className="form-label" htmlFor="claim-desc">Additional Details</label>
                          <textarea 
                            id="claim-desc"
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please describe the issue in detail (e.g. cracked handle, torn packaging)..."
                            className="form-control mt-2"
                          />
                        </div>

                        {/* Evidence Files Upload */}
                        <div>
                          <label className="form-label">Upload Evidence Photos (Recommended)</label>
                          <p className="text-xs text-slate-400 mb-2">Upload pictures of the damage or defect to speed up the approval process.</p>
                          
                          <div 
                            className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                          >
                            <Upload size={24} className="text-slate-400 mb-2" />
                            <p className="text-sm font-bold text-slate-600">Drag and drop your images here, or <span className="text-primary cursor-pointer hover:underline">browse</span></p>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden-file-input"
                            />
                          </div>

                          {/* File list preview */}
                          {evidenceFiles.length > 0 && (
                            <div className="uploaded-files-list mt-3">
                              {evidenceFiles.map((file, fIdx) => (
                                <div key={fIdx} className="file-preview-pill">
                                  <span className="file-name truncate text-xs">{file.name}</span>
                                  <button type="button" onClick={() => removeFile(fIdx)} className="remove-file-btn">&times;</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Submit Action */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="submit-claim-btn"
                          >
                            {loading ? 'Submitting Claim...' : 'Submit Return Claim'}
                          </button>
                        </div>

                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* DETAIL MODAL OVERLAY */}
      {selectedReturn && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="modal-body-container font-poppins" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2>Claim #RET-{1000 + selectedReturn.id}</h2>
                <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedReturn.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedReturn(null)}>&times;</button>
            </div>

            {/* Modal Scroll Content */}
            <div className="modal-scroll-content">
              
              {/* Product and request summary */}
              <div className="modal-section-box">
                <h3 className="modal-sec-title">Return Summary</h3>
                <div className="flex justify-between items-start mt-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{selectedReturn.productName}</h4>
                    <p className="text-xs text-slate-400">SKU: {selectedReturn.sku} | Quantity: {selectedReturn.requestedQuantity}</p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">Action Requested: {selectedReturn.requestType} ({selectedReturn.reasonCode})</p>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(selectedReturn.status)}`}>{selectedReturn.status}</span>
                </div>
                {selectedReturn.description && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                    <strong>Customer Details:</strong> {selectedReturn.description}
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              {selectedReturn.status?.toLowerCase() === 'rejected' ? (
                <div className="modal-section-box bg-red-50/50 border-red-100 border">
                  <h3 className="modal-sec-title text-red-800 flex items-center gap-1.5">
                    <AlertCircle size={16} /> Request Rejected
                  </h3>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    Reason: {selectedReturn.rejectionReason || 'Does not comply with our return policy standards.'}
                  </p>
                  {selectedReturn.remarks && (
                    <p className="text-xs text-slate-500 mt-2">
                      Remarks: {selectedReturn.remarks}
                    </p>
                  )}
                </div>
              ) : (
                <div className="modal-section-box">
                  <h3 className="modal-sec-title">Resolution Timeline</h3>
                  <div className="horizontal-stepper mt-6">
                    {/* Step 1: Requested */}
                    <div className="step-node active">
                      <div className="node-circle"><CheckCircle size={14} /></div>
                      <div className="node-lbl">Requested</div>
                    </div>
                    
                    {/* Step 2: Approved */}
                    <div className={`step-node ${getTimelineStepIndex(selectedReturn.status) >= 2 ? 'active' : ''}`}>
                      <div className="node-circle">
                        {getTimelineStepIndex(selectedReturn.status) >= 2 ? <CheckCircle size={14} /> : 2}
                      </div>
                      <div className="node-lbl">Approved</div>
                    </div>

                    {/* Step 3: Pickup Scheduled */}
                    <div className={`step-node ${getTimelineStepIndex(selectedReturn.status) >= 3 ? 'active' : ''}`}>
                      <div className="node-circle">
                        {getTimelineStepIndex(selectedReturn.status) >= 3 ? <Truck size={14} /> : 3}
                      </div>
                      <div className="node-lbl">Pickup</div>
                    </div>

                    {/* Step 4: Refunded / Completed */}
                    <div className={`step-node ${getTimelineStepIndex(selectedReturn.status) >= 4 ? 'active' : ''}`}>
                      <div className="node-circle">
                        {getTimelineStepIndex(selectedReturn.status) >= 4 ? <CheckCircle size={14} /> : 4}
                      </div>
                      <div className="node-lbl">{selectedReturn.requestType === 'Refund' ? 'Refunded' : 'Completed'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Details section */}
              {selectedReturn.pickupDetails && (
                <div className="modal-section-box">
                  <h3 className="modal-sec-title">Pickup Schedule Details</h3>
                  <div className="details-grid-box mt-3">
                    <div className="det-item">
                      <span className="det-lbl">Scheduled Date</span>
                      <span className="det-val">{new Date(selectedReturn.pickupDetails.pickupDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Pickup Agent</span>
                      <span className="det-val">{selectedReturn.pickupDetails.pickupAgentName}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Agent Contact</span>
                      <span className="det-val">{selectedReturn.pickupDetails.pickupAgentPhone}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Tracking ID</span>
                      <span className="det-val font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{selectedReturn.pickupDetails.pickupTrackingNumber || 'N/A'}</span>
                    </div>
                  </div>
                  {selectedReturn.pickupDetails.remarks && (
                    <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong>Remarks:</strong> {selectedReturn.pickupDetails.remarks}
                    </p>
                  )}
                </div>
              )}

              {/* Refund details section */}
              {selectedReturn.refundDetails && (
                <div className="modal-section-box bg-emerald-50/20 border border-emerald-100">
                  <h3 className="modal-sec-title text-emerald-800">Refund Summary</h3>
                  <div className="details-grid-box mt-3">
                    <div className="det-item">
                      <span className="det-lbl">Refunded Amount</span>
                      <span className="det-val text-emerald-700 font-extrabold text-sm">â‚¹{selectedReturn.refundDetails.approvedRefundAmount?.toLocaleString()}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Refund Destination</span>
                      <span className="det-val font-semibold">{selectedReturn.refundDetails.refundMethod}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Transaction Reference</span>
                      <span className="det-val font-mono text-xs">{selectedReturn.refundDetails.refundTransactionId || 'TBD'}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Payout Status</span>
                      <span className="det-val text-emerald-600 font-bold">{selectedReturn.refundDetails.refundStatus}</span>
                    </div>
                  </div>
                  {selectedReturn.refundDetails.remarks && (
                    <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong>Note:</strong> {selectedReturn.refundDetails.remarks}
                    </p>
                  )}
                </div>
              )}

              {/* Replacement details section */}
              {selectedReturn.replacementDetails && (
                <div className="modal-section-box bg-indigo-50/20 border border-indigo-100">
                  <h3 className="modal-sec-title text-indigo-800">Replacement Dispatch Details</h3>
                  <div className="details-grid-box mt-3">
                    <div className="det-item">
                      <span className="det-lbl">Replacement Order ID</span>
                      <span className="det-val font-bold text-indigo-700">#{selectedReturn.replacementDetails.replacementOrderNumber || selectedReturn.replacementDetails.replacementOrderId}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Logistic Carrier</span>
                      <span className="det-val font-semibold">{selectedReturn.replacementDetails.carrierName || 'TBD'}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Tracking Number</span>
                      <span className="det-val font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{selectedReturn.replacementDetails.trackingNumber || 'TBD'}</span>
                    </div>
                    <div className="det-item">
                      <span className="det-lbl">Estimated Arrival</span>
                      <span className="det-val">{selectedReturn.replacementDetails.estimatedDeliveryDate ? new Date(selectedReturn.replacementDetails.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>
                  {selectedReturn.replacementDetails.remarks && (
                    <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong>Logistics Update:</strong> {selectedReturn.replacementDetails.remarks}
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer justify-end">
              <button className="modal-close-btn-secondary" onClick={() => setSelectedReturn(null)}>Close Details</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReturnsPage;

