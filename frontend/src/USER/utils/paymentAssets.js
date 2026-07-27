const PAYMENT_ASSET_TEXT = {
  en: {
    upi: ['UPI', 'Instant Pay'],
    qr: ['QR', 'Scan & Pay'],
    bank: ['BANK', 'Transfer'],
    card: ['CARD', 'Secure Card'],
    cod: ['COD', 'Cash on Delivery'],
  },
  te: {
    upi: ['UPI', 'తక్షణ చెల్లింపు'],
    qr: ['QR', 'స్కాన్ చేసి చెల్లించండి'],
    bank: ['బ్యాంక్', 'ట్రాన్స్‌ఫర్'],
    card: ['కార్డ్', 'సురక్షిత చెల్లింపు'],
    cod: ['COD', 'డెలివరీపై నగదు'],
  },
  hi: {
    upi: ['UPI', 'तुरंत भुगतान'],
    qr: ['QR', 'स्कैन करें'],
    bank: ['बैंक', 'ट्रांसफर'],
    card: ['कार्ड', 'सुरक्षित भुगतान'],
    cod: ['COD', 'डिलीवरी पर नकद'],
  },
};

const METHOD_COLORS = {
  upi: ['#eaf7e7', '#2f8f2f'],
  qr: ['#eef4ff', '#2856a3'],
  bank: ['#fff4dd', '#9a6400'],
  card: ['#f1edff', '#5c3fa3'],
  cod: ['#eaf8f4', '#11705c'],
};

const normalizeLanguage = (language) => String(language || 'en').split('-')[0].toLowerCase();

const normalizeMethod = (method) => {
  if (method === 'qr-payment' || method === 'qrCode') return 'qr';
  if (method === 'bankTransfer' || method === 'net-banking') return 'bank';
  if (method === 'debitCard' || method === 'creditCard' || method === 'cards') return 'card';
  if (method === 'cashOnDelivery') return 'cod';
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
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedMethod = normalizeMethod(method);
  const labels =
    PAYMENT_ASSET_TEXT[normalizedLanguage]?.[normalizedMethod] ||
    PAYMENT_ASSET_TEXT.en[normalizedMethod] ||
    PAYMENT_ASSET_TEXT.en.upi;
  const [background, foreground] = METHOD_COLORS[normalizedMethod] || METHOD_COLORS.upi;

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="72" viewBox="0 0 180 72" role="img">
      <rect width="180" height="72" rx="16" fill="${background}"/>
      <circle cx="38" cy="36" r="22" fill="#ffffff"/>
      <text x="38" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${foreground}">${escapeXml(labels[0]).slice(0, 6)}</text>
      <text x="72" y="31" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="#172018">${escapeXml(labels[0])}</text>
      <text x="72" y="51" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${foreground}">${escapeXml(labels[1])}</text>
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
