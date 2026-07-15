import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Image as ImageIcon, Tag } from 'lucide-react';

import './brands.css';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

// Inline API utilities
const API_BASE = 'http://shyamagrotools.com/api/Brand';
const API_DOMAIN = 'http://shyamagrotools.com';
const API_ITEM = (id) => `http://shyamagrotools.com/api/Brand/${encodeURIComponent(id)}`;

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

export const deleteBrand = async (id) => {
  // Try primary Brand API (/api/Brand/{id})
  try {
    const res = await fetch(API_ITEM(id), {
      method: 'DELETE',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (res.ok) return true;
    console.warn(`Primary delete brand API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to delete using primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands/{id})
  const res = await fetch(`${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Delete brand failed: ${res.status} ${err}`);
  }
  return true;
};

const BrandsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBrands();
        setBrands(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the brand "${name}"?`)) {
      try {
        await deleteBrand(id);
        setBrands(prev => prev.filter(b => b.id !== id));
        setToastMessage(`Brand "${name}" deleted successfully.`);
        setToastType('success');
      } catch (e) {
        setToastMessage(`Failed to delete brand: ${e.message}`);
        setToastType('error');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/brands/form?id=${id}`);
  };

  const filteredBrands = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return brands.filter(brand => 
      String(brand.name || '').toLowerCase().includes(query) ||
      String(brand.id || '').toLowerCase().includes(query)
    );
  }, [brands, searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const pagedBrands = filteredBrands.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="brands-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Compact Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <span className="catalog-kicker" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#059669', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Catalog settings</span>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Brands Directory</h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Manage manufacturers and brands assigned to products.</p>
        </div>
        <div>
          <Link to="/admin/brands/form" className="catalog-btn catalog-btn--primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
            <Plus size={14} style={{ marginRight: '4px' }} /> Add Brand
          </Link>
        </div>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="brands-toolbar" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <div className="brands-search" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search brands by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '6px 10px 6px 32px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
          />
        </div>
        <span className="brands-count" style={{ fontSize: '11px', color: '#64748b', marginLeft: '12px' }}>
          {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'}
        </span>
      </div>

      {/* Cards Grid */}
      {loading && <div className="catalog-alert">Loading brands...</div>}
      {error && <div className="catalog-alert catalog-alert--warning">{error}</div>}
      
      {!loading && !error && filteredBrands.length === 0 && (
        <div className="brands-empty-state" style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <Tag size={40} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>No brands found</h3>
          <p style={{ fontSize: '11px', color: '#64748b' }}>{searchTerm ? "We couldn't find any brands matching your search." : "There are no brands registered in the catalog yet."}</p>
          {!searchTerm && (
            <Link to="/admin/brands/form" className="catalog-btn catalog-btn--primary" style={{ marginTop: '12px', display: 'inline-flex' }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add Your First Brand
            </Link>
          )}
        </div>
      )}

      {!loading && !error && filteredBrands.length > 0 && (
        <section className="catalog-card" style={{ padding: '16px', margin: 0 }}>
          <div className="brands-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {pagedBrands.map((brand) => (
              <div className="brand-card" key={brand.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', height: '170px', transition: 'all 0.2s' }}>
                <div className="brand-card__content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                  <div className="brand-card__logo-frame" style={{ width: '48px', height: '48px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <BrandLogo logo={brand.logo} name={brand.name} />
                  </div>
                  <span className="brand-card__id" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{brand.id}</span>
                  <h3 className="brand-card__name" style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{brand.name}</h3>
                </div>
                
                <div className="brand-card__actions" style={{ borderTop: '1px solid #f1f5f9', padding: '6px 12px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                  <AnimatedEditButton onClick={() => handleEdit(brand.id)} title="Edit Brand" />
                  <OutlookDeleteButton onClick={() => handleDelete(brand.id, brand.name)} title="Delete Brand" />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBrands.length}
            itemsPerPage={itemsPerPage}
          />
        </section>
      )}
    </div>
  );
};

export default BrandsList;
