import React, { useEffect, useState } from 'react';

const createInitialForm = (issueType = 'Product Issue') => ({
  name: '',
  email: '',
  mobile: '',
  issueType,
  subject: '',
  message: '',
});

const issueTypes = [
  'Product Issue',
  'Cart/Wishlist Issue',
  'Payment Issue',
  'Delivery Issue',
  'Return/Refund Issue',
  'Technical Issue',
  'Other',
];

const TicketForm = ({ labels, defaultIssueType = 'Product Issue', onSubmit, onCancel }) => {
  const [form, setForm] = useState(() => createInitialForm(defaultIssueType));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm((current) => ({ ...current, issueType: defaultIssueType }));
  }, [defaultIssueType]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = labels.ticketErrors?.name || 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = labels.ticketErrors?.email || 'Enter a valid email.';
    }
    if (!/^[0-9+\-\s]{8,15}$/.test(form.mobile)) {
      nextErrors.mobile = labels.ticketErrors?.mobile || 'Enter a valid mobile number.';
    }
    if (!form.subject.trim()) nextErrors.subject = labels.ticketErrors?.subject || 'Subject is required.';
    if (form.message.trim().length < 12) {
      nextErrors.message = labels.ticketErrors?.message || 'Please explain the issue clearly.';
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(form);
    setForm(createInitialForm(defaultIssueType));
  };

  return (
    <form className="support-ticket-form" onSubmit={handleSubmit}>
      <div className="support-ticket-form-head">
        <strong>{labels.raiseTicket}</strong>
        <span>{labels.ticketIntro}</span>
      </div>

      <label>
        <span>{labels.name}</span>
        <input name="name" value={form.name} onChange={updateField} autoComplete="name" />
        {errors.name && <small>{errors.name}</small>}
      </label>

      <label>
        <span>{labels.email}</span>
        <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" />
        {errors.email && <small>{errors.email}</small>}
      </label>

      <label>
        <span>{labels.mobile}</span>
        <input name="mobile" value={form.mobile} onChange={updateField} autoComplete="tel" />
        {errors.mobile && <small>{errors.mobile}</small>}
      </label>

      <label>
        <span>{labels.issueType}</span>
        <select name="issueType" value={form.issueType} onChange={updateField}>
          {issueTypes.map((issueType) => (
            <option key={issueType} value={issueType}>
              {labels.issueTypeLabels?.[issueType] || issueType}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{labels.subject}</span>
        <input name="subject" value={form.subject} onChange={updateField} />
        {errors.subject && <small>{errors.subject}</small>}
      </label>

      <label>
        <span>{labels.message}</span>
        <textarea name="message" value={form.message} onChange={updateField} rows="4" />
        {errors.message && <small>{errors.message}</small>}
      </label>

      <div className="support-ticket-actions">
        <button type="button" className="support-ticket-secondary" onClick={onCancel}>
          {labels.cancel}
        </button>
        <button type="submit" className="support-ticket-primary">
          {labels.submitTicket}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
