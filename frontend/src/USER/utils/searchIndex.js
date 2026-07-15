const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const collectValues = (...values) =>
  values
    .flat(Infinity)
    .filter(Boolean)
    .map((value) => {
      if (typeof value === 'object') return Object.values(value).join(' ');
      return String(value);
    })
    .join(' ');

const includesQuery = (haystack, query) => normalize(haystack).includes(query);

const valuesMatch = (left, right) => {
  const leftValue = normalize(left);
  const rightValue = normalize(right);
  return Boolean(leftValue && rightValue && leftValue === rightValue);
};

const searchablePages = [
  {
    id: 'home',
    title: 'Home',
    type: 'Page',
    path: '/',
    keywords: 'home main landing shop agriculture tools equipment',
  },
  {
    id: 'categories',
    title: 'Categories',
    type: 'Page',
    path: '/categories',
    keywords: 'categories category departments product groups',
  },
  {
    id: 'products',
    title: 'Products',
    type: 'Page',
    path: '/products',
    keywords: 'products shop all products machinery tools equipment',
  },
  {
    id: 'featured',
    title: 'Featured',
    type: 'Page',
    path: '/featured',
    keywords: 'featured recommended popular products',
  },
  {
    id: 'cart',
    title: 'Cart',
    type: 'Page',
    path: '/cart',
    keywords: 'cart shopping cart basket checkout',
  },
  {
    id: 'wishlist',
    title: 'Wishlist',
    type: 'Page',
    path: '/wishlist',
    keywords: 'wishlist saved favourite favorite heart',
  },
  {
    id: 'orders',
    title: 'My Orders',
    type: 'Page',
    path: '/my-orders',
    keywords: 'orders my orders order history purchases',
  },
  {
    id: 'track-order',
    title: 'Track Order',
    type: 'Page',
    path: '/track-order',
    keywords: 'track tracking shipment delivery order status',
  },
  {
    id: 'wallet',
    title: 'Wallet',
    type: 'Page',
    path: '/wallet',
    keywords: 'wallet coins balance rewards',
  },
  {
    id: 'checkout',
    title: 'Checkout',
    type: 'Page',
    path: '/checkout',
    keywords: 'checkout address payment place order',
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    type: 'Page',
    path: '/contact-support',
    keywords: 'contact support help customer care ticket',
  },
  {
    id: 'become-seller',
    title: 'Become a Supplier',
    type: 'Page',
    path: '/become-seller',
    keywords: 'supplier seller become seller vendor',
  },
  {
    id: 'blog',
    title: 'Blog',
    type: 'Page',
    path: '/blog',
    keywords: 'blog articles news guides farming',
  },
  {
    id: 'invoice',
    title: 'Invoice',
    type: 'Page',
    path: '/invoice',
    keywords: 'invoice bill receipt gst tax',
  },
];

export const buildSearchResults = ({
  query,
  productText = (product, field) => product?.[field],
  products = [],
  categories = [],
  subcategories = [],
}) => {
  const normalizedQuery = normalize(query);

  const emptyResults = {
    query: normalizedQuery,
    products: [],
    categories: [],
    subcategories: [],
    pages: [],
    total: 0,
  };

  if (!normalizedQuery) return emptyResults;

  const categoryById = new Map(
    categories.map((category) => [String(category.id), category])
  );
  const subcategoryById = new Map(
    subcategories.map((subcategory) => [String(subcategory.id), subcategory])
  );

  const findProductCategory = (product) =>
    categoryById.get(String(product.categoryId)) ||
    categories.find((category) =>
      valuesMatch(category.name, product.category) ||
      valuesMatch(category.slug, product.category)
    );

  const findProductSubcategory = (product) =>
    subcategoryById.get(String(product.subcategoryId || product.subCategoryId)) ||
    subcategories.find((subcategory) =>
      valuesMatch(subcategory.name, product.subcategory || product.subCategory) ||
      valuesMatch(subcategory.slug, product.subcategory || product.subCategory)
    );

  const matchedProducts = products.filter((product) => {
    const category = findProductCategory(product);
    const subcategory = findProductSubcategory(product);
    const searchable = collectValues(
      productText(product, 'name'),
      productText(product, 'displayName'),
      product.name,
      product.displayName,
      product.description,
      product.shortDescription,
      product.shortDesc,
      product.longDesc,
      product.brand,
      product.sku,
      product.category,
      product.categoryId,
      category?.name,
      category?.description,
      category?.slug,
      product.subcategory,
      product.subCategory,
      product.subcategoryId,
      product.subCategoryId,
      subcategory?.name,
      subcategory?.description,
      subcategory?.slug,
      product.features,
      product.specifications,
      product.productDetails
    );

    return includesQuery(searchable, normalizedQuery);
  });

  const matchedCategories = categories.filter((category) =>
    includesQuery(
      collectValues(category.name, category.description, category.slug),
      normalizedQuery
    )
  );

  const matchedSubcategories = subcategories.filter((subcategory) =>
    includesQuery(
      collectValues(
        subcategory.name,
        subcategory.description,
        subcategory.slug
      ),
      normalizedQuery
    )
  );

  const matchedPages = searchablePages.filter((page) =>
    includesQuery(
      collectValues(page.title, page.type, page.path, page.keywords),
      normalizedQuery
    )
  );

  return {
    query: normalizedQuery,
    products: matchedProducts,
    categories: matchedCategories,
    subcategories: matchedSubcategories,
    pages: matchedPages,
    total:
      matchedProducts.length +
      matchedCategories.length +
      matchedSubcategories.length +
      matchedPages.length,
  };
};
