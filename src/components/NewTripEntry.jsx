import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  Calendar, 
  MapPin, 
  Building2, 
  DollarSign, 
  Package, 
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { calculateProfit } from '../services/db';
import { INDIAN_STATES } from '../utils/indianStates';
import { 
  cleanPhone, isValidPhone, 
  cleanGSTIN, isValidGSTIN, extractPanFromGSTIN, 
  cleanPAN, isValidPAN 
} from '../utils/validation';
import logoImg from '../assets/logo.png';

export function NewTripEntry({ onBack, clients = [], vehicles = [], onSaveTrip, onQuickAddVehicle, onQuickAddClient }) {
  const [formData, setFormData] = useState({
    load_id: '220' + Math.floor(10000 + Math.random() * 90000),
    loading_date: new Date().toISOString().split('T')[0],
    client_id: '',
    vehicle_id: '',
    from_location: '',
    to_location: '',
    consignor: '',
    consignee: '',
    invoice_no_ref: '',
    packages: '',
    description: '',
    unit_type: 'MT', // 'MT' | 'kg' | 'boxes' | 'bags' | 'custom'
    custom_unit: '',
    actual_weight: '',
    charged_weight: '',
    rate: '',
    vehicle_rate: '',
    has_loading_unloading: 'no', // 'no' | 'yes'
    loading_unloading_amount: '',
    other_charges: [], // array of { id, name, type: 'add' | 'subtract', amount: '' }
    freight_amount: '',
    vehicle_freight: '',
  });

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_number: '', vehicle_type: '19FT-SA-IIMT', owner_name: '', owner_phone: '' });

  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', gstin: '', pan: '', state: 'Tamil Nadu', address: '', phone: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Current Unit Label
  const getUnitLabel = () => {
    if (formData.unit_type === 'custom') {
      return formData.custom_unit?.trim() || 'Custom';
    }
    if (formData.unit_type === 'boxes') return 'Boxes';
    if (formData.unit_type === 'bags') return 'Bags';
    if (formData.unit_type === 'kg') return 'kg';
    return 'MT';
  };

  const currentUnit = getUnitLabel();

  // Live Profit calculation
  const freightAmt = parseFloat(formData.freight_amount) || 0;
  const vehicleAmt = parseFloat(formData.vehicle_freight) || 0;
  const liveProfit = calculateProfit(freightAmt, vehicleAmt);
  const marginPercent = freightAmt > 0 ? ((liveProfit / freightAmt) * 100).toFixed(1) : 0;

  // Breakdown & Calculation Numbers
  const chargedNum = parseFloat(formData.charged_weight) || 0;
  const rateNum = parseFloat(formData.rate) || 0;
  const baseFreightNum = chargedNum > 0 && rateNum > 0 ? Math.round(chargedNum * rateNum * 100) / 100 : 0;
  const loadingDeductionNum = formData.has_loading_unloading === 'yes' ? (parseFloat(formData.loading_unloading_amount) || 0) : 0;

  let othersAddTotal = 0;
  let othersSubTotal = 0;
  if (Array.isArray(formData.other_charges)) {
    formData.other_charges.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      if (item.type === 'add') othersAddTotal += amt;
      else if (item.type === 'subtract') othersSubTotal += amt;
    });
  }

  // Expected Overall Freight: Base - Loading/Unloading + Other Additions - Other Deductions
  const expectedFreight = baseFreightNum > 0
    ? Math.max(0, Math.round((baseFreightNum - loadingDeductionNum + othersAddTotal - othersSubTotal) * 100) / 100)
    : null;
  const isAutoComputedFreight = expectedFreight !== null && Math.abs(freightAmt - expectedFreight) < 0.01;

  // Central Calculation updater helper
  const updateCalculation = (updated) => {
    const charged = parseFloat(updated.charged_weight);
    const clientRate = parseFloat(updated.rate);
    const base = (!isNaN(charged) && !isNaN(clientRate) && charged > 0 && clientRate > 0)
      ? Math.round(charged * clientRate * 100) / 100
      : 0;

    let net = base;
    if (updated.has_loading_unloading === 'yes') {
      net -= (parseFloat(updated.loading_unloading_amount) || 0);
    }
    if (Array.isArray(updated.other_charges)) {
      updated.other_charges.forEach(item => {
        const amt = parseFloat(item.amount) || 0;
        if (item.type === 'add') net += amt;
        else if (item.type === 'subtract') net -= amt;
      });
    }

    if (base > 0) {
      updated.freight_amount = Math.max(0, Math.round(net * 100) / 100).toString();
    }

    // Auto-calculate vehicle freight if vehicle_rate is provided (Charged Qty × Lorry Rate)
    const lorryRate = parseFloat(updated.vehicle_rate);
    if (!isNaN(charged) && !isNaN(lorryRate) && charged > 0 && lorryRate > 0) {
      const calculatedVehicle = Math.round(charged * lorryRate * 100) / 100;
      updated.vehicle_freight = calculatedVehicle.toString();
    }

    return updated;
  };

  // General field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Smart Weights & Rates handler with automatic calculation
  const handleWeightRateChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'charged_weight') {
        updated.actual_weight = value;
      }
      return updateCalculation(updated);
    });
  };

  // Loading & Unloading Toggle (Yes / No)
  const handleLoadingUnloadingToggle = (value) => {
    setFormData(prev => {
      const updated = { ...prev, has_loading_unloading: value };
      return updateCalculation(updated);
    });
  };

  // Loading & Unloading Amount change (Deduction / Subtraction)
  const handleLoadingUnloadingAmount = (value) => {
    setFormData(prev => {
      const updated = { ...prev, loading_unloading_amount: value };
      return updateCalculation(updated);
    });
  };

  // Others: Add custom adjustment row
  const handleAddOtherCharge = () => {
    setFormData(prev => {
      const newItems = [
        ...(prev.other_charges || []),
        { id: 'charge_' + Date.now(), name: '', type: 'add', amount: '' }
      ];
      return { ...prev, other_charges: newItems };
    });
  };

  // Others: Update specific adjustment field (name, type, amount)
  const handleUpdateOtherCharge = (id, field, value) => {
    setFormData(prev => {
      const newItems = (prev.other_charges || []).map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      const updated = { ...prev, other_charges: newItems };
      return updateCalculation(updated);
    });
  };

  // Others: Remove adjustment row
  const handleRemoveOtherCharge = (id) => {
    setFormData(prev => {
      const newItems = (prev.other_charges || []).filter(item => item.id !== id);
      const updated = { ...prev, other_charges: newItems };
      return updateCalculation(updated);
    });
  };

  // Force recalculate helper
  const handleRecalculateFreight = () => {
    if (expectedFreight !== null) {
      setFormData(prev => ({ ...prev, freight_amount: expectedFreight.toString() }));
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number.trim()) return;

    if (newVehicle.owner_phone && !isValidPhone(newVehicle.owner_phone)) {
      alert("Owner Phone must be strictly 10 digits. (Currently: " + cleanPhone(newVehicle.owner_phone).length + " digits)");
      return;
    }

    try {
      const saved = await onQuickAddVehicle({
        ...newVehicle,
        owner_phone: cleanPhone(newVehicle.owner_phone),
        vehicle_number: newVehicle.vehicle_number.trim().toUpperCase()
      });
      setFormData(prev => ({ ...prev, vehicle_id: saved.id }));
      setShowVehicleModal(false);
      setNewVehicle({ vehicle_number: '', vehicle_type: '19FT-SA-IIMT', owner_name: '', owner_phone: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;

    if (newClient.phone && !isValidPhone(newClient.phone)) {
      alert("Client Contact Phone must be strictly 10 digits. (Currently: " + cleanPhone(newClient.phone).length + " digits)");
      return;
    }

    if (newClient.gstin && !isValidGSTIN(newClient.gstin)) {
      alert("Invalid GSTIN format. GSTIN must be 15 alphanumeric characters (e.g. 29AABCA7061K1ZH).");
      return;
    }

    if (newClient.pan && !isValidPAN(newClient.pan)) {
      alert("Invalid PAN format. PAN must be 10 characters (e.g. AABCA7061K).");
      return;
    }

    try {
      const saved = await onQuickAddClient({
        ...newClient,
        phone: cleanPhone(newClient.phone),
        gstin: cleanGSTIN(newClient.gstin),
        pan: cleanPAN(newClient.pan),
      });
      if (saved && saved.id) {
        setFormData(prev => ({ 
          ...prev, 
          client_id: saved.id,
          consignor: saved.name || prev.consignor 
        }));
      }
      setShowClientModal(false);
      setNewClient({ name: '', gstin: '', pan: '', state: 'TAMIL NADU', address: '', phone: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.load_id.trim()) {
      setErrorMsg('Load ID is required.');
      return;
    }
    if (!formData.client_id) {
      setErrorMsg('Please select a Client.');
      return;
    }
    if (!formData.vehicle_id) {
      setErrorMsg('Please select a Vehicle.');
      return;
    }
    if (!formData.from_location.trim() || !formData.to_location.trim()) {
      setErrorMsg('From and To destinations are required.');
      return;
    }
    if (freightAmt <= 0) {
      setErrorMsg('Freight Amount charged to client must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPackages = formData.packages?.trim() 
        ? formData.packages.trim() 
        : formData.charged_weight
        ? `${formData.charged_weight} ${currentUnit}`
        : '';

      await onSaveTrip({
        ...formData,
        packages: finalPackages,
        actual_weight: Number(formData.charged_weight) || 0,
        charged_weight: Number(formData.charged_weight) || 0,
        freight_amount: freightAmt,
        vehicle_freight: vehicleAmt,
        profit: liveProfit,
        status: 'booked',
        unit_type: formData.unit_type,
        custom_unit: formData.custom_unit,
        has_loading_unloading: formData.has_loading_unloading,
        loading_unloading_amount: formData.has_loading_unloading === 'yes' ? (parseFloat(formData.loading_unloading_amount) || 0) : 0,
        other_charges: (formData.other_charges || []).filter(item => item.amount && parseFloat(item.amount) > 0),
      });
      setSuccessMsg(`Load #${formData.load_id} (${finalPackages || 'Consignment'}) registered successfully with status Booked!`);
      // Reset for next entry
      setFormData(prev => ({
        ...prev,
        load_id: '220' + Math.floor(10000 + Math.random() * 90000),
        client_id: '',
        vehicle_id: '',
        from_location: '',
        to_location: '',
        consignor: '',
        consignee: '',
        invoice_no_ref: '',
        packages: '',
        description: '',
        actual_weight: '',
        charged_weight: '',
        rate: '',
        vehicle_rate: '',
        has_loading_unloading: 'no',
        loading_unloading_amount: '',
        other_charges: [],
        freight_amount: '',
        vehicle_freight: '',
      }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Header with Back to Dashboard & Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/70">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition"
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
            LR Operations
          </span>
          <h2 className="text-base sm:text-lg font-black text-brand-navy font-display">New Trip Entry (LR Book)</h2>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-brand-green p-4 rounded-r-2xl text-emerald-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-brand-green" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => onBack()}
            className="text-xs font-bold text-emerald-900 underline hover:no-underline"
          >
            View on Status Board →
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-rose-800 text-sm flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Grid: Details + Live Profit Calculator Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Core LR Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Trip & Logistics Identification */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
                <Truck className="w-4 h-4 text-brand-navy" />
                <span>Trip & Vehicle Dispatch Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Load ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    LR NO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="load_id"
                    required
                    value={formData.load_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                {/* Loading Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Loading Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="loading_date"
                    required
                    value={formData.loading_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                {/* Client Dropdown + Quick Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Client (Consignee Billed) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs transition cursor-pointer"
                      title="Add New Client"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Client</span>
                    </button>
                  </div>
                  <select
                    name="client_id"
                    required
                    value={formData.client_id}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowClientModal(true);
                        return;
                      }
                      const selectedId = e.target.value;
                      const selectedClient = clients.find(c => c.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        client_id: selectedId,
                        consignor: selectedClient ? selectedClient.name : ''
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  >
                    <option value="">-- Select Client --</option>
                    <option value="__add_new__" className="font-bold text-emerald-700 bg-emerald-50">
                      ➕ + Add New Client...
                    </option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gstin || c.state})
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center space-x-1">
                      <span>⚠️ No clients registered. Click</span>
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="font-bold underline text-amber-800 hover:text-amber-900 cursor-pointer"
                      >
                        + Add Client
                      </button>
                      <span>to register one.</span>
                    </p>
                  )}
                </div>

                {/* Vehicle Dropdown + Quick Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Vehicle Lorry <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowVehicleModal(true)}
                      className="text-xs text-brand-green hover:text-brand-green-dark font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add New</span>
                    </button>
                  </div>
                  <select
                    name="vehicle_id"
                    required
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} — {v.vehicle_type || 'Lorry'} ({v.owner_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Route & Consignment */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
                <MapPin className="w-4 h-4 text-brand-navy" />
                <span>Origin, Destination & Cargo Consignment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    From Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="from_location"
                    required
                    placeholder="e.g. BANGALORE, Jigani"
                    value={formData.from_location}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    To Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="to_location"
                    required
                    placeholder="e.g. NELAMANGALA / SHIMOGA"
                    value={formData.to_location}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Consignor
                  </label>
                  <input
                    type="text"
                    name="consignor"
                    placeholder="e.g. Ashirvad Pipes Pvt Ltd"
                    value={formData.consignor}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Consignee (Delivery Party)
                  </label>
                  <input
                    type="text"
                    name="consignee"
                    placeholder="e.g. Pavan Agencies / Local Depot"
                    value={formData.consignee}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Packages Count / Units
                  </label>
                  <input
                    type="text"
                    name="packages"
                    placeholder="e.g. 42 Bundles / 30 Boxes"
                    value={formData.packages}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client PO / Ref Invoice #
                  </label>
                  <input
                    type="text"
                    name="invoice_no_ref"
                    placeholder="e.g. PO-98421 / INV-882"
                    value={formData.invoice_no_ref}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. PVC Conduit Pipes, CPVC Fittings, SWR Pipes"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Weights, Units & Pricing Specs */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                  <Package className="w-4 h-4 text-brand-navy" />
                  <span>Weights & Pricing Specs</span>
                </div>
                <span className="text-[11px] font-bold text-brand-gold-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Auto-Calculates Client Freight
                </span>
              </div>

              {/* Billing Category / Unit Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Billing Category / Unit of Measurement <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'MT', label: 'Metric Ton (MT)' },
                    { id: 'kg', label: 'Kilogram (kg)' },
                    { id: 'boxes', label: 'Boxes / Cartons' },
                    { id: 'bags', label: 'Bags / Sacks' },
                    { id: 'custom', label: 'Custom Unit...' },
                  ].map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, unit_type: unit.id }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                        formData.unit_type === unit.id
                          ? 'bg-brand-navy text-white border-brand-navy shadow-sm ring-2 ring-brand-gold/50'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>

                {/* Custom Category Input if 'custom' is selected */}
                {formData.unit_type === 'custom' && (
                  <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 animate-fade-in">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Enter Custom Category / Unit Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bundles, Pallets, Litres, Barrels, Drums, Pieces, Bales"
                      value={formData.custom_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_unit: e.target.value }))}
                      className="w-full sm:w-96 px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                    />
                    <p className="text-[11px] text-amber-800">
                      All weight & rate labels below will automatically adapt to your custom unit.
                    </p>
                  </div>
                )}
              </div>

              {/* Quantities & Rates Inputs (3 Columns with clear, non-truncated labels) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                {/* 1. Charged Weight / Quantity */}
                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-bold text-brand-navy tracking-normal whitespace-normal">
                    Charged {formData.unit_type === 'boxes' || formData.unit_type === 'bags' ? 'Quantity' : 'Weight'} ({currentUnit}) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="charged_weight"
                    placeholder="e.g. 1000"
                    value={formData.charged_weight}
                    onChange={(e) => handleWeightRateChange('charged_weight', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-brand-navy rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition shadow-xs"
                  />
                  <p className="text-xs text-slate-500 font-medium">Basis for billing calculation</p>
                </div>

                {/* 2. Client Rate per Unit */}
                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-normal whitespace-normal">
                    Rate per {currentUnit} (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      name="rate"
                      placeholder="e.g. 50000"
                      value={formData.rate}
                      onChange={(e) => handleWeightRateChange('rate', e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-brand-navy rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition shadow-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Charged to client / consignee</p>
                </div>

                {/* 3. Vehicle / Lorry Rate per Unit (Optional) */}
                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-normal whitespace-normal">
                    Lorry Rate / {currentUnit} (₹) <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      name="vehicle_rate"
                      placeholder="Optional"
                      value={formData.vehicle_rate}
                      onChange={(e) => handleWeightRateChange('vehicle_rate', e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-brand-navy rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition shadow-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Optional rate paid to vehicle</p>
                </div>
              </div>

              {/* --- Loading & Unloading Charges Section --- */}
              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Loading & Unloading Option
                      </h4>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Select whether loading & unloading charges apply. If yes, enter the amount to be deducted.
                      </p>
                    </div>
                    {formData.has_loading_unloading === 'yes' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shrink-0">
                        &minus; Subtracted from Freight
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                    {/* Yes/No Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Loading & Unloading Charges? <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={formData.has_loading_unloading}
                        onChange={(e) => handleLoadingUnloadingToggle(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                          formData.has_loading_unloading === 'yes'
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <option value="no" className="bg-white text-slate-900 font-normal">No — None / Not Applicable</option>
                        <option value="yes" className="bg-white text-slate-900 font-bold">Yes — Deduct from Freight</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formData.has_loading_unloading === 'yes' ? 'Enter the deduction amount in the field to the right.' : 'No loading/unloading charges will be added or subtracted.'}
                      </p>
                    </div>

                    {/* Amount Input (Visible only when Yes is selected) */}
                    {formData.has_loading_unloading === 'yes' ? (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-rose-900 mb-1.5">
                          Loading & Unloading Amount (₹) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-rose-500 font-bold text-sm">&minus; ₹</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 500"
                            value={formData.loading_unloading_amount}
                            onChange={(e) => handleLoadingUnloadingAmount(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-rose-300 focus:border-rose-500 rounded-xl text-sm font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 transition shadow-xs"
                          />
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium mt-1">
                          &minus; ₹{parseFloat(formData.loading_unloading_amount || 0).toLocaleString('en-IN')} will be subtracted from overall freight.
                        </p>
                      </div>
                    ) : (
                      <div className="hidden sm:flex items-center h-full pt-5 text-xs text-slate-400 italic">
                        Select "Yes" to enter a loading/unloading deduction amount.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- Others / Manual Additional Charges & Deductions Section --- */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Other Charges & Adjustments (Manual Custom)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Add extra items (e.g. Toll, Detention, Halting, Weighbridge, Advance) and decide whether each adds (+) or subtracts (&minus;)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOtherCharge}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-navy bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl transition shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-navy" />
                    <span>+ Add Other Adjustment</span>
                  </button>
                </div>

                {formData.other_charges && formData.other_charges.length > 0 ? (
                  <div className="space-y-2.5">
                    {formData.other_charges.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3 animate-fade-in shadow-2xs">
                        {/* Item Description */}
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                            Item / Adjustment Description #{idx + 1}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Toll Pass, Halting, Detention, Weighbridge"
                            value={item.name}
                            onChange={(e) => handleUpdateOtherCharge(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                          />
                        </div>

                        {/* Action: Add (+) or Subtract (-) */}
                        <div className="w-full md:w-52">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                            Calculation Action
                          </label>
                          <select
                            value={item.type}
                            onChange={(e) => handleUpdateOtherCharge(item.id, 'type', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                              item.type === 'add'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="add" className="bg-white text-emerald-800 font-bold">+ Add to Freight (+)</option>
                            <option value="subtract" className="bg-white text-rose-800 font-bold">&minus; Subtract from Freight (&minus;)</option>
                          </select>
                        </div>

                        {/* Amount */}
                        <div className="w-full md:w-36">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                            Amount (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">
                              {item.type === 'add' ? '+' : '−'} ₹
                            </span>
                            <input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => handleUpdateOtherCharge(item.id, 'amount', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                            />
                          </div>
                        </div>

                        {/* Delete button */}
                        <div className="pt-2 md:pt-4 flex justify-end">
                          <button
                            type="button"
                            title="Remove this adjustment"
                            onClick={() => handleRemoveOtherCharge(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-500">
                      No custom adjustments added. Click <strong className="text-brand-navy">+ Add Other Adjustment</strong> if you have additional charges or deductions.
                    </p>
                  </div>
                )}
              </div>

              {/* Real-time Overall Calculation Equation Preview Banner */}
              {baseFreightNum > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950 animate-fade-in shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px] uppercase tracking-wider">
                        ⚡ Overall Formula
                      </span>
                      <span className="font-semibold">
                        Base: <strong className="font-mono">{chargedNum.toLocaleString('en-IN')} {currentUnit} &times; ₹{rateNum.toLocaleString('en-IN')} = ₹{baseFreightNum.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shrink-0 shadow-2xs">
                      Overall Freight: <strong className="font-mono text-sm text-brand-navy">₹{Number(formData.freight_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  {/* Itemized math if deductions or additions exist */}
                  {(loadingDeductionNum > 0 || othersAddTotal > 0 || othersSubTotal > 0) && (
                    <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-700">
                      <span className="font-bold">Breakdown:</span>
                      <span className="font-mono">₹{baseFreightNum.toLocaleString('en-IN')} (Base)</span>
                      {loadingDeductionNum > 0 && (
                        <span className="font-mono text-rose-700 font-semibold">&minus; ₹{loadingDeductionNum.toLocaleString('en-IN')} (Loading/Unloading)</span>
                      )}
                      {othersAddTotal > 0 && (
                        <span className="font-mono text-emerald-700 font-semibold">+ ₹{othersAddTotal.toLocaleString('en-IN')} (Other Added)</span>
                      )}
                      {othersSubTotal > 0 && (
                        <span className="font-mono text-rose-700 font-semibold">&minus; ₹{othersSubTotal.toLocaleString('en-IN')} (Other Deductions)</span>
                      )}
                      <span className="font-bold text-brand-navy">= Overall ₹{Number(formData.freight_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Prominent Money & Live Profit Calculation Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-6 sticky top-6">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                  <DollarSign className="w-4 h-4 text-brand-green" />
                  <span>Freight & Profit Engine</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-navy text-white">
                  Live Computed
                </span>
              </div>

              {/* Input 1: Freight Amount (Client) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Freight Amount (Client Billed) <span className="text-rose-500">*</span>
                  </label>
                  {isAutoComputedFreight ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ⚡ Overall Synced
                    </span>
                  ) : expectedFreight !== null ? (
                    <button
                      type="button"
                      onClick={handleRecalculateFreight}
                      className="text-[10px] font-bold text-brand-navy hover:underline flex items-center space-x-1"
                    >
                      <span>&#x21bb; Sync to Overall ₹{expectedFreight.toLocaleString('en-IN')}</span>
                    </button>
                  ) : null}
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="freight_amount"
                    required
                    placeholder="0.00"
                    value={formData.freight_amount}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>

                {/* Overall Calculation Summary Card */}
                <div className="mt-2.5 text-[11px] text-slate-600 space-y-1 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Freight:</span>
                    <span className="font-mono font-semibold">₹{baseFreightNum.toLocaleString('en-IN')}</span>
                  </div>
                  {formData.has_loading_unloading === 'yes' && loadingDeductionNum > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Loading & Unloading:</span>
                      <span className="font-mono">&minus; ₹{loadingDeductionNum.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {othersAddTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Other Additions:</span>
                      <span className="font-mono">+ ₹{othersAddTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {othersSubTotal > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Other Deductions:</span>
                      <span className="font-mono">&minus; ₹{othersSubTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-brand-navy border-t border-slate-200/90 pt-1.5 mt-1">
                    <span>Overall Net Freight:</span>
                    <span className="font-mono">₹{Number(formData.freight_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Input 2: Vehicle Freight (Lorry Owner) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vehicle Freight (Lorry Paid) <span className="text-rose-500">*</span>
                  </label>
                  {formData.vehicle_rate && chargedNum > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚡ Rate: {chargedNum} &times; ₹{formData.vehicle_rate}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="vehicle_freight"
                    required
                    placeholder="0.00"
                    value={formData.vehicle_freight}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Amount disbursed to lorry owner/driver for this trip.</p>
              </div>

              {/* LIVE COMPUTED PROFIT DISPLAY CARD */}
              <div
                className={`rounded-2xl p-5 border transition-all duration-300 ${
                  liveProfit >= 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Computed Net Profit
                  </span>
                  {liveProfit >= 0 ? (
                    <div className="flex items-center space-x-1 text-xs font-bold text-brand-green">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{marginPercent}% Margin</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-xs font-bold text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                      <span>Loss Warning</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-3xl font-black font-display tracking-tight">
                  {liveProfit >= 0 ? '+' : ''}₹{liveProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>

                <p className="text-[11px] mt-2 opacity-80">
                  Formula: <span className="font-mono font-semibold">Freight (₹{freightAmt.toLocaleString('en-IN')}) &minus; Vehicle (₹{vehicleAmt.toLocaleString('en-IN')})</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Registering Trip...' : 'Confirm & Save Trip'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK ADD VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 font-display">Add New Vehicle to Fleet</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Registration #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA01AB5401 or TN70AP3051"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle(v => ({ ...v, vehicle_number: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Body Type</label>
                <input
                  type="text"
                  placeholder="e.g. 19FT-SA-IIMT, 22FT-TB-10MT, 14FT-LCV-4 MT"
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle(v => ({ ...v, vehicle_type: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={newVehicle.owner_name}
                    onChange={(e) => setNewVehicle(v => ({ ...v, owner_name: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Owner Phone (10 Digits)</label>
                    <span className={"text-[10px] font-mono font-bold " + (newVehicle.owner_phone.length === 10 ? "text-emerald-600" : "text-slate-400")}>
                      {newVehicle.owner_phone.length}/10
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9845012345"
                    value={newVehicle.owner_phone}
                    onChange={(e) => setNewVehicle(v => ({ ...v, owner_phone: cleanPhone(e.target.value) }))}
                    className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono " + (newVehicle.owner_phone && newVehicle.owner_phone.length === 10 ? "border-emerald-400" : "border-slate-200")}
                  />
                  {newVehicle.owner_phone && (
                    <p className={"text-[10px] mt-0.5 font-medium " + (newVehicle.owner_phone.length === 10 ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {newVehicle.owner_phone.length === 10 ? "✓ 10-Digit Mobile Number" : "Must be strictly 10 digits"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-brand-green hover:bg-brand-green-dark text-white rounded-xl"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 font-display">Add New Client (Consignee Billed)</h3>
            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Legal Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashirvad Pipes Pvt Ltd"
                  value={newClient.name}
                  onChange={(e) => setNewClient(c => ({ ...c, name: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-navy"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">GSTIN (15 Chars)</label>
                    <span className={"text-[10px] font-mono font-bold " + (newClient.gstin.length === 15 ? (isValidGSTIN(newClient.gstin) ? "text-emerald-600" : "text-rose-500") : "text-slate-400")}>
                      {newClient.gstin.length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 29AABCA7061K1ZH"
                    value={newClient.gstin}
                    onChange={(e) => {
                      const gstin = cleanGSTIN(e.target.value);
                      const pan = gstin.length >= 12 ? extractPanFromGSTIN(gstin) : newClient.pan;
                      setNewClient(c => ({ ...c, gstin, pan }));
                    }}
                    className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono " + (newClient.gstin && !isValidGSTIN(newClient.gstin) && newClient.gstin.length === 15 ? "border-rose-400 bg-rose-50/20" : "border-slate-200")}
                  />
                  {newClient.gstin && (
                    <p className={"text-[10px] mt-0.5 font-medium " + (isValidGSTIN(newClient.gstin) ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {isValidGSTIN(newClient.gstin) ? "✓ Valid GSTIN Format" : "15-char standard GSTIN format"}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">PAN (10 Chars)</label>
                    <span className={"text-[10px] font-mono font-bold " + (newClient.pan.length === 10 ? (isValidPAN(newClient.pan) ? "text-emerald-600" : "text-rose-500") : "text-slate-400")}>
                      {newClient.pan.length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AABCA7061K"
                    value={newClient.pan}
                    onChange={(e) => setNewClient(c => ({ ...c, pan: cleanPAN(e.target.value) }))}
                    className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono " + (newClient.pan && !isValidPAN(newClient.pan) && newClient.pan.length === 10 ? "border-rose-400 bg-rose-50/20" : "border-slate-200")}
                  />
                  {newClient.pan && (
                    <p className={"text-[10px] mt-0.5 font-medium " + (isValidPAN(newClient.pan) ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {isValidPAN(newClient.pan) ? "✓ Valid PAN Format" : "10-char PAN format (e.g. AABCA7061K)"}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Contact Phone (10 Digits)</label>
                    <span className={"text-[10px] font-mono font-bold " + (newClient.phone.length === 10 ? "text-emerald-600" : "text-slate-400")}>
                      {newClient.phone.length}/10
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9944121306"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(c => ({ ...c, phone: cleanPhone(e.target.value) }))}
                    className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono " + (newClient.phone && newClient.phone.length === 10 ? "border-emerald-400" : "border-slate-200")}
                  />
                  {newClient.phone && (
                    <p className={"text-[10px] mt-0.5 font-medium " + (newClient.phone.length === 10 ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {newClient.phone.length === 10 ? "✓ 10-Digit Mobile Number" : "Must be strictly 10 digits"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered State</label>
                  <select
                    value={newClient.state}
                    onChange={(e) => setNewClient(c => ({ ...c, state: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered Billing Address</label>
                <textarea
                  rows="2"
                  placeholder="Plot / Sy No, Industrial Area, City"
                  value={newClient.address}
                  onChange={(e) => setNewClient(c => ({ ...c, address: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-brand-green hover:bg-brand-green-dark text-white rounded-xl shadow-xs"
                >
                  Save & Select Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
