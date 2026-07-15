import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckSquare,
  FiClock,
  FiEdit,
  FiFileText,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiXCircle,
  FiDownload
} from "react-icons/fi";

import "./Invoice.css";
import {
  INVOICE_ACTIONS_API_URL,
  INVOICES_API_URL,
  downloadInvoiceBlob,
  invoiceRequest,
  normalizeInvoiceCollection,
  normalizeInvoiceEnvelope,
} from "./invoiceApi";

function Invoice() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0, cancelled: 0 });
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await invoiceRequest(`${INVOICE_ACTIONS_API_URL}/dashboard`);
      setStats({
        total: data?.totalRevenue || 0,
        paid: data?.paidInvoices || 0,
        unpaid: data?.unpaidInvoices || 0,
        cancelled: data?.cancelledInvoices || 0,
      });
    } catch (error) {
      console.error("GET Dashboard Stats Error:", error);
    }
  }, []);

  const normalizeInvoice = useCallback((record) => {
    const { invoice } = normalizeInvoiceEnvelope(record);
    const invoiceId = invoice.invoiceId || invoice.InvoiceId || invoice.id || "";
    const invoiceNo = invoice.invoiceNumber || invoice.InvoiceNumber || invoice.invoiceNo || `INV-${invoiceId}`;
    const customer = invoice.clientName || invoice.customerName || invoice.CustomerName || invoice.customer || "Walk-in Client";
    const amount = Number(invoice.totalAmount || invoice.amount || invoice.Amount || 0);
    const paymentStatus = invoice.invoiceStatus || invoice.paymentStatus || "Unpaid";
    const dueDate = invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : invoice.dueDate || "";

    return {
      id: invoiceId,
      invoiceNo,
      customer,
      email: invoice.email || invoice.Email || `${String(customer).toLowerCase().replace(/\s+/g, ".")}@example.com`,
      amount,
      paymentStatus,
      dueDate,
    };
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");

      const data = await invoiceRequest(INVOICES_API_URL);

      if (data) {
        const total = data.totalRevenue ? Number(String(data.totalRevenue).replace(/[^0-9.]/g, '')) : 0;
        setStats({
          total,
          paid: data.paidInvoices || 0,
          unpaid: data.unpaidInvoices || 0,
          cancelled: data.cancelledInvoices || 0,
        });
      }

      setInvoices(normalizeInvoiceCollection(data).map(normalizeInvoice));
    } catch (error) {
      console.error("GET Invoices Error:", error);
      setApiError("Unable to load invoices from API.");
    } finally {
      setLoading(false);
    }
  }, [normalizeInvoice]);

  useEffect(() => {
    fetchInvoices();
    fetchDashboardStats();
  }, [fetchInvoices, fetchDashboardStats]);

  const deleteInvoice = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmed) return;

    try {
      setLoading(true);
      setApiError("");

      await invoiceRequest(`${INVOICES_API_URL}/${id}`, { method: "DELETE" });

      await fetchInvoices();
      fetchDashboardStats();
    } catch (error) {
      console.error("DELETE Invoice Error:", error);
      setApiError("Unable to delete invoice.");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setApiError("");
      await downloadInvoiceBlob(`${INVOICE_ACTIONS_API_URL}/export-excel`, "invoices.xlsx");
    } catch (error) {
      console.error("GET Export Excel Error:", error);
      setApiError("Unable to export invoices.");
    }
  };

  const money = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number(amount || 0) % 1 ? 2 : 0,
    })}`;

  const renderStatus = (status) => (
    <span className={`invoice-status ${String(status || "unpaid").toLowerCase().replace(/\s+/g, "-")}`}>
      {status || "Unpaid"}
    </span>
  );

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const keyword = searchTerm.toLowerCase();
    return invoices.filter(invoice => 
      (invoice.invoiceNo || "").toLowerCase().includes(keyword) ||
      (invoice.customer || "").toLowerCase().includes(keyword) ||
      (invoice.email || "").toLowerCase().includes(keyword)
    );
  }, [invoices, searchTerm]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="invoice-page">
      {apiError && <p className="invoice-api-error">{apiError}</p>}

      <div className="invoice-title-row">
        <div>
          <h1>Invoice</h1>
          <p>Invoice &gt; Invoice</p>
        </div>
        <div className="invoice-title-actions">
          <button type="button" className="invoice-more-btn" onClick={exportExcel} aria-label="Export to Excel" title="Export Excel">
            <FiDownload />
          </button>
          <Link to="/crm/invoice/add" className="invoice-add-btn">
            <FiPlus /> Add Invoices
          </Link>
          <label className="invoice-search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </div>

      <section className="invoice-stat-grid">
        <article className="invoice-summary-card">
          <strong>{money(stats.total)}</strong>
          <span>Total Revenue</span>
          <p>Overall revenue</p>
          <FiFileText />
        </article>
        <article className="invoice-summary-card">
          <strong>{stats.paid}</strong>
          <span>Paid Invoices</span>
          <p>Invoices marked as paid</p>
          <FiCheckSquare />
        </article>
        <article className="invoice-summary-card highlight">
          <strong>{stats.unpaid}</strong>
          <span>Unpaid Invoices</span>
          <p>Invoices pending payment</p>
          <FiClock />
        </article>
        <article className="invoice-summary-card">
          <strong>{stats.cancelled}</strong>
          <span>Cancelled Invoices</span>
          <p>Invoices cancelled</p>
          <FiXCircle />
        </article>
      </section>

      <section className="invoice-table-panel">
        <div className="invoice-table-scroll">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    aria-label="Select all invoices" 
                    onChange={handleSelectAll} 
                    checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                  />
                </th>
                <th>Invoice ID</th>
                <th>Client</th>
                <th>Email</th>
                <th>Date</th>
                <th>Billed</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="invoice-empty" colSpan="8">Loading...</td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id || invoice.invoiceNo}>
                    <td>
                      <input 
                        type="checkbox" 
                        aria-label={`Select ${invoice.invoiceNo}`} 
                        onChange={(e) => handleSelectRow(e, invoice.id)}
                        checked={selectedIds.includes(invoice.id)}
                      />
                    </td>
                    <td>{invoice.invoiceNo}</td>
                    <td>
                      <Link className="invoice-client-cell" to={`/crm/invoice/details/${invoice.id}`}>
                        <span>{String(invoice.customer || "C").charAt(0)}</span>
                        {invoice.customer}
                      </Link>
                    </td>
                    <td>{invoice.email}</td>
                    <td>{invoice.dueDate || "-"}</td>
                    <td>{Number(invoice.amount || 0).toFixed(2)}</td>
                    <td>{renderStatus(invoice.paymentStatus)}</td>
                    <td>
                      <div className="invoice-row-actions">
                        <Link to={`/crm/invoice/details/${invoice.id}`} className="invoice-row-btn">
                          <FiMoreHorizontal />
                        </Link>
                        <Link to={`/crm/invoice/edit/${invoice.id}`} className="invoice-row-btn edit">
                          <FiEdit />
                        </Link>
                        <button type="button" className="invoice-row-btn delete" onClick={() => deleteInvoice(invoice.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="invoice-empty" colSpan="8">No invoices found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Invoice;
