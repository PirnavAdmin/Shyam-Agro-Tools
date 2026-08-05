import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useCategories } from '../context/CategoryContext';
import { useToast } from '../context/ToastContext';
import { registerSupplier, getSupplierById } from '../../services/supplierService';
import './BecomeSeller.css';

const initialFormData = {
  contactPerson: '',
  companyName: '',
  productCategory: '',
  mobileNumber: '',
  emailAddress: '',
  gstNumber: '',
  address: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

const getSupplierReference = (response) => {
  if (!response) return '';
  if (typeof response === 'string') return response;
  const data = response.data || response;
  return String(
    data.trackingId ||
    data.referenceNumber ||
    data.referenceNo ||
    data.supplierId ||
    data.id ||
    ''
  );
};

const BecomeSeller = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [registeredBusinessName, setRegisteredBusinessName] = useState('');
  const { mappedCategories, categoriesLoading, categoriesError } = useCategories();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'track'
  const [lookupId, setLookupId] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  const categoryOptions = useMemo(
    () => mappedCategories.map((category) => ({ id: category.id, name: category.name })),
    [mappedCategories]
  );

  const updateField = (field, value) => {
    let nextValue = value;
    if (field === 'mobileNumber') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (field === 'gstNumber') nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setFormData((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.contactPerson.trim()) nextErrors.contactPerson = 'Full Name is required.';
    if (!formData.companyName.trim()) nextErrors.companyName = 'Business / Shop Name is required.';
    if (!formData.productCategory) nextErrors.productCategory = 'Product Category is required.';
    if (!/^\d{10}$/.test(formData.mobileNumber)) nextErrors.mobileNumber = 'Mobile Number must be exactly 10 digits.';
    if (!formData.emailAddress.trim()) nextErrors.emailAddress = 'Email Address is required.';
    else if (!emailRegex.test(formData.emailAddress.trim())) nextErrors.emailAddress = 'Enter a valid email address.';
    if (formData.gstNumber && !gstRegex.test(formData.gstNumber)) nextErrors.gstNumber = 'Enter a valid GSTIN number.';
    if (!formData.address.trim()) nextErrors.address = 'Business Address is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setReferenceNumber('');
    const currentBusinessName = formData.companyName;
    try {
      const response = await registerSupplier(formData);
      const nextReference = getSupplierReference(response);
      setReferenceNumber(nextReference);
      setRegisteredBusinessName(currentBusinessName);
      showToast('Supplier registration submitted successfully.');
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      showToast(error.message || 'Unable to submit supplier registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackLookup = async (event) => {
    event.preventDefault();
    const id = lookupId.trim();
    if (!id) return;

    setIsLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const data = await getSupplierById(id);
      if (data) {
        setLookupResult(data);
      } else {
        setLookupError('Reference ID not found.');
      }
    } catch (error) {
      setLookupError('Reference ID not found.');
    } finally {
      setIsLookupLoading(false);
    }
  };

  const renderError = (field) => (
    errors[field] ? <small className="validation-error">{errors[field]}</small> : null
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="seller-page-container relative">
        <div className="seller-hero">
          <h1>Grow Your Business with Shyam Agro</h1>
          <p>Register your supplier details and track your application status.</p>
        </div>

        <div className="seller-content seller-content-simple">
          <div className="form-card relative">
            <button 
              onClick={() => navigate('/')}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
              title="Close"
            >
              <X size={24} />
            </button>
            
            {/* Elegant Tabs Selector */}
            <div className="flex border-b border-gray-200 mb-6 justify-center gap-6">
              <button
                type="button"
                className={`pb-2.5 font-bold text-sm transition-colors border-b-2 uppercase tracking-wider ${
                  activeTab === 'register' ? 'border-[#28a745] text-[#28a745]' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => { setActiveTab('register'); setReferenceNumber(''); }}
              >
                Register as Seller
              </button>
              <button
                type="button"
                className={`pb-2.5 font-bold text-sm transition-colors border-b-2 uppercase tracking-wider ${
                  activeTab === 'track' ? 'border-[#28a745] text-[#28a745]' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => { setActiveTab('track'); setLookupResult(null); setLookupError(''); }}
              >
                Track Application
              </button>
            </div>

            {activeTab === 'register' ? (
              <>
                <div className="seller-section-title">
                  <h2>Supplier Registration</h2>
                </div>

                {referenceNumber ? (
                  <div className="seller-id-box text-center bg-green-50/50 border border-green-200 p-6 rounded-xl my-6">
                    <h3 className="text-lg font-bold text-green-700 mb-2">Application Submitted Successfully</h3>
                    <p className="text-gray-600 mb-4 text-xs">Please save your reference number to track your application status.</p>
                    
                    <div className="bg-white py-4 px-6 rounded-lg inline-block border border-green-100 shadow-sm mb-4">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold mb-1">Your Reference Number</span>
                      <strong className="text-2xl text-green-600 font-extrabold select-all">{referenceNumber}</strong>
                    </div>
                    
                    <div className="max-w-md mx-auto bg-white p-4 rounded-lg border border-slate-100 text-left space-y-2 mt-2">
                      <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Business Name:</span><strong className="text-gray-800">{registeredBusinessName}</strong></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Verification Stage:</span><strong className="text-amber-600 uppercase font-bold">Pending Review</strong></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Submission Date:</span><strong className="text-gray-800">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="seller-form" noValidate>
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Full Name *</label>
                        <input
                          value={formData.contactPerson}
                          className={errors.contactPerson ? 'input-error' : ''}
                          onChange={(event) => updateField('contactPerson', event.target.value)}
                        />
                        {renderError('contactPerson')}
                      </div>

                      <div className="input-group">
                        <label>Business / Shop Name *</label>
                        <input
                          value={formData.companyName}
                          className={errors.companyName ? 'input-error' : ''}
                          onChange={(event) => updateField('companyName', event.target.value)}
                        />
                        {renderError('companyName')}
                      </div>

                      <div className="input-group">
                        <label>Product Category *</label>
                        <select
                          value={formData.productCategory}
                          className={errors.productCategory ? 'input-error' : ''}
                          onChange={(event) => updateField('productCategory', event.target.value)}
                        >
                          <option value="">{categoriesLoading ? 'Categories Loading...' : 'Select Category'}</option>
                          {categoryOptions.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                        {categoriesError && <small>Failed to load categories</small>}
                        {renderError('productCategory')}
                      </div>

                      <div className="input-group">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={formData.mobileNumber}
                          className={errors.mobileNumber ? 'input-error' : ''}
                          onChange={(event) => updateField('mobileNumber', event.target.value)}
                        />
                        {renderError('mobileNumber')}
                      </div>

                      <div className="input-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.emailAddress}
                          className={errors.emailAddress ? 'input-error' : ''}
                          onChange={(event) => updateField('emailAddress', event.target.value)}
                        />
                        {renderError('emailAddress')}
                      </div>

                      <div className="input-group">
                        <label>GSTIN Number</label>
                        <input
                          value={formData.gstNumber}
                          className={errors.gstNumber ? 'input-error' : ''}
                          onChange={(event) => updateField('gstNumber', event.target.value)}
                        />
                        {renderError('gstNumber')}
                      </div>
                    </div>

                    <div className="input-group full-width">
                      <label>Business Address *</label>
                      <textarea
                        value={formData.address}
                        className={errors.address ? 'input-error' : ''}
                        onChange={(event) => updateField('address', event.target.value)}
                      />
                      {renderError('address')}
                    </div>

                    <button type="submit" className="submit-seller-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Register as Supplier'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="track-lookup-form max-w-md mx-auto py-4">
                <div className="seller-section-title text-center block mb-4">
                  <h2 className="inline-block border-l-0 pl-0">Track Application Status</h2>
                  <p className="text-gray-500 text-xs mt-1">Enter your reference number below to check the real-time stage of your seller request.</p>
                </div>
                
                <form onSubmit={handleTrackLookup} className="flex gap-2 mb-6" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter Reference ID (e.g. 1007)"
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '2px solid #f3bd78',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fffdf8 0%, #fff0dc 100%)',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                    required
                  />
                  <button
                    type="submit"
                    className="submit-seller-btn"
                    style={{
                      margin: 0,
                      width: 'auto',
                      padding: '10px 24px',
                      background: '#28a745',
                      borderRadius: '12px'
                    }}
                    disabled={isLookupLoading}
                  >
                    {isLookupLoading ? 'Checking...' : 'Track'}
                  </button>
                </form>
                
                {lookupError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-center mb-4 font-semibold">
                    {lookupError}
                  </div>
                )}
                
                {lookupResult && (
                  <div className="bg-emerald-50/30 border border-emerald-200 p-6 rounded-xl space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Application Reference</span>
                      <strong className="text-lg text-slate-700">#{lookupResult.id}</strong>
                    </div>
                    
                    <div className="space-y-2.5 bg-white p-4 rounded-lg border border-slate-100 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Business Name:</span><strong className="text-slate-800">{lookupResult.name || lookupResult.businessName}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Contact Person:</span><strong className="text-slate-800">{lookupResult.contactPerson}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Category:</span><strong className="text-slate-700">{lookupResult.productCategory || lookupResult.category}</strong></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Verification Stage:</span>
                        <strong className={`uppercase text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                          lookupResult.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          lookupResult.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {lookupResult.status || 'Pending Review'}
                        </strong>
                      </div>
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Submission Date:</span>
                        <strong className="text-slate-800">
                          {new Date(lookupResult.submittedAt || lookupResult.createdAt || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default BecomeSeller;
