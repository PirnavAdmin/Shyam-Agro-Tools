import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Package } from 'lucide-react';
import { fetchProducts, deleteProduct as deleteProductApi } from '../catalog/productsApi';
import '../catalog/adminModule.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    loadProducts(isMounted);
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async (isMounted = true) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchProducts();
      if (isMounted) setProducts(data);
    } catch (err) {
      if (isMounted) setError(err.message || 'Error loading products.');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deleting product.');
    }
  };

  return (
    <div className="catalog-page">
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <h1>Product List</h1>
          <p>Inventory management and product updates.</p>
          <p>{products.length} products</p>
        </div>
        <div className="catalog-header__actions">
          <Link to="/admin/catalog/products-form" className="catalog-btn catalog-btn--primary">
            Add New Product
          </Link>
        </div>
      </section>

      <section className="catalog-card">
        {error && <div className="catalog-alert catalog-alert--warning">{error}</div>}

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th className="catalog-number-cell">Price</th>
                <th className="catalog-center-cell">Stock</th>
                <th>Status</th>
                <th className="catalog-center-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="catalog-center-cell">Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <span className="catalog-badge">
                        <Package size={14} /> {product.id}
                      </span>
                      <div className="catalog-table__title">{product.name}</div>
                      <div className="catalog-table__muted">{product.brand}</div>
                    </td>
                    <td className="catalog-path">{product.sku || 'N/A'}</td>
                    <td>{product.categoryId}</td>
                    <td className="catalog-number-cell">
                      INR {Number(product.price || product.mrp || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="catalog-center-cell">{product.stock}</td>
                    <td>
                      <span
                        className={`catalog-badge ${
                          product.status === 'In Stock'
                            ? 'catalog-badge--stock'
                            : 'catalog-badge--out'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="catalog-inline-actions">
                        <Link
                          to={`/admin/catalog/products-form?id=${product.id}`}
                          className="catalog-btn catalog-btn--icon"
                          title="Edit product"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          type="button"
                          className="catalog-btn catalog-btn--icon catalog-btn--danger"
                          onClick={() => deleteProduct(product.id)}
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="catalog-center-cell">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProductList;
