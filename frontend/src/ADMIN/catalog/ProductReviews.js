import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Star, Trash2, PackagePlus } from 'lucide-react';
import {
  fetchProductReviews,
  createProductReview,
  deleteProductReview,
} from './productsApi';
import './adminModule.css';
import './ProductsForm.css';

// ─── ProductReviews ──────────────────────────────────────────────────────────
// Manages reviews for a product via:
//   GET    /api/reviews/{productId}
//   POST   /api/reviews
//   DELETE /api/reviews/{id}
// ─────────────────────────────────────────────────────────────────────────────

const createBlankReview = () => ({
  customer: '',
  rating: '5',
  date: new Date().toISOString().slice(0, 7),
  comment: '',
  verified: true,
});

const ProductReviews = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get('productId');
  const productName = searchParams.get('name') || 'Product';

  // ── State ────────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState(createBlankReview());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Load reviews ─────────────────────────────────────────────────────────
  const loadReviews = async () => {
    if (!productId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchProductReviews(productId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg('Could not load reviews: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ── Field helpers ────────────────────────────────────────────────────────
  const handleNewChange = (field, value) => {
    setNewReview((prev) => ({ ...prev, [field]: value }));
  };

  // ── Add a new review ─────────────────────────────────────────────────────
  const handleAdd = async () => {
    const { customer, comment } = newReview;
    if (!customer && !comment) {
      setErrorMsg('Please enter at least a customer name or a comment.');
      return;
    }
    if (!productId) {
      setErrorMsg('No product ID — please open this page from the product form.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await createProductReview(productId, newReview);
      setNewReview(createBlankReview());
      flashSuccess('Review added!');
      await loadReviews();
    } catch (err) {
      setErrorMsg('Could not add review: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete a review ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    setErrorMsg('');
    try {
      await deleteProductReview(id);
      flashSuccess('Review deleted.');
      setReviews((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (err) {
      setErrorMsg('Could not delete review: ' + (err?.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2200);
  };

  // ── Helper: display a saved review nicely ────────────────────────────────
  const mapRawReview = (r) => ({
    id: String(r.id ?? ''),
    customer: r.customerName || r.customer || 'Anonymous',
    rating: String(Number(r.rating) || 5),
    date: r.reviewDate
      ? r.reviewDate.slice(0, 7)
      : r.dateCreated
      ? r.dateCreated.slice(0, 7)
      : '',
    comment: r.reviewComment || r.comment || '',
    verified: (r.verifiedPurchase ?? r.verified) !== false,
  });

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
          <span className="catalog-kicker">Product Reviews</span>
          <h1>Reviews &amp; Ratings</h1>
          <p>
            Manage customer reviews for <strong>{productName}</strong> (ID: {productId}).
            Add seed data or highlighted verified reviews below.
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
        {/* ── Add New Review Card ────────────────────────────────────────── */}
        <section className="catalog-card">
          <div className="product-section-heading">
            <h2>Add Review</h2>
            <p>Fill in the review details and click Save Review.</p>
          </div>

          <div className="product-review-editor">
            <div className="catalog-form-grid product-review-grid">
              <div className="catalog-field">
                <label htmlFor="new-review-customer">Customer Name</label>
                <input
                  id="new-review-customer"
                  type="text"
                  value={newReview.customer}
                  onChange={(e) => handleNewChange('customer', e.target.value)}
                  placeholder="Ramesh Babu"
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="new-review-rating">Rating</label>
                <select
                  id="new-review-rating"
                  value={newReview.rating}
                  onChange={(e) => handleNewChange('rating', e.target.value)}
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="catalog-field">
                <label htmlFor="new-review-date">Review Date</label>
                <input
                  id="new-review-date"
                  type="month"
                  value={newReview.date}
                  onChange={(e) => handleNewChange('date', e.target.value)}
                />
              </div>
            </div>

            <div className="catalog-field">
              <label htmlFor="new-review-comment">Review Comment</label>
              <textarea
                id="new-review-comment"
                value={newReview.comment}
                onChange={(e) => handleNewChange('comment', e.target.value)}
                placeholder="Good build quality and useful for regular agricultural work."
              />
            </div>

            <div className="product-review-actions">
              <label className="product-checkbox">
                <input
                  type="checkbox"
                  checked={newReview.verified}
                  onChange={(e) => handleNewChange('verified', e.target.checked)}
                />
                Verified purchase
              </label>
              <button
                type="button"
                className="catalog-btn catalog-btn--primary"
                onClick={handleAdd}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Save size={15} />
                ) : (
                  <>
                    <Plus size={15} /> Save Review
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── Saved Reviews Card ─────────────────────────────────────────── */}
        <section className="catalog-card">
          <div className="product-section-heading product-section-heading--inline">
            <div>
              <h2>Saved Reviews ({reviews.length})</h2>
              <p>Click the delete button to remove a review from the API.</p>
            </div>
          </div>

          {isLoading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              No reviews saved yet. Add one above.
            </p>
          ) : (
            <div className="product-review-list">
              {reviews.map((rawReview) => {
                const review = mapRawReview(rawReview);
                return (
                  <div className="product-review-editor" key={review.id}>
                    <div className="catalog-form-grid product-review-grid">
                      <div className="catalog-field">
                        <label>Customer Name</label>
                        <input
                          type="text"
                          value={review.customer}
                          readOnly
                          style={{ background: '#f8fafc', cursor: 'default' }}
                        />
                      </div>
                      <div className="catalog-field">
                        <label>Rating</label>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            fontSize: '14px',
                          }}
                        >
                          {Array.from({ length: Number(review.rating) }, (_, i) => (
                            <Star key={i} size={13} fill="currentColor" color="#f59e0b" />
                          ))}
                          <span style={{ marginLeft: '4px' }}>{review.rating} / 5</span>
                        </div>
                      </div>
                      <div className="catalog-field">
                        <label>Review Date</label>
                        <input
                          type="text"
                          value={review.date || '—'}
                          readOnly
                          style={{ background: '#f8fafc', cursor: 'default' }}
                        />
                      </div>
                    </div>

                    <div className="catalog-field">
                      <label>Review Comment</label>
                      <textarea
                        value={review.comment || '—'}
                        readOnly
                        style={{ background: '#f8fafc', cursor: 'default', resize: 'none' }}
                      />
                    </div>

                    <div className="product-review-actions">
                      <label className="product-checkbox">
                        <input type="checkbox" checked={review.verified} readOnly />
                        Verified purchase
                      </label>
                      <button
                        type="button"
                        className="catalog-btn catalog-btn--danger"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                      >
                        <Trash2 size={15} /> {deletingId === review.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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

export default ProductReviews;
