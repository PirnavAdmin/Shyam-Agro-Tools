import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiDownload,
  FiEdit,
  FiFilter,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiPlay,
  FiSliders,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import "./CallHistory.css";

// Rich set of team members for simulating calls
const MOCK_TEAM_MEMBERS = [
  "Charan Reddy",
  "Suresh Kumar",
  "Priya Sharma",
  "Rajesh Patel",
  "Anita Desai",
];

// Rich set of default customer contacts for the dialer dropdown
const MOCK_CUSTOMERS = [
  { name: "Ramesh Kumar", phone: "9876543210", email: "ramesh.kumar@gmail.com" },
  { name: "Sunita Rao", phone: "8765432109", email: "sunita.rao@yahoo.com" },
  { name: "Amit Patel", phone: "7654321098", email: "amit.patel@outlook.com" },
  { name: "Vikram Singh", phone: "9123456789", email: "vikram.singh@gmail.com" },
  { name: "Kavitha Reddy", phone: "9988776655", email: "kavitha.r@gmail.com" },
  { name: "Deepak Sharma", phone: "9812345678", email: "deepak.sharma@gmail.com" },
  { name: "Harpreet Singh", phone: "9765432100", email: "harpreet.s@yahoo.com" },
];

const initialFormData = {
  id: "",
  customerName: "",
  phone: "",
  email: "",
  status: "Follow-up",
  lastCall: "",
  notes: "",
  followUpDate: "",
  priority: "Medium",
  qualifiedLead: false,
  calledBy: "Charan Reddy",
};



const API_URL = "https://wildlife-unwieldy-devotee.ngrok-free.dev/api/CallHistory";
const apiHeaders = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

const normalizeCallLog = (log) => {
  if (!log) return {};
  return {
    id: log.id,
    customerName: log.customerName || "",
    phone: log.customerPhone || "",
    email: log.customerEmail || "",
    status: log.status || "Follow-up",
    lastCall: log.lastCallTime || "",
    notes: log.notesSummary || "",
    followUpDate: log.callbackTime || "",
    priority: log.priority || "Medium",
    qualifiedLead: !!log.isQualifiedLead,
    calledBy: log.calledByRep || "",
  };
};

const convertToApiCallLog = (log) => {
  return {
    id: log.id ? Number(log.id) : 0,
    customerName: log.customerName || "",
    customerPhone: log.phone || "",
    customerEmail: log.email || "",
    calledByRep: log.calledBy || "",
    status: log.status || "Follow-up",
    priority: log.priority || "Medium",
    notesSummary: log.notes || "",
    lastCallTime: log.lastCall ? new Date(log.lastCall).toISOString() : new Date().toISOString(),
    callbackTime: log.followUpDate ? new Date(log.followUpDate).toISOString() : null,
    isQualifiedLead: !!log.qualifiedLead,
  };
};

function CallHistory() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  
  // Custom Toast notification states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success"); // success, error, info

  // Call Simulator states
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorState, setSimulatorState] = useState("select"); // select, calling, log
  const [selectedSimCustIndex, setSelectedSimCustIndex] = useState(0);
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customCustName, setCustomCustName] = useState("");
  const [customCustPhone, setCustomCustPhone] = useState("");
  const [customCustEmail, setCustomCustEmail] = useState("");
  const [selectedSimCaller, setSelectedSimCaller] = useState(MOCK_TEAM_MEMBERS[0]);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef(null);

  // Simulator Log states
  const [simStatus, setSimStatus] = useState("Follow-up");
  const [simPriority, setSimPriority] = useState("Medium");
  const [simNotes, setSimNotes] = useState("");
  const [simFollowUpDate, setSimFollowUpDate] = useState("");
  const [simQualified, setSimQualified] = useState(false);

  const importInputRef = useRef(null);

  // Show customized feedback toasts
  const triggerToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load from API
  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      setApiError("");
      const response = await fetch(API_URL, {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch call history");
      }

      const data = await response.json();
      const logsList = data && Array.isArray(data.callLogs)
        ? data.callLogs
        : (Array.isArray(data) ? data : []);

      const formattedData = logsList.map(normalizeCallLog);
      setRows(formattedData);
    } catch (error) {
      console.error("GET CallHistory Error:", error);
      setApiError("Unable to load call logs from API.");
      triggerToast("Failed to load call logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if a date matches calendar "Today"
  const isDateToday = (dateValue) => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Sorting and filtering logic
  // Today's Follow-up items must show first in list and have special tags.
  // After today follow-ups, list all the history of calls.
  const processedRows = useMemo(() => {
    // 1. Filter rows by search query, status and priority filters
    const filtered = rows.filter((item) => {
      const name = (item.customerName || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const notes = (item.notes || "").toLowerCase();
      const caller = (item.calledBy || "").toLowerCase();
      const search = query.toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        phone.includes(search) ||
        email.includes(search) ||
        notes.includes(search) ||
        caller.includes(search);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // 2. Separate into Today's Follow-ups and Other Calls
    const todayFollowUps = [];
    const otherCalls = [];

    filtered.forEach((item) => {
      const isTodayFollowUp =
        item.status === "Follow-up" && isDateToday(item.followUpDate);
      
      if (isTodayFollowUp) {
        todayFollowUps.push({ ...item, isTodayFollowUp: true });
      } else {
        otherCalls.push({ ...item, isTodayFollowUp: false });
      }
    });

    // 3. Sort Today's follow-ups: highest priority first, then earliest follow-up date
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    todayFollowUps.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 0;
      const wB = priorityWeight[b.priority] || 0;
      if (wB !== wA) return wB - wA;
      return new Date(a.followUpDate) - new Date(b.followUpDate);
    });

    // 4. Sort Other calls: newest lastCall date first
    otherCalls.sort((a, b) => {
      return new Date(b.lastCall) - new Date(a.lastCall);
    });

    return [...todayFollowUps, ...otherCalls];
  }, [rows, query, statusFilter, priorityFilter]);

  // Compute metric cards statistics based on all current records
  const metrics = useMemo(() => {
    const total = rows.length;
    const followUpsDue = rows.filter(
      (item) => item.status === "Follow-up" && isDateToday(item.followUpDate)
    ).length;
    const pendingFollowUps = rows.filter(
      (item) => item.status === "Follow-up"
    ).length;
    const qualifiedLeads = rows.filter((item) => item.qualifiedLead).length;
    return { total, followUpsDue, pendingFollowUps, qualifiedLeads };
  }, [rows]);

  // Status options for dropdown filter
  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.status).filter(Boolean)));
    return ["All", ...unique];
  }, [rows]);

  // Priority options for filter
  const priorityOptions = ["All", "High", "Medium", "Low"];

  // Open manual add call dialog
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      ...initialFormData,
      lastCall: normalizeDateForInput(new Date().toISOString()),
    });
    setFormData((prev) => ({ ...prev, calledBy: MOCK_TEAM_MEMBERS[0] }));
    setShowModal(true);
  };

  // Open manual edit call dialog
  const editCall = (call) => {
    setIsEditMode(true);
    setFormData({
      ...call,
      lastCall: normalizeDateForInput(call.lastCall),
      followUpDate: normalizeDateForInput(call.followUpDate),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  const handleFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createCallLog = async (logData) => {
    try {
      setLoading(true);
      setApiError("");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiCallLog(logData)),
      });

      if (!response.ok) {
        throw new Error("Failed to create call log");
      }

      triggerToast("Call record added successfully!");
      await fetchCallLogs();
      closeModal();
    } catch (error) {
      console.error("POST CallLog Error:", error);
      setApiError("Unable to create call log.");
      triggerToast("Failed to create call log.", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateCallLog = async (logData) => {
    try {
      setLoading(true);
      setApiError("");

      const apiPayload = convertToApiCallLog(logData);
      apiPayload.callbackTimeSpecified = !!logData.followUpDate;

      const response = await fetch(`${API_URL}/${logData.id}`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update call log");
      }

      triggerToast("Call record updated successfully!");
      await fetchCallLogs();
      closeModal();
    } catch (error) {
      console.error("PUT CallLog Error:", error);
      setApiError("Unable to update call log.");
      triggerToast("Failed to update call log.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save manual call details
  const saveCall = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await updateCallLog(formData);
    } else {
      await createCallLog(formData);
    }
  };

  // Delete call record
  const deleteCall = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this call history record?"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setApiError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to delete call log");
      }

      triggerToast("Call record deleted successfully!", "info");
      await fetchCallLogs();
    } catch (error) {
      console.error("DELETE CallLog Error:", error);
      setApiError("Unable to delete call log.");
      triggerToast("Failed to delete call log.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================
     CALL SIMULATOR WORKFLOW
     ==================================================== */
  
  const openSimulator = () => {
    setShowSimulator(true);
    setSimulatorState("select");
    setSelectedSimCustIndex(0);
    setIsCustomCustomer(false);
    setCustomCustName("");
    setCustomCustPhone("");
    setCustomCustEmail("");
    setSelectedSimCaller(MOCK_TEAM_MEMBERS[0]);
    setCallTimer(0);
    setSimStatus("Follow-up");
    setSimPriority("Medium");
    setSimNotes("");
    setSimFollowUpDate(normalizeDateForInput(new Date().toISOString()));
    setSimQualified(false);
  };

  const closeSimulator = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShowSimulator(false);
  };

  // Start Call timer ticking
  const startSimulatedCall = () => {
    // Validate custom customer inputs if selected
    if (isCustomCustomer && (!customCustName.trim() || !customCustPhone.trim())) {
      alert("Please provide customer name and phone number.");
      return;
    }

    setSimulatorState("calling");
    setCallTimer(0);
    timerRef.current = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
  };

  // End active call and open the summary input log
  const endSimulatedCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSimulatorState("log");
    
    // Set notes placeholder indicating call length
    const minutes = Math.floor(callTimer / 60);
    const seconds = callTimer % 60;
    const durStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    setSimNotes(`Outgoing call placed by ${selectedSimCaller}. Duration: ${durStr}. Customer answered and discussed...`);
  };

  // Save details of the simulated call log
  const saveSimulatedCall = async () => {
    let customerName = "";
    let phone = "";
    let email = "";

    if (isCustomCustomer) {
      customerName = customCustName.trim();
      phone = customCustPhone.trim();
      email = customCustEmail.trim();
    } else {
      const cust = MOCK_CUSTOMERS[selectedSimCustIndex];
      customerName = cust.name;
      phone = cust.phone;
      email = cust.email;
    }

    const minutes = Math.floor(callTimer / 60);
    const seconds = callTimer % 60;
    const durStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const finalNotes = `[Call Duration: ${durStr}] ${simNotes}`;

    const newRecord = {
      customerName,
      phone,
      email,
      status: simStatus,
      lastCall: new Date().toISOString(),
      notes: finalNotes,
      followUpDate: simStatus === "Follow-up" ? simFollowUpDate : "",
      priority: simPriority,
      qualifiedLead: simQualified,
      calledBy: selectedSimCaller,
    };

    try {
      setLoading(true);
      setApiError("");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiCallLog(newRecord)),
      });

      if (!response.ok) {
        throw new Error("Failed to save simulated call");
      }

      triggerToast(`Call to ${customerName} recorded successfully!`, "success");
      await fetchCallLogs();
      closeSimulator();
    } catch (error) {
      console.error("POST CallLog Simulator Error:", error);
      setApiError("Unable to save simulated call log.");
      triggerToast("Failed to save simulated call.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Format simulator timer
  const formatTimer = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ====================================================
     FILE IMPORT & EXPORT LOGIC
     ==================================================== */

  // Export JSON file
  const handleExportJSON = () => {
    const content = JSON.stringify(rows, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `call-history-data-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast("Data exported as JSON file!");
  };

  // Export CSV file
  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Status",
      "Last Call",
      "Priority",
      "Qualified Lead",
      "Called By",
      "Notes",
      "Follow-up Date",
    ];

    const csvRows = [headers.join(",")];

    processedRows.forEach((item) => {
      const line = [
        `"${(item.customerName || "").replace(/"/g, '""')}"`,
        `"${item.phone || ""}"`,
        `"${item.email || ""}"`,
        `"${item.status}"`,
        `"${item.lastCall}"`,
        `"${item.priority}"`,
        `"${item.qualifiedLead ? "Yes" : "No"}"`,
        `"${(item.calledBy || "").replace(/"/g, '""')}"`,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
        `"${item.followUpDate || ""}"`,
      ];
      csvRows.push(line.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `call-history-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast("Data exported as CSV file!");
  };

  // Import JSON/CSV file
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        let imported = [];

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            imported = parsed.map((item) => ({
              customerName: item.customerName || item.CustomerName || "Unknown Customer",
              phone: item.phone || item.Phone || "",
              email: item.email || item.Email || "",
              status: item.status || item.Status || "Follow-up",
              lastCall: item.lastCall || item.LastCall || new Date().toISOString(),
              notes: item.notes || item.Notes || "",
              followUpDate: item.followUpDate || item.FollowUpDate || "",
              priority: item.priority || item.Priority || "Medium",
              qualifiedLead: Boolean(item.qualifiedLead ?? item.QualifiedLead),
              calledBy: item.calledBy || item.CalledBy || "Team Member",
            }));
          } else {
            alert("Error: JSON must be an array of call logs.");
            return;
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim() !== "");
          if (lines.length <= 1) {
            alert("Error: CSV file is empty or missing content.");
            return;
          }

          for (let i = 1; i < lines.length; i++) {
            // Regex handles columns with quoted values and embedded commas
            const cols = lines[i]
              .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
              .map((c) => c.replace(/^"|"$/g, "").trim());

            if (cols.length >= 5) {
              imported.push({
                customerName: cols[0] || "Unknown Customer",
                phone: cols[1] || "",
                email: cols[2] || "",
                status: cols[3] || "Follow-up",
                lastCall: cols[4] || new Date().toISOString(),
                priority: cols[5] || "Medium",
                qualifiedLead: cols[6] === "Yes",
                calledBy: cols[7] || "Team Member",
                notes: cols[8] || "",
                followUpDate: cols[9] || "",
              });
            }
          }
        }

        if (imported.length > 0) {
          setLoading(true);
          setApiError("");
          let successCount = 0;
          for (const item of imported) {
            try {
              const response = await fetch(API_URL, {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(convertToApiCallLog(item)),
              });
              if (response.ok) {
                successCount++;
              }
            } catch (err) {
              console.error("Failed to import call log item:", item, err);
            }
          }
          triggerToast(`Successfully imported ${successCount} records to backend!`);
          await fetchCallLogs();
        }
      } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to parse file. Make sure file format matches template/schema.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  // Export as PDF Report (custom formatted table matching browser layout and showing notes)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Document Metadata / Page Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(67, 56, 202); // Premium Indigo color (#4338ca)
      doc.text("SHYAM AGRO TOOLS", 14, 20);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("CRM CALL HISTORY & FOLLOW-UPS REPORT", 14, 26);
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 32);

      // Top divider bar
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      // Key Metrics summary grid block
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 40, 182, 12, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Call Logs: ${metrics.total}`, 18, 48);
      doc.setTextColor(220, 38, 38); // Red for today followups
      doc.text(`Today Followups Due: ${metrics.followUpsDue}`, 70, 48);
      doc.setTextColor(109, 40, 217); // Purple for qualified leads
      doc.text(`Qualified Leads: ${metrics.qualifiedLeads}`, 135, 48);

      doc.line(14, 56, 196, 56);

      // Draw PDF Table Headers
      let y = 64;
      doc.setFillColor(238, 242, 255); // Indigo light bg
      doc.rect(14, y - 4, 182, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(67, 56, 202);
      doc.text("Customer & Rep", 16, y);
      doc.text("Phone", 52, y);
      doc.text("Status", 76, y);
      doc.text("Priority", 100, y);
      doc.text("Last Call Date", 118, y);
      doc.text("Notes Summary", 148, y);

      doc.setDrawColor(199, 210, 254);
      doc.line(14, y + 3, 196, y + 3);
      y += 8;

      // Draw Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      processedRows.forEach((item, index) => {
        const customerInfo = `${item.customerName || "Unknown"}${
          item.isTodayFollowUp ? " *TODAY*" : ""
        }\nby: ${item.calledBy || "System"}`;
        
        const customerLines = doc.splitTextToSize(customerInfo, 33);
        const phoneLines = doc.splitTextToSize(item.phone || "-", 22);
        const statusLines = doc.splitTextToSize(item.status || "-", 22);
        const priorityLines = doc.splitTextToSize(item.priority || "Medium", 15);
        const dateLines = doc.splitTextToSize(formatDateTime(item.lastCall), 28);
        
        const notesStr = item.notes || "-";
        const notesLines = doc.splitTextToSize(notesStr, 45);

        // Find largest block height for this row
        const lineCount = Math.max(
          customerLines.length,
          phoneLines.length,
          statusLines.length,
          priorityLines.length,
          dateLines.length,
          notesLines.length
        );

        const rowHeight = lineCount * 3.8 + 5; // spacing with paddings

        // Page boundary check
        if (y + rowHeight > 280) {
          doc.addPage();
          y = 25;
          // Redraw headers on new page
          doc.setFillColor(238, 242, 255);
          doc.rect(14, y - 4, 182, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(67, 56, 202);
          doc.text("Customer & Rep", 16, y);
          doc.text("Phone", 52, y);
          doc.text("Status", 76, y);
          doc.text("Priority", 100, y);
          doc.text("Last Call Date", 118, y);
          doc.text("Notes Summary", 148, y);
          
          doc.setDrawColor(199, 210, 254);
          doc.line(14, y + 3, 196, y + 3);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
        }

        // Zebra striping rows
        if (index % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y - 3, 182, rowHeight, "F");
        }

        // Print wrapped cell text
        doc.text(customerLines, 16, y);
        doc.text(phoneLines, 52, y);
        doc.text(statusLines, 76, y);
        doc.text(priorityLines, 100, y);
        doc.text(dateLines, 118, y);
        doc.text(notesLines, 148, y);

        // Row bottom line
        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + rowHeight - 3, 196, y + rowHeight - 3);

        y += rowHeight;
      });

      doc.save(`Call-History-Report-${new Date().toISOString().split("T")[0]}.pdf`);
      triggerToast("Call history report exported as PDF!");
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to export PDF. Ensure input fields contain valid text characters.");
    }
  };

  return (
    <div className="call-history-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-alert ${toastType}`}>
          {toastType === "success" && <FiCheckCircle />}
          {toastType === "error" && <FiAlertCircle />}
          {toastType === "info" && <FiClock />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="call-history-header-card">
        <div className="header-meta">
          <p className="eyebrow">Agro CRM Portal</p>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            Call Logs & Follow-ups
            {loading && <span className="loading-spinner-small"></span>}
          </h1>
          <p className="subtitle">
            Track client calls, schedule future callbacks, and log communication notes for your agricultural field reps.
          </p>
          {apiError && (
            <p className="api-error-text" style={{ color: "#dc2626", marginTop: "8px", fontWeight: "500" }}>
              {apiError}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="simulator-btn" onClick={openSimulator}>
            <FiPlay /> Simulate Call
          </button>
          <button type="button" className="primary-btn" onClick={openAddModal}>
            <FiPlus /> Add Log
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <section className="metric-grid four-up">
        <article className="metric-card accent-blue">
          <div className="metric-body">
            <span>Total Calls</span>
            <strong>{metrics.total}</strong>
            <small>All logged calls</small>
          </div>
        </article>
        <article className="metric-card accent-red">
          <div className="metric-body">
            <span>Today Follow-ups</span>
            <strong>{metrics.followUpsDue}</strong>
            <small>Due calendar today</small>
          </div>
        </article>
        <article className="metric-card accent-yellow">
          <div className="metric-body">
            <span>Total Follow-ups</span>
            <strong>{metrics.pendingFollowUps}</strong>
            <small>All callbacks scheduled</small>
          </div>
        </article>
        <article className="metric-card accent-purple">
          <div className="metric-body">
            <span>Qualified Leads</span>
            <strong>{metrics.qualifiedLeads}</strong>
            <small>Marked as sales ready</small>
          </div>
        </article>
      </section>

      {/* Main Table Panel */}
      <section className="panel-card">
        <div className="panel-topbar">
          <div className="panel-info">
            <p className="eyebrow">Call Ledger</p>
            <h2>Communication History</h2>
          </div>
          <div className="panel-actions">
            {/* Search */}
            <div className="control-box search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search customers, notes or team..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Filter Status */}
            <div className="control-box filter-select">
              <FiFilter />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {statusOptions.filter(o => o !== "All").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Priority */}
            <div className="control-box filter-select">
              <FiSliders />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All Priorities</option>
                {priorityOptions.filter(p => p !== "All").map((priority) => (
                  <option key={priority} value={priority}>
                    {priority} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Import / Export Action Group */}
            <div className="import-export-group">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => importInputRef.current?.click()}
                title="Import call data from JSON or CSV"
              >
                <FiUpload /> Import
              </button>
              <input
                type="file"
                ref={importInputRef}
                style={{ display: "none" }}
                accept=".json,.csv"
                onChange={handleImportFile}
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={handleExportPDF}
                title="Export report as styled PDF document"
              >
                <FiDownload /> Export PDF
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={handleExportJSON}
                title="Export database as JSON"
              >
                JSON Data
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={handleExportCSV}
                title="Export data as CSV spreadsheet"
              >
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Call Ledger Table */}
        <div className="table-wrap">
          <table className="call-history-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Call</th>
                <th>Priority</th>
                <th>Notes Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedRows.length > 0 ? (
                processedRows.map((item) => (
                  <tr key={item.id} className={item.isTodayFollowUp ? "today-highlight-row" : ""}>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar-pill">
                          <FiUser />
                        </span>
                        <div>
                          <div className="name-and-tag">
                            <strong className="cust-name">{item.customerName || "Unknown Customer"}</strong>
                            {item.isTodayFollowUp && (
                              <span className="today-followup-tag">Today Follow-up</span>
                            )}
                          </div>
                          <small className="called-by-text">
                            Called by <strong>{item.calledBy || "System"}</strong>
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="phone-cell">{item.phone || "-"}</td>
                    <td className="email-cell">{item.email || "-"}</td>
                    <td>
                      <span
                        className={`status-pill ${String(item.status || "")
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {item.status || "Follow-up"}
                      </span>
                    </td>
                    <td className="date-cell">{formatDateTime(item.lastCall)}</td>
                    <td>
                      <span className={`priority-pill ${(item.priority || "Medium").toLowerCase()}`}>
                        {item.priority || "Medium"}
                      </span>
                    </td>
                    <td className="notes-cell">
                      <div className="notes-content" title={item.notes}>
                        {item.notes || "-"}
                      </div>
                      {item.status === "Follow-up" && item.followUpDate && (
                        <div className="followup-time-hint">
                          Callback: {formatDateTime(item.followUpDate)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-group">
                        {item.phone && (
                          <>
                            <a
                              href={`tel:${item.phone}`}
                              className="icon-btn call"
                              title={`Call ${item.customerName}`}
                            >
                              <FiPhone />
                            </a>
                            <a
                              href={`https://wa.me/${item.phone.replace(/\D/g, "")}`}
                              className="icon-btn whatsapp"
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp Chat"
                            >
                              <FiMessageSquare />
                            </a>
                          </>
                        )}
                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="icon-btn email"
                            title="Compose Email"
                          >
                            <FiMail />
                          </a>
                        )}
                        <button
                          type="button"
                          className="icon-btn edit"
                          title="Edit Log Details"
                          onClick={() => editCall(item)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          title="Delete Call Log"
                          onClick={() => deleteCall(item.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-table-message">
                    No communication records match the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manual Add/Edit Call Log Modal */}
      {showModal && (
        <div className="call-modal-overlay">
          <div className="call-modal">
            <div className="call-modal-header">
              <h2>{isEditMode ? "Edit Call Record" : "Log Manual Call Details"}</h2>
              <button
                type="button"
                className="icon-btn close-modal-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form className="call-form" onSubmit={saveCall}>
              <label>
                Customer Name
                <input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleFormChange}
                  placeholder="e.g. Balaji Rao"
                  required
                />
              </label>
              <label>
                Phone Number
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="10-digit mobile"
                  required
                />
              </label>
              <label>
                Email Address
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="customer@domain.com"
                />
              </label>
              <label>
                Called By (Team Representative)
                <select
                  name="calledBy"
                  value={formData.calledBy}
                  onChange={handleFormChange}
                >
                  {MOCK_TEAM_MEMBERS.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Call Date & Time
                <input
                  type="datetime-local"
                  name="lastCall"
                  value={formData.lastCall}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Priority Rank
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
              <label>
                Status Result
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="Follow-up">Follow-up Needed</option>
                  <option value="Completed">Completed / Answered</option>
                  <option value="Qualified">Qualified Lead</option>
                  <option value="Pending">Pending / No Answer</option>
                </select>
              </label>
              {formData.status === "Follow-up" && (
                <label>
                  Scheduled Follow-up Date
                  <input
                    type="datetime-local"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleFormChange}
                    required
                  />
                </label>
              )}
              <div className="checkbox-wrap full-width">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    name="qualifiedLead"
                    checked={formData.qualifiedLead}
                    onChange={handleFormChange}
                  />
                  <span>Mark customer as Qualified Sales Lead</span>
                </label>
              </div>
              <label className="full-width">
                Detailed Discussion Notes
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Record summary of customer response, objections, items of interest, and next steps..."
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {isEditMode ? "Save Changes" : "Record Call Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialer & Call Simulator Modal */}
      {showSimulator && (
        <div className="call-modal-overlay">
          <div className="call-modal simulator-modal-panel">
            <div className="call-modal-header">
              <h2>Call Flow Simulator</h2>
              <button
                type="button"
                className="icon-btn close-modal-btn"
                onClick={closeSimulator}
                aria-label="Close simulator"
              >
                <FiX />
              </button>
            </div>

            <div className="simulator-container">
              {/* SELECT CUSTOMER & REP STATE */}
              {simulatorState === "select" && (
                <div className="sim-step select-step">
                  <p className="sim-description">
                    Select a customer contact to dial and designate the active team representative.
                  </p>

                  <div className="sim-form-row">
                    <label>
                      Team Member Placing Call
                      <select
                        value={selectedSimCaller}
                        onChange={(e) => setSelectedSimCaller(e.target.value)}
                      >
                        {MOCK_TEAM_MEMBERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="cust-select-mode-toggle">
                    <button
                      type="button"
                      className={`mode-btn ${!isCustomCustomer ? "active" : ""}`}
                      onClick={() => setIsCustomCustomer(false)}
                    >
                      Choose Existing Contact
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${isCustomCustomer ? "active" : ""}`}
                      onClick={() => setIsCustomCustomer(true)}
                    >
                      Dial Custom Number
                    </button>
                  </div>

                  {!isCustomCustomer ? (
                    <div className="sim-form-row">
                      <label>
                        Select Customer Target
                        <select
                          value={selectedSimCustIndex}
                          onChange={(e) => setSelectedSimCustIndex(Number(e.target.value))}
                        >
                          {MOCK_CUSTOMERS.map((cust, idx) => (
                            <option key={idx} value={idx}>
                              {cust.name} ({cust.phone})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="sim-custom-inputs">
                      <label>
                        Customer Name
                        <input
                          type="text"
                          value={customCustName}
                          onChange={(e) => setCustomCustName(e.target.value)}
                          placeholder="e.g. Ramesh Patel"
                        />
                      </label>
                      <label>
                        Phone Number
                        <input
                          type="text"
                          value={customCustPhone}
                          onChange={(e) => setCustomCustPhone(e.target.value)}
                          placeholder="e.g. +91 99887 76655"
                        />
                      </label>
                      <label>
                        Email (Optional)
                        <input
                          type="email"
                          value={customCustEmail}
                          onChange={(e) => setCustomCustEmail(e.target.value)}
                          placeholder="e.g. customer@agro.com"
                        />
                      </label>
                    </div>
                  )}

                  <div className="sim-footer">
                    <button
                      type="button"
                      className="primary-btn dial-action-btn"
                      onClick={startSimulatedCall}
                    >
                      <FiPhone className="phone-icon-animated" /> Dial Outbound Call
                    </button>
                  </div>
                </div>
              )}

              {/* CALL ACTIVE / CALLING STATE */}
              {simulatorState === "calling" && (
                <div className="sim-step calling-step">
                  <div className="calling-animation-circle">
                    <FiPhone className="ringing-phone-icon" />
                    <div className="pulse-ring ring-1"></div>
                    <div className="pulse-ring ring-2"></div>
                  </div>

                  <h3>
                    {!isCustomCustomer
                      ? MOCK_CUSTOMERS[selectedSimCustIndex].name
                      : customCustName}
                  </h3>
                  <p className="calling-number">
                    {!isCustomCustomer
                      ? MOCK_CUSTOMERS[selectedSimCustIndex].phone
                      : customCustPhone}
                  </p>

                  <div className="timer-text">{formatTimer(callTimer)}</div>
                  <p className="calling-desc">
                    Call in progress: <strong>{selectedSimCaller}</strong> is speaking...
                  </p>

                  {/* Mock voice visualizer */}
                  <div className="audio-wave-visualizer">
                    <span className="wave-bar bar-1"></span>
                    <span className="wave-bar bar-2"></span>
                    <span className="wave-bar bar-3"></span>
                    <span className="wave-bar bar-4"></span>
                    <span className="wave-bar bar-5"></span>
                    <span className="wave-bar bar-6"></span>
                    <span className="wave-bar bar-7"></span>
                  </div>

                  <div className="sim-footer">
                    <button
                      type="button"
                      className="danger-btn disconnect-btn"
                      onClick={endSimulatedCall}
                    >
                      <FiX /> End & Log Call
                    </button>
                  </div>
                </div>
              )}

              {/* CALL LOGGING STATE */}
              {simulatorState === "log" && (
                <div className="sim-step log-step">
                  <h3>Log Call Outcome</h3>
                  <p className="log-summary-caption">
                    Outgoing call summary between <strong>{selectedSimCaller}</strong> and{" "}
                    <strong>
                      {!isCustomCustomer
                        ? MOCK_CUSTOMERS[selectedSimCustIndex].name
                        : customCustName}
                    </strong>{" "}
                    completed successfully.
                  </p>

                  <div className="sim-form-grid">
                    <label>
                      Call Status
                      <select value={simStatus} onChange={(e) => setSimStatus(e.target.value)}>
                        <option value="Follow-up">Follow-up Needed</option>
                        <option value="Completed">Completed / Handled</option>
                        <option value="Qualified">Qualified Sales Lead</option>
                        <option value="Pending">No Response / Busy</option>
                      </select>
                    </label>

                    <label>
                      Priority Level
                      <select
                        value={simPriority}
                        onChange={(e) => setSimPriority(e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </label>

                    {simStatus === "Follow-up" && (
                      <label className="full-width-mobile">
                        Follow-up Callback Date
                        <input
                          type="datetime-local"
                          value={simFollowUpDate}
                          onChange={(e) => setSimFollowUpDate(e.target.value)}
                          required
                        />
                      </label>
                    )}

                    <div className="checkbox-wrap full-width">
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={simQualified}
                          onChange={(e) => setSimQualified(e.target.checked)}
                        />
                        <span>Confirm as Qualified Sales Lead</span>
                      </label>
                    </div>

                    <label className="full-width">
                      Detailed Call Notes
                      <textarea
                        value={simNotes}
                        onChange={(e) => setSimNotes(e.target.value)}
                        rows="3"
                        placeholder="Detail what was discussed, price questions, soil type, crop types, orders, complaints etc."
                      />
                    </label>
                  </div>

                  <div className="sim-footer">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setSimulatorState("select")}
                    >
                      Redial
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={saveSimulatedCall}
                    >
                      Save Call to Ledger
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallHistory;
