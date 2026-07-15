import axios from '../api/axios';
import { getProductImage } from '../utils/productImage';

export const PRODUCT_API_BASE_URL = 'http://shyamagrotools.com';
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
  if (typeof url === 'string' && (url.startsWith('data:video') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url))) {
    if (url.startsWith('http') || url.startsWith('data:video')) return url;
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
  const imageItems = backendImages
    .map((image, index) => {
      const source = image?.imageUrl || image?.url || image;
      if (!source) return null;

      return {
        type: 'image',
        id: image?.id ?? `image-${index + 1}`,
        productId: image?.productId ?? product.id ?? product.productId,
        label: image?.label || image?.title || (index === 0 ? 'Front' : `Image ${index + 1}`),
        url: getProductAssetUrl(source),
        imageUrl: source,
      };
    })
    .filter(Boolean);
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

export const getProducts = async () => {
  const response = await getProductResponse(PRODUCT_ENDPOINT);
  return normalizeProductsResponse(response.data).products;
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
  productGetRequests.clear();
  return normalizeProduct(response.data);
};

export const updateProduct = async (id, data) => {
  const response = await axios.put(`${PRODUCT_ENDPOINT}/${id}`, toFormData(data), requestConfig);
  productGetRequests.clear();
  return response.data ? normalizeProduct(response.data) : response.data;
};

export const deleteProduct = async (id) => {
  const response = await axios.delete(`${PRODUCT_ENDPOINT}/${id}`, requestConfig);
  productGetRequests.clear();
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
