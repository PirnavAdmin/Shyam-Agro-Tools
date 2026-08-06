import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, CreditCard, Check, X, Upload, Copy, Info, 
  RefreshCw, CheckCircle, AlertCircle, ArrowUpRight, Activity, Eye,
  Bell, BellOff, Clock, Calendar
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../api/orders';
import { Toast } from '../components/Toast';
import { getApiDomain } from '../../utils/apiConfig';
import './PaymentHistory.css';

const formatDateDisplay = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return 'TBD';
  const cleanStr = String(dateStr).trim();

  // If YYYY-MM-DD format (or ISO timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // If DD/MM/YYYY or DD-MM-YYYY format
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split(/[\/\-]/);
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }

  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  return cleanStr.slice(0, 10);
};

const BASE_PAYMENT_URL = `${getApiDomain()}/api/Payment`;
const HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

const fetchManualVerifications = async (search = '') => {
  const url = search 
    ? `${BASE_PAYMENT_URL}/manual-verifications?search=${encodeURIComponent(search)}` 
    : `${BASE_PAYMENT_URL}/manual-verifications`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const fetchBankDetails = async () => {
  const response = await fetch(`${BASE_PAYMENT_URL}/bank-details`, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const fetchUpiDetails = async () => {
  const response = await fetch(`${BASE_PAYMENT_URL}/upi-details`, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const fetchQrConfig = async () => {
  const response = await fetch(`${BASE_PAYMENT_URL}/qr-config`, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const updateQrConfig = async (formData) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/qr-config`, {
    method: 'PUT',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    body: formData
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const updateBankDetails = async (details) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/bank-details`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(details)
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const updateUpiDetails = async (details) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/upi-details`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(details)
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const updateManualVerificationStatus = async (id, status) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/verify-manual/${id}/status`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// eslint-disable-next-line no-unused-vars
const deleteManualVerification = async (id) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/verify-manual/${id}`, {
    method: 'DELETE',
    headers: HEADERS
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

const reconcileSmsOnServer = async (smsText) => {
  const response = await fetch(`${BASE_PAYMENT_URL}/reconcile-sms`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ smsPayload: smsText })
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};


const PaymentHistory = () => {
  const [activeTab, setActiveTab] = useState('payments-list');
  const [orders, setOrders] = useState([]);
  const [manualVerifications, setManualVerifications] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Settings States
  const [qrPreview, setQrPreview] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankBranch: ''
  });
  const [upiId, setUpiId] = useState('');
  const [originalUpiDetails, setOriginalUpiDetails] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('shyam_agro_payment_notifications') !== 'false');
  
  // Feedback Messages
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [ifscStatus, setIfscStatus] = useState({ type: '', message: '' });
  
  // Simulator States
  const [smsText, setSmsText] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  // Scrollbar synchronization
  const topScrollRef = React.useRef(null);
  const tableScrollRef = React.useRef(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Load configured settings on component mount
  useEffect(() => {
    const savedQr = localStorage.getItem('shyam_agro_qr_code') || '';
    const savedUpi = localStorage.getItem('shyam_agro_upi_id') || 'shyamagro@upi';
    const savedBank = localStorage.getItem('shyam_agro_bank_details');
    
    setQrPreview(savedQr);
    setUpiId(savedUpi);
    
    if (savedBank) {
      try {
        setBankDetails(JSON.parse(savedBank));
      } catch (e) {
        console.error("Failed to parse bank details from local storage");
      }
    } else {
      setBankDetails({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        bankBranch: ''
      });
    }

    const loadServerSettings = async () => {
      try {
        const serverQr = await fetchQrConfig();
        if (serverQr && serverQr.qrImageUrl) {
          const fullQrUrl = serverQr.qrImageUrl.startsWith('/') 
            ? `${getApiDomain()}${serverQr.qrImageUrl}` 
            : serverQr.qrImageUrl;
          setQrPreview(fullQrUrl);
        }
      } catch (e) {
        console.warn("Failed to load live QR config from server:", e);
      }

      try {
        const serverBank = await fetchBankDetails();
        if (serverBank && serverBank.bankName) {
          setBankDetails({
            bankName: serverBank.bankName,
            accountNumber: serverBank.accountNumber,
            accountHolderName: serverBank.accountHolderName,
            ifscCode: serverBank.ifscCode,
            bankBranch: serverBank.branch || serverBank.bankBranch || ''
          });
        }
      } catch (e) {
        console.warn("Failed to load live bank details from server, using local data:", e);
      }

      try {
        const serverUpi = await fetchUpiDetails();
        if (serverUpi) {
          setOriginalUpiDetails(serverUpi);
          if (serverUpi.merchantUpiId) {
            setUpiId(serverUpi.merchantUpiId);
          }
        }
      } catch (e) {
        console.warn("Failed to load live UPI details from server, using local data:", e);
      }
    };
    
    loadServerSettings();
    loadOrdersList();
  }, []);

  const loadOrdersList = async (search = '') => {
    setLoadingOrders(true);
    try {
      const ordersData = await getOrders();
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.data || ordersData?.value || []);
      setOrders(ordersList);
      
      try {
        const verificationsData = await fetchManualVerifications(search);
        const verificationsList = Array.isArray(verificationsData) ? verificationsData : (verificationsData?.verifications || verificationsData?.data || verificationsData?.value || []);
        setManualVerifications(verificationsList);
      } catch (e) {
        console.warn("Failed to load manual verifications from server:", e);
      }
    } catch (e) {
      console.error("Failed to load orders for payments list:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleNotifications = async (e) => {
    const enabled = e.target.checked;
    setNotificationsEnabled(enabled);
    localStorage.setItem('shyam_agro_payment_notifications', enabled ? 'true' : 'false');
    
    showBannerStatus('success', `Payment alerts turned ${enabled ? 'ON' : 'OFF'}.`);
    
    if (enabled && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Alerts Enabled', {
          body: 'You will receive desktop alerts when farmers submit payments for manual verification.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Polling for notification alerts
  useEffect(() => {
    if (!notificationsEnabled) return;
    
    let knownVerificationIds = new Set();
    
    fetchManualVerifications().then(data => {
      const verificationsList = Array.isArray(data) ? data : (data?.verifications || data?.data || data?.value || []);
      verificationsList.forEach(item => knownVerificationIds.add(item.id));
    }).catch(console.error);

    const interval = setInterval(async () => {
      try {
        const data = await fetchManualVerifications();
        const verificationsList = Array.isArray(data) ? data : (data?.verifications || data?.data || data?.value || []);
        const pending = verificationsList.filter(item => item.verificationStatus === 'Pending');
        for (const item of pending) {
          if (!knownVerificationIds.has(item.id)) {
            knownVerificationIds.add(item.id);
            
            if (Notification.permission === 'granted') {
              new Notification('New Payment Submitted', {
                body: `Order #${item.orderId} from ${item.customerName} (₹${item.amountPaid.toLocaleString('en-IN')}) requires manual verification.`,
                icon: '/favicon.ico'
              });
            }
            showBannerStatus('success', `New Payment Submitted! Order #${item.orderId} (₹${item.amountPaid.toLocaleString('en-IN')}) requires verification.`);
          }
        }
      } catch (err) {
        console.warn("Failed to poll manual verifications for notifications:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // IFSC Auto-fetch branch details from Razorpay API
  useEffect(() => {
    const fetchBranchDetails = async () => {
      const formattedIfsc = bankDetails.ifscCode.toUpperCase().trim();
      if (formattedIfsc.length !== 11) {
        setIfscStatus({ type: '', message: '' });
        return;
      }
      
      setIfscStatus({ type: 'loading', message: 'Fetching branch info...' });
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${formattedIfsc}`);
        if (!response.ok) {
          throw new Error('Branch not found for this IFSC code.');
        }
        const data = await response.json();
        
        setBankDetails(prev => ({
          ...prev,
          bankName: data.BANK || prev.bankName,
          bankBranch: data.BRANCH || prev.bankBranch
        }));
        setIfscStatus({ type: 'success', message: `Found: ${data.BANK} - ${data.BRANCH}` });
      } catch (err) {
        setIfscStatus({ type: 'error', message: err.message || 'Failed to auto-fetch branch. Enter branch manually.' });
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchBranchDetails();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [bankDetails.ifscCode]);

  const handleVerifyPayment = async (orderId, totalAmount, realOrderId, verificationRecordId) => {
    if (!window.confirm(`Verify payment of INR ${totalAmount.toLocaleString('en-IN')} for Order #${orderId}?\n\nThis will mark the order as Processing.`)) return;
    
    try {
      // 1. Approve manual verification record if present (validates UTR match against bank records first)
      if (verificationRecordId) {
        const res = await fetch(`${BASE_PAYMENT_URL}/verify-manual/${verificationRecordId}/status`, {
          method: 'PUT',
          headers: HEADERS,
          body: JSON.stringify({ status: 'Approved' })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // 422 = UTR not SMS-verified yet
          if (res.status === 422) {
            const utr = errData.utrNumber || errData.UtrNumber || '';
            showBannerStatus('error',
              `⚠️ Cannot approve — UTR not matched against bank records.` +
              (utr ? ` Expected UTR: ${utr}.` : '') +
              ` Paste the bank credit SMS in the "Auto-Verification Sandbox" tab first.`
            );
          } else {
            showBannerStatus('error', errData.message || errData.Message || `Server error (${res.status}).`);
          }
          return; // stop — do not update order status or refresh
        }
      }

      // 2. Update order status to Processing on the server only after successful verification approval
      const isNumericId = /^\d+$/.test(String(realOrderId));
      if (isNumericId) {
        await updateOrderStatus(Number(realOrderId), 'Processing');
      }
      
      showBannerStatus('success', `Payment for Order #${orderId} verified successfully.${isNumericId ? ' Order status updated to Processing.' : ''}`);
      loadOrdersList();
    } catch (e) {
      showBannerStatus('error', `Failed to verify payment: ${e.message}`);
    }
  };

  // Handle manual verification rejection
  const handleRejectPayment = async (orderId, realOrderId, verificationRecordId) => {
    if (!window.confirm(`Reject payment details for Order #${orderId}?`)) return;
    
    try {
      const isNumericId = /^\d+$/.test(String(realOrderId));
      if (isNumericId) {
        // 1. Cancel order status on the server
        await updateOrderStatus(Number(realOrderId), 'Cancelled');
      }

      // 2. Reject manual verification record if present
      if (verificationRecordId) {
        await updateManualVerificationStatus(verificationRecordId, 'Rejected');
      }
      
      showBannerStatus('success', `Payment for Order #${orderId} rejected.${isNumericId ? ' Order status updated to Cancelled.' : ''}`);
      loadOrdersList();
    } catch (e) {
      showBannerStatus('error', `Failed to reject payment: ${e.message}`);
    }
  };

  const showBannerStatus = (type, message) => {
    setSaveStatus({ type, message });
    setTimeout(() => {
      setSaveStatus({ type: '', message: '' });
    }, 4000);
  };

  // Handle QR code upload
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
      showBannerStatus('success', 'Image preview loaded. Click "Update QR Code" to save.');
    };
    reader.readAsDataURL(file);
  };

  // Save QR Code settings
  const saveQrSettings = async (e) => {
    e.preventDefault();
    if (!qrPreview) {
      showBannerStatus('error', 'Please upload or preview a QR Code before saving.');
      return;
    }
    localStorage.setItem('shyam_agro_qr_code', qrPreview);
    
    try {
      const fd = new FormData();
      if (qrFile) {
        fd.append('file', qrFile);
      } else {
        fd.append('qrImageUrl', qrPreview);
      }
      const response = await updateQrConfig(fd);
      if (response && response.success) {
        showBannerStatus('success', 'QR Code configurations saved to server successfully.');
        setQrFile(null);
      } else {
        showBannerStatus('success', 'QR Code saved locally only.');
      }
    } catch (err) {
      console.warn("Failed to update QR config on server, saved locally:", err);
      showBannerStatus('success', 'QR Code updated locally (Server offline).');
    }
  };

  // Save Bank Details settings
  const saveBankSettings = async (e) => {
    e.preventDefault();
    localStorage.setItem('shyam_agro_bank_details', JSON.stringify(bankDetails));
    
    try {
      await updateBankDetails({
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName,
        ifscCode: bankDetails.ifscCode,
        branch: bankDetails.bankBranch
      });
      showBannerStatus('success', 'Bank Account details saved to server successfully.');
    } catch (err) {
      console.warn("Failed to save bank details to server:", err);
      showBannerStatus('success', 'Bank Account details saved locally (Server offline).');
    }
  };

  // Save UPI ID settings
  const saveUpiSettings = async (e) => {
    e.preventDefault();
    if (!upiId.includes('@')) {
      showBannerStatus('error', 'Invalid UPI ID format (must contain @).');
      return;
    }
    localStorage.setItem('shyam_agro_upi_id', upiId);
    
    try {
      await updateUpiDetails({
        merchantName: originalUpiDetails.merchantName || 'Shyam Agro Tools',
        merchantUpiId: upiId,
        bankDisplayName: originalUpiDetails.bankDisplayName || 'Bank Account',
        currency: originalUpiDetails.currency || 'INR'
      });
      showBannerStatus('success', 'UPI ID details saved to server successfully.');
    } catch (err) {
      console.warn("Failed to save UPI ID to server:", err);
      showBannerStatus('success', 'UPI ID details saved locally (Server offline).');
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showBannerStatus('success', `Copied transaction reference UTR "${text}" to clipboard.`);
  };


  // Combined UPI/Bank Transfer Payments list merging manual verifications and orders
  const combinedPayments = useMemo(() => {
    const list = [];
    const matchedOrderIds = new Set();
    
    // First, process manual verification submissions from server
    manualVerifications.forEach(mv => {
      const mvDigits = String(mv.orderId || '').replace(/\D/g, '');
      const o = orders.find(ord => {
        const ordIdDigits = String(ord.id || ord.orderId || '').replace(/\D/g, '');
        const ordNumDigits = String(ord.orderNumber || '').replace(/\D/g, '');
        return (mvDigits && (mvDigits === ordIdDigits || mvDigits === ordNumDigits)) ||
               String(ord.id || ord.orderId) === String(mv.orderId) ||
               String(ord.orderNumber) === String(mv.orderId);
      });
      
      if (o) {
        matchedOrderIds.add(String(o.id || o.orderId));
      }
      
      list.push({
        id: mv.orderId,
        verificationRecordId: mv.id,
        orderId: mv.orderId,
        customerName: mv.customerName || (o ? (o.customerName || o.customer) : 'Unknown'),
        phone: mv.mobileNumber || (o ? o.phone : ''),
        utr: mv.utrNumber,
        paymentDate: mv.paymentDate || (o ? o.orderDate : 'TBD'),
        totalAmount: o ? (o.totalAmount || o.total || o.finalAmount) : mv.amountPaid,
        amountPaid: mv.amountPaid,
        paymentStatus: o ? (o.paymentStatus || o.status) : (mv.verificationStatus === 'Pending' ? 'Pending Verification' : mv.verificationStatus),
        screenshotUrl: mv.screenshotUrl,
        remarks: mv.remarks,
        isVerificationRecord: true,
        smsVerified: mv.smsVerified === true,
        verifiedUtr: mv.verifiedUtr || null,
        realOrderId: o ? (o.id || o.orderId) : mv.orderId
      });
    });
    
    // Add remaining manual payment orders that don't have server verification details
    orders.forEach(o => {
      if (o.paymentMethod === 'UPI / Bank Transfer' && !matchedOrderIds.has(String(o.id || o.orderId))) {
        list.push({
          id: o.id || o.orderId,
          orderId: o.id || o.orderId,
          customerName: o.customerName || o.customer || 'Unknown',
          phone: o.phone || '',
          utr: o.utr || '',
          paymentDate: o.orderDate ? o.orderDate.slice(0, 10) : 'TBD',
          totalAmount: o.totalAmount || o.total || 0,
          amountPaid: o.paidAmount || 0,
          paymentStatus: o.paymentStatus || o.status,
          screenshotUrl: null,
          remarks: null,
          isVerificationRecord: false,
          realOrderId: o.id || o.orderId
        });
      }
    });
    
    return list;
  }, [manualVerifications, orders]);

  // Filtered Payments List
  const filteredPayments = combinedPayments.filter(p => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      String(p.orderId).toLowerCase().includes(search) || 
      String(p.customerName).toLowerCase().includes(search) ||
      String(p.utr).toLowerCase().includes(search);
    
    let matchesFilter = true;
    const status = p.paymentStatus;
    if (statusFilter === 'Pending') {
      matchesFilter = status === 'Pending Verification' || status === 'Pending' || status === 'PendingVerification' || status === 'Processing';
    } else if (statusFilter === 'Verified') {
      matchesFilter = status === 'Paid' || status === 'Verified' || status === 'Approved';
    } else if (statusFilter === 'Rejected') {
      matchesFilter = status === 'Rejected' || status === 'Cancelled';
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-6xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Payments & Verification Settings</h2>
            <p className="text-slate-500 text-xs mt-1">Configure manual checkout credentials, track customer UTR submissions, and manage transaction matching.</p>
            
            <div className="flex items-center gap-2 mt-3">
              <button 
                type="button" 
                onClick={() => handleToggleNotifications({ target: { checked: !notificationsEnabled } })}
                title={notificationsEnabled ? "Disable Payment Notifications" : "Enable Payment Notifications"}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                  notificationsEnabled 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {notificationsEnabled ? <Bell size={12} className="animate-pulse" /> : <BellOff size={12} />}
                <span>Alerts: {notificationsEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <span className="text-[11px] text-slate-500">
                {notificationsEnabled ? 'Will notify on incoming farmer payments.' : 'Notifications muted.'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
          <span className="text-xs font-semibold text-slate-600 pl-2">Module:</span>
          <select 
            className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-md px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[200px]"
            value={activeTab} 
            onChange={(e) => {
              setActiveTab(e.target.value);
              setSaveStatus({ type: '', message: '' });
            }}
          >
            <option value="payments-list">Payments Ledger & Verification</option>
            <option value="qr-code">QR Code Configurations</option>
            <option value="bank-details">Bank Transfer Details</option>
            <option value="upi-id">UPI ID Configuration</option>
          </select>
        </div>
      </div>

      {saveStatus.message && (
        <Toast 
          message={saveStatus.message} 
          type={saveStatus.type === 'success' ? 'success' : saveStatus.type === 'error' ? 'error' : 'warning'} 
          onClose={() => setSaveStatus({ type: '', message: '' })} 
        />
      )}

      <div className="mt-4">
        {/* Module 1: Payments List */}
        {activeTab === 'payments-list' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Transaction Ledger</h3>
              <p className="text-sm text-slate-500 mt-1">Verify submitted customer reference details against bank credits to process orders.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Search by Order ID, Customer, or UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
                {['All', 'Pending', 'Verified', 'Rejected'].map(filter => (
                  <button 
                    key={filter}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${statusFilter === filter ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter === 'Pending' ? 'Processing / Pending' : filter}
                  </button>
                ))}
              </div>
            </div>

            {loadingOrders ? (
              <div className="empty-payments-state">
                <RefreshCw className="animate-spin" size={24} />
                <p>Loading transactions ledger...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="empty-payments-state">
                <CreditCard size={40} />
                <h3>No Manual Payments Found</h3>
                <p>No orders matched your search or selected filter options.</p>
              </div>
            ) : (
              <div className="ledger-table-card">
                <div 
                  ref={topScrollRef} 
                  className="top-scrollbar-bar" 
                  onScroll={handleTopScroll}
                >
                  <div className="top-scrollbar-dummy" />
                </div>
                <div 
                  ref={tableScrollRef} 
                  className="bottom-table-scroll" 
                  onScroll={handleTableScroll}
                >
                  <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Details</th>
                      <th>UTR / Ref ID</th>
                      <th>Order Date</th>
                      <th>Amount Due</th>
                      <th>Verification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => {
                      const status = (payment.paymentStatus || '').toLowerCase();
                      const isPending = status.includes('pending') || status === 'unverified' || status === 'processing';
                      const isVerified = !isPending && (status.includes('paid') || status.includes('verif') || status.includes('success') || status.includes('approved'));
                      const isRejected = status.includes('reject') || status.includes('cancel') || status.includes('fail');
                      const isUnknown = !isPending && !isVerified && !isRejected;
                      
                      return (
                        <tr key={payment.verificationRecordId ? `mv-${payment.verificationRecordId}` : `ord-${payment.orderId}-${payment.utr}`}>
                          <td>
                            <Link to={`/admin/orders/details/${payment.realOrderId}`} className="order-id">
                              #{payment.orderId}
                            </Link>
                          </td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{payment.customerName}</span>
                              <span className="customer-contact">{payment.phone || 'No phone'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="utr-code-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="utr-code-badge">
                                {payment.utr || 'NOT PROVIDED'}
                                {payment.utr && (
                                  <Copy 
                                    size={12} 
                                    style={{ cursor: 'pointer', opacity: 0.7 }}
                                    onClick={() => handleCopyText(payment.utr)}
                                    title="Copy UTR Reference"
                                  />
                                )}
                              </span>
                              {payment.screenshotUrl && (
                                <a 
                                  href={`${getApiDomain()}${payment.screenshotUrl}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="screenshot-link"
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    fontSize: '11px', 
                                    color: '#0284c7', 
                                    fontWeight: '500',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  <Eye size={12} /> View Payment Slip
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="order-date-wrap" style={{ display: 'flex', alignItems: 'center', minHeight: '32px', fontSize: '13px', fontWeight: 500, color: '#334155', whiteSpace: 'nowrap' }}>
                              <Calendar size={13} style={{ marginRight: '6px', color: '#94a3b8', flexShrink: 0 }} />
                              <span>{formatDateDisplay(payment.paymentDate)}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <div>₹{(payment.totalAmount || 0).toLocaleString('en-IN')}</div>
                            {payment.amountPaid !== undefined && payment.amountPaid !== payment.totalAmount && (
                              <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: '500' }}>
                                Paid: ₹{payment.amountPaid.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td>
                            {isPending && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="pay-status-badge pending"><RefreshCw size={11} className="animate-spin" /> Pending Match</span>
                                {payment.isVerificationRecord && payment.smsVerified && (
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <CheckCircle size={10} /> UTR Matched
                                  </span>
                                )}
                              </div>
                            )}
                            {isVerified && <span className="pay-status-badge verified"><CheckCircle size={11} /> Verified</span>}
                            {isRejected && <span className="pay-status-badge rejected"><X size={11} /> Rejected</span>}
                            {isUnknown && <span className="pay-status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}><Clock size={11} /> Unknown ({payment.paymentStatus || 'None'})</span>}
                          </td>
                          <td>
                            <div className="payment-actions-cell">
                              {isPending ? (
                              <>
                                  <button 
                                    className="pay-ledger-btn verify"
                                    title="Approve this payment"
                                    onClick={() => {
                                      handleVerifyPayment(payment.orderId, payment.totalAmount || payment.amountPaid || 0, payment.realOrderId, payment.verificationRecordId);
                                    }}
                                  >
                                    <Check size={13} /> Verify Success
                                  </button>
                                  <button 
                                    className="pay-ledger-btn reject"
                                    onClick={() => handleRejectPayment(payment.orderId, payment.realOrderId, payment.verificationRecordId)}
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </>
                              ) : isRejected ? (
                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Rejected</span>
                              ) : isVerified ? (
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Completed</span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Module 2: QR Code Settings */}
        {activeTab === 'qr-code' && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">QR Code Configurations</h3>
              <p className="text-sm text-slate-500 mt-1">Upload a QR code for user phase checkout payments. Customers scan this QR to pay during checkout.</p>
            </div>

            <form onSubmit={saveQrSettings} className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center">
                <div className="w-48 h-48 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden mb-4 relative">
                  {qrPreview ? (
                    <img src={qrPreview} alt="Payment QR Code Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <CreditCard size={32} className="mb-2" />
                      <span className="text-xs font-medium">No QR Code</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-600">User Phase QR Preview</span>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select QR Image File</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-600">Click to upload image</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG, SVG up to 2MB</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleQrUpload} 
                    />
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Or Paste QR Image URL</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                    placeholder="https://example.com/payment-qr.png"
                    value={qrPreview && qrPreview.startsWith('http') ? qrPreview : ''}
                    onChange={(e) => setQrPreview(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
                    <Check size={16} /> Update QR Code
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Note: QR Code settings will be stored in your browser session for client-side override.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Module 3: Bank Details Settings */}
        {activeTab === 'bank-details' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Bank Transfer Credentials</h3>
              <p className="text-sm text-slate-500 mt-1">Edit bank account details displayed to farmers/dealers who choose direct bank wire transfers.</p>
            </div>

            <form onSubmit={saveBankSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">IFSC Code *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm uppercase focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. SBIN0000001"
                  required
                  maxLength={11}
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                />
                {ifscStatus.message && (
                  <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${ifscStatus.type === 'error' ? 'text-rose-600' : ifscStatus.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {ifscStatus.type === 'loading' && <RefreshCw size={12} className="animate-spin" />}
                    {ifscStatus.type === 'success' && <CheckCircle size={12} />}
                    {ifscStatus.type === 'error' && <AlertCircle size={12} />}
                    <span>{ifscStatus.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bank Name *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. State Bank of India"
                  required
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bank Branch *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. Nagpur Main Branch"
                  required
                  value={bankDetails.bankBranch}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankBranch: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Number *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. 38190012934"
                  required
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Holder Name *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. SHYAM AGRO TOOLS PRIVATE LIMITED"
                  required
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!bankDetails.ifscCode?.trim() || !bankDetails.bankName?.trim() || !bankDetails.bankBranch?.trim() || !bankDetails.accountNumber?.trim() || !bankDetails.accountHolderName?.trim()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  <Check size={16} /> Save Bank details
                </button>
                <p className="text-[11px] text-slate-500 mt-2">
                  Note: Bank details are initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Module 4: UPI ID Settings */}
        {activeTab === 'upi-id' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">UPI ID Settings</h3>
              <p className="text-sm text-slate-500 mt-1">Configure the merchant UPI handle shown to customers on the checkout payments screen.</p>
            </div>

            <form onSubmit={saveUpiSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business UPI ID / VPA *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. shyamagro@ybl"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <Info size={12} />
                  <span>Payments made to this VPA will appear in your linked business bank account.</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!upiId || !upiId.trim()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  <Check size={16} /> Update UPI ID
                </button>
                <p className="text-[11px] text-slate-500 mt-2">
                  Note: Merchant UPI VPA is initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
