import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Download, Printer, CheckCircle, ShieldCheck, FileCheck, ArrowLeft, Truck, Award, QrCode, PhoneCall, Building2 } from 'lucide-react';
import headerLogo from '../../asset/headerlogo-new.png';
import { getInvoiceById } from '../../services/invoiceService';
import './InvoicePage.css';

const numberToWordsINR = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  };

  let integerPart = Math.floor(Math.abs(num));
  let str = '';
  const crore = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;
  const lakh = Math.floor(integerPart / 100000);
  integerPart %= 100000;
  const thousand = Math.floor(integerPart / 1000);
  integerPart %= 1000;
  const hundred = Math.floor(integerPart / 100);
  integerPart %= 100;

  if (crore) str += inWords(crore) + 'Crore ';
  if (lakh) str += inWords(lakh) + 'Lakh ';
  if (thousand) str += inWords(thousand) + 'Thousand ';
  if (hundred) str += inWords(hundred) + 'Hundred ';
  if (integerPart) {
    if (str !== '') str += 'and ';
    str += inWords(integerPart);
  }

  return `Rupees ${str.trim()} Only`;
};

const defaultInvoiceData = {
  companyName: 'SHYAM AGRO TOOLS PVT. LTD.',
  tagline: 'Manufacturers & Wholesale Suppliers of Farm Machinery, Implements & Irrigation Equipment',
  isoCert: 'ISO 9001:2015 Certified Quality Management System',
  iecCode: '1004928172',
  invoiceNo: 'SAT/INV/2026/001482',
  invoiceDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  orderRefNo: 'ORD-20260929-847291',
  placeOfSupply: 'Andhra Pradesh (State Code: 37)',
  gstType: 'Intra-state GST (CGST 9% + SGST 9%)',
  currency: 'INR (₹)',
  irnNo: 'e54b6910a72f910482019482710492817402917492810492810482910482a',
  ewayBillNo: '2910-4829-1029-4819',
  seller: {
    name: 'Shyam Agro Tools Pvt. Ltd.',
    address: 'Opposite New Bus Stand, Nandikotkur (TQ), Nandyal (DT) - 518401, Andhra Pradesh, India',
    factoryAddress: 'Plot No. 42-45, Agro Industrial Hub, Nandyal Road, Kurnool (DT), AP - 518002',
    gstin: '24DYYPP1677P1Z6',
    cin: 'U29219AP2026PTC109842',
    msmeReg: 'UDYAM-AP-08-0049215',
    phone: '+91 9912649265',
    tollFree: '1800-425-9922 (Mon-Sat 9 AM - 7 PM)',
    email: 'sales@shyamagro.com',
    website: 'www.shyamagrotools.com',
  },
  buyer: {
    name: 'Ramesh Kumar',
    address: 'H.No 4-128, Main Commercial Road, Nizamabad, Telangana - 503001, India',
    mobile: '+91 98765 12345',
    email: 'ramesh.kumar@gmail.com',
    gstin: 'Unregistered / Consumer',
  },
  shipping: {
    name: 'Ramesh Kumar',
    address: 'H.No 4-128, Main Commercial Road, Nizamabad, Telangana - 503001, India',
    phone: '+91 98765 12345',
    logisticsPartner: 'V-Trans Express & Freight Logistics',
    docketNo: 'SAT/LOG/2026/849201',
    vehicleNo: 'AP-21-TB-4892',
    dispatchDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    transportMode: 'Surface / Road Transport',
  },
  products: [
    { name: 'SAT Power Sprayer 20L Heavy Duty Engine', hsn: '8424', qty: 1, rate: 8500 },
    { name: 'SAT Brush Cutter & Grass Trimming Machine 4-Stroke', hsn: '8433', qty: 1, rate: 12000 },
    { name: 'SAT Heavy Earth Auger Digging Machine 63cc', hsn: '8432', qty: 1, rate: 18500 },
    { name: 'SAT Mini Power Weeder & Cultivator 7HP', hsn: '8432', qty: 1, rate: 28000 },
  ],
  discount: 1500,
  shippingFee: 0,
  payment: {
    mode: 'CASHFREE ONLINE PAYMENT',
    status: 'Paid',
    transactionId: 'CFPAY20269281740921',
  },
  bank: {
    name: 'State Bank of India (SBI)',
    accountName: 'Shyam Agro Tools Pvt. Ltd.',
    accountNo: '39482019482',
    ifsc: 'SBIN0001234',
    branch: 'Nandyal Main Branch',
  },
  warrantyTerms: [
    '12 Months Warranty on Motor & Engine assemblies against manufacturing defects.',
    'Includes 1 Free Periodic Maintenance Service Coupon valid across 150+ Shyam Agro Service Hubs.',
    'Genuine Spare Parts Availability Guarantee for 5+ years post purchase.',
  ],
  terms: [
    'Goods once sold will not be returned without valid RMA approval.',
    'Official manufacturer warranty valid only against this original tax invoice.',
    'Interest @18% p.a. will be levied on payments overdue beyond 30 days.',
    'Subject to Nandyal, Andhra Pradesh judicial jurisdiction only.',
    'E-Invoice issued under CGST Rules, 2017 Notification No. 13/2020.',
  ],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const DetailRow = ({ label, value, highlight = false }) => (
  <div className={`invoice-detail-row ${highlight ? 'highlight' : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const InvoicePage = () => {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const invoiceId = paramId || searchParams.get('id') || searchParams.get('orderId');

  const [loading, setLoading] = useState(!!invoiceId);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;
    let isMounted = true;
    setLoading(true);
    getInvoiceById(invoiceId)
      .then((res) => {
        if (isMounted && res) {
          setLiveData(res);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch invoice from API, using standard template:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  const activeInvoice = useMemo(() => {
    if (!liveData) return defaultInvoiceData;

    const items = (liveData.items || []).map((i) => ({
      name: i.productName || 'Agro Machinery & Equipment',
      hsn: i.productCode || '8432',
      qty: Number(i.quantity || 1),
      rate: Number(i.priceNum ?? (i.price ? String(i.price).replace(/[^0-9.]/g, '') : 0)),
    }));

    const rawMethod = liveData.paymentMethod || 'CASHFREE ONLINE GATEWAY';
    const rawStatus = liveData.paymentStatus || liveData.status || 'Paid';

    const isCashfreeOrOnline =
      rawMethod.toLowerCase().includes('cashfree') ||
      rawMethod.toLowerCase().includes('razorpay') ||
      rawMethod.toLowerCase().includes('online') ||
      rawMethod.toLowerCase().includes('card') ||
      rawMethod.toLowerCase().includes('upi') ||
      rawMethod.toLowerCase().includes('netbanking');

    const isPaid = rawStatus.toLowerCase() === 'paid' || isCashfreeOrOnline;

    return {
      ...defaultInvoiceData,
      invoiceNo: liveData.invoiceId || `SAT/INV/2026/${liveData.id || '101'}`,
      invoiceDate: liveData.date || liveData.orderDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderRefNo: `ORD-${liveData.id || '20260929'}`,
      buyer: {
        name: liveData.client || 'Valued Customer',
        address: liveData.address || 'Andhra Pradesh, India',
        mobile: liveData.phone || '+91 99126 49265',
        email: liveData.email || 'customer@shyamagro.com',
        gstin: 'Unregistered / Consumer',
      },
      shipping: {
        ...defaultInvoiceData.shipping,
        name: liveData.client || 'Valued Customer',
        address: liveData.shippingAddress || liveData.address || 'Andhra Pradesh, India',
        phone: liveData.phone || '+91 99126 49265',
      },
      products: items.length > 0 ? items : defaultInvoiceData.products,
      discount: Number(liveData.discountAmount || 0),
      shippingFee: Number(liveData.shippingFee || 0),
      payment: {
        mode: rawMethod,
        status: isPaid ? 'Paid' : 'Unpaid (Payment Pending)',
        transactionId: `TXN${liveData.id || '20260929'}SAT`,
        isPaid,
      },
    };
  }, [liveData]);

  const CGST_RATE = 0.09;
  const SGST_RATE = 0.09;

  const calculatedItems = useMemo(
    () =>
      activeInvoice.products.map((item) => {
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
      }),
    [activeInvoice]
  );

  const hsnSummary = useMemo(() => {
    const map = new Map();
    calculatedItems.forEach((item) => {
      const code = item.hsn || '8432';
      const existing = map.get(code) || { hsn: code, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      existing.taxable += item.taxableValue;
      existing.cgst += item.cgst;
      existing.sgst += item.sgst;
      existing.totalTax += item.cgst + item.sgst;
      map.set(code, existing);
    });
    return Array.from(map.values());
  }, [calculatedItems]);

  const totals = useMemo(() => {
    const taxableAmount = calculatedItems.reduce((sum, item) => sum + item.taxableValue, 0);
    const cgstTotal = calculatedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = calculatedItems.reduce((sum, item) => sum + item.sgst, 0);
    const productTotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const totalGst = cgstTotal + sgstTotal;
    const grandTotal = productTotal - activeInvoice.discount + activeInvoice.shippingFee;

    return {
      taxableAmount,
      cgstTotal,
      sgstTotal,
      totalGst,
      productTotal,
      grandTotal,
      amountInWords: numberToWordsINR(grandTotal),
    };
  }, [calculatedItems, activeInvoice]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="invoice-loading-container">
        <div className="invoice-spinner" />
        <p>Generating Official Corporate GST Tax Invoice...</p>
      </div>
    );
  }

  const isPaid = activeInvoice.payment.isPaid ?? (activeInvoice.payment.status.toLowerCase() === 'paid');

  return (
    <main className="invoice-page">
      <div className="invoice-actions no-print">
        <Link to="/my-orders" className="invoice-back-btn">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        <div className="invoice-actions-right">
          <button type="button" onClick={handlePrint} className="invoice-print-btn">
            <Printer size={18} />
            Print Official Invoice
          </button>
          <button type="button" onClick={handlePrint} className="invoice-download-btn">
            <Download size={18} />
            Save as PDF
          </button>
        </div>
      </div>

      <section className="invoice-sheet" aria-label="GST Tax Invoice">
        {/* Corporate Header */}
        <header className="invoice-header">
          <div className="invoice-brand">
            <div className="invoice-logo">
              <img src={headerLogo} alt="Shyam Agro Tools Logo" />
            </div>
            <div className="invoice-brand-details">
              <h1>{activeInvoice.companyName}</h1>
              <p className="invoice-tagline">{activeInvoice.tagline}</p>
              <div className="invoice-iso-badge">
                <Award size={12} /> {activeInvoice.isoCert} | IEC: {activeInvoice.iecCode}
              </div>
              <div className="invoice-company-meta">
                <span><strong>HQ Office:</strong> {activeInvoice.seller.address}</span>
                <span><strong>Factory & Industrial Hub:</strong> {activeInvoice.seller.factoryAddress}</span>
                <span><strong>GSTIN:</strong> {activeInvoice.seller.gstin} | <strong>CIN:</strong> {activeInvoice.seller.cin} | <strong>MSME:</strong> {activeInvoice.seller.msmeReg}</span>
                <span><strong>Toll-Free Helpline:</strong> {activeInvoice.seller.tollFree} | <strong>Sales Email:</strong> {activeInvoice.seller.email}</span>
              </div>
            </div>
          </div>
          <div className="invoice-title-block">
            <div className="invoice-tax-title">GST TAX INVOICE</div>
            <div className="invoice-original-badge">Original for Recipient</div>
            <div className={`invoice-payment-badge ${isPaid ? 'paid' : 'unpaid'}`}>
              <CheckCircle size={14} />
              <span>{isPaid ? 'PAID - CASHFREE ONLINE' : 'UNPAID - PAYMENT PENDING'}</span>
            </div>
          </div>
        </header>

        {/* Invoice Metadata Grid */}
        <section className="invoice-meta-grid">
          <DetailRow label="Invoice No" value={activeInvoice.invoiceNo} highlight />
          <DetailRow label="Invoice Date" value={activeInvoice.invoiceDate} />
          <DetailRow label="Order Reference" value={activeInvoice.orderRefNo} />
          <DetailRow label="Place of Supply" value={activeInvoice.placeOfSupply} />
          <DetailRow label="GST Classification" value={activeInvoice.gstType} />
        </section>

        {/* E-Way Bill & IRN Government Compliance Strip */}
        <section className="invoice-einvoice-strip">
          <div className="einvoice-info">
            <div><strong>Government E-Invoice IRN:</strong> <span className="irn-text">{activeInvoice.irnNo}</span></div>
            <div><strong>E-Way Bill Number:</strong> <strong>{activeInvoice.ewayBillNo}</strong></div>
          </div>
          <div className="einvoice-qr">
            <QrCode size={40} className="qr-icon" />
            <span>Govt IRN QR</span>
          </div>
        </section>

        {/* Party Details: Billed To & Shipped To */}
        <section className="invoice-party-grid">
          <article className="invoice-card">
            <div className="invoice-card-header">
              <FileCheck size={16} />
              <h2>Billed To (Buyer Details)</h2>
            </div>
            <p className="invoice-party-name">{activeInvoice.buyer.name}</p>
            <p className="invoice-party-address">{activeInvoice.buyer.address}</p>
            <p><strong>Mobile:</strong> {activeInvoice.buyer.mobile}</p>
            <p><strong>Email:</strong> {activeInvoice.buyer.email}</p>
            <p><strong>Customer GSTIN:</strong> {activeInvoice.buyer.gstin}</p>
          </article>

          <article className="invoice-card">
            <div className="invoice-card-header">
              <Truck size={16} />
              <h2>Shipped To & Logistics Details</h2>
            </div>
            <p className="invoice-party-name">{activeInvoice.shipping.name}</p>
            <p className="invoice-party-address">{activeInvoice.shipping.address}</p>
            <p><strong>Contact Mobile:</strong> {activeInvoice.shipping.phone}</p>
            <p><strong>Logistics Carrier:</strong> {activeInvoice.shipping.logisticsPartner}</p>
            <p><strong>LR / Docket No:</strong> {activeInvoice.shipping.docketNo} | <strong>Vehicle No:</strong> {activeInvoice.shipping.vehicleNo}</p>
            <p><strong>Dispatch Date:</strong> {activeInvoice.shipping.dispatchDate} ({activeInvoice.shipping.transportMode})</p>
          </article>
        </section>

        {/* Product GST Details Table */}
        <section className="invoice-table-section">
          <h2>Itemized Product & Tax Breakdown</h2>
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>#</th>
                  <th style={{ width: '36%' }}>Product Description & Technical Specifications</th>
                  <th style={{ width: '8%' }}>HSN</th>
                  <th style={{ width: '6%' }}>Qty</th>
                  <th style={{ width: '11%' }}>Unit Rate (₹)</th>
                  <th style={{ width: '12%' }}>Taxable Value (₹)</th>
                  <th style={{ width: '11%' }}>CGST (9%)</th>
                  <th style={{ width: '11%' }}>SGST (9%)</th>
                  <th style={{ width: '13%' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td className="invoice-product-name">{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.hsn}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.taxableValue)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.cgst)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.sgst)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* HSN/SAC Tax Summary Table */}
        <section className="invoice-hsn-section">
          <h2>HSN / SAC Wise GST Summary</h2>
          <div className="invoice-table-wrap">
            <table className="invoice-table hsn-table">
              <thead>
                <tr>
                  <th>HSN / SAC Code</th>
                  <th>Taxable Amount (₹)</th>
                  <th>CGST Rate</th>
                  <th>CGST Amount (₹)</th>
                  <th>SGST Rate</th>
                  <th>SGST Amount (₹)</th>
                  <th>Total Tax Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {hsnSummary.map((hsnRow, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{hsnRow.hsn}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(hsnRow.taxable)}</td>
                    <td style={{ textAlign: 'center' }}>9.0%</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(hsnRow.cgst)}</td>
                    <td style={{ textAlign: 'center' }}>9.0%</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(hsnRow.sgst)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(hsnRow.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial Summary Grid */}
        <section className="invoice-summary-grid">
          <article className="invoice-card payment-box">
            <h2>Payment & Gateway Settlement</h2>
            <DetailRow label="Payment Method" value={activeInvoice.payment.mode} />
            <DetailRow
              label="Settlement Status"
              value={isPaid ? 'PAID (Online Gateway Settled)' : 'UNPAID (Pending Collection)'}
            />
            <DetailRow label="Transaction Reference" value={activeInvoice.payment.transactionId} />
            <div className="invoice-payment-note">
              {isPaid
                ? 'Online payment completed and verified via Cashfree Payment Gateway.'
                : 'Payment pending upon delivery or bank settlement.'}
            </div>

            <div className="warranty-summary-box">
              <h3><Award size={14} /> Warranty & Service Assurance</h3>
              <ul>
                {activeInvoice.warrantyTerms.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="invoice-totals">
            <h2>Tax & Amount Breakdown</h2>
            <DetailRow label="Subtotal (Taxable Value)" value={formatCurrency(totals.taxableAmount)} />
            <DetailRow label="CGST Total (9%)" value={formatCurrency(totals.cgstTotal)} />
            <DetailRow label="SGST Total (9%)" value={formatCurrency(totals.sgstTotal)} />
            <DetailRow label="Freight / Shipping Fee" value={activeInvoice.shippingFee > 0 ? formatCurrency(activeInvoice.shippingFee) : 'FREE'} />
            {activeInvoice.discount > 0 && (
              <DetailRow label="Promotional Discount" value={`- ${formatCurrency(activeInvoice.discount)}`} />
            )}
            <div className="invoice-grand-total">
              <span>Grand Total</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </article>
        </section>

        {/* Amount in Words */}
        <section className="invoice-words">
          <span>Amount in Words</span>
          <strong>{totals.amountInWords}</strong>
        </section>

        {/* Bottom Grid */}
        <section className="invoice-bottom-grid">
          <article className="invoice-card bank-card">
            <h2>Bank Account Details (NEFT / RTGS)</h2>
            <p><strong>Bank Name:</strong> {activeInvoice.bank.name}</p>
            <p><strong>Account Name:</strong> {activeInvoice.bank.accountName}</p>
            <p><strong>Account Number:</strong> {activeInvoice.bank.accountNo}</p>
            <p><strong>IFSC Code:</strong> {activeInvoice.bank.ifsc}</p>
            <p><strong>Branch:</strong> {activeInvoice.bank.branch}</p>
          </article>

          <article className="invoice-card terms-card">
            <h2>Terms & Conditions</h2>
            <ul>
              {activeInvoice.terms.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="invoice-signature">
            <div className="signature-content">
              <div className="stamp-box">
                <span className="stamp-title">SHYAM AGRO TOOLS</span>
                <span className="stamp-sub">VERIFIED TAX INVOICE</span>
              </div>
              <span>For {activeInvoice.companyName}</span>
              <strong>Authorized Signatory</strong>
              <p className="computer-gen-note">
                This is a computer-generated GST tax invoice issued under Rule 46 of CGST Rules, 2017.
              </p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
};

export default InvoicePage;
