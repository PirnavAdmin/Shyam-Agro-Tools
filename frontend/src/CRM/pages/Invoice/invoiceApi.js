const API_BASE_URL = "http://shyamagrotools.com/api";

export const INVOICES_API_URL = `${API_BASE_URL}/Invoices`;
export const INVOICE_ACTIONS_API_URL = `${API_BASE_URL}/invoice-actions`;

export const invoiceApiHeaders = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

const readResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

export const invoiceRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...invoiceApiHeaders,
      ...(options.headers || {}),
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body || {});
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return body;
};

export const normalizeInvoiceEnvelope = (record) => {
  if (!record) {
    return {
      invoice: {},
      items: [],
      billing: {},
      shipping: {},
      payment: {},
    };
  }

  // If the record is already nested (e.g. from local form state), return it as is or normalize it
  if (record.invoice && record.items) {
    return {
      invoice: record.invoice,
      items: Array.isArray(record.items) ? record.items : [],
      billing: record.billing || {},
      shipping: record.shipping || {},
      payment: record.payment || {},
    };
  }

  const rawInvoice = record;
  const items = Array.isArray(rawInvoice.items)
    ? rawInvoice.items.map((item) => {
        const rate = item.price
          ? Number(String(item.price).replace(/[^0-9.]/g, ""))
          : Number(item.rate || 0);
        const amount = item.total
          ? Number(String(item.total).replace(/[^0-9.]/g, ""))
          : rate * Number(item.quantity || 1);
        return {
          itemId: item.itemId || 0,
          productName: item.productName || "",
          productDetails: item.productDetails || "",
          rate,
          quantity: Number(item.quantity || 1),
          amount,
        };
      })
    : [];

  const billedAmount = rawInvoice.billed
    ? Number(String(rawInvoice.billed).replace(/[^0-9.]/g, ""))
    : Number(rawInvoice.totalAmount || 0);

  const subTotal = items.reduce((sum, item) => sum + item.rate * item.quantity, 0) || billedAmount;
  const taxAmount = subTotal * 0.125;
  const totalAmount = billedAmount || (subTotal + taxAmount);

  const invoice = {
    invoiceId: rawInvoice.id || 0,
    invoiceNumber: rawInvoice.invoiceId || rawInvoice.invoiceNumber || `INV-${rawInvoice.id}`,
    invoiceDate: rawInvoice.date ? new Date(rawInvoice.date).toISOString() : new Date().toISOString(),
    clientName: rawInvoice.client || rawInvoice.clientName || "",
    email: rawInvoice.email || rawInvoice.emailAddress || "",
    companyAddress: rawInvoice.address || rawInvoice.companyAddress || rawInvoice.shippingAddress || "",
    postalCode: rawInvoice.postalCode || "",
    contactNo: rawInvoice.phone || rawInvoice.contactNo || "",
    paymentStatus: rawInvoice.status || rawInvoice.paymentStatus || "Unpaid",
    invoiceStatus: rawInvoice.status || rawInvoice.paymentStatus || "Unpaid",
    subTotal,
    taxAmount,
    discountAmount: Number(rawInvoice.discount || 0),
    shippingCharge: Number(rawInvoice.shippingCharge || 0),
    totalAmount,
    notes: rawInvoice.notes || "",
  };

  const billing = {
    billingId: 0,
    invoiceId: rawInvoice.id || 0,
    fullName: rawInvoice.billingName || rawInvoice.client || "",
    address: rawInvoice.billingAddress || rawInvoice.address || "",
    phone: rawInvoice.billingPhone || rawInvoice.phone || "",
    taxNumber: rawInvoice.billingTaxNumber || rawInvoice.taxNumber || "",
    email: rawInvoice.billingEmail || rawInvoice.email || "",
  };

  const shipping = {
    shippingId: 0,
    invoiceId: rawInvoice.id || 0,
    fullName: rawInvoice.shippingName || rawInvoice.client || "",
    address: rawInvoice.shippingAddress || rawInvoice.address || "",
    phone: rawInvoice.shippingPhone || rawInvoice.phone || "",
    taxNumber: rawInvoice.shippingTaxNumber || rawInvoice.taxNumber || "",
    email: rawInvoice.shippingEmail || rawInvoice.email || "",
  };

  const payment = {
    paymentId: 0,
    invoiceId: rawInvoice.id || 0,
    paymentMethod: rawInvoice.paymentMethod || "Cash",
    cardHolderName: "",
    cardNumber: "",
  };

  return {
    invoice,
    items,
    billing,
    shipping,
    payment,
  };
};

export const normalizeInvoiceCollection = (data) => {
  const records = Array.isArray(data) ? data : data?.value || data?.invoices || [];
  return Array.isArray(records) ? records.map(normalizeInvoiceEnvelope) : [];
};

export const downloadInvoiceBlob = async (url, fallbackFilename) => {
  const response = await fetch(url, {
    method: "GET",
    headers: invoiceApiHeaders,
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : fallbackFilename;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
