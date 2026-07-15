import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Check, Filter, Package, Plus, Search, Star, AlertTriangle } from 'lucide-react';
import { getCategoryName, getSubcategoryName } from './catalogStore';
import { deleteProduct as deleteProductApi, fetchCategories, fetchProducts, fetchSubcategories, searchProducts } from './productsApi';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import './adminModule.css';

// alias so JSX isn't confused
const Link = RouterLink;

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getStatusClass = (status) => {
  if (status === 'In Stock') return 'catalog-badge--stock';
  if (status === 'Low Stock') return 'catalog-badge--low';
  return 'catalog-badge--out';
};

const getDiscountLabel = (product) => {
  const mrp = Number(product.mrp) || 0;
  const price = Number(product.price) || 0;
  if (!mrp || mrp <= price) return 'No discount';
  const percentage = Math.round(((mrp - price) / mrp) * 100);
  return `${percentage}% off`;
};

const ProductsList = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadAll = useCallback(async (isMounted) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [cats, subcats] = await Promise.all([fetchCategories(), fetchSubcategories()]);
      if (!isMounted) return;
      setCategories(cats);
      setSubcategories(subcats);
      const apiProducts = await fetchProducts(cats, subcats);
      if (isMounted) setProducts(apiProducts);
    } catch (error) {
      if (isMounted) setErrorMessage(error.message || 'Unable to load products.');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);


    useEffect(() => {
    if (!searchTerm.trim()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(searchTerm.trim(), categories, subcategories);
        if (!cancelled) setProducts(results);
      } catch (err) {
        if (!cancelled) setErrorMessage(err.message || 'Search failed.');
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, categories, subcategories]);

  // When search is cleared, reload the full list
  useEffect(() => {
    if (searchTerm.trim()) return;
    let isMounted = true;
    loadAll(isMounted);
    return () => { isMounted = false; };
  }, [searchTerm, loadAll]);

  // ── Client-side filter by category + status ───────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === 'All' || product.categoryId === selectedCategoryId;
      const matchesStatus =
        selectedStatus === 'All' || product.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [products, selectedCategoryId, selectedStatus]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategoryId, selectedStatus]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setIsDeletingId(id);
    setErrorMessage('');
    try {
      await deleteProductApi(id);
      setProducts((current) => current.filter((p) => p.id !== id));
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete product.');
    } finally {
      setIsDeletingId('');
    }
  };

  const busy = isLoading || isSearching;

  return (
    <div className="catalog-page">
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Step 3 of 3</span>
          <h1>Products</h1>
          <p>Products are created after category and subcategory setup, keeping inventory organized for filters and reports.</p>
        </div>

        <div className="catalog-header__actions">
          <Link to="/admin/catalog/subcategories" className="catalog-btn">
            View Subcategories
          </Link>
          <Link to="/admin/catalog/products-form" className="catalog-btn catalog-btn--primary">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </section>

      <section className="catalog-card">
        {errorMessage && (
          <div className="catalog-alert catalog-alert--warning">
            {errorMessage}
          </div>
        )}

        <div className="catalog-filterbar">
          {/* API-backed search */}
          <div className="catalog-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search product name, SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="catalog-inline-actions">
            {/* Category filter */}
            <label className="catalog-filter">
              <Filter size={16} />
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Status filter */}
            <label className="catalog-filter">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>

            <span className="catalog-count">
              {busy ? '…' : filteredProducts.length} products
            </span>
          </div>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th className="catalog-number-cell">MRP / Price</th>
                <th>Discount</th>
                <th>Rating</th>
                <th className="catalog-center-cell">Stock</th>
                <th>Status</th>
                <th className="catalog-center-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {busy && (
                <tr>
                  <td colSpan="10" className="catalog-center-cell" style={{ fontSize: '12px', padding: '16px' }}>
                    {isLoading ? 'Loading products from API…' : 'Searching…'}
                  </td>
                </tr>
              )}

              {!busy && currentPageProducts.map((product) => (
                <tr key={product.id} style={{ fontSize: '12px' }}>
                  <td style={{ padding: '5px 8px' }}>
                    <span className="catalog-badge" style={{ fontSize: '10px' }}>
                      <Package size={11} /> #{product.id}
                    </span>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: '600' }}>{product.name}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>
                      {product.brand || 'No brand'} · {product.specifications?.weight || 'N/A'}
                    </div>
                  </td>
                  <td className="catalog-path" style={{ padding: '5px 8px', fontSize: '11px' }}>{product.sku || '—'}</td>
                  <td style={{ padding: '5px 8px', fontSize: '11px' }}>{getCategoryName(categories, product.categoryId)}</td>
                  <td style={{ padding: '5px 8px', fontSize: '11px' }}>{getSubcategoryName(subcategories, product.subcategoryId)}</td>
                  <td className="catalog-number-cell" style={{ padding: '5px 8px', fontSize: '11px' }}>
                    {formatCurrency(product.price)}
                    {Number(product.mrp) > Number(product.price) && (
                      <div className="catalog-table__muted" style={{ fontSize: '10px' }}>
                        MRP {formatCurrency(product.mrp)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className={`catalog-badge ${Number(product.mrp) > Number(product.price) ? 'catalog-badge--low' : ''}`} style={{ fontSize: '10px' }}>
                      {getDiscountLabel(product)}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className="catalog-badge" style={{ fontSize: '10px' }}>
                      <Star size={11} fill="currentColor" />{' '}
                      {Number(product.rating || 0).toFixed(1)}
                    </span>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>
                      {Number(product.totalReviews || 0)} reviews
                    </div>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '5px 8px', fontSize: '11px' }}>{product.stock}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className={`catalog-badge ${getStatusClass(product.status)}`} style={{ fontSize: '10px' }}>
                      {product.status === 'In Stock' ? <Check size={11} /> : <AlertTriangle size={11} />}
                      {product.status}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <div className="catalog-inline-actions">
                      <AnimatedEditButton
                        to={`/admin/catalog/products-form?id=${product.id}`}
                        title="Edit product"
                      />
                      <OutlookDeleteButton
                        onClick={() => handleDelete(product.id)}
                        disabled={isDeletingId === product.id}
                        title="Delete product"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {!busy && !filteredProducts.length && (
                <tr>
                  <td colSpan="10" className="catalog-center-cell" style={{ fontSize: '12px', padding: '16px' }}>
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default ProductsList;
