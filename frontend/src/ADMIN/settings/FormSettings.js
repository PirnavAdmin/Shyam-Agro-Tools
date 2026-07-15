import React, { useState } from 'react';
import { Save, ArrowLeft, Settings, CheckCircle } from 'lucide-react';

const FormSettings = () => {
  const [formData, setFormData] = useState({
    shippingFlat: '250',
    seedsGst: '5',
    machineryGst: '12',
    minAdvisoryLevel: 'Active Grower',
    allowCreditTerms: true,
    platformCurrency: 'INR',
    farmerVerification: 'Auto-Verify'
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">System Preferences & Settings</h2>
            <p className="text-slate-500 text-xs">Configure tax limits, flat shipping rates, and advisory verification rules.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-pulse">
              <CheckCircle size={16} /> Saved Settings
            </span>
          )}
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping & Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Flat Shipping Fee (₹)</label>
            <input
              type="number"
              name="shippingFlat"
              value={formData.shippingFlat}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Platform Base Currency</label>
            <select
              name="platformCurrency"
              value={formData.platformCurrency}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer bg-white"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>
        </div>

        {/* GST / Taxes settings */}
        <div className="bg-slate-55 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
            <Settings className="text-emerald-600 animate-spin-slow" size={16} />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">GST tax levels (%)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Seeds & propagation tax rate</label>
              <input
                type="number"
                name="seedsGst"
                value={formData.seedsGst}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors bg-white text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Heavy farming machinery tax rate</label>
              <input
                type="number"
                name="machineryGst"
                value={formData.machineryGst}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors bg-white text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Advisory Policies */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Grower advisory policies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Verification workflow</label>
              <select
                name="farmerVerification"
                value={formData.farmerVerification}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer bg-white"
              >
                <option value="Auto-Verify">Auto-Verify with Mobile OTP</option>
                <option value="Manual">Manual Land Doc Review</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Advisory premium level required</label>
              <select
                name="minAdvisoryLevel"
                value={formData.minAdvisoryLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer bg-white"
              >
                <option value="Free Tier">All Registered Accounts</option>
                <option value="Active Grower">Active Growers only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Checkbox fields */}
        <div className="flex items-center gap-3 border border-slate-100 p-4 rounded-xl hover:bg-slate-50/50 transition-colors">
          <input
            type="checkbox"
            name="allowCreditTerms"
            checked={formData.allowCreditTerms}
            onChange={handleInputChange}
            id="allowCreditTerms"
            className="w-4.5 h-4.5 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="allowCreditTerms" className="text-xs font-semibold text-slate-700 cursor-pointer leading-relaxed">
            Allow credit settlement terms for Wholesalers (supports up to ₹50,000 credit limit defaults)
          </label>
        </div>
      </form>
    </div>
  );
};

export default FormSettings;
