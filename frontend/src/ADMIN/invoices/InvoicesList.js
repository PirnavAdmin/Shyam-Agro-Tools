import React, { useEffect, useState } from 'react';
import { Search, Printer, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiDomain } from '../../utils/apiConfig';
import './invoices.css';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 'Rs. 0',
    paidInvoices: 0,
    unpaidInvoices: 0,
    cancelledInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const apiDomain = getApiDomain();
      const url = search 
        ? `${apiDomain}/api/Invoices?search=${encodeURIComponent(search)}`
        : `${apiDomain}/api/Invoices`;
      
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setInvoices(data.invoices || []);
      setMetrics({
        totalRevenue: data.totalRevenue || 'Rs. 0',
        paidInvoices: data.paidInvoices || 0,
        unpaidInvoices: data.unpaidInvoices || 0,
        cancelledInvoices: data.cancelledInvoices || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoices(searchTerm);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleUpdateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    if (!window.confirm(`Are you sure you want to mark this invoice as ${newStatus}?`)) return;

    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update invoice status.');
      fetchInvoices(searchTerm);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to cancel/delete this invoice?')) return;

    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to cancel invoice.');
      fetchInvoices(searchTerm);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePrintInvoice = async (id) => {
    try {
      const response = await fetch(`${getApiDomain()}/api/Invoices/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch invoice details.');
      const order = await response.json();

      const printWindow = window.open('', '_blank');
      const itemsHtml = (order.items || []).map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${item.productName || 'Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.total}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.invoiceId}</title>
            <style>
              body { font-family: sans-serif; margin: 40px; color: #333; }
              .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #10b981; }
              .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; line-height: 1.6; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background: #f8fafc; text-align: left; padding: 10px; font-weight: bold; border-bottom: 2px solid #ddd; }
              .totals { text-align: right; font-size: 14px; line-height: 1.8; }
              .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <div class="header">
                <div>
                  <div class="logo">SHYAM AGRO TOOLS</div>
                  <div style="font-size: 12px; color: #666; margin-top: 4px;">Premium Farming Tools & Machinery</div>
                </div>
                <div style="text-align: right;">
                  <h2 style="margin: 0; color: #333;">INVOICE</h2>
                  <div style="font-size: 13px; margin-top: 6px;">
                    <strong>Invoice:</strong> ${order.invoiceId}<br/>
                    <strong>Date:</strong> ${order.date}
                  </div>
                </div>
              </div>
              
              <div class="details">
                <div>
                  <strong>Billed To:</strong><br/>
                  ${order.client}<br/>
                  Phone: ${order.phone || 'N/A'}<br/>
                  Email: ${order.email || 'N/A'}
                </div>
                <div style="text-align: right;">
                  <strong>Seller Details:</strong><br/>
                  Shyam Agro Tools & Equipments<br/>
                  Sidhpur, Gujarat - 384151<br/>
                  GSTIN: 24DYYPP1677P1Z6
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="totals">
                <div style="font-size: 18px; font-weight: bold; color: #10b981; margin-top: 6px;">Total Amount: ${order.billed}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Payment Status: <strong>${order.status}</strong></div>
              </div>
              
              <div class="footer">
                Thank you for your business!<br/>
                For support, contact sales@shyamagro.com or call +91 98765 43210.
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      alert(`Failed to print invoice: ${err.message}`);
    }
  };

  return (
    <div className="invoices-ledger-container">
      {/* Header */}
      <div className="invoices-header-flex">
        <div>
          <h1 className="invoices-title">Invoices Manager</h1>
          <p className="invoices-subtitle">Track, search, and generate customer and staff sales invoices.</p>
        </div>
        <Link to="/admin/invoice/add" className="add-invoice-button">
          <Plus size={16} /> Create Invoice
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="invoices-metrics-grid">
        <div className="invoice-metric-card revenue">
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <h3 className="metric-value">{metrics.totalRevenue}</h3>
          </div>
        </div>
        <div className="invoice-metric-card success">
          <div className="metric-info">
            <span className="metric-label">Paid Invoices</span>
            <h3 className="metric-value">{metrics.paidInvoices}</h3>
          </div>
        </div>
        <div className="invoice-metric-card warning">
          <div className="metric-info">
            <span className="metric-label">Unpaid Invoices</span>
            <h3 className="metric-value">{metrics.unpaidInvoices}</h3>
          </div>
        </div>
        <div className="invoice-metric-card danger">
          <div className="metric-info">
            <span className="metric-label">Cancelled</span>
            <h3 className="metric-value">{metrics.cancelledInvoices}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="invoices-filter-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-svg" />
          <input
            type="text"
            placeholder="Search by client, invoice number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="invoice-search-input"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="invoice-table-card">
        {loading ? (
          <div className="invoice-loading-state">
            <RefreshCw size={24} className="animate-spin" />
            <span>Loading Invoices...</span>
          </div>
        ) : error ? (
          <div className="invoice-error-state">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="invoice-empty-state">
            <AlertCircle size={24} />
            <span>No invoices found.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="invoices-data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Billed Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{inv.invoiceId}</td>
                    <td>
                      <div className="client-cell-info">
                        <strong>{inv.client}</strong>
                        <span>{inv.email}</span>
                      </div>
                    </td>
                    <td>{inv.date}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{inv.billed}</td>
                    <td>
                      <span className={`invoice-status-badge ${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="invoice-action-buttons">
                        <button
                          onClick={() => handlePrintInvoice(inv.id)}
                          className="inv-action-btn print"
                          title="Print / View PDF"
                        >
                          <Printer size={14} /> Print
                        </button>
                        {inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(inv.id, inv.status)}
                            className="inv-action-btn toggle"
                            title="Toggle Status"
                          >
                            <CheckCircle2 size={14} /> Mark {inv.status === 'Paid' ? 'Unpaid' : 'Paid'}
                          </button>
                        )}
                        {inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="inv-action-btn delete"
                            title="Cancel Invoice"
                          >
                            <Trash2 size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;
