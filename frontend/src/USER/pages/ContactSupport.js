import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList, Mail, MessageSquareText, Phone, Send } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { getSupportConfig, sendSupportBotMessage, submitSupportTicket } from '../../services/supportService';
import './ContactSupport.css';

const SUPPORT_TICKETS_STORAGE_KEY = 'shyamAgro:supportTickets';

const issueTypes = [
  'Order issue',
  'Payment issue',
  'Return issue',
  'Product issue',
  'General support',
];

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
  const [messages, setMessages] = useState([
    { text: 'Hello! I am your Shyam Agro assistant. Tell me what happened and I will guide you.', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
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
    orderId: getQueryValue(window.location.search, 'orderId'),
  }));
  const chatEndRef = useRef(null);

  const contactRows = useMemo(() => [
    { icon: Phone, label: 'Phone', value: supportConfig.supportPhoneNumber || defaultSupportConfig.supportPhoneNumber, href: `tel:${supportConfig.supportPhoneNumber || defaultSupportConfig.supportPhoneNumber}` },
    { icon: Mail, label: 'Email', value: supportConfig.supportEmail || defaultSupportConfig.supportEmail, href: `mailto:${supportConfig.supportEmail || defaultSupportConfig.supportEmail}` },
    { icon: CheckCircle2, label: 'Availability', value: supportConfig.workTimings || defaultSupportConfig.workTimings },
  ], [supportConfig]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateTicketField = (field, value) => {
    const nextValue = field === 'phone' ? value.replace(/[^\d+ -]/g, '').slice(0, 15) : value;
    setTicketForm((current) => ({ ...current, [field]: nextValue }));
    setFormStatus('');
  };

  const validateTicket = () => {
    if (!ticketForm.name.trim()) return 'Name is required.';
    if (!/^[0-9+\-\s]{8,15}$/.test(ticketForm.phone.trim())) return 'Enter a valid phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticketForm.email.trim())) return 'Enter a valid email address.';
    if (!ticketForm.message.trim() || ticketForm.message.trim().length < 12) return 'Please explain the issue clearly.';
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
      setFormStatus(`Ticket ${savedTicket.serverId || savedTicket.id} submitted successfully.`);
      setTicketForm((current) => ({ ...current, message: '', orderId: '' }));
    } catch (error) {
      const savedTicket = { ...ticket, status: 'Pending sync', error: error.message };
      setTickets((current) => [savedTicket, ...current]);
      setFormStatus(`Ticket saved locally. ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setMessages((current) => [...current, { text, sender: 'user' }]);
    setInputText('');

    const apiReply = await sendSupportBotMessage(text);
    setMessages((current) => [...current, {
      text: apiReply || 'Thanks for sharing. If this is linked to an order, submit a ticket with your Order ID so our team can follow up.',
      sender: 'bot',
    }]);
  };

  return (
    <div className="contact-support-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="support-page-container">
        <section className="support-header">
          <span>Contact Support</span>
          <h1>Customer Support</h1>
          <p>Raise support tickets for orders, payments, returns, products, or general help and track the submitted details here.</p>
        </section>

        <section className="support-layout">
          <div className="support-main-column">
            <form className="support-ticket-panel" onSubmit={handleTicketSubmit}>
              <div className="support-section-title">
                <ClipboardList size={22} />
                <div>
                  <span>Submit Ticket</span>
                  <h2>Tell us what went wrong</h2>
                </div>
              </div>

              <div className="support-form-grid">
                <label>
                  <span>Name *</span>
                  <input value={ticketForm.name} onChange={(event) => updateTicketField('name', event.target.value)} autoComplete="name" />
                </label>
                <label>
                  <span>Phone *</span>
                  <input value={ticketForm.phone} onChange={(event) => updateTicketField('phone', event.target.value)} autoComplete="tel" />
                </label>
                <label>
                  <span>Email *</span>
                  <input type="email" value={ticketForm.email} onChange={(event) => updateTicketField('email', event.target.value)} autoComplete="email" />
                </label>
                <label>
                  <span>Issue type *</span>
                  <select value={ticketForm.issueType} onChange={(event) => updateTicketField('issueType', event.target.value)}>
                    {issueTypes.map((issueType) => <option key={issueType} value={issueType}>{issueType}</option>)}
                  </select>
                </label>
                <label>
                  <span>Order ID optional</span>
                  <input value={ticketForm.orderId} onChange={(event) => updateTicketField('orderId', event.target.value)} placeholder="Example: ORD-1024" />
                </label>
                <label className="support-message-field">
                  <span>Message *</span>
                  <textarea value={ticketForm.message} onChange={(event) => updateTicketField('message', event.target.value)} rows="5" placeholder="Describe the issue, product, payment, or return details." />
                </label>
              </div>

              {formStatus && <p className={`support-form-status ${formStatus.includes('successfully') ? 'success' : ''}`}>{formStatus}</p>}
              <button type="submit" className="support-submit-btn" disabled={isSubmitting}>
                <Send size={17} /> {isSubmitting ? 'Submitting...' : 'Submit ticket'}
              </button>
            </form>

            <section className="submitted-tickets-panel" aria-label="Submitted support tickets">
              <div className="support-section-title">
                <MessageSquareText size={22} />
                <div>
                  <span>Dynamic Data</span>
                  <h2>Submitted Tickets</h2>
                </div>
              </div>
              {tickets.length === 0 ? (
                <div className="support-empty-state">No tickets submitted yet. Your latest ticket details will appear here after submission.</div>
              ) : (
                <div className="support-ticket-list">
                  {tickets.map((ticket) => (
                    <article key={ticket.id} className="support-ticket-card">
                      <div className="support-ticket-card-head">
                        <strong>{ticket.serverId || ticket.id}</strong>
                        <span>{ticket.status}</span>
                      </div>
                      <div className="support-ticket-data-grid">
                        <p><span>Name</span>{ticket.name}</p>
                        <p><span>Phone</span>{ticket.phone}</p>
                        <p><span>Email</span>{ticket.email}</p>
                        <p><span>Issue</span>{ticket.issueType}</p>
                        <p><span>Order ID</span>{ticket.orderId || 'Not provided'}</p>
                        <p><span>Created</span>{new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
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
              <h3>Contact Details</h3>
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

            <div className="chat-container">
              <div className="chat-header">
                <div className="bot-status"><span className="online-dot"></span><strong>Agro Bot</strong></div>
                <span className="chat-subtitle">Online</span>
              </div>
              <div className="chat-messages">
                {messages.map((message, index) => <div key={`${message.sender}-${index}`} className={`message-bubble ${message.sender}`}>{message.text}</div>)}
                <div ref={chatEndRef} />
              </div>
              <form className="chat-input" onSubmit={handleSend}>
                <input type="text" placeholder="Type your question here..." value={inputText} onChange={(event) => setInputText(event.target.value)} />
                <button type="submit" aria-label="Send support message"><Send size={18} /></button>
              </form>
            </div>
          </aside>
        </section>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default ContactSupport;
