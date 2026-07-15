import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Eye, Plus, X } from 'lucide-react';
import { OutlookDeleteButton, Pagination } from '../components/ActionButtons';

const CustomersList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add customer modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'Active',
    address: '',
    district: '',
    state: '',
    type: 'Farmer', // Default client/farmer type
    soilType: 'Red Sandy',
    cropType: 'Cotton',
    farmSizeAcres: '5',
    irrigationSource: 'Borewell'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    fetch('https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers', {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers/${id}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!res.ok) throw new Error('Delete failed');
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Name and Phone are required.');
      return;
    }

    try {
      // Create request payload with agrarian profile
      const payload = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        status: newCustomer.status,
        address: newCustomer.address,
        district: newCustomer.district,
        state: newCustomer.state,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newCustomer.name)}&background=2e7d32&color=fff`,
        agrarianProfile: {
          soilType: newCustomer.soilType,
          cropType: newCustomer.cropType,
          farmSizeAcres: parseFloat(newCustomer.farmSizeAcres) || 0,
          irrigationSource: newCustomer.irrigationSource
        }
      };

      const res = await fetch('https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create customer');
      const data = await res.json();
      setCustomers(prev => [data, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        status: 'Active',
        address: '',
        district: '',
        state: '',
        type: 'Farmer',
        soilType: 'Red Sandy',
        cropType: 'Cotton',
        farmSizeAcres: '5',
        irrigationSource: 'Borewell'
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const nameVal = c.name ? c.name.toLowerCase() : '';
      const idVal = c.id ? String(c.id).toLowerCase() : '';
      const matchesSearch =
        nameVal.includes(searchTerm.toLowerCase()) ||
        idVal.includes(searchTerm.toLowerCase());
      
      const customerType = c.type || 'Farmer';
      const matchesType = typeFilter === 'All' || customerType === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, typeFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  if (loading) return <div className="text-center py-8">Loading customers...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative" style={{ padding: '16px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-slate-800">Customers Directory</h2>
          <p className="text-slate-500 text-xs">
            Manage registered growers, retailers, and agricultural bulk buyers.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by customer name, id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="All">All Customer Types</option>
          <option value="Farmer">Farmers</option>
          <option value="Retailer">Retailers</option>
          <option value="Wholesaler">Wholesalers</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Customer Name</th>
              <th className="px-4 py-2">Phone Number</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Crop</th>
              <th className="px-4 py-2 text-center">Orders</th>
              <th className="px-4 py-2 text-right">Total Spent</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentCustomers.map((cust) => {
              const cropType = cust.agrarianProfile?.cropType || 'N/A';
              const orderCount = cust.orders?.length || 0;
              const totalSpent = cust.orders?.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0) || 0;
              const customerType = cust.type || 'Farmer';

              return (
                <tr 
                  key={cust.id} 
                  className="hover:bg-slate-50/60 transition-colors text-slate-700 cursor-pointer"
                  onClick={() => navigate(`/admin/customers/customer?id=${cust.id}`)}
                >
                  <td className="px-4 py-2 font-medium text-slate-500">#{cust.id}</td>
                  <td className="px-4 py-2 font-semibold text-slate-800">
                    <span className="hover:text-emerald-600 transition-colors">{cust.name}</span>
                    <span className={`text-[9px] ml-2 px-1.5 py-0.2 rounded-full font-bold uppercase ${getTagColor(customerType)}`}> {customerType} </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-600">{cust.phone}</td>
                  <td className="px-4 py-2 text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{cust.address || cust.state || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-slate-600 font-medium text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{cropType}</span>
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-slate-700">{orderCount}</td>
                  <td className="px-4 py-2 text-right font-bold text-slate-800">₹{totalSpent.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <Link to={`/admin/customers/customer?id=${cust.id}`} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800 transition-colors" title="View Profile">
                        <Eye size={14} />
                      </Link>
                      <OutlookDeleteButton onClick={() => handleDelete(cust.id)} title="Delete Customer" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-6 text-slate-400">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredCustomers.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Rajinder Singh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. +919876543201"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. email@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Type</label>
                  <select
                    value={newCustomer.type}
                    onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider pt-2">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="House/Plot/Village details"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">District</label>
                  <input
                    type="text"
                    value={newCustomer.district}
                    onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Ludhiana"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    value={newCustomer.state}
                    onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Punjab"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={newCustomer.status}
                    onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider pt-2">Agrarian Profile (For Farmers)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Soil Type</label>
                  <select
                    value={newCustomer.soilType}
                    onChange={e => setNewCustomer({ ...newCustomer, soilType: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Main Crop Type</label>
                  <input
                    type="text"
                    value={newCustomer.cropType}
                    onChange={e => setNewCustomer({ ...newCustomer, cropType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Wheat, Cotton, Grapes"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCustomer.farmSizeAcres}
                    onChange={e => setNewCustomer({ ...newCustomer, farmSizeAcres: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Irrigation Source</label>
                  <select
                    value={newCustomer.irrigationSource}
                    onChange={e => setNewCustomer({ ...newCustomer, irrigationSource: e.target.value })}
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;
