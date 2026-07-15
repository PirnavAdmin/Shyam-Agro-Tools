import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Tags } from 'lucide-react';
import { slugify } from './catalogStore';
import { fetchCategories, fetchSubcategory, saveSubcategory as saveSubcategoryApi } from './catalogApi';
import { Toast } from '../components/Toast';
import './adminModule.css';

const emptySubcategory = {
  id: '',
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  status: 'Active',
  displayOrder: '',
  image: '',
  imageFile: null,
};

const SubcategoryForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subcategoryId = searchParams.get('id');
  const preselectedCategoryId = searchParams.get('categoryId');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    ...emptySubcategory,
    categoryId: preselectedCategoryId || '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const isEditing = Boolean(subcategoryId);

  useEffect(() => {
    let isMounted = true;

    const loadFormData = async () => {
      try {
        setIsLoading(true);
        const [loadedCategories, existingSubcategory] = await Promise.all([
          fetchCategories(),
          subcategoryId ? fetchSubcategory(subcategoryId) : Promise.resolve(null),
        ]);

        if (!isMounted) return;
        setCategories(loadedCategories);
        setFormData((current) => ({
          ...emptySubcategory,
          ...current,
          ...(existingSubcategory || {}),
          categoryId: existingSubcategory?.categoryId || preselectedCategoryId || loadedCategories[0]?.id || '',
          displayOrder: existingSubcategory ? String(existingSubcategory.displayOrder || '') : current.displayOrder,
          imageFile: null,
        }));
      } catch (apiError) {
        setToast({ message: apiError.message || 'Unable to load form data.', type: 'error' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFormData();
    return () => { isMounted = false; };
  }, [preselectedCategoryId, subcategoryId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      slug: name === 'name' && !isEditing ? slugify(value) : current.slug,
    }));
  };

  const validate = () => {
    if (!formData.categoryId) {
      setToast({ message: 'Parent Category is required!', type: 'error' });
      return false;
    }
    if (!formData.name.trim()) {
      setToast({ message: 'Subcategory Name is required!', type: 'error' });
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
      const saved = await saveSubcategoryApi({
        ...formData,
        slug: formData.slug || slugify(formData.name),
      });

      if (saved) {
        setToast({ message: 'Subcategory saved successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/admin/catalog/subcategories');
        }, 1500);
      }
    } catch (apiError) {
      setToast({ message: apiError.message || 'Unable to save subcategory.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && !categories.length) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <Tags size={34} />
          <h3>Create a category first</h3>
          <p>Subcategories must belong to a category. Add a category, then come back to add subcategories under it.</p>
          <Link to="/admin/catalog/category" className="catalog-btn catalog-btn--primary">
            <Plus size={16} /> Add Category
          </Link>
        </section>
      </div>
    );
  }

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
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{isEditing ? 'Edit Subcategory' : 'Create Subcategory'}</h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Attach subcategories under a parent category.</p>
        </div>

        <div className="catalog-header__actions" style={{ gap: '8px' }}>
          <Link to="/admin/catalog/subcategories" className="catalog-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <ArrowLeft size={14} /> Subcategories List
          </Link>
          <button type="button" className="catalog-btn catalog-btn--primary" onClick={handleSave} disabled={isSaving} style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Plus size={14} /> {isSaving ? 'Saving...' : 'Save & Add Product'}
          </button>
        </div>
      </section>

      <section className="catalog-card" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', padding: '20px' }}>
        {isLoading ? (
          <div className="catalog-center-cell" style={{ padding: '32px' }}>Loading subcategory...</div>
        ) : (
        <form className="catalog-form" onSubmit={handleSave} style={{ gap: '16px' }}>
          
          <div className="catalog-form-grid" style={{ gap: '16px' }}>
            <div className="catalog-field">
              <label htmlFor="subcategory-category" style={{ fontSize: '12px', fontWeight: '600' }}>Parent Category</label>
              <select
                id="subcategory-category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                style={{ padding: '6px 10px', fontSize: '13px' }}
                required
              >
                <option value="">Select Parent Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="catalog-field">
              <label htmlFor="subcategory-name" style={{ fontSize: '12px', fontWeight: '600' }}>Subcategory Name</label>
              <input
                id="subcategory-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Power Tillers"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          <div className="catalog-form-grid catalog-form-grid--three" style={{ gap: '16px' }}>
            <div className="catalog-field">
              <label htmlFor="subcategory-slug" style={{ fontSize: '12px', fontWeight: '600' }}>URL Slug</label>
              <input
                id="subcategory-slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="power-tillers"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                required
              />
            </div>

            <div className="catalog-field">
              <label htmlFor="subcategory-order" style={{ fontSize: '12px', fontWeight: '600' }}>Display Order</label>
              <input
                id="subcategory-order"
                name="displayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={handleInputChange}
                placeholder="1"
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
            </div>

            <div className="catalog-field">
              <label htmlFor="subcategory-status" style={{ fontSize: '12px', fontWeight: '600' }}>Status</label>
              <select id="subcategory-status" name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '6px 10px', fontSize: '13px' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="catalog-field">
            <label htmlFor="subcategory-description" style={{ fontSize: '12px', fontWeight: '600' }}>Description</label>
            <textarea
              id="subcategory-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe this product group."
              style={{ padding: '8px 10px', fontSize: '13px', minHeight: '80px' }}
              required
            />
          </div>
        </form>
        )}
      </section>
    </div>
  );
};

export default SubcategoryForm;
