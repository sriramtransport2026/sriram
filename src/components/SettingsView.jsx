import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  Building2, 
  Database, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Server,
  Image as ImageIcon,
  Users
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  cleanGSTIN, isValidGSTIN, extractPanFromGSTIN, 
  cleanPAN, isValidPAN 
} from '../utils/validation';
import logoImg from '../assets/logo.png';

export function SettingsView({ onBack, settings, onSaveSettings, onResetDemoData, currentUser, onNavigateToUsers }) {
  const [formData, setFormData] = useState({ ...settings });
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.gstin && !isValidGSTIN(formData.gstin)) {
      alert("Invalid GSTIN format. GSTIN must be 15 alphanumeric characters (e.g. 33GUPS2382N1ZF).");
      return;
    }

    if (formData.pan && !isValidPAN(formData.pan)) {
      alert("Invalid PAN format. PAN must be 10 characters (e.g. GUPS2382N1).");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSettings({
        ...formData,
        gstin: cleanGSTIN(formData.gstin),
        pan: cleanPAN(formData.pan),
      });
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset application data to original Ashirvad reference freight chart & invoice? This will restore initial loads.')) {
      onResetDemoData();
      alert('Application sample data refreshed successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Top Bar with Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition self-start"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Back to Dashboard</span>
          </button>

          <div className="hidden md:flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <img src={logoImg} alt="Sri Ram Transport" className="h-8 w-auto object-contain" />
            <span className="text-xs font-black tracking-widest text-brand-navy uppercase">Sri Ram Transport</span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            System Configuration
          </span>
          <h2 className="text-xl font-black text-brand-navy font-display">Settings & Agency Profile</h2>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-brand-green p-4 rounded-r-2xl text-emerald-800 text-sm flex items-center space-x-2 shadow-sm">
          <CheckCircle className="w-5 h-5 text-brand-green" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-brand-navy font-bold text-sm">
            <Building2 className="w-4 h-4 text-brand-navy" />
            <span>Sri Ram Transport — Legal Entity & Invoice Header</span>
          </div>

          {/* Official Logo Brand Asset Preview */}
          <div className="bg-gradient-to-r from-brand-navy-dark to-brand-navy p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-navy-light/40">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2.5 rounded-xl shrink-0 shadow">
                <img src={logoImg} alt="Sri Ram Transport Logo" className="h-12 w-auto object-contain" />
              </div>
              <div className="text-white">
                <p className="text-xs font-black uppercase tracking-wider text-brand-gold">Active Brand Identity Asset</p>
                <p className="text-sm font-bold">Official Sri Ram Transport Vector Emblem</p>
                <p className="text-[11px] text-slate-300">TRUST • TRANSPORT • TOGETHER</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white/10 text-brand-gold-light rounded-full border border-white/15">
              Active in Invoices & UI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Trade Name</label>
              <input
                type="text"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Application Brand Tagline</label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Dispatch Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Office Contact Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Head Office Address</label>
              <textarea
                rows="2"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* GST & Tax Coordinates */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
            <span>Taxation & Reverse Charge Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">GSTIN (15 Chars)</label>
                <span className={"text-[10px] font-mono font-bold " + (formData.gstin?.length === 15 ? (isValidGSTIN(formData.gstin) ? "text-emerald-600" : "text-rose-500") : "text-slate-400")}>
                  {formData.gstin?.length || 0}/15
                </span>
              </div>
              <input
                type="text"
                maxLength={15}
                name="gstin"
                value={formData.gstin || ''}
                onChange={(e) => {
                  const gstin = cleanGSTIN(e.target.value);
                  const pan = gstin.length >= 12 ? extractPanFromGSTIN(gstin) : formData.pan;
                  setFormData(prev => ({ ...prev, gstin, pan }));
                }}
                className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono font-bold " + (formData.gstin && !isValidGSTIN(formData.gstin) && formData.gstin.length === 15 ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-slate-50")}
              />
              {formData.gstin && (
                <p className={"text-[10px] mt-0.5 font-medium " + (isValidGSTIN(formData.gstin) ? "text-emerald-600 font-bold" : "text-slate-400")}>
                  {isValidGSTIN(formData.gstin) ? "✓ Valid GSTIN Format" : "15-char standard GSTIN format"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SAC Code</label>
              <input
                type="text"
                name="sac_code"
                value={formData.sac_code || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">PAN Number (10 Chars)</label>
                <span className={"text-[10px] font-mono font-bold " + (formData.pan?.length === 10 ? (isValidPAN(formData.pan) ? "text-emerald-600" : "text-rose-500") : "text-slate-400")}>
                  {formData.pan?.length || 0}/10
                </span>
              </div>
              <input
                type="text"
                maxLength={10}
                name="pan"
                value={formData.pan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: cleanPAN(e.target.value) }))}
                className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono font-semibold " + (formData.pan && !isValidPAN(formData.pan) && formData.pan.length === 10 ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-slate-50")}
              />
              {formData.pan && (
                <p className={"text-[10px] mt-0.5 font-medium " + (isValidPAN(formData.pan) ? "text-emerald-600 font-bold" : "text-slate-400")}>
                  {isValidPAN(formData.pan) ? "✓ Valid PAN Format" : "10-char PAN format (e.g. AABCA7061K)"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch State</label>
              <input
                type="text"
                name="branch_state"
                value={formData.branch_state}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default GST Reverse Charge (%)</label>
              <input
                type="number"
                step="0.01"
                name="default_gst_percent"
                value={formData.default_gst_percent}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Prefix Sequence</label>
              <input
                type="text"
                name="invoice_prefix"
                value={formData.invoice_prefix}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Database & Backend Status */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database & Storage Architecture</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Instant Offline Storage (Active)'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>Dual Mode Support:</strong> The system automatically supports both live Supabase PostgreSQL backend storage and zero-setup local persistent browser storage.
            </p>
            <p>
              To link your own Supabase project, provide <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_URL</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_ANON_KEY</code> in the project <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env</code> file, and run the SQL migration script located at <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">supabase/schema.sql</code>.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Ashirvad Reference Data</span>
            </button>
          </div>
        </div>

        {/* Admin Access: User Management Shortcut */}
        {currentUser?.role === 'admin' && onNavigateToUsers && (
          <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/50 rounded-2xl p-6 shadow-soft border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-950 font-bold text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>User Management & Role Permissions</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Create system dispatchers, grant access to operational modules, and restrict company / client visibility.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToUsers}
              className="px-4 py-2.5 bg-brand-navy hover:bg-brand-navy-dark text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>Open User Manager</span>
            </button>
          </div>
        )}

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Company Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
