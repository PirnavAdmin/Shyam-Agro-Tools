import React, { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import headerLogo from '../../asset/header logo.png';
import './InvoicePage.css';

const invoiceData = {
  companyName: 'SAT Agricultural Tools & Equipment',
  invoiceNo: 'SAT/INV/2026/001',
  invoiceDate: '02-06-2026',
  placeOfSupply: 'Telangana',
  gstType: 'Intra-state GST',
  currency: 'INR',
  seller: {
    name: 'SAT Agricultural Tools & Equipment',
    address: 'Hyderabad, Telangana, India',
    gstin: '36ABCDE1234F1Z5',
    phone: '+91 98765 43210',
    email: 'sales@satagro.com',
  },
  buyer: {
    name: 'Ramesh Kumar',
    address: 'Nizamabad, Telangana, India',
    mobile: '+91 98765 12345',
    gstin: 'Unregistered',
  },
  products: [
    { name: 'SAT Power Sprayer 20L', hsn: '8424', qty: 1, rate: 8500 },
    { name: 'SAT Brush Cutter', hsn: '8433', qty: 1, rate: 12000 },
    { name: 'SAT Earth Auger Machine', hsn: '8432', qty: 1, rate: 18500 },
    { name: 'SAT Mini Power Weeder', hsn: '8432', qty: 1, rate: 28000 },
  ],
  discount: 150,
  amountInWords: 'Rupees Seventy Eight Thousand Nine Hundred Ten Only',
  payment: {
    mode: 'UPI / Cash / Bank Transfer',
    status: 'Paid',
    transactionId: 'SATPAY2026001',
  },
  bank: {
    name: 'State Bank of India',
    accountName: 'SAT Agricultural Tools & Equipment',
    accountNo: '123456789012',
    ifsc: 'SBIN0001234',
    branch: 'Hyderabad',
  },
  warranty: [
    'Product warranty: 12 months',
    'Physical damage not covered',
    'Warranty valid only with invoice',
  ],
  terms: [
    'Goods once sold will not be returned',
    'Warranty as per manufacturer policy',
    'Taxes included as per GST rules',
    'Subject to Hyderabad jurisdiction',
  ],
};

const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const calculateLineItem = (item) => {
  const taxableValue = item.qty * item.rate;
  const cgst = taxableValue * CGST_RATE;
  const sgst = taxableValue * SGST_RATE;
  const total = taxableValue + cgst + sgst;

  return {
    ...item,
    taxableValue,
    cgst,
    sgst,
    total,
  };
};

const DetailRow = ({ label, value }) => (
  <div className="invoice-detail-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const InvoicePage = () => {
  const calculatedItems = useMemo(
    () => invoiceData.products.map(calculateLineItem),
    []
  );

  const totals = useMemo(() => {
    const taxableAmount = calculatedItems.reduce((sum, item) => sum + item.taxableValue, 0);
    const cgstTotal = calculatedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = calculatedItems.reduce((sum, item) => sum + item.sgst, 0);
    const productTotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const totalGst = cgstTotal + sgstTotal;
    const grandTotal = productTotal - invoiceData.discount;

    return {
      taxableAmount,
      cgstTotal,
      sgstTotal,
      totalGst,
      productTotal,
      grandTotal,
    };
  }, [calculatedItems]);

  const handlePrint = () => window.print();
  const handleDownloadPdf = () => window.print();

  return (
    <main className="invoice-page">
      <div className="invoice-actions no-print">
        <button type="button" onClick={handlePrint}>
          <Printer size={18} />
          Print Invoice
        </button>
        <button type="button" onClick={handleDownloadPdf} className="invoice-download-btn">
          <Download size={18} />
          Download PDF
        </button>
      </div>

      <section className="invoice-sheet" aria-label="GST Tax Invoice">
        <header className="invoice-header">
          <div className="invoice-brand">
            <div className="invoice-logo">
              <img src={headerLogo} alt="Shyam Agro" />
            </div>
            <div>
              <h1>{invoiceData.companyName}</h1>
              <p>Professional Agriculture Tools, Machinery & Equipment</p>
            </div>
          </div>
          <div className="invoice-title-block">
            <span>GST Tax Invoice</span>
            <strong>{invoiceData.invoiceNo}</strong>
          </div>
        </header>

        <section className="invoice-meta-grid">
          <DetailRow label="Invoice No" value={invoiceData.invoiceNo} />
          <DetailRow label="Invoice Date" value={invoiceData.invoiceDate} />
          <DetailRow label="Place of Supply" value={invoiceData.placeOfSupply} />
          <DetailRow label="GST Type" value={invoiceData.gstType} />
          <DetailRow label="Currency" value={invoiceData.currency} />
        </section>

        <section className="invoice-party-grid">
          <article className="invoice-card">
            <h2>Seller Details</h2>
            <p className="invoice-party-name">{invoiceData.seller.name}</p>
            <p>{invoiceData.seller.address}</p>
            <p><strong>GSTIN:</strong> {invoiceData.seller.gstin}</p>
            <p><strong>Phone:</strong> {invoiceData.seller.phone}</p>
            <p><strong>Email:</strong> {invoiceData.seller.email}</p>
          </article>

          <article className="invoice-card">
            <h2>Buyer Details</h2>
            <p className="invoice-party-name">{invoiceData.buyer.name}</p>
            <p>{invoiceData.buyer.address}</p>
            <p><strong>Mobile:</strong> {invoiceData.buyer.mobile}</p>
            <p><strong>GSTIN:</strong> {invoiceData.buyer.gstin}</p>
          </article>
        </section>

        <section className="invoice-table-section">
          <h2>Product GST Details</h2>
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Product Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Taxable Value</th>
                  <th>CGST 9%</th>
                  <th>SGST 9%</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={item.name}>
                    <td>{index + 1}</td>
                    <td className="invoice-product-name">{item.name}</td>
                    <td>{item.hsn}</td>
                    <td>{item.qty}</td>
                    <td>{formatCurrency(item.rate)}</td>
                    <td>{formatCurrency(item.taxableValue)}</td>
                    <td>{formatCurrency(item.cgst)}</td>
                    <td>{formatCurrency(item.sgst)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="invoice-summary-grid">
          <article className="invoice-card">
            <h2>Payment Details</h2>
            <DetailRow label="Payment Mode" value={invoiceData.payment.mode} />
            <DetailRow label="Payment Status" value={invoiceData.payment.status} />
            <DetailRow label="Transaction ID" value={invoiceData.payment.transactionId} />
          </article>

          <article className="invoice-card">
            <h2>Bank Details</h2>
            <DetailRow label="Bank Name" value={invoiceData.bank.name} />
            <DetailRow label="Account Name" value={invoiceData.bank.accountName} />
            <DetailRow label="Account No" value={invoiceData.bank.accountNo} />
            <DetailRow label="IFSC" value={invoiceData.bank.ifsc} />
            <DetailRow label="Branch" value={invoiceData.bank.branch} />
          </article>

          <article className="invoice-totals">
            <h2>Tax Summary</h2>
            <DetailRow label="Taxable Amount" value={formatCurrency(totals.taxableAmount)} />
            <DetailRow label="CGST Total" value={formatCurrency(totals.cgstTotal)} />
            <DetailRow label="SGST Total" value={formatCurrency(totals.sgstTotal)} />
            <DetailRow label="Total GST" value={formatCurrency(totals.totalGst)} />
            <DetailRow label="Delivery Charges" value="FREE" />
            <DetailRow label="Discount" value={formatCurrency(invoiceData.discount)} />
            <div className="invoice-grand-total">
              <span>Grand Total</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </article>
        </section>

        <section className="invoice-words">
          <span>Amount in Words</span>
          <strong>{invoiceData.amountInWords}</strong>
        </section>

        <section className="invoice-bottom-grid">
          <article className="invoice-card">
            <h2>Warranty Details</h2>
            <ul>
              {invoiceData.warranty.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="invoice-card">
            <h2>Terms & Conditions</h2>
            <ul>
              {invoiceData.terms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="invoice-signature">
            <div>
              <span>For {invoiceData.companyName}</span>
              <strong>Authorized Signature</strong>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
};

export default InvoicePage;
