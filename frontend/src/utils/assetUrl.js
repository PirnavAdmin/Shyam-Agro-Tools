const LEGACY_ASSET_HOSTS = [
  'https://wildlife-unwieldy-devotee.ngrok-free.dev',
  'http://wildlife-unwieldy-devotee.ngrok-free.dev',
];

const INVALID_ASSET_VALUES = new Set(['', 'string', 'null', 'undefined']);

export const normalizeAssetUrl = (value, baseUrl, fallback = '') => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || INVALID_ASSET_VALUES.has(raw.toLowerCase())) return fallback;
  if (/^(data|blob):/i.test(raw)) return raw;

  const cleanBaseUrl = (baseUrl || 'https://shyamagrotools.com').replace(/\/$/, '');
  const legacyHost = LEGACY_ASSET_HOSTS.find((host) => raw.toLowerCase().startsWith(host.toLowerCase()));
  if (legacyHost) {
    return `${cleanBaseUrl}${raw.slice(legacyHost.length)}`;
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) return raw;
  return `${cleanBaseUrl}/${raw.replace(/^\/+/, '')}`;
};
