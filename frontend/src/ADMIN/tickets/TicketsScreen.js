import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Eye,
  X,
  AlertCircle,
  Clock3,
  CheckCircle2,
  Ticket,
  Mail,
  Phone,
  Calendar,
  User,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { getTickets, updateTicket } from '../api/tickets';
import { getOrders } from '../api/orders';
import './TicketsScreen.css';

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDateToDMY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTimeToDMY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${day}-${month}-${year} ${timeStr}`;
};

const formatOrderId = (rawId) => {
  if (!rawId) return 'ORD-000000';
  let str = String(rawId).trim().replace(/^#+/, '');
  while (str.startsWith('ORD-ORD-')) {
    str = str.substring(4);
  }
  if (!str.startsWith('ORD-')) {
    str = `ORD-${str}`;
  }
  return str;
};

const priorityMeta = {
  Critical: { className: 'priority-badge critical' },
  High: { className: 'priority-badge high' },
  Medium: { className: 'priority-badge medium' },
  Low: { className: 'priority-badge low' }
};

const statusMeta = {
  Open: { icon: AlertCircle, className: 'status-pill open' },
  'In Progress': { icon: Clock3, className: 'status-pill progress' },
  Resolved: { icon: CheckCircle2, className: 'status-pill resolved' },
  Closed: { icon: X, className: 'status-pill closed' }
};

const TicketsScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All, order_related, chatbot
  const [statusFilter, setStatusFilter] = useState('All'); // All, Open, In Progress, Resolved, Closed
  const [priorityFilter, setPriorityFilter] = useState('All'); // All, Critical, High, Medium, Low
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, priorityFilter]);
  
  // Selected ticket for details modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Modal Edit states
  const [editStatus, setEditStatus] = useState('Open');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Showing all tickets directly in list view

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ticketsList, ordersList] = await Promise.all([getTickets(), getOrders()]);
        // Bug 4 fix: Post-process tickets to auto-assign agents and enforce priority rules
        const processedTickets = ticketsList.map(ticket => {
          let updated = { ...ticket };
          // Auto-assign 'Support Team' for Open/In Progress tickets with no agent
          if ((updated.status === 'Open' || updated.status === 'In Progress') && (!updated.assignedTo || updated.assignedTo === 'Unassigned')) {
            updated.assignedTo = 'Support Team';
          }
          // Bug 3 fix: Enforce priority downgrade for Resolved/Closed tickets
          if ((updated.status === 'Resolved' || updated.status === 'Closed') && updated.priority !== 'Low') {
            updated.priority = 'Low';
          }
          return updated;
        });
        setTickets(processedTickets);
        setOrders(ordersList);
      } catch (err) {
        console.error("Failed to load support console data:", err);
        setError("Could not retrieve tickets data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute stat totals
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        const matchesSearch = 
          ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.orderId && ticket.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          ticket.issue.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'All' || ticket.type === typeFilter;
        const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;

        return matchesSearch && matchesType && matchesStatus && matchesPriority;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tickets, searchTerm, typeFilter, statusFilter, priorityFilter]);

  // List of all tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage]);

  // Open Details Modal
  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status || 'Open');
    setEditPriority(ticket.priority || 'Medium');
    setEditAssignedTo(ticket.assignedTo || 'Unassigned');
    setEditNotes(ticket.notes || '');
  };

  // Save changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    // Check if status changed and require a note
    const statusChanged = editStatus !== selectedTicket.status;
    if (statusChanged && !editNotes.trim()) {
      alert(`Please write an internal audit note to explain why you are changing the status to "${editStatus}".`);
      return;
    }

    try {
      setSaving(true);
      const updated = await updateTicket(selectedTicket.id, {
        status: editStatus,
        // Bug 3 fix: Auto-downgrade priority for Resolved and Closed
        priority: (editStatus === 'Closed' || editStatus === 'Resolved') ? 'Low' : editPriority,
        assignedTo: editAssignedTo,
        notes: editNotes
      });
      // Refresh tickets list
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTicket(updated);
      alert("Ticket updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Find linked order details
  const linkedOrder = useMemo(() => {
    if (!selectedTicket || selectedTicket.type !== 'order_related' || selectedTicket.orderId === 'N/A') return null;
    return orders.find(o => String(o.id || o.orderId).toUpperCase() === String(selectedTicket.orderId).toUpperCase());
  }, [selectedTicket, orders]);

  return (
    <div className="tickets-mgmt-container">
      {/* Page Header */}
      <div className="tickets-mgmt-header">
        <div className="tickets-mgmt-title">
          <h1>Customer Support Tickets</h1>
          <p>Manage order disputes, chatbot requests, and customer enquiries</p>
        </div>
      </div>

      {error && <div className="tickets-error-banner">{error}</div>}

      {/* Stats Cards */}
      <div className="tickets-stats-grid">
        <div className="tickets-stat-card">
          <div className="stat-card-icon total">
            <Ticket size={24} />
          </div>
          <div className="stat-card-info">
            <span>Total Tickets</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="tickets-stat-card">
          <div className="stat-card-icon open">
            <AlertCircle size={24} />
          </div>
          <div className="stat-card-info">
            <span>Open Tickets</span>
            <strong>{stats.open}</strong>
          </div>
        </div>
        <div className="tickets-stat-card">
          <div className="stat-card-icon progress">
            <Clock3 size={24} />
          </div>
          <div className="stat-card-info">
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
        </div>
        <div className="tickets-stat-card">
          <div className="stat-card-icon resolved">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-card-info">
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="tickets-toolbar">
        <div className="tickets-search-wrapper">
          <Search size={18} className="tickets-search-icon" />
          <input
            type="text"
            className="tickets-search-input"
            placeholder="Search Ticket ID, Customer, Order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tickets-filters-wrapper">
          <div className="filter-select-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="filter-select-group">
            <label>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="tickets-table-container">
        {loading ? (
          <div className="tickets-loading">Loading support tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="tickets-empty-state">
            <Ticket size={48} className="empty-icon" />
            <h3>No tickets found</h3>
            <p>Try resetting your search query or filters.</p>
          </div>
        ) : (
          <>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Ticket Details</th>
                  <th>Customer Contact</th>
                  <th>Priority</th>
                  <th>Audit Note</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.map((ticket) => {
                  const StatusIcon = statusMeta[ticket.status]?.icon || AlertCircle;
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className="ticket-primary-info">
                          <strong>{ticket.ticketNo}</strong>
                          <span className="ticket-date">
                            <Calendar size={12} style={{ marginRight: '4px' }} />
                             {formatDateToDMY(ticket.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="ticket-cust-cell">
                          <strong>{ticket.customer}</strong>
                          {ticket.email && <span className="sub"><Mail size={10} /> {ticket.email}</span>}
                          {ticket.phone && <span className="sub"><Phone size={10} /> {ticket.phone}</span>}
                        </div>
                      </td>
                      <td>
                        {ticket.status === 'Closed' ? (
                          <span className="priority-badge closed" style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }}>
                            N/A (Closed)
                          </span>
                        ) : (
                          <span className={priorityMeta[ticket.priority]?.className || 'priority-badge medium'}>
                            {ticket.priority}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="ticket-notes-cell" style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={ticket.notes || 'No notes added'}>
                          <span style={{ fontSize: '13px', color: ticket.notes ? '#334155' : '#94a3b8', fontStyle: ticket.notes ? 'normal' : 'italic' }}>
                            {ticket.notes || 'No notes added'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="assigned-agent-text">{ticket.assignedTo || 'Unassigned'}</span>
                      </td>
                      <td>
                        <span className={statusMeta[ticket.status]?.className || 'status-pill open'}>
                          <StatusIcon size={12} style={{ marginRight: '4px' }} />
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ticket-view-btn"
                          onClick={() => handleOpenDetails(ticket)}
                          title="View & Edit Ticket"
                        >
                          <Eye size={16} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTickets.length > pageSize && (
              <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Showing {paginatedTickets.length} of {filteredTickets.length} tickets</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage * pageSize >= filteredTickets.length} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: currentPage * pageSize >= filteredTickets.length ? 'not-allowed' : 'pointer', opacity: currentPage * pageSize >= filteredTickets.length ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Side-Drawer/Modal */}
      {selectedTicket && (
        <div className="ticket-modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-area">
                <Ticket className="modal-header-icon" />
                <div>
                  <h2>{selectedTicket.ticketNo} Details</h2>
                  <span className="modal-subtitle">Raised on {formatDateTimeToDMY(selectedTicket.createdAt)}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Row 1: Left (General Info & Query) and Right (Admin Actions) */}
              <div className="modal-grid-layout">
                <div className="modal-left-column">
                  {/* Customer Info Card */}
                  <div className="detail-section-card">
                    <h3>Customer Profile</h3>
                    <div className="customer-info-box">
                      <div className="info-item">
                        <User size={16} className="text-muted" />
                        <div>
                          <span>Name</span>
                          <strong>{selectedTicket.customer}</strong>
                        </div>
                      </div>
                      <div className="info-item">
                        <Mail size={16} className="text-muted" />
                        <div>
                          <span>Email</span>
                          <strong>{selectedTicket.email || 'N/A'}</strong>
                        </div>
                      </div>
                      <div className="info-item">
                        <Phone size={16} className="text-muted" />
                        <div>
                          <span>Phone</span>
                          <strong>{selectedTicket.phone || 'N/A'}</strong>
                          {/* Bug 6 fix: Phone validation warning */}
                          {selectedTicket.phone && !/^[6-9]\d{9}$/.test(selectedTicket.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '')) && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginLeft: '8px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca'
                            }}>
                              ⚠️ Invalid Format
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details & Issue Description */}
                  <div className="detail-section-card">
                    <h3>Issue Description</h3>

                    {/* Ticket Metadata Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: selectedTicket.type === 'order_related' ? '#fef3c7' : selectedTicket.type === 'chatbot' ? '#e0e7ff' : '#f1f5f9',
                        color: selectedTicket.type === 'order_related' ? '#92400e' : selectedTicket.type === 'chatbot' ? '#3730a3' : '#475569',
                        border: `1px solid ${selectedTicket.type === 'order_related' ? '#fcd34d' : selectedTicket.type === 'chatbot' ? '#a5b4fc' : '#cbd5e1'}`
                      }}>
                        {selectedTicket.type === 'order_related' ? '📦 Order Related' : selectedTicket.type === 'chatbot' ? '💬 Chatbot Raised' : '📋 General Enquiry'}
                      </span>
                      {selectedTicket.type === 'order_related' && selectedTicket.orderId && selectedTicket.orderId !== 'N/A' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
                          🔗 Order Ref: {formatOrderId(selectedTicket.orderId)}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        🕒 Raised: {formatDateTimeToDMY(selectedTicket.createdAt)}
                      </span>
                    </div>

                    {/* Issue Description Content */}
                    <div className="issue-desc-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.7', color: '#1e293b', fontWeight: '500' }}>
                        {selectedTicket.issue}
                      </p>
                    </div>

                    {/* Fallback note if issue is vague */}
                    {(selectedTicket.issue === 'No Description' || selectedTicket.issue === 'Order Dispute' || selectedTicket.issue === 'Chatbot Handover Request' || (selectedTicket.issue && selectedTicket.issue.length < 20)) && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '11.5px', color: '#92400e', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span>⚠️</span>
                        <span>
                          <strong>Note:</strong> The issue description appears brief. 
                          {selectedTicket.type === 'chatbot' && selectedTicket.chatHistory?.length > 0
                            ? ' Review the Chatbot Transcript Logs below for the full conversation context.'
                            : selectedTicket.type === 'order_related' && selectedTicket.orderId !== 'N/A'
                              ? ` Check the Linked Order ${formatOrderId(selectedTicket.orderId)} details below for more context.`
                              : ' Consider contacting the customer for clarification and updating the Internal Audit Notes.'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Link Details (If Order Related) */}
                  {selectedTicket.type === 'order_related' && (
                    <div className="detail-section-card">
                      <h3>Linked Order Information</h3>
                      {linkedOrder ? (
                        <div className="linked-order-box">
                          <div className="order-summary-row">
                            <div>
                              <span>Order Reference</span>
                              <strong>{formatOrderId(linkedOrder.id || linkedOrder.orderId)}</strong>
                            </div>
                            <div>
                              <span>Order Status</span>
                              <strong className={`status-badge-inline ${linkedOrder.status?.toLowerCase()}`}>
                                {linkedOrder.status}
                              </strong>
                            </div>
                            <div>
                              <span>Total Value</span>
                              <strong>{formatCurrency(linkedOrder.totalAmount || linkedOrder.total)}</strong>
                            </div>
                          </div>

                          <div className="order-items-mini-list">
                            <span>Products Ordered:</span>
                            <ul>
                              {Array.isArray(linkedOrder.items) && linkedOrder.items.map((item, idx) => (
                                <li key={idx} className="item-row">
                                  <ShoppingBag size={14} style={{ marginRight: '6px' }} />
                                  <span>{item.name || item.productName} (x{item.quantity || item.qty})</span>
                                  <strong>{formatCurrency(item.unitPrice || item.price)}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="linked-order-notfound">
                          <ShoppingBag size={20} className="warning-icon" />
                          <div>
                            <strong>Order {formatOrderId(selectedTicket.orderId)} not found in Admin Ledger</strong>
                            <span>Please verify if this is a custom order or manual transaction.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chatbot conversation logs (If Chatbot Type) */}
                  {selectedTicket.type === 'chatbot' && (
                    <div className="detail-section-card">
                      <h3>Chatbot Transcript Logs</h3>
                      {selectedTicket.chatHistory && selectedTicket.chatHistory.length > 0 ? (
                        <div className="chatbot-transcript-container">
                          {selectedTicket.chatHistory.map((chat, idx) => (
                            <div key={idx} className={`transcript-bubble-wrapper ${chat.sender}`}>
                              <span className="bubble-sender-label">
                                {chat.sender === 'bot' ? 'Agro Bot' : 'Customer'}
                              </span>
                              <div className="transcript-bubble">
                                {chat.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="linked-order-notfound">
                          <HelpCircle size={20} className="warning-icon" />
                          <div>
                            <strong>No chat logs recorded</strong>
                            <span>Ticket raised via quick command.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-right-column">
                  {/* Admin Configuration Actions */}
                  <form onSubmit={handleSaveChanges} className="admin-actions-card">
                    <h3>Configure & Update</h3>
                    
                    <div className="form-group">
                      <label>Assigned Agent</label>
                      <input
                        type="text"
                        value={editAssignedTo}
                        onChange={(e) => setEditAssignedTo(e.target.value)}
                        placeholder="Enter agent name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Update Priority</label>
                      {editStatus === 'Closed' ? (
                        <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔒</span> N/A — Closed Ticket (No Active Priority)
                        </div>
                      ) : (
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Update Ticket Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Internal Audit Notes</span>
                        {editStatus !== selectedTicket.status && (
                          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>* Note Required for Status Change</span>
                        )}
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Provide details/reason for status change..."
                        style={{
                          border: (editStatus !== selectedTicket.status && !editNotes.trim()) ? '1px solid #ef4444' : '1px solid #cbd5e1'
                        }}
                      />
                      {editStatus !== selectedTicket.status && !editNotes.trim() && (
                        <span style={{ color: '#b91c1c', fontSize: '11px', marginTop: '2px', fontWeight: '500' }}>
                          ⚠️ Please write a note explaining why the status is being updated.
                        </span>
                      )}
                    </div>

                    <button type="submit" className="save-action-btn" disabled={saving}>
                      {saving ? 'Updating changes...' : 'Update Ticket Config'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsScreen;
