import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon, ExternalLink, RotateCcw } from 'lucide-react';
import { createBanner, updateBanner, uploadBannerImage, fetchAdminBanners } from './bannersApi';
import '../catalog/adminModule.css';

const BannerForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bannerId = searchParams.get('id');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    targetUrl: '/categories',
    bannerType: 'Hero',
    isActive: true,
    displayOrder: 1
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (bannerId) {
      setIsLoading(true);
      fetchAdminBanners()
        .then(banners => {
          const found = banners.find(b => String(b.id) === String(bannerId));
          if (found) {
            setFormData({
              title: found.title || '',
              subtitle: found.subtitle || '',
              imageUrl: found.imageUrl || '',
              targetUrl: found.targetUrl || '/categories',
              bannerType: found.bannerType || 'Hero',
              isActive: found.isActive,
              displayOrder: found.displayOrder || 1
            });
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [bannerId]);

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadBannerImage(file);
      if (res && res.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
        setMsg({ text: 'Banner image uploaded successfully!', type: 'success' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setMsg({ text: 'Failed to upload image. You can also paste image URL.', type: 'error' });
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

    setIsSaving(true);
    try {
      if (bannerId) {
        await updateBanner(bannerId, formData);
        setMsg({ text: 'Banner updated successfully!', type: 'success' });
      } else {
        await createBanner(formData);
        setMsg({ text: 'New Banner created successfully!', type: 'success' });
      }
      setTimeout(() => {
        navigate('/admin/marketing/banners');
      }, 1200);
    } catch (err) {
      console.error('Failed to save banner:', err);
      setMsg({ text: 'Failed to save banner. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="catalog-spread" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/admin/marketing/banners" style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {bannerId ? `Edit Banner #${bannerId}` : 'Create New Banner'}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
            Configure hero sliders and promotional banner settings
          </p>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '13px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#15803d' : '#b91c1c'
        }}>
          {msg.type === 'success' ? '✓ ' : '⚠ '}{msg.text}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading banner details...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Banner Type</label>
            <select
              value={formData.bannerType}
              onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="Hero">Hero Carousel Banner (Homepage Slider)</option>
              <option value="Promo">Promotional Banner (Offer Sections)</option>
              <option value="Category">Category Header Banner</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Banner Title</label>
            <input
              type="text"
              placeholder="e.g. Featured Machinery & Sprayers"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Subtitle / Description</label>
            <input
              type="text"
              placeholder="e.g. Powerful Performance & Better Farming"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Banner Image</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Image URL or upload file..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <label style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                <Upload size={14} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            {formData.imageUrl && (
              <div style={{ marginTop: '12px', textAlign: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <img
                  src={formData.imageUrl}
                  alt="Banner Preview"
                  style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Click URL</label>
            <input
              type="text"
              placeholder="e.g. /categories, /products, or /offers"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '22px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
                />
                Publish / Active Status
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/admin/marketing/banners"
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BannerForm;
