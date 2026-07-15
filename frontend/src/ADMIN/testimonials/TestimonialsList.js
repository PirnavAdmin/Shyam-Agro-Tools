import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, MessageSquare, RefreshCw } from 'lucide-react';
import '../catalog/adminModule.css';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';

const API_BASE = 'https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Testimonials';

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const TestimonialsList = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load testimonials from backend API
  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`Server returned code: ${res.status}`);
      const data = await res.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading testimonials from API', e);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  // Delete testimonial from API
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial permanently?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert('Failed to delete testimonial: ' + e.message);
    }
  };

  // Filter based on search
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      const q = searchTerm.toLowerCase();
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        (t.text || '').toLowerCase().includes(q)
      );
    });
  }, [testimonials, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
  const pagedTestimonials = filteredTestimonials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="catalog-page">
      {/* Header */}
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <h1>Testimonials</h1>
          <p>Manage customer reviews and client statements shown on the frontend home page.</p>
        </div>

        <div className="catalog-header__actions">
          <button className="catalog-btn" onClick={loadTestimonials} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/admin/testimonials/add" className="catalog-btn catalog-btn--primary">
            <Plus size={16} /> Add Testimonial
          </Link>
        </div>
      </section>

      {/* Table Card */}
      <section className="catalog-card">
        <div className="catalog-filterbar">
          <div className="catalog-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by client name, designation or review content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="catalog-count">
            {loading ? 'Loading…' : `${filteredTestimonials.length} testimonial${filteredTestimonials.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Client Details</th>
                <th>Designation / Role</th>
                <th>Review Snippet</th>
                <th className="catalog-center-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="catalog-center-cell" style={{ padding: '48px 0', color: '#94a3b8' }}>
                    <RefreshCw size={20} className="spin" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    Loading testimonials from server...
                  </td>
                </tr>
              ) : filteredTestimonials.length > 0 ? (
                pagedTestimonials.map((t) => (
                  <tr key={t.id} style={{ fontSize: '12px' }}>
                    {/* Client Name & Image */}
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {(t.imageUrl || t.image) ? (
                          <img
                            src={t.imageUrl || t.image}
                            alt={t.name}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                            <User size={16} color="#94a3b8" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                            {t.name || 'Anonymous'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role / Designation */}
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                        {t.role || 'Client'}
                      </span>
                    </td>

                    {/* Review Snippet */}
                    <td style={{ padding: '8px', color: '#475569', maxWidth: 400 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <MessageSquare size={13} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}>
                          {t.text || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '8px' }}>
                      <div className="catalog-inline-actions" style={{ justifyContent: 'center' }}>
                        <AnimatedEditButton
                          to={`/admin/testimonials/add?id=${t.id}`}
                          title="Edit testimonial"
                        />
                        <OutlookDeleteButton
                          onClick={() => handleDelete(t.id)}
                          title="Delete testimonial"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="catalog-center-cell" style={{ padding: '32px 0', color: '#94a3b8', fontSize: '12px' }}>
                    {searchTerm ? 'No testimonials match your search.' : 'No testimonials found. Add your first testimonial!'}
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
          totalItems={filteredTestimonials.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default TestimonialsList;
