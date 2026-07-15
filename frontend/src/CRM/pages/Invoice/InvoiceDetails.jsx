import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiDownload, FiEdit, FiPlus, FiSend, FiTrash2, FiFileText } from "react-icons/fi";
import logo from "../../assets/logo.png";
import "./Invoice.css";
import { jsPDF } from "jspdf";
import {
  INVOICE_ACTIONS_API_URL,
  INVOICES_API_URL,
  invoiceRequest,
  normalizeInvoiceEnvelope,
} from "./invoiceApi";

function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");
      const data = await invoiceRequest(`${INVOICES_API_URL}/${id}`);
      setInvoiceData(data);
    } catch (error) {
      console.error("GET Invoice By ID Error:", error);
      setApiError("Unable to load selected invoice details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const deleteInvoice = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmed) return;

    try {
      setLoading(true);
      setApiError("");

      await invoiceRequest(`${INVOICES_API_URL}/${id}`, { method: "DELETE" });

      navigate("/crm/invoice");
    } catch (error) {
      console.error("DELETE Invoice Error:", error);
      setApiError("Unable to delete invoice.");
    } finally {
      setLoading(false);
    }
  };

  const money = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number(amount || 0) % 1 ? 2 : 0,
  })}`;

  const renderStatus = (status) => (
    <span className={`invoice-status ${String(status || "unpaid").toLowerCase().replace(/\s+/g, "-")}`}>
      {status || "Unpaid"}
    </span>
  );

  const downloadCurrentFormInvoice = () => {
    try {
      setApiError("");
      const { invoice, items } = normalizeInvoiceEnvelope(invoiceData);
      const invoiceNumber = invoice.invoiceNumber || `INV-${id}`;
      
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("SHYAM AGRO TOOLS", 20, 25);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("G.T. Road, Opposite Focal Point, Batala - 143505, Punjab, India", 20, 31);
      doc.text("Email: contact@shyamagrotools.com | Phone: +91 98765 43210", 20, 36);
      doc.text("GSTIN: 03AAAAA1111A1Z1", 20, 41);
  
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 46, 190, 46);
  
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("INVOICE TO:", 20, 54);
      doc.setFont("Helvetica", "normal");
      doc.text(`${invoice.clientName || ""}`, 20, 60);
      doc.text(`${invoice.email || ""}`, 20, 65);
      doc.text(`${invoice.companyAddress || ""}`, 20, 70);
      doc.text(`Tax No: ${invoice.taxNumber || ""}`, 20, 75);
  
      doc.setFont("Helvetica", "bold");
      doc.text("INVOICE DETAILS:", 120, 54);
      doc.setFont("Helvetica", "normal");
      doc.text(`Invoice No: ${invoiceNumber}`, 120, 60);
      doc.text(`Date: ${invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : "-"}`, 120, 65);
      doc.text(`Status: ${invoice.paymentStatus || "Unpaid"}`, 120, 70);
  
      doc.line(20, 80, 190, 80);
  
      // Table Header
      doc.setFont("Helvetica", "bold");
      doc.text("#", 20, 87);
      doc.text("Product Details", 30, 87);
      doc.text("Rate", 110, 87);
      doc.text("Qty", 140, 87);
      doc.text("Amount", 165, 87);
  
      doc.line(20, 91, 190, 91);
  
      doc.setFont("Helvetica", "normal");
      let y = 97;
      items.forEach((item, idx) => {
        doc.text(`${idx + 1}`, 20, y);
        doc.text(`${item.productName}`, 30, y);
        if (item.productDetails) {
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`${item.productDetails}`, 30, y + 4);
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
        }
        doc.text(`${money(item.rate)}`, 110, y);
        doc.text(`${item.quantity}`, 140, y);
        doc.text(`${money(Number(item.rate) * Number(item.quantity))}`, 165, y);
        
        y += item.productDetails ? 12 : 8;
      });
  
      doc.line(20, y - 2, 190, y - 2);
  
      // Totals
      doc.text("Sub Total:", 120, y + 5);
      doc.text(`${money(invoice.subTotal)}`, 165, y + 5);
      doc.text("Estimated Tax (12.5%):", 120, y + 10);
      doc.text(`${money(invoice.taxAmount)}`, 165, y + 10);
      if (invoice.discountAmount > 0) {
        doc.text("Discount:", 120, y + 15);
        doc.text(`-${money(invoice.discountAmount)}`, 165, y + 15);
        y += 5;
      }
      if (invoice.shippingCharge > 0) {
        doc.text("Shipping Charge:", 120, y + 15);
        doc.text(`${money(invoice.shippingCharge)}`, 165, y + 15);
        y += 5;
      }
      doc.setFont("Helvetica", "bold");
      doc.text("Total Amount:", 120, y + 15);
      doc.text(`${money(invoice.totalAmount)}`, 165, y + 15);
  
      doc.save(`${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setApiError("Unable to generate invoice PDF.");
    }
  };

  const sendInvoiceEmail = async () => {
    try {
      setLoading(true);
      await invoiceRequest(`${INVOICE_ACTIONS_API_URL}/send-email/${id}`, { method: "POST" });
      alert("Email sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send email.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !invoiceData) {
    return <div className="invoice-page"><p className="invoice-api-state">Loading invoice details...</p></div>;
  }

  if (apiError || !invoiceData) {
    return (
      <div className="invoice-page">
        <section className="invoice-detail-card">
          <h1>Invoice Details</h1>
          <p>{apiError || "No invoice is available yet."}</p>
          <Link className="invoice-add-btn" to="/crm/invoice/add"><FiPlus /> Add Invoice</Link>
        </section>
      </div>
    );
  }

  const { invoice, items, billing, shipping, payment } = normalizeInvoiceEnvelope(invoiceData);

  return (
    <div className="invoice-page">
      <div className="invoice-title-row compact">
        <div>
          <h1>Invoice Details</h1>
          <p>Invoice &gt; Invoice Details</p>
        </div>
        <div className="invoice-title-actions">
          <button type="button" className="download-invoice-btn" onClick={downloadCurrentFormInvoice}><FiDownload /> Download PDF</button>
          <button type="button" className="send-invoice-btn" onClick={sendInvoiceEmail}><FiSend /> Send Email</button>
        </div>
      </div>

      <section className="invoice-form-card printable-invoice">
        <div className="invoice-form-header" style={{ marginBottom: "32px" }}>
          <div className="invoice-brand-block">
            <img src={logo} alt="Shyam Agro Tools Logo" />
            <div className="invoice-brand-info">
              <h2>Shyam Agro Tools</h2>
              <p>G.T. Road, Opposite Focal Point, Batala - 143505, Punjab, India</p>
              <p>Email: contact@shyamagrotools.com | Phone: +91 98765 43210</p>
              <p>GSTIN: 03AAAAA1111A1Z1</p>
            </div>
          </div>
          <div className="invoice-meta-badge">
            <div className="inv-number">{invoice.invoiceNumber || `INV-${id}`}</div>
            <div className="inv-date">Date: {invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : "-"}</div>
            <div style={{ marginTop: "8px" }}>{renderStatus(invoice.invoiceStatus || invoice.paymentStatus)}</div>
          </div>
        </div>

        <div className="inv-section-title">
          <FiFileText /> General Information
        </div>
        <div className="inv-form-grid three-col" style={{ marginBottom: "32px" }}>
          <div className="inv-field">
            <span className="inv-field-label">Client Name</span>
            <input value={invoice.clientName || ""} readOnly />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Email Address</span>
            <input value={invoice.email || ""} readOnly />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Contact No</span>
            <input value={invoice.contactNo || ""} readOnly />
          </div>
          <div className="inv-field full-width">
            <span className="inv-field-label">Address</span>
            <textarea value={invoice.companyAddress || ""} readOnly />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Postal Code</span>
            <input value={invoice.postalCode || ""} readOnly />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Tax Number</span>
            <input value={invoice.taxNumber || ""} readOnly />
          </div>
        </div>

        <div className="address-grid" style={{ marginBottom: "32px" }}>
          <div className="address-card">
            <h3>Billing Address</h3>
            <div className="inv-field">
              <span className="inv-field-label">Full Name</span>
              <input value={billing.fullName || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Address</span>
              <textarea value={billing.address || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Phone</span>
              <input value={billing.phone || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Tax Number</span>
              <input value={billing.taxNumber || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Email</span>
              <input value={billing.email || ""} readOnly />
            </div>
          </div>

          <div className="address-card">
            <h3>Shipping Address</h3>
            <div className="inv-field">
              <span className="inv-field-label">Full Name</span>
              <input value={shipping.fullName || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Address</span>
              <textarea value={shipping.address || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Phone</span>
              <input value={shipping.phone || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Tax Number</span>
              <input value={shipping.taxNumber || ""} readOnly />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Email</span>
              <input value={shipping.email || ""} readOnly />
            </div>
          </div>
        </div>

        <div className="inv-section-title">
          <FiFileText /> Line Items
        </div>
        <div className="invoice-items-section" style={{ marginBottom: "32px" }}>
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Product Details</th>
                <th style={{ width: "150px" }}>Rate</th>
                <th style={{ width: "150px" }}>Quantity</th>
                <th style={{ width: "180px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span className="item-num">{index + 1}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.productName}</div>
                    {item.productDetails && (
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{item.productDetails}</div>
                    )}
                  </td>
                  <td>{money(item.rate)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: "600", color: "#0f172a" }}>{money(Number(item.rate) * Number(item.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals-grid" style={{ marginBottom: "32px" }}>
          <div className="payment-card">
            <h3>Payment Details</h3>
            <div className="inv-field">
              <span className="inv-field-label">Payment Method</span>
              <input value={payment.paymentMethod || "N/A"} readOnly />
            </div>
            {payment.paymentMethod === 'Card' && (
              <>
                <div className="inv-field" style={{ marginTop: "14px" }}>
                  <span className="inv-field-label">Card Holder Name</span>
                  <input value={payment.cardHolderName || ""} readOnly />
                </div>
                <div className="inv-field" style={{ marginTop: "14px" }}>
                  <span className="inv-field-label">Card Number</span>
                  <input value={payment.cardNumber || ""} readOnly />
                </div>
              </>
            )}
          </div>

          <div className="totals-card">
            <h3>Totals</h3>
            <div className="total-row">
              <span>Sub Total</span>
              <input value={money(invoice.subTotal)} readOnly />
            </div>
            <div className="total-row">
              <span>Estimated Tax (12.5%)</span>
              <input value={money(invoice.taxAmount)} readOnly />
            </div>
            {invoice.discountAmount > 0 && (
              <div className="total-row">
                <span>Discount</span>
                <input value={`-${money(invoice.discountAmount)}`} readOnly />
              </div>
            )}
            {invoice.shippingCharge > 0 && (
              <div className="total-row">
                <span>Shipping Charge</span>
                <input value={money(invoice.shippingCharge)} readOnly />
              </div>
            )}
            <div className="total-row">
              <span>Total Amount</span>
              <input value={money(invoice.totalAmount)} readOnly />
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes" style={{ marginBottom: "32px" }}>
            <span className="inv-field-label" style={{ display: "block", marginBottom: "8px" }}>Notes / Payment Instructions</span>
            <textarea value={invoice.notes} readOnly />
          </div>
        )}

        <div className="invoice-form-actions">
          <button type="button" className="save-invoice-btn" onClick={() => navigate(`/crm/invoice/edit/${id}`)}><FiEdit /> Edit Invoice</button>
          <button type="button" className="delete-line-btn" onClick={deleteInvoice}><FiTrash2 /> Delete Invoice</button>
        </div>
      </section>
    </div>
  );
}

export default InvoiceDetails;
