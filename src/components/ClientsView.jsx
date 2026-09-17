import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Building2, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  FileText, 
  TrendingUp, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export function ClientsView({ onBack, clients = [], trips = [], onSaveClient, onDeleteClient, companySettings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    pan: '',
    state: 'KARNATAKA',
    address: '',
    phone: '',
    email: '',
  });

  // Calculate metrics per client
  const clientsWithMetrics = clients.map(client => {
    const clientTrips = trips.filter(t => t.client_id === client.id);
    const totalBilled = clientTrips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
    const totalProfit = clientTrips.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
    return {
      ...client,
      tripCount: clientTrips.length,
      totalBilled,
      totalProfit,
    };
  });

  const filteredClients = clientsWithMetrics.filter(c =>
    (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.gstin?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.state?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      gstin: '',
      pan: '',
      state: 'KARNATAKA',
      address: '',
      phone: '',
      email: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      gstin: client.gstin || '',
      pan: client.pan || '',
      state: client.state || 'KARNATAKA',
      address: client.address || '',
      phone: client.phone || '',
      email: client.email || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onSaveClient({
      id: editingClient?.id,
      ...formData,
    });
    setModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Bar */}
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
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-widest text-brand-navy uppercase">
                {companySettings?.company_name || 'Sri Ram Transport'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                GSTIN: {companySettings?.gstin || '33GUPS2382N1ZF'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, GSTIN, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredClients.length} of {clients.length} Clients
        </span>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div
            key={client.id}
            className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-soft-lg border border-slate-200/80 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display line-clamp-1">{client.name}</h3>
                    <p className="text-[11px] text-slate-500">{client.state || 'India'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-1.5 text-slate-400 hover:text-brand-navy rounded-lg hover:bg-slate-100 transition"
                    title="Edit Client"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete client "${client.name}"?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tax & Contact details */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800">{client.gstin || 'Unregistered'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">PAN</span>
                  <span className="font-mono font-semibold text-slate-700">{client.pan || '-'}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Phone</span>
                    <span className="text-slate-700">{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 line-clamp-2">
                    {client.address}
                  </div>
                )}
              </div>
            </div>

            {/* Running Metrics */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total Trips</span>
                <span className="text-sm font-bold text-slate-900">{client.tripCount} Loads</span>
              </div>
              <div className="bg-emerald-50/60 p-2 rounded-xl text-right">
                <span className="text-[10px] font-semibold text-emerald-700 block uppercase">Freight Billed</span>
                <span className="text-sm font-bold text-emerald-900">₹{Number(client.totalBilled).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No clients found matching query.
          </div>
        )}
      </div>

      {/* CREATE / EDIT CLIENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                {editingClient ? 'Edit Client Profile' : 'Add New Client / Consignee'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Legal Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashirvad Pipes Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 29AABCA7061K1ZH"
                    value={formData.gstin}
                    onChange={(e) => {
                      const gstin = e.target.value.toUpperCase();
                      const pan = gstin.length >= 12 ? gstin.substring(2, 12) : formData.pan;
                      setFormData(f => ({ ...f, gstin, pan }));
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AABCA7061K"
                    value={formData.pan}
                    onChange={(e) => setFormData(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered Billing Address</label>
                <textarea
                  rows="2"
                  placeholder="Plot / Sy No, Hobli / Area, City, Pincode"
                  value={formData.address}
                  onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-brand-green hover:bg-brand-green-dark text-white rounded-xl shadow-sm"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
