import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit3,
  X,
  Save,
  ChevronUp,
  ChevronDown,
  Boxes,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import '../catalog/adminModule.css';
import './StockUpdates.css';
import { Pagination } from '../components/ActionButtons';
import { fetchCategories } from '../catalog/catalogApi';
import {
  getStockLedger,
  adjustStock,
  addStockEntry,
} from '../api/stock';

/* ─── Mock Data ─────────────────────────────────────────── */
const INITIAL_STOCK = [
  { id: 5, sku: 'SAT-FAR-862', name: 'Cultivator', category: 'Cultivators / Tillers / Weeders', subcategory: 'Tillers', supplier: 'Shyam Agro Tools', currentStock: 45, reorderLevel: 10, unit: 'Units', costPrice: 32000, sellingPrice: 43700, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +15 },
  { id: 6, sku: 'SAT-FAR-400', name: 'Heavy Duty Scythe With 23 Inch Blade', category: 'Special Farm Tools', subcategory: 'Harvesting Tools', supplier: 'Shyam Agro Tools', currentStock: 80, reorderLevel: 20, unit: 'Pcs', costPrice: 850, sellingPrice: 1350, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +25 },
  { id: 7, sku: 'SAT-FAR-565', name: 'Heavy-Duty 6 Tooth Spike Harrow', category: 'Special Farm Tools', subcategory: 'Soil Tools', supplier: 'Shyam Agro Tools', currentStock: 60, reorderLevel: 15, unit: 'Pcs', costPrice: 450, sellingPrice: 795, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'stable', change: 0 },
  { id: 8, sku: 'SAT-FAR-842', name: 'Gramstrong Republic Solar Street Light 120W', category: 'Solar Products', subcategory: 'Solar Lighting', supplier: 'SolarFarm Tech', currentStock: 35, reorderLevel: 10, unit: 'Pcs', costPrice: 2600, sellingPrice: 3995, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +18 },
  { id: 9, sku: 'SAT-FAR-885', name: 'Heavy-Duty Agricultural Impact Sprinkler', category: 'Sprayers', subcategory: 'Irrigation Sprinklers', supplier: 'Shyam Agro Tools', currentStock: 120, reorderLevel: 30, unit: 'Pcs', costPrice: 320, sellingPrice: 523, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +30 },
  { id: 10, sku: 'SAT-FAR-484', name: 'Farmio Grass Cutting Machine', category: 'Garden Tools', subcategory: 'Cutters', supplier: 'Shyam Agro Tools', currentStock: 40, reorderLevel: 10, unit: 'Pcs', costPrice: 890, sellingPrice: 1360, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'stable', change: 0 },
  { id: 12, sku: 'SAT-FAR-829', name: 'Premium Quality Thermal Fogging Machine, 16 Litre', category: 'Fogging Machine', subcategory: 'Foggers', supplier: 'Shyam Agro Tools', currentStock: 18, reorderLevel: 5, unit: 'Units', costPrice: 12000, sellingPrice: 16501, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +10 },
  { id: 14, sku: 'SAT-FAR-382', name: 'Kisankraft KK-STB-050 Grass Stubble Mower', category: 'Special Farm Tools', subcategory: 'Mowers', supplier: 'Kisankraft', currentStock: 12, reorderLevel: 3, unit: 'Units', costPrice: 82000, sellingPrice: 105020, status: 'In Stock', lastUpdated: '2026-07-28', trend: 'up', change: +8 }
];

const STATUSES = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

const statusMeta = {
  'In Stock':    { className: 'stock-badge--in',  icon: CheckCircle2 },
  'Low Stock':   { className: 'stock-badge--low', icon: AlertTriangle },
  'Out of Stock':{ className: 'stock-badge--out', icon: X },
};

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN');
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ─── Stock Badge ─────────────────────────────────────── */
const StockBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta['In Stock'];
  const Icon = meta.icon;
  return (
    <span className={`stock-badge ${meta.className}`}>
      <Icon size={12} />
      {status}
    </span>
  );
};

/* ─── Trend Indicator ────────────────────────────────── */
const TrendIndicator = ({ trend, change }) => {
  if (trend === 'up') return (
    <span className="stock-trend stock-trend--up">
      <ChevronUp size={13} /> +{change}%
    </span>
  );
  if (trend === 'down') return (
    <span className="stock-trend stock-trend--down">
      <ChevronDown size={13} /> {change}%
    </span>
  );
  return <span className="stock-trend stock-trend--stable">— Stable</span>;
};

/* ─── Adjust Modal ───────────────────────────────────── */
const AdjustModal = ({ item: initialItem, products = [], onClose, onSave }) => {
  const [selectedItem, setSelectedItem] = useState(initialItem);
  const [adjustType, setAdjustType] = useState('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  // Search product states
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products.slice(0, 8);
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const reasons = adjustType === 'add'
    ? ['Stock Received', 'Return from Customer', 'Transfer In', 'Correction - Surplus', 'Other']
    : ['Sale / Dispatch', 'Damaged / Spoiled', 'Transfer Out', 'Correction - Deficit', 'Other'];

  const currentStock = selectedItem ? selectedItem.currentStock : 0;
  const unit = selectedItem ? selectedItem.unit : 'Pcs';

  const newQty = adjustType === 'add'
    ? currentStock + Number(qty || 0)
    : Math.max(0, currentStock - Number(qty || 0));

  const handleSave = () => {
    if (!selectedItem || !qty || Number(qty) <= 0) return;
    onSave(selectedItem, {
      actionType: adjustType === 'add' ? 'Add' : 'Remove',
      quantity: Number(qty),
      reason: reason || 'Other',
      note: note || '',
      newQty: newQty
    });
  };

  return (
    <div className="stock-modal-overlay" onClick={onClose}>
      <div className="stock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-modal__header">
          <div>
            <p className="stock-modal__kicker">Stock Ledger Adjustment</p>
            <h2 className="stock-modal__title">{selectedItem ? selectedItem.name : 'Select Product...'}</h2>
            <p className="stock-modal__sku">SKU: {selectedItem ? selectedItem.sku : '—'}</p>
          </div>
          <button className="stock-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="stock-modal__body">
          {/* Product Autocomplete Dropdown */}
          <div className="catalog-field relative">
            <label>Search Product to Adjust</label>
            <div className="relative">
              <input
                type="text"
                placeholder={selectedItem ? `${selectedItem.name} (${selectedItem.sku})` : "Type name or SKU..."}
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full"
              />
              {showProductDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedItem(p);
                        setProductSearch('');
                        setShowProductDropdown(false);
                      }}
                      className="p-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex justify-between"
                    >
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-slate-400">{p.sku}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-2 text-xs text-slate-400 text-center">No products found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Type Toggle */}
          <div className="stock-adj-toggle">
            <button
              className={`stock-adj-btn ${adjustType === 'add' ? 'stock-adj-btn--active-add' : ''}`}
              onClick={() => setAdjustType('add')}
            >
              <ArrowUpCircle size={16} /> Add Stock
            </button>
            <button
              className={`stock-adj-btn ${adjustType === 'remove' ? 'stock-adj-btn--active-remove' : ''}`}
              onClick={() => setAdjustType('remove')}
            >
              <ArrowDownCircle size={16} /> Remove Stock
            </button>
          </div>

          {/* Current → New */}
          <div className="stock-adj-preview">
            <div className="stock-adj-preview__item">
              <span>Current Stock</span>
              <strong>{currentStock} {unit}</strong>
            </div>
            <div className="stock-adj-preview__arrow">
              {adjustType === 'add' ? <TrendingUp size={20} className="adj-icon-add" /> : <TrendingDown size={20} className="adj-icon-remove" />}
            </div>
            <div className="stock-adj-preview__item">
              <span>New Stock</span>
              <strong className={adjustType === 'add' ? 'adj-new--add' : 'adj-new--remove'}>{newQty} {unit}</strong>
            </div>
          </div>

          <div className="stock-modal__fields">
            <div className="catalog-field">
              <label>Quantity ({unit})</label>
              <input
                type="number"
                min="1"
                placeholder="Enter quantity..."
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="catalog-field">
              <label>Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select reason...</option>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="catalog-field catalog-field--full">
              <label>Note (optional)</label>
              <textarea
                rows={2}
                placeholder="Add internal note about this adjustment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ minHeight: 60 }}
              />
            </div>
          </div>
        </div>

        <div className="stock-modal__footer">
          <button className="catalog-btn" onClick={onClose}>Cancel</button>
          <button
            className={`catalog-btn ${adjustType === 'add' ? 'catalog-btn--primary' : 'catalog-btn--remove'}`}
            onClick={handleSave}
            disabled={!selectedItem || !qty || Number(qty) <= 0}
          >
            <Save size={16} />
            Update Adjustment
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Add Entry Modal ─────────────────────────────────── */
const AddEntryModal = ({ categories = [], onClose, onSave }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const handleSave = () => {
    if (!sku || !name || !category || !currentStock || !reorderLevel || !costPrice || !sellingPrice) {
      alert("Please fill in all required fields.");
      return;
    }
    
    const catObj = categories.find(c => (c.name || c) === category);
    const categoryId = catObj ? Number(catObj.id) : null;

    onSave({
      sku: sku.toUpperCase().trim(),
      productName: name.trim(),
      categoryId: categoryId,
      categoryName: category,
      subcategoryName: subcategory.trim() || 'General',
      supplierName: supplier.trim() || 'Unknown',
      initialStockQty: Number(currentStock),
      reorderLevel: Number(reorderLevel),
      stockUnit: unit,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice)
    });
  };

  const generateMockSku = () => {
    const catCode = category ? category.substring(0, 3).toUpperCase() : 'GEN';
    const randNum = Math.floor(100 + Math.random() * 900);
    setSku(`SAT-${catCode}-${randNum}`);
  };

  return (
    <div className="stock-modal-overlay" onClick={onClose}>
      <div className="stock-modal stock-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="stock-modal__header">
          <div>
            <p className="stock-modal__kicker">Inventory Management</p>
            <h2 className="stock-modal__title">Add New Stock Entry</h2>
            <p className="stock-modal__sku">Register a new product SKU into the ledger system</p>
          </div>
          <button className="stock-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="stock-modal__body">
          <div className="stock-modal__form-grid">
            
            {/* Left Column: Product Information */}
            <div className="stock-form-section">
              <h3 className="stock-form-section__title"><Boxes size={15} /> Product Information</h3>
              
              <div className="catalog-field">
                <label>Product Name <span className="field-required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Submersible Motor 2HP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="catalog-field">
                <label>SKU Code <span className="field-required">*</span></label>
                <div className="sku-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. SAT-MOT-054"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                  <button className="sku-gen-btn" onClick={generateMockSku} type="button" title="Generate SKU Code">
                    Generate
                  </button>
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Category <span className="field-required">*</span></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select Category...</option>
                    {categories.map(c => {
                      const name = c.name || c;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>

                <div className="catalog-field">
                  <label>Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Pumps & Motors"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="catalog-field">
                <label>Supplier / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Kirloskar Ltd."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Inventory & Pricing */}
            <div className="stock-form-section">
              <h3 className="stock-form-section__title"><BarChart3 size={15} /> Inventory & Pricing</h3>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Initial Stock Qty <span className="field-required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    required
                  />
                </div>

                <div className="catalog-field">
                  <label>Reorder Level <span className="field-required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Stock Unit <span className="field-required">*</span></label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} required>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Units">Units</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>

                <div className="catalog-field" style={{ opacity: 0, pointerEvents: 'none' }}>
                  <label>Placeholder</label>
                  <input type="text" disabled />
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Cost Price (INR) <span className="field-required">*</span></label>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="catalog-field">
                  <label>Selling Price (INR) <span className="field-required">*</span></label>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <div className="stock-modal__footer">
          <button className="catalog-btn" onClick={onClose}>Cancel</button>
          <button
            className="catalog-btn catalog-btn--primary"
            onClick={handleSave}
          >
            <Plus size={15} />
            Add Entry
          </button>
        </div>
      </div>
    </div>
  );
};

const saveLocalStock = (stock) => {
  localStorage.setItem('shyam_stock_ledger', JSON.stringify(stock));
};

const getLocalStock = () => {
  const local = localStorage.getItem('shyam_stock_ledger');
  return local ? JSON.parse(local) : INITIAL_STOCK;
};

/* ─── Main Screen ────────────────────────────────────── */
const StockUpdates = () => {
  const [items, setItems] = useState([]);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const response = await getStockLedger({ _t: Date.now() });
      if (response && response.items && response.items.length > 0) {
        setItems(response.items);
        setApiMetrics(response.apiMetrics);
        saveLocalStock(response.items);
      } else {
        setItems(getLocalStock());
      }
    } catch (err) {
      console.warn("Failed to fetch stock ledger from API, using localStorage:", err);
      setItems(getLocalStock());
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setApiCategories(cats);
    } catch (err) {
      console.warn("Failed to fetch dynamic categories:", err);
    }
  };

  useEffect(() => {
    loadLedger();
    loadCategories();
  }, []);

  /* ── Metrics ── */
  const metrics = useMemo(() => {
    if (apiMetrics && apiMetrics.inventoryValue) {
      return {
        total: apiMetrics.totalSkus ?? items.length,
        inStock: apiMetrics.inStock ?? items.filter(i => i.status === 'In Stock').length,
        lowStock: apiMetrics.lowStock ?? items.filter(i => i.status === 'Low Stock').length,
        outOfStock: apiMetrics.outOfStock ?? items.filter(i => i.status === 'Out of Stock').length,
        totalValueStr: apiMetrics.inventoryValue
      };
    }
    return {
      total: items.length,
      inStock: items.filter(i => i.status === 'In Stock').length,
      lowStock: items.filter(i => i.status === 'Low Stock').length,
      outOfStock: items.filter(i => i.status === 'Out of Stock').length,
      totalValueNum: items.reduce((s, i) => s + i.currentStock * i.costPrice, 0)
    };
  }, [items, apiMetrics]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      const matchSearch = !q || [i.sku, i.name, i.category, i.supplier].join(' ').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || i.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || i.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  // Extract unique categories from actual items dynamically for the filter dropdown
  const filterCategories = useMemo(() => {
    const list = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [items]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handleSaveAdjust = async (item, adjustmentData) => {
    setLoading(true);
    try {
      await adjustStock(item.id, adjustmentData);
      showNotification('Stock adjusted successfully!', 'success');
      await loadLedger();
    } catch (err) {
      console.warn("Failed to adjust stock on API, falling back to local simulation:", err);
      showNotification('API Offline. Stock adjusted locally.', 'error');
      
      const updatedQty = adjustmentData.newQty;
      const newStatus = updatedQty === 0
        ? 'Out of Stock'
        : updatedQty <= item.reorderLevel
          ? 'Low Stock'
          : 'In Stock';
          
      const updatedItem = {
        ...item,
        currentStock: updatedQty,
        status: newStatus,
        lastUpdated: new Date().toISOString().slice(0, 10)
      };
      
      const newItems = items.map(i => i.id === item.id ? updatedItem : i);
      setItems(newItems);
      saveLocalStock(newItems);
    } finally {
      setLoading(false);
      setAdjustingItem(null);
    }
  };

  const handleSaveAdd = async (newEntry) => {
    setLoading(true);
    try {
      await addStockEntry(newEntry);
      showNotification('New stock entry added successfully!', 'success');
      await loadLedger();
      setShowAddModal(false);
    } catch (err) {
      console.warn("Failed to add stock entry on API, falling back to local simulation:", err);
      showNotification('API Offline. Entry added locally.', 'error');
      
      const simulatedItem = {
        id: items.length ? Math.max(...items.map(i => Number(i.id) || 0)) + 1 : 1,
        sku: newEntry.sku,
        name: newEntry.productName,
        category: newEntry.categoryName || 'General',
        categoryId: newEntry.categoryId || '',
        subcategory: newEntry.subcategoryName,
        supplier: newEntry.supplierName,
        currentStock: newEntry.initialStockQty,
        reorderLevel: newEntry.reorderLevel,
        unit: newEntry.stockUnit,
        costPrice: newEntry.costPrice,
        sellingPrice: newEntry.sellingPrice,
        status: newEntry.initialStockQty === 0
          ? 'Out of Stock'
          : newEntry.initialStockQty <= newEntry.reorderLevel
            ? 'Low Stock'
            : 'In Stock',
        lastUpdated: new Date().toISOString().slice(0, 10),
        trend: 'stable',
        change: 0
      };
      
      const newItems = [...items, simulatedItem];
      setItems(newItems);
      saveLocalStock(newItems);
      setShowAddModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLastRefreshed(new Date());
    await loadLedger();
  };

  const handleExport = () => {
    try {
      const headers = ['SKU / Product ID', 'Product Name', 'Category', 'Quantity', 'Status', 'Last Updated', 'Location'];
      const csvRows = [headers.join(',')];
      
      filtered.forEach(item => {
        const row = [
          `"${item.id || item.product_id || ''}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.category || '').replace(/"/g, '""')}"`,
          item.quantity || 0,
          `"${item.status || ''}"`,
          `"${item.lastUpdated || ''}"`,
          `"${(item.location || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Export successful!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showNotification('Failed to export stock ledger', 'error');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="stock-page" style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', 
          backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', 
            color: '#166534', fontWeight: 600, background: 'white', 
            padding: '12px 24px', borderRadius: '8px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
          }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Refreshing Stock Ledger...
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {notification && (
        <div className={`stock-notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}
      {/* ── Header ── */}
      <section className="catalog-header stock-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Inventory</span>
          <h1>Stock Ledger</h1>
          <p className="catalog-card__subtitle" style={{ margin: 0, fontSize: '12px' }}>
            {metrics.total} SKUs tracked &nbsp;·&nbsp;
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="stock-header-actions">
          <button className="catalog-btn stock-refresh-btn" onClick={handleRefresh} title="Refresh" disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1.5s linear infinite' } : {}} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="catalog-btn" onClick={handleExport} title="Export stock report">
            <Download size={14} />
            <span>Export</span>
          </button>
          <button className="catalog-btn" onClick={() => setAdjustingItem(items[0] || null)} title="Adjust Stock Ledger">
            <TrendingUp size={14} />
            <span>Adjust Stock</span>
          </button>
          <button className="catalog-btn catalog-btn--primary" onClick={() => setShowAddModal(true)} title="Add new stock entry">
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>
      </section>

      {/* ── KPI Cards (Smaller) ── */}
      <div className="stock-metrics-grid" style={{ gap: '10px' }}>
        <div className="stock-metric-card stock-metric-card--blue" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <Boxes size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Total SKUs</span>
            <strong style={{ fontSize: '18px' }}>{metrics.total}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--green" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>In Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.inStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--amber" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Low Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.lowStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--red" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <Package size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Out of Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.outOfStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--indigo" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <BarChart3 size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Inventory Value</span>
            <strong style={{ fontSize: '18px' }}>{metrics.totalValueStr ? metrics.totalValueStr : `₹${formatNumber(metrics.totalValueNum)}`}</strong>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <section className="catalog-card">
        <div className="catalog-card__header">
          <div>
            <h2>Ledger Entries</h2>
            <p className="catalog-card__subtitle">
              {filtered.length} products match filters
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="catalog-filterbar">
          <div className="catalog-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by SKU, product name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="stock-filters-right">
            <label className="catalog-filter">
              <Filter size={15} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {filterCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </label>
            <label className="catalog-filter">
              <ClipboardList size={15} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="catalog-table-wrap">
          <table className="catalog-table stock-table">
            <thead>
              <tr style={{ fontSize: '11px' }}>
                <th style={{ width: '24%', padding: '10px 12px' }}>Product / SKU</th>
                <th style={{ width: '13%', padding: '10px 12px' }}>Category</th>
                <th style={{ width: '13%', padding: '10px 12px' }}>Supplier</th>
                <th className="catalog-number-cell" style={{ width: '10%', padding: '10px 12px' }}>Current Stock</th>
                <th className="catalog-number-cell" style={{ width: '9%', padding: '10px 12px' }}>Reorder Level</th>
                <th className="catalog-number-cell" style={{ width: '11%', padding: '10px 12px' }}>Cost Price (₹)</th>
                <th className="catalog-number-cell" style={{ width: '11%', padding: '10px 12px' }}>Selling Price (₹)</th>
                <th style={{ width: '12%', padding: '10px 12px', textAlign: 'center' }}>Last Updated</th>
                <th className="catalog-center-cell" style={{ width: '7%', padding: '10px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => {
                const isOutOfStock = Number(item.currentStock) === 0;
                const isLowStock = !isOutOfStock && Number(item.currentStock) <= Number(item.reorderLevel);
                const costVal = item.costPrice > 0 && item.sellingPrice > 0 ? Math.min(item.costPrice, item.sellingPrice) : item.costPrice;
                const sellVal = item.costPrice > 0 && item.sellingPrice > 0 ? Math.max(item.costPrice, item.sellingPrice) : item.sellingPrice;
                
                return (
                <tr 
                  key={item.id} 
                  className={
                    isOutOfStock
                      ? 'stock-row--alert' 
                      : isLowStock
                        ? 'stock-row--warning' 
                        : 'stock-row--success'
                  }
                  style={{ fontSize: '12px' }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px', color: '#64748b' }}>{item.sku} &nbsp;·&nbsp; {item.unit}</div>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600 }}>{item.category}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>{item.subcategory}</div>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: '#334155' }}>{item.supplier}</td>
                  <td className="catalog-number-cell" style={{ padding: '8px 12px' }}>
                    <span className={`stock-qty ${isOutOfStock ? 'stock-qty--zero' : isLowStock ? 'stock-qty--low' : 'stock-qty--ok'}`}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="catalog-number-cell" style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#475569' }}>
                    {item.reorderLevel}
                  </td>
                  <td className="catalog-number-cell" style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0f172a' }}>
                    ₹{costVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="catalog-number-cell" style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#047857' }}>
                    ₹{sellVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <div className="catalog-table__muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{item.lastUpdated}</div>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '8px 12px' }}>
                    <button
                      className="catalog-btn catalog-btn--icon stock-adjust-btn"
                      title="Adjust stock"
                      onClick={() => setAdjustingItem(item)}
                      style={{ padding: '5px 8px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                  </td>
                </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan="9">
                    <div className="orders-empty">No products match the current filters.</div>
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
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </section>

      {/* ── Adjust Modal ── */}
      {adjustingItem && (
        <AdjustModal
          item={adjustingItem}
          products={items}
          onClose={() => setAdjustingItem(null)}
          onSave={handleSaveAdjust}
        />
      )}

      {/* ── Add Entry Modal ── */}
      {showAddModal && (
        <AddEntryModal
          categories={apiCategories.length > 0 ? apiCategories : filterCategories.filter(c => c !== 'All').map(c => ({ name: c }))}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAdd}
        />
      )}
    </div>
  );
};

export default StockUpdates;
