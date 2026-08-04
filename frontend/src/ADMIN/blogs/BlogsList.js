import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, FileText, Calendar, User, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';

const API_BASE = `${getApiDomain()}/api/Blog`;
const IMG_BASE = getApiDomain();

const HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
};

const formatDate = (isoStr) => {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return isoStr;
  }
};

const formatAuthorName = (name) => {
  if (!name) return 'Admin';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const BlogsList = () => {
  const [blogs, setBlogs]           = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSummaryId, setExpandedSummaryId] = useState(null);
  const [searchError, setSearchError] = useState('');
  const itemsPerPage = 10;

  /* ── Fetch all blogs ── */
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE, { headers: HEADERS });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load blog articles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  /* ── Delete a blog ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog article permanently?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete the article. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Filter ── */
  const filteredBlogs = useMemo(() => blogs.filter((blog) => {
    const q = searchTerm.toLowerCase();
    return (
      (blog.title      || '').toLowerCase().includes(q) ||
      (blog.category   || '').toLowerCase().includes(q) ||
      (blog.authorName || '').toLowerCase().includes(q) ||
      (blog.summary    || '').toLowerCase().includes(q) ||
      (blog.description|| '').toLowerCase().includes(q)
    );
  }).sort((a, b) => Number(b.id) - Number(a.id)), [blogs, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const pagedBlogs = filteredBlogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on search
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (/[^a-zA-Z0-9\s\-_.,]/.test(val) && val !== '') {
      setSearchError('Please provide valid input');
      return;
    } else {
      setSearchError('');
    }
    setSearchTerm(val);
  };

  const resolveImage = (src) => {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    return `${IMG_BASE}${src}`;
  };

  return (
    <div className="catalog-page">
      {/* ── Header ── */}
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <h1>Blog Articles</h1>
          <p>Create and manage educational articles, crop tips, and agro news displayed to users.</p>
        </div>

        <div className="catalog-header__actions">
          <Link to="/" className="catalog-btn" target="_blank" rel="noopener noreferrer">
            <Eye size={16} /> View Shop Phase
          </Link>
          <button className="catalog-btn" onClick={fetchBlogs} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/admin/blogs/form" className="catalog-btn catalog-btn--primary">
            <Plus size={16} /> Write New Blog
          </Link>
        </div>
      </section>

      {/* ── Error Banner ── */}
      {error && (
        <div className="catalog-alert catalog-alert--danger" style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
          <button
            onClick={fetchBlogs}
            style={{ marginLeft: 'auto', background: 'none', border: '1px solid currentColor', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="catalog-card">
        <div className="catalog-filterbar">
          <div className="catalog-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by title, author, category or summary..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            { (searchError || (searchTerm && filteredBlogs.length === 0)) && (
              <div style={{ position: 'absolute', top: '100%', left: '12px', marginTop: '4px', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>
                {searchError || 'Please provide valid input'}
              </div>
            )}
          </div>
          <span className="catalog-count">
            {loading ? 'Loading…' : `${filteredBlogs.length} article${filteredBlogs.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Author</th>
                <th>Category</th>
                <th>Publish Date</th>
                <th className="catalog-center-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="catalog-center-cell" style={{ padding: '48px 0', color: '#94a3b8' }}>
                    <RefreshCw size={20} className="spin" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    Loading articles from server...
                  </td>
                </tr>
              ) : filteredBlogs.length > 0 ? (
                pagedBlogs.map((blog) => {
                  const imgSrc = resolveImage(blog.coverImage);
                  return (
                    <tr key={blog.id} style={{ fontSize: '12px' }}>
                      {/* Article column */}
                      <td style={{ padding: '5px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={blog.title}
                              style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0', flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 32, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                              <FileText size={13} color="#94a3b8" />
                            </div>
                          )}
                          <div>
                            <div className="catalog-table__title" style={{ fontWeight: 600, color: '#1e293b', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                              {blog.title || 'Untitled'}
                            </div>
                            {(() => {
                              const fullText = (blog.description || blog.summary || '').replace(/>+/g, '').trim();
                              const isLong = fullText.length > 100;
                              const isExpanded = expandedSummaryId === blog.id;
                              const truncated = isLong ? fullText.slice(0, 100).replace(/\s+\S*$/, '') : fullText;
                              return (
                                <div style={{ marginTop: 2, maxWidth: 420 }}>
                                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: '1.55' }}>
                                    {isExpanded ? fullText : truncated}
                                  </span>
                                  {isLong && (
                                    <span
                                      onClick={(e) => { e.stopPropagation(); setExpandedSummaryId(isExpanded ? null : blog.id); }}
                                      style={{ display: 'inline-block', color: '#2563eb', cursor: 'pointer', fontWeight: 700, marginLeft: '6px', fontSize: '10.5px', whiteSpace: 'nowrap', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bfdbfe', verticalAlign: 'middle' }}
                                    >
                                      {isExpanded ? '▲ Less' : '▸ Read More'}
                                    </span>
                                  )}
                                  {!fullText && '—'}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 11 }}>
                          <User size={11} color="#94a3b8" />
                          {formatAuthorName(blog.authorName)}
                        </span>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ fontSize: 10, background: '#f0fdf4', color: '#15803d', padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          {blog.category || 'General'}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11 }}>
                          <Calendar size={11} color="#94a3b8" />
                          {formatDate(blog.publishDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '5px 8px' }}>
                        <div className="catalog-inline-actions" style={{ justifyContent: 'center' }}>
                          <AnimatedEditButton
                            to={`/admin/blogs/form?id=${blog.id}`}
                            title="Edit article"
                          />
                          <OutlookDeleteButton
                            onClick={() => handleDelete(blog.id)}
                            disabled={deletingId === blog.id}
                            title="Delete article"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="catalog-center-cell" style={{ padding: '32px 0', color: '#94a3b8', fontSize: '12px' }}>
                    {searchTerm ? 'No articles match your search.' : 'No blog articles found. Write your first article!'}
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
          totalItems={filteredBlogs.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default BlogsList;
