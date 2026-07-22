import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, CreditCard, Check, X, Upload, Copy, Info, 
  RefreshCw, CheckCircle, AlertCircle, ArrowUpRight, Activity, Eye,
  Bell, BellOff
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../api/orders';
import { Toast } from '../components/Toast';
import { getApiDomain } from '../../utils/apiConfig';
import './PaymentHistory.css';

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
        bankName: 'State Bank of India',
        accountNumber: '38190012934',
        accountHolderName: 'SHYAM AGRO TOOLS PRIVATE LIMITED',
        ifscCode: 'SBIN0000001',
        bankBranch: 'Nagpur Main Branch'
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
    if (!window.confirm(`Verify payment of INR ${totalAmount.toLocaleString('en-IN')} for Order #${orderId}?`)) return;
    
    try {
      const isNumericId = /^\d+$/.test(String(realOrderId));
      if (isNumericId) {
        // 1. Update order status to Processing on the server
        await updateOrderStatus(Number(realOrderId), 'Processing');
      }

      // 2. Approve manual verification record if present
      if (verificationRecordId) {
        await updateManualVerificationStatus(verificationRecordId, 'Approved');
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

  // Simulator SMS Preloads
  const fillSmsTemplate = (templateType) => {
    let text = '';
    if (templateType === 'sbi') {
      text = "Dear Customer, A/C X9081 has been credited with INR 14,500.00 on 07-Jul-26 by UPI Ref No 620478129034. - SBI";
    } else if (templateType === 'hdfc') {
      text = "Alert: Your HDFC Bank A/c X3321 has been credited with Rs 8,500.00 by Net Banking Transfer (UTR: 998811223344) on 07/07/2026.";
    } else if (templateType === 'upi') {
      text = "UPI: Rs 14,500.00 received from RAJESH KUMAR (Ref: 620478129034) to your bank account.";
    }
    setSmsText(text);
    setSimulationResult(null);
  };

  // Parse SMS credit alerts automatically
  const handleSimulateAutoMatch = async () => {
    if (!smsText.trim()) {
      setSimulationResult({ success: false, error: 'Please enter notification text to simulate.' });
      return;
    }

    try {
      const response = await reconcileSmsOnServer(smsText);
      if (response && response.success) {
        setSimulationResult({
          success: true,
          utr: response.parsedUtr,
          amount: response.parsedAmount,
          orderId: response.orderId,
          customerName: response.customerName || 'Customer',
          message: response.message || `Successfully matched! Order #${response.orderId} (₹${response.parsedAmount}) was automatically verified and updated to "Processing".`
        });
        

        
        loadOrdersList();
      } else {
        setSimulationResult({
          success: false,
          utr: response.parsedUtr,
          amount: response.parsedAmount,
          error: response.message || `Extracted Reference: "${response.parsedUtr}" (Amount: ₹${response.parsedAmount}), but no matching pending manual order was found.`
        });
      }
    } catch (err) {
      console.warn("Failed to reconcile SMS on server, falling back to local simulation:", err);
      const textClean = smsText.replace(/,/g, '');
      
      let utr = '';
      const utrMatch = textClean.match(/(?:ref|utr|upi ref|reference|transaction id|txn)\s*(?:no|num)?[:\-#\s]*(\w+)/i) || 
                       textClean.match(/\b(\d{12})\b/);
      if (utrMatch) {
        utr = utrMatch[1];
      }

      let amount = null;
      const amtMatch = textClean.match(/(?:inr|rs\.?|rupees|credited)\s*([\d.]+)/i) ||
                       textClean.match(/credited\s*(?:with)?\s*(?:inr|rs\.?)?\s*([\d.]+)/i) ||
                       textClean.match(/recvd\s*([\d.]+)/i);
      if (amtMatch) {
        amount = parseFloat(amtMatch[1]);
      }

      if (!utr) {
        setSimulationResult({
          success: false,
          error: 'Unable to extract transaction reference code (UTR) from this alert.'
        });
        return;
      }

      if (!amount) {
        setSimulationResult({
          success: false,
          error: `Extracted UTR (${utr}) but failed to parse transaction amount.`
        });
        return;
      }

      const matchedOrder = orders.find(o => {
        if (o.paymentMethod !== 'UPI / Bank Transfer') return false;
        const orderUtr = String(o.utr || '').trim().toLowerCase();
        const extractedUtr = String(utr).trim().toLowerCase();
        return orderUtr && orderUtr === extractedUtr && Math.abs(Number(o.totalAmount || o.total) - amount) < 1;
      }) || orders.find(o => {
        const mvMatch = manualVerifications.find(mv => {
          const mvUtr = String(mv.utrNumber || '').trim().toLowerCase();
          const extractedUtr = String(utr).trim().toLowerCase();
          return mvUtr === extractedUtr && Math.abs(Number(mv.amountPaid) - amount) < 1;
        });
        if (mvMatch) {
          return String(o.id || o.orderId) === String(mvMatch.orderId) || String(o.orderNumber) === String(mvMatch.orderId);
        }
        return false;
      });

      if (matchedOrder) {
        const orderId = matchedOrder.id || matchedOrder.orderId;
        try {
          await updateOrderStatus(orderId, 'Processing');
        } catch (serverErr) {
          console.warn("Failed to auto-verify order status on server:", serverErr);
        }
        setSimulationResult({
          success: true,
          utr,
          amount,
          orderId: orderId,
          customerName: matchedOrder.customerName || matchedOrder.customer || 'Customer',
          message: `Successfully matched! Order #${orderId} (₹${amount}) was automatically verified and updated to "Processing".`
        });
        loadOrdersList();
      } else {
        setSimulationResult({
          success: false,
          utr,
          amount,
          error: `Extracted Reference: "${utr}" (Amount: ₹${amount}), but no matching pending manual order was found.`
        });
      }
    }
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
      matchesFilter = status === 'Pending Verification' || status === 'Pending' || status === 'PendingVerification';
    } else if (statusFilter === 'Verified') {
      matchesFilter = status === 'Paid' || status === 'Verified' || status === 'Processing';
    } else if (statusFilter === 'Rejected') {
      matchesFilter = status === 'Rejected' || status === 'Cancelled';
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="payment-history-container">
      <div className="payment-header">
        <div className="payment-header-text">
          <h1>Payments & Verification Settings</h1>
          <p>Configure manual checkout credentials, track customer UTR submissions, and manage transaction matching.</p>
          <div className="payment-notif-toggle-container" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              className={`notif-toggle-pill ${notificationsEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => handleToggleNotifications({ target: { checked: !notificationsEnabled } })}
              title={notificationsEnabled ? "Disable Payment Notifications" : "Enable Payment Notifications"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '20px',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: notificationsEnabled ? '#f0fdf4' : '#f8fafc',
                color: notificationsEnabled ? '#15803d' : '#64748b',
                borderColor: notificationsEnabled ? '#bbf7d0' : '#cbd5e1'
              }}
            >
              {notificationsEnabled ? <Bell size={12} style={{ animation: 'bounce 1s infinite' }} /> : <BellOff size={12} />}
              <span>Alerts: {notificationsEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {notificationsEnabled ? 'Will notify on incoming farmer payments.' : 'Notifications muted.'}
            </span>
          </div>
        </div>
        <div className="payment-selector-wrap">
          <span className="payment-selector-label">Settings Module:</span>
          <select 
            className="payment-dropdown"
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
            <option value="auto-simulation">Auto-Verification Sandbox</option>
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

      <div className="payment-card-body">
        {/* Module 1: Payments List */}
        {activeTab === 'payments-list' && (
          <div>
            <div className="tab-title-section">
              <h2>Transaction Ledger</h2>
              <p>Verify submitted customer reference details against bank credits to process orders.</p>
            </div>

            <div className="payments-filter-row">
              <div className="payments-search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  className="payments-search-input"
                  placeholder="Search by Order ID, Customer, or UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="payments-filter-actions">
                <button 
                  className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('All')}
                >
                  All Payments
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Pending')}
                >
                  Processing / Pending
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'Verified' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Verified')}
                >
                  Verified
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'Rejected' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Rejected')}
                >
                  Rejected
                </button>
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
              <div style={{ overflowX: 'auto' }}>
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
                      const isPending = payment.paymentStatus === 'Pending Verification' || payment.paymentStatus === 'Pending' || payment.paymentStatus === 'PendingVerification';
                      const isVerified = payment.paymentStatus === 'Paid' || payment.paymentStatus === 'Verified' || payment.paymentStatus === 'Processing';
                      const isRejected = payment.paymentStatus === 'Rejected' || payment.paymentStatus === 'Cancelled';
                      
                      return (
                        <tr key={payment.orderId + '-' + payment.utr}>
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
                          <td>{payment.paymentDate ? payment.paymentDate.slice(0, 10) : 'TBD'}</td>
                          <td style={{ fontWeight: 700 }}>
                            <div>₹{(payment.totalAmount || 0).toLocaleString('en-IN')}</div>
                            {payment.amountPaid !== undefined && payment.amountPaid !== payment.totalAmount && (
                              <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: '500' }}>
                                Paid: ₹{payment.amountPaid.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td>
                            {isPending && <span className="pay-status-badge pending"><RefreshCw size={11} className="animate-spin" /> Pending Match</span>}
                            {isVerified && <span className="pay-status-badge verified"><CheckCircle size={11} /> Verified</span>}
                            {isRejected && <span className="pay-status-badge rejected"><X size={11} /> Rejected</span>}
                          </td>
                          <td>
                            <div className="payment-actions-cell">
                              {isPending ? (
                                <>
                                  <button 
                                    className="action-btn verify"
                                    onClick={() => handleVerifyPayment(payment.orderId, payment.totalAmount || payment.amountPaid || 0, payment.realOrderId, payment.verificationRecordId)}
                                  >
                                    <Check size={13} /> Verify Success
                                  </button>
                                  <button 
                                    className="action-btn reject"
                                    onClick={() => handleRejectPayment(payment.orderId, payment.realOrderId, payment.verificationRecordId)}
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Processed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Module 2: QR Code Settings */}
        {activeTab === 'qr-code' && (
          <div>
            <div className="tab-title-section">
              <h2>QR Code Configurations</h2>
              <p>Upload a QR code for user phase checkout payments. Customers scan this QR to pay during checkout.</p>
            </div>

            <form onSubmit={saveQrSettings} className="qr-settings-grid">
              <div className="qr-preview-card">
                <div className="qr-preview-box">
                  {qrPreview ? (
                    <img src={qrPreview} alt="Payment QR Code Preview" />
                  ) : (
                    <div className="qr-placeholder-text">
                      <CreditCard size={32} style={{ marginBottom: '8px', color: '#cbd5e1' }} />
                      No QR Code Uploaded
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>User Phase QR Preview</span>
              </div>

              <div className="qr-upload-instructions">
                <div className="form-group-item">
                  <label>Select QR Image File</label>
                  <label className="file-upload-trigger">
                    <Upload size={20} />
                    <strong>Choose Image File...</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>PNG, JPG, JPEG, SVG up to 2MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={handleQrUpload} 
                    />
                  </label>
                </div>
                
                <div className="form-group-item">
                  <label>Or Paste QR Image URL</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/payment-qr.png"
                    value={qrPreview && qrPreview.startsWith('http') ? qrPreview : ''}
                    onChange={(e) => setQrPreview(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button type="submit" className="form-submit-btn">
                    <Check size={16} /> Update QR Code
                  </button>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Note: QR Code settings will be stored in your browser session for client-side override.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Module 3: Bank Details Settings */}
        {activeTab === 'bank-details' && (
          <div>
            <div className="tab-title-section">
              <h2>Bank Transfer Credentials</h2>
              <p>Edit bank account details displayed to farmers/dealers who choose direct bank wire transfers.</p>
            </div>

            <form onSubmit={saveBankSettings} className="settings-form-layout">
              <div className="form-group-item">
                <label>IFSC Code *</label>
                <input 
                  type="text" 
                  placeholder="e.g. SBIN0000001"
                  required
                  maxLength={11}
                  style={{ textTransform: 'uppercase' }}
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                />
                {ifscStatus.message && (
                  <div className={`input-helper-status ${ifscStatus.type}`}>
                    {ifscStatus.type === 'loading' && <RefreshCw size={11} className="animate-spin" />}
                    {ifscStatus.type === 'success' && <CheckCircle size={11} />}
                    {ifscStatus.type === 'error' && <AlertCircle size={11} />}
                    <span>{ifscStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="form-group-item">
                <label>Bank Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. State Bank of India"
                  required
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                />
              </div>

              <div className="form-group-item">
                <label>Bank Branch *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nagpur Main Branch"
                  required
                  value={bankDetails.bankBranch}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankBranch: e.target.value })}
                />
              </div>

              <div className="form-group-item">
                <label>Account Number *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 38190012934"
                  required
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                />
              </div>

              <div className="form-group-item">
                <label>Account Holder Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. SHYAM AGRO TOOLS PRIVATE LIMITED"
                  required
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                />
              </div>

              <div>
                <button type="submit" className="form-submit-btn">
                  <Check size={16} /> Save Bank details
                </button>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Note: Bank details are initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Module 4: UPI ID Settings */}
        {activeTab === 'upi-id' && (
          <div>
            <div className="tab-title-section">
              <h2>UPI ID Settings</h2>
              <p>Configure the merchant UPI handle shown to customers on the checkout payments screen.</p>
            </div>

            <form onSubmit={saveUpiSettings} className="settings-form-layout">
              <div className="form-group-item">
                <label>Business UPI ID / VPA *</label>
                <input 
                  type="text" 
                  placeholder="e.g. shyamagro@ybl"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <div className="input-helper-status">
                  <Info size={11} />
                  <span>Payments made to this VPA will appear in your linked business bank account.</span>
                </div>
              </div>

              <div>
                <button type="submit" className="form-submit-btn">
                  <Check size={16} /> Update UPI ID
                </button>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Note: Merchant UPI VPA is initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Module 5: Auto-Verification Simulator */}
        {activeTab === 'auto-simulation' && (
          <div>
            <div className="tab-title-section">
              <h2>Auto-Verification Sandbox</h2>
              <p>Simulate how incoming bank notification logs or SMS alerts are matched and verified automatically without payment gateways.</p>
            </div>

            <div className="simulator-layout">
              <div className="simulator-guide-card">
                <h3><Info size={16} /> Automation Architecture Guide</h3>
                <ol className="simulation-step-list">
                  <li>
                    <strong>Reference Collection:</strong> Customer executes the manual UPI/Bank credit to your QR/VPA and inputs the 12-digit transaction ID (UTR) in the Checkout screen, creating a pending order with status <em>"Pending Verification"</em>.
                  </li>
                  <li>
                    <strong>Alert Interception:</strong> Bank alerts (SMS/emails) containing transaction numbers are captured. In production, you run an email parser (IMAP/Gmail API) or SMS gateway webhook listening for alerts.
                  </li>
                  <li>
                    <strong>Notification Scraper:</strong> Regex scrapers extract the amount credited and the UTR code from the notification text payload.
                  </li>
                  <li>
                    <strong>Automatic Reconciliation:</strong> The matching worker queries the database for pending orders where <code>utr === alert_utr</code> and <code>total === alert_amount</code>.
                  </li>
                  <li>
                    <strong>Status Transition:</strong> If reconciled, the system instantly sets payment status to <code>Paid</code> and order status to <code>Processing</code>.
                  </li>
                </ol>
              </div>

              <div className="simulator-interactive-card">
                <h3><Activity size={16} /> Live Simulation Sandbox</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    1. Select Credit SMS Notification Template:
                  </span>
                  <div className="sms-template-container">
                    <button type="button" className="sms-template-btn" onClick={() => fillSmsTemplate('sbi')}>
                      [SBI UPI] Rajesh Kumar (ORD10214) - ₹14,500
                    </button>
                    <button type="button" className="sms-template-btn" onClick={() => fillSmsTemplate('hdfc')}>
                      [HDFC IMPS] Amit Patel (ORD10215) - ₹8,500
                    </button>
                    <button type="button" className="sms-template-btn" onClick={() => fillSmsTemplate('upi')}>
                      [UPI Generic] Rajesh Kumar (ORD10214) - ₹14,500
                    </button>
                  </div>
                </div>

                <div className="form-group-item">
                  <label>2. Customize SMS Notification Payload:</label>
                  <textarea 
                    className="simulation-sms-textarea"
                    placeholder="Enter/edit SMS alert received from the bank..."
                    value={smsText}
                    onChange={(e) => {
                      setSmsText(e.target.value);
                      setSimulationResult(null);
                    }}
                  />
                </div>

                <button 
                  type="button" 
                  className="form-submit-btn" 
                  style={{ background: '#0284c7' }}
                  onClick={handleSimulateAutoMatch}
                >
                  <ArrowUpRight size={16} /> Parse & Reconcile Transaction
                </button>

                {simulationResult && (
                  <div className="simulator-results-panel">
                    <div className={`simulator-result-alert ${simulationResult.success ? 'success' : 'error'}`}>
                      {simulationResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                      <span>{simulationResult.success ? simulationResult.message : simulationResult.error}</span>
                    </div>

                    {(simulationResult.utr || simulationResult.amount) && (
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Scraped Alert Elements:</span>
                        <div className="extracted-badge-row">
                          {simulationResult.utr && (
                            <span className="extracted-badge-item">
                              UTR: <strong>{simulationResult.utr}</strong>
                            </span>
                          )}
                          {simulationResult.amount && (
                            <span className="extracted-badge-item">
                              Amount: <strong>₹{simulationResult.amount.toLocaleString('en-IN')}</strong>
                            </span>
                          )}
                          {simulationResult.success && (
                            <span className="extracted-badge-item" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                              Auto-Approved Order: <strong>#{simulationResult.orderId}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
