import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Layers, Save, Upload } from 'lucide-react';
import { slugify } from './catalogStore';
import { fetchCategory, saveCategory as saveCategoryApi } from './catalogApi';
import { Toast } from '../components/Toast';
import './adminModule.css';

const emptyCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  status: 'Active',
  displayOrder: '',
  metaTitle: '',
  metaDescription: '',
  image: '',
  imageFile: null,
};

const Category = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');
  const [formData, setFormData] = useState(emptyCategory);
  const [isLoading, setIsLoading] = useState(Boolean(categoryId));
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const isEditing = Boolean(categoryId);

  useEffect(() => {
    if (!categoryId) return;
    let isMounted = true;

    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const existingCategory = await fetchCategory(categoryId);
        if (!isMounted) return;
        setFormData({
          ...emptyCategory,
          ...existingCategory,
          displayOrder: String(existingCategory.displayOrder || ''),
          imageFile: null,
        });
      } catch (apiError) {
        setToast({ message: apiError.message || 'Unable to load category.', type: 'error' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategory();
    return () => { isMounted = false; };
  }, [categoryId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      slug: name === 'name' && !isEditing ? slugify(value) : current.slug,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((current) => ({ ...current, image: reader.result, imageFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Category Name is required!', type: 'error' });
      return false;
    }
    if (!formData.slug.trim()) {
      setToast({ message: 'URL Slug is required!', type: 'error' });
      return false;
    }
    if (!formData.description.trim()) {
      setToast({ message: 'Description is required!', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const saved = await saveCategoryApi({
        ...formData,
        slug: formData.slug || slugify(formData.name),
        metaTitle: formData.metaTitle || `${formData.name} | Shyam Agro Tools`,
        metaDescription: formData.metaDescription || formData.description,
      });
      if (saved) {
        setToast({ message: 'Category saved successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/admin/catalog/categories');
        }, 1500);
      }
    } catch (apiError) {
      setToast({ message: apiError.message || 'Failed to save category.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="catalog-page" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <section className="catalog-header" style={{ padding: '16px 20px', marginBottom: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Catalog Management</span>
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{isEditing ? 'Edit Category' : 'Create Category'}</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Define details for the catalog category group.</p>
        </div>
        <div className="catalog-header__actions" style={{ gap: '8px' }}>
          <Link to="/admin/catalog/categories" className="catalog-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <ArrowLeft size={14} /> Categories List
          </Link>
          <button type="button" className="catalog-btn catalog-btn--primary" onClick={handleSave} disabled={isSaving} style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </section>

      <section className="catalog-card" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', padding: '20px' }}>
        {isLoading ? (
          <div className="catalog-center-cell" style={{ padding: '32px' }}>Loading category...</div>
        ) : (
          <form className="catalog-form" onSubmit={handleSave} style={{ gap: '16px' }}>
            <div className="catalog-form-grid" style={{ gap: '16px' }}>
              <div className="catalog-field">
                <label htmlFor="category-name" style={{ fontSize: '12px', fontWeight: '600' }}>Category Name</label>
                <input id="category-name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="e.g. Farm Tools & Machinery" style={{ padding: '6px 10px', fontSize: '13px' }} required />
              </div>
              <div className="catalog-field">
                <label htmlFor="category-slug" style={{ fontSize: '12px', fontWeight: '600' }}>URL Slug</label>
                <input id="category-slug" name="slug" type="text" value={formData.slug} onChange={handleInputChange} placeholder="farm-tools-machinery" style={{ padding: '6px 10px', fontSize: '13px' }} required />
              </div>
            </div>

            <div className="catalog-form-grid catalog-form-grid--three" style={{ gap: '16px' }}>
              <div className="catalog-field">
                <label htmlFor="category-order" style={{ fontSize: '12px', fontWeight: '600' }}>Display Order</label>
                <input id="category-order" name="displayOrder" type="number" min="1" value={formData.displayOrder} onChange={handleInputChange} placeholder="1" style={{ padding: '6px 10px', fontSize: '13px' }} />
              </div>
              <div className="catalog-field">
                <label htmlFor="category-status" style={{ fontSize: '12px', fontWeight: '600' }}>Status</label>
                <select id="category-status" name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '13px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="catalog-field">
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Category Image</label>
                <label className="catalog-upload" htmlFor="category-image" style={{ padding: '8px', gap: '10px' }}>
                  <span className="catalog-upload__box" style={{ width: '48px', height: '48px' }}>
                    {formData.image ? <img src={formData.image} alt="" /> : <Upload size={18} />}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong style={{ fontSize: '12px' }}>Upload Image</strong>
                    <span style={{ fontSize: '10px' }}>Square image is recommended.</span>
                  </span>
                  <input id="category-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="catalog-field">
              <label htmlFor="category-description" style={{ fontSize: '12px', fontWeight: '600' }}>Description</label>
              <textarea id="category-description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe what products belong to this category." style={{ padding: '8px 10px', fontSize: '13px', minHeight: '80px' }} required />
            </div>

            <div className="catalog-subpanel" style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={14} /> Search Metadata</h3>
              <div className="catalog-form-grid" style={{ gap: '16px' }}>
                <div className="catalog-field">
                  <label htmlFor="category-meta-title" style={{ fontSize: '12px', fontWeight: '600' }}>Meta Title</label>
                  <input id="category-meta-title" name="metaTitle" type="text" value={formData.metaTitle} onChange={handleInputChange} placeholder="Category page title" style={{ padding: '6px 10px', fontSize: '13px' }} />
                </div>
                <div className="catalog-field">
                  <label htmlFor="category-meta-description" style={{ fontSize: '12px', fontWeight: '600' }}>Meta Description</label>
                  <input id="category-meta-description" name="metaDescription" type="text" value={formData.metaDescription} onChange={handleInputChange} placeholder="Short search description" style={{ padding: '6px 10px', fontSize: '13px' }} />
                </div>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default Category;
