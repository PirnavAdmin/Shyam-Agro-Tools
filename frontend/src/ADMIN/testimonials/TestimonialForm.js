import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import '../catalog/adminModule.css';
import { Toast } from '../components/Toast';

const API_BASE = 'http://shyamagrotools.com/api/Testimonials';

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

const emptyForm = {
  name: '',
  role: '',
  text: '',
};

const TestimonialForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testimonialId = searchParams.get('id');
  const isEditing = Boolean(testimonialId);

  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [existingRecord, setExistingRecord] = useState(null);

  // Load testimonial from API if editing
  useEffect(() => {
    if (!testimonialId) return;
    setLoading(true);
    fetch(`${API_BASE}/${testimonialId}`, {
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server returned code: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setExistingRecord(data);
        setFormData({
          name: data.name || '',
          role: data.role || '',
          text: data.text || '',
        });
        setImagePreview(data.imageUrl || data.image || '');
      })
      .catch(err => {
        console.error(err);
        setToastMessage('Error loading testimonial data from API.');
        setToastType('error');
      })
      .finally(() => setLoading(false));
  }, [testimonialId]);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Convert image to base64 for submission
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToastMessage('Image size should be less than 2MB.');
      setToastType('warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Form submit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      setToastMessage('Client Name is required.');
      setToastType('warning');
      return;
    }
    if (!formData.role.trim()) {
      setToastMessage('Client Role/Designation is required.');
      setToastType('warning');
      return;
    }
    if (!formData.text.trim()) {
      setToastMessage('Review Text is required.');
      setToastType('warning');
      return;
    }

    setSaving(true);
    setToastMessage('');

    try {
      const payload = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        text: formData.text.trim(),
        imageUrl: imagePreview || 'https://randomuser.me/api/portraits/lego/1.jpg',
        rating: existingRecord?.rating ?? 5,
        isActive: existingRecord?.isActive ?? true,
        sortOrder: existingRecord?.sortOrder ?? 1,
      };

      const url = isEditing ? `${API_BASE}/${testimonialId}` : API_BASE;
      const method = isEditing ? 'PUT' : 'POST';

      if (isEditing) {
        payload.id = parseInt(testimonialId, 10);
      }

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || `Request failed with code ${res.status}`);
      }

      setToastMessage(`Testimonial ${isEditing ? 'updated' : 'saved'} successfully!`);
      setToastType('success');

      setTimeout(() => {
        navigate('/admin/testimonials/list');
      }, 1000);
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to save testimonial. Please try again.');
      setToastType('error');
      setSaving(false);
    }
  };

  return (
    <div className="catalog-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <section className="catalog-header" style={{ margin: 0 }}>
        <div className="catalog-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/admin/testimonials/list" className="catalog-btn-back" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 style={{ margin: 0 }}>{isEditing ? 'Edit Testimonial' : 'Add Testimonial'}</h1>
              <p style={{ margin: 0 }}>{isEditing ? 'Modify client details and feedback text' : 'Add client review cards to display'}</p>
            </div>
          </div>
        </div>

        <div className="catalog-header__actions">
          <button className="catalog-btn catalog-btn--primary" onClick={handleSubmit} disabled={saving || loading}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Testimonial'}
          </button>
        </div>
      </section>

      {/* Form Content */}
      <div className="catalog-form-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <section className="catalog-card" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Loading testimonial details...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Profile Image upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Client Profile Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #22c55e' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      No Image
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="catalog-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <Upload size={14} /> Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Recommended: Square portrait image, up to 2MB</span>
                  </div>
                </div>
              </div>

              {/* Client Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="name" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Client Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Rajesh Kumar"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Client Role / Designation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="role" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Designation / Role</label>
                <input
                  id="role"
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g., Professional Farmer"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Testimonial / Review Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="text" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Review / Testimonial Text</label>
                <textarea
                  id="text"
                  name="text"
                  rows="5"
                  value={formData.text}
                  onChange={handleChange}
                  placeholder="Enter the quotation or feedback from the client..."
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                ></textarea>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default TestimonialForm;
