import React, { useState, useEffect } from 'react';
import { 
  getAdminReturns, 
  updateReturnStatus, 
  updateReturnPickup, 
  updateReturnRefund, 
  updateReturnReplacement 
} from '../api/returns';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Truck, 
  CreditCard, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import './AdminReturns.css';

const AdminReturns = () => {
  // Lists & Loaders
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Detail & Drawer panel states
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'pickup' | 'refund' | 'replacement' | null
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Status Action Form States
  const [statusUpdateVal, setStatusUpdateVal] = useState('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Pickup Form States
  const [pickupDate, setPickupDate] = useState('');
  const [pickupAgentName, setPickupAgentName] = useState('');
  const [pickupAgentPhone, setPickupAgentPhone] = useState('');
  const [pickupTrackingNumber, setPickupTrackingNumber] = useState('');
  const [pickupRemarks, setPickupRemarks] = useState('');

  // Refund Form States
  const [approvedRefundAmount, setApprovedRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('Wallet');
  const [refundTransactionId, setRefundTransactionId] = useState('');
  const [refundStatus, setRefundStatus] = useState('Success');
  const [refundRemarks, setRefundRemarks] = useState('');

  // Replacement Form States
  const [replacementOrderId, setReplacementOrderId] = useState(0);
  const [replacementOrderNumber, setReplacementOrderNumber] = useState('');
  const [replacementTrackingNumber, setReplacementTrackingNumber] = useState('');
  const [replacementCarrierName, setReplacementCarrierName] = useState('');
  const [replacementStatus, setReplacementStatus] = useState('Shipped');
  const [replacementEstDelivery, setReplacementEstDelivery] = useState('');
  const [replacementRemarks, setReplacementRemarks] = useState('');

  // Initial load
  useEffect(() => {
    loadReturnsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, typeFilter, currentPage]);

  const loadReturnsData = async () => {
    setLoading(true);
    try {
      const data = await getAdminReturns({
        search: searchQuery,
        status: statusFilter,
        requestType: typeFilter,
        page: currentPage,
        pageSize: pageSize
      });
      setReturnsList(data.returns || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error("Failed to load admin returns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReturn = (ret) => {
    setSelectedReturn(ret);
    // Initialize form states with current detail values if present
    setApprovedRefundAmount(ret.unitPrice * ret.requestedQuantity || 0);
    setReplacementOrderNumber(`REP-${ret.orderId}`);
    setReplacementOrderId(Math.floor(100000 + Math.random() * 900000));
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const body = {
        status: statusUpdateVal,
        remarks: statusRemarks,
        rejectionReason: statusUpdateVal === 'Rejected' ? rejectionReason : null,
        title: `Claim ${statusUpdateVal}`,
        description: `Your return claim has been ${statusUpdateVal.toLowerCase()} by an administrator.`
      };
      await updateReturnStatus(selectedReturn.id, body);
      
      setModalSuccess(`Claim successfully ${statusUpdateVal.toLowerCase()}!`);
      setTimeout(() => {
        closeModals();
        loadReturnsData();
      }, 1500);
    } catch (err) {
      setModalError('Failed to update claim status.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const body = {
        pickupDate: new Date(pickupDate).toISOString(),
        pickupAgentName,
        pickupAgentPhone,
        pickupTrackingNumber,
        remarks: pickupRemarks
      };
      await updateReturnPickup(selectedReturn.id, body);
      
      setModalSuccess('Pickup scheduled successfully!');
      setTimeout(() => {
        closeModals();
        loadReturnsData();
      }, 1500);
    } catch (err) {
      setModalError('Failed to schedule pickup.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const body = {
        approvedRefundAmount: Number(approvedRefundAmount),
        refundMethod,
        refundTransactionId,
        refundStatus,
        remarks: refundRemarks
      };
      await updateReturnRefund(selectedReturn.id, body);
      
      setModalSuccess('Refund executed successfully!');
      setTimeout(() => {
        closeModals();
        loadReturnsData();
      }, 1500);
    } catch (err) {
      setModalError('Failed to execute refund.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReplacementSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const body = {
        replacementOrderId: Number(replacementOrderId),
        replacementOrderNumber,
        trackingNumber: replacementTrackingNumber,
        carrierName: replacementCarrierName,
        replacementStatus,
        estimatedDeliveryDate: replacementEstDelivery ? new Date(replacementEstDelivery).toISOString() : null,
        remarks: replacementRemarks
      };
      await updateReturnReplacement(selectedReturn.id, body);
      
      setModalSuccess('Replacement dispatched successfully!');
      setTimeout(() => {
        closeModals();
        loadReturnsData();
      }, 1500);
    } catch (err) {
      setModalError('Failed to dispatch replacement.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setActiveModal(null);
    setModalError('');
    setModalSuccess('');
    // Refresh selectedReturn reference to show latest saved data
    if (selectedReturn) {
      const latest = returnsList.find(r => r.id === selectedReturn.id);
      if (latest) setSelectedReturn(latest);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="admin-ret-badge badge-pending">Pending</span>;
      case 'approved':
        return <span className="admin-ret-badge badge-approved">Approved</span>;
      case 'pickup scheduled':
        return <span className="admin-ret-badge badge-pickup">Pickup Scheduled</span>;
      case 'refunded':
        return <span className="admin-ret-badge badge-refunded">Refunded</span>;
      case 'completed':
        return <span className="admin-ret-badge badge-completed">Completed</span>;
      case 'rejected':
        return <span className="admin-ret-badge badge-rejected">Rejected</span>;
      default:
        return <span className="admin-ret-badge">{status}</span>;
    }
  };

  return (
    <div className="admin-returns-workspace font-poppins">
      
      {/* Workspace Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Return & Refund Claims</h1>
          <p className="text-xs text-slate-400 mt-1">Review return eligibility, manage courier collections, and authorize refunds or replacement shipments.</p>
        </div>
        <div className="admin-summary-pill bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm">
          <Layers size={14} className="text-primary" /> Total Claims: {totalCount}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-filters-bar bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-[70%]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search Claim ID, Order, Item..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-search-input pl-10"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Pickup Scheduled">Pickup Scheduled</option>
              <option value="Refunded">Refunded</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-dropdown"
          >
            <option value="All">All Types</option>
            <option value="Refund">Return & Refund</option>
            <option value="Replacement">Replacement</option>
          </select>
        </div>

        <button 
          onClick={() => { setSearchQuery(''); setStatusFilter('All'); setTypeFilter('All'); setCurrentPage(1); }}
          className="clear-filters-btn text-xs text-primary font-bold hover:underline"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Workspace Split Grid */}
      <div className={`grid grid-cols-1 ${selectedReturn ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 items-start`}>
        
        {/* Claims Table Pane */}
        <div className={`${selectedReturn ? 'lg:col-span-2' : 'lg:col-span-1'} bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden`}>
          <div className="table-responsive">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Claim Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="table-spinner"></div>
                        <span className="text-xs text-slate-400 mt-2">Loading claim records...</span>
                      </div>
                    </td>
                  </tr>
                ) : returnsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400 text-xs">
                      No matching claims found.
                    </td>
                  </tr>
                ) : (
                  returnsList.map((ret) => (
                    <tr 
                      key={ret.id} 
                      className={`table-row-hover ${selectedReturn?.id === ret.id ? 'row-selected' : ''}`}
                      onClick={() => handleSelectReturn(ret)}
                    >
                      <td className="font-extrabold text-slate-700">#RET-{1000 + ret.id}</td>
                      <td>#{ret.orderId}</td>
                      <td className="font-semibold text-slate-600">{ret.customerName || `Cust ID: ${ret.pickupAddressId}`}</td>
                      <td className="truncate max-w-[150px] font-medium" title={ret.productName}>
                        {ret.productName}
                        <span className="block text-[10px] text-slate-400">Qty: {ret.requestedQuantity}</span>
                      </td>
                      <td className="font-semibold text-slate-500">
                        {ret.requestType === 'Refund' ? 'Refund' : 'Replacement'}
                      </td>
                      <td>{getStatusBadge(ret.status)}</td>
                      <td className="text-xs text-slate-400">
                        {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="text-center">
                        <button 
                          className="table-action-btn"
                          onClick={(e) => { e.stopPropagation(); handleSelectReturn(ret); }}
                        >
                          <Eye size={14} /> Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">Showing {returnsList.length} of {totalCount} claims</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-50 rounded border hover:bg-slate-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage * pageSize >= totalCount} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-50 rounded border hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Slider Pane */}
        {selectedReturn && (
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden position-sticky top-6">
            
            {/* Drawer Header */}
            <div className="drawer-header bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800">Claim Details</h2>
                <span className="text-xs text-slate-400 font-mono">#RET-{1000 + selectedReturn.id}</span>
              </div>
              <button 
                className="text-slate-400 hover:text-slate-600 font-black text-lg"
                onClick={() => setSelectedReturn(null)}
              >
                &times;
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="drawer-body p-5 max-h-[75vh] overflow-y-auto space-y-6">
              
              {/* Product Info Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                    {selectedReturn.requestedQuantity}x
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 leading-tight">{selectedReturn.productName}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">SKU: {selectedReturn.sku} | Unit Price: ₹{selectedReturn.unitPrice?.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold">Claim Type</span>
                    <strong className="text-slate-700">{selectedReturn.requestType}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Status</span>
                    <strong className="text-slate-700">{selectedReturn.status}</strong>
                  </div>
                </div>
              </div>

              {/* Customer Comment & Evidence */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Claim Context</h4>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <p><strong>Customer:</strong> {selectedReturn.customerName || 'Rajesh Kumar'}</p>
                  <p><strong>Reason:</strong> {selectedReturn.reasonCode}</p>
                  {selectedReturn.description && (
                    <p className="italic text-slate-500 bg-white p-2 rounded border border-slate-100/80 mt-2">
                      "{selectedReturn.description}"
                    </p>
                  )}
                </div>
                
                {/* Evidence files simulated list */}
                {selectedReturn.evidenceFiles?.length > 0 && (
                  <div className="mt-3">
                    <span className="block text-xs font-bold text-slate-400 mb-1">Evidence Photos</span>
                    <div className="flex gap-2">
                      <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                        Proof.jpg
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              {selectedReturn.status?.toLowerCase() === 'rejected' ? (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs space-y-1">
                  <h4 className="font-bold text-red-800 flex items-center gap-1.5">
                    <XCircle size={14} /> Request Rejected
                  </h4>
                  <p className="text-red-700 font-medium">Rejection Reason: {selectedReturn.rejectionReason || 'Non-compliant with return timeline window.'}</p>
                  {selectedReturn.remarks && <p className="text-slate-500">Remarks: {selectedReturn.remarks}</p>}
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Claim Progress</h4>
                  <div className="vertical-stepper pl-4 relative space-y-4 text-xs">
                    <div className="stepper-line"></div>
                    
                    {/* Node 1 */}
                    <div className="v-step active">
                      <div className="v-circle"><CheckCircle size={10} /></div>
                      <div className="v-content">
                        <strong>Claim Filed</strong>
                        <span className="block text-[10px] text-slate-400">{new Date(selectedReturn.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Node 2 */}
                    <div className={`v-step ${['approved', 'pickup scheduled', 'refunded', 'completed'].includes(selectedReturn.status?.toLowerCase()) ? 'active' : ''}`}>
                      <div className="v-circle"></div>
                      <div className="v-content">
                        <strong>Claim Approved</strong>
                        {selectedReturn.remarks && selectedReturn.status !== 'Pending' && (
                          <span className="block text-[10px] text-slate-500 italic mt-1">"{selectedReturn.remarks}"</span>
                        )}
                      </div>
                    </div>

                    {/* Node 3 */}
                    <div className={`v-step ${['pickup scheduled', 'refunded', 'completed'].includes(selectedReturn.status?.toLowerCase()) ? 'active' : ''}`}>
                      <div className="v-circle"></div>
                      <div className="v-content">
                        <strong>Pickup Scheduled</strong>
                        {selectedReturn.pickupDetails && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-1 space-y-0.5 text-[10px]">
                            <p><strong>Agent:</strong> {selectedReturn.pickupDetails.pickupAgentName} ({selectedReturn.pickupDetails.pickupAgentPhone})</p>
                            <p><strong>Date:</strong> {new Date(selectedReturn.pickupDetails.pickupDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Node 4 */}
                    <div className={`v-step ${['refunded', 'completed'].includes(selectedReturn.status?.toLowerCase()) ? 'active' : ''}`}>
                      <div className="v-circle"></div>
                      <div className="v-content">
                        <strong>Resolution Finalized</strong>
                        {selectedReturn.refundDetails && (
                          <div className="bg-emerald-50/40 p-2 rounded border border-emerald-100/60 mt-1 space-y-0.5 text-[10px]">
                            <p className="text-emerald-700 font-bold">Refunded: ₹{selectedReturn.refundDetails.approvedRefundAmount}</p>
                            <p><strong>Dest:</strong> {selectedReturn.refundDetails.refundMethod}</p>
                            <p><strong>Txn ID:</strong> {selectedReturn.refundDetails.refundTransactionId}</p>
                          </div>
                        )}
                        {selectedReturn.replacementDetails && (
                          <div className="bg-indigo-50/40 p-2 rounded border border-indigo-100/60 mt-1 space-y-0.5 text-[10px]">
                            <p className="text-indigo-700 font-bold">New Order: #{selectedReturn.replacementDetails.replacementOrderNumber}</p>
                            <p><strong>Carrier:</strong> {selectedReturn.replacementDetails.carrierName}</p>
                            <p><strong>Tracking:</strong> {selectedReturn.replacementDetails.trackingNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Action Buttons Panel */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Management Controls</h4>
                
                {/* 1. Review status (Approve/Reject) */}
                {selectedReturn.status?.toLowerCase() === 'pending' && (
                  <button 
                    onClick={() => { setActiveModal('status'); setStatusUpdateVal('Approved'); }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-slate-900 transition"
                  >
                    <CheckCircle size={14} /> Authorize / Reject Claim
                  </button>
                )}

                {/* 2. Schedule Pickup */}
                {selectedReturn.status?.toLowerCase() === 'approved' && (
                  <button 
                    onClick={() => { setActiveModal('pickup'); setPickupDate(new Date().toISOString().slice(0, 16)); }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Truck size={14} /> Schedule Courier Pickup
                  </button>
                )}

                {/* 3. Issue Refund */}
                {selectedReturn.requestType === 'Refund' && 
                  ['approved', 'pickup scheduled'].includes(selectedReturn.status?.toLowerCase()) && (
                  <button 
                    onClick={() => setActiveModal('refund')}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-emerald-700 transition"
                  >
                    <CreditCard size={14} /> Process Refund Payout
                  </button>
                )}

                {/* 4. Dispatch Replacement */}
                {selectedReturn.requestType === 'Replacement' && 
                  ['approved', 'pickup scheduled'].includes(selectedReturn.status?.toLowerCase()) && (
                  <button 
                    onClick={() => { 
                      setActiveModal('replacement'); 
                      setReplacementEstDelivery(new Date(Date.now() + 5*24*60*60*1000).toISOString().slice(0, 16)); 
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    <RefreshCw size={14} /> Dispatch Replacement Order
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* DIALOG MODALS                                                             */}
      {/* ========================================================================= */}

      {/* 1. Modal: Status Update (Approve / Reject) */}
      {activeModal === 'status' && (
        <div className="admin-modal-overlay" onClick={closeModals}>
          <div className="admin-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Authorize Return Claim</h3>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            
            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-xs">
              {modalError && <div className="alert-error-msg">{modalError}</div>}
              {modalSuccess && <div className="alert-success-msg">{modalSuccess}</div>}

              <div>
                <label className="block font-bold mb-1.5 text-slate-500">Decide Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="claim-auth" 
                      value="Approved"
                      checked={statusUpdateVal === 'Approved'} 
                      onChange={() => setStatusUpdateVal('Approved')}
                      className="accent-primary"
                    />
                    <span>Approve Claim</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer text-red-600">
                    <input 
                      type="radio" 
                      name="claim-auth" 
                      value="Rejected"
                      checked={statusUpdateVal === 'Rejected'} 
                      onChange={() => setStatusUpdateVal('Rejected')}
                      className="accent-red-600"
                    />
                    <span>Reject Claim</span>
                  </label>
                </div>
              </div>

              {statusUpdateVal === 'Rejected' && (
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Rejection Reason</label>
                  <textarea 
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    placeholder="Enter the reason why this claim is being denied..."
                    className="modal-form-control"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1.5 text-slate-500">Admin Remarks (Internal)</label>
                <textarea 
                  rows="2"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Notes about verification, inspection, or general updates..."
                  className="modal-form-control"
                />
              </div>

              <div className="modal-actions pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-primary">
                  {modalLoading ? 'Updating...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Schedule Pickup */}
      {activeModal === 'pickup' && (
        <div className="admin-modal-overlay" onClick={closeModals}>
          <div className="admin-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Schedule Courier Pickup</h3>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            
            <form onSubmit={handlePickupSubmit} className="p-5 space-y-4 text-xs">
              {modalError && <div className="alert-error-msg">{modalError}</div>}
              {modalSuccess && <div className="alert-success-msg">{modalSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Pickup Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    required
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Tracking Reference No</label>
                  <input 
                    type="text" 
                    value={pickupTrackingNumber}
                    onChange={(e) => setPickupTrackingNumber(e.target.value)}
                    placeholder="e.g. PUP-SAT-12345"
                    className="modal-form-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Agent Name</label>
                  <input 
                    type="text" 
                    value={pickupAgentName}
                    onChange={(e) => setPickupAgentName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Agent Phone</label>
                  <input 
                    type="tel" 
                    value={pickupAgentPhone}
                    onChange={(e) => setPickupAgentPhone(e.target.value)}
                    required
                    placeholder="e.g. 9876543210"
                    className="modal-form-control"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-500">Pickup Dispatch Notes</label>
                <textarea 
                  rows="2"
                  value={pickupRemarks}
                  onChange={(e) => setPickupRemarks(e.target.value)}
                  placeholder="Instructions for collection agent..."
                  className="modal-form-control"
                />
              </div>

              <div className="modal-actions pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-primary">
                  {modalLoading ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Issue Refund Payout */}
      {activeModal === 'refund' && (
        <div className="admin-modal-overlay" onClick={closeModals}>
          <div className="admin-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Issue Refund Payout</h3>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            
            <form onSubmit={handleRefundSubmit} className="p-5 space-y-4 text-xs">
              {modalError && <div className="alert-error-msg">{modalError}</div>}
              {modalSuccess && <div className="alert-success-msg">{modalSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Approved Amount (₹)</label>
                  <input 
                    type="number" 
                    value={approvedRefundAmount}
                    onChange={(e) => setApprovedRefundAmount(e.target.value)}
                    required
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Refund Destination</label>
                  <select 
                    value={refundMethod} 
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="modal-form-control"
                  >
                    <option value="Wallet">SAT Wallet Account</option>
                    <option value="Original Payment Method">Original payment gateway (Card/UPI)</option>
                    <option value="Bank Transfer">Bank Account Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Transaction ID</label>
                  <input 
                    type="text" 
                    value={refundTransactionId}
                    onChange={(e) => setRefundTransactionId(e.target.value)}
                    required
                    placeholder="Reference payment reference id"
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Payment Status</label>
                  <select 
                    value={refundStatus} 
                    onChange={(e) => setRefundStatus(e.target.value)}
                    className="modal-form-control"
                  >
                    <option value="Success">Success (Completed)</option>
                    <option value="Pending">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-500">Remarks / Internal Logs</label>
                <textarea 
                  rows="2"
                  value={refundRemarks}
                  onChange={(e) => setRefundRemarks(e.target.value)}
                  placeholder="Details concerning payout execution..."
                  className="modal-form-control"
                />
              </div>

              <div className="modal-actions pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-primary">
                  {modalLoading ? 'Processing...' : 'Authorize Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Dispatch Replacement */}
      {activeModal === 'replacement' && (
        <div className="admin-modal-overlay" onClick={closeModals}>
          <div className="admin-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Dispatch Replacement Shipment</h3>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            
            <form onSubmit={handleReplacementSubmit} className="p-5 space-y-4 text-xs">
              {modalError && <div className="alert-error-msg">{modalError}</div>}
              {modalSuccess && <div className="alert-success-msg">{modalSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">New Order Number</label>
                  <input 
                    type="text" 
                    value={replacementOrderNumber}
                    onChange={(e) => setReplacementOrderNumber(e.target.value)}
                    required
                    placeholder="e.g. REP-ORD-12345"
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">New Order ID (SysRef)</label>
                  <input 
                    type="number" 
                    value={replacementOrderId}
                    onChange={(e) => setReplacementOrderId(e.target.value)}
                    required
                    className="modal-form-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Carrier Logistics</label>
                  <input 
                    type="text" 
                    value={replacementCarrierName}
                    onChange={(e) => setReplacementCarrierName(e.target.value)}
                    required
                    placeholder="e.g. Delhivery / Safexpress"
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Carrier Tracking Number</label>
                  <input 
                    type="text" 
                    value={replacementTrackingNumber}
                    onChange={(e) => setReplacementTrackingNumber(e.target.value)}
                    required
                    placeholder="Logistics tracking ref"
                    className="modal-form-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Estimated Delivery Date</label>
                  <input 
                    type="datetime-local" 
                    value={replacementEstDelivery}
                    onChange={(e) => setReplacementEstDelivery(e.target.value)}
                    required
                    className="modal-form-control"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Dispatch Status</label>
                  <select 
                    value={replacementStatus} 
                    onChange={(e) => setReplacementStatus(e.target.value)}
                    className="modal-form-control"
                  >
                    <option value="Shipped">Dispatched (Shipped)</option>
                    <option value="In Transit">In Transit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-500">Logistics Remarks</label>
                <textarea 
                  rows="2"
                  value={replacementRemarks}
                  onChange={(e) => setReplacementRemarks(e.target.value)}
                  placeholder="Notes about the replacement delivery..."
                  className="modal-form-control"
                />
              </div>

              <div className="modal-actions pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-primary">
                  {modalLoading ? 'Dispatching...' : 'Log Dispatch Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReturns;
