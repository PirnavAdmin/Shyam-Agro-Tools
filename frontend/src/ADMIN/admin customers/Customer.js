import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Tractor, CreditCard, Activity, Edit, Plus, X, Search, ChevronDown } from 'lucide-react';

const Customer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Switch customer state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: '',
    address: '',
    district: '',
    state: '',
    soilType: '',
    cropType: '',
    farmSizeAcres: '',
    irrigationSource: ''
  });

  // Advisory Form State
  const [advisoryText, setAdvisoryText] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Fetch all customers for the search/select capability
  useEffect(() => {
    fetch('https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers', {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
      })
      .catch(err => {
        console.error('Error fetching customers list:', err);
      });
  }, []);

  // Fetch specific customer data when ID changes
  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers/${id}`, {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customer profile');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          status: data.status || 'Active',
          address: data.address || '',
          district: data.district || '',
          state: data.state || '',
          soilType: data.agrarianProfile?.soilType || 'Red Sandy',
          cropType: data.agrarianProfile?.cropType || '',
          farmSizeAcres: data.agrarianProfile?.farmSizeAcres || '',
          irrigationSource: data.agrarianProfile?.irrigationSource || 'Borewell'
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedPayload = {
        ...profile,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        status: editForm.status,
        address: editForm.address,
        district: editForm.district,
        state: editForm.state,
        agrarianProfile: {
          ...profile.agrarianProfile,
          soilType: editForm.soilType,
          cropType: editForm.cropType,
          farmSizeAcres: parseFloat(editForm.farmSizeAcres) || 0,
          irrigationSource: editForm.irrigationSource
        }
      };

      const res = await fetch(`https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(updatedPayload),
      });
      if (!res.ok) throw new Error('Update failed');
      // PUT returns 204 NoContent — refetch the profile to get updated data
      const refreshed = await fetch(`https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        setProfile(data);
        setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
      }
      setShowEditModal(false);
      alert('Customer updated successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  const postAdvisory = async (e) => {
    e.preventDefault();
    if (!advisoryText.trim() || !recommendation.trim()) {
      alert('Please fill out both advisory notes and recommendation.');
      return;
    }
    try {
      const res = await fetch(`https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers/${id}/advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          advisoryText,
          recommendation,
          staffId: 1
        }),
      });
      if (!res.ok) throw new Error('Advisory post failed');
      const data = await res.json();
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        advisories: [data, ...(prev.advisories || [])]
      }));
      setAdvisoryText('');
      setRecommendation('');
      alert('Advisory posted successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter customers for search
  const filteredSearchList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 10); // Show first 10 by default
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      String(c.id).includes(q)
    );
  }, [customers, searchQuery]);

  const selectCustomer = (custId) => {
    setSearchParams({ id: custId });
    setShowSwitchDropdown(false);
    setSearchQuery('');
  };

  const getTagColor = (type) => {
    switch (type || 'Farmer') {
      case 'Farmer':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Retailer':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
  };

  // Render direct search select interface if no id is specified
  if (!id) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-100 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <User size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Select Customer Profile</h2>
          <p className="text-slate-500 text-xs mt-1">Search by customer name, phone number, or ID to view their farm record.</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50/50"
          />
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {filteredSearchList.map(c => (
            <div
              key={c.id}
              onClick={() => selectCustomer(c.id)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition-all"
            >
              <div>
                <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                  <span>#{c.id}</span>
                  <span>•</span>
                  <span>{c.phone}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getTagColor(c.type)}`}>
                {c.type || 'Farmer'}
              </span>
            </div>
          ))}
          {filteredSearchList.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">No customers match your search query.</div>
          )}
        </div>

        <div className="mt-6 border-t pt-4 text-center">
          <button 
            onClick={() => navigate('/admin/customers/list')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft size={14} /> Back to Directory
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Loading customer profile...</div>;
  if (error) return (
    <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-100 shadow-xl text-center">
      <h3 className="text-lg font-bold text-rose-600 mb-2">Error Loading Profile</h3>
      <p className="text-slate-500 text-xs mb-4">{error}</p>
      <div className="flex gap-2 justify-center">
        <button 
          onClick={() => { setError(null); setLoading(true); setSearchParams({ id }); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry
        </button>
        <button 
          onClick={() => setSearchParams({})} 
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Select Different Customer
        </button>
      </div>
    </div>
  );
  if (!profile) return <div className="text-center py-12 text-slate-500">Customer profile not found.</div>;

  // Derivations
  const totalSpent = profile.orders?.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0) || 0;
  const customerType = profile.type || 'Farmer';
  const cropList = profile.agrarianProfile?.cropType ? [profile.agrarianProfile.cropType] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200" onClick={() => navigate('/admin/customers/list')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Customer Profile &amp; Farm Records</h2>
            <p className="text-slate-500 text-xs">Overview of grower records, field details, crop advisory, and order transactions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Switch Customer Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Switch Customer <ChevronDown size={14} />
            </button>
            
            {showSwitchDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-30">
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg mb-2 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredSearchList.map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c.id)}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${c.id === profile.id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex justify-between">
                        <span>{c.name}</span>
                        <span className="text-slate-400">#{c.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <Edit size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column – summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
            <img
              src={profile.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2e7d32&color=fff`}
              alt={profile.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 border border-emerald-100 shadow-sm object-cover"
            />
            <h3 className="text-base font-bold text-slate-800">{profile.name}</h3>
            <span className="inline-block px-3 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full uppercase tracking-wider mb-4">
              {customerType}
            </span>
            <div className="text-left space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400 font-semibold" />{profile.phone}</div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" />{profile.email || 'No email provided'}</div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500 leading-relaxed">
                  {profile.address ? `${profile.address}, ${profile.district || ''}, ${profile.state || ''}` : 'No address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Farm details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Tractor size={18} className="text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Agrarian Details</h4>
            </div>
            <div className="text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Land Area:</span>
                <span className="font-semibold text-slate-800">
                  {profile.agrarianProfile?.farmSizeAcres ? `${profile.agrarianProfile.farmSizeAcres} Acres` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Soil Condition:</span>
                <span className="font-semibold text-slate-800">{profile.agrarianProfile?.soilType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Irrigation Source:</span>
                <span className="font-semibold text-slate-800">{profile.agrarianProfile?.irrigationSource || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Crops Cultivated:</span>
                <div className="flex flex-wrap gap-1.5">
                  {cropList.length > 0 ? cropList.map((crop, idx) => (
                    <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{crop}</span>
                  )) : (
                    <span className="text-slate-400 text-[10px] italic">No crops listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column – finance, orders & advisories */}
        <div className="md:col-span-2 space-y-6">
          {/* Finance Snapshot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg text-emerald-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Total Spent</span>
                <h4 className="text-sm font-bold text-slate-800">₹{totalSpent.toLocaleString('en-IN')}</h4>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg text-amber-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Agro Coins Balance</span>
                <h4 className="text-sm font-bold text-slate-800">{profile.coinsBalance || 0} Coins</h4>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2.5">Recent Order History</h4>
            <div className="space-y-3">
              {profile.orders && profile.orders.length > 0 ? profile.orders.map((ord) => {
                const orderItemsText = Array.isArray(ord.items) && ord.items.length > 0 
                  ? ord.items.map(item => item.productName || item.name).join(', ')
                  : 'Agricultural Equipment / Supplies';
                return (
                  <div key={ord.id} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-lg transition-colors text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-800">{ord.orderNumber || `ORD-#${ord.id}`}</span>
                        <span className="text-slate-400 text-[10px]">• {ord.orderDate ? ord.orderDate.slice(0, 10) : 'Recent'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate max-w-[280px]">{orderItemsText}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block mb-0.5">₹{(ord.finalAmount || ord.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${ord.status === 'Delivered' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{ord.status || 'Pending'}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-slate-400 text-xs py-4 text-center">No orders registered for this customer yet.</div>
              )}
            </div>
          </div>

          {/* Crop Advisory Logging Form & Logs */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Activity size={18} className="text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Crop Advisory logs &amp; Notes</h4>
            </div>

            {/* Post new advisory */}
            <form onSubmit={postAdvisory} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block uppercase">Post New Expert Advisory</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Observation / Issue Description (e.g. Yellowing leaves)"
                  value={advisoryText}
                  onChange={e => setAdvisoryText(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                />
                <textarea
                  placeholder="Expert Recommendation / Solution"
                  value={recommendation}
                  onChange={e => setRecommendation(e.target.value)}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 bg-white resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus size={14} /> Submit Advisory
                </button>
              </div>
            </form>

            {/* Advisory Logs List */}
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-5 py-2">
              {profile.advisories && profile.advisories.length > 0 ? profile.advisories.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                  <span className="text-slate-400 text-[10px] font-bold block mb-1">
                    {log.dateCreated ? log.dateCreated.slice(0, 16).replace('T', ' ') : 'Recent'}
                  </span>
                  <div className="bg-slate-50/60 rounded-lg border border-slate-100 p-3 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">Observation: <span className="font-medium text-slate-600">{log.advisoryText}</span></span>
                    <span className="font-bold text-emerald-800 block">Solution: <span className="font-medium text-emerald-700">{log.recommendation}</span></span>
                    {log.staff && (
                      <span className="text-[10px] text-slate-400 block mt-2 border-t pt-1">Assigned Expert: {log.staff.name} ({log.staff.role})</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-slate-400 text-xs py-4 text-center -ml-6">No advisory logs recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-800">Edit Customer Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <h4 className="font-bold text-emerald-700 uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-emerald-700 uppercase tracking-wider pt-2">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block font-semibold text-slate-500 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <h4 className="font-bold text-emerald-700 uppercase tracking-wider pt-2">Agrarian Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Soil Type</label>
                  <select
                    value={editForm.soilType}
                    onChange={e => setEditForm({ ...editForm, soilType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Red Sandy">Red Sandy</option>
                    <option value="Black Clayey">Black Clayey</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Laterite">Laterite</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Crop Type</label>
                  <input
                    type="text"
                    value={editForm.cropType}
                    onChange={e => setEditForm({ ...editForm, cropType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.farmSizeAcres}
                    onChange={e => setEditForm({ ...editForm, farmSizeAcres: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Irrigation Source</label>
                  <select
                    value={editForm.irrigationSource}
                    onChange={e => setEditForm({ ...editForm, irrigationSource: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Borewell">Borewell</option>
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Canal">Canal Water</option>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Sprinkler">Sprinklers</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
