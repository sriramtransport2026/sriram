import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Car, 
  Truck, 
  Edit3, 
  Trash2, 
  Phone, 
  User, 
  FileText, 
  Check, 
  X,
  Clock
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export function VehiclesView({ onBack, vehicles = [], trips = [], onSaveVehicle, onDeleteVehicle, companySettings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '19FT-SA-IIMT',
    owner_name: '',
    owner_phone: '',
  });

  // Calculate metrics per vehicle
  const vehiclesWithMetrics = vehicles.map(vehicle => {
    const vehicleTrips = trips.filter(t => t.vehicle_id === vehicle.id);
    const totalPaid = vehicleTrips.reduce((acc, t) => acc + (parseFloat(t.vehicle_freight) || 0), 0);
    const totalProfitGenerated = vehicleTrips.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
    return {
      ...vehicle,
      tripCount: vehicleTrips.length,
      totalPaid,
      totalProfitGenerated,
    };
  });

  const filteredVehicles = vehiclesWithMetrics.filter(v =>
    (v.vehicle_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (v.owner_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (v.vehicle_type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_number: '',
      vehicle_type: '19FT-SA-IIMT',
      owner_name: '',
      owner_phone: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_type: vehicle.vehicle_type || '19FT-SA-IIMT',
      owner_name: vehicle.owner_name || '',
      owner_phone: vehicle.owner_phone || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) return;

    await onSaveVehicle({
      id: editingVehicle?.id,
      ...formData,
      vehicle_number: formData.vehicle_number.trim().toUpperCase(),
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
            <span>Add New Lorry</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lorry registration #, owner, body type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredVehicles.length} of {vehicles.length} Lorries
        </span>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-soft-lg border border-slate-200/80 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black font-mono text-slate-900 tracking-tight">{vehicle.vehicle_number}</h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {vehicle.vehicle_type || 'General Carrier'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="p-1.5 text-slate-400 hover:text-brand-navy rounded-lg hover:bg-slate-100 transition"
                    title="Edit Lorry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete lorry "${vehicle.vehicle_number}"?`)) {
                        onDeleteVehicle(vehicle.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Lorry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Owner Info Box */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Owner / Operator</span>
                  <span className="font-semibold text-slate-800">{vehicle.owner_name || 'Direct Vehicle'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Contact</span>
                  <span className="font-mono text-slate-700">{vehicle.owner_phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Running Financial Metrics */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Trips Completed</span>
                <span className="text-sm font-bold text-slate-900">{vehicle.tripCount} Trips</span>
              </div>
              <div className="bg-amber-50/60 p-2 rounded-xl text-right">
                <span className="text-[10px] font-semibold text-amber-700 block uppercase">Freight Disbursed</span>
                <span className="text-sm font-bold text-amber-900">₹{Number(vehicle.totalPaid).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No lorries found matching query.
          </div>
        )}
      </div>

      {/* CREATE / EDIT VEHICLE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                {editingVehicle ? 'Edit Lorry Details' : 'Register New Lorry'}
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Registration # <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA01AB5401 or TN70AP3051"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData(f => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Body Type</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData(f => ({ ...f, vehicle_type: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="19FT-SA-IIMT">19FT-SA-IIMT (Single Axle 11MT)</option>
                  <option value="22FT-TB-10MT">22FT-TB-10MT (Taurus Body 10MT)</option>
                  <option value="14FT-LCV-4 MT">14FT-LCV-4 MT (Light Commercial)</option>
                  <option value="32FT-MX-15MT">32FT-MX-15MT (Multi Axle)</option>
                  <option value="Open Body Truck">Open Body Truck</option>
                  <option value="Container Lorry">Container Lorry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar / Sri Ram Agency"
                  value={formData.owner_name}
                  onChange={(e) => setFormData(f => ({ ...f, owner_name: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9845012345"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData(f => ({ ...f, owner_phone: e.target.value }))}
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
