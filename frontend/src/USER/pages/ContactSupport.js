import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Mail, MessageSquareText, Phone, Send } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSupportConfig, submitSupportTicket } from '../../services/supportService';
import './ContactSupport.css';

const SUPPORT_TICKETS_STORAGE_KEY = 'shyamAgro:supportTickets';

const defaultSupportConfig = {
  supportPhoneNumber: '+91 9398649798',
  supportEmail: 'support@shyamagrotools.com',
  workTimings: 'Mon-Sat: 10AM - 7PM',
};

const getQueryValue = (search, key) => new URLSearchParams(search).get(key) || '';

const createTicketId = () => `SAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

const readStoredTickets = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ContactSupport = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [supportConfig, setSupportConfig] = useState(defaultSupportConfig);
  const [tickets, setTickets] = useState(() => readStoredTickets());
  const [formStatus, setFormStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState(() => ({
    name: '',
    phone: '',
    email: '',
    issueType: getQueryValue(window.location.search, 'issue') || 'Order issue',
    message: '',
    orderId: getQueryValue(window.location.search, 'orderId') || '',
  }));

  const issueTypes = useMemo(() => [
    { value: 'Order issue', label: t('supportChat.issueTypes.cartWishlist') || 'Order issue' },
    { value: 'Payment issue', label: t('supportChat.issueTypes.payment') || 'Payment issue' },
    { value: 'Return issue', label: t('supportChat.issueTypes.returnRefund') || 'Return issue' },
    { value: 'Product issue', label: t('supportChat.issueTypes.product') || 'Product issue' },
    { value: 'General support', label: t('supportChat.issueTypes.other') || 'General support' },
  ], [t]);

  const contactRows = useMemo(() => [
    { icon: Phone, label: t('supportChat.mobile') || 'Phone', value: supportConfig.supportPhoneNumber || defaultSupportConfig.supportPhoneNumber, href: `tel:${supportConfig.supportPhoneNumber || defaultSupportConfig.supportPhoneNumber}` },
    { icon: Mail, label: t('supportChat.email') || 'Email', value: supportConfig.supportEmail || defaultSupportConfig.supportEmail, href: `mailto:${supportConfig.supportEmail || defaultSupportConfig.supportEmail}` },
    { icon: CheckCircle2, label: t('estimatedDelivery') || 'Availability', value: supportConfig.workTimings || defaultSupportConfig.workTimings },
  ], [supportConfig, t]);

  useEffect(() => {
    getSupportConfig().then((config) => {
      setSupportConfig({ ...defaultSupportConfig, ...config });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setTicketForm((current) => ({
      ...current,
      name: current.name || user.name || user.fullName || '',
      phone: current.phone || user.phone || user.mobileNumber || user.MobileNumber || '',
      email: current.email || user.email || user.Email || '',
    }));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  const updateTicketField = (field, value) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setTicketForm((current) => ({ ...current, [field]: nextValue }));
    setFormStatus('');
  };

  const validateTicket = () => {
    if (!ticketForm.name.trim()) return t('supportChat.validation.nameRequired') || 'Name is required.';
    if (!/^\d{10}$/.test(ticketForm.phone.trim())) return t('supportChat.validation.mobileInvalid') || 'Enter a valid 10-digit phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticketForm.email.trim())) return t('supportChat.validation.emailInvalid') || 'Enter a valid email address.';
    if (!ticketForm.message.trim() || ticketForm.message.trim().length < 12) return t('supportChat.validation.messageRequired') || 'Please explain the issue clearly.';
    return '';
  };

  const handleTicketSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateTicket();
    if (validationError) {
      setFormStatus(validationError);
      return;
    }

    setIsSubmitting(true);
    const ticket = {
      ...ticketForm,
      id: createTicketId(),
      createdAt: new Date().toISOString(),
      status: 'Submitted',
    };

    try {
      const response = await submitSupportTicket(ticket);
      const savedTicket = {
        ...ticket,
        serverId: response.id || response.ticketId || response.referenceId || '',
        status: 'Submitted',
      };
      setTickets((current) => [savedTicket, ...current]);
      
      const successTemplate = t('supportChat.ticketSuccessWithId') || 'Ticket {{ticketId}} submitted successfully.';
      setFormStatus(successTemplate.replace('{{ticketId}}', savedTicket.serverId || savedTicket.id));
      setTicketForm((current) => ({ ...current, message: '', orderId: '' }));
    } catch (error) {
      const savedTicket = { ...ticket, status: 'Pending sync', error: error.message };
      setTickets((current) => [savedTicket, ...current]);
      setFormStatus(`Failed to submit ticket: ${error.message || 'Server Unreachable'}. The backend server appears to be offline. Your ticket has been saved locally.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-support-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="support-page-container">
        <section className="support-header">
          <span>{t('contactUs') || 'Contact Support'}</span>
          <h1>{t('supportChat.title') || 'Customer Support'}</h1>
          <p>{t('supportChat.subtitle') || 'Raise support tickets for orders, payments, returns, products, or general help and track the submitted details here.'}</p>
        </section>

        <section className="support-layout">
          <div className="support-main-column">
            <form className="support-ticket-panel" onSubmit={handleTicketSubmit}>
              <div className="support-section-title">
                <ClipboardList size={22} />
                <div>
                  <span>{t('supportChat.raiseTicket') || 'Submit Ticket'}</span>
                  <h2>{t('supportChat.ticketIntro') || 'Tell us what went wrong'}</h2>
                </div>
              </div>

              <div className="support-form-grid">
                <label>
                  <span>{t('supportChat.name') || 'Name'} *</span>
                  <input value={ticketForm.name} onChange={(event) => updateTicketField('name', event.target.value)} autoComplete="name" />
                </label>
                <label>
                  <span>{t('supportChat.mobile') || 'Phone'} *</span>
                  <input value={ticketForm.phone} onChange={(event) => updateTicketField('phone', event.target.value)} autoComplete="tel" />
                </label>
                <label>
                  <span>{t('supportChat.email') || 'Email'} *</span>
                  <input type="email" value={ticketForm.email} onChange={(event) => updateTicketField('email', event.target.value)} autoComplete="email" />
                </label>
                <label>
                  <span>{t('supportChat.issueType') || 'Issue type'} *</span>
                  <select value={ticketForm.issueType} onChange={(event) => updateTicketField('issueType', event.target.value)}>
                    {issueTypes.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>{t('supportChat.orderIdOptional') || 'Order ID optional'}</span>
                  <input value={ticketForm.orderId} onChange={(event) => updateTicketField('orderId', event.target.value)} placeholder="Example: ORD-1024" />
                </label>
                <label className="support-message-field">
                  <span>{t('supportChat.description') || 'Message'} *</span>
                  <textarea value={ticketForm.message} onChange={(event) => updateTicketField('message', event.target.value)} rows="5" placeholder={t('reviewMessagePlaceholder') || 'Describe the issue...'} />
                </label>
              </div>

              {formStatus && <p className={`support-form-status ${formStatus.includes('successfully') || formStatus.includes('విజయవంతంగా') || formStatus.includes('सफलतापूर्वक') ? 'success' : ''}`}>{formStatus}</p>}
              <button type="submit" className="support-submit-btn" disabled={isSubmitting}>
                <Send size={17} /> {isSubmitting ? `${t('supportChat.send') || 'Submitting'}...` : t('supportChat.submitTicket') || 'Submit ticket'}
              </button>
            </form>

            <section className="submitted-tickets-panel" aria-label="Submitted support tickets">
              <div className="support-section-title">
                <MessageSquareText size={22} />
                <div>
                  <span>{t('supportChat.latestTracking') || 'Dynamic Data'}</span>
                  <h2>{t('myOrders') || 'Submitted Tickets'}</h2>
                </div>
              </div>
              {tickets.length === 0 ? (
                <div className="support-empty-state">{t('supportChat.fallback') || 'No tickets submitted yet. Your latest ticket details will appear here after submission.'}</div>
              ) : (
                <div className="support-ticket-list">
                  {tickets.map((ticket) => (
                    <article key={ticket.id} className="support-ticket-card">
                      <div className="support-ticket-card-head">
                        <strong>{ticket.serverId || ticket.id}</strong>
                        <span>{ticket.status}</span>
                      </div>
                      <div className="support-ticket-data-grid">
                        <p><span>{t('supportChat.name') || 'Name'}</span>{ticket.name}</p>
                        <p><span>{t('supportChat.mobile') || 'Phone'}</span>{ticket.phone}</p>
                        <p><span>{t('supportChat.email') || 'Email'}</span>{ticket.email}</p>
                        <p><span>{t('supportChat.issueType') || 'Issue'}</span>{ticket.issueType}</p>
                        <p><span>{t('supportChat.orderIdOptional') || 'Order ID'}</span>{ticket.orderId || 'Not provided'}</p>
                        <p><span>{t('estimatedDelivery') || 'Created'}</span>{new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                      <p className="support-ticket-message">{ticket.message}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>

          <aside className="contact-sidebar">
            <div className="support-contact-card">
              <h3>{t('getInTouch') || 'Contact Details'}</h3>
              {contactRows.map((row) => {
                const Icon = row.icon;
                const content = (
                  <>
                    <Icon size={18} />
                    <span><small>{row.label}</small>{row.value}</span>
                  </>
                );
                return row.href ? <a key={row.label} href={row.href}>{content}</a> : <p key={row.label}>{content}</p>;
              })}
            </div>
          </aside>
        </section>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default ContactSupport;
