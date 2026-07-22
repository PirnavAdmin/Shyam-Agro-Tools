import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Coupons`;

function mapBackendToFrontend(apiCoupon) {
  return {
    id: String(apiCoupon.id || ''),
    code: apiCoupon.code || '',
    description: apiCoupon.description || `${apiCoupon.code} promotion campaign` || '',
    discount: String(apiCoupon.discountValue || 0),
    type: apiCoupon.discountType === 'FixedAmount' ? 'Flat Amount' : (apiCoupon.discountType || 'Percentage'),
    minSpend: String(apiCoupon.minCartValue || 0),
    maxDiscount: String(apiCoupon.maxDiscount || apiCoupon.discountValue || 0),
    startDate: apiCoupon.startDate ? apiCoupon.startDate.split('T')[0] : '',
    endDate: apiCoupon.endDate ? apiCoupon.endDate.split('T')[0] : '',
    usageLimit: String(apiCoupon.usageLimit || 0),
    perCustomerLimit: String(apiCoupon.perCustomerLimit || 1),
    status: apiCoupon.isActive ? 'Active' : 'Inactive',
    usedCount: apiCoupon.usedCount || 0,
    audience: apiCoupon.audience || 'All Customers'
  };
}

function mapFrontendToBackend(coupon) {
  return {
    id: coupon.id ? Number(coupon.id) : undefined,
    code: coupon.code,
    discountType: coupon.type === 'Flat Amount' ? 'FixedAmount' : coupon.type,
    discountValue: Number(coupon.discount || 0),
    minCartValue: Number(coupon.minSpend || 0),
    usageLimit: Number(coupon.usageLimit || 0),
    usedCount: Number(coupon.usedCount || 0),
    startDate: coupon.startDate ? `${coupon.startDate}T00:00:00` : null,
    endDate: coupon.endDate ? `${coupon.endDate}T23:59:59` : null,
    isActive: coupon.status === 'Active'
  };
}

export async function fetchCoupons() {
  const response = await fetch(BASE_URL, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch coupons: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapBackendToFrontend) : [];
}

export async function createCoupon(coupon) {
  const payload = mapFrontendToBackend(coupon);
  delete payload.id; // Backend generates ID on creation

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create coupon: ${response.status}`);
  }
  return response.json();
}

export async function updateCoupon(id, updates) {
  const payload = mapFrontendToBackend(updates);
  payload.id = Number(id);

  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to update coupon: ${response.status}`);
  }
  return response.json();
}

export async function deleteCoupon(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errData = await response.json();
      throw new Error(errData.message || `Failed to delete coupon: ${response.status}`);
    } else {
      const errText = await response.text();
      const match = errText.match(/MySqlException: ([^\r\n]+)/);
      if (match) {
        throw new Error(match[1]);
      }
      throw new Error(`Server Error: ${response.status}`);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return { status: true, message: 'Deleted' };
}

export async function toggleCouponStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  return updateCoupon(id, { status: newStatus });
}
