import axios from '../api/axios';

export const BRAND_API_BASE_URL = 'http://shyamagrotools.com';
const BRAND_ENDPOINT = `${BRAND_API_BASE_URL}/api/Brand`;
const CATALOG_BRANDS_ENDPOINT = `${BRAND_API_BASE_URL}/api/Catalog/brands`;

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

let brandsRequest;
let catalogBrandsRequest;

export const getBrandLogoUrl = (logoImage) => {
  if (!logoImage || typeof logoImage !== 'string' || !logoImage.trim()) {
    return '';
  }

  if (logoImage.startsWith('http') || logoImage.startsWith('data:image') || logoImage.startsWith('blob:')) {
    return logoImage;
  }

  return `${BRAND_API_BASE_URL}${logoImage.startsWith('/') ? '' : '/'}${logoImage}`;
};

const normalizeBrand = (brand = {}) => ({
  id: String(brand.id ?? brand.Id ?? ''),
  name: brand.name ?? brand.Name ?? '',
  description: brand.description ?? brand.Description ?? '',
  logoImage: brand.logoImage ?? brand.LogoImage ?? brand.logo ?? brand.Logo ?? '',
  logo: getBrandLogoUrl(brand.logoImage ?? brand.LogoImage ?? brand.logo ?? brand.Logo ?? ''),
  isActive: brand.isActive ?? brand.IsActive,
  slug: brand.slug ?? brand.Slug ?? '',
  brandIdentifier: brand.brandIdentifier ?? brand.BrandIdentifier ?? '',
});

const normalizeBrandsResponse = (data) => {
  const items = Array.isArray(data)
    ? data
    : data?.items || data?.brands || data?.data || data?.results || [];

  return Array.from(
    new Map(
      items
        .map(normalizeBrand)
        .filter((brand) => brand.isActive === true)
        .map((brand, index) => [brand.id || `brand-${index}`, brand])
    ).values()
  );
};

export const getBrands = async () => {
  if (!brandsRequest) {
    brandsRequest = axios.get(BRAND_ENDPOINT, requestConfig).finally(() => {
      brandsRequest = null;
    });
  }

  const response = await brandsRequest;
  return normalizeBrandsResponse(response.data);
};

export const getCatalogBrands = async () => {
  if (!catalogBrandsRequest) {
    catalogBrandsRequest = axios.get(CATALOG_BRANDS_ENDPOINT, requestConfig).finally(() => {
      catalogBrandsRequest = null;
    });
  }

  const response = await catalogBrandsRequest;
  return normalizeBrandsResponse(response.data);
};

export const getBrandById = async (id) => {
  const response = await axios.get(`${BRAND_ENDPOINT}/${id}`, requestConfig);
  const brand = normalizeBrand(response.data);
  return brand.isActive === true ? brand : null;
};
