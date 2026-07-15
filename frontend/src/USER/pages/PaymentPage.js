import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import OrderSuccessPage from './OrderSuccessPage';
import { formatCurrency, saveOrder } from '../utils/orders';
import apiClient from '../../api/axios';
import { CART_CHECKOUT_API_BASE_URL, placeOrderSuccess } from '../../services/cartCheckoutService';
import {
  buildPaymentAssetUrl,
  completePayment,
  getPaymentBankDetails,
  getPaymentQr,
  getPaymentQrCode,
  getPaymentQrConfig,
  getPaymentStatus,
  getPaymentUpiDetails,
  initiatePayment,
  submitManualPaymentVerification,
  watchPaymentStatus,
} from '../../services/paymentService';
import './PaymentPage.css';

const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
const nameRegex = /^[A-Za-z\s]+$/;

const isExpiredCard = (expiryDate) => {
  if (!expiryRegex.test(expiryDate)) return true;
  const [month, year] = expiryDate.split('/').map(Number);
  const expiry = new Date(2000 + year, month, 0, 23, 59, 59);
  return expiry < new Date();
};

const formatExpiryDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const paymentMethodOptions = [
  { id: 'qr', label: 'QR Payment' },
  { id: 'upi', label: 'UPI' },
  { id: 'bankTransfer', label: 'Bank Transfer' },
  { id: 'debitCard', label: 'Debit Card' },
  { id: 'creditCard', label: 'Credit Card' },
];

const manualPaymentMethods = ['qr', 'upi', 'bankTransfer'];

const manualVerificationInitialState = {
  orderId: '',
  transactionId: '',
  amount: '',
  paymentDate: '',
  paymentTime: '',
  customerName: '',
  mobileNumber: '',
  remarks: '',
  attachment: null,
};

const manualVerificationMethodLabels = {
  qr: 'QR',
  upi: 'UPI',
  bankTransfer: 'Bank Transfer',
};

const cardPaymentMethods = ['debitCard', 'creditCard'];

const defaultMerchantPaymentProfile = {
  name: process.env.REACT_APP_MANUAL_PAYMENT_MERCHANT_NAME || 'Agro Store',
  upiId: process.env.REACT_APP_MANUAL_PAYMENT_UPI_ID || 'merchant@upi',
  bankDisplayName: '',
  currency: 'INR',
  bankAccountHolder: process.env.REACT_APP_MANUAL_PAYMENT_ACCOUNT_HOLDER || 'Agro Store Payments',
  bankName: process.env.REACT_APP_MANUAL_PAYMENT_BANK_NAME || 'HDFC Bank',
  accountNumber: process.env.REACT_APP_MANUAL_PAYMENT_ACCOUNT_NUMBER || '123456789012',
  ifscCode: process.env.REACT_APP_MANUAL_PAYMENT_IFSC || 'HDFC0001234',
  branch: process.env.REACT_APP_MANUAL_PAYMENT_BRANCH || 'Main Branch',
  qrImageUrl: '',
  qrUpdatedAt: '',
};

const getTodayInputDate = () => new Date().toISOString().slice(0, 10);

const getManualStatusClass = (status = '') => {
  const normalized = status.toLowerCase();
  if (normalized.includes('verified') || normalized.includes('approved')) return 'verified';
  if (normalized.includes('rejected')) return 'rejected';
  return 'pending';
};

const validateManualVerification = ({ values, orderAmount }) => {
  const errors = {};
  const orderId = values.orderId.trim();
  const transactionId = values.transactionId.trim();
  const amount = Number(values.amount);
  const orderTotal = Number(orderAmount);
  const paymentDate = values.paymentDate ? new Date(`${values.paymentDate}T00:00:00`) : null;
  const today = new Date(`${getTodayInputDate()}T00:00:00`);
  const mobileNumber = values.mobileNumber.trim();
  const attachment = values.attachment;

  if (!orderId) {
    errors.orderId = 'Order ID is required.';
  } else if (!/^[A-Za-z0-9/_-]{3,50}$/.test(orderId)) {
    errors.orderId = 'Use 3 to 50 letters or numbers. Hyphen, underscore, and slash are allowed.';
  }

  if (!transactionId) {
    errors.transactionId = 'Transaction / UTR Number is required.';
  } else if (!/^[A-Za-z0-9-]{8,30}$/.test(transactionId)) {
    errors.transactionId = 'Use 8 to 30 letters or numbers. Only hyphen is allowed.';
  }

  if (!values.amount) {
    errors.amount = 'Amount Paid is required.';
  } else if (!Number.isFinite(amount) || Math.abs(amount - orderTotal) > 0.01) {
    errors.amount = `Amount Paid must equal ${formatCurrency(orderTotal)}.`;
  }

  if (!values.paymentDate) {
    errors.paymentDate = 'Payment Date is required.';
  } else if (paymentDate > today) {
    errors.paymentDate = 'Payment Date cannot be in the future.';
  }

  if (!values.paymentTime) errors.paymentTime = 'Payment Time is required.';
  if (!values.customerName.trim()) errors.customerName = 'Customer Name is required.';

  if (!mobileNumber) {
    errors.mobileNumber = 'Mobile Number is required.';
  } else if (!/^\d{10}$/.test(mobileNumber)) {
    errors.mobileNumber = 'Mobile Number must be exactly 10 digits.';
  }

  if (!attachment) {
    errors.attachment = 'Payment screenshot is required.';
  } else {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExtensions = /\.(jpe?g|png|pdf)$/i;
    if (!allowedTypes.includes(attachment.type) && !allowedExtensions.test(attachment.name)) {
      errors.attachment = 'Upload a JPG, JPEG, PNG, or PDF file.';
    } else if (attachment.size > 5 * 1024 * 1024) {
      errors.attachment = 'Attachment must be 5 MB or smaller.';
    }
  }

  return errors;
};

const ManualPaymentStatusCard = ({ submission }) => {
  if (!submission) return null;

  const status = submission.status || 'Pending Verification';

  return (
    <div className="manual-status-card">
      <div className="manual-status-header">
        <div>
          <h4>{submission.message || 'Payment Verification Submitted Successfully'}</h4>
          <p>Verification is currently pending. Once verified, your order status will be updated.</p>
        </div>
        <span className={`manual-status-badge ${getManualStatusClass(status)}`}>{status}</span>
      </div>

      <div className="manual-status-grid">
        <div>
          <span>Order ID</span>
          <strong>{submission.orderId}</strong>
        </div>
        <div>
          <span>Reference Number</span>
          <strong>{submission.referenceNumber}</strong>
        </div>
        <div>
          <span>Submission Date</span>
          <strong>{submission.submissionDate}</strong>
        </div>
        <div>
          <span>Payment Status</span>
          <strong>{status}</strong>
        </div>
      </div>
    </div>
  );
};

const ManualVerificationForm = ({
  values,
  errors,
  isSubmitting,
  submission,
  orderAmount,
  attachmentPreview,
  cameraOpen,
  cameraError,
  cameraVideoRef,
  cameraCanvasRef,
  onChange,
  onFileChange,
  onOpenCamera,
  onCloseCamera,
  onConfirmCapture,
  onSubmit,
  onReset,
}) => (
  <div className="manual-verification-section">
    <ManualPaymentStatusCard submission={submission} />

    <div className="manual-verification-card">
      <div className="manual-verification-heading">
        <h4>Manual Payment Verification</h4>
        <p>Enter the payment details after completing the transfer externally.</p>
      </div>

      <div className="payment-form-group remarks-field">
        <label>Remarks (Optional)</label>
        <textarea
          name="remarks"
          className="payment-input"
          value={values.remarks}
          onChange={onChange}
          placeholder="Add any additional payment notes"
        />
      </div>

      <div className="payment-form-row">
        <div className="payment-form-group">
          <label>Order ID *</label>
          <input
            type="text"
            name="orderId"
            className="payment-input payment-input-readonly"
            value={values.orderId}
            readOnly
            aria-readonly="true"
            placeholder="Order ID will be generated automatically"
            maxLength="50"
          />
          {errors.orderId && <span className="field-error-msg">{errors.orderId}</span>}
        </div>

        <div className="payment-form-group">
          <label>Transaction / UTR Number *</label>
          <input
            type="text"
            name="transactionId"
            className="payment-input"
            value={values.transactionId}
            onChange={onChange}
            placeholder="Enter UTR or reference ID"
            maxLength="30"
          />
          {errors.transactionId && <span className="field-error-msg">{errors.transactionId}</span>}
        </div>
      </div>

      <div className="payment-form-row">
        <div className="payment-form-group">
          <label>Amount Paid *</label>
          <input
            type="number"
            name="amount"
            className="payment-input payment-input-readonly"
            value={values.amount}
            readOnly
            aria-readonly="true"
            placeholder={formatCurrency(orderAmount)}
            step="0.01"
          />
          {errors.amount && <span className="field-error-msg">{errors.amount}</span>}
        </div>
      </div>

      <div className="payment-form-row">
        <div className="payment-form-group">
          <label>Payment Date *</label>
          <input
            type="date"
            name="paymentDate"
            className="payment-input"
            value={values.paymentDate}
            onChange={onChange}
            max={getTodayInputDate()}
          />
          {errors.paymentDate && <span className="field-error-msg">{errors.paymentDate}</span>}
        </div>

        <div className="payment-form-group">
          <label>Payment Time *</label>
          <input
            type="time"
            name="paymentTime"
            className="payment-input"
            value={values.paymentTime}
            onChange={onChange}
          />
          {errors.paymentTime && <span className="field-error-msg">{errors.paymentTime}</span>}
        </div>
      </div>

      <div className="payment-form-row">
        <div className="payment-form-group">
          <label>Customer Name *</label>
          <input
            type="text"
            name="customerName"
            className="payment-input"
            value={values.customerName}
            onChange={onChange}
            placeholder="Enter customer name"
          />
          {errors.customerName && <span className="field-error-msg">{errors.customerName}</span>}
        </div>

        <div className="payment-form-group">
          <label>Mobile Number *</label>
          <input
            type="tel"
            name="mobileNumber"
            className="payment-input"
            value={values.mobileNumber}
            onChange={onChange}
            placeholder="10 digit mobile number"
            maxLength="10"
            inputMode="numeric"
          />
          {errors.mobileNumber && <span className="field-error-msg">{errors.mobileNumber}</span>}
        </div>
      </div>

      <div className="payment-form-group">
        <label>Upload Payment Screenshot *</label>
        <div className="file-input-wrapper">
          <label className="file-input-action">
            <span className="file-input-custom-btn">
              <i className="fas fa-paperclip" aria-hidden="true"></i>
              Choose File
            </span>
            <input
              type="file"
              className="file-input-hidden"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onClick={(event) => {
                event.currentTarget.value = '';
              }}
              onChange={onFileChange}
            />
          </label>
          <button type="button" className="file-input-custom-btn capture-file-btn" onClick={onOpenCamera}>
              <i className="fas fa-camera" aria-hidden="true"></i>
              Capture Photo
          </button>
        </div>
        {cameraOpen && (
          <div className="camera-capture-modal" role="dialog" aria-modal="true" aria-label="Capture payment screenshot">
            <div className="camera-capture-panel">
              <div className="camera-capture-preview">
                <video ref={cameraVideoRef} autoPlay playsInline muted />
                <canvas ref={cameraCanvasRef} className="camera-capture-canvas" />
              </div>
              {cameraError && <span className="field-error-msg">{cameraError}</span>}
              <div className="camera-capture-actions">
                <button type="button" className="payment-primary-btn" onClick={onConfirmCapture}>
                  OK
                </button>
                <button type="button" className="payment-secondary-btn" onClick={onCloseCamera}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {attachmentPreview && (
          <div className="uploaded-file-preview">
            <img src={attachmentPreview} alt="Selected payment screenshot preview" />
          </div>
        )}
        {values.attachment && (
          <span className="uploaded-file-name">
            Selected: {values.attachment.name}
          </span>
        )}
        {errors.attachment && <span className="field-error-msg">{errors.attachment}</span>}
      </div>

      {errors.api && <div className="alert-error">{errors.api}</div>}

      <div className="manual-verification-actions">
        <button type="button" className="payment-primary-btn" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Verification'}
        </button>
        <button type="button" className="payment-secondary-btn" onClick={onReset} disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </div>
  </div>
);

const qrPaymentInitialState = {
  isVisible: false,
  isLoading: false,
  status: 'idle',
  orderId: '',
  qrSource: '',
  error: '',
};

const PAYMENT_STORAGE_KEY = 'augro:paymentTransaction';

const getStoredPayment = () => {
  try {
    return JSON.parse(window.localStorage.getItem(PAYMENT_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const getQrSource = (paymentQr = {}) => {
  const nested = paymentQr.data || paymentQr.value || {};
  const qrUrl =
    paymentQr.qrCodeUrl ||
    paymentQr.qrImageUrl ||
    paymentQr.qrUrl ||
    paymentQr.imageUrl ||
    nested.qrCodeUrl ||
    nested.qrImageUrl ||
    nested.qrUrl ||
    nested.imageUrl;
  if (qrUrl) {
    return buildPaymentAssetUrl(qrUrl);
  }
  const qrBase64 = paymentQr.qrBase64 || nested.qrBase64;
  if (qrBase64) {
    return qrBase64.startsWith('data:')
      ? qrBase64
      : `data:image/png;base64,${qrBase64}`;
  }
  const qrSvg = paymentQr.qrSvg || nested.qrSvg;
  if (qrSvg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
  }
  return '';
};

const getFirstPaymentValue = (source, keys, fallback = '') => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
};

const normalizePaymentProfile = ({ upiDetails = {}, bankDetails = {}, qrConfig = {}, qrCode = {} }) => ({
  ...defaultMerchantPaymentProfile,
  name: getFirstPaymentValue(upiDetails, ['merchantName', 'MerchantName', 'name', 'Name'], defaultMerchantPaymentProfile.name),
  upiId: getFirstPaymentValue(upiDetails, ['merchantUpiId', 'MerchantUpiId', 'upiId', 'UpiId'], defaultMerchantPaymentProfile.upiId),
  bankDisplayName: getFirstPaymentValue(upiDetails, ['bankDisplayName', 'BankDisplayName'], ''),
  currency: getFirstPaymentValue(upiDetails, ['currency', 'Currency'], defaultMerchantPaymentProfile.currency),
  bankAccountHolder: getFirstPaymentValue(bankDetails, ['accountHolderName', 'AccountHolderName', 'bankAccountHolder', 'BankAccountHolder'], defaultMerchantPaymentProfile.bankAccountHolder),
  bankName: getFirstPaymentValue(bankDetails, ['bankName', 'BankName'], defaultMerchantPaymentProfile.bankName),
  accountNumber: getFirstPaymentValue(bankDetails, ['accountNumber', 'AccountNumber'], defaultMerchantPaymentProfile.accountNumber),
  ifscCode: getFirstPaymentValue(bankDetails, ['ifscCode', 'IfscCode', 'IFSCCode', 'ifsc'], defaultMerchantPaymentProfile.ifscCode),
  branch: getFirstPaymentValue(bankDetails, ['branch', 'Branch'], defaultMerchantPaymentProfile.branch),
  qrImageUrl: getQrSource(qrCode) || getQrSource(qrConfig),
  qrUpdatedAt: getFirstPaymentValue(qrCode, ['updatedAt', 'UpdatedAt'], getFirstPaymentValue(qrConfig, ['updatedAt', 'UpdatedAt'], '')),
});

const mapCheckoutItems = (items) => {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 0);
    const price = Number(item.sellingPrice ?? 0);

    return {
      ...item,
      cartId: item.cartItemId,
      productId: item.productId,
      id: String(item.productId),
      quantity,
      price,
      lineTotal: Number(item.itemTotal ?? 0),
      name: item.productName || '',
      displayName: item.productName || '',
      image: item.imageUrl
        ? `${CART_CHECKOUT_API_BASE_URL}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`
        : '/product-images/fallback.png',
      sku: String(item.productId),
    };
  });
};

const getBackendPaymentMethod = (paymentMethod, onlinePaymentType) => {
  if (paymentMethod === 'cod') return 'COD';
  if (onlinePaymentType === 'upi' || onlinePaymentType === 'qr-payment') return 'UPI';
  if (onlinePaymentType === 'debit-card' || onlinePaymentType === 'credit-card') return 'CARD';
  if (onlinePaymentType === 'net-banking') return 'NET_BANKING';
  return '';
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  const nestedData = data?.data;
  const statusMessages = {
    400: 'The payment details were rejected. Please review them and try again.',
    401: 'The payment credentials were not accepted.',
    404: 'The payment transaction could not be found.',
    500: 'The payment server encountered an error. Please try again.',
  };
  return (
    data?.message ||
    nestedData?.message ||
    data?.title ||
    data?.error ||
    data?.errors?.customerAddressId?.[0] ||
    data?.errors?.paymentMethod?.[0] ||
    statusMessages[error?.response?.status] ||
    error?.message ||
    fallbackMessage
  );
};

const PaymentPage = () => {
  const { user } = useAuth();
  const { clearCart, waitForCartSync } = useCart();
  const { t, productText } = useLanguage();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Validate location state presence on mount
  useEffect(() => {
    if (!location.state || !location.state.formData) {
      navigate('/checkout');
    }
  }, [location, navigate]);

  // Read state passed from checkout page
  const selectedAddressId = location.state?.selectedAddressId ?? null;
  const initialSummary = location.state?.checkoutSummary ?? null;
  const initialFormData = location.state?.formData ?? {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    addressType: 'Home',
    paymentMethod: 'online',
  };

  const [formData] = useState(initialFormData);
  const [couponCode] = useState(location.state?.appliedCoupon?.code || '');
  const [coinsRedeem] = useState(Number(location.state?.coinsUsed || 0));

  // Payment Redesign Specific State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('qr'); // upi, bankTransfer, debitCard, creditCard, qr, cod
  const [onlinePaymentType, setOnlinePaymentType] = useState('qr-payment'); // upi, net-banking, debit-card, credit-card, qr-payment

  // Common payment details
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
  });

  const [debitCardDetails, setDebitCardDetails] = useState({
    expiryMonth: '',
    expiryYear: '',
    nickname: '',
    saveCard: false,
  });

  const [creditCardDetails, setCreditCardDetails] = useState({
    billingAddress: '',
    saveCard: false,
  });

  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [manualVerification, setManualVerification] = useState(() => ({
    ...manualVerificationInitialState,
    amount: String(Number(initialSummary?.grandTotal ?? 0) || ''),
    customerName: `${initialFormData.firstName} ${initialFormData.lastName}`.trim(),
    mobileNumber: initialFormData.phone || '',
  }));
  const [manualVerificationErrors, setManualVerificationErrors] = useState({});
  const [manualVerificationSubmission, setManualVerificationSubmission] = useState(null);
  const [isSubmittingManualVerification, setIsSubmittingManualVerification] = useState(false);
  const [manualVerificationAttachmentPreview, setManualVerificationAttachmentPreview] = useState('');
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [cameraCaptureError, setCameraCaptureError] = useState('');

  // Common system payment states
  const [paymentErrors, setPaymentErrors] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [qrPayment, setQrPayment] = useState(qrPaymentInitialState);
  const [checkoutSummary, setCheckoutSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(!initialSummary);
  const [error, setError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState(getStoredPayment);
  const [addressError, setAddressError] = useState('');
  const [merchantPaymentProfile, setMerchantPaymentProfile] = useState(defaultMerchantPaymentProfile);
  const [paymentConfigState, setPaymentConfigState] = useState({
    isLoading: true,
    error: '',
  });
  const qrStatusUnsubscribeRef = useRef(null);
  const defaultQrInitializedRef = useRef(false);
  const manualVerificationRequestRef = useRef(false);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const onlinePaymentLabels = {
    upi: t('upi') || 'UPI',
    'debit-card': t('debitCard') || 'Debit Card',
    'credit-card': t('creditCard') || 'Credit Card',
    'net-banking': t('netBanking') || 'Bank Transfer',
    'qr-payment': 'QR Payment',
  };

  const cartItems = useMemo(
    () => mapCheckoutItems(checkoutSummary?.cartItems || []),
    [checkoutSummary]
  );
  const cartSubtotal = Number(checkoutSummary?.subTotal ?? 0);
  const taxableAmount = cartSubtotal;
  const totalGst = Number(checkoutSummary?.tax ?? 0);
  const cgst = Number(checkoutSummary?.cgst ?? 0);
  const sgst = Number(checkoutSummary?.sgst ?? 0);
  const gst = totalGst;
  const deliveryCharge = Number(checkoutSummary?.shippingCharges ?? 0);
  const couponDiscount = Number(checkoutSummary?.couponDiscount ?? 0);
  const coinsDiscount = Number(checkoutSummary?.coinsDiscount ?? 0);
  const discountTotal = couponDiscount + coinsDiscount;
  const appliedCoupon = couponCode ? { code: couponCode } : null;
  const grandTotal = Number(checkoutSummary?.grandTotal ?? 0);
  // Load summary on mount if missing
  const loadCheckoutSummary = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await waitForCartSync();
      const response = await apiClient.get(
        `${CART_CHECKOUT_API_BASE_URL}/api/Checkout/summary`,
        {
          params: {
            ...(couponCode.trim() && { couponCode: couponCode.trim() }),
            ...(Number(coinsRedeem) > 0 && { coinsToRedeem: Number(coinsRedeem) }),
          },
          headers: { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' },
        }
      );
      setCheckoutSummary(response.data?.data ?? response.data);
    } catch (requestError) {
      console.error('Unable to load checkout summary.', requestError);
      setError('Unable to load your checkout summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [couponCode, coinsRedeem, waitForCartSync]);

  useEffect(() => {
    if (!initialSummary) {
      loadCheckoutSummary();
    }
  }, [initialSummary, loadCheckoutSummary]);

  const loadPaymentConfiguration = useCallback(async () => {
    setPaymentConfigState({ isLoading: true, error: '' });

    const [upiResult, bankResult, qrConfigResult, qrCodeResult] = await Promise.allSettled([
      getPaymentUpiDetails(),
      getPaymentBankDetails(),
      getPaymentQrConfig(),
      getPaymentQrCode(),
    ]);

    const upiDetails = upiResult.status === 'fulfilled' ? upiResult.value : {};
    const bankDetails = bankResult.status === 'fulfilled' ? bankResult.value : {};
    const qrConfig = qrConfigResult.status === 'fulfilled' ? qrConfigResult.value : {};
    const qrCode = qrCodeResult.status === 'fulfilled' ? qrCodeResult.value : {};

    setMerchantPaymentProfile(normalizePaymentProfile({ upiDetails, bankDetails, qrConfig, qrCode }));

    const failedRequiredRequests = [upiResult, bankResult, qrConfigResult, qrCodeResult].filter(
      (result) => result.status === 'rejected'
    );
    setPaymentConfigState({
      isLoading: false,
      error: failedRequiredRequests.length
        ? 'Some payment details could not be refreshed. Showing available details.'
        : '',
    });
  }, []);

  useEffect(() => {
    loadPaymentConfiguration();
  }, [loadPaymentConfiguration]);

  useEffect(() => {
    if (!manualVerification.amount && Number(grandTotal) > 0) {
      setManualVerification((current) => ({ ...current, amount: String(grandTotal) }));
    }
  }, [grandTotal, manualVerification.amount]);

  useEffect(() => {
    const existingOrderId = paymentTransaction?.orderId || qrPayment.orderId;
    if (!manualVerification.orderId && existingOrderId) {
      setManualVerification((current) => ({ ...current, orderId: existingOrderId }));
    }
  }, [manualVerification.orderId, paymentTransaction?.orderId, qrPayment.orderId]);

  useEffect(() => () => qrStatusUnsubscribeRef.current?.(), []);

  useEffect(() => () => {
    if (manualVerificationAttachmentPreview) {
      URL.revokeObjectURL(manualVerificationAttachmentPreview);
    }
  }, [manualVerificationAttachmentPreview]);

  const stopCameraCapture = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => () => {
    stopCameraCapture();
  }, [stopCameraCapture]);

  // Sync selectedPaymentMethod tab change with backend states
  const handlePaymentMethodTabChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentErrors({});

    const typeMapping = {
      upi: 'upi',
      bankTransfer: 'net-banking',
      debitCard: 'debit-card',
      creditCard: 'credit-card',
      qr: 'qr-payment',
      cod: 'cod',
    };
    const mappedType = typeMapping[method];
    setOnlinePaymentType(mappedType);

    // Unsubscribe from any active QR status polling
    qrStatusUnsubscribeRef.current?.();
    qrStatusUnsubscribeRef.current = null;

    if (method === 'qr') {
      // Auto-initiate QR payment generation
      openQrPayment('QR Payment');
    } else {
      setQrPayment(qrPaymentInitialState);
    }
  };

  const handlePaymentDetailChange = (event) => {
    const { name, value } = event.target;

    const sanitizedValue = (() => {
      if (name === 'cardNumber') return value.replace(/\D/g, '').slice(0, 16);
      if (name === 'cvv') return value.replace(/\D/g, '').slice(0, 3);
      if (name === 'expiryDate') return formatExpiryDate(value);
      return value;
    })();

    setPaymentDetails((current) => ({ ...current, [name]: sanitizedValue }));
    setPaymentErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleDebitCardDetailChange = (event) => {
    const { name, value, type, checked } = event.target;
    const val = type === 'checkbox' ? checked : value;
    setDebitCardDetails((current) => ({ ...current, [name]: val }));
    setPaymentErrors((current) => ({ ...current, expiryDate: '' }));
  };

  const handleCreditCardDetailChange = (event) => {
    const { name, value, type, checked } = event.target;
    const val = type === 'checkbox' ? checked : value;
    setCreditCardDetails((current) => ({ ...current, [name]: val }));
    setPaymentErrors((current) => ({ ...current, [name]: '' }));
  };

  const generateOrderId = () => {
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `SAT${dateCode}${randomCode}`;
  };

  const persistPaymentTransaction = (updates) => {
    setPaymentTransaction((current) => {
      const next = { ...current, ...updates };
      window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getPaymentInitiationPayload = (orderId) => {
    const base = { amount: Number(grandTotal), orderId };
    
    if (selectedPaymentMethod === 'upi') {
      return { ...base, paymentMethod: 'UPI', upiId: paymentDetails.upiId.trim() };
    }

    if (selectedPaymentMethod === 'qr') {
      return { ...base, paymentMethod: 'UPI', upiId: merchantPaymentProfile.upiId };
    }
    
    if (selectedPaymentMethod === 'debitCard') {
      const expMonth = debitCardDetails.expiryMonth.padStart(2, '0');
      const expYear = debitCardDetails.expiryYear.slice(-2);
      const formattedExp = `${expMonth}/${expYear}`;
      return {
        ...base,
        paymentMethod: 'Card',
        cardNumber: paymentDetails.cardNumber,
        nameOnCard: paymentDetails.cardName.trim(),
        expiryDate: formattedExp,
        cvv: paymentDetails.cvv,
      };
    }

    if (selectedPaymentMethod === 'creditCard') {
      return {
        ...base,
        paymentMethod: 'Card',
        cardNumber: paymentDetails.cardNumber,
        nameOnCard: paymentDetails.cardName.trim(),
        expiryDate: paymentDetails.expiryDate.trim(),
        cvv: paymentDetails.cvv,
      };
    }

    if (selectedPaymentMethod === 'bankTransfer') {
      return { ...base, paymentMethod: 'NetBanking', bankName: paymentDetails.bankName.trim() };
    }

    return null;
  };

  const startPayment = async (orderId, orderData = {}) => {
    const payload = getPaymentInitiationPayload(orderId);
    if (!payload) throw new Error('This payment method is not supported by the payment service.');
    const result = await initiatePayment(payload);
    if (!result?.transactionId) throw new Error('The payment server did not return a transaction ID.');
    persistPaymentTransaction({
      ...orderData,
      transactionId: result.transactionId,
      paymentStatus: result.status || 'Pending',
      paymentMethod: payload.paymentMethod,
      orderId,
      message: result.message || '',
    });
    return result;
  };

  const createOrderForPayment = async (backendPaymentMethod) => {
    if (!backendPaymentMethod) throw new Error('Please select a payment method.');
    await waitForCartSync();
    if (!cartItems.length) throw new Error('Your cart is empty. Add a product before placing the order.');
    if (!Number.isFinite(Number(grandTotal)) || Number(grandTotal) <= 0) {
      throw new Error('The order total is invalid. Refresh checkout and try again.');
    }

    const addressId = selectedAddressId;
    if (!addressId) throw new Error('Save a valid delivery address before placing the order.');

    const backendOrder = await placeOrderSuccess({
      customerAddressId: addressId,
      paymentMethod: backendPaymentMethod,
      couponCode: couponCode.trim(),
      coinsRedeemed: Number(checkoutSummary?.coinsToRedeem ?? coinsRedeem),
    });
    const orderId = String(
      backendOrder?.orderId || backendOrder?.orderID || backendOrder?.orderNumber || backendOrder?.id || ''
    );
    if (!orderId) throw new Error('The order server did not return an order ID.');

    return { backendOrder, orderId };
  };

  const validateOnlinePayment = () => {
    const errors = {};

    if (selectedPaymentMethod === 'upi') {
      const upiId = paymentDetails.upiId.trim();
      if (!upiId) errors.upiId = t('upiRequired') || 'UPI ID is required.';
      else if (!upiRegex.test(upiId)) errors.upiId = t('upiInvalid') || 'Enter a valid UPI ID.';
    }

    if (selectedPaymentMethod === 'debitCard') {
      const cardNumber = paymentDetails.cardNumber;
      if (!cardNumber) errors.cardNumber = t('cardNumberRequired') || 'Card Number is required.';
      else if (!/^\d{16}$/.test(cardNumber)) errors.cardNumber = t('cardNumberInvalid') || 'Card Number must be 16 digits.';
      
      if (!paymentDetails.cardName.trim()) errors.cardName = t('cardNameRequired') || 'Card Holder Name is required.';
      else if (!nameRegex.test(paymentDetails.cardName.trim())) errors.cardName = 'Name on card should contain only letters and spaces.';
      
      if (!debitCardDetails.expiryMonth || !debitCardDetails.expiryYear) {
        errors.expiryDate = 'Expiry month and year are required.';
      } else {
        const expMonth = debitCardDetails.expiryMonth.padStart(2, '0');
        const expYear = debitCardDetails.expiryYear.slice(-2);
        const formattedExp = `${expMonth}/${expYear}`;
        if (isExpiredCard(formattedExp)) {
          errors.expiryDate = t('expiryDateExpired') || 'Card has expired.';
        }
      }
      
      if (!paymentDetails.cvv.trim()) errors.cvv = t('cvvRequired') || 'CVV is required.';
      else if (!/^\d{3}$/.test(paymentDetails.cvv.trim())) errors.cvv = t('cvvInvalid') || 'CVV must be 3 digits.';
    }

    if (selectedPaymentMethod === 'creditCard') {
      const cardNumber = paymentDetails.cardNumber;
      if (!cardNumber) errors.cardNumber = t('cardNumberRequired') || 'Card Number is required.';
      else if (!/^\d{16}$/.test(cardNumber)) errors.cardNumber = t('cardNumberInvalid') || 'Card Number must be 16 digits.';
      
      if (!paymentDetails.cardName.trim()) errors.cardName = t('cardNameRequired') || 'Card Holder Name is required.';
      else if (!nameRegex.test(paymentDetails.cardName.trim())) errors.cardName = 'Name on card should contain only letters and spaces.';
      
      if (!paymentDetails.expiryDate.trim()) errors.expiryDate = t('expiryDateRequired') || 'Expiry Date is required.';
      else if (!expiryRegex.test(paymentDetails.expiryDate.trim())) errors.expiryDate = t('expiryDateFormat') || 'Expiry must be MM/YY.';
      else if (isExpiredCard(paymentDetails.expiryDate.trim())) errors.expiryDate = t('expiryDateExpired') || 'Card has expired.';
      
      if (!paymentDetails.cvv.trim()) errors.cvv = t('cvvRequired') || 'CVV is required.';
      else if (!/^\d{3}$/.test(paymentDetails.cvv.trim())) errors.cvv = t('cvvInvalid') || 'CVV must be 3 digits.';
      
      if (!creditCardDetails.billingAddress.trim()) errors.billingAddress = 'Billing Address is required.';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const completeOrder = async (
    paymentMethodName,
    orderId = generateOrderId(),
    backendPaymentMethod = getBackendPaymentMethod('online', onlinePaymentType),
    transaction = paymentTransaction,
    existingBackendOrder = null
  ) => {
    if (isPlacingOrder) return false;
    setIsPlacingOrder(true);
    setAddressError('');

    if (!backendPaymentMethod) {
      setAddressError('Please select a payment method.');
      setIsPlacingOrder(false);
      return false;
    }

    let backendOrder = existingBackendOrder;
    if (!backendOrder) {
      try {
        backendOrder = await placeOrderSuccess({
          customerAddressId: Number(selectedAddressId),
          paymentMethod: backendPaymentMethod,
          couponCode: couponCode.trim(),
          coinsRedeemed: Number(checkoutSummary?.coinsToRedeem ?? coinsRedeem),
        });
      } catch (error) {
        console.error('Unable to place order.', error.response?.data || error);
        setAddressError(getApiErrorMessage(error, 'Unable to place the order. Please try again.'));
        setIsPlacingOrder(false);
        return false;
      }
    }

    const confirmedOrderId = String(
      backendOrder?.orderId || backendOrder?.orderID || backendOrder?.orderNumber || backendOrder?.id || orderId
    );
    const paymentStatus = t('paid');
    const customerMobile = user?.phone || user?.mobileNumber || user?.MobileNumber || formData.phone;
    const order = {
      id: confirmedOrderId,
      items: cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: productText(item, 'displayName') || item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        total: item.lineTotal,
      })),
      subtotal: cartSubtotal,
      taxableAmount,
      cgst,
      sgst,
      gst,
      totalGst,
      deliveryCharge,
      discount: discountTotal,
      couponDiscount,
      coinsDiscount,
      couponCode: appliedCoupon?.code || '',
      total: grandTotal,
      customerMobile,
      mobileNumber: customerMobile,
      paymentMethod: paymentMethodName,
      paymentStatus: transaction?.paymentStatus || paymentStatus,
      transactionId: transaction?.transactionId || '',
      paymentMessage: transaction?.message || '',
      billingDetails: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
      },
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        type: formData.addressType,
      },
      status: t('orderPlaced') || 'Order Placed',
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    setPlacedOrder(order);
    clearCart();
    setIsPlacingOrder(false);
    return true;
  };

  const handleQrPaymentStatus = async (status, paymentMethod, orderId, transactionId) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'success' || normalizedStatus === 'paid') {
      setQrPayment(qrPaymentInitialState);
      qrStatusUnsubscribeRef.current?.();
      qrStatusUnsubscribeRef.current = null;
      try {
        const statusResult = await getPaymentStatus(transactionId);
        const transaction = {
          transactionId,
          orderId,
          paymentMethod: 'UPI',
          paymentStatus: statusResult?.status || 'Success',
          paymentGatewayStatus: statusResult?.status || 'Success',
          paymentCompleted: true,
          qrStatus: 'Completed',
          message: statusResult?.message || '',
        };
        persistPaymentTransaction(transaction);
        await completeOrder(paymentMethod, orderId, 'UPI', transaction);
      } catch (error) {
        setQrPayment((current) => ({
          ...current,
          status: 'failed',
          error: getApiErrorMessage(error, 'Unable to complete the QR payment.'),
        }));
      }
      return;
    }

    setQrPayment((current) => ({
      ...current,
      status: normalizedStatus === 'processing' ? 'processing' : normalizedStatus === 'failed' ? 'failed' : 'waiting',
    }));
  };

  const openQrPayment = async (paymentMethod) => {
    const orderId = generateOrderId();
    setQrPayment({
      ...qrPaymentInitialState,
      isVisible: true,
      isLoading: true,
      status: 'generating',
      orderId,
    });

    try {
      const initiationResult = await startPayment(orderId);
      const paymentQr = await getPaymentQr({
        orderId,
        amount: grandTotal,
      });
      const qrSource = getQrSource(paymentQr) || merchantPaymentProfile.qrImageUrl;
      if (!qrSource) throw new Error('The payment gateway did not return a valid QR code.');
      const transactionId = paymentQr.transactionId || initiationResult.transactionId;
      persistPaymentTransaction({
        transactionId,
        orderId,
        paymentMethod: 'UPI',
        paymentStatus: 'Pending',
        paymentGatewayStatus: 'QrGenerated',
        qrStatus: 'Generated',
        message: paymentQr.message || initiationResult.message || '',
      });

      setQrPayment((current) => ({
        ...current,
        isLoading: false,
        status: 'waiting',
        qrSource,
      }));

      qrStatusUnsubscribeRef.current?.();
      qrStatusUnsubscribeRef.current = watchPaymentStatus(
        transactionId,
        (statusResult) => handleQrPaymentStatus(
          statusResult?.status || statusResult?.paymentStatus,
          paymentMethod,
          orderId,
          transactionId
        ),
        (error) => setQrPayment((current) => ({
          ...current,
          error: getApiErrorMessage(error, 'Unable to refresh payment status.'),
        }))
      );
    } catch (err) {
      setQrPayment((current) => ({
        ...current,
        isLoading: false,
        status: 'failed',
        error: err.message || 'Unable to generate the secure payment QR.',
      }));
    }
  };

  useEffect(() => {
    if (loading || defaultQrInitializedRef.current || selectedPaymentMethod !== 'qr') return;
    defaultQrInitializedRef.current = true;
    openQrPayment('QR Payment');
    // The QR initializer should run once after checkout data loads; openQrPayment reads the current page state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedPaymentMethod]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (manualPaymentMethods.includes(selectedPaymentMethod)) {
      return;
    }

    if (selectedPaymentMethod === 'cod') {
      setIsPlacingOrder(true);
      setAddressError('');
      try {
        const preparedOrder = await createOrderForPayment('COD');
        const transaction = {
          orderId: preparedOrder.orderId,
          paymentMethod: 'COD',
          paymentStatus: t('paymentPending') || 'Payment Pending',
          paymentGatewayStatus: 'CashOnDelivery',
          paymentCompleted: false,
          message: 'Payment will be collected at delivery.',
        };
        persistPaymentTransaction(transaction);
        setIsPlacingOrder(false);
        await completeOrder('Cash on Delivery', preparedOrder.orderId, 'COD', transaction, preparedOrder.backendOrder);
      } catch (err) {
        setAddressError(getApiErrorMessage(err, 'Unable to place the cash on delivery order. Please try again.'));
        setIsPlacingOrder(false);
      }
      return;
    }

    if (!validateOnlinePayment()) return;

    const paymentMethod = onlinePaymentLabels[onlinePaymentType];

    if (selectedPaymentMethod === 'qr') {
      // QR is handled in polling, just wait for status or show info
      return;
    }

    setIsPlacingOrder(true);
    setAddressError('');
    try {
      const backendPaymentMethod = getBackendPaymentMethod('online', onlinePaymentType);
      const preparedOrder = await createOrderForPayment(backendPaymentMethod);
      const { orderId, backendOrder } = preparedOrder;
      const initiationResult = await startPayment(orderId, { backendOrder });
      const completionResult = await completePayment({ transactionId: initiationResult.transactionId });
      const statusResult = await getPaymentStatus(initiationResult.transactionId);
      const transaction = {
        transactionId: initiationResult.transactionId,
        paymentStatus: statusResult?.status || completionResult?.status || initiationResult.status || t('paid'),
        paymentGatewayStatus: statusResult?.status || completionResult?.status || initiationResult.status || 'Success',
        paymentCompleted: true,
        paymentMethod: getPaymentInitiationPayload(orderId).paymentMethod,
        orderId,
        message: statusResult?.message || completionResult?.message || initiationResult.message || '',
      };
      persistPaymentTransaction(transaction);
      setIsPlacingOrder(false);
      await completeOrder(paymentMethod, orderId, backendPaymentMethod, transaction, backendOrder);
    } catch (err) {
      setAddressError(getApiErrorMessage(err, 'Unable to process the payment. Please try again.'));
      setIsPlacingOrder(false);
    }
  };

  const copyUpiToClipboard = async () => {
    const upiId = merchantPaymentProfile.upiId;
    if (!upiId) return;

    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(upiId);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = upiId;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleManualVerificationChange = (event) => {
    const { name, value } = event.target;
    const sanitizedValue = name === 'mobileNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setManualVerification((current) => ({ ...current, [name]: sanitizedValue }));
    setManualVerificationErrors((current) => ({ ...current, [name]: '', api: '' }));
  };

  const setManualVerificationAttachment = (attachment) => {
    setManualVerificationAttachmentPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return attachment?.type?.startsWith('image/') ? URL.createObjectURL(attachment) : '';
    });
    setManualVerification((current) => ({ ...current, attachment }));
    setManualVerificationErrors((current) => ({ ...current, attachment: '', api: '' }));
  };

  const handleManualVerificationFileChange = (event) => {
    const attachment = event.target.files?.[0] || null;
    setManualVerificationAttachment(attachment);
  };

  const openCameraCapture = async () => {
    setCameraCaptureError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraCaptureError('Camera is not available in this browser.');
      setIsCameraCaptureOpen(true);
      return;
    }

    try {
      setIsCameraCaptureOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      cameraStreamRef.current = stream;

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
    } catch (err) {
      console.error('Unable to open camera.', err);
      stopCameraCapture();
      setCameraCaptureError('Unable to open camera. Please allow camera access and try again.');
    }
  };

  const closeCameraCapture = () => {
    stopCameraCapture();
    setIsCameraCaptureOpen(false);
    setCameraCaptureError('');
  };

  const confirmCameraCapture = () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraCaptureError('Camera is still loading. Please try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraCaptureError('Unable to capture photo. Please try again.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const attachment = new File([blob], `payment-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
      setManualVerificationAttachment(attachment);
      closeCameraCapture();
    }, 'image/jpeg', 0.92);
  };

  const resetManualVerification = () => {
    setManualVerification({
      ...manualVerificationInitialState,
      orderId: paymentTransaction?.orderId || qrPayment.orderId || generateOrderId(),
      amount: String(grandTotal || ''),
      customerName: `${formData.firstName} ${formData.lastName}`.trim(),
      mobileNumber: formData.phone || '',
    });
    setManualVerificationErrors({});
    setManualVerificationSubmission(null);
    setManualVerificationAttachmentPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return '';
    });
  };

  const getManualVerificationOrderId = () => {
    const formOrderId = manualVerification.orderId.trim();
    if (formOrderId) return formOrderId;

    const storedOrderId = paymentTransaction?.orderId || qrPayment.orderId;
    if (storedOrderId) return storedOrderId;

    const orderId = generateOrderId();
    persistPaymentTransaction({
      orderId,
      paymentStatus: 'Pending Verification',
      paymentMethod: manualVerificationMethodLabels[selectedPaymentMethod] || selectedPaymentLabel,
    });
    return orderId;
  };

  const submitManualVerification = async () => {
    if (
      !manualPaymentMethods.includes(selectedPaymentMethod) ||
      isSubmittingManualVerification ||
      manualVerificationRequestRef.current
    ) return;

    const validationErrors = validateManualVerification({
      values: manualVerification,
      orderAmount: grandTotal,
    });

    if (Object.keys(validationErrors).length > 0) {
      setManualVerificationErrors(validationErrors);
      return;
    }

    manualVerificationRequestRef.current = true;
    setIsSubmittingManualVerification(true);
    setManualVerificationErrors({});

    try {
      const orderId = getManualVerificationOrderId();
      const paymentMethod = manualVerificationMethodLabels[selectedPaymentMethod] || selectedPaymentLabel;
      const payload = {
        orderId,
        utrNumber: manualVerification.transactionId.trim(),
        amountPaid: Number(manualVerification.amount),
        paymentDate: manualVerification.paymentDate,
        paymentTime: manualVerification.paymentTime,
        customerName: manualVerification.customerName.trim(),
        mobileNumber: manualVerification.mobileNumber.trim(),
        remarks: manualVerification.remarks.trim(),
        screenshot: manualVerification.attachment,
      };

      const result = await submitManualPaymentVerification(payload);
      const submission = {
        referenceNumber:
          result?.referenceNumber ||
          result?.verificationId ||
          result?.id ||
          manualVerification.transactionId.trim(),
        submissionDate: new Date().toLocaleString(),
        status: result?.status || 'Pending Verification',
        paymentMethod,
        orderId,
        message: result?.message || 'Payment Verification Submitted Successfully',
      };

      persistPaymentTransaction({
        orderId,
        transactionId: manualVerification.transactionId.trim(),
        paymentStatus: submission.status,
        paymentMethod,
        message: 'Manual payment verification submitted.',
      });
      setManualVerificationSubmission(submission);
      await completeOrder(
        paymentMethod,
        orderId,
        getBackendPaymentMethod('online', onlinePaymentType),
        {
          orderId,
          transactionId: manualVerification.transactionId.trim(),
          paymentStatus: submission.status,
          paymentMethod,
          message: submission.message,
        }
      );
    } catch (err) {
      setManualVerificationErrors((current) => ({
        ...current,
        api: getApiErrorMessage(err, 'Unable to submit payment verification. Please retry.'),
      }));
    } finally {
      manualVerificationRequestRef.current = false;
      setIsSubmittingManualVerification(false);
    }
  };

  const goToTracking = () => {
    if (!placedOrder?.id) return;
    window.scrollTo(0, 0);
    navigate(`/track-order?orderId=${encodeURIComponent(placedOrder.id)}`);
  };

  const continueShopping = () => navigate('/products');

  const selectedPaymentLabel =
    paymentMethodOptions.find((option) => option.id === selectedPaymentMethod)?.label || 'QR Payment';

  const paymentOptionCards = [
    { id: 'upi', label: 'UPI', icon: 'fas fa-mobile-alt' },
    { id: 'qr', label: 'QR', icon: 'fas fa-qrcode' },
    { id: 'bankTransfer', label: 'Bank Transfer', icon: 'fas fa-university' },
    { id: 'cards', label: 'Debit / Credit Card', icon: 'fas fa-credit-card', method: 'debitCard' },
    { id: 'cod', label: 'Cash on Delivery', icon: 'fas fa-money-bill-wave' },
  ];

  const selectPaymentOptionCard = (option) => {
    if (option.app) setSelectedUpiApp(option.app);
    handlePaymentMethodTabChange(option.method || option.id);
  };
  const [creditExpiryMonth = '', creditExpiryYearShort = ''] = paymentDetails.expiryDate.split('/');
  const creditExpiryYear = creditExpiryYearShort ? `20${creditExpiryYearShort}` : '';
  const merchantUpiId = merchantPaymentProfile.upiId;

  if (loading) {
    return (
      <div className="payment-page-shell">
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#333333' }}></i>
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#666666' }}>Loading Checkout Details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page-shell">
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        <div className="payment-container-custom" style={{ maxWidth: '600px', textAlign: 'center', marginTop: '60px' }}>
          <div className="alert-error" style={{ marginBottom: '24px' }}>{error}</div>
          <button type="button" className="payment-secondary-btn" onClick={loadCheckoutSummary}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <OrderSuccessPage
        order={placedOrder}
        formatCurrency={formatCurrency}
        onTrackOrder={goToTracking}
        onContinueShopping={continueShopping}
      />
    );
  }

  return (
    <div className="payment-page-shell">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="payment-container-custom">
        {addressError && <div className="alert-error">{addressError}</div>}

        <div className="payment-gateway-card">
          <aside className="payment-info-panel">
            <div>
              <span className="payment-info-kicker">Secure Checkout</span>
              <h2>Payment Information</h2>
              <p>
                Complete your payment through a protected payment form. Your transaction details are encrypted
                and used only to confirm this order.
              </p>
            </div>

            <div className="payment-info-list">
              <div className="payment-info-item">
                <i className="fas fa-lock" aria-hidden="true"></i>
                <span>SSL secured payment session</span>
              </div>
              <div className="payment-info-item">
                <i className="fas fa-shield-alt" aria-hidden="true"></i>
                <span>Card and UPI details stay protected</span>
              </div>
            </div>

            <a className="payment-help-link" href="/contact-support">
              Need Help?
            </a>
          </aside>

          <section className="payment-form-panel">
            {(paymentConfigState.isLoading || paymentConfigState.error) && (
              <div className={`payment-config-banner ${paymentConfigState.error ? 'warning' : ''}`}>
                <i className={`fas ${paymentConfigState.isLoading ? 'fa-spinner fa-spin' : 'fa-info-circle'}`} aria-hidden="true"></i>
                <span>{paymentConfigState.isLoading ? 'Refreshing payment details from backend...' : paymentConfigState.error}</span>
                {paymentConfigState.error && (
                  <button type="button" onClick={loadPaymentConfiguration}>Retry</button>
                )}
              </div>
            )}
            <div className="payment-option-card-row" role="listbox" aria-label="Payment options">
              {paymentOptionCards.map((option) => {
                const isSelected =
                  (option.id === 'cards'
                    ? cardPaymentMethods.includes(selectedPaymentMethod)
                    : selectedPaymentMethod === (option.method || option.id)) &&
                  (!option.app || selectedUpiApp === option.app);

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`payment-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectPaymentOptionCard(option)}
                  >
                    <span className="payment-option-icon">
                      <i className={option.icon} aria-hidden="true"></i>
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="payment-content-pane">
              <form key={selectedPaymentMethod} className="payment-form-fade" onSubmit={handleSubmit} noValidate>
                {/* UPI CONTAINER */}
                {selectedPaymentMethod === 'upi' && (
                  <div className="manual-payment-pane">
                    <h3 className="payment-pane-heading">Pay using UPI</h3>
                    <div className="manual-payment-details">
                      <div className="manual-payment-detail-row">
                        <span>Merchant UPI ID</span>
                        <strong>{merchantPaymentProfile.upiId}</strong>
                      </div>
                      <div className="manual-payment-detail-row">
                        <span>Merchant Name</span>
                        <strong>{merchantPaymentProfile.name}</strong>
                      </div>
                      {merchantPaymentProfile.bankDisplayName && (
                        <div className="manual-payment-detail-row">
                          <span>Linked Bank</span>
                          <strong>{merchantPaymentProfile.bankDisplayName}</strong>
                        </div>
                      )}
                      <div className="manual-payment-detail-row">
                        <span>Currency</span>
                        <strong>{merchantPaymentProfile.currency}</strong>
                      </div>
                      <button type="button" className="copy-upi-btn" onClick={copyUpiToClipboard}>
                        {copiedUpi ? 'UPI ID Copied' : 'Copy UPI ID'}
                      </button>
                    </div>

                    <div className="payment-form-group">
                      <label>Supported Apps</label>
                      <div className="upi-apps-grid">
                        {[
                          { id: 'gpay', label: 'Google Pay' },
                          { id: 'phonepe', label: 'PhonePe' },
                          { id: 'paytm', label: 'Paytm' },
                          { id: 'bhim', label: 'BHIM' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            className={`upi-app-button ${selectedUpiApp === app.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedUpiApp(app.id);
                            }}
                          >
                            {app.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="manual-payment-instruction">
                      Complete the payment using your preferred UPI application.
                    </p>

                    <ManualVerificationForm
                      values={manualVerification}
                      errors={manualVerificationErrors}
                      isSubmitting={isSubmittingManualVerification}
                      submission={manualVerificationSubmission}
                      orderAmount={grandTotal}
                      attachmentPreview={manualVerificationAttachmentPreview}
                      cameraOpen={isCameraCaptureOpen}
                      cameraError={cameraCaptureError}
                      cameraVideoRef={cameraVideoRef}
                      cameraCanvasRef={cameraCanvasRef}
                      onChange={handleManualVerificationChange}
                      onFileChange={handleManualVerificationFileChange}
                      onOpenCamera={openCameraCapture}
                      onCloseCamera={closeCameraCapture}
                      onConfirmCapture={confirmCameraCapture}
                      onSubmit={submitManualVerification}
                      onReset={resetManualVerification}
                    />
                  </div>
                )}

                {/* BANK TRANSFER CONTAINER */}
                {selectedPaymentMethod === 'bankTransfer' && (
                  <div className="manual-payment-pane">
                    <h3 className="payment-pane-heading">Bank Transfer</h3>

                    <div className="manual-payment-details bank-details">
                      <div className="manual-payment-detail-row">
                        <span>Account Holder Name</span>
                        <strong>{merchantPaymentProfile.bankAccountHolder}</strong>
                      </div>
                      <div className="manual-payment-detail-row">
                        <span>Bank Name</span>
                        <strong>{merchantPaymentProfile.bankName}</strong>
                      </div>
                      <div className="manual-payment-detail-row">
                        <span>Account Number</span>
                        <strong>{merchantPaymentProfile.accountNumber}</strong>
                      </div>
                      <div className="manual-payment-detail-row">
                        <span>IFSC Code</span>
                        <strong>{merchantPaymentProfile.ifscCode}</strong>
                      </div>
                      <div className="manual-payment-detail-row">
                        <span>Branch</span>
                        <strong>{merchantPaymentProfile.branch}</strong>
                      </div>
                    </div>

                    <p className="manual-payment-instruction">
                      Transfer the amount using NEFT / IMPS / RTGS.
                    </p>

                    <ManualVerificationForm
                      values={manualVerification}
                      errors={manualVerificationErrors}
                      isSubmitting={isSubmittingManualVerification}
                      submission={manualVerificationSubmission}
                      orderAmount={grandTotal}
                      attachmentPreview={manualVerificationAttachmentPreview}
                      cameraOpen={isCameraCaptureOpen}
                      cameraError={cameraCaptureError}
                      cameraVideoRef={cameraVideoRef}
                      cameraCanvasRef={cameraCanvasRef}
                      onChange={handleManualVerificationChange}
                      onFileChange={handleManualVerificationFileChange}
                      onOpenCamera={openCameraCapture}
                      onCloseCamera={closeCameraCapture}
                      onConfirmCapture={confirmCameraCapture}
                      onSubmit={submitManualVerification}
                      onReset={resetManualVerification}
                    />
                  </div>
                )}

                {/* DEBIT CARD CONTAINER */}
                {selectedPaymentMethod === 'debitCard' && (
                  <div className="card-payment-pane">
                    <h3 className="payment-pane-heading">Pay using Debit / Credit Card</h3>
                    <div className="payment-unavailable-note">Card payments are currently unavailable.</div>
                    <div className="payment-form-group">
                      <label>Card Holder Name *</label>
                      <input
                        type="text"
                        name="cardName"
                        className="payment-input"
                        value={paymentDetails.cardName}
                        onChange={handlePaymentDetailChange}
                        placeholder="Enter name on card"
                        disabled
                      />
                      {paymentErrors.cardName && <span className="field-error-msg">{paymentErrors.cardName}</span>}
                    </div>

                    <div className="payment-form-group">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className="payment-input"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentDetailChange}
                        placeholder="1234567890123456"
                        maxLength="16"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        disabled
                      />
                      {paymentErrors.cardNumber && <span className="field-error-msg">{paymentErrors.cardNumber}</span>}
                    </div>

                    <div className="payment-form-row">
                      <div className="payment-form-group">
                        <label>Expiry Month *</label>
                        <select
                          name="expiryMonth"
                          className="payment-input"
                          value={debitCardDetails.expiryMonth}
                          onChange={handleDebitCardDetailChange}
                          disabled
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="payment-form-group">
                        <label>Expiry Year *</label>
                        <select
                          name="expiryYear"
                          className="payment-input"
                          value={debitCardDetails.expiryYear}
                          onChange={handleDebitCardDetailChange}
                          disabled
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {paymentErrors.expiryDate && (
                      <div className="payment-form-group" style={{ marginTop: '-12px', marginBottom: '16px' }}>
                        <span className="field-error-msg">{paymentErrors.expiryDate}</span>
                      </div>
                    )}

                    <div className="payment-form-row">
                      <div className="payment-form-group">
                        <label>CVV *</label>
                        <input
                          type="password"
                          name="cvv"
                          className="payment-input"
                          value={paymentDetails.cvv}
                          onChange={handlePaymentDetailChange}
                          placeholder="123"
                          maxLength="3"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          disabled
                        />
                        {paymentErrors.cvv && <span className="field-error-msg">{paymentErrors.cvv}</span>}
                      </div>
                    </div>

                    <div className="payment-form-group">
                      <label className="payment-checkbox-group">
                        <input
                          type="checkbox"
                          name="saveCard"
                          checked={debitCardDetails.saveCard}
                          onChange={handleDebitCardDetailChange}
                          disabled
                        />
                        <span className="payment-checkbox-label">Save this card</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="payment-primary-btn"
                      disabled
                    >
                      Pay {formatCurrency(grandTotal)}
                    </button>
                  </div>
                )}

                {/* CREDIT CARD CONTAINER */}
                {selectedPaymentMethod === 'creditCard' && (
                  <div className="card-payment-pane">
                    <h3 className="payment-pane-heading">Pay using Credit Card</h3>
                    <div className="payment-unavailable-note">Card payments are currently unavailable.</div>
                    <div className="payment-form-group">
                      <label>Card Holder Name *</label>
                      <input
                        type="text"
                        name="cardName"
                        className="payment-input"
                        value={paymentDetails.cardName}
                        onChange={handlePaymentDetailChange}
                        placeholder="Enter name on card"
                        disabled
                      />
                      {paymentErrors.cardName && <span className="field-error-msg">{paymentErrors.cardName}</span>}
                    </div>

                    <div className="payment-form-group">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className="payment-input"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentDetailChange}
                        placeholder="1234567890123456"
                        maxLength="16"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        disabled
                      />
                      {paymentErrors.cardNumber && <span className="field-error-msg">{paymentErrors.cardNumber}</span>}
                    </div>

                    <div className="payment-form-row">
                      <div className="payment-form-group">
                        <label>Expiry Month *</label>
                        <select
                          className="payment-input"
                          value={creditExpiryMonth}
                          onChange={(event) => {
                            const month = event.target.value;
                            const year = creditExpiryYearShort;
                            setPaymentDetails((current) => ({ ...current, expiryDate: year ? `${month}/${year}` : month }));
                            setPaymentErrors((current) => ({ ...current, expiryDate: '' }));
                          }}
                          disabled
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="payment-form-group">
                        <label>Expiry Year *</label>
                        <select
                          className="payment-input"
                          value={creditExpiryYear}
                          onChange={(event) => {
                            const year = event.target.value.slice(-2);
                            const month = creditExpiryMonth;
                            setPaymentDetails((current) => ({ ...current, expiryDate: month ? `${month}/${year}` : '' }));
                            setPaymentErrors((current) => ({ ...current, expiryDate: '' }));
                          }}
                          disabled
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {paymentErrors.expiryDate && (
                      <div className="payment-form-group" style={{ marginTop: '-12px', marginBottom: '16px' }}>
                        <span className="field-error-msg">{paymentErrors.expiryDate}</span>
                      </div>
                    )}

                    <div className="payment-form-row payment-form-row-compact">
                      <div className="payment-form-group">
                        <label>CVV *</label>
                        <input
                          type="password"
                          name="cvv"
                          className="payment-input"
                          value={paymentDetails.cvv}
                          onChange={handlePaymentDetailChange}
                          placeholder="123"
                          maxLength="3"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          disabled
                        />
                        {paymentErrors.cvv && <span className="field-error-msg">{paymentErrors.cvv}</span>}
                      </div>
                    </div>

                    <div className="payment-form-group">
                      <label>Billing Address *</label>
                      <textarea
                        name="billingAddress"
                        className="payment-input"
                        style={{ height: '88px', resize: 'vertical' }}
                        value={creditCardDetails.billingAddress}
                        onChange={handleCreditCardDetailChange}
                        placeholder="Enter billing address"
                        disabled
                      />
                      {paymentErrors.billingAddress && <span className="field-error-msg">{paymentErrors.billingAddress}</span>}
                    </div>

                    <div className="payment-form-group">
                      <label className="payment-checkbox-group">
                        <input
                          type="checkbox"
                          name="saveCard"
                          checked={creditCardDetails.saveCard}
                          onChange={handleCreditCardDetailChange}
                          disabled
                        />
                        <span className="payment-checkbox-label">Save Card</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="payment-primary-btn"
                      disabled
                    >
                      Pay {formatCurrency(grandTotal)}
                    </button>
                  </div>
                )}

                {selectedPaymentMethod === 'cod' && (
                  <div className="cod-payment-pane">
                    <div className="cod-payment-card">
                      <span className="cod-payment-icon">
                        <i className="fas fa-money-bill-wave" aria-hidden="true"></i>
                      </span>
                      <div>
                        <strong>Cash on Delivery</strong>
                        <p>Pay in cash when your order is delivered to your address.</p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="payment-primary-btn"
                      disabled={isPlacingOrder}
                    >
                      {isPlacingOrder ? 'Placing Order...' : `Place COD Order ${formatCurrency(grandTotal)}`}
                    </button>
                  </div>
                )}

                {/* QR PAYMENT CONTAINER */}
                {selectedPaymentMethod === 'qr' && (
                  <div className="qr-container-box">
                    <h3 className="payment-pane-heading" style={{ width: '100%' }}>Scan QR Code</h3>
                    
                    <div className="qr-image-wrapper">
                      {qrPayment.isLoading ? (
                        <div className="qr-placeholder">
                          <i className="fas fa-spinner fa-spin qr-placeholder-icon"></i>
                          <span>Generating Secure QR...</span>
                        </div>
                      ) : qrPayment.qrSource || merchantPaymentProfile.qrImageUrl ? (
                        <img src={qrPayment.qrSource || merchantPaymentProfile.qrImageUrl} alt="Payment QR Code" />
                      ) : qrPayment.error ? (
                        <div className="qr-placeholder" style={{ color: '#D32F2F' }}>
                          <i className="fas fa-exclamation-circle qr-placeholder-icon"></i>
                          <span>{qrPayment.error}</span>
                        </div>
                      ) : (
                        <div className="qr-placeholder">
                          <i className="fas fa-qrcode qr-placeholder-icon"></i>
                          <span>Secure QR will appear here</span>
                        </div>
                      )}
                    </div>

                    <div className="qr-details">
                      <div className="qr-detail-row">
                        <span className="qr-detail-label">Merchant Name</span>
                        <span className="qr-detail-value">{merchantPaymentProfile.name}</span>
                      </div>

                      <div className="qr-detail-row">
                        <span className="qr-detail-label">Merchant UPI ID</span>
                        <span className="qr-detail-value">{merchantUpiId}</span>
                      </div>

                      <div className="qr-detail-row">
                        <span className="qr-detail-label">Amount</span>
                        <span className="qr-detail-value" style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(grandTotal)}</span>
                      </div>
                      {merchantPaymentProfile.qrUpdatedAt && (
                        <div className="qr-detail-row">
                          <span className="qr-detail-label">QR Updated</span>
                          <span className="qr-detail-value">{new Date(merchantPaymentProfile.qrUpdatedAt).toLocaleString()}</span>
                        </div>
                      )}

                      <button type="button" className="copy-upi-btn" onClick={copyUpiToClipboard}>
                        {copiedUpi ? 'UPI ID Copied' : 'Copy UPI ID'}
                      </button>
                    </div>

                    <p className="manual-payment-instruction">
                      Scan the QR code using any UPI application and complete the payment.
                    </p>

                    <ManualVerificationForm
                      values={manualVerification}
                      errors={manualVerificationErrors}
                      isSubmitting={isSubmittingManualVerification}
                      submission={manualVerificationSubmission}
                      orderAmount={grandTotal}
                      attachmentPreview={manualVerificationAttachmentPreview}
                      cameraOpen={isCameraCaptureOpen}
                      cameraError={cameraCaptureError}
                      cameraVideoRef={cameraVideoRef}
                      cameraCanvasRef={cameraCanvasRef}
                      onChange={handleManualVerificationChange}
                      onFileChange={handleManualVerificationFileChange}
                      onOpenCamera={openCameraCapture}
                      onCloseCamera={closeCameraCapture}
                      onConfirmCapture={confirmCameraCapture}
                      onSubmit={submitManualVerification}
                      onReset={resetManualVerification}
                    />
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

    </div>
  );
};

export default PaymentPage;
