import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, X, PackagePlus } from 'lucide-react';
import {
  fetchProductFeatures,
  createProductFeature,
  deleteProductFeature,
} from './productsApi';
import './adminModule.css';
import './ProductsForm.css';

// ─── ProductFeatures ─────────────────────────────────────────────────────────
// Manages features for a product via:
//   GET    /api/features/{productId}
//   POST   /api/features
//   DELETE /api/features/{id}
// ─────────────────────────────────────────────────────────────────────────────

const ProductFeatures = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get('productId');
  const productName = searchParams.get('name') || 'Product';

  // ── State ────────────────────────────────────────────────────────────────
  const [features, setFeatures] = useState([]); // { id, feature, featureName }
  const [newText, setNewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Load features ────────────────────────────────────────────────────────
  const loadFeatures = async () => {
    if (!productId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchProductFeatures(productId);
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg('Could not load features: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ── Add a new feature ────────────────────────────────────────────────────
  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    if (!productId) {
      setErrorMsg('No product ID — please open this page from the product form.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await createProductFeature(productId, text);
      setNewText('');
      flashSuccess('Feature added!');
      await loadFeatures();
    } catch (err) {
      setErrorMsg('Could not add feature: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete a feature ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    setErrorMsg('');
    try {
      await deleteProductFeature(id);
      flashSuccess('Feature deleted.');
      setFeatures((prev) => prev.filter((f) => String(f.id) !== String(id)));
    } catch (err) {
      setErrorMsg('Could not delete feature: ' + (err?.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2200);
  };

  // ── No product ID guard ──────────────────────────────────────────────────
  if (!productId) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <PackagePlus size={34} />
          <h3>No Product Selected</h3>
          <p>Please open this page from the Products Form after saving a product.</p>
          <Link to="/admin/catalog/products" className="catalog-btn catalog-btn--primary">
            Go to Products List
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="catalog-page product-form-page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Product Features</span>
          <h1>Key Features</h1>
          <p>
            Manage benefit-led feature points for <strong>{productName}</strong> (ID: {productId}).
            These appear as a feature list on the product page.
          </p>
        </div>
        <div className="catalog-header__actions">
          <Link
            to={`/admin/catalog/products-form?id=${productId}`}
            className="catalog-btn"
          >
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <button
            type="button"
            className="catalog-btn catalog-btn--primary"
            onClick={() => navigate('/admin/catalog/products')}
          >
            View Products
          </button>
        </div>
      </section>

      {/* ── Alerts ──────────────────────────────────────────────────────── */}
      {successMsg && (
        <span className="catalog-alert" style={{ marginBottom: '12px', display: 'flex' }}>
          {successMsg}
        </span>
      )}
      {errorMsg && (
        <span
          className="catalog-alert catalog-alert--warning"
          style={{ marginBottom: '12px', display: 'flex' }}
        >
          {errorMsg}
        </span>
      )}

      <div className="catalog-stack">
        {/* ── Add New Feature Card ───────────────────────────────────────── */}
        <section className="catalog-card">
          <div className="product-section-heading product-section-heading--inline">
            <div>
              <h2>Add Feature</h2>
              <p>Type a short, benefit-led feature point and click Save.</p>
            </div>
          </div>

          <div className="product-repeat-row" style={{ marginBottom: 0 }}>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Efficient water distribution for farm irrigation"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              type="button"
              className="catalog-btn catalog-btn--primary"
              onClick={handleAdd}
              disabled={isSaving || !newText.trim()}
              title="Add Feature"
            >
              {isSaving ? <Save size={15} /> : <Plus size={15} />}
            </button>
          </div>
        </section>

        {/* ── Existing Features Card ─────────────────────────────────────── */}
        <section className="catalog-card">
          <div className="product-section-heading product-section-heading--inline">
            <div>
              <h2>Saved Features ({features.length})</h2>
              <p>Click the delete button to remove a feature from the API.</p>
            </div>
          </div>

          {isLoading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading features…</p>
          ) : features.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              No features saved yet. Add one above.
            </p>
          ) : (
            <div className="product-feature-list">
              {features.map((feature) => {
                const featureText = feature.feature || feature.featureName || '';
                const featureId = feature.id;
                return (
                  <div className="product-repeat-row" key={featureId}>
                    <input
                      type="text"
                      value={featureText}
                      readOnly
                      style={{ background: '#f8fafc', cursor: 'default' }}
                      title={featureText}
                    />
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--danger"
                      onClick={() => handleDelete(featureId)}
                      disabled={deletingId === featureId}
                      title="Delete Feature"
                    >
                      {deletingId === featureId ? <Save size={15} /> : <X size={15} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer Actions ───────────────────────────────────────────────── */}
      <div className="catalog-actions product-form-actions">
        <Link
          to={`/admin/catalog/products-form?id=${productId}`}
          className="catalog-btn catalog-btn--primary"
        >
          <ArrowLeft size={16} /> Back to Product Form
        </Link>
        <Link to="/admin/catalog/products" className="catalog-btn">
          Products List
        </Link>
      </div>
    </div>
  );
};

export default ProductFeatures;
