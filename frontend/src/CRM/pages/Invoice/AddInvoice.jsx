import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiDownload, FiFileText, FiPlus, FiSend } from "react-icons/fi";
import "./Invoice.css";
import logo from "../../assets/logo.png";
import { jsPDF } from "jspdf";
import {
  INVOICE_ACTIONS_API_URL,
  INVOICES_API_URL,
  invoiceRequest,
  normalizeInvoiceEnvelope,
} from "./invoiceApi";

const emptyLineItem = {
  itemId: 0,
  productName: "",
  productDetails: "",
  rate: 0,
  quantity: 1,
};

const initialInvoiceForm = {
  invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
  customer: "",
  email: "",
  date: new Date().toISOString().split("T")[0],
  paymentStatus: "Unpaid",
  companyAddress: "",
  postalCode: "",
  taxNumber: "",
  contactNo: "",
  billingName: "",
  billingAddress: "",
  billingPhone: "",
  billingTaxNumber: "",
  billingEmail: "",
  shippingName: "",
  shippingAddress: "",
  shippingPhone: "",
  shippingTaxNumber: "",
  shippingEmail: "",
  sameAddress: false,
  items: [{ ...emptyLineItem }],
  discount: 0,
  shippingCharge: 0,
  paymentMethod: "",
  cardHolderName: "",
  cardNumber: "",
  paidAmount: 0,
  notes: "All accounts are to be paid within 7 days from receipt of invoice. To be paid by cheque, card, or direct payment online.",
};

function AddInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState(initialInvoiceForm);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const fetchInvoiceById = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      setApiError("");

      const data = await invoiceRequest(`${INVOICES_API_URL}/${invoiceId}`);
      const { invoice, items: savedItems, billing, shipping, payment } = normalizeInvoiceEnvelope(data);
      const items = savedItems.length > 0 ? savedItems : [{ ...emptyLineItem }];

      setFormData({
        invoiceId: invoice.invoiceId || Number(invoiceId),
        invoiceNo: invoice.invoiceNumber || `INV-${invoiceId}`,
        customer: invoice.clientName || invoice.customerName || "",
        email: invoice.email || "",
        date: invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : new Date().toISOString().split("T")[0],
        paymentStatus: invoice.invoiceStatus || invoice.paymentStatus || "Unpaid",
        companyAddress: invoice.companyAddress || "",
        postalCode: invoice.postalCode || "",
        taxNumber: invoice.taxNumber || "",
        contactNo: invoice.contactNo || "",
        billingName: billing.fullName || "",
        billingAddress: billing.address || "",
        billingPhone: billing.phone || "",
        billingTaxNumber: billing.taxNumber || "",
        billingEmail: billing.email || "",
        billingId: billing.billingId || 0,
        shippingName: shipping.fullName || "",
        shippingAddress: shipping.address || "",
        shippingPhone: shipping.phone || "",
        shippingTaxNumber: shipping.taxNumber || "",
        shippingEmail: shipping.email || "",
        shippingId: shipping.shippingId || 0,
        sameAddress: false,
        items: items.map(item => ({
          itemId: item.itemId || 0,
          productName: item.productName || "",
          productDetails: item.productDetails || "",
          rate: item.rate || 0,
          quantity: item.quantity || 1,
        })),
        discount: invoice.discountAmount || 0,
        shippingCharge: invoice.shippingCharge || 0,
        paymentMethod: payment.paymentMethod || "",
        cardHolderName: payment.cardHolderName || "",
        cardNumber: payment.cardNumber || "",
        paymentId: payment.paymentId || 0,
        paidAmount: invoice.totalAmount || 0,
        notes: invoice.notes || "All accounts are to be paid within 7 days from receipt of invoice. To be paid by cheque, card, or direct payment online.",
      });
    } catch (error) {
      console.error("GET Invoice By ID Error:", error);
      setApiError("Unable to load selected invoice details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchInvoiceById(id);
    }
  }, [id, isEditing, fetchInvoiceById]);

  const lineSubTotal = useMemo(
    () => formData.items.reduce((sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0), 0),
    [formData.items]
  );
  const estimatedTax = lineSubTotal * 0.125;
  const invoiceTotal = lineSubTotal + estimatedTax + Number(formData.shippingCharge || 0) - Number(formData.discount || 0);

  const money = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number(amount || 0) % 1 ? 2 : 0,
  })}`;

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "sameAddress" && checked) {
        next.shippingName = prev.billingName;
        next.shippingAddress = prev.billingAddress;
        next.shippingPhone = prev.billingPhone;
        next.shippingTaxNumber = prev.billingTaxNumber;
        next.shippingEmail = prev.billingEmail;
      }
      return next;
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyLineItem }],
    }));
  };

  const deleteLineItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const adjustQuantity = (index, amount) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) + amount) }
          : item
      ),
    }));
  };

  const saveInvoice = async (event) => {
    if (event) event.preventDefault();

    if (!formData.customer.trim() || !formData.invoiceNo.trim()) {
      setApiError("Invoice number and client name are required.");
      return;
    }

    let sanitizedContactNo = formData.contactNo.trim();
    // Remove spaces, hyphens, and parentheses
    sanitizedContactNo = sanitizedContactNo.replace(/[\s\-()]/g, "");

    // If it is just a 10 digit number, prepend +91
    if (/^\d{10}$/.test(sanitizedContactNo)) {
      sanitizedContactNo = "+91" + sanitizedContactNo;
    }

    // Validate contact number pattern
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(sanitizedContactNo)) {
      setApiError("Contact No must be a valid 10-digit mobile number (e.g. 9876543210 or +919876543210).");
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      let payload;
      if (isEditing) {
        payload = {
          status: formData.paymentStatus
        };
      } else {
        payload = {
          invoiceNo: formData.invoiceNo,
          date: new Date(formData.date).toISOString(),
          paymentStatus: formData.paymentStatus,
          clientName: formData.customer,
          emailAddress: formData.email,
          contactNo: sanitizedContactNo,
          address: formData.companyAddress,
          postalCode: formData.postalCode,
          taxNumber: formData.taxNumber,
          billingName: formData.billingName,
          billingAddress: formData.billingAddress,
          billingPhone: formData.billingPhone,
          billingTaxNumber: formData.billingTaxNumber,
          billingEmail: formData.billingEmail,
          shippingName: formData.shippingName,
          shippingAddress: formData.shippingAddress,
          shippingPhone: formData.shippingPhone,
          shippingTaxNumber: formData.shippingTaxNumber,
          shippingEmail: formData.shippingEmail,
          paymentMethod: formData.paymentMethod || "Cash",
          subTotal: lineSubTotal,
          taxAmount: estimatedTax,
          discount: Number(formData.discount || 0),
          shippingCharge: Number(formData.shippingCharge || 0),
          totalAmount: invoiceTotal,
          notes: formData.notes
        };
      }

      const result = await invoiceRequest(isEditing ? `${INVOICES_API_URL}/${id}` : INVOICES_API_URL, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      const targetId = isEditing ? id : (result?.id || result?.invoiceId || result?.invoice?.invoiceId || id);

      // Auto-send invoice email after successful save
      if (targetId) {
        try {
          await invoiceRequest(`${INVOICE_ACTIONS_API_URL}/send-email/${targetId}`, { method: "POST" });
        } catch (emailErr) {
          console.error("Auto Email Dispatch Error:", emailErr);
        }
      }

      navigate("/crm/invoice");
    } catch (error) {
      console.error("POST/PUT Invoice Error:", error);
      setApiError("Unable to save invoice.");
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = () => {
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
    doc.text(`${formData.customer}`, 20, 60);
    doc.text(`${formData.email || ""}`, 20, 65);
    doc.text(`${formData.companyAddress || ""}`, 20, 70);
    doc.text(`Tax No: ${formData.taxNumber || ""}`, 20, 75);

    doc.setFont("Helvetica", "bold");
    doc.text("INVOICE DETAILS:", 120, 54);
    doc.setFont("Helvetica", "normal");
    doc.text(`Invoice No: ${formData.invoiceNo}`, 120, 60);
    doc.text(`Date: ${formData.date}`, 120, 65);
    doc.text(`Status: ${formData.paymentStatus}`, 120, 70);

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
    formData.items.forEach((item, idx) => {
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
    doc.text(`${money(lineSubTotal)}`, 165, y + 5);
    doc.text("Estimated Tax (12.5%):", 120, y + 10);
    doc.text(`${money(estimatedTax)}`, 165, y + 10);
    if (formData.discount > 0) {
      doc.text("Discount:", 120, y + 15);
      doc.text(`-${money(formData.discount)}`, 165, y + 15);
      y += 5;
    }
    if (formData.shippingCharge > 0) {
      doc.text("Shipping Charge:", 120, y + 15);
      doc.text(`${money(formData.shippingCharge)}`, 165, y + 15);
      y += 5;
    }
    doc.setFont("Helvetica", "bold");
    doc.text("Total Amount:", 120, y + 15);
    doc.text(`${money(invoiceTotal)}`, 165, y + 15);

    doc.save(`${formData.invoiceNo}.pdf`);
  };

  const downloadCurrentFormInvoice = () => {
    generatePdf();
  };

  const sendInvoiceEmail = async (e) => {
    e.preventDefault();
    if (!isEditing) {
      const confirmSave = window.confirm("The invoice must be saved first before it can be sent. Would you like to save and send now?");
      if (confirmSave) {
        saveInvoice();
      }
      return;
    }
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

  return (
    <div className="invoice-page">
      {loading && <p className="invoice-api-state">Processing...</p>}
      {apiError && <p className="invoice-api-error">{apiError}</p>}
      
      <div className="invoice-title-row compact">
        <div>
          <h1>{isEditing ? "Edit Invoice" : "New Invoice"}</h1>
          <p>Invoice &gt; {isEditing ? "Edit Invoice" : "New Invoice"}</p>
        </div>
      </div>

      <form className="invoice-form-card" onSubmit={saveInvoice}>
        <div className="invoice-form-header">
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
            <div className="inv-number">{formData.invoiceNo}</div>
            <div className="inv-date">Date: {formData.date}</div>
          </div>
        </div>

        <div className="inv-section-title">
          <FiFileText /> General Information
        </div>
        <div className="inv-form-grid three-col">
          <div className="inv-field">
            <span className="inv-field-label">Invoice No</span>
            <input name="invoiceNo" value={formData.invoiceNo} onChange={handleFieldChange} />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Date</span>
            <input type="date" name="date" value={formData.date} onChange={handleFieldChange} />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Payment Status</span>
            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleFieldChange}>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Cancel">Cancel</option>
              <option value="Refund">Refund</option>
            </select>
          </div>
        </div>

        <div className="inv-section-title">
          <FiFileText /> Client Information
        </div>
        <div className="inv-form-grid three-col">
          <div className="inv-field">
            <span className="inv-field-label">Client Name</span>
            <input name="customer" value={formData.customer} onChange={handleFieldChange} placeholder="Client Name" />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Email Address</span>
            <input type="email" name="email" value={formData.email} onChange={handleFieldChange} placeholder="client@example.com" />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Contact No</span>
            <input name="contactNo" value={formData.contactNo} onChange={handleFieldChange} placeholder="Contact No" />
          </div>
          <div className="inv-field full-width">
            <span className="inv-field-label">Address</span>
            <textarea name="companyAddress" value={formData.companyAddress} onChange={handleFieldChange} placeholder="Client Address" />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Postal Code</span>
            <input name="postalCode" value={formData.postalCode} onChange={handleFieldChange} placeholder="Postal Code" />
          </div>
          <div className="inv-field">
            <span className="inv-field-label">Tax Number</span>
            <input name="taxNumber" value={formData.taxNumber} onChange={handleFieldChange} placeholder="Tax Number" />
          </div>
        </div>

        <div className="address-grid">
          <div className="address-card">
            <h3>Billing Address</h3>
            <div className="inv-field">
              <span className="inv-field-label">Full Name</span>
              <input name="billingName" value={formData.billingName} onChange={handleFieldChange} placeholder="Billing Full Name" />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Address</span>
              <textarea name="billingAddress" value={formData.billingAddress} onChange={handleFieldChange} placeholder="Billing Address" />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Phone</span>
              <input name="billingPhone" value={formData.billingPhone} onChange={handleFieldChange} placeholder="Billing Phone" />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Tax Number</span>
              <input name="billingTaxNumber" value={formData.billingTaxNumber} onChange={handleFieldChange} placeholder="Billing Tax Number" />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Email</span>
              <input type="email" name="billingEmail" value={formData.billingEmail} onChange={handleFieldChange} placeholder="Billing Email" />
            </div>
            <label className="invoice-checkbox">
              <input type="checkbox" name="sameAddress" checked={formData.sameAddress} onChange={handleFieldChange} />
              Will your billing and shipping address same?
            </label>
          </div>

          <div className="address-card">
            <h3>Shipping Address</h3>
            <div className="inv-field">
              <span className="inv-field-label">Full Name</span>
              <input name="shippingName" value={formData.shippingName} onChange={handleFieldChange} placeholder="Shipping Full Name" disabled={formData.sameAddress} />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Address</span>
              <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleFieldChange} placeholder="Shipping Address" disabled={formData.sameAddress} />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Phone</span>
              <input name="shippingPhone" value={formData.shippingPhone} onChange={handleFieldChange} placeholder="Shipping Phone" disabled={formData.sameAddress} />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Tax Number</span>
              <input name="shippingTaxNumber" value={formData.shippingTaxNumber} onChange={handleFieldChange} placeholder="Shipping Tax Number" disabled={formData.sameAddress} />
            </div>
            <div className="inv-field" style={{ marginTop: "14px" }}>
              <span className="inv-field-label">Email</span>
              <input type="email" name="shippingEmail" value={formData.shippingEmail} onChange={handleFieldChange} placeholder="Shipping Email" disabled={formData.sameAddress} />
            </div>
          </div>
        </div>

        <div className="inv-section-title">
          <FiFileText /> Line Items
        </div>
        <div className="invoice-items-section">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Product Details</th>
                <th style={{ width: "150px" }}>Rate</th>
                <th style={{ width: "150px" }}>Quantity</th>
                <th style={{ width: "180px" }}>Amount</th>
                <th style={{ width: "100px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span className="item-num">{index + 1}</span>
                  </td>
                  <td>
                    <input 
                      value={item.productName} 
                      onChange={(event) => handleItemChange(index, "productName", event.target.value)} 
                      placeholder="Product Name" 
                      style={{ marginBottom: "6px" }}
                    />
                    <textarea 
                      value={item.productDetails} 
                      onChange={(event) => handleItemChange(index, "productDetails", event.target.value)} 
                      placeholder="Product Details / Description" 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={item.rate} 
                      onChange={(event) => handleItemChange(index, "rate", event.target.value)} 
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <div className="quantity-control">
                      <button type="button" onClick={() => adjustQuantity(index, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => adjustQuantity(index, 1)}>+</button>
                    </div>
                  </td>
                  <td>
                    <input value={money(Number(item.rate || 0) * Number(item.quantity || 0))} readOnly />
                  </td>
                  <td>
                    <button type="button" className="delete-line-btn" onClick={() => deleteLineItem(index)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="add-item-btn" onClick={addLineItem}><FiPlus /> Add Item</button>
        </div>

        <div className="invoice-totals-grid">
          <div className="payment-card">
            <h3>Payment Details</h3>
            <div className="inv-field">
              <span className="inv-field-label">Payment Method</span>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleFieldChange}>
                <option value="">Select Method</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
            {formData.paymentMethod === 'Card' && (
              <div className="card-fields-enter">
                <div className="inv-field" style={{ marginTop: "14px" }}>
                  <span className="inv-field-label">Card Holder Name</span>
                  <input name="cardHolderName" value={formData.cardHolderName} onChange={handleFieldChange} placeholder="Card Holder Name" />
                </div>
                <div className="inv-field" style={{ marginTop: "14px" }}>
                  <span className="inv-field-label">Card Number</span>
                  <input name="cardNumber" value={formData.cardNumber} onChange={handleFieldChange} placeholder="xxxx xxxx xxxx xxxx" />
                </div>
                <div className="inv-field" style={{ marginTop: "14px" }}>
                  <span className="inv-field-label">Paid Amount</span>
                  <input name="paidAmount" type="number" value={formData.paidAmount} onChange={handleFieldChange} placeholder="0.00" />
                </div>
              </div>
            )}
          </div>

          <div className="totals-card">
            <h3>Totals</h3>
            <div className="total-row">
              <span>Sub Total</span>
              <input value={money(lineSubTotal)} readOnly />
            </div>
            <div className="total-row">
              <span>Estimated Tax (12.5%)</span>
              <input value={money(estimatedTax)} readOnly />
            </div>
            <div className="total-row">
              <span>Discount</span>
              <input name="discount" type="number" value={formData.discount} onChange={handleFieldChange} placeholder="0.00" />
            </div>
            <div className="total-row">
              <span>Shipping Charge</span>
              <input name="shippingCharge" type="number" value={formData.shippingCharge} onChange={handleFieldChange} placeholder="0.00" />
            </div>
            <div className="total-row">
              <span>Total Amount</span>
              <input value={money(invoiceTotal)} readOnly />
            </div>
          </div>
        </div>

        <div className="invoice-notes">
          <span className="inv-field-label" style={{ display: "block", marginBottom: "8px" }}>Notes / Payment Instructions</span>
          <textarea name="notes" value={formData.notes} onChange={handleFieldChange} />
        </div>

        <div className="invoice-form-actions">
          <button type="submit" className="save-invoice-btn"><FiFileText /> {isEditing ? "Update" : "Save"}</button>
          <button type="button" className="download-invoice-btn" onClick={downloadCurrentFormInvoice}><FiDownload /> Download Invoice</button>
          <button type="button" className="send-invoice-btn" onClick={sendInvoiceEmail}><FiSend /> Send Invoice</button>
        </div>
      </form>
    </div>
  );
}

export default AddInvoice;
