import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, Search, X } from 'lucide-react';
import { deleteCategory as deleteCategoryApi, fetchCategories, fetchProducts, saveCategory } from './catalogApi';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import './adminModule.css';

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [loadedCategories, loadedProducts] = await Promise.all([
          fetchCategories(),
          fetchProducts().catch(() => [])
        ]);

        const normalizedProducts = loadedProducts.map(p => ({
          id: String(p.id || p.productId || p.Id || p.ProductId || ''),
          categoryId: String(p.categoryId || p.CategoryId || ''),
        }));

        if (isMounted) {
          setCategories(loadedCategories);
          setProducts(normalizedProducts);
        }
      } catch (apiError) {
        if (isMounted) setError(apiError.message || 'Unable to load categories.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategories();
    return () => { isMounted = false; };
  }, []);

  const categoryStats = useMemo(() => {
    return categories.reduce((stats, category) => {
      const childSubcategories = Array.isArray(category.subCategories) ? category.subCategories : [];
      const childProducts = Array.isArray(category.products)
        ? category.products
        : products.filter((product) => product.categoryId === category.id);

      stats[category.id] = {
        subcategories: childSubcategories.length,
        products: childProducts.length,
      };

      return stats;
    }, {});
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        (category.description || '').toLowerCase().includes(query) ||
        (category.slug || '').toLowerCase().includes(query) ||
        String(category.id).toLowerCase().includes(query)
      );
    });
  }, [categories, searchTerm]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleStatus = async (id) => {
    const category = categories.find((item) => item.id === id);
    if (!category) return;

    const updatedCategory = {
      ...category,
      status: category.status === 'Active' ? 'Inactive' : 'Active',
    };
    const previousCategories = categories;
    setCategories((current) => current.map((item) => (item.id === id ? updatedCategory : item)));

    try {
      const savedCategory = await saveCategory(updatedCategory);
      setCategories((current) => current.map((item) => (item.id === id ? savedCategory : item)));
    } catch (apiError) {
      setCategories(previousCategories);
      setError(apiError.message || 'Unable to update category status.');
    }
  };

  const deleteCategory = async (id) => {
    const stats = categoryStats[id] || { subcategories: 0, products: 0 };
    if (stats.subcategories || stats.products) {
      window.alert('Move or delete linked subcategories and products before deleting this category.');
      return;
    }

    try {
      await deleteCategoryApi(id);
      setCategories((current) => current.filter((category) => category.id !== id));
    } catch (apiError) {
      setError(apiError.message || 'Unable to delete category.');
    }
  };

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <div className="catalog-page" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      <section className="catalog-header" style={{ padding: '16px 20px', marginBottom: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Catalog Management</span>
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Categories</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Create and manage primary catalog categories.</p>
        </div>

        <div className="catalog-header__actions">
          <Link to="/admin/catalog/subcategories" className="catalog-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            View Subcategories
          </Link>
          <Link to="/admin/catalog/category" className="catalog-btn catalog-btn--primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Plus size={14} /> Add Category
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
              placeholder="Search category..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ padding: '6px 10px 6px 32px', fontSize: '13px' }}
            />
          </div>
          <span className="catalog-count" style={{ fontSize: '13px' }}>{filteredCategories.length} categories</span>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px' }}>ID</th>
                <th style={{ padding: '10px 16px' }}>Category Name</th>
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
                    Loading categories...
                  </td>
                </tr>
              )}
              {!isLoading && currentCategories.map((category) => (
                <tr key={category.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: '#64748b' }}>
                    {category.id}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: '#1e293b' }}>
                    {category.name}
                  </td>
                  <td className="catalog-path" style={{ padding: '10px 16px', color: '#2563eb' }}>
                    {category.slug}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {category.description}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      type="button"
                      className={`catalog-badge ${
                        category.status === 'Active' ? 'catalog-badge--active' : 'catalog-badge--inactive'
                      }`}
                      onClick={() => toggleStatus(category.id)}
                      style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {category.status === 'Active' ? <Check size={11} /> : <X size={11} />}
                      {category.status}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div className="catalog-inline-actions" style={{ justifyContent: 'center', gap: '8px' }}>
                      <AnimatedEditButton
                        to={`/admin/catalog/category?id=${category.id}`}
                        title="Edit category"
                      />
                      <OutlookDeleteButton
                        onClick={() => deleteCategory(category.id)}
                        title="Delete category"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !filteredCategories.length && (
                <tr>
                  <td colSpan="6" className="catalog-center-cell" style={{ padding: '32px', color: '#64748b' }}>
                    No categories match your search.
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
          totalItems={filteredCategories.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default CategoriesList;
