import React, { useEffect, useState } from 'react';
import { Plus, Search, Upload, Check, X, Image as ImageIcon, Trash2, Edit2, ExternalLink } from 'lucide-react';
import {
  fetchAdminBanners,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  uploadBannerImage
} from './bannersApi';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

const resolveBannerImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const apiDomain = getApiDomain();
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${apiDomain}${cleanUrl}`;
};

const BannersList = () => {
  const [banners, setBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    targetUrl: '/categories',
    bannerType: 'Hero',
    isActive: true,
    displayOrder: 0
  });

  const loadBanners = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAdminBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to load banners:', err);
      setError('Could not connect to server. Showing local state.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetUrl: '/categories',
      bannerType: 'Hero',
      isActive: true,
      displayOrder: banners.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      targetUrl: banner.targetUrl || '/categories',
      bannerType: banner.bannerType || 'Hero',
      isActive: banner.isActive,
      displayOrder: banner.displayOrder || 0
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadBannerImage(file);
      if (res && res.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
        setSuccessMsg('Banner image uploaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Image upload failed. You can also paste an image URL directly.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please upload an image or provide an Image URL.');
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        setSuccessMsg('Banner updated successfully!');
      } else {
        await createBanner(formData);
        setSuccessMsg('New Banner created successfully!');
      }
      setIsModalOpen(false);
      loadBanners();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('Error saving banner. Please try again.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleBannerActive(id);
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      setSuccessMsg('Banner deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete banner:', err);
      alert('Failed to delete banner.');
    }
  };

  const filteredBanners = banners.filter(b => {
    const matchesSearch = (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || (b.bannerType || '').toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="catalog-spread" style={{ padding: '24px' }}>
      {/* Top Header */}
      <div className="catalog-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="catalog-title" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Hero & Promo Banners
          </h1>
          <p className="catalog-subtitle" style={{ fontSize: '13px', color: '#64748b' }}>
            Manage homepage hero sliders and promotional banner images without changing code
          </p>
        </div>
        <button
          type="button"
          className="catalog-btn catalog-btn--primary"
          onClick={handleOpenCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add New Banner
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Controls Bar */}
      <div className="catalog-controls" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="catalog-search" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} className="catalog-search__icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="catalog-search__input"
            placeholder="Search banners by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['All', 'Hero', 'Promo', 'Category', 'Trust'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: filterType === type ? '2px solid #10b981' : '1px solid #cbd5e1',
                background: filterType === type ? '#ecfdf5' : '#fff',
                color: filterType === type ? '#047857' : '#475569',
                cursor: 'pointer'
              }}
            >
              {type} Banners
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="catalog-table-wrap" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table className="catalog-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Order</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Preview</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Title / Subtitle</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Target Link</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>Status</th>
              <th className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading banners...
                </td>
              </tr>
            ) : filteredBanners.length === 0 ? (
              <tr>
                <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No banners found. Click <strong>Add New Banner</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredBanners.map(banner => (
                <tr key={banner.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#64748b' }}>
                    #{banner.displayOrder || banner.id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {banner.imageUrl ? (
                      <img
                        src={resolveBannerImage(banner.imageUrl)}
                        alt={banner.title || 'Banner Preview'}
                        style={{ width: '120px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                    ) : (
                      <div style={{ width: '120px', height: '50px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{banner.title || '(No Title)'}</div>
                    {banner.subtitle && <div style={{ fontSize: '11px', color: '#64748b' }}>{banner.subtitle}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: banner.bannerType === 'Hero' ? '#e0f2fe' : '#fef3c7',
                      color: banner.bannerType === 'Hero' ? '#0369a1' : '#b45309'
                    }}>
                      {banner.bannerType} Banner
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#2563eb', fontSize: '12px' }}>
                    <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit' }}>
                      {banner.targetUrl} <ExternalLink size={11} />
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        background: banner.isActive ? '#dcfce7' : '#fee2e2',
                        color: banner.isActive ? '#15803d' : '#b91c1c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {banner.isActive ? <Check size={12} /> : <X size={12} />}
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(banner)}
                        title="Edit Banner"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner.id)}
                        title="Delete Banner"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Create/Edit Banner */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '540px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Banner Type</label>
                <select
                  value={formData.bannerType}
                  onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Hero">Hero Carousel Banner (Homepage Slider)</option>
                  <option value="Promo">Promotional Banner (Offer Sections)</option>
                  <option value="Category">Category Header Banner</option>
                  <option value="Trust">Trust & Rating Banner (Customer Testimonial Slider)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. Featured Machinery & Sprayers"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Subtitle / Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Explore Powerful Farming Equipment at Best Prices"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Banner Image</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Upload image below or paste image URL..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <label style={{ padding: '10px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                {formData.imageUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img
                      src={resolveBannerImage(formData.imageUrl)}
                      alt="Preview"
                      style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Target Click URL</label>
                <input
                  type="text"
                  placeholder="e.g. /categories, /products, or /offers"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                    />
                    Publish / Active
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersList;
