import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronDown,
  FiDownload,
  FiEdit,
  FiEye,
  FiMapPin,
  FiPhone,
  FiTrash2,
  FiUpload,
  FiUser,
} from "react-icons/fi";

import "./Customers.css";

const API_BASE_URL = "http://shyamagrotools.com/api";
const CUSTOMER_API = {
  list: `${API_BASE_URL}/Customers`,
  byId: (id) => `${API_BASE_URL}/Customers/${id}`,
  add: `${API_BASE_URL}/Customers`,
  update: (id) => `${API_BASE_URL}/Customers/${id}`,
  delete: (id) => `${API_BASE_URL}/Customers/${id}`,
  search: (keyword) =>
    `${API_BASE_URL}/Customers?search=${encodeURIComponent(keyword)}`,
  exportTemplate: `${API_BASE_URL}/Customers/export-template`,
  exportFullData: `${API_BASE_URL}/Customers/export-full-data`,
  import: `${API_BASE_URL}/Customers/import`,
  advisory: (id) => `${API_BASE_URL}/Customers/${id}/advisory`,
};

const initialFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  district: "",
  state: "",
  status: "Active",
  soilType: "Red Sandy",
  cropType: "",
  farmSizeAcres: "",
  irrigationSource: "Drip",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // View customer details modal state
  const [viewingCustomer, setViewingCustomer] = useState(null);

  // Advisory Log Form state
  const [advisoryText, setAdvisoryText] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submittingAdvisory, setSubmittingAdvisory] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const customersPerPage = 6;
  const importInputRef = useRef(null);

  const apiHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    }),
    []
  );

  const apiFileHeaders = useMemo(
    () => ({
      "ngrok-skip-browser-warning": "true",
    }),
    []
  );

  const normalizeCustomer = (customer) => {
    return {
      id: customer.id || 0,
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      district: customer.district || "",
      state: customer.state || "",
      status: customer.status || "Active",
      soilType: customer.agrarianProfile?.soilType || "",
      cropType: customer.agrarianProfile?.cropType || "",
      farmSizeAcres: customer.agrarianProfile?.farmSizeAcres !== undefined ? String(customer.agrarianProfile.farmSizeAcres) : "",
      irrigationSource: customer.agrarianProfile?.irrigationSource || "",
      advisories: customer.advisories || [],
      orders: customer.orders || [],
    };
  };

  const convertToApiCustomer = (customer) => {
    return {
      id: Number(customer.id) || 0,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      district: customer.district || "",
      state: customer.state || "",
      status: customer.status || "Active",
      agrarianProfile: {
        soilType: customer.soilType || "",
        cropType: customer.cropType || "",
        farmSizeAcres: customer.farmSizeAcres ? parseFloat(customer.farmSizeAcres) : 0,
        irrigationSource: customer.irrigationSource || "Drip",
      },
    };
  };

  const downloadFromApi = async (url, fallbackFilename) => {
    try {
      setApiError("");
      const response = await fetch(url, {
        method: "GET",
        headers: apiFileHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to download export file");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/i)?.[1] || fallbackFilename;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Customer Export Error:", error);
      setApiError("Unable to export customer file.");
    }
  };

  const handleExport = async (mode) => {
    setShowExportMenu(false);
    if (mode === "template") {
      await downloadFromApi(CUSTOMER_API.exportTemplate, "customer-template.xlsx");
      return;
    }

    await downloadFromApi(CUSTOMER_API.exportFullData, "customers-full-data.xlsx");
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);
      setApiError("");

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", file);

      const response = await fetch(CUSTOMER_API.import, {
        method: "POST",
        headers: apiFileHeaders,
        body: formDataToUpload,
      });

      if (!response.ok) {
        throw new Error("Failed to import customers");
      }

      await fetchCustomers();
      setCurrentPage(1);
    } catch (error) {
      console.error("Import Error:", error);
      setApiError("Unable to import customer file. Please use the API template.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const fetchCustomers = useCallback(async (keyword = "") => {
    try {
      setLoading(true);
      setApiError("");

      const requestUrl = keyword.trim()
        ? CUSTOMER_API.search(keyword.trim())
        : CUSTOMER_API.list;

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      const formattedCustomers = Array.isArray(data)
        ? data.map(normalizeCustomer)
        : [];

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error("GET Customers Error:", error);
      setApiError("Unable to load customers from API.");
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  const fetchCustomerById = async (id) => {
    try {
      setApiError("");

      const response = await fetch(CUSTOMER_API.byId(id), {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customer details");
      }

      const data = await response.json();

      return normalizeCustomer(data);
    } catch (error) {
      console.error("GET Customer By ID Error:", error);
      setApiError("Unable to load selected customer details.");
      return null;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      fetchCustomers(searchTerm);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(searchTimer);
  }, [fetchCustomers, searchTerm]);

  useEffect(() => {
    if (isEditMode && editingCustomer) {
      setFormData({
        id: editingCustomer.id,
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        email: editingCustomer.email,
        address: editingCustomer.address,
        district: editingCustomer.district,
        state: editingCustomer.state,
        status: editingCustomer.status,
        soilType: editingCustomer.soilType || "Red Sandy",
        cropType: editingCustomer.cropType,
        farmSizeAcres: editingCustomer.farmSizeAcres,
        irrigationSource: editingCustomer.irrigationSource || "Drip",
      });
    } else {
      setFormData(initialFormData);
    }

    setErrors({});
  }, [isEditMode, editingCustomer, showModal]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const pendingCustomers = customers.filter(
    (customer) => customer.status === "Pending"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status === "Inactive"
  ).length;

  const filteredCustomers =
    searchTerm.trim() === ""
      ? customers
      : customers.filter((customer) => {
          const search = searchTerm.toLowerCase();

          return (
            (customer.name || "").toLowerCase().includes(search) ||
            (customer.phone || "").toLowerCase().includes(search) ||
            (customer.email || "").toLowerCase().includes(search) ||
            (customer.address || "").toLowerCase().includes(search) ||
            (customer.district || "").toLowerCase().includes(search) ||
            (customer.state || "").toLowerCase().includes(search) ||
            (customer.soilType || "").toLowerCase().includes(search) ||
            (customer.cropType || "").toLowerCase().includes(search) ||
            (customer.status || "").toLowerCase().includes(search)
          );
        });

  const indexOfLast = currentPage * customersPerPage;
  const indexOfFirst = indexOfLast - customersPerPage;

  const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
    setShowModal(true);
    setErrors({});
    setApiError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
    setErrors({});
  };

  // Handler to open full details view popup
  const handleViewCustomer = async (customer) => {
    const latestCustomer = await fetchCustomerById(customer.id);
    setViewingCustomer(latestCustomer || customer);
    setAdvisoryText("");
    setRecommendation("");
  };

  const handleAddAdvisory = async (e) => {
    e.preventDefault();
    if (!advisoryText.trim() || !recommendation.trim()) {
      alert("Please enter both advisory text and recommendation.");
      return;
    }

    try {
      setSubmittingAdvisory(true);
      const response = await fetch(CUSTOMER_API.advisory(viewingCustomer.id), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          customerId: viewingCustomer.id,
          advisoryText: advisoryText.trim(),
          recommendation: recommendation.trim(),
          staffId: 1, // default staff representation
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post advisory log");
      }

      setAdvisoryText("");
      setRecommendation("");

      // Refresh viewing details
      const latestCustomer = await fetchCustomerById(viewingCustomer.id);
      if (latestCustomer) {
        setViewingCustomer(latestCustomer);
      }
      alert("Advisory log added successfully.");
    } catch (err) {
      console.error(err);
      alert("Could not post advisory log. Please try again.");
    } finally {
      setSubmittingAdvisory(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^\+?[0-9]{10,12}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-12 digit mobile number";
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address/Village is required";
    }

    if (!formData.district.trim()) {
      newErrors.district = "District/City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.farmSizeAcres.toString().trim()) {
      newErrors.farmSizeAcres = "Farm size is required";
    } else if (isNaN(Number(formData.farmSizeAcres)) || Number(formData.farmSizeAcres) < 0) {
      newErrors.farmSizeAcres = "Enter a valid positive number";
    }

    if (!formData.soilType.trim()) {
      newErrors.soilType = "Soil type is required";
    }

    if (!formData.cropType.trim()) {
      newErrors.cropType = "Crop type is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const addCustomer = async (newCustomer) => {
    try {
      setApiError("");

      const response = await fetch(CUSTOMER_API.add, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiCustomer(newCustomer)),
      });

      if (!response.ok) {
        throw new Error("Failed to add customer");
      }

      await fetchCustomers();
      closeModal();
    } catch (error) {
      console.error("POST Customer Error:", error);
      setApiError("Unable to add customer.");
    }
  };

  const editCustomer = async (customer) => {
    // If opening editing view from details popup, close the details popup first
    setViewingCustomer(null);
    const latestCustomer = await fetchCustomerById(customer.id);

    setEditingCustomer(latestCustomer || customer);
    setIsEditMode(true);
    setShowModal(true);
    setErrors({});
  };

  const updateCustomer = async (updatedCustomer) => {
    try {
      setApiError("");

      const response = await fetch(CUSTOMER_API.update(updatedCustomer.id), {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify(convertToApiCustomer(updatedCustomer)),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer");
      }

      await fetchCustomers();
      closeModal();
    } catch (error) {
      console.error("PUT Customer Error:", error);
      setApiError("Unable to update customer.");
    }
  };

  const deleteCustomer = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setApiError("");

      const response = await fetch(CUSTOMER_API.delete(id), {
        method: "DELETE",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      await fetchCustomers();
    } catch (error) {
      console.error("DELETE Customer Error:", error);
      setApiError("Unable to delete customer.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      await updateCustomer(formData);
    } else {
      await addCustomer(formData);
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-header">
        <h1>Customers</h1>
        <p>
          Manage farmer/customer details, land information, crop details and
          status
        </p>

        {loading && <p>Loading customers...</p>}

        {apiError && (
          <p style={{ color: "#dc2626", marginTop: "8px" }}>{apiError}</p>
        )}
      </div>

      <div className="customer-stats">
        <div className="stats-card">
          <h3>Total Customers</h3>
          <h2>{totalCustomers}</h2>
        </div>

        <div className="stats-card active-card">
          <h3>Active</h3>
          <h2>{activeCustomers}</h2>
        </div>

        <div className="stats-card pending-card">
          <h3>Pending</h3>
          <h2>{pendingCustomers}</h2>
        </div>

        <div className="stats-card inactive-card">
          <h3>Inactive</h3>
          <h2>{inactiveCustomers}</h2>
        </div>
      </div>

      <div className="customer-table-container">
        <div className="table-header">
          <div>
            <h2>Customer Management</h2>
            <p>Track complete customer, address, land and crop details</p>
          </div>
        </div>

        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by name, phone, email, state, or crop..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          <div className="toolbar-actions-group">
            <div className="export-dropdown-wrap">
              <button
                className="secondary-btn"
                onClick={() => setShowExportMenu((prev) => !prev)}
                type="button"
              >
                <FiDownload /> Export <FiChevronDown />
              </button>

              {showExportMenu && (
                <div className="export-dropdown-menu">
                  <button type="button" onClick={() => handleExport("template")}>Template</button>
                  <button type="button" onClick={() => handleExport("full")}>Full data</button>
                </div>
              )}
            </div>

            <button className="secondary-btn" type="button" onClick={() => importInputRef.current?.click()}>
              <FiUpload /> Import
            </button>

            <button className="add-btn" onClick={openAddModal} type="button">
              + Add Customer
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>

        <div className="customer-table-scroll">
          <table className="customer-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Database ID</th>
                <th>Customer Name</th>
                <th>Phone No.</th>
                <th>Email ID</th>
                <th>Address</th>
                <th>Crop Type</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentCustomers.length > 0 ? (
                currentCustomers.map((customer, index) => (
                  <tr key={customer.id || index}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{customer.id || "—"}</td>
                    <td title="Click to view details">
                      <button
                        type="button"
                        className="customer-name-link-btn"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        {customer.name || "Unknown Customer"}
                      </button>
                    </td>
                    <td>{customer.phone || "—"}</td>
                    <td>{customer.email || "—"}</td>
                    <td>
                      {[customer.address, customer.district, customer.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td>
                      <span className="crop-badge">{customer.cropType || "—"}</span>
                    </td>

                    <td>
                      <div className="action-chip-group">
                        <button
                          className="customer-action-btn view"
                          title="View"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <FiEye />
                        </button>
                        <button
                          className="customer-action-btn edit"
                          title="Edit"
                          onClick={() => editCustomer(customer)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="customer-action-btn delete"
                          title="Delete"
                          onClick={() => deleteCustomer(customer.id)}
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
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="customer-pagination">
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

      {viewingCustomer && (
        <div className="modal-overlay">
          <div className="modal-container customer-modal-wide customer-detail-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Customer profile</p>
                <h2>{viewingCustomer.name || "Customer Details"}</h2>
                <p className="subtle-text">A clean view of the customer record, contact details, and agrarian advisory history.</p>
              </div>
              <button className="close-btn" onClick={() => setViewingCustomer(null)}>&times;</button>
            </div>

            <div className="customer-modal-split-layout">
              {/* Left Column: Customer details */}
              <div className="customer-details-pane">
                <section className="customer-detail-card highlight-card">
                  <div className="profile-chip"><FiUser /> Customer overview</div>
                  <div className="detail-stat-row">
                    <span>Database ID</span>
                    <strong>{viewingCustomer.id || "—"}</strong>
                  </div>
                  <div className="detail-stat-row">
                    <span>Status</span>
                    <strong className={`status-badge ${String(viewingCustomer.status || "Active").toLowerCase()}`}>{viewingCustomer.status || "Active"}</strong>
                  </div>
                  <div className="detail-stat-row">
                    <span>Phone</span>
                    <strong>{viewingCustomer.phone || "—"}</strong>
                  </div>
                  <div className="detail-stat-row">
                    <span>Email</span>
                    <strong>{viewingCustomer.email || "—"}</strong>
                  </div>
                </section>

                <section className="customer-detail-card">
                  <div className="profile-chip"><FiMapPin /> Address & location</div>
                  <p className="detail-note">{[viewingCustomer.address, viewingCustomer.district, viewingCustomer.state].filter(Boolean).join(", ") || "No address available"}</p>
                  <div className="detail-grid-2 compact-grid">
                    <div><label>Village/Street</label><p>{viewingCustomer.address || "—"}</p></div>
                    <div><label>District</label><p>{viewingCustomer.district || "—"}</p></div>
                    <div><label>State</label><p>{viewingCustomer.state || "—"}</p></div>
                    <div><label>Primary Contact</label><p>{viewingCustomer.phone || "—"}</p></div>
                  </div>
                </section>

                <section className="customer-detail-card">
                  <div className="profile-chip"><FiPhone /> Agrarian Profile</div>
                  <div className="detail-grid-2 compact-grid">
                    <div><label>Total Land Area</label><p>{viewingCustomer.farmSizeAcres ? `${viewingCustomer.farmSizeAcres} Acres` : "—"}</p></div>
                    <div><label>Soil Type</label><p>{viewingCustomer.soilType || "—"}</p></div>
                    <div><label>Crop Type</label><p>{viewingCustomer.cropType || "—"}</p></div>
                    <div><label>Irrigation Source</label><p>{viewingCustomer.irrigationSource || "—"}</p></div>
                  </div>
                </section>
              </div>

              {/* Right Column: Advisories */}
              <div className="customer-advisories-pane">
                <div className="advisories-header">
                  <h3>Agrarian Advisories</h3>
                  <span className="advisory-count-badge">{(viewingCustomer.advisories || []).length} Logs</span>
                </div>

                <div className="advisory-history-list">
                  {viewingCustomer.advisories && viewingCustomer.advisories.length > 0 ? (
                    viewingCustomer.advisories.map((advisory) => (
                      <div key={advisory.id} className="advisory-log-card">
                        <div className="advisory-card-header">
                          <span className="advisory-card-date">
                            {new Date(advisory.dateCreated).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="staff-badge">Staff #{advisory.staffId}</span>
                        </div>
                        <div className="advisory-card-body">
                          <div className="advisory-field">
                            <label>Observation/Notes:</label>
                            <p>{advisory.advisoryText || "—"}</p>
                          </div>
                          <div className="advisory-field recommendation">
                            <label>Recommendation:</label>
                            <p>{advisory.recommendation || "—"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-advisories">
                      <p>No agronomy advice has been logged for this customer yet.</p>
                    </div>
                  )}
                </div>

                <form className="add-advisory-form" onSubmit={handleAddAdvisory}>
                  <h4>Log New Advisory</h4>
                  <div className="advisory-form-group">
                    <label>Observation / Crop Condition</label>
                    <textarea
                      placeholder="Describe what you observed (e.g. leaf chlorosis, pest infestation, moisture levels)..."
                      value={advisoryText}
                      onChange={(e) => setAdvisoryText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="advisory-form-group">
                    <label>Recommendation / Treatment</label>
                    <textarea
                      placeholder="Specify actions, fertilizer dosage, or treatments recommended..."
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-advisory-btn"
                    disabled={submittingAdvisory}
                  >
                    {submittingAdvisory ? "Logging..." : "Log Advisory Entry"}
                  </button>
                </form>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setViewingCustomer(null)}>Close</button>
              <button type="button" className="save-btn" onClick={() => editCustomer(viewingCustomer)}>Edit customer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Customer Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container customer-modal-wide">
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Customer Details" : "Add New Customer"}</h2>
              <button className="close-btn" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form className="customer-form" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter customer full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error-input" : ""}
                  />
                  {errors.name && (
                    <p className="error-text">{errors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter 10-12 digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "error-input" : ""}
                  />
                  {errors.phone && (
                    <p className="error-text">{errors.phone}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Email ID (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="customer@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "error-input" : ""}
                  />
                  {errors.email && (
                    <p className="error-text">{errors.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group full-span-form-group">
                  <label>Address / Village</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="House number, street, village details"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? "error-input" : ""}
                  />
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>

                <div className="form-group">
                  <label>District / City</label>
                  <input
                    type="text"
                    name="district"
                    placeholder="Enter district or city"
                    value={formData.district}
                    onChange={handleChange}
                    className={errors.district ? "error-input" : ""}
                  />
                  {errors.district && <p className="error-text">{errors.district}</p>}
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state name"
                    value={formData.state}
                    onChange={handleChange}
                    className={errors.state ? "error-input" : ""}
                  />
                  {errors.state && <p className="error-text">{errors.state}</p>}
                </div>

                <div className="form-group">
                  <label>Total Land Area (Acres)</label>
                  <input
                    type="number"
                    name="farmSizeAcres"
                    placeholder="Enter farm size in acres"
                    value={formData.farmSizeAcres}
                    onChange={handleChange}
                    className={errors.farmSizeAcres ? "error-input" : ""}
                  />
                  {errors.farmSizeAcres && (
                    <p className="error-text">{errors.farmSizeAcres}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Soil Type</label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                  >
                    <option value="Red Sandy">Red Sandy</option>
                    <option value="Black Clayey">Black Clayey</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Laterite">Laterite</option>
                  </select>
                  {errors.soilType && (
                    <p className="error-text">{errors.soilType}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Crops Cultivated</label>
                  <input
                    type="text"
                    name="cropType"
                    placeholder="E.g., Wheat, Cotton, Paddy"
                    value={formData.cropType}
                    onChange={handleChange}
                    className={errors.cropType ? "error-input" : ""}
                  />
                  {errors.cropType && (
                    <p className="error-text">{errors.cropType}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Irrigation Source</label>
                  <select
                    name="irrigationSource"
                    value={formData.irrigationSource}
                    onChange={handleChange}
                  >
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler Irrigation</option>
                    <option value="Borewell">Borewell / Tube Well</option>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Canal">Canal</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-btn">
                  {isEditMode ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
