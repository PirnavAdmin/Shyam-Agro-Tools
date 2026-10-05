const PAYMENT_ASSET_TEXT = {
  en: {
    upi: ['UPI', 'Instant Pay'],
    qr: ['QR', 'Scan & Pay'],
    bank: ['BANK', 'Transfer'],
    card: ['CARD', 'Secure Card'],
    cashfree: ['CASHFREE', 'UPI, Cards & More'],
    cod: ['COD', 'Cash on Delivery'],
  },
  te: {
    upi: ['UPI', 'తక్షణ చెల్లింపు'],
    qr: ['QR', 'స్కాన్ చేసి చెల్లించండి'],
    bank: ['బ్యాంక్', 'ట్రాన్స్‌ఫర్'],
    card: ['కార్డ్', 'సురక్షిత చెల్లింపు'],
    cashfree: ['క్యాష్‌ఫ్రీ', 'UPI & కార్డులు'],
    cod: ['COD', 'డెలివరీపై నగదు'],
  },
  hi: {
    upi: ['UPI', 'तुरंत भुगतान'],
    qr: ['QR', 'स्कैन करें'],
    bank: ['बैंक', 'ट्रांसफर'],
    card: ['कार्ड', 'सुरक्षित भुगतान'],
    cashfree: ['कैशफ्री', 'UPI एवं कार्ड्स'],
    cod: ['COD', 'डिलीवरी पर नकद'],
  },
};

const METHOD_COLORS = {
  upi: ['#eaf7e7', '#2f8f2f'],
  qr: ['#eef4ff', '#2856a3'],
  bank: ['#fff4dd', '#9a6400'],
  card: ['#f1edff', '#5c3fa3'],
  cashfree: ['#f3e8ff', '#673ab7'],
  cod: ['#eaf8f4', '#11705c'],
};

const normalizeLanguage = (language) => String(language || 'en').split('-')[0].toLowerCase();

const normalizeMethod = (method) => {
  if (method === 'cashfree' || method === 'cashfree-gateway') return 'cashfree';
  if (method === 'qr-payment' || method === 'qrCode' || method === 'qr') return 'qr';
  if (method === 'bankTransfer' || method === 'net-banking' || method === 'bank') return 'bank';
  if (method === 'debitCard' || method === 'creditCard' || method === 'cards' || method === 'card') return 'card';
  if (method === 'cashOnDelivery' || method === 'cod') return 'cod';
  return method || 'upi';
};

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const svgToDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const buildFallbackAsset = (language, method) => {
  const normalizedMethod = normalizeMethod(method);
  const [background, foreground] = METHOD_COLORS[normalizedMethod] || METHOD_COLORS.upi;

  let iconSvgPath = '';
  if (normalizedMethod === 'cashfree') {
    iconSvgPath = `<path d="M11 21l8-10h-6l2-7-8 10h6l-2 7z" fill="#ffffff"/>`;
  } else if (normalizedMethod === 'qr') {
    iconSvgPath = `
      <rect x="7" y="7" width="7" height="7" fill="#ffffff"/>
      <rect x="18" y="7" width="7" height="7" fill="#ffffff"/>
      <rect x="7" y="18" width="7" height="7" fill="#ffffff"/>
      <rect x="17" y="17" width="4" height="4" fill="#ffffff"/>
      <rect x="21" y="21" width="4" height="4" fill="#ffffff"/>
    `;
  } else if (normalizedMethod === 'bank') {
    iconSvgPath = `
      <path d="M4 9l12-6 12 6v2H4V9zm2 5h3v8H6v-8zm7 0h3v8h-3v-8zm7 0h3v8h-3v-8zM4 24h24v2H4v-2z" fill="#ffffff"/>
    `;
  } else if (normalizedMethod === 'card') {
    iconSvgPath = `
      <rect x="3" y="7" width="26" height="18" rx="3" fill="#ffffff"/>
      <rect x="3" y="11" width="26" height="4" fill="${foreground}"/>
      <rect x="7" y="17" width="5" height="4" fill="#ffd700" rx="1"/>
    `;
  } else if (normalizedMethod === 'cod') {
    iconSvgPath = `
      <rect x="3" y="7" width="26" height="18" rx="3" fill="#ffffff"/>
      <circle cx="16" cy="16" r="4.5" fill="${foreground}"/>
      <path d="M16 13.5v5M14.2 14.5h3.6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    `;
  } else {
    iconSvgPath = `
      <rect x="9" y="4" width="14" height="24" rx="3.5" fill="#ffffff"/>
      <rect x="11" y="6" width="10" height="16" fill="${foreground}"/>
      <path d="M16 10l-2.5 4h4l-1.5 4" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  }

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="118" height="48" viewBox="0 0 118 48" role="img">
      <rect width="118" height="48" rx="12" fill="${background}"/>
      <circle cx="59" cy="24" r="16" fill="${foreground}"/>
      <g transform="translate(43, 8)">
        ${iconSvgPath}
      </g>
    </svg>
  `);
};

export const paymentAssetFolders = {
  en: '/assets/en/payment',
  te: '/assets/te/payment',
  hi: '/assets/hi/payment',
};

export const getPaymentAsset = (language, method) => {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedMethod = normalizeMethod(method);

  return buildFallbackAsset(normalizedLanguage, normalizedMethod);
};

export const withLanguageAssetVersion = (url, language) => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lang=${encodeURIComponent(normalizeLanguage(language))}`;
};
