import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, RefreshCw } from 'lucide-react';
import '../catalog/adminModule.css';
import { Toast } from '../components/Toast';

const API_BASE   = 'http://shyamagrotools.com/api/Blog';
const IMG_BASE   = 'http://shyamagrotools.com';
const GET_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
};

const emptyForm = {
  title:       '',
  category:    'Agriculture',
  authorName:  'Admin',
  publishDate: '',
  summary:     '',
  description: '',
};

const CATEGORIES = ['Agriculture', 'Equipment', 'Irrigation', 'Tips & Tricks', 'Agro News', 'General'];

const BlogForm = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const blogId          = searchParams.get('id');
  const isEditing       = Boolean(blogId);

  const [formData, setFormData]     = useState(emptyForm);
  const [imageFile, setImageFile]   = useState(null);           // new file chosen
  const [imagePreview, setImagePreview] = useState('');         // preview URL
  const [existingImg, setExistingImg]   = useState('');         // current server image path

  const [loading, setLoading]   = useState(isEditing);
  const [saving, setSaving]     = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  /* ── Set today as default date for new blogs ── */
  useEffect(() => {
    if (!isEditing) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, publishDate: today }));
    }
  }, [isEditing]);

  /* ── Load existing blog for edit ── */
  useEffect(() => {
    if (!blogId) return;
    setLoading(true);
    setToastMessage('');

    fetch(`${API_BASE}/${blogId}`, { headers: GET_HEADERS })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setFormData({
          title:       data.title       || '',
          category:    data.category    || 'Agriculture',
          authorName:  data.authorName  || 'Admin',
          publishDate: data.publishDate ? data.publishDate.split('T')[0] : '',
          summary:     data.summary     || '',
          description: data.description || '',
        });
        if (data.coverImage) {
          const src = data.coverImage.startsWith('http')
            ? data.coverImage
            : `${IMG_BASE}${data.coverImage}`;
          setExistingImg(src);
          setImagePreview(src);
        }
      })
      .catch(err => {
        setToastMessage(err.message || 'Failed to load article.');
        setToastType('error');
      })
      .finally(() => setLoading(false));
  }, [blogId]);

  /* ── Field change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* ── Image file select ── */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) { setToastMessage('Article title is required.'); setToastType('warning'); return; }
    if (!formData.description.trim()) { setToastMessage('Full content description is required.'); setToastType('warning'); return; }

    setSaving(true);
    setToastMessage('');

    try {
      const body = new FormData();
      body.append('title',       formData.title.trim());
      body.append('category',    formData.category);
      body.append('authorName',  formData.authorName.trim() || 'Admin');
      body.append('publishDate', formData.publishDate || new Date().toISOString().split('T')[0]);
      body.append('summary',     formData.summary.trim() || formData.description.slice(0, 150));
      body.append('description', formData.description.trim());

      if (imageFile) {
        body.append('coverImage', imageFile, imageFile.name);
      }

      const url    = isEditing ? `${API_BASE}/${blogId}` : API_BASE;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Request failed with status ${res.status}`);
      }

      setToastMessage(`Article ${isEditing ? 'updated' : 'published'} successfully!`);
      setToastType('success');
      setTimeout(() => {
        navigate('/admin/blogs/list');
      }, 1000);

    } catch (err) {
      setToastMessage(err.message || 'Failed to save the article. Please try again.');
      setToastType('error');
      setSaving(false);
    }
  };

  return (
    <div className="catalog-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Row with Actions in Top-Right */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" to="/admin/blogs/list">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Blog Manager</span>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {isEditing ? 'Edit Blog Article' : 'Write Blog Article'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/blogs/list" className="catalog-btn" style={{ fontSize: '11px', padding: '6px 12px' }}>
            Cancel
          </Link>
          <button className="catalog-btn catalog-btn--primary" onClick={handleSubmit} disabled={saving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            {saving ? (
              <RefreshCw size={14} className="spin" style={{ marginRight: '4px' }} />
            ) : (
              <Save size={14} style={{ marginRight: '4px' }} />
            )}
            {isEditing ? 'Update Article' : 'Publish Article'}
          </button>
        </div>
      </section>

      {/* Form Card */}
      <section className="catalog-card" style={{ padding: '20px', margin: 0 }}>
        {loading ? (
          <div className="catalog-center-cell" style={{ padding: '48px 0', color: '#94a3b8', textAlign: 'center' }}>
            <RefreshCw size={20} className="spin" style={{ display: 'block', margin: '0 auto 8px' }} />
            Loading article data...
          </div>
        ) : (
          <form className="catalog-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0' }}>
              Article Details
            </h3>

            {/* Row 1: Title + Category */}
            <div className="catalog-form-grid" style={{ gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="blog-title">Article Title <span style={{ color: '#e30613' }}>*</span></label>
                <input
                  id="blog-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Modern Drip Irrigation Practices"
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="blog-category">Category</label>
                <select id="blog-category" name="category" value={formData.category} onChange={handleChange} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Author + Date + Image Upload */}
            <div className="catalog-form-grid catalog-form-grid--three" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="catalog-field">
                <label htmlFor="blog-author">Author Name</label>
                <input
                  id="blog-author"
                  name="authorName"
                  type="text"
                  value={formData.authorName}
                  onChange={handleChange}
                  placeholder="e.g. Admin, Agri Expert"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="blog-date">Publish Date <span style={{ color: '#e30613' }}>*</span></label>
                <input
                  id="blog-date"
                  name="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={handleChange}
                  required
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              {/* Image Upload */}
              <div className="catalog-field">
                <label>Featured Cover Image</label>
                <label className="catalog-upload" htmlFor="blog-image" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '6px 10px', backgroundColor: '#f8fafc', height: '34px', overflow: 'hidden' }}>
                  <Upload size={14} style={{ color: '#059669', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{imagePreview ? 'Change Photo' : 'Upload Cover Photo'}</strong>
                  </span>
                  <input id="blog-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Image Preview Thumbnail if exists */}
            {imagePreview && (
              <div style={{ position: 'relative', width: '120px', height: '70px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Summary */}
            <div className="catalog-field">
              <label htmlFor="blog-summary">Short Summary (auto-derived if empty)</label>
              <input
                id="blog-summary"
                name="summary"
                type="text"
                value={formData.summary}
                onChange={handleChange}
                placeholder="A brief 1–2 sentence hook summarising the article..."
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>

            {/* Full Description */}
            <div className="catalog-field">
              <label htmlFor="blog-description">Full Content Description <span style={{ color: '#e30613' }}>*</span></label>
              <textarea
                id="blog-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write the full content of the blog post here..."
                rows="6"
                required
                style={{ padding: '6px 10px', fontSize: '12px', resize: 'none' }}
              />
            </div>

          </form>
        )}
      </section>
    </div>
  );
};

export default BlogForm;
