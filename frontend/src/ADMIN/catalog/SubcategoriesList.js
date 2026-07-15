import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Filter, Plus, Search, X } from 'lucide-react';
import { getCategoryName } from './catalogStore';
import {
  deleteSubcategory as deleteSubcategoryApi,
  fetchCategories,
  fetchProducts,
  fetchSubcategories,
  saveSubcategory,
} from './catalogApi';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import './adminModule.css';

const SubcategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    const loadCatalogData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [loadedCategories, rawSubcategories, loadedProducts] = await Promise.all([
          fetchCategories(),
          fetchSubcategories().catch(() => []),
          fetchProducts().catch(() => [])
        ]);

        const normalizedProducts = loadedProducts.map(p => ({
          id: String(p.id || p.productId || p.Id || p.ProductId || ''),
          subcategoryId: String(p.subcategoryId || p.SubCategoryId || ''),
        }));

        if (isMounted) {
          setCategories(loadedCategories);
          setSubcategories(rawSubcategories);
          setProducts(normalizedProducts);
        }
      } catch (apiError) {
        if (isMounted) setError(apiError.message || 'Unable to load subcategories.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCatalogData();
    return () => { isMounted = false; };
  }, []);

  const productCounts = useMemo(() => {
    const counts = subcategories.reduce((currentCounts, subcategory) => {
      if (Array.isArray(subcategory.products)) {
        currentCounts[subcategory.id] = subcategory.products.length;
      }
      return currentCounts;
    }, {});

    return products.reduce((currentCounts, product) => {
      if (currentCounts[product.subcategoryId] !== undefined) return currentCounts;
      currentCounts[product.subcategoryId] = (currentCounts[product.subcategoryId] || 0) + 1;
      return currentCounts;
    }, counts);
  }, [products, subcategories]);

  const filteredSubcategories = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return subcategories.filter((subcategory) => {
      const categoryName = getCategoryName(categories, subcategory.categoryId).toLowerCase();
      const matchesSearch =
        subcategory.name.toLowerCase().includes(query) ||
        (subcategory.slug || '').toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        String(subcategory.id).toLowerCase().includes(query);
      const matchesCategory = selectedCategoryId === 'All' || subcategory.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [subcategories, searchTerm, categories, selectedCategoryId]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryId]);

  const toggleStatus = async (id) => {
    const subcategory = subcategories.find((item) => item.id === id);
    if (!subcategory) return;

    const updatedSubcategory = {
      ...subcategory,
      status: subcategory.status === 'Active' ? 'Inactive' : 'Active',
    };
    const previousSubcategories = subcategories;
    setSubcategories((current) => current.map((item) => (item.id === id ? updatedSubcategory : item)));

    try {
      const savedSubcategory = await saveSubcategory(updatedSubcategory);
      setSubcategories((current) => current.map((item) => (item.id === id ? savedSubcategory : item)));
    } catch (apiError) {
      setSubcategories(previousSubcategories);
      setError(apiError.message || 'Unable to update subcategory status.');
    }
  };

  const deleteSubcategory = async (id) => {
    if (productCounts[id]) {
      window.alert('Move or delete linked products before deleting this subcategory.');
      return;
    }

    try {
      await deleteSubcategoryApi(id);
      setSubcategories((current) => current.filter((subcategory) => subcategory.id !== id));
    } catch (apiError) {
      setError(apiError.message || 'Unable to delete subcategory.');
    }
  };

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubcategories = filteredSubcategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

  return (
    <div className="catalog-page" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      <section className="catalog-header" style={{ padding: '16px 20px', marginBottom: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Catalog Management</span>
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Subcategories</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Manage subcategories SIT under categories.</p>
        </div>

        <div className="catalog-header__actions">
          <Link to="/admin/catalog/categories" className="catalog-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            View Categories
          </Link>
          <Link to="/admin/catalog/subcategory" className="catalog-btn catalog-btn--primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Plus size={14} /> Add Subcategory
          </Link>
        </div>
      </section>

      <section className="catalog-card" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        {error && <div className="catalog-alert catalog-alert--danger">{error}</div>}
        <div className="catalog-filterbar" style={{ padding: '12px 16px', background: '#fff' }}>
          <div className="catalog-search" style={{ maxWidth: '320px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search subcategory..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ padding: '6px 10px 6px 32px', fontSize: '13px' }}
            />
          </div>

          <div className="catalog-inline-actions" style={{ gap: '12px' }}>
            <label className="catalog-filter">
              <Filter size={14} />
              <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} style={{ padding: '4px 8px', fontSize: '13px' }}>
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="catalog-count" style={{ fontSize: '13px' }}>{filteredSubcategories.length} subcategories</span>
          </div>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px' }}>ID</th>
                <th style={{ padding: '10px 16px' }}>Sub Category Name</th>
                <th style={{ padding: '10px 16px' }}>Slug</th>
                <th style={{ padding: '10px 16px' }}>Description</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '10px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="6" className="catalog-center-cell" style={{ padding: '32px' }}>
                    Loading subcategories...
                  </td>
                </tr>
              )}
              {!isLoading && currentSubcategories.map((subcategory) => (
                <tr key={subcategory.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: '#64748b' }}>
                    {subcategory.id}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: '#1e293b' }}>
                    {subcategory.name}
                  </td>
                  <td className="catalog-path" style={{ padding: '10px 16px', color: '#2563eb' }}>
                    {subcategory.slug}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {subcategory.description}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      type="button"
                      className={`catalog-badge ${
                        subcategory.status === 'Active' ? 'catalog-badge--active' : 'catalog-badge--inactive'
                      }`}
                      onClick={() => toggleStatus(subcategory.id)}
                      style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {subcategory.status === 'Active' ? <Check size={11} /> : <X size={11} />}
                      {subcategory.status}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div className="catalog-inline-actions" style={{ justifyContent: 'center', gap: '8px' }}>
                      <AnimatedEditButton
                        to={`/admin/catalog/subcategory?id=${subcategory.id}`}
                        title="Edit subcategory"
                      />
                      <OutlookDeleteButton
                        onClick={() => deleteSubcategory(subcategory.id)}
                        title="Delete subcategory"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !filteredSubcategories.length && (
                <tr>
                  <td colSpan="6" className="catalog-center-cell" style={{ padding: '32px', color: '#64748b' }}>
                    No subcategories match your filters.
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
          totalItems={filteredSubcategories.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default SubcategoriesList;
