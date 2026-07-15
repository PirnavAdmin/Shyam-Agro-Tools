import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  PackagePlus,
  Plus,
  Save,
  Star,
  Tractor,
  Trash2,
  Upload,
  X,
  Eye,
} from 'lucide-react';
import {
  getCategoryName,
  getSubcategoryName,
} from './catalogStore';
import { fetchCategories, fetchSubcategories, fetchProduct, saveProduct as saveProductApi } from './productsApi';
import { fetchSuppliers } from '../suppliers/suppliersApi';
import { Toast } from '../components/Toast';
import './adminModule.css';
import './ProductsForm.css';

const createReview = () => ({
  customer: '',
  rating: '5',
  date: '',
  comment: '',
  verified: true,
});

const createEmptyProduct = () => ({
  id: '',
  name: '',
  sku: '',
  brand: '',
  supplier: '',
  categoryId: '',
  subcategoryId: '',
  mrp: '',
  price: '',
  discountType: 'none',
  discountValue: '',
  stock: '',
  status: 'In Stock',
  countryOfOrigin: 'India',
  codAvailable: 'Yes',
  deliveryEstimate: '3-7 business days',
  returnPolicy: 'Easy Returns',
  shortDescription: '',
  description: '',
  productDetails: '',
  packageIncludes: '',
  specifications: {
    weight: '',
    dimensions: '',
    powerSource: '',
    material: '',
    coverage: '',
  },
  keyFeatures: [''],
  rating: '',
  totalReviews: '',
  ratingBreakdown: {
    5: '',
    4: '',
    3: '',
    2: '',
    1: '',
  },
  reviews: [createReview(), createReview()],
  image: '',
});

const normalizeList = (list, minimumRows, factoryValue = '') => {
  const values = Array.isArray(list) && list.length ? list : [];
  const normalized = values.map((item) => (typeof item === 'string' ? item : String(item || '')));

  while (normalized.length < minimumRows) {
    normalized.push(factoryValue);
  }

  return normalized;
};

const normalizeReviews = (reviews) => {
  const normalized = Array.isArray(reviews) && reviews.length ? reviews : [createReview(), createReview()];

  return normalized.map((review) => ({
    ...createReview(),
    ...review,
    rating: String(review.rating || 5),
    verified: review.verified !== false,
  }));
};

const normalizeProduct = (product) => {
  const emptyProduct = createEmptyProduct();
  const specifications = {
    ...emptyProduct.specifications,
    ...(product.specifications || {}),
    weight: product.specifications?.weight || product.weight || '',
  };

  return {
    ...emptyProduct,
    ...product,
    mrp: String(product.mrp || product.price || ''),
    price: String(product.price || ''),
    discountType: product.discountType || 'none',
    discountValue: String(product.discountValue || ''),
    stock: String(product.stock || ''),
    rating: String(product.rating || ''),
    totalReviews: String(product.totalReviews || ''),
    shortDescription: product.shortDescription || product.shortDesc || product.description || '',
    productDetails: product.productDetails || product.longDesc || product.description || '',
    specifications,
    keyFeatures: normalizeList(product.keyFeatures || product.features, 1),
    ratingBreakdown: {
      ...emptyProduct.ratingBreakdown,
      ...(product.ratingBreakdown || {}),
    },
    reviews: normalizeReviews(product.reviews),
  };
};

const calculateSellingPrice = (mrp, discountType, discountValue) => {
  const basePrice = Math.max(Number(mrp) || 0, 0);
  const enteredDiscount = Math.max(Number(discountValue) || 0, 0);

  if (!basePrice || discountType === 'none') {
    return basePrice;
  }

  const discountAmount =
    discountType === 'percentage'
      ? Math.min(basePrice, (basePrice * Math.min(enteredDiscount, 100)) / 100)
      : Math.min(basePrice, enteredDiscount);

  return Math.round(basePrice - discountAmount);
};

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;






const ProductsForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const categoryIdFromQuery = searchParams.get('categoryId');
  const subcategoryIdFromQuery = searchParams.get('subcategoryId');

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);

  const [formData, setFormData] = useState({
    ...createEmptyProduct(),
    categoryId: categoryIdFromQuery || '',
    subcategoryId: subcategoryIdFromQuery || '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const isEditing = Boolean(productId);

  const generateMockSku = () => {
    const cat = categories.find(c => String(c.id) === String(formData.categoryId));
    const catCode = cat ? cat.name.substring(0, 3).toUpperCase() : 'GEN';
    const randNum = Math.floor(100 + Math.random() * 900);
    setFormData((current) => ({ ...current, sku: `SAT-${catCode}-${randNum}` }));
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchCategories(),
      fetchSubcategories(),
      fetch('https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Brand', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }).then(res => res.json()).catch(() => []),
      fetchSuppliers().catch(() => [])
    ]).then(([cats, subcats, brands, suppliers]) => {
      if (!isMounted) return;
      setCategories(cats);
      setSubcategories(subcats);
      setBrandsList(Array.isArray(brands) ? brands : []);
      setSuppliersList(Array.isArray(suppliers) ? suppliers : []);
      setFormData((current) => ({
        ...current,
        categoryId: current.categoryId || '',
        subcategoryId: current.subcategoryId || '',
        brand: current.brand || '',
        supplier: current.supplier || '',
      }));
      setIsLoadingTaxonomy(false);
    }).catch(() => {
      if (isMounted) setIsLoadingTaxonomy(false);
    });
    return () => { isMounted = false; };
  }, []);

  const availableSubcategories = useMemo(
    () => subcategories.filter((subcategory) => String(subcategory.categoryId) === String(formData.categoryId)),
    [formData.categoryId, subcategories]
  );

  const sellingPrice = useMemo(
    () => calculateSellingPrice(formData.mrp, formData.discountType, formData.discountValue),
    [formData.discountType, formData.discountValue, formData.mrp]
  );

  const discountSummary = useMemo(() => {
    const mrp = Number(formData.mrp) || 0;
    if (!mrp || formData.discountType === 'none' || !Number(formData.discountValue)) return 'No active discount';

    const savedAmount = mrp - sellingPrice;
    const percentOff = Math.round((savedAmount / mrp) * 100);

    return `${formatCurrency(savedAmount)} saved (${percentOff}% off)`;
  }, [formData.discountType, formData.discountValue, formData.mrp, sellingPrice]);

  useEffect(() => {
    if (!productId) return;

    let isMounted = true;
    setIsLoadingProduct(true);
    setToast(null);

    fetchProduct(productId, categories, subcategories)
      .then((product) => {
        if (!isMounted) return;
        setFormData(normalizeProduct(product));
      })
      .catch((error) => {
        if (!isMounted) return;
        setToast({ message: error.response?.data?.message || error.message || 'Unable to load product details.', type: 'error' });
      })
      .finally(() => {
        if (isMounted) setIsLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categories, productId, subcategories]);

  useEffect(() => {
    if (!formData.categoryId) {
      setFormData((current) => {
        if (current.subcategoryId === '') return current;
        return { ...current, subcategoryId: '' };
      });
      return;
    }
    const hasSelectedSubcategory = availableSubcategories.some(
      (subcategory) => String(subcategory.id) === String(formData.subcategoryId)
    );

    if (!hasSelectedSubcategory) {
      setFormData((current) => {
        if (current.subcategoryId === '') return current;
        return { ...current, subcategoryId: '' };
      });
    }
  }, [availableSubcategories, formData.categoryId, formData.subcategoryId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSpecificationChange = (name, value) => {
    setFormData((current) => ({
      ...current,
      specifications: {
        ...current.specifications,
        [name]: value,
      },
    }));
  };

  const handleRatingBreakdownChange = (rating, value) => {
    setFormData((current) => ({
      ...current,
      ratingBreakdown: {
        ...current.ratingBreakdown,
        [rating]: value,
      },
    }));
  };

  const handleFeatureChange = (index, value) => {
    setFormData((current) => ({
      ...current,
      keyFeatures: current.keyFeatures.map((feature, featureIndex) =>
        featureIndex === index ? value : feature
      ),
    }));
  };

  const addFeature = () => {
    setFormData((current) => ({
      ...current,
      keyFeatures: [...current.keyFeatures, ''],
    }));
  };

  const removeFeature = (index) => {
    setFormData((current) => ({
      ...current,
      keyFeatures: current.keyFeatures.filter((_, featureIndex) => featureIndex !== index),
    }));
  };

  const handleReviewChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      reviews: current.reviews.map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, [field]: value } : review
      ),
    }));
  };

  const addReview = () => {
    setFormData((current) => ({
      ...current,
      reviews: [...current.reviews, createReview()],
    }));
  };

  const removeReview = (index) => {
    setFormData((current) => ({
      ...current,
      reviews: current.reviews.filter((_, reviewIndex) => reviewIndex !== index),
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    
    const validFiles = files.filter(f => f.size <= 25 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Some images were too large. Please select images under 25MB.");
    }
    if (!validFiles.length) return;

    const currentExistingCount = formData.images?.length || 0;
    const currentNewCount = imageFiles.length;
    const allowedNewCount = 7 - (currentExistingCount + currentNewCount);

    if (allowedNewCount <= 0) {
      alert("Maximum limit of 7 images has already been reached.");
      return;
    }

    const addedFiles = validFiles.slice(0, allowedNewCount);
    const updatedNewFiles = [...imageFiles, ...addedFiles];
    setImageFiles(updatedNewFiles);

    // Update main preview image:
    if (!formData.image && updatedNewFiles.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((current) => ({ ...current, image: reader.result }));
      };
      reader.readAsDataURL(updatedNewFiles[0]);
    }
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setFormData((current) => {
      const updatedImages = (current.images || []).filter((_, idx) => idx !== indexToRemove);
      let nextMainImage = current.image;
      if (current.image === current.images[indexToRemove]) {
        nextMainImage = updatedImages[0] || '';
      }
      if (!nextMainImage && imageFiles.length > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(imageFiles[0]);
      }
      return {
        ...current,
        images: updatedImages,
        image: nextMainImage
      };
    });
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setImageFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (indexToRemove === 0 && (!formData.images || formData.images.length === 0)) {
        if (updated.length > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(current => ({ ...current, image: reader.result }));
          };
          reader.readAsDataURL(updated[0]);
        } else {
          setFormData(current => ({ ...current, image: '' }));
        }
      }
      return updated;
    });
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Video file is too large. Please select a video under 25MB.");
      return;
    }

    setVideoFile(file);
    setFormData((current) => ({ ...current, videoPreview: URL.createObjectURL(file) }));
  };

  const validateForm = () => {
    if (!formData.categoryId) {
      setToast({ message: 'Category is required. Please select a category.', type: 'warning' });
      return false;
    }
    if (!formData.subcategoryId) {
      setToast({ message: 'Subcategory is required. Please select a subcategory.', type: 'warning' });
      return false;
    }
    if (!formData.name || !formData.name.trim()) {
      setToast({ message: 'Product Name is required.', type: 'warning' });
      return false;
    }
    if (!formData.sku || !formData.sku.trim()) {
      setToast({ message: 'SKU / Item Code is required.', type: 'warning' });
      return false;
    }
    if (!formData.brand) {
      setToast({ message: 'Brand is required. Please select a brand.', type: 'warning' });
      return false;
    }
    if (!formData.supplier) {
      setToast({ message: 'Manufacturer / Supplier is required. Please select a supplier.', type: 'warning' });
      return false;
    }
    if (!formData.shortDescription || !formData.shortDescription.trim()) {
      setToast({ message: 'Short Description is required.', type: 'warning' });
      return false;
    }
    if (!formData.productDetails || !formData.productDetails.trim()) {
      setToast({ message: 'Product Details is required.', type: 'warning' });
      return false;
    }

    const mrpValue = Number(formData.mrp);
    if (isNaN(mrpValue) || mrpValue <= 0) {
      setToast({ message: 'MRP / Base Price must be a positive number greater than 0.', type: 'warning' });
      return false;
    }

    const stockValue = Number(formData.stock);
    if (isNaN(stockValue) || stockValue < 0) {
      setToast({ message: 'Stock must be a non-negative number.', type: 'warning' });
      return false;
    }

    const totalImagesCount = (formData.images?.length || 0) + imageFiles.length;
    if (totalImagesCount < 4) {
      setToast({ message: 'Minimum 4 images are required.', type: 'warning' });
      return false;
    }
    if (totalImagesCount > 7) {
      setToast({ message: 'Maximum 7 images are allowed.', type: 'warning' });
      return false;
    }

    return true;
  };

  const saveProduct = async () => {
    if (!validateForm()) {
      return null;
    }

    const preparedProduct = {
      ...formData,
      price: sellingPrice,
      mrp: Number(formData.mrp) || sellingPrice,
      discountValue: Number(formData.discountValue) || 0,
      rating: Number(formData.rating) || 0,
      totalReviews: Number(formData.totalReviews) || 0,
      stock: Number(formData.stock) || 0,
      shortDesc: formData.shortDescription,
      longDesc: formData.productDetails,
      description: formData.shortDescription,
      weight: formData.specifications.weight,
      keyFeatures: formData.keyFeatures.filter((feature) => feature.trim()),
      reviews: formData.reviews.filter((review) => review.customer || review.comment),
      ratingBreakdown: Object.fromEntries(
        Object.entries(formData.ratingBreakdown).map(([rating, value]) => [rating, Number(value) || 0])
      ),
    };

    setIsSaving(true);
    setToast(null);

    try {
      const savedProduct = await saveProductApi(preparedProduct, imageFiles, videoFile);

      setFormData(normalizeProduct(savedProduct));
      setImageFiles([]);
      setVideoFile(null);
      setIsSaved(true);
      setToast({ message: `Product ${isEditing ? 'updated' : 'saved'} successfully!`, type: 'success' });
      setTimeout(() => {
        setIsSaved(false);
        navigate('/admin/catalog/products');
      }, 1500);
      return savedProduct;
    } catch (error) {
      console.error("API Error Response:", error.response?.data);
      let msg = error.response?.data?.title || error.response?.data?.message || error.message || 'Unable to save product.';
      if (error.response?.data?.errors) {
        if (typeof error.response.data.errors === 'object') {
           const errList = Object.entries(error.response.data.errors).map(([k, v]) => `${k}: ${v}`).join(' | ');
           if (errList) msg = errList;
        }
      }
      setToast({ message: msg, type: 'error' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveProduct();
  };

  if (isLoadingTaxonomy) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <PackagePlus size={34} />
          <h3>Loading Taxonomy</h3>
          <p>Please wait while categories are loaded from the API.</p>
        </section>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <PackagePlus size={34} />
          <h3>Create a category first</h3>
          <p>Products need a category and subcategory. Start by creating your main category.</p>
          <Link to="/admin/catalog/category" className="catalog-btn catalog-btn--primary">
            Create Category
          </Link>
        </section>
      </div>
    );
  }

  if (!subcategories.length) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <PackagePlus size={34} />
          <h3>Create a subcategory first</h3>
          <p>Products must be assigned to a subcategory. Create one under your selected category before adding products.</p>
          <Link to="/admin/catalog/subcategory" className="catalog-btn catalog-btn--primary">
            Create Subcategory
          </Link>
        </section>
      </div>
    );
  }

  if (isLoadingProduct) {
    return (
      <div className="catalog-page">
        <section className="catalog-empty-state">
          <PackagePlus size={34} />
          <h3>Loading product details</h3>
          <p>Please wait while the product information is loaded from the API.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="catalog-page product-form-page">
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Step 3 of 3</span>
          <h1>{isEditing ? 'Edit Product' : 'Create Product'}</h1>
          <p>Add the product information shown on the customer product page, including discounts, specs, features, and rating summary.</p>
        </div>

        <div className="catalog-header__actions">
          <Link to="/admin/catalog/products" className="catalog-btn">
            <ArrowLeft size={16} /> Products List
          </Link>
          <button type="button" className="catalog-btn catalog-btn--primary" onClick={() => navigate('/admin/catalog/products')}>
            View Products
          </button>
        </div>
      </section>

      <form className="catalog-form" onSubmit={handleSubmit}>
        <div className="catalog-side-grid product-form-layout">
          <div className="catalog-stack">
            <section className="catalog-card" style={{ padding: '20px' }}>
              <div className="catalog-form-grid" style={{ gap: '12px' }}>
                <div className="catalog-field">
                  <label htmlFor="product-category" style={{ fontSize: '12px', fontWeight: '600' }}>Category</label>
                  <select
                    id="product-category"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-subcategory" style={{ fontSize: '12px', fontWeight: '600' }}>Subcategory</label>
                  <select
                    id="product-subcategory"
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleInputChange}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {!availableSubcategories.length && formData.categoryId && (
                    <small style={{ fontSize: '11px', color: '#ef4444' }}>No subcategories found for this category. Add a subcategory first.</small>
                  )}
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-name" style={{ fontSize: '12px', fontWeight: '600' }}>Product Name</label>
                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Drip Pipes"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    required
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-sku" style={{ fontSize: '12px', fontWeight: '600' }}>SKU / Item Code</label>
                  <div className="sku-input-wrap">
                    <input
                      id="product-sku"
                      name="sku"
                      type="text"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="AG-DRIP-P8"
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                      required
                    />
                    <button className="sku-gen-btn" onClick={generateMockSku} type="button" title="Generate SKU Code" style={{ padding: '6px 10px', fontSize: '12px' }}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-brand" style={{ fontSize: '12px', fontWeight: '600' }}>Brand</label>
                  <select
                    id="product-brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="">Select Brand</option>
                    {brandsList.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Link to="/admin/brands/form" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>+ Add Brand</Link>
                  </div>
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-supplier" style={{ fontSize: '12px', fontWeight: '600' }}>Manufacturer / Supplier</label>
                  <select
                    id="product-supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliersList.map((supplier) => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Link to="/admin/suppliers/add" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>+ Add Supplier</Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="catalog-card" style={{ padding: '20px' }}>
              <div className="catalog-field">
                <label htmlFor="product-short-description" style={{ fontSize: '12px', fontWeight: '600' }}>Short Description</label>
                <textarea
                  id="product-short-description"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Durable drip irrigation pipe roll for efficient water delivery across crop rows."
                  style={{ padding: '6px 10px', fontSize: '13px', minHeight: '60px' }}
                  required
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="product-details" style={{ fontSize: '12px', fontWeight: '600' }}>Product Details</label>
                <textarea
                  id="product-details"
                  name="productDetails"
                  value={formData.productDetails}
                  onChange={handleInputChange}
                  placeholder="Built for long runs and consistent water flow, this product helps reduce water waste while improving targeted irrigation."
                  style={{ padding: '6px 10px', fontSize: '13px', minHeight: '60px' }}
                  required
                />
              </div>

              <div className="catalog-field">
                <label htmlFor="package-includes" style={{ fontSize: '12px', fontWeight: '600' }}>Package Includes</label>
                <textarea
                  id="package-includes"
                  name="packageIncludes"
                  value={formData.packageIncludes}
                  onChange={handleInputChange}
                  placeholder="Main unit, fittings, user manual, warranty card"
                  style={{ padding: '6px 10px', fontSize: '13px', minHeight: '60px' }}
                />
              </div>
            </section>

            <section className="catalog-card">
              <div className="product-section-heading">
                <h2>Specifications</h2>
                <p>Shown as specification tiles on the product page.</p>
              </div>

              <div className="catalog-form-grid product-spec-grid">
                <div className="catalog-field">
                  <label htmlFor="spec-weight">Weight</label>
                  <input
                    id="spec-weight"
                    type="text"
                    value={formData.specifications.weight}
                    onChange={(event) => handleSpecificationChange('weight', event.target.value)}
                    placeholder="Approx. 18 kg per coil"
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="spec-dimensions">Dimensions</label>
                  <input
                    id="spec-dimensions"
                    type="text"
                    value={formData.specifications.dimensions}
                    onChange={(event) => handleSpecificationChange('dimensions', event.target.value)}
                    placeholder="16mm pipe, 500m roll"
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="spec-power-source">Power Source</label>
                  <input
                    id="spec-power-source"
                    type="text"
                    value={formData.specifications.powerSource}
                    onChange={(event) => handleSpecificationChange('powerSource', event.target.value)}
                    placeholder="Water pressure, electric motor, or pump"
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="spec-material">Material</label>
                  <input
                    id="spec-material"
                    type="text"
                    value={formData.specifications.material}
                    onChange={(event) => handleSpecificationChange('material', event.target.value)}
                    placeholder="UV-stabilized LLDPE"
                  />
                </div>

                <div className="catalog-field catalog-field--full">
                  <label htmlFor="spec-coverage">Coverage / Usage</label>
                  <input
                    id="spec-coverage"
                    type="text"
                    value={formData.specifications.coverage}
                    onChange={(event) => handleSpecificationChange('coverage', event.target.value)}
                    placeholder="Row crops, gardens, orchards, greenhouse setups"
                  />
                </div>
              </div>
            </section>

            <section className="catalog-card">
              <div className="product-section-heading product-section-heading--inline">
                <div>
                  <h2>Key Features</h2>
                  <p>Use short benefit-led points. These appear as a two-column feature list.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isEditing && (
                    <Link
                      to={`/admin/catalog/product-features?productId=${productId}&name=${encodeURIComponent(formData.name || 'Product')}`}
                      className="catalog-btn"
                      style={{ fontSize: '13px' }}
                    >
                      Manage Features
                    </Link>
                  )}
                  <button type="button" className="catalog-btn" onClick={addFeature}>
                    <Plus size={15} /> Add Feature
                  </button>
                </div>
              </div>

              <div className="product-feature-list">
                {formData.keyFeatures.map((feature, index) => (
                  <div className="product-repeat-row" key={index}>
                    <input
                      type="text"
                      value={feature}
                      onChange={(event) => handleFeatureChange(index, event.target.value)}
                      placeholder="Efficient water distribution for farm irrigation"
                    />
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--danger"
                      onClick={() => removeFeature(index)}
                      disabled={formData.keyFeatures.length <= 1}
                      title="Remove feature"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="catalog-card">
              <div className="product-section-heading">
                <h2>Reviews & Ratings</h2>
                <p>These fields are optional. Use them for seed data or highlighted verified reviews; actual customer reviews can still come from users later.</p>
              </div>

              <div className="catalog-form-grid product-rating-grid">
                <div className="catalog-field">
                  <label htmlFor="average-rating">Average Rating</label>
                  <input
                    id="average-rating"
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="4.6"
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="total-reviews">Total Reviews</label>
                  <input
                    id="total-reviews"
                    name="totalReviews"
                    type="number"
                    min="0"
                    value={formData.totalReviews}
                    onChange={handleInputChange}
                    placeholder="16"
                  />
                </div>
              </div>

              <div className="product-rating-breakdown">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div className="catalog-field" key={rating}>
                    <label htmlFor={`rating-${rating}`}>
                      {rating} <Star size={12} fill="currentColor" />
                    </label>
                    <input
                      id={`rating-${rating}`}
                      type="number"
                      min="0"
                      value={formData.ratingBreakdown[rating]}
                      onChange={(event) => handleRatingBreakdownChange(rating, event.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="product-section-heading product-section-heading--inline product-review-heading">
                <div>
                  <h3>Featured Reviews</h3>
                  <p>Add only reviews you want shown prominently on the product page.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isEditing && (
                    <Link
                      to={`/admin/catalog/product-reviews?productId=${productId}&name=${encodeURIComponent(formData.name || 'Product')}`}
                      className="catalog-btn"
                      style={{ fontSize: '13px' }}
                    >
                      Manage Reviews
                    </Link>
                  )}
                  <button type="button" className="catalog-btn" onClick={addReview}>
                    <Plus size={15} /> Add Review
                  </button>
                </div>
              </div>

              <div className="product-review-list">
                {formData.reviews.map((review, index) => (
                  <div className="product-review-editor" key={index}>
                    <div className="catalog-form-grid product-review-grid">
                      <div className="catalog-field">
                        <label htmlFor={`review-customer-${index}`}>Customer Name</label>
                        <input
                          id={`review-customer-${index}`}
                          type="text"
                          value={review.customer}
                          onChange={(event) => handleReviewChange(index, 'customer', event.target.value)}
                          placeholder="Ramesh Babu"
                        />
                      </div>

                      <div className="catalog-field">
                        <label htmlFor={`review-rating-${index}`}>Rating</label>
                        <select
                          id={`review-rating-${index}`}
                          value={review.rating}
                          onChange={(event) => handleReviewChange(index, 'rating', event.target.value)}
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>

                      <div className="catalog-field">
                        <label htmlFor={`review-date-${index}`}>Review Date</label>
                        <input
                          id={`review-date-${index}`}
                          type="month"
                          value={review.date}
                          onChange={(event) => handleReviewChange(index, 'date', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="catalog-field">
                      <label htmlFor={`review-comment-${index}`}>Review Comment</label>
                      <textarea
                        id={`review-comment-${index}`}
                        value={review.comment}
                        onChange={(event) => handleReviewChange(index, 'comment', event.target.value)}
                        placeholder="Good build quality and useful for regular agricultural work."
                      />
                    </div>

                    <div className="product-review-actions">
                      <label className="product-checkbox">
                        <input
                          type="checkbox"
                          checked={review.verified}
                          onChange={(event) => handleReviewChange(index, 'verified', event.target.checked)}
                        />
                        Verified purchase
                      </label>
                      <button
                        type="button"
                        className="catalog-btn catalog-btn--danger"
                        onClick={() => removeReview(index)}
                        disabled={formData.reviews.length <= 1}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="catalog-stack product-sticky-panel">
            <section className="catalog-subpanel">
              <h3>Inventory & Pricing</h3>
              <div className="catalog-form-grid product-compact-grid">
                <div className="catalog-field">
                  <label htmlFor="product-mrp">MRP / Base Price</label>
                  <input
                    id="product-mrp"
                    name="mrp"
                    type="number"
                    min="0"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="product-stock">Stock</label>
                  <input
                    id="product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="catalog-field">
                <label htmlFor="discount-type">Discount Type</label>
                <select id="discount-type" name="discountType" value={formData.discountType} onChange={handleInputChange}>
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              <div className="catalog-field">
                <label htmlFor="discount-value">
                  {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                </label>
                <input
                  id="discount-value"
                  name="discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  disabled={formData.discountType === 'none'}
                  placeholder={formData.discountType === 'percentage' ? '29' : '500'}
                />
              </div>

              <div className="product-price-preview">
                <span>Selling Price</span>
                <strong>{formatCurrency(sellingPrice)}</strong>
                <p>{discountSummary}</p>
              </div>

              <div className="catalog-field">
                <label htmlFor="product-status">Stock Status</label>
                <select id="product-status" name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </section>

            <section className="catalog-subpanel">
              <h3>Delivery & Trust</h3>
              <div className="catalog-field">
                <label htmlFor="country-origin">Country of Origin</label>
                <input
                  id="country-origin"
                  name="countryOfOrigin"
                  type="text"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                  placeholder="India"
                />
              </div>
              <div className="catalog-field">
                <label htmlFor="cod-available">COD Availability</label>
                <select id="cod-available" name="codAvailable" value={formData.codAvailable} onChange={handleInputChange}>
                  <option value="Yes">COD Available</option>
                  <option value="No">COD Not Available</option>
                </select>
              </div>
              <div className="catalog-field">
                <label htmlFor="delivery-estimate">Estimated Delivery</label>
                <input
                  id="delivery-estimate"
                  name="deliveryEstimate"
                  type="text"
                  value={formData.deliveryEstimate}
                  onChange={handleInputChange}
                  placeholder="3-7 business days"
                />
              </div>
              <div className="catalog-field">
                <label htmlFor="return-policy">Delivery & Return</label>
                <input
                  id="return-policy"
                  name="returnPolicy"
                  type="text"
                  value={formData.returnPolicy}
                  onChange={handleInputChange}
                  placeholder="Easy Returns"
                />
              </div>
            </section>

            <section className="catalog-subpanel">
              <h3>Product Media</h3>
              
              {/* Display existing and new images in a unified grid */}
              {((formData.images && formData.images.length > 0) || imageFiles.length > 0) && (
                <div className="product-media-preview-container" style={{ marginBottom: '14px' }}>
                  <div className="product-media-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    
                    {/* Render saved existing images */}
                    {formData.images && formData.images.map((url, idx) => (
                      <div key={`existing-${idx}`} className="product-media-thumb-wrap" style={{ position: 'relative', width: '65px', height: '65px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={url} alt="saved preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveExistingImage(idx);
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Remove image"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {/* Render newly added local images */}
                    {imageFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="product-media-thumb-wrap" style={{ position: 'relative', width: '65px', height: '65px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={URL.createObjectURL(file)} alt="new preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveNewImage(idx);
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Remove image"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="catalog-btn"
                      style={{ fontSize: '11px', padding: '4px 8px', minHeight: 'auto', flex: 1 }}
                      onClick={() => setShowImagePreview(true)}
                    >
                      <Eye size={12} /> Preview Large
                    </button>
                  </div>
                </div>
              )}

              {/* Upload trigger box (only shown if total images < 7) */}
              {((formData.images?.length || 0) + imageFiles.length) < 7 ? (
                <label className="catalog-upload" htmlFor="product-images" style={{ cursor: 'pointer' }}>
                  <span className="catalog-upload__box" style={{ height: '60px', width: '60px' }}>
                    <Upload size={18} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong>Upload Images ({((formData.images?.length || 0) + imageFiles.length)}/7)</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Select 4 to 7 images.</span>
                  </span>
                  <input 
                    id="product-images" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageChange} 
                  />
                </label>
              ) : (
                <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                  Maximum limit of 7 images reached. Remove some to add others.
                </div>
              )}

              <label className="catalog-upload" htmlFor="product-video" style={{ marginTop: '12px', cursor: 'pointer' }}>
                <span className="catalog-upload__box" style={{ height: '180px' }}>
                  {formData.videoPreview ? (
                    <video src={formData.videoPreview} controls style={{ width: '100%', height: '100%' }} />
                  ) : formData.video ? (
                    <video src={formData.video} controls style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Upload size={24} />
                  )}
                </span>
                <span>
                  <strong>Upload Video (MP4)</strong>
                </span>
                <input id="product-video" type="file" accept="video/mp4" onChange={handleVideoChange} />
              </label>
            </section>

            <div className="product-assurance">
              <Tractor size={20} />
              <div>
                <strong>Customer Page Coverage</strong>
                <p>Pricing, specs, features, details, delivery, and ratings are now captured for the product details view.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="catalog-actions product-form-actions" style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
          <button type="submit" className="catalog-btn catalog-btn--primary" disabled={isSaving} style={{ padding: '8px 16px', fontSize: '13px' }}>
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Product'}
          </button>
          <button type="button" className="catalog-btn" onClick={() => navigate('/admin/catalog/products')} style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', borderRadius: '6px' }}>
            Cancel
          </button>
        </div>
      </form>

      {showImagePreview && (
        <div className="catalog-modal-overlay" onClick={() => setShowImagePreview(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="catalog-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="catalog-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Image Previews ({((formData.images?.length || 0) + imageFiles.length)})</h3>
              <button onClick={() => setShowImagePreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="catalog-modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {formData.images && formData.images.map((url, idx) => (
                <div key={`modal-existing-${idx}`} style={{ position: 'relative' }}>
                  <img src={url} alt="saved preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                  <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Saved Image</span>
                </div>
              ))}
              {imageFiles.map((file, idx) => (
                <div key={`modal-new-${idx}`} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(file)} alt="new preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                  <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(38, 54, 182, 0.8)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>New Upload</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProductsForm;
