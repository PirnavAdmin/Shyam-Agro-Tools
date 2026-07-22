import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Tickets`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Initial mock tickets
const MOCK_TICKETS = [
  {
    id: 'TCK88201',
    ticketNo: 'TCK-88201',
    customer: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '9876543210',
    issue: 'Incorrect quantity delivered. Ordered 2 units of Premium Organic Fertilizer, but received only 1.',
    priority: 'High',
    status: 'Open',
    assignedTo: 'Anil Sharma',
    type: 'order_related',
    orderId: 'ORD10214',
    createdAt: '2026-07-08T11:00:00.000Z'
  },
  {
    id: 'TCK88202',
    ticketNo: 'TCK-88202',
    customer: 'Amit Patel',
    email: 'amit@retailagro.com',
    phone: '8765432109',
    issue: 'Question about warranty on Heavy Duty Hand Weeding tools.',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Sanjay Verma',
    type: 'chatbot',
    orderId: 'N/A',
    chatHistory: [
      { sender: 'bot', text: 'Hello! I am your Shyam Agro assistant. How can I help you today?' },
      { sender: 'user', text: 'Hi, I purchased the Heavy Duty Hand Weeder (ORD10215). What is the warranty period?' },
      { sender: 'bot', text: 'All Shyam Agro Tools carry a 1-year manufacturer warranty covering manufacturing defects. Would you like to raise a support ticket to get full warranty document?' },
      { sender: 'user', text: 'Yes, please raise a ticket. My email is amit@retailagro.com.' },
      { sender: 'bot', text: 'Thank you! I have created a support ticket (TCK-88202) for you. Our support team will contact you shortly.' }
    ],
    createdAt: '2026-07-09T09:30:00.000Z'
  },
  {
    id: 'TCK88203',
    ticketNo: 'TCK-88203',
    customer: 'Ramesh Singh',
    email: 'ramesh@singhfarms.com',
    phone: '9440123456',
    issue: 'Payment made via UPI (UTR 620478129034) for Order ORD10214 is not showing as paid on the portal.',
    priority: 'Critical',
    status: 'Open',
    assignedTo: 'Anil Sharma',
    type: 'order_related',
    orderId: 'ORD10214',
    createdAt: '2026-07-10T14:15:00.000Z'
  }
];

const getLocalTickets = () => {
  const local = localStorage.getItem('shyam_agro_tickets');
  if (!local) {
    localStorage.setItem('shyam_agro_tickets', JSON.stringify(MOCK_TICKETS));
    return MOCK_TICKETS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return MOCK_TICKETS;
  }
};

const saveLocalTickets = (tickets) => {
  localStorage.setItem('shyam_agro_tickets', JSON.stringify(tickets));
};

const mapServerTicketToFrontend = (st) => {
  const stId = String(st.id);
  
  // Status mapping
  let status = st.status || st.ticketStatus || 'Open';
  if (status === 'InProgress') {
    status = 'In Progress';
  }
  
  // Type mapping
  let type = 'chatbot';
  if (st.sourceType === 'Order-Related' || st.type === 'order_related') {
    type = 'order_related';
  } else if (st.sourceType === 'Chatbot' || st.type === 'chatbot') {
    type = 'chatbot';
  } else if (st.sourceType === 'General' || st.type === 'general') {
    type = 'general';
  }
  
  // Order reference mapping
  let orderId = 'N/A';
  if (st.orderReference) {
    orderId = st.orderReference.replace('#', '');
  } else if (st.orderId) {
    orderId = st.orderId;
  }

  return {
    id: stId,
    ticketNo: st.ticketId || st.ticketNumber || `TCK-${stId}`,
    customer: st.name || st.customerName || 'Unknown Customer',
    email: st.email || '',
    phone: st.phone || '',
    issue: st.message || st.issueName || st.subject || 'No Description',
    priority: st.priority || st.priorityName || 'Medium',
    status: status,
    assignedTo: st.assignedAgent || st.assignedTo || 'Unassigned',
    type: type,
    orderId: orderId,
    notes: st.auditNote || st.notes || 'No notes added',
    createdAt: st.createdAt || new Date().toISOString(),
    chatHistory: st.chatHistory || []
  };
};

// Fetch all tickets
export const getTickets = async () => {
  try {
    const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch tickets (${response.status})`);
    const serverTickets = await response.json();
    
    // Server returns { tickets: [...] }
    const serverList = serverTickets && Array.isArray(serverTickets.tickets) 
      ? serverTickets.tickets 
      : (Array.isArray(serverTickets) ? serverTickets : []);

    // Merge server and local storage
    const local = getLocalTickets();
    const merged = [...local];
    const localIds = new Set(local.map(t => String(t.id)));
    
    serverList.forEach(st => {
      const stId = String(st.id);
      const mapped = mapServerTicketToFrontend(st);
      if (!localIds.has(stId)) {
        merged.push(mapped);
      } else {
        // Update local memory with backend state
        const idx = merged.findIndex(t => String(t.id) === stId);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...mapped };
        }
      }
    });

    saveLocalTickets(merged);
    return merged;
  } catch (err) {
    console.warn("Tickets API offline, falling back to LocalStorage tickets:", err);
    return getLocalTickets();
  }
};

// Get a ticket by ID
export const getTicketById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch ticket ${id} (${response.status})`);
    const data = await response.json();
    return mapServerTicketToFrontend(data.ticket || data);
  } catch (err) {
    console.warn(`Failed to fetch ticket ${id} from server:`, err);
    const local = getLocalTickets();
    const found = local.find(t => String(t.id) === String(id));
    if (found) return found;
    throw err;
  }
};

// Create a ticket
export const createTicket = async (payload) => {
  const local = getLocalTickets();
  const idNum = Math.floor(10000 + Math.random() * 90000);
  const newTicket = {
    id: String(idNum),
    ticketNo: `TCK-${idNum}`,
    createdAt: new Date().toISOString(),
    status: 'Open',
    assignedTo: 'Unassigned',
    priority: payload.priority || 'Medium',
    orderId: payload.orderId || 'N/A',
    chatHistory: payload.chatHistory || [],
    ...payload
  };

  local.unshift(newTicket);
  saveLocalTickets(local);

  try {
    let status = newTicket.status;
    if (status === 'In Progress') {
      status = 'InProgress';
    }

    let sourceType = 'Chatbot';
    if (newTicket.type === 'order_related') {
      sourceType = 'Order-Related';
    } else if (newTicket.type === 'chatbot') {
      sourceType = 'Chatbot';
    } else if (newTicket.type === 'general') {
      sourceType = 'General';
    }

    const apiPayload = {
      name: newTicket.customer || 'Unknown Customer',
      email: newTicket.email || '',
      phone: newTicket.phone || '',
      subject: newTicket.type === 'order_related' ? 'Order Dispute' : 'Chatbot Handover Request',
      message: newTicket.issue || 'No Description',
      sourceType: sourceType,
      orderReference: newTicket.orderId && newTicket.orderId !== 'N/A' ? `#${newTicket.orderId}` : null,
      priority: newTicket.priority || 'Medium',
      status: status,
      assignedAgent: newTicket.assignedTo === 'Unassigned' ? null : newTicket.assignedTo,
      auditNote: newTicket.notes || 'No notes added'
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (response.ok) {
      const serverTicket = await response.json();
      const mapped = mapServerTicketToFrontend(serverTicket);
      
      const updatedLocal = getLocalTickets();
      const idx = updatedLocal.findIndex(t => String(t.id) === String(newTicket.id));
      if (idx !== -1) {
        updatedLocal[idx] = mapped;
        saveLocalTickets(updatedLocal);
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Tickets API offline, saved ticket locally only:", err);
  }
  return newTicket;
};

// Update a ticket
export const updateTicket = async (id, updatedFields) => {
  const local = getLocalTickets();
  const index = local.findIndex(t => String(t.id) === String(id));
  if (index !== -1) {
    local[index] = { ...local[index], ...updatedFields };
    saveLocalTickets(local);
    
    try {
      const ticket = local[index];
      
      let currentTicketObj = null;
      try {
        const getRes = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
        if (getRes.ok) {
          const detailData = await getRes.json();
          currentTicketObj = detailData.ticket || detailData;
        }
      } catch (e) {
        console.warn("Could not fetch current ticket from server before update:", e);
      }

      let status = ticket.status;
      if (status === 'In Progress') {
        status = 'InProgress';
      }

      let sourceType = 'Chatbot';
      if (ticket.type === 'order_related') {
        sourceType = 'Order-Related';
      } else if (ticket.type === 'chatbot') {
        sourceType = 'Chatbot';
      } else if (ticket.type === 'general') {
        sourceType = 'General';
      }

      const apiPayload = {
        id: Number(id),
        ticketId: ticket.ticketNo,
        name: ticket.customer,
        email: ticket.email || (currentTicketObj ? currentTicketObj.email : ''),
        phone: ticket.phone || (currentTicketObj ? currentTicketObj.phone : ''),
        subject: currentTicketObj ? currentTicketObj.subject : (ticket.type === 'order_related' ? 'Order Dispute' : 'Chatbot Handover Request'),
        message: ticket.issue || (currentTicketObj ? currentTicketObj.message : ''),
        sourceType: sourceType,
        orderReference: ticket.orderId && ticket.orderId !== 'N/A' ? `#${ticket.orderId}` : (currentTicketObj ? currentTicketObj.orderReference : null),
        priority: ticket.priority,
        status: status,
        assignedAgent: ticket.assignedTo === 'Unassigned' ? null : ticket.assignedTo,
        auditNote: ticket.notes,
        createdAt: currentTicketObj ? currentTicketObj.createdAt : ticket.createdAt
      };

      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        const latest = await getTicketById(id);
        const updatedLocal = getLocalTickets();
        const idx = updatedLocal.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) {
          updatedLocal[idx] = latest;
          saveLocalTickets(updatedLocal);
        }
        return latest;
      }
    } catch (err) {
      console.warn("Tickets API offline, updated ticket locally only:", err);
    }
    return local[index];
  }
  throw new Error(`Ticket ${id} not found.`);
};

// Delete a ticket
export const deleteTicket = async (id) => {
  const local = getLocalTickets();
  const filtered = local.filter(t => String(t.id) !== String(id));
  saveLocalTickets(filtered);

  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });
    if (!response.ok) throw new Error(`Failed to delete ticket (${response.status})`);
    return true;
  } catch (err) {
    console.warn("Tickets API offline, deleted ticket locally only:", err);
    return true;
  }
};
