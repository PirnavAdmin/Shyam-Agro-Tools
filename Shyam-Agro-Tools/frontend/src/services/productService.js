import { getApiDomain } from "../utils/apiConfig";
import axios from '../api/axios';
import { getProductImage } from '../utils/productImage';

export const PRODUCT_API_BASE_URL = (
  process.env.REACT_APP_PRODUCT_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  getApiDomain()
).replace(/\/$/, '');
const PRODUCT_ENDPOINT = `${PRODUCT_API_BASE_URL}/api/products`;

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

const productGetRequests = new Map();

const getProductResponse = (url, config = requestConfig) => {
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  const requestKey = `${url}:${paramsKey}`;

  if (!productGetRequests.has(requestKey)) {
    const request = axios.get(url, config).finally(() => {
      productGetRequests.delete(requestKey);
    });
    productGetRequests.set(requestKey, request);
  }

  return productGetRequests.get(requestKey);
};

const isFileLike = (value) =>
  typeof File !== 'undefined' && value instanceof File;

const appendIfPresent = (formData, key, value) => {
  if (value === undefined || value === null || value === '') return;

  if (Array.isArray(value)) {
    value.forEach((item) => appendIfPresent(formData, key, item));
    return;
  }

  formData.append(key, value);
};

const toFormData = (data = {}) => {
  if (data instanceof FormData) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'images' || key === 'Images') appendIfPresent(formData, 'Images', value);
    else if (key === 'video' || key === 'Video') appendIfPresent(formData, 'Video', value);
    else appendIfPresent(formData, key, value);
  });
  return formData;
};

export const getProductAssetUrl = (url) => {
  if (typeof url === 'string' && (url.startsWith('data:') || /\.(mp4|webm|ogg|html)(\?.*)?$/i.test(url))) {
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${PRODUCT_API_BASE_URL}/${url.replace(/^\/+/, '')}`;
  }
  return getProductImage({ image: url });
};

const normalizeStockStatus = (product) => {
  const status = String(product.stockStatus || '').trim().toLowerCase();
  const stock = Number(product.stock ?? product.stockQuantity ?? product.stockCount ?? 0);
  if (status.includes('out') || stock <= 0) return 'out-of-stock';
  return 'in-stock';
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const numberValue = (...values) => Number(firstValue(...values) ?? 0);

const calculateDiscountPercent = ({ price, mrp, discountType, discountAmount }) => {
  const type = String(discountType || '').trim().toLowerCase();
  if (type === 'percentage' || type === 'percent' || type === '%') {
    return Number(discountAmount || 0);
  }

  if (mrp > 0 && price > 0 && price < mrp) {
    return Math.round(((mrp - price) / mrp) * 100);
  }

  return 0;
};

export const normalizeProduct = (product = {}) => {
  const backendImages = Array.isArray(product.images) ? product.images : Array.isArray(product.Images) ? product.Images : [];
  const standardViews = [
    { key: 'media.front', label: 'Front View', angle: 'front' },
    { key: 'media.back', label: 'Back View', angle: 'back' },
    { key: 'media.left', label: 'Left View', angle: 'left' },
    { key: 'media.right', label: 'Right View', angle: 'right' },
    { key: 'media.side', label: 'Side View', angle: 'side' },
    { key: 'media.topView', label: 'Top View', angle: 'top' },
    { key: 'media.closeup', label: 'Close-Up View', angle: 'closeup' },
  ];

  const detectViewInfo = (imageObj, index) => {
    const src = String(imageObj?.imageUrl || imageObj?.url || imageObj || '').toLowerCase();
    const lbl = String(imageObj?.label || imageObj?.title || '').toLowerCase();

    if (lbl.includes('front') || src.includes('front')) return standardViews[0];
    if (lbl.includes('back') || lbl.includes('rear') || src.includes('back') || src.includes('rear')) return standardViews[1];
    if (lbl.includes('left') || src.includes('left')) return standardViews[2];
    if (lbl.includes('right') || src.includes('right')) return standardViews[3];
    if (lbl.includes('side') || src.includes('side')) return standardViews[4];
    if (lbl.includes('top') || src.includes('top')) return standardViews[5];
    if (lbl.includes('close') || src.includes('close')) return standardViews[6];

    return standardViews[index] || { key: `media.image${index + 1}`, label: `View ${index + 1}`, angle: `angle-${index + 1}` };
  };

  let imageItems = backendImages
    .map((image, index) => {
      const source = image?.imageUrl || image?.url || image;
      if (!source) return null;

      const view = detectViewInfo(image, index);

      return {
        type: 'image',
        id: image?.id ?? `image-${index + 1}`,
        productId: image?.productId ?? product.id ?? product.productId,
        labelKey: view.key,
        label: image?.label || image?.title || view.label,
        viewAngle: view.angle,
        url: getProductAssetUrl(source),
        imageUrl: source,
      };
    })
    .filter(Boolean);

  const fallbackImage = getProductImage(product);

  if (imageItems.length === 0) {
    imageItems = standardViews.slice(0, 4).map((view, idx) => ({
      type: 'image',
      id: `generated-view-${idx + 1}`,
      productId: product.id ?? product.productId,
      labelKey: view.key,
      label: view.label,
      viewAngle: view.angle,
      url: fallbackImage,
      imageUrl: fallbackImage,
    }));
  } else if (imageItems.length < 4) {
    const existingAngles = new Set(imageItems.map((item) => item.viewAngle || item.labelKey));
    const baseSource = imageItems[0]?.url || fallbackImage;

    standardViews.slice(0, 4).forEach((view) => {
      if (!existingAngles.has(view.angle) && !existingAngles.has(view.key)) {
        imageItems.push({
          type: 'image',
          id: `generated-view-${view.angle}`,
          productId: product.id ?? product.productId,
          labelKey: view.key,
          label: view.label,
          viewAngle: view.angle,
          url: baseSource,
          imageUrl: baseSource,
        });
        existingAngles.add(view.angle);
      }
    });
  }

  const imageUrls = imageItems.map((image) => image.url);

  const videoItems = Array.isArray(product.videos)
    ? product.videos
        .map((video) => video?.videoUrl || video?.url || video)
        .filter(Boolean)
        .map((url) => ({
          type: 'video',
          label: 'Video',
          url: getProductAssetUrl(url),
        }))
    : [];

  const rawFeatures = firstValue(product.features, product.Features);
  const features = Array.isArray(rawFeatures)
    ? rawFeatures.map((feature) => feature?.feature || feature?.Feature || feature?.text || feature?.Text || feature).filter(Boolean)
    : normalizeList(rawFeatures);

  const details = normalizeList(firstValue(product.packageIncludes, product.PackageIncludes));
  const stockQuantity = numberValue(product.stock, product.Stock, product.stockQuantity, product.StockQuantity, product.stockCount, product.StockCount);
  const price = numberValue(product.sellingPrice, product.SellingPrice, product.price, product.Price, product.mrp, product.MRP, product.Mrp);
  const mrp = numberValue(product.mrp, product.MRP, product.Mrp, product.oldPrice, product.OldPrice, price);
  const discountAmount = numberValue(product.discountAmount, product.DiscountAmount);
  const discountType = firstValue(product.discountType, product.DiscountType);
  const discountPercent = calculateDiscountPercent({ price, mrp, discountType, discountAmount });
  const hasOffer = Boolean(discountAmount) || price < mrp;
  const productName = firstValue(product.productName, product.ProductName, product.name, product.Name, product.displayName, product.DisplayName, '');
  const productDetails = firstValue(product.productDetails, product.ProductDetails, product.description, product.Description, '');

  return {
    ...product,
    id: String(firstValue(product.id, product.Id, product.productId, product.ProductId, '')),
    rawId: firstValue(product.id, product.Id, product.productId, product.ProductId),
    name: productName,
    displayName: firstValue(product.productName, product.ProductName, product.displayName, product.DisplayName, product.name, product.Name, ''),
    category: product.category?.name || product.category?.Name || product.Category?.name || product.Category?.Name || product.categoryName || product.CategoryName || product.category || product.Category || '',
    categoryId: firstValue(product.categoryId, product.CategoryId),
    subcategoryId: firstValue(product.subcategoryId, product.SubcategoryId, product.subCategoryId, product.SubCategoryId),
    subCategoryId: firstValue(product.subcategoryId, product.SubcategoryId, product.subCategoryId, product.SubCategoryId),
    subcategory: product.subcategory?.name || product.subcategory?.Name || product.Subcategory?.name || product.Subcategory?.Name || product.subcategoryName || product.SubcategoryName || product.subcategory || product.Subcategory || '',
    subCategory: product.subcategory?.name || product.subcategory?.Name || product.Subcategory?.name || product.Subcategory?.Name || product.subcategoryName || product.SubcategoryName || product.subCategory || product.SubCategory || '',
    image: imageUrls[0] || getProductImage(product),
    images: imageUrls,
    backendImages,
    media: [...imageItems, ...videoItems],
    features,
    productDetails: details.length ? details : normalizeList(productDetails),
    specifications: {
      ...(product.specifications || {}),
      ...(product.Specifications || {}),
      ...(firstValue(product.weight, product.Weight) ? { weight: firstValue(product.weight, product.Weight) } : {}),
      ...(firstValue(product.dimensions, product.Dimensions) ? { dimensions: firstValue(product.dimensions, product.Dimensions) } : {}),
      ...(firstValue(product.powerSource, product.PowerSource) ? { powerSource: firstValue(product.powerSource, product.PowerSource) } : {}),
      ...(firstValue(product.material, product.Material) ? { material: firstValue(product.material, product.Material) } : {}),
      ...(firstValue(product.coverageUsage, product.CoverageUsage) ? { coverageUsage: firstValue(product.coverageUsage, product.CoverageUsage) } : {}),
    },
    shortDesc: firstValue(product.shortDescription, product.ShortDescription, product.shortDesc, product.ShortDesc, ''),
    shortDescription: firstValue(product.shortDescription, product.ShortDescription, product.shortDesc, product.ShortDesc, ''),
    description: productDetails,
    longDesc: firstValue(product.productDetails, product.ProductDetails, product.longDesc, product.LongDesc, product.description, product.Description, ''),
    price,
    mrp,
    oldPrice: mrp,
    discount: discountPercent ? `${discountPercent}%` : '',
    discountPercent,
    offerPrice: price,
    hasOffer,
    stockQuantity,
    stockCount: stockQuantity,
    stockStatus: normalizeStockStatus({ ...product, stockQuantity }),
    codAvailable: Boolean(firstValue(product.codAvailability, product.CodAvailability, product.codAvailable, product.CodAvailable)),
    rating: numberValue(product.averageRating, product.AverageRating, product.rating, product.Rating),
    totalReviews: numberValue(product.totalReviews, product.TotalReviews),
    estimatedDelivery: firstValue(product.estimatedDelivery, product.EstimatedDelivery, ''),
    countryOfOrigin: firstValue(product.countryOfOrigin, product.CountryOfOrigin, ''),
    brand: firstValue(product.brand, product.Brand, ''),
    sku: firstValue(product.sku, product.SKU, product.Sku, ''),
    posterUrl: firstValue(product.posterUrl, product.PosterUrl, product.posterImage, product.PosterImage, product.poster, product.Poster, '')
      ? getProductAssetUrl(firstValue(product.posterUrl, product.PosterUrl, product.posterImage, product.PosterImage, product.poster, product.Poster, ''))
      : '',
    madeInIndia: String(firstValue(product.countryOfOrigin, product.CountryOfOrigin, '')).toLowerCase() === 'india',
  };
};

const normalizeProductsResponse = (data) => {
  const items = Array.isArray(data)
    ? data
    : data?.items || data?.products || data?.data || data?.results || [];
  const products = items.map(normalizeProduct);
  const uniqueProducts = Array.from(
    new Map(products.map((product, index) => [product.id || `product-${index}`, product])).values()
  );

  return {
    products: uniqueProducts,
    total: Number(data?.total ?? data?.totalCount ?? data?.count ?? items.length),
    page: Number(data?.page ?? data?.currentPage ?? 1),
    pageSize: Number(data?.pageSize ?? data?.limit ?? items.length),
  };
};

let memoryProductsCache = null;
let memoryProductsPromise = null;

export const clearProductsCache = () => {
  memoryProductsCache = null;
  memoryProductsPromise = null;
  productGetRequests.clear();
};

export const getProducts = async (options = {}) => {
  const forceRefresh = typeof options === 'boolean' ? options : Boolean(options?.forceRefresh);

  if (memoryProductsCache && memoryProductsCache.length > 0 && !forceRefresh) {
    getProductResponse(PRODUCT_ENDPOINT)
      .then((response) => {
        const fresh = normalizeProductsResponse(response.data).products;
        if (fresh && fresh.length > 0) memoryProductsCache = fresh;
      })
      .catch(() => {});

    return memoryProductsCache;
  }

  if (memoryProductsPromise && !forceRefresh) {
    return memoryProductsPromise;
  }

  memoryProductsPromise = getProductResponse(PRODUCT_ENDPOINT)
    .then((response) => {
      const products = normalizeProductsResponse(response.data).products;
      if (products && products.length > 0) memoryProductsCache = products;
      return products;
    })
    .finally(() => {
      memoryProductsPromise = null;
    });

  return memoryProductsPromise;
};

export const getPagedProducts = async ({ page = 1, pageSize = 12 } = {}) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/paged`, {
    ...requestConfig,
    params: { page, pageSize },
  });
  return normalizeProductsResponse(response.data);
};

export const searchProducts = async (keyword) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/search`, {
    ...requestConfig,
    params: { keyword },
  });
  return normalizeProductsResponse(response.data).products;
};

export const getProductById = async (id) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/${id}`);
  return normalizeProduct(response.data);
};

export const createProduct = async (data) => {
  const response = await axios.post(PRODUCT_ENDPOINT, toFormData(data), requestConfig);
  clearProductsCache();
  return normalizeProduct(response.data);
};

export const updateProduct = async (id, data) => {
  const response = await axios.put(`${PRODUCT_ENDPOINT}/${id}`, toFormData(data), requestConfig);
  clearProductsCache();
  return response.data ? normalizeProduct(response.data) : response.data;
};

export const deleteProduct = async (id) => {
  const response = await axios.delete(`${PRODUCT_ENDPOINT}/${id}`, requestConfig);
  clearProductsCache();
  return response.data;
};

export const updateProductStock = async (id, stock) => {
  const response = await axios.patch(`${PRODUCT_ENDPOINT}/${id}/stock`, null, {
    ...requestConfig,
    params: { stock },
  });
  productGetRequests.clear();
  return response.data ? normalizeProduct(response.data) : response.data;
};

export const getProductsByCategory = async (categoryId) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/category/${categoryId}`);
  return normalizeProductsResponse(response.data).products;
};

export const getProductsBySubcategory = async (subcategoryId) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/subcategory/${subcategoryId}`);
  return normalizeProductsResponse(response.data).products;
};

export const getProductDashboard = async () => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/dashboard`);
  return response.data;
};

export const getRelatedProducts = async (productId) => {
  const response = await getProductResponse(`${PRODUCT_ENDPOINT}/related/${productId}`);
  return normalizeProductsResponse(response.data).products;
};

export const mapProductToApiPayload = (product = {}) => ({
  ProductName: product.productName || product.name || product.displayName,
  SKU: product.sku || product.SKU,
  Brand: product.brand,
  Manufacturer: product.manufacturer,
  MRP: product.mrp || product.oldPrice,
  Stock: product.stock ?? product.stockQuantity ?? product.stockCount,
  CategoryId: product.categoryId,
  SubcategoryId: product.subcategoryId || product.subCategoryId,
  ShortDescription: product.shortDescription || product.shortDesc,
  ProductDetails: product.productDetailsText || product.description || product.longDesc,
  PackageIncludes: Array.isArray(product.productDetails) ? product.productDetails.join('\n') : product.packageIncludes,
  Weight: product.weight || product.specifications?.weight,
  Dimensions: product.dimensions || product.specifications?.dimensions,
  PowerSource: product.powerSource || product.specifications?.powerSource,
  Material: product.material || product.specifications?.material,
  CoverageUsage: product.coverageUsage || product.specifications?.coverageUsage,
  CountryOfOrigin: product.countryOfOrigin,
  EstimatedDelivery: product.estimatedDelivery,
  DeliveryReturn: product.deliveryReturn,
  DiscountType: product.discountType,
  DiscountAmount: product.discountAmount || product.discountPercent,
  SellingPrice: product.sellingPrice || product.price || product.offerPrice,
  StockStatus: product.stockStatus,
  CODAvailability: product.codAvailability ?? product.codAvailable,
  AverageRating: product.averageRating || product.rating,
  TotalReviews: product.totalReviews,
  FiveStar: product.fiveStar,
  FourStar: product.fourStar,
  ThreeStar: product.threeStar,
  TwoStar: product.twoStar,
  OneStar: product.oneStar,
  Images: product.images?.filter(isFileLike),
  Video: isFileLike(product.video) ? product.video : undefined,
});
