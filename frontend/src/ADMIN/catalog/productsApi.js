import axios from 'axios';

// ─── Base URL ────────────────────────────────────────────────────────────────
export const BASE_URL = 'https://wildlife-unwieldy-devotee.ngrok-free.dev';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a relative image path to a full URL */
export const resolveImageUrl = (url) => {
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

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Map a raw category object from the API to our frontend shape */
export const mapCategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? ''),
  name: raw.categoryName || raw.name || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  metaTitle: raw.metaTitle || `${raw.categoryName || raw.name || ''} | Shyam Agro`,
  metaDescription: raw.metaDescription || raw.description || '',
  image: resolveImageUrl(raw.imageUrl || raw.image || ''),
  imageUrl: raw.imageUrl || '',
  subCategories: raw.subCategories || raw.subcategories || [],
  products: raw.products || [],
  code: raw.categoryCode || String(raw.id || ''),
});

/** Map a raw subcategory object from the API to our frontend shape */
export const mapSubcategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? ''),
  categoryId: String(raw.categoryId ?? ''),
  name: raw.subcategoryName || raw.name || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  image: resolveImageUrl(raw.imageUrl || raw.image || ''),
  imageUrl: raw.imageUrl || '',
  categoryName: raw.categoryName || raw.category?.categoryName || '',
  products: raw.products || [],
});

/**
 * Map a raw product object from the API to the frontend shape expected by
 * ProductsForm and ProductsList.
 *
 * @param {object} raw           - Raw product from API
 * @param {Array}  categories    - Loaded category list (for fallback resolution)
 * @param {Array}  subcategories - Loaded subcategory list (for fallback resolution)
 * @param {Array}  features      - Optional array from GET /api/features/{id}
 * @param {Array}  reviews       - Optional array from GET /api/reviews/{id}
 */
export const mapProductFromApi = (
  raw = {},
  categories = [],
  subcategories = [],
  features = [],
  reviews = []
) => {
  // ── IDs ──────────────────────────────────────────────────────────────────
  const subcategoryId = String(raw.subcategoryId ?? '');
  const categoryId = String(
    raw.categoryId ??
      raw.category?.id ??
      subcategories.find((s) => s.id === subcategoryId)?.categoryId ??
      ''
  );

  // ── Brand ─────────────────────────────────────────────────────────────────
  let brandName = 'Shyam Agro Tools';
  if (typeof raw.brand === 'string' && raw.brand) {
    brandName = raw.brand;
  } else if (raw.brand && typeof raw.brand === 'object') {
    brandName = raw.brand.brandName || raw.brand.name || brandName;
  }

  const stock = Number(raw.stock ?? raw.stockQuantity ?? 0);

  // ── Key Features ─────────────────────────────────────────────────────────
  // Priority: separately fetched features → embedded raw.features → raw.keyFeatures
  const keyFeatures =
    Array.isArray(features) && features.length > 0
      ? features.map((f) => f.feature || f.featureName || '')
      : Array.isArray(raw.features) && raw.features !== null
      ? raw.features.map((f) => f.feature || f.featureName || '')
      : Array.isArray(raw.keyFeatures)
      ? raw.keyFeatures
      : [];

  // ── Reviews ───────────────────────────────────────────────────────────────
  // Priority: separately fetched reviews → embedded raw.reviews
  const rawReviews =
    Array.isArray(reviews) && reviews.length > 0
      ? reviews
      : Array.isArray(raw.reviews) && raw.reviews !== null
      ? raw.reviews
      : [];

  const mappedReviews = rawReviews.map((r) => ({
    id: String(r.id ?? ''),
    customer: r.customerName || r.customer || 'Anonymous',
    rating: String(Number(r.rating) || 5),
    date: r.reviewDate
      ? r.reviewDate.slice(0, 7)
      : r.dateCreated
      ? r.dateCreated.slice(0, 7)
      : new Date().toISOString().slice(0, 7),
    comment: r.reviewComment || r.comment || '',
    verified: (r.verifiedPurchase ?? r.verified) !== false,
  }));

  // ── Images ────────────────────────────────────────────────────────────────
  const rawImages = raw.images || raw.media || [];
  const images = Array.isArray(rawImages)
    ? rawImages.map((img) => {
        if (!img) return '';
        if (typeof img === 'string') return resolveImageUrl(img);
        return resolveImageUrl(
          img.imageUrl ||
          img.ImageUrl ||
          img.url ||
          img.Url ||
          img.image ||
          img.Image ||
          img.mediaUrl ||
          img.MediaUrl ||
          ''
        );
      }).filter(Boolean)
    : [];
  const mainImageUrl = images[0] || resolveImageUrl(raw.imageUrl || '');

  // ── Videos ────────────────────────────────────────────────────────────────
  const videos = Array.isArray(raw.videos)
    ? raw.videos.map((vid) => resolveImageUrl(vid.videoUrl || vid.url || ''))
    : [];
  const mainVideoUrl = videos[0] || resolveImageUrl(raw.videoUrl || '');

  return {
    id: String(raw.id ?? ''),
    name: raw.productName || raw.name || '',
    sku: raw.sku || '',
    brand: brandName,
    supplier: raw.manufacturer || raw.supplier || '',
    categoryId: categoryId || (categories[0]?.id ?? ''),
    subcategoryId: subcategoryId || (subcategories[0]?.id ?? ''),

    // Pricing
    mrp: String(raw.mrp ?? ''),
    price: String(raw.sellingPrice ?? raw.price ?? ''),
    discountType: (() => {
      const dt = (raw.discountType || '').toLowerCase();
      if (dt === 'percentage' || dt === 'percent') return 'percentage';
      if (dt === 'flat' || dt === 'fixed') return 'fixed';
      return 'none';
    })(),
    discountValue: String(raw.discountAmount ?? raw.discountValue ?? ''),

    // Inventory
    stock: String(stock),
    status: raw.stockStatus || (stock > 0 ? 'In Stock' : 'Out of Stock'),

    // Delivery
    countryOfOrigin: raw.countryOfOrigin || 'India',
    codAvailable: raw.codAvailability === true || raw.codAvailable === 'Yes' ? 'Yes' : 'No',
    deliveryEstimate: raw.estimatedDelivery || raw.deliveryEstimate || '3-7 business days',
    returnPolicy: raw.deliveryReturn || raw.returnPolicy || 'Easy Returns',

    // Content
    shortDescription: raw.shortDescription || raw.shortDesc || '',
    description: raw.description || raw.shortDescription || '',
    productDetails: raw.productDetails || raw.longDesc || '',
    packageIncludes: raw.packageIncludes || '',

    // Specifications
    specifications: {
      weight: raw.weight || raw.specifications?.weight || '',
      dimensions: raw.dimensions || raw.specifications?.dimensions || '',
      powerSource: raw.powerSource || raw.specifications?.powerSource || '',
      material: raw.material || raw.specifications?.material || '',
      coverage: raw.coverageUsage || raw.specifications?.coverage || '',
    },

    // Features & Reviews
    keyFeatures,
    rating: String(raw.averageRating ?? raw.rating ?? ''),
    totalReviews: String(raw.totalReviews ?? mappedReviews.length ?? ''),
    ratingBreakdown: raw.ratingBreakdown ?? { 5: '', 4: '', 3: '', 2: '', 1: '' },
    reviews: mappedReviews,

    // Media
    image: mainImageUrl,
    imageUrl: raw.images?.[0]?.imageUrl || raw.imageUrl || '',
    images,
    video: mainVideoUrl,
    videoUrl: raw.videos?.[0]?.videoUrl || raw.videoUrl || '',
    videos,
  };
};

// ─── Categories ───────────────────────────────────────────────────────────────
// GET /api/Category

export const fetchCategories = async () => {
  const response = await api.get('/api/Category');
  return unwrapList(response).map(mapCategoryFromApi);
};

// ─── Subcategories ────────────────────────────────────────────────────────────
// GET /api/Subcategory

export const fetchSubcategories = async () => {
  const response = await api.get('/api/Subcategory');
  return unwrapList(response).map(mapSubcategoryFromApi);
};

// ─── Product Features ─────────────────────────────────────────────────────────
// POST /api/features
// GET  /api/features/{productId}
// DELETE /api/features/{id}

export const fetchProductFeatures = async (productId) => {
  const response = await api.get(`/api/features/${productId}`);
  return unwrapList(response);
};

export const createProductFeature = async (productId, featureText) => {
  const response = await api.post(
    '/api/features',
    { productId: Number(productId), feature: featureText.trim() },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const deleteProductFeature = async (id) => {
  const response = await api.delete(`/api/features/${id}`);
  return response.data;
};

// ─── Product Reviews ──────────────────────────────────────────────────────────
// POST /api/reviews
// GET  /api/reviews/{productId}
// DELETE /api/reviews/{id}

export const fetchProductReviews = async (productId) => {
  const response = await api.get(`/api/reviews/${productId}`);
  return unwrapList(response);
};

export const createProductReview = async (productId, review) => {
  const payload = {
    productId: Number(productId),
    customerName: review.customer || 'Anonymous',
    rating: Number(review.rating) || 5,
    reviewDate: review.date
      ? `${review.date}-01T00:00:00Z`
      : new Date().toISOString(),
    reviewComment: review.comment || '',
    verifiedPurchase: review.verified !== false,
  };
  const response = await api.post('/api/reviews', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const deleteProductReview = async (id) => {
  const response = await api.delete(`/api/reviews/${id}`);
  return response.data;
};

// ─── Products — List & Search ─────────────────────────────────────────────────
// GET /api/products
// GET /api/products/search?keyword=
// GET /api/products/paged?page=&pageSize=
// GET /api/products/category/{categoryId}
// GET /api/products/subcategory/{subcategoryId}
// GET /api/products/dashboard
// GET /api/products/related/{productId}

/** Fetch all products (GET /api/products) */
export const fetchProducts = async (categories = [], subcategories = []) => {
  const response = await api.get('/api/products');
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/** Search products by keyword (GET /api/products/search?keyword=) */
export const searchProducts = async (keyword, categories = [], subcategories = []) => {
  const response = await api.get('/api/products/search', {
    params: { keyword },
  });
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/**
 * Fetch paginated products (GET /api/products/paged?page=&pageSize=)
 * Returns { products, page, pageSize, total }
 */
export const fetchProductsPaged = async (
  page = 1,
  pageSize = 10,
  categories = [],
  subcategories = []
) => {
  const response = await api.get('/api/products/paged', {
    params: { page, pageSize },
  });
  const raw = response?.data;
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  return {
    products: items.map((p) => mapProductFromApi(p, categories, subcategories)),
    page: raw?.page ?? page,
    pageSize: raw?.pageSize ?? pageSize,
    total: raw?.total ?? items.length,
  };
};

/** Fetch products by category (GET /api/products/category/{categoryId}) */
export const fetchProductsByCategory = async (
  categoryId,
  categories = [],
  subcategories = []
) => {
  const response = await api.get(`/api/products/category/${categoryId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/** Fetch products by subcategory (GET /api/products/subcategory/{subcategoryId}) */
export const fetchProductsBySubcategory = async (
  subcategoryId,
  categories = [],
  subcategories = []
) => {
  const response = await api.get(`/api/products/subcategory/${subcategoryId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/** Fetch dashboard stats (GET /api/products/dashboard) */
export const fetchProductsDashboard = async () => {
  const response = await api.get('/api/products/dashboard');
  return unwrapItem(response);
};

/** Fetch related products (GET /api/products/related/{productId}) */
export const fetchRelatedProducts = async (
  productId,
  categories = [],
  subcategories = []
) => {
  const response = await api.get(`/api/products/related/${productId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

// ─── Products — Single Item ────────────────────────────────────────────────────
// GET /api/products/{id}

export const fetchProduct = async (id, categories = [], subcategories = []) => {
  const response = await api.get(`/api/products/${id}`);
  const product = unwrapItem(response);

  // Fetch features and reviews in parallel; never let them crash the product load
  const [features, reviews] = await Promise.all([
    fetchProductFeatures(id).catch((e) => {
      console.warn('Could not load features for product', id, e?.message);
      return [];
    }),
    fetchProductReviews(id).catch((e) => {
      console.warn('Could not load reviews for product', id, e?.message);
      return [];
    }),
  ]);

  return mapProductFromApi(product, categories, subcategories, features, reviews);
};

// ─── Products — Create / Update ───────────────────────────────────────────────
// POST /api/products
// PUT  /api/products/{id}
// POST /api/features  (per feature)
// POST /api/reviews   (per review)

export const saveProduct = async (product, imageFiles = [], videoFile = null) => {
  const isEditing = Boolean(product.id);

  const fd = new FormData();
  fd.append('ProductName', product.name || '');
  fd.append('SKU', product.sku || '');
  fd.append('Brand', product.brand || 'Shyam Agro Tools');
  fd.append('Manufacturer', product.supplier || product.manufacturer || '');
  fd.append('MRP', Number(product.mrp) || 0);
  fd.append('Stock', Number(product.stock) || 0);
  fd.append('CategoryId', Number(product.categoryId) || 0);
  fd.append('SubcategoryId', Number(product.subcategoryId) || 0);
  fd.append('ShortDescription', product.shortDescription || product.description || '');
  fd.append('ProductDetails', product.productDetails || '');
  fd.append('PackageIncludes', product.packageIncludes || '');

  // Specifications
  fd.append('Weight', product.specifications?.weight || '');
  fd.append('Dimensions', product.specifications?.dimensions || '');
  fd.append('PowerSource', product.specifications?.powerSource || '');
  fd.append('Material', product.specifications?.material || '');
  fd.append('CoverageUsage', product.specifications?.coverage || '');

  // Pricing
  fd.append('DiscountType', product.discountType || 'none');
  fd.append('DiscountAmount', Number(product.discountValue) || 0);
  fd.append('SellingPrice', Number(product.price) || 0);

  // Inventory & Delivery
  fd.append('StockStatus', product.status || 'In Stock');
  fd.append('CountryOfOrigin', product.countryOfOrigin || 'India');
  fd.append('EstimatedDelivery', product.deliveryEstimate || '3-7 business days');
  fd.append('DeliveryReturn', product.returnPolicy || 'Easy Returns');
  fd.append(
    'CODAvailability',
    product.codAvailable === 'Yes' || product.codAvailable === true ? 'true' : 'false'
  );

  // Images (field name: Images[])
  if (Array.isArray(imageFiles) && imageFiles.length > 0) {
    imageFiles.forEach((file) => fd.append('Images', file));
  }

  // Existing images to keep (case-insensitive keys for maximum compatibility)
  if (Array.isArray(product.images)) {
    product.images.forEach((url) => {
      fd.append('ExistingImages', url);
      fd.append('existingImages', url);
      fd.append('RemainingImages', url);
      fd.append('remainingImages', url);
    });
  }

  // Video
  if (videoFile) {
    fd.append('Video', videoFile);
  }

  // ── POST or PUT product ────────────────────────────────────────────────────
  const response = await api({
    method: isEditing ? 'PUT' : 'POST',
    url: isEditing ? `/api/products/${product.id}` : '/api/products',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const saved = unwrapItem(response);
  const savedId = String(saved.id || product.id || '');

  if (isEditing) {
    // ── Update Features ──────────────────────────────────────────────────────
    try {
      const existingFeatures = await fetchProductFeatures(savedId);
      const activeFeatures = (product.keyFeatures || []).map((f) => f.trim()).filter(Boolean);

      // Delete features that are no longer present
      const featuresToDelete = existingFeatures.filter((ef) => !activeFeatures.includes(ef.feature));
      for (const ef of featuresToDelete) {
        try {
          await deleteProductFeature(ef.id);
        } catch (err) {
          console.error(`Error deleting feature ${ef.id}:`, err?.message);
        }
      }

      // Add features that are new
      const existingFeatureTexts = existingFeatures.map((ef) => ef.feature);
      const featuresToAdd = activeFeatures.filter((af) => !existingFeatureTexts.includes(af));
      for (const feat of featuresToAdd) {
        try {
          await createProductFeature(savedId, feat);
        } catch (err) {
          console.error('Error saving feature:', feat, err?.message);
        }
      }
    } catch (err) {
      console.error('Error syncing features:', err?.message);
    }

    // ── Update Reviews ───────────────────────────────────────────────────────
    try {
      const existingReviews = await fetchProductReviews(savedId);
      const activeReviews = (product.reviews || []).filter((r) => r.customer || r.comment);

      // Reviews to delete: any in existingReviews whose ID is not in activeReviews
      const activeReviewIds = activeReviews.map((r) => String(r.id || '')).filter(Boolean);
      const reviewsToDelete = existingReviews.filter((er) => !activeReviewIds.includes(String(er.id)));

      for (const er of reviewsToDelete) {
        try {
          await deleteProductReview(er.id);
        } catch (err) {
          console.error(`Error deleting review ${er.id}:`, err?.message);
        }
      }

      // Reviews to add/recreate
      for (const rev of activeReviews) {
        const revIdStr = String(rev.id || '');
        if (!revIdStr) {
          // New review
          try {
            await createProductReview(savedId, rev);
          } catch (err) {
            console.error('Error saving new review:', rev, err?.message);
          }
        } else {
          // Check if it exists and has changed
          const er = existingReviews.find((item) => String(item.id) === revIdStr);
          if (er) {
            const hasChanged =
              er.customerName !== (rev.customer || 'Anonymous') ||
              Number(er.rating) !== (Number(rev.rating) || 5) ||
              (er.reviewComment || '') !== (rev.comment || '') ||
              er.verifiedPurchase !== (rev.verified !== false);

            if (hasChanged) {
              // Delete and recreate
              try {
                await deleteProductReview(er.id);
                await createProductReview(savedId, rev);
              } catch (err) {
                console.error(`Error updating review ${er.id}:`, err?.message);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error syncing reviews:', err?.message);
    }
  } else {
    // ── Create Features & Reviews ────────────────────────────────────────────
    const activeFeatures = (product.keyFeatures || []).filter((f) => f && f.trim());
    for (const feat of activeFeatures) {
      try {
        await createProductFeature(savedId, feat);
      } catch (err) {
        console.error('Error saving feature:', feat, err?.message);
      }
    }

    const activeReviews = (product.reviews || []).filter((r) => r.customer || r.comment);
    for (const rev of activeReviews) {
      try {
        await createProductReview(savedId, rev);
      } catch (err) {
        console.error('Error saving review:', rev, err?.message);
      }
    }
  }

  // Return fully populated product (features + reviews included)
  return fetchProduct(savedId);
};

// ─── Products — Delete ────────────────────────────────────────────────────────
// DELETE /api/products/{id}

export const deleteProduct = async (id) => {
  await api.delete(`/api/products/${id}`);
};

// ─── Products — Patch Stock ───────────────────────────────────────────────────
// PATCH /api/products/{id}/stock?stock=

export const updateProductStock = async (id, newStock) => {
  const response = await api.patch(`/api/products/${id}/stock`, null, {
    params: { stock: Number(newStock) },
  });
  return response.data;
};
