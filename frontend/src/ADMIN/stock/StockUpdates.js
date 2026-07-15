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
  { id: 1, sku: 'SAT-DRP-001', name: 'Drip Irrigation Kit (1 Acre)', category: 'Irrigation Systems', subcategory: 'Drip Systems', supplier: 'AquaFlow Pvt Ltd', currentStock: 142, reorderLevel: 50, unit: 'Sets', costPrice: 3200, sellingPrice: 4500, status: 'In Stock', lastUpdated: '2026-06-28', trend: 'up', change: +18 },
  { id: 2, sku: 'SAT-SPR-004', name: 'Sprinkler Nozzle Set (10 pcs)', category: 'Irrigation Systems', subcategory: 'Sprinkler Systems', supplier: 'AquaFlow Pvt Ltd', currentStock: 8, reorderLevel: 30, unit: 'Sets', costPrice: 480, sellingPrice: 750, status: 'Low Stock', lastUpdated: '2026-06-28', trend: 'down', change: -22 },
  { id: 3, sku: 'SAT-HRV-002', name: 'Manual Reaper Binder', category: 'Harvesting Tools', subcategory: 'Manual Tools', supplier: 'Agri Implements Co.', currentStock: 0, reorderLevel: 20, unit: 'Pcs', costPrice: 1200, sellingPrice: 1850, status: 'Out of Stock', lastUpdated: '2026-06-27', trend: 'down', change: -100 },
  { id: 4, sku: 'SAT-FRT-007', name: 'NPK Fertilizer Spreader', category: 'Fertilizer Equipment', subcategory: 'Spreaders', supplier: 'GreenGrow Solutions', currentStock: 65, reorderLevel: 25, unit: 'Pcs', costPrice: 2800, sellingPrice: 4200, status: 'In Stock', lastUpdated: '2026-06-29', trend: 'up', change: +12 },
  { id: 5, sku: 'SAT-PMP-003', name: 'Submersible Water Pump (1HP)', category: 'Pumps & Motors', subcategory: 'Submersible Pumps', supplier: 'HydroTech India', currentStock: 34, reorderLevel: 15, unit: 'Pcs', costPrice: 5600, sellingPrice: 8200, status: 'In Stock', lastUpdated: '2026-06-28', trend: 'stable', change: 0 },
  { id: 6, sku: 'SAT-PES-012', name: 'Backpack Sprayer (16L)', category: 'Pesticide Equipment', subcategory: 'Sprayers', supplier: 'CropShield Ltd', currentStock: 12, reorderLevel: 25, unit: 'Pcs', costPrice: 1450, sellingPrice: 2100, status: 'Low Stock', lastUpdated: '2026-06-26', trend: 'down', change: -38 },
  { id: 7, sku: 'SAT-SOL-009', name: 'Solar Fence Controller', category: 'Solar Equipment', subcategory: 'Fence Systems', supplier: 'SolarFarm Tech', currentStock: 89, reorderLevel: 20, unit: 'Pcs', costPrice: 3800, sellingPrice: 5500, status: 'In Stock', lastUpdated: '2026-06-29', trend: 'up', change: +45 },
  { id: 8, sku: 'SAT-SED-005', name: 'Seed Drill Machine (5 Row)', category: 'Seeding Equipment', subcategory: 'Seed Drills', supplier: 'FarmTech Machines', currentStock: 6, reorderLevel: 10, unit: 'Units', costPrice: 18500, sellingPrice: 26000, status: 'Low Stock', lastUpdated: '2026-06-27', trend: 'down', change: -14 },
  { id: 9, sku: 'SAT-PVC-011', name: 'PVC Irrigation Pipe (50m)', category: 'Irrigation Systems', subcategory: 'Pipes & Fittings', supplier: 'PipeWorks India', currentStock: 210, reorderLevel: 80, unit: 'Rolls', costPrice: 620, sellingPrice: 950, status: 'In Stock', lastUpdated: '2026-06-29', trend: 'up', change: +30 },
  { id: 10, sku: 'SAT-WHL-008', name: 'Wheelbarrow (180L Capacity)', category: 'Farm Tools', subcategory: 'Material Handling', supplier: 'Agri Implements Co.', currentStock: 0, reorderLevel: 12, unit: 'Pcs', costPrice: 2200, sellingPrice: 3400, status: 'Out of Stock', lastUpdated: '2026-06-25', trend: 'down', change: -100 },
];

const STATUSES = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

const statusMeta = {
  'In Stock':    { className: 'stock-badge--in',  icon: CheckCircle2 },
  'Low Stock':   { className: 'stock-badge--low', icon: AlertTriangle },
  'Out of Stock':{ className: 'stock-badge--out', icon: X },
};

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
            Save Adjustment
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
      const data = await getStockLedger();
      if (data && data.length > 0) {
        setItems(data);
        saveLocalStock(data);
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
  const metrics = useMemo(() => ({
    total: items.length,
    inStock: items.filter(i => i.status === 'In Stock').length,
    lowStock: items.filter(i => i.status === 'Low Stock').length,
    outOfStock: items.filter(i => i.status === 'Out of Stock').length,
    totalValue: items.reduce((s, i) => s + i.currentStock * i.costPrice, 0),
  }), [items]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="stock-page">
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
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="stock-header-actions">
          <button className="catalog-btn stock-refresh-btn" onClick={handleRefresh} title="Refresh" disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1.5s linear infinite' } : {}} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="catalog-btn" title="Export stock report">
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
            <strong style={{ fontSize: '18px' }}>{formatINR(metrics.totalValue)}</strong>
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
          <div className="stock-legend">
            <span className="stock-badge stock-badge--in"><CheckCircle2 size={11} /> In Stock</span>
            <span className="stock-badge stock-badge--low"><AlertTriangle size={11} /> Low</span>
            <span className="stock-badge stock-badge--out"><X size={11} /> Out</span>
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
                <th style={{ padding: '8px 12px' }}>Product / SKU</th>
                <th style={{ padding: '8px 12px' }}>Category</th>
                <th style={{ padding: '8px 12px' }}>Supplier</th>
                <th className="catalog-number-cell" style={{ padding: '8px 12px' }}>Current Stock</th>
                <th className="catalog-number-cell" style={{ padding: '8px 12px' }}>Reorder Level</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th style={{ padding: '8px 12px' }}>30-Day Trend</th>
                <th className="catalog-number-cell" style={{ padding: '8px 12px' }}>Cost Price</th>
                <th className="catalog-number-cell" style={{ padding: '8px 12px' }}>Selling Price</th>
                <th style={{ padding: '8px 12px' }}>Last Updated</th>
                <th className="catalog-center-cell" style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={
                    item.status === 'Out of Stock' 
                      ? 'stock-row--alert' 
                      : item.status === 'Low Stock' 
                        ? 'stock-row--warning' 
                        : 'stock-row--success'
                  }
                  style={{ fontSize: '12px' }}
                >
                  <td style={{ padding: '6px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px', fontWeight: 600 }}>{item.name}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>{item.sku} &nbsp;·&nbsp; {item.unit}</div>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <div className="catalog-table__title" style={{ fontSize: '12px' }}>{item.category}</div>
                    <div className="catalog-table__muted" style={{ fontSize: '10px' }}>{item.subcategory}</div>
                  </td>
                  <td style={{ padding: '6px 12px' }}>{item.supplier}</td>
                  <td className="catalog-number-cell" style={{ padding: '6px 12px' }}>
                    <span className={`stock-qty ${item.status === 'Out of Stock' ? 'stock-qty--zero' : item.status === 'Low Stock' ? 'stock-qty--low' : 'stock-qty--ok'}`} style={{ fontSize: '12px', padding: '2px 8px' }}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="catalog-number-cell" style={{ padding: '6px 12px' }}>{item.reorderLevel}</td>
                  <td style={{ padding: '6px 12px' }}><StockBadge status={item.status} /></td>
                  <td style={{ padding: '6px 12px' }}><TrendIndicator trend={item.trend} change={item.change} /></td>
                  <td className="catalog-number-cell" style={{ padding: '6px 12px' }}>{formatINR(item.costPrice)}</td>
                  <td className="catalog-number-cell" style={{ padding: '6px 12px' }}>{formatINR(item.sellingPrice)}</td>
                  <td style={{ padding: '6px 12px' }}>
                    <div className="catalog-table__muted" style={{ fontSize: '11px' }}>{item.lastUpdated}</div>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '6px 12px' }}>
                    <button
                      className="catalog-btn catalog-btn--icon stock-adjust-btn"
                      title="Adjust stock"
                      onClick={() => setAdjustingItem(item)}
                      style={{ padding: '4px 6px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="11">
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
