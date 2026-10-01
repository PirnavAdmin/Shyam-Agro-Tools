const CATALOG_KEYS = {
  categories: 'sat_catalog_categories',
  subcategories: 'sat_catalog_subcategories',
  products: 'sat_catalog_products',
};

export const defaultCategories = [
  {
    id: 'CAT-001',
    name: 'Seeds & Propagation',
    slug: 'seeds-propagation',
    description: 'Certified hybrid, organic, cereal, pulse, and vegetable seeds.',
    status: 'Active',
    displayOrder: 1,
    metaTitle: 'Certified Agro Seeds Online | Shyam Agro',
    metaDescription: 'Premium agricultural seeds with reliable germination and crop support.',
  },
  {
    id: 'CAT-002',
    name: 'Soil & Plant Nutrition',
    slug: 'soil-plant-nutrition',
    description: 'Fertilizers, compost, bio nutrients, and plant growth inputs.',
    status: 'Active',
    displayOrder: 2,
    metaTitle: 'Fertilizers and Plant Nutrition | Shyam Agro',
    metaDescription: 'Shop fertilizers, bio compost, and crop nutrition products.',
  },
  {
    id: 'CAT-003',
    name: 'Crop Protection & Bio',
    slug: 'crop-protection-bio',
    description: 'Pesticides, fungicides, neem oil, and organic crop protection.',
    status: 'Active',
    displayOrder: 3,
    metaTitle: 'Crop Protection Products | Shyam Agro',
    metaDescription: 'Organic and conventional crop protection products for farms.',
  },
  {
    id: 'CAT-004',
    name: 'Irrigation & Water',
    slug: 'irrigation-water',
    description: 'Drip lines, sprinklers, pipes, nozzles, and water pumps.',
    status: 'Active',
    displayOrder: 4,
    metaTitle: 'Irrigation Tools and Water Supplies | Shyam Agro',
    metaDescription: 'Irrigation kits, pipes, sprinklers, and farm water systems.',
  },
  {
    id: 'CAT-005',
    name: 'Farm Tools & Machinery',
    slug: 'farm-tools-machinery',
    description: 'Power tillers, cutters, weeders, hand tools, and farm machinery.',
    status: 'Active',
    displayOrder: 5,
    metaTitle: 'Farm Tools and Machinery | Shyam Agro',
    metaDescription: 'Durable machinery and hand tools for farms and agri businesses.',
  },
];

export const defaultSubcategories = [
  {
    id: 'SUB-001',
    name: 'Hybrid Seeds',
    slug: 'hybrid-seeds',
    categoryId: 'CAT-001',
    description: 'High-yield hybrid seeds for vegetables and field crops.',
    status: 'Active',
    displayOrder: 1,
  },
  {
    id: 'SUB-002',
    name: 'Organic Seeds',
    slug: 'organic-seeds',
    categoryId: 'CAT-001',
    description: 'Certified organic seeds for sustainable farming.',
    status: 'Active',
    displayOrder: 2,
  },
  {
    id: 'SUB-003',
    name: 'Bio Fertilizers',
    slug: 'bio-fertilizers',
    categoryId: 'CAT-002',
    description: 'Bio compost, microbial fertilizers, and soil conditioners.',
    status: 'Active',
    displayOrder: 1,
  },
  {
    id: 'SUB-004',
    name: 'Drip Irrigation Kits',
    slug: 'drip-irrigation-kits',
    categoryId: 'CAT-004',
    description: 'Starter kits and accessories for drip irrigation.',
    status: 'Active',
    displayOrder: 1,
  },
  {
    id: 'SUB-005',
    name: 'Hand Tools',
    slug: 'hand-tools',
    categoryId: 'CAT-005',
    description: 'Spades, weeders, cutters, and manual implements.',
    status: 'Active',
    displayOrder: 1,
  },
  {
    id: 'SUB-006',
    name: 'Power Tillers',
    slug: 'power-tillers',
    categoryId: 'CAT-005',
    description: 'Compact machinery for soil preparation and cultivation.',
    status: 'Active',
    displayOrder: 2,
  },
];

export const defaultProducts = [
  {
    id: 'PRD-001',
    name: 'Premium Hybrid Tomato Seeds',
    sku: 'SEM-TOM-01',
    brand: 'Shyam Agro Tools',
    categoryId: 'CAT-001',
    subcategoryId: 'SUB-001',
    mrp: 399,
    price: 299,
    discountType: 'percentage',
    discountValue: 25,
    stock: 120,
    status: 'In Stock',
    supplier: 'Saraswati Agro Seeds Ltd.',
    countryOfOrigin: 'India',
    codAvailable: 'Yes',
    deliveryEstimate: '3-7 business days',
    returnPolicy: 'Easy Returns',
    shortDescription: 'High-yielding F1 hybrid tomato seeds for open field and greenhouse cultivation.',
    description: 'High-yielding F1 hybrid tomato seeds for open field and greenhouse cultivation.',
    productDetails: 'Built for reliable germination, strong plant development, and high fruit setting in varied farm conditions.',
    specifications: {
      weight: '100g',
      dimensions: 'Sealed pouch pack',
      powerSource: 'Manual sowing or seed drill',
      material: 'F1 hybrid seed',
      coverage: 'Approx. 0.25 acre depending on spacing',
    },
    keyFeatures: [
      'High germination seed lot',
      'Suitable for greenhouse and open field cultivation',
      'Reliable plant vigor and fruit setting',
      'Packed for farm-safe storage',
    ],
    rating: 4.6,
    totalReviews: 16,
    ratingBreakdown: { 5: 10, 4: 4, 3: 2, 2: 0, 1: 0 },
    reviews: [
      {
        customer: 'Ramesh Babu',
        rating: 5,
        date: '2025-08',
        comment: 'Good germination and healthy seedlings. Useful for regular farm use.',
        verified: true,
      },
    ],
  },
  {
    id: 'PRD-002',
    name: 'Organic NPK Fertilizer',
    sku: 'FER-NPK-05',
    brand: 'Shyam Agro Tools',
    categoryId: 'CAT-002',
    subcategoryId: 'SUB-003',
    mrp: 999,
    price: 850,
    discountType: 'fixed',
    discountValue: 149,
    stock: 45,
    status: 'In Stock',
    supplier: 'Green Field Nutrition',
    countryOfOrigin: 'India',
    codAvailable: 'Yes',
    deliveryEstimate: '3-7 business days',
    returnPolicy: 'Easy Returns',
    shortDescription: 'Balanced organic plant nutrition for vegetable, fruit, and cereal crops.',
    description: 'Balanced organic plant nutrition for vegetable, fruit, and cereal crops.',
    productDetails: 'Supports soil health and steady nutrient release for better crop growth through the season.',
    specifications: {
      weight: '5kg',
      dimensions: 'Bag pack',
      powerSource: 'Manual application',
      material: 'Organic NPK blend',
      coverage: 'Varies by crop and soil condition',
    },
    keyFeatures: [
      'Balanced plant nutrition',
      'Suitable for vegetables, fruits, and cereal crops',
      'Supports soil health',
      'Easy field application',
    ],
    rating: 4.5,
    totalReviews: 11,
    ratingBreakdown: { 5: 6, 4: 4, 3: 1, 2: 0, 1: 0 },
    reviews: [],
  },
  {
    id: 'PRD-003',
    name: 'Drip Irrigation Starter Kit',
    sku: 'IRR-DRP-ST',
    brand: 'Shyam Agro Tools',
    categoryId: 'CAT-004',
    subcategoryId: 'SUB-004',
    mrp: 3200,
    price: 2499,
    discountType: 'percentage',
    discountValue: 22,
    stock: 15,
    status: 'In Stock',
    supplier: 'AquaFarm Systems',
    countryOfOrigin: 'India',
    codAvailable: 'Yes',
    deliveryEstimate: '3-7 business days',
    returnPolicy: 'Easy Returns',
    shortDescription: 'Starter drip irrigation kit with pipe, connectors, and inline emitters.',
    description: 'Starter drip irrigation kit with pipe, connectors, and inline emitters.',
    productDetails: 'Built for efficient water delivery across crop rows, gardens, and greenhouse setups.',
    specifications: {
      weight: 'Approx. 18 kg per coil',
      dimensions: '16mm pipe, 500m roll',
      powerSource: 'Water pressure, electric motor, or pump connection',
      material: 'UV-stabilized LLDPE',
      coverage: 'Row crops, gardens, orchards',
    },
    keyFeatures: [
      'Efficient water distribution for farm irrigation',
      'Helps reduce water wastage with targeted application',
      'Built for agricultural water flow and field layouts',
      'Compatible with common farm water supply setups',
    ],
    rating: 4.6,
    totalReviews: 16,
    ratingBreakdown: { 5: 6, 4: 3, 3: 1, 2: 0, 1: 0 },
    reviews: [
      {
        customer: 'Ramesh Babu',
        rating: 5,
        date: '2025-08',
        comment: 'Saves time and makes farm work easier.',
        verified: true,
      },
      {
        customer: 'Lakshmi Devi',
        rating: 4,
        date: '2025-06',
        comment: 'Good build quality and useful for regular agricultural work.',
        verified: true,
      },
    ],
  },
  {
    id: 'PRD-004',
    name: 'Heavy Duty Hand Weeder',
    sku: 'TOL-WEE-HD',
    brand: 'Shyam Agro Tools',
    categoryId: 'CAT-005',
    subcategoryId: 'SUB-005',
    mrp: 850,
    price: 650,
    discountType: 'percentage',
    discountValue: 24,
    stock: 80,
    status: 'In Stock',
    supplier: 'Shyam Agro Industries',
    countryOfOrigin: 'India',
    codAvailable: 'Yes',
    deliveryEstimate: '3-7 business days',
    returnPolicy: 'Easy Returns',
    shortDescription: 'Durable manual weeder built for repeated farm and garden use.',
    description: 'Durable manual weeder built for repeated farm and garden use.',
    productDetails: 'Designed for removing weeds around crops without disturbing nearby roots.',
    specifications: {
      weight: '1.2kg',
      dimensions: 'Approx. 38cm length',
      powerSource: 'Manual',
      material: 'Hardened steel and grip handle',
      coverage: 'Vegetable beds, gardens, row crops',
    },
    keyFeatures: [
      'Durable steel working edge',
      'Comfortable grip for repeated use',
      'Useful for garden and field weed removal',
      'Compact and easy to store',
    ],
    rating: 4.4,
    totalReviews: 9,
    ratingBreakdown: { 5: 4, 4: 4, 3: 1, 2: 0, 1: 0 },
    reviews: [],
  },
];

const isStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

const readList = (key, fallback) => {
  if (!isStorageAvailable()) return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeList = (key, list) => {
  if (!isStorageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(list));
};

const nextId = (prefix, items) => {
  const nextNumber =
    items.reduce((largest, item) => {
      const numericPart = Number(String(item.id || '').replace(`${prefix}-`, ''));
      return Number.isFinite(numericPart) ? Math.max(largest, numericPart) : largest;
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
};

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getCategories = () =>
  readList(CATALOG_KEYS.categories, defaultCategories).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

export const getSubcategories = () =>
  readList(CATALOG_KEYS.subcategories, defaultSubcategories).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

export const getProducts = () => readList(CATALOG_KEYS.products, defaultProducts);

export const saveCategories = (categories) => writeList(CATALOG_KEYS.categories, categories);
export const saveSubcategories = (subcategories) => writeList(CATALOG_KEYS.subcategories, subcategories);
export const saveProducts = (products) => writeList(CATALOG_KEYS.products, products);

export const upsertCategory = (category) => {
  const categories = getCategories();
  const prepared = {
    ...category,
    id: category.id || nextId('CAT', categories),
    slug: category.slug || slugify(category.name),
    displayOrder: Number(category.displayOrder) || categories.length + 1,
  };

  const exists = categories.some((item) => item.id === prepared.id);
  const updated = exists
    ? categories.map((item) => (item.id === prepared.id ? prepared : item))
    : [...categories, prepared];

  saveCategories(updated);
  return prepared;
};

export const upsertSubcategory = (subcategory) => {
  const subcategories = getSubcategories();
  const prepared = {
    ...subcategory,
    id: subcategory.id || nextId('SUB', subcategories),
    slug: subcategory.slug || slugify(subcategory.name),
    displayOrder: Number(subcategory.displayOrder) || subcategories.length + 1,
  };

  const exists = subcategories.some((item) => item.id === prepared.id);
  const updated = exists
    ? subcategories.map((item) => (item.id === prepared.id ? prepared : item))
    : [...subcategories, prepared];

  saveSubcategories(updated);
  return prepared;
};

export const upsertProduct = (product) => {
  const products = getProducts();
  const prepared = {
    ...product,
    id: product.id || nextId('PRD', products),
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || Number(product.price) || 0,
    discountValue: Number(product.discountValue) || 0,
    stock: Number(product.stock) || 0,
    rating: Number(product.rating) || 0,
    totalReviews: Number(product.totalReviews) || 0,
    ratingBreakdown: product.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    specifications: product.specifications || {},
  };

  const exists = products.some((item) => item.id === prepared.id);
  const updated = exists
    ? products.map((item) => (item.id === prepared.id ? prepared : item))
    : [...products, prepared];

  saveProducts(updated);
  return prepared;
};

export const getCategoryName = (categories, categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || 'Unassigned';

export const getSubcategoryName = (subcategories, subcategoryId) =>
  subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name || 'Unassigned';
