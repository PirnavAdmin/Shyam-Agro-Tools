import { useEffect, useState } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

import "./Tickets.css";

const API_URL = "https://shyamagrotools.com/api/Tickets";

function Tickets() {
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [customer, setCustomer] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState("");

  const ticketsPerPage = 5;

  const [tickets, setTickets] = useState([]);

  const apiHeaders = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  const normalizeTicket = (ticket) => {
    if (!ticket) return {};
    
    // Status mapping: API "InProgress" -> Frontend "Pending"
    let status = ticket.status || ticket.ticketStatus || "Open";
    if (status === "InProgress") {
      status = "Pending";
    }

    return {
      id: ticket.id,
      ticketNo: ticket.ticketId || ticket.ticketNumber || `TCK-${ticket.id}`,
      customer: ticket.name || ticket.customerName || ticket.customer || "",
      email: ticket.email || "",
      phone: ticket.phone || "",
      subject: ticket.subject || "General Enquiry",
      issue: ticket.message || ticket.issueName || ticket.subject || ticket.issue || "",
      sourceType: ticket.sourceType || "General",
      priority: ticket.priority || ticket.priorityName || "Medium",
      status: status,
      assignedTo: ticket.assignedAgent || ticket.assignedTo || "",
      notes: ticket.auditNote || ticket.notes || "No notes added",
      createdAt: ticket.createdAt || ""
    };
  };

  const convertToApiTicket = (ticket) => {
    let apiStatus = ticket.status || "Open";
    if (apiStatus === "Pending" || apiStatus === "In Progress") {
      apiStatus = "InProgress";
    }
    return {
      id: ticket.id ? Number(ticket.id) : 0,
      ticketId: ticket.ticketNo || "",
      name: ticket.customer || "",
      email: ticket.email || "",
      phone: ticket.phone || "",
      subject: ticket.subject || "General Enquiry",
      message: ticket.issue || "",
      sourceType: ticket.sourceType || "General",
      priority: ticket.priority || "Medium",
      status: apiStatus,
      assignedAgent: ticket.assignedTo || null,
      auditNote: ticket.notes || "No notes added"
    };
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setApiError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      const ticketsList = data && Array.isArray(data.tickets) 
        ? data.tickets 
        : (Array.isArray(data) ? data : []);

      const formattedData = ticketsList.map(normalizeTicket);

      setTickets(formattedData);
    } catch (error) {
      console.error("GET Tickets Error:", error);
      setApiError("Unable to load tickets from API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketById = async (id) => {
    try {
      setApiError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ticket details");
      }

      const data = await response.json();

      return normalizeTicket(data.ticket || data);
    } catch (error) {
      console.error("GET Ticket By ID Error:", error);
      setApiError("Unable to load selected ticket details.");
      return null;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (isEditMode && editingTicket) {
      setCustomer(editingTicket.customer || "");
      setIssue(editingTicket.issue || "");
      setPriority(editingTicket.priority || "Medium");
      setStatus(editingTicket.status || "Open");
      setAssignedTo(editingTicket.assignedTo || "");
    } else {
      setCustomer("");
      setIssue("");
      setPriority("Medium");
      setStatus("Open");
      setAssignedTo("");
    }

    setErrors({});
  }, [isEditMode, editingTicket, showModal]);

  const filteredTickets = tickets.filter((ticket) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (ticket.ticketNo || "").toLowerCase().includes(search) ||
      (ticket.customer || "").toLowerCase().includes(search) ||
      (ticket.issue || "").toLowerCase().includes(search) ||
      (ticket.assignedTo || "").toLowerCase().includes(search);

    const matchesStatus =
      filterStatus === "All" || ticket.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;

  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const openAddModal = () => {
    setEditingTicket(null);
    setIsEditMode(false);
    setShowModal(true);
    setErrors({});
    setApiError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTicket(null);
    setIsEditMode(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customer.trim()) {
      newErrors.customer = "Customer name is required";
    }

    if (!issue.trim()) {
      newErrors.issue = "Issue field is required";
    }

    if (!assignedTo.trim()) {
      newErrors.assignedTo = "Assigned person is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const createTicket = async (ticketData) => {
    try {
      setApiError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiTicket(ticketData)),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      await fetchTickets();
      closeModal();
    } catch (error) {
      console.error("POST Ticket Error:", error);
      setApiError("Unable to create ticket.");
    }
  };

  const deleteTicket = async (id) => {
    try {
      setApiError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to delete ticket");
      }

      await fetchTickets();
    } catch (error) {
      console.error("DELETE Ticket Error:", error);
      setApiError("Unable to delete ticket.");
    }
  };

  const editTicket = async (ticket) => {
    const latestTicket = await fetchTicketById(ticket.id);

    setEditingTicket(latestTicket || ticket);
    setIsEditMode(true);
    setShowModal(true);
    setErrors({});
  };

  const updateTicket = async (updatedTicket) => {
    try {
      setApiError("");

      const response = await fetch(`${API_URL}/${updatedTicket.id}`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiTicket(updatedTicket)),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      await fetchTickets();
      closeModal();
    } catch (error) {
      console.error("PUT Ticket Error:", error);
      setApiError("Unable to update ticket.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const ticketData = {
      id: editingTicket?.id || 0,
      ticketNo:
        editingTicket?.ticketNo ||
        `TCK-${1000 + tickets.length + 1}`,
      customer,
      issue,
      priority,
      status,
      assignedTo,
    };

    if (isEditMode) {
      await updateTicket({
        ...editingTicket,
        ...ticketData,
      });
    } else {
      await createTicket(ticketData);
    }
  };

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1>Tickets</h1>

          <p>
            Manage customer service requests, complaints and support tickets
          </p>

          {loading && <p>Loading tickets...</p>}

          {apiError && (
            <p style={{ color: "#dc2626", marginTop: "8px" }}>
              {apiError}
            </p>
          )}
        </div>
      </div>

      <div className="tickets-container">
        <div className="ticket-stats-grid">
          <div className="ticket-stat-card">
            <h3>Total Tickets</h3>
            <h2>{tickets.length}</h2>
          </div>

          <div className="ticket-stat-card">
            <h3>Open Tickets</h3>
            <h2>
              {tickets.filter((ticket) => ticket.status === "Open").length}
            </h2>
          </div>

          <div className="ticket-stat-card">
            <h3>Pending Tickets</h3>
            <h2>
              {tickets.filter((ticket) => ticket.status === "Pending").length}
            </h2>
          </div>

          <div className="ticket-stat-card">
            <h3>Closed Tickets</h3>
            <h2>
              {tickets.filter((ticket) => ticket.status === "Closed").length}
            </h2>
          </div>
        </div>

        <div className="ticket-table-container">
          <div className="ticket-table-header">
            <div>
              <h2>Ticket Management</h2>
              <p>Track support requests and service workflow</p>
            </div>

            <div className="ticket-table-actions">
              <input
                type="text"
                placeholder="Search tickets..."
                className="ticket-search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <select
                className="ticket-filter"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All</option>
                <option>Open</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>

              <button className="add-ticket-btn" onClick={openAddModal}>
                Add Ticket
              </button>
            </div>
          </div>

          <table className="ticket-table">
            <thead>
              <tr>
                <th>SL No</th>
                <th>Ticket No</th>
                <th>Customer</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentTickets.length > 0 ? (
                currentTickets.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td>{indexOfFirstTicket + index + 1}</td>
                    <td>{ticket.ticketNo}</td>
                    <td>{ticket.customer}</td>
                    <td>{ticket.issue}</td>

                    <td>
                      <span
                        className={`priority ${(
                          ticket.priority || ""
                        ).toLowerCase()}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`ticket-status ${(
                          ticket.status || ""
                        ).toLowerCase()}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td>{ticket.assignedTo}</td>

                    <td>
                      <button
                        className="ticket-action-btn edit"
                        title="Edit"
                        onClick={() => editTicket(ticket)}
                      >
                        <FiEdit />
                      </button>

                      <button
                        className="ticket-action-btn delete"
                        title="Delete"
                        onClick={() => deleteTicket(ticket.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-ticket-message">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="ticket-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={currentPage === index + 1 ? "active" : ""}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ticket-modal-overlay">
          <div className="ticket-modal">
            <h2>{isEditMode ? "Edit Ticket" : "Add Ticket"}</h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customer}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setErrors({
                      ...errors,
                      customer: "",
                    });
                  }}
                  className={errors.customer ? "error-input" : ""}
                />

                {errors.customer && (
                  <p className="error-text">{errors.customer}</p>
                )}
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Issue"
                  value={issue}
                  onChange={(e) => {
                    setIssue(e.target.value);
                    setErrors({
                      ...errors,
                      issue: "",
                    });
                  }}
                  className={errors.issue ? "error-input" : ""}
                />

                {errors.issue && <p className="error-text">{errors.issue}</p>}
              </div>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Open</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Assigned To"
                  value={assignedTo}
                  onChange={(e) => {
                    setAssignedTo(e.target.value);
                    setErrors({
                      ...errors,
                      assignedTo: "",
                    });
                  }}
                  className={errors.assignedTo ? "error-input" : ""}
                />

                {errors.assignedTo && (
                  <p className="error-text">{errors.assignedTo}</p>
                )}
              </div>

              <div className="ticket-modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-btn">
                  {isEditMode ? "Update Ticket" : "Save Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;