import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useCategories } from '../context/CategoryContext';
import { useToast } from '../context/ToastContext';
import { registerSupplier } from '../../services/supplierService';
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
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const { mappedCategories, categoriesLoading, categoriesError } = useCategories();
  const { showToast } = useToast();

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
    try {
      const response = await registerSupplier(formData);
      const nextReference = getSupplierReference(response);
      setReferenceNumber(nextReference);
      showToast('Supplier registration submitted successfully.');
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      showToast(error.message || 'Unable to submit supplier registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (field) => (
    errors[field] ? <small className="validation-error">{errors[field]}</small> : null
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="seller-page-container">
        <div className="seller-hero">
          <h1>Grow Your Business with Shyam Agro</h1>
          <p>Register your supplier details and submit them directly for review.</p>
        </div>

        <div className="seller-content seller-content-simple">
          <div className="form-card">
            <div className="seller-section-title">
              <h2>Supplier Registration</h2>
            </div>

            {referenceNumber && (
              <div className="seller-id-box">
                <span>Your Reference Number</span>
                <strong>{referenceNumber}</strong>
              </div>
            )}

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
          </div>
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default BecomeSeller;
