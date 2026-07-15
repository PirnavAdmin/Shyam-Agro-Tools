import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import './brands.css';
import { Toast } from '../components/Toast';

// Inline API utilities
const API_BASE = 'https://shyamagrotools.com/api/Brand';
const API_DOMAIN = 'https://shyamagrotools.com';
const API_ITEM = (id) => `https://shyamagrotools.com/api/Brand/${encodeURIComponent(id)}`;

// Normalize brand object: map any possible image field name to `logo`
const normalizeBrand = (b) => {
  if (!b) return {};
  return {
    ...b,
    id: b.id !== undefined && b.id !== null ? String(b.id) : '',
    name: b.name || b.Name || b.brandName || b.BrandName || '',
    description: b.description || b.Description || '',
    logo: b.LogoImage || b.logoImage || b.logo || b.logoUrl || b.imageUrl || b.image || b.logoURL || b.ImageUrl || b.Logo || b.LogoUrl || '',
  };
};

// Resolve logo value to a valid <img src> regardless of what format the API returns
export const getLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:')) return logo;
  if (/^https?:\/\//i.test(logo)) return logo;
  if (logo.startsWith('/') || logo.includes('.') || logo.includes('/')) {
    const path = logo.startsWith('/') ? logo : `/${logo}`;
    return `${API_DOMAIN}${path}`;
  }
  return `data:image/png;base64,${logo}`;
};

// State-managed BrandLogo component to robustly handle load errors without DOM traversal
export const BrandLogo = ({ logo, name }) => {
  const [error, setError] = useState(false);
  const src = getLogoSrc(logo);

  if (!logo || error || !src) {
    return (
      <div className="brand-card__logo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <ImageIcon size={24} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      onError={() => setError(true)}
    />
  );
};

export const fetchBrands = async () => {
  // Try primary Brand API (/api/Brand)
  try {
    const res = await fetch(API_BASE, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeBrand) : [];
    }
    console.warn(`Primary brand fetch API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to fetch from primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands)
  try {
    const res = await fetch(`${API_DOMAIN}/api/Catalog/brands`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Fallback fetch brands failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeBrand) : [];
  } catch (e) {
    console.error('All brand fetch APIs failed:', e);
    throw e;
  }
};

export const createBrand = async (brand) => {
  const fd = new FormData();
  fd.append('Id', brand.id);
  fd.append('id', brand.id);
  fd.append('Name', brand.name);
  fd.append('Description', brand.description || '');
  fd.append('IsActive', 'true');
  fd.append('isActive', 'true');
  
  if (brand.logoFile) {
    fd.append('LogoFile', brand.logoFile);
  } else if (brand.logo) {
    fd.append('LogoImage', brand.logo);
  }

  // Try primary Brand API (/api/Brand)
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: fd,
    });
    if (res.ok) return await res.json();
    console.warn(`Primary create brand API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to post to primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands)
  const res = await fetch(`${API_DOMAIN}/api/Catalog/brands`, {
    method: 'POST',
    headers: { 'ngrok-skip-browser-warning': 'true' },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create brand failed: ${res.status} ${err}`);
  }
  return await res.json();
};

export const updateBrand = async (brand) => {
  const fd = new FormData();
  fd.append('Id', brand.id);
  fd.append('id', brand.id);
  fd.append('Name', brand.name);
  fd.append('Description', brand.description || '');
  fd.append('IsActive', 'true');
  fd.append('isActive', 'true');
  
  if (brand.logoFile) {
    fd.append('LogoFile', brand.logoFile);
  } else if (brand.logo) {
    fd.append('LogoImage', brand.logo);
  } else {
    fd.append('LogoImage', '');
  }

  // Try primary Brand API (/api/Brand/{id})
  try {
    const res = await fetch(API_ITEM(brand.id), {
      method: 'PUT',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: fd,
    });
    if (res.ok) return { success: true };
    console.warn(`Primary update brand API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to put to primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands/{id})
  const res = await fetch(`${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(brand.id)}`, {
    method: 'PUT',
    headers: { 'ngrok-skip-browser-warning': 'true' },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update brand failed: ${res.status} ${err}`);
  }
  return { success: true };
};

const BrandForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const brandIdFromQuery = searchParams.get('id');
  const isEditing = Boolean(brandIdFromQuery);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  // Auto‑generate ID on mount if in create mode
  useEffect(() => {
    const load = async () => {
      try {
        const brands = await fetchBrands();
        if (isEditing) {
          const existing = brands.find(b => String(b.id || '').toLowerCase() === String(brandIdFromQuery).toLowerCase());
          if (existing) {
            setId(existing.id);
            setName(existing.name);
            setDescription(existing.description || '');
            setLogo(existing.logo || '');
            setLogoFile(null);
          } else {
            setToastMessage('Brand not found.');
            setToastType('error');
          }
        } else {
          // Auto‑generate next ID based on fetched brands
          const nextNum = brands.reduce((largest, b) => {
            const match = String(b.id || '').match(/(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              return num > largest ? num : largest;
            }
            return largest;
          }, 0) + 1;

          // Check if any existing brand is purely numeric
          const isNumericId = brands.length > 0 && brands.every(b => /^\d+$/.test(String(b.id)));
          if (isNumericId) {
            setId(String(nextNum));
          } else {
            setId(`BRD-${String(nextNum).padStart(3, '0')}`);
          }
          setLogoFile(null);
        }
      } catch (e) {
        setToastMessage(e.message);
        setToastType('error');
      }
    };
    load();
  }, [isEditing, brandIdFromQuery]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToastMessage('Image size must be less than 2MB.');
      setToastType('warning');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLogo('');
    setLogoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToastMessage('Brand Name is required.');
      setToastType('warning');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateBrand({ id: id.trim(), name: name.trim(), description: description.trim(), logo, logoFile });
      } else {
        await createBrand({ id: id.trim(), name: name.trim(), description: description.trim(), logo, logoFile });
      }
      setToastMessage('Brand saved successfully!');
      setToastType('success');
      setTimeout(() => {
        navigate('/admin/brands/list');
      }, 1000);
    } catch (err) {
      setToastMessage(err.message || 'Failed to save brand details.');
      setToastType('error');
      setIsSaving(false);
    }
  };

  return (
    <div className="brands-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Row with Actions in Top-Right */}
      <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" to="/admin/brands/list">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Catalog settings</span>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{isEditing ? 'Edit Brand' : 'Create Brand'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/brands/list" className="catalog-btn" style={{ fontSize: '11px', padding: '6px 12px' }}>
            Cancel
          </Link>
          <button className="catalog-btn catalog-btn--primary" onClick={handleSubmit} disabled={isSaving} style={{ fontSize: '11px', padding: '6px 12px' }}>
            <Save size={14} style={{ marginRight: '4px' }} />
            Save Brand
          </button>
        </div>
      </section>

      <div className="brand-form-container" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <div className="brand-form-card" style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
          <form onSubmit={handleSubmit} className="brand-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Section Title with custom color */}
            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', margin: '0 0 4px 0' }}>
              Brand Information
            </h3>

            {/* Brand ID Field */}
            <div className="brand-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="brand-id" style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Brand ID</label>
              <input
                id="brand-id"
                type="text"
                value={id}
                onChange={(e) => !isEditing && setId(e.target.value)}
                placeholder="e.g. BRD-001"
                disabled={isEditing}
                required
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: isEditing ? '#f8fafc' : '#fff' }}
              />
            </div>

            {/* Brand Name Field */}
            <div className="brand-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="brand-name" style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Brand Name</label>
              <input
                id="brand-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shyam Agro Tools"
                required
                autoFocus
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            {/* Brand Description Field */}
            <div className="brand-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="brand-desc" style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Description</label>
              <textarea
                id="brand-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief information about manufacturer..."
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none' }}
              />
            </div>

            {/* Brand Logo Upload Field */}
            <div className="brand-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Brand Logo</label>
              
              {logo ? (
                <div className="brand-image-preview" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                  <div className="brand-image-preview__box" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <BrandLogo logo={logo} name="Preview" />
                  </div>
                  <div className="brand-image-preview__actions">
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--danger"
                      onClick={handleRemoveLogo}
                      style={{ fontSize: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="brand-image-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '2.5px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.15s' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div className="brand-image-upload__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                    <Upload size={18} style={{ color: '#059669' }} />
                    <span style={{ fontSize: '11px', color: '#475569' }}><strong>Click to upload logo</strong></span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>PNG, JPG, SVG up to 2MB</span>
                  </div>
                </label>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandForm;
