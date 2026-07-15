import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiUpload } from "react-icons/fi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./Dashboard.css";

const API_BASE_URL = "http://shyamagrotools.com/api";

function Dashboard() {
  const navigate = useNavigate();

  const [selectedPeriod, setSelectedPeriod] = useState("Jan - Apr");
  const [showCustomersTable, setShowCustomersTable] = useState(false);
  const [showActivitiesTable, setShowActivitiesTable] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [activitySearchTerm, setActivitySearchTerm] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [contactsData, setContactsData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const customerFileInputRef = useRef(null);
  const activityFileInputRef = useRef(null);

  const fallbackGrowthData = [
    { month: "Jan", customers: 4000 },
    { month: "Feb", customers: 5200 },
    { month: "Mar", customers: 4800 },
    { month: "Apr", customers: 6100 },
    { month: "May", customers: 7200 },
    { month: "Jun", customers: 6800 },
    { month: "Jul", customers: 7900 },
    { month: "Aug", customers: 8300 },
    { month: "Sep", customers: 9100 },
    { month: "Oct", customers: 8700 },
    { month: "Nov", customers: 9600 },
    { month: "Dec", customers: 11000 },
  ];

  const periods = [
    {
      name: "Jan - Apr",
      value: 33.33,
      color: "#2563eb",
      months: [
        { month: "Jan", sales: "₹8L" },
        { month: "Feb", sales: "₹7L" },
        { month: "Mar", sales: "₹9L" },
        { month: "Apr", sales: "₹6L" },
      ],
    },
    {
      name: "May - Aug",
      value: 33.33,
      color: "#22c55e",
      months: [
        { month: "May", sales: "₹10L" },
        { month: "Jun", sales: "₹8L" },
        { month: "Jul", sales: "₹11L" },
        { month: "Aug", sales: "₹9L" },
      ],
    },
    {
      name: "Sep - Dec",
      value: 33.34,
      color: "#f59e0b",
      months: [
        { month: "Sep", sales: "₹7L" },
        { month: "Oct", sales: "₹10L" },
        { month: "Nov", sales: "₹12L" },
        { month: "Dec", sales: "₹13L" },
      ],
    },
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiError("");

      const [dashboardResponse, contactsResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/Dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }),
        fetch(`${API_BASE_URL}/Contacts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }),
      ]);

      if (dashboardResponse.status === "fulfilled" && dashboardResponse.value.ok) {
        const dashboardResult = await dashboardResponse.value.json();
        setDashboardData(dashboardResult);
      }

      if (contactsResponse.status === "fulfilled" && contactsResponse.value.ok) {
        const contactsResult = await contactsResponse.value.json();
        setContactsData(Array.isArray(contactsResult) ? contactsResult : []);
      }
    } catch (error) {
      console.error("Dashboard API Error:", error);
      setApiError("Some dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateValue) => {
    if (!dateValue) return "No activity";

    const currentDate = new Date();
    const activityDate = new Date(dateValue);
    const difference = currentDate - activityDate;
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const apiCustomers = contactsData.map((contact) => ({
    id: contact.contactId,
    name: contact.contactName || "Unknown",
    email: contact.emailAddress || "No email",
    type: "Contact",
    status: contact.contactStatus || "New",
    followUp: formatDate(contact.callbackDate),
    source: contact.callbackStatus || "Scheduled",
    assignedTo: contact.assignedTo || "Admin",
    owner: contact.assignedTo || "Admin",
    lastActivity: getDaysAgo(contact.callbackDate),
    createdDate: contact.contactId || 0,
  }));

  const recentCustomers =
    apiCustomers.length > 0
      ? [...apiCustomers].sort((a, b) => b.createdDate - a.createdDate)
      : dashboardData?.recentCustomers || dashboardData?.latestCustomers || [];

  const inactiveCustomers =
    apiCustomers.length > 0
      ? apiCustomers.filter((customer) => {
          const status = (customer.status || "").toLowerCase();
          const source = (customer.source || "").toLowerCase();

          return (
            status === "inactive" ||
            status === "rejected" ||
            status === "closed" ||
            source === "missed" ||
            customer.lastActivity === "No activity"
          );
        })
      : dashboardData?.inactiveCustomers ||
        dashboardData?.noActivityCustomers ||
        [];

  const growthData =
    dashboardData?.growthData ||
    dashboardData?.customerGrowth ||
    fallbackGrowthData;

  const totalCustomers = contactsData.length || dashboardData?.totalCustomers || "0";
  const totalTickets = dashboardData?.totalTickets || dashboardData?.ticketCount || "0";
  const totalInvoices =
    dashboardData?.totalInvoices || dashboardData?.invoiceCount || "0";

  const selectedData = periods.find((period) => period.name === selectedPeriod);

  const statsCards = [
    {
      title: "Customers",
      value: totalCustomers,
      icon: "👥",
      growth: "+12%",
      path: "/customers",
      accent: "#2563eb",
      note: "Live CRM customers",
    },
    {
      title: "Tickets",
      value: totalTickets,
      icon: "🎫",
      growth: "+8%",
      path: "/tickets",
      accent: "#8b5cf6",
      note: "Open support queue",
    },
    {
      title: "Invoices",
      value: totalInvoices,
      icon: "🧾",
      growth: "+10%",
      path: "/invoice",
      accent: "#f59e0b",
      note: "Ready for collection",
    },
  ];

  const filteredRecentCustomers = recentCustomers.filter((customer) => {
    const search = customerSearchTerm.toLowerCase();

    return (
      (customer.name || "").toLowerCase().includes(search) ||
      (customer.email || "").toLowerCase().includes(search) ||
      (customer.type || "").toLowerCase().includes(search) ||
      (customer.status || "").toLowerCase().includes(search) ||
      (customer.source || "").toLowerCase().includes(search) ||
      (customer.assignedTo || "").toLowerCase().includes(search)
    );
  });

  const filteredInactiveCustomers = inactiveCustomers.filter((customer) => {
    const search = activitySearchTerm.toLowerCase();

    return (
      (customer.name || "").toLowerCase().includes(search) ||
      (customer.email || "").toLowerCase().includes(search) ||
      (customer.owner || "").toLowerCase().includes(search) ||
      (customer.status || "").toLowerCase().includes(search) ||
      (customer.lastActivity || "").toLowerCase().includes(search)
    );
  });

  const exportCSV = (filename, headers, rows) => {
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleCustomerExport = () => {
    const headers = [
      "Name",
      "Email",
      "Type",
      "Status",
      "Next Follow-up",
      "Source",
      "Assigned To",
    ];

    const rows = recentCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.type,
      customer.status,
      customer.followUp,
      customer.source,
      customer.assignedTo,
    ]);

    exportCSV("recent-customers.csv", headers, rows);
  };

  const handleActivityExport = () => {
    const headers = ["Name", "Email", "Status", "Assigned To", "Last Activity"];

    const rows = inactiveCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.status,
      customer.owner,
      customer.lastActivity,
    ]);

    exportCSV("no-activity-customers.csv", headers, rows);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];

    if (file) {
      alert(`Selected file: ${file.name}`);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome to SHYAM AGRO TOOLS CRM</h1>

        {loading && <p>Loading dashboard data...</p>}

        {apiError && (
          <p style={{ color: "#dc2626", marginTop: "8px", fontSize: "14px" }}>
            {apiError}
          </p>
        )}
      </div>

      <div className="dashboard-stats-grid">
        {statsCards.map((card) => (
          <div
            className="stats-card"
            key={card.title}
            onClick={() => navigate(card.path)}
            style={{ borderTopColor: card.accent || "#2563eb" }}
          >
            <div className="stats-top">
              <div>
                <p>{card.title}</p>
                <h2>{card.value}</h2>
              </div>

              <div className="stats-icon">{card.icon}</div>
            </div>

            <div className="stats-meta">
              <span className="stats-growth">{card.growth} from last month</span>
              <span className="stats-note">{card.note}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts-grid">
        <div className="growth-chart-card">
          <h2>Customer Growth</h2>

          <ResponsiveContainer width="100%" height={390}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "#6b7280" }}
              />

              <YAxis tickLine={false} axisLine={{ stroke: "#6b7280" }} />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="customers"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{
                  r: 7,
                  fill: "#ffffff",
                  stroke: "#2563eb",
                  strokeWidth: 4,
                }}
                activeDot={{
                  r: 8,
                  fill: "#ffffff",
                  stroke: "#2563eb",
                  strokeWidth: 4,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="yearly-sales-card">
          <div className="yearly-sales-header">
            <div>
              <h2>Yearly Sales</h2>
              <p>Sales overview for 2025</p>
            </div>

            <span className="year-badge">2025</span>
          </div>

          <div className="yearly-sales-content">
            <div className="yearly-pie-box">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={periods}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={3}
                    onClick={(data) => setSelectedPeriod(data.name)}
                  >
                    {periods.map((period) => (
                      <Cell
                        key={period.name}
                        fill={period.color}
                        className="pie-slice"
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="pie-center-year">
                <h1>2025</h1>
                <p>{selectedPeriod}</p>
              </div>
            </div>

            <div className="period-legend">
              {periods.map((period) => (
                <button
                  key={period.name}
                  className={
                    selectedPeriod === period.name
                      ? "period-chip active"
                      : "period-chip"
                  }
                  onClick={() => setSelectedPeriod(period.name)}
                >
                  <span style={{ backgroundColor: period.color }}></span>
                  {period.name}
                </button>
              ))}
            </div>

            <div className="monthly-sales-box">
              <h3>{selectedPeriod} Sales</h3>

              <div className="month-sales-grid">
                {selectedData.months.map((item) => (
                  <div className="month-sales-item" key={item.month}>
                    <p>{item.month}</p>
                    <h4>{item.sales}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="dashboard-list-card">
          <div className="dashboard-list-header">
            <div className="dashboard-list-title">
              <span className="list-icon blue">👥</span>
              <h2>Recently Added Customers</h2>
            </div>

            <button
              className="view-link"
              onClick={() => setShowCustomersTable(true)}
            >
              View all
            </button>
          </div>

          <div className="dashboard-list-body">
            {recentCustomers.length > 0 ? (
              recentCustomers.slice(0, 4).map((customer) => (
                <div className="customer-list-row" key={customer.id}>
                  <div>
                    <h4>{customer.name}</h4>
                    <p>{customer.email}</p>
                  </div>

                  <span className="source-pill">{customer.source}</span>

                  <span
                    className={`status-pill ${(customer.status || "").toLowerCase()}`}
                  >
                    {customer.status}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b7280", padding: "12px" }}>
                No recent customers found
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-list-card">
          <div className="dashboard-list-header">
            <div className="dashboard-list-title">
              <span className="list-icon warning">⚠️</span>
              <h2>No Activity</h2>
            </div>

            <button
              className="view-link"
              onClick={() => setShowActivitiesTable(true)}
            >
              View all
            </button>
          </div>

          <div className="dashboard-list-body">
            {inactiveCustomers.length > 0 ? (
              inactiveCustomers.slice(0, 4).map((customer) => (
                <div className="inactive-list-row" key={customer.id}>
                  <div>
                    <h4>{customer.name}</h4>

                    <p>
                      {customer.email}
                      <span> · {customer.owner}</span>
                    </p>
                  </div>

                  <span
                    className={`status-pill ${(customer.status || "").toLowerCase()}`}
                  >
                    {customer.status}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b7280", padding: "12px" }}>
                No inactive customers found
              </p>
            )}
          </div>
        </div>
      </div>

      {showCustomersTable && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-table-modal">
            <div className="dashboard-modal-header">
              <div>
                <h2>Recently Added Customers</h2>
                <p>{filteredRecentCustomers.length} total customers</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowCustomersTable(false)}
              >
                ×
              </button>
            </div>

            <div className="dashboard-table-toolbar">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />

              <button
                className="toolbar-action-btn"
                onClick={handleCustomerExport}
              >
                <FiDownload />
                Export
              </button>

              <button
                className="toolbar-action-btn"
                onClick={() => customerFileInputRef.current.click()}
              >
                <FiUpload />
                Import
              </button>

              <input
                type="file"
                ref={customerFileInputRef}
                onChange={handleImportFile}
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
              />
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Next Follow-up</th>
                    <th>Source</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecentCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="table-customer-cell">
                          <div className="table-avatar">
                            {(customer.name || "C").charAt(0)}
                          </div>

                          <div>
                            <h4>{customer.name}</h4>
                            <p>{customer.email}</p>
                          </div>
                        </div>
                      </td>

                      <td>{customer.type}</td>

                      <td>
                        <span
                          className={`status-pill ${(customer.status || "").toLowerCase()}`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      <td>{customer.followUp}</td>
                      <td>{customer.source}</td>
                      <td>{customer.assignedTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-table-footer">
              Showing {filteredRecentCustomers.length} results
            </div>
          </div>
        </div>
      )}

      {showActivitiesTable && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-table-modal">
            <div className="dashboard-modal-header">
              <div>
                <h2>No Activity Customers</h2>
                <p>Inactive, closed, missed or no activity contacts</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowActivitiesTable(false)}
              >
                ×
              </button>
            </div>

            <div className="dashboard-table-toolbar compact-toolbar">
              <input
                type="text"
                placeholder="Search customers..."
                value={activitySearchTerm}
                onChange={(e) => setActivitySearchTerm(e.target.value)}
              />

              <button
                className="toolbar-action-btn"
                onClick={handleActivityExport}
              >
                <FiDownload />
                Export
              </button>

              <button
                className="toolbar-action-btn"
                onClick={() => activityFileInputRef.current.click()}
              >
                <FiUpload />
                Import
              </button>

              <input
                type="file"
                ref={activityFileInputRef}
                onChange={handleImportFile}
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
              />
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInactiveCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="table-customer-cell">
                          <div className="table-avatar">
                            {(customer.name || "C").charAt(0)}
                          </div>

                          <div>
                            <h4>{customer.name}</h4>
                            <p>{customer.email}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${(customer.status || "").toLowerCase()}`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      <td>{customer.owner}</td>
                      <td>{customer.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-table-footer">
              Showing {filteredInactiveCustomers.length} results
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;