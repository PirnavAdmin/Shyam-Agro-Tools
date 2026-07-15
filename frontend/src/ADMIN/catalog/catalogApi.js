import axios from 'axios';

// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE_URL = 'https://shyamagrotools.com';

// Axios instance — always skip the ngrok browser-warning page
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a relative image path to a full URL */
const resolveImageUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

/** Extract an array from various API response shapes */
const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/** Extract a single object from an API response */
const unwrapItem = (response) => {
  const data = response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data;
  }
  return data ?? {};
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

export const mapCategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? raw.categoryId ?? ''),
  name: raw.name || raw.categoryName || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  metaTitle: raw.metaTitle || `${raw.name || ''} | Shyam Agro`,
  metaDescription: raw.metaDescription || raw.description || '',
  image: resolveImageUrl(raw.imageUrl || raw.image),
  imageUrl: raw.imageUrl || '',
  subCategories: raw.subCategories || raw.subcategories || [],
  products: raw.products || [],
  code: raw.categoryCode || String(raw.id || ''),
});

export const mapSubcategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? raw.subcategoryId ?? ''),
  categoryId: String(raw.categoryId ?? ''),
  name: raw.name || raw.subcategoryName || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  image: resolveImageUrl(raw.imageUrl || raw.image),
  imageUrl: raw.imageUrl || '',
  categoryName: raw.categoryName || '',
  products: raw.products || [],
});

export const mapProductFromApi = (raw = {}, categories = [], subcategories = []) => {
  const subcategoryId = String(raw.subcategoryId ?? raw.subCategoryId ?? '');
  const categoryId = String(
    raw.categoryId ??
    subcategories.find((s) => s.id === subcategoryId)?.categoryId ??
    ''
  );

  let brandName = 'Shyam Agro Tools';
  if (typeof raw.brand === 'string') {
    brandName = raw.brand;
  } else if (raw.brand && typeof raw.brand === 'object') {
    brandName = raw.brand.name || raw.brand.brandName || brandName;
  }

  const stock = Number(raw.stockQuantity ?? raw.stock ?? 0);

  const reviews = (Array.isArray(raw.reviews) ? raw.reviews : []).map((r) => ({
    customer: r.customerName || r.customer || 'Anonymous',
    rating: String(Number(r.rating) || 5),
    date: r.dateCreated ? r.dateCreated.slice(0, 7) : new Date().toISOString().slice(0, 7),
    comment: r.comment || '',
    verified: r.verified !== false,
  }));

  const keyFeatures = Array.isArray(raw.features)
    ? raw.features.map((f) =>
        f.featureName && f.featureValue
          ? `${f.featureName}: ${f.featureValue}`
          : f.featureName || ''
      )
    : Array.isArray(raw.keyFeatures)
    ? raw.keyFeatures
    : [];

  const media = Array.isArray(raw.media) ? raw.media : [];

  return {
    id: String(raw.id ?? ''),
    name: raw.name || raw.productName || '',
    sku: raw.sku || '',
    brand: brandName,
    supplier: raw.supplier || raw.manufacturer || '',
    categoryId: categoryId || categories[0]?.id || '',
    subcategoryId: subcategoryId || subcategories[0]?.id || '',
    mrp: String(raw.basePrice ?? raw.mrp ?? raw.price ?? ''),
    price: String(raw.price ?? ''),
    discountType: raw.discountType || 'none',
    discountValue: String(raw.discountValue ?? ''),
    stock: String(stock),
    status: raw.isActive === false ? 'Out of Stock' : stock > 0 ? 'In Stock' : 'Out of Stock',
    countryOfOrigin: raw.countryOfOrigin || 'India',
    codAvailable: raw.codAvailable || 'Yes',
    deliveryEstimate: raw.deliveryEstimate || '3-7 business days',
    returnPolicy: raw.returnPolicy || 'Easy Returns',
    shortDescription: raw.shortDescription || raw.shortDesc || raw.description || '',
    description: raw.description || '',
    productDetails: raw.productDetails || raw.longDesc || raw.description || '',
    packageIncludes: raw.packageIncludes || '',
    specifications: {
      weight: raw.weight || raw.specifications?.weight || '',
      dimensions: raw.dimensions || raw.specifications?.dimensions || '',
      powerSource: raw.powerSource || raw.specifications?.powerSource || '',
      material: raw.material || raw.specifications?.material || '',
      coverage: raw.coverageUsage || raw.specifications?.coverage || '',
    },
    keyFeatures,
    rating: String(raw.rating ?? ''),
    totalReviews: String(raw.totalReviews ?? reviews.length ?? ''),
    ratingBreakdown: raw.ratingBreakdown ?? { 5: '', 4: '', 3: '', 2: '', 1: '' },
    reviews,
    image: resolveImageUrl(raw.imageUrl || media[0]?.mediaUrl || ''),
    imageUrl: raw.imageUrl || media[0]?.mediaUrl || '',
  };
};

// ─── Category API ─────────────────────────────────────────────────────────────
// GET  https://shyamagrotools.com/api/Category
// POST https://shyamagrotools.com/api/Category
// PUT  https://shyamagrotools.com/api/Category/{id}
// DEL  https://shyamagrotools.com/api/Category/{id}

export const fetchCategories = async () => {
  const response = await api.get('/api/Category');
  return unwrapList(response).map(mapCategoryFromApi);
};

export const fetchCategory = async (id) => {
  // Try a direct single-item endpoint first, fall back to list search
  try {
    const response = await api.get(`/api/Category/${id}`);
    const item = unwrapItem(response);
    return mapCategoryFromApi(item);
  } catch {
    const all = await fetchCategories();
    const found = all.find((c) => String(c.id) === String(id));
    if (found) return found;
    throw new Error('Category not found');
  }
};

export const saveCategory = async (category) => {
  const isEditing = Boolean(category.id);

  const fd = new FormData();
  fd.append('Name', category.name || '');
  fd.append('Description', category.description || '');
  fd.append('Slug', category.slug || '');
  fd.append('DisplayOrder', category.displayOrder || '');
  fd.append('IsActive', category.status === 'Active' ? 'true' : 'false');
  fd.append('MetaTitle', category.metaTitle || '');
  fd.append('MetaDescription', category.metaDescription || '');

  if (category.imageFile) {
    fd.append('ImageFile', category.imageFile);
  } else if (category.imageUrl || category.image) {
    fd.append('ImageUrl', category.imageUrl || category.image || '');
  }

  const response = await api({
    method: isEditing ? 'PUT' : 'POST',
    url: isEditing ? `/api/Category/${category.id}` : '/api/Category',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return mapCategoryFromApi(unwrapItem(response));
};

export const deleteCategory = async (id) => {
  await api.delete(`/api/Category/${id}`);
};

// ─── Subcategory API ──────────────────────────────────────────────────────────
// GET  https://shyamagrotools.com/api/Subcategory
// POST https://shyamagrotools.com/api/Subcategory
// PUT  https://shyamagrotools.com/api/Subcategories/{id}
// DEL  https://shyamagrotools.com/api/Subcategories/{id}

export const fetchSubcategories = async () => {
  const response = await api.get('/api/Subcategory');
  return unwrapList(response).map(mapSubcategoryFromApi);
};

export const fetchSubcategory = async (id) => {
  try {
    const response = await api.get(`/api/Subcategory/${id}`);
    const item = unwrapItem(response);
    return mapSubcategoryFromApi(item);
  } catch {
    const all = await fetchSubcategories();
    const found = all.find((s) => String(s.id) === String(id));
    if (found) return found;
    throw new Error('Subcategory not found');
  }
};

export const saveSubcategory = async (subcategory) => {
  const isEditing = Boolean(subcategory.id);

  const payload = {
    categoryId: Number(subcategory.categoryId) || 0,
    name: subcategory.name || '',
    slug: subcategory.slug || '',
    description: subcategory.description || '',
    displayOrder: Number(subcategory.displayOrder) || 0,
    isActive: subcategory.status === 'Active',
  };

  const response = await api({
    method: isEditing ? 'PUT' : 'POST',
    // Note: PUT/DELETE use /api/Subcategories/{id} (plural), POST uses /api/Subcategory
    url: isEditing ? `/api/Subcategories/${subcategory.id}` : '/api/Subcategory',
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });

  const saved = mapSubcategoryFromApi(unwrapItem(response));
  // Ensure categoryId is preserved even if the response omits it
  return {
    ...saved,
    categoryId: saved.categoryId || String(subcategory.categoryId),
  };
};

export const deleteSubcategory = async (id) => {
  await api.delete(`/api/Subcategories/${id}`);
};

// ─── Products API ─────────────────────────────────────────────────────────────
// GET  https://shyamagrotools.com/api/Catalog/products
// POST https://shyamagrotools.com/api/Catalog/products
// PUT  https://shyamagrotools.com/api/Catalog/products/{id}
// DEL  https://shyamagrotools.com/api/Catalog/products/{id}

export const fetchProducts = async (categories = [], subcategories = []) => {
  const response = await api.get('/api/Catalog/products');
  return unwrapList(response).map((p) => mapProductFromApi(p, categories, subcategories));
};

export const fetchProduct = async (id, categories = [], subcategories = []) => {
  const response = await api.get(`/api/Catalog/products/${id}`);
  return mapProductFromApi(unwrapItem(response), categories, subcategories);
};

export const saveProduct = async (product, imageFiles = [], videoFile = null) => {
  const isEditing = Boolean(product.id);

  const fd = new FormData();
  fd.append('SubcategoryId', Number(product.subcategoryId) || 0);
  fd.append('Name', product.name || '');
  fd.append('Sku', product.sku || '');
  fd.append('Brand', product.brand || 'Shyam Agro Tools');
  fd.append('Supplier', product.supplier || '');
  fd.append('Description', product.shortDescription || product.description || '');
  fd.append('ProductDetails', product.productDetails || '');
  fd.append('PackageIncludes', product.packageIncludes || '');
  fd.append('Price', Number(product.price) || 0);
  fd.append('BasePrice', Number(product.mrp) || Number(product.price) || 0);
  fd.append('DiscountType', product.discountType || 'none');
  fd.append('DiscountValue', Number(product.discountValue) || 0);
  fd.append('StockQuantity', Number(product.stock) || 0);
  fd.append('Status', product.status || 'In Stock');
  fd.append('CountryOfOrigin', product.countryOfOrigin || 'India');
  fd.append('CodAvailable', product.codAvailable || 'Yes');
  fd.append('DeliveryEstimate', product.deliveryEstimate || '3-7 business days');
  fd.append('ReturnPolicy', product.returnPolicy || 'Easy Returns');
  fd.append('Rating', Number(product.rating) || 0);
  fd.append('TotalReviews', Number(product.totalReviews) || 0);

  // Specifications
  fd.append('Weight', product.specifications?.weight || '');
  fd.append('Dimensions', product.specifications?.dimensions || '');
  fd.append('PowerSource', product.specifications?.powerSource || '');
  fd.append('Material', product.specifications?.material || '');
  fd.append('CoverageUsage', product.specifications?.coverage || '');

  // Key features
  if (Array.isArray(product.keyFeatures)) {
    product.keyFeatures
      .filter((f) => f && f.trim())
      .forEach((feature, idx) => {
        let name = feature.trim();
        let val = '';
        if (feature.includes(':')) {
          const parts = feature.split(':');
          name = parts[0].trim();
          val = parts.slice(1).join(':').trim();
        }
        fd.append(`Features[${idx}].FeatureName`, name);
        fd.append(`Features[${idx}].FeatureValue`, val);
      });
  }

  // Images
  if (Array.isArray(imageFiles) && imageFiles.length > 0) {
    imageFiles.forEach((file) => fd.append('ImageFiles', file));
  } else if (product.imageUrl) {
    fd.append('ImageUrl', product.imageUrl);
  }

  // Video
  if (videoFile) {
    fd.append('VideoFile', videoFile);
  }

  const response = await api({
    method: isEditing ? 'PUT' : 'POST',
    url: isEditing ? `/api/Catalog/products/${product.id}` : '/api/Catalog/products',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const saved = mapProductFromApi(unwrapItem(response));

  // Persist the ID so the caller can reference it
  return { ...saved, id: saved.id || product.id || '' };
};

export const deleteProduct = async (id) => {
  await api.delete(`/api/Catalog/products/${id}`);
};
