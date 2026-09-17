import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileCheck, 
  Truck, 
  Calendar, 
  MapPin, 
  Building2, 
  DollarSign, 
  Package, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  Printer,
  ChevronRight,
  Layers,
  Zap,
  TrendingUp,
  Receipt,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateProfit, db } from '../services/db';
import { INDIAN_STATES } from '../utils/indianStates';
import { 
  cleanPhone, isValidPhone, 
  cleanGSTIN, isValidGSTIN, extractPanFromGSTIN, 
  cleanPAN, isValidPAN 
} from '../utils/validation';
import logoImg from '../assets/logo.png';
import { InvoicePrintModal } from './InvoicePrintModal';

export function DirectInvoiceEntry({
  onBack,
  clients = [],
  vehicles = [],
  invoices = [],
  companySettings,
  onDirectInvoiceGenerated,
  onNavigateToPayments,
  onNavigateToStatusBoard,
  onQuickAddVehicle,
  onQuickAddClient,
}) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [defaultFromLocation, setDefaultFromLocation] = useState('');
  const [defaultToLocation, setDefaultToLocation] = useState('');
  const [consignor, setConsignor] = useState('');
  const [consignee, setConsignee] = useState('');
  const [gstPercent, setGstPercent] = useState(companySettings?.default_gst_percent || 5.0);
  const [notes, setNotes] = useState('Direct Multi-Trip Consignment Invoice');

  // Quick Add Vehicle / Client Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_number: '', vehicle_type: '19FT-SA-IIMT', owner_name: '', owner_phone: '' });
  const [activeVehicleTripIndex, setActiveVehicleTripIndex] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', gstin: '', pan: '', state: 'Tamil Nadu', address: '', phone: '' });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Post-generation Modal
  const [generatedResult, setGeneratedResult] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Auto-generate invoice number based on sequence
  useEffect(() => {
    const prefix = companySettings?.invoice_prefix || 'SRT-26-27/';
    const nextSeq = (invoices.length + 114);
    setInvoiceNumber(`${prefix}${nextSeq}`);
  }, [invoices.length, companySettings?.invoice_prefix]);

  // Sync client details when client selection changes
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (selectedClient) {
      setConsignor(selectedClient.name || '');
    } else {
      setConsignor('');
    }
  }, [selectedClient]);

  // Initial Trip Row template
  const createEmptyTrip = (index) => ({
    temp_id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    load_id: '220' + Math.floor(10000 + Math.random() * 90000),
    lr_number: '',
    loading_date: invoiceDate,
    vehicle_id: '',
    from_location: defaultFromLocation || '',
    to_location: defaultToLocation || '',
    packages: '',
    description: '',
    unit_type: 'MT', // 'MT' | 'kg' | 'boxes' | 'bags' | 'custom'
    custom_unit: '',
    charged_weight: '',
    rate: '',
    freight_amount: '',
    vehicle_freight: '',
  });

  const [tripRows, setTripRows] = useState([createEmptyTrip(0)]);

  // Add a new trip row
  const handleAddTripRow = () => {
    setTripRows(prev => [...prev, createEmptyTrip(prev.length)]);
  };

  // Remove a trip row
  const handleRemoveTripRow = (index) => {
    if (tripRows.length <= 1) return;
    setTripRows(prev => prev.filter((_, i) => i !== index));
  };

  // Update a field in a specific trip row
  const handleUpdateTripRow = (index, field, value) => {
    setTripRows(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      // Auto-compute freight_amount when weight or rate changes
      if (field === 'charged_weight' || field === 'rate') {
        const weight = parseFloat(field === 'charged_weight' ? value : row.charged_weight) || 0;
        const rate = parseFloat(field === 'rate' ? value : row.rate) || 0;
        if (weight > 0 && rate > 0) {
          row.freight_amount = (Math.round(weight * rate * 100) / 100).toString();
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  // Bulk Apply Default Route to all trips
  const handleApplyDefaultRoute = () => {
    if (!defaultToLocation.trim()) return;
    setTripRows(prev => prev.map(r => ({
      ...r,
      from_location: defaultFromLocation,
      to_location: defaultToLocation
    })));
  };

  // Aggregated Summary Calculations
  const summaryMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalVehicleHire = 0;
    let totalWeightMT = 0;

    tripRows.forEach(t => {
      const freight = parseFloat(t.freight_amount) || 0;
      const vFreight = parseFloat(t.vehicle_freight) || 0;
      const weight = parseFloat(t.charged_weight) || 0;
      
      totalBilled += freight;
      totalVehicleHire += vFreight;
      if (t.unit_type === 'MT') {
        totalWeightMT += weight;
      }
    });

    const netProfit = totalBilled - totalVehicleHire;
    const marginPercent = totalBilled > 0 ? ((netProfit / totalBilled) * 100).toFixed(1) : 0;
    const gstAmount = Math.round((totalBilled * (parseFloat(gstPercent) || 5.0) / 100) * 100) / 100;

    return {
      tripsCount: tripRows.length,
      totalBilled,
      totalVehicleHire,
      netProfit,
      marginPercent,
      gstAmount,
      totalWeightMT
    };
  }, [tripRows, gstPercent]);

  // Quick Add Vehicle Form Submit
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
      if (activeVehicleTripIndex !== null) {
        handleUpdateTripRow(activeVehicleTripIndex, 'vehicle_id', saved.id);
      }
      setShowVehicleModal(false);
      setNewVehicle({ vehicle_number: '', vehicle_type: '19FT-SA-IIMT', owner_name: '', owner_phone: '' });
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Add Client Form Submit
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
        setSelectedClientId(saved.id);
        setConsignor(saved.name || '');
      }
      setShowClientModal(false);
      setNewClient({ name: '', gstin: '', pan: '', state: 'TAMIL NADU', address: '', phone: '' });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Direct Invoice
  const handleSubmitDirectInvoice = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedClientId) {
      setErrorMessage('Please select a Client for this direct invoice.');
      return;
    }

    if (!invoiceNumber.trim()) {
      setErrorMessage('Please enter an Invoice Number.');
      return;
    }

    // Validate all trip rows
    for (let i = 0; i < tripRows.length; i++) {
      const t = tripRows[i];
      if (!t.vehicle_id) {
        setErrorMessage(`Trip #${i + 1}: Please select a Vehicle.`);
        return;
      }
      if (!t.to_location.trim()) {
        setErrorMessage(`Trip #${i + 1}: Destination (To Location) is required.`);
        return;
      }
      const freight = parseFloat(t.freight_amount) || 0;
      if (freight <= 0) {
        setErrorMessage(`Trip #${i + 1}: Client Freight Amount must be greater than zero.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payloadTrips = tripRows.map(t => {
        const freightAmt = parseFloat(t.freight_amount) || 0;
        const vehicleAmt = parseFloat(t.vehicle_freight) || 0;
        const finalPackages = t.packages?.trim() 
          ? t.packages.trim() 
          : t.charged_weight 
          ? `${t.charged_weight} ${t.unit_type === 'custom' ? (t.custom_unit || 'Units') : t.unit_type}`
          : '';

        return {
          load_id: t.load_id || ('220' + Math.floor(10000 + Math.random() * 90000)),
          lr_number: t.lr_number.trim() || ('LR-' + (t.load_id || Math.floor(10000 + Math.random() * 90000))),
          loading_date: t.loading_date || invoiceDate,
          vehicle_id: t.vehicle_id,
          from_location: t.from_location || defaultFromLocation,
          to_location: t.to_location,
          consignor,
          consignee: consignee || selectedClient?.name || 'Consignee',
          packages: finalPackages,
          description: t.description || 'Commercial Freight Cargo',
          unit_type: t.unit_type,
          custom_unit: t.custom_unit,
          actual_weight: parseFloat(t.charged_weight) || 0,
          charged_weight: parseFloat(t.charged_weight) || 0,
          rate: parseFloat(t.rate) || 0,
          freight_amount: freightAmt,
          vehicle_freight: vehicleAmt,
        };
      });

      const result = await onDirectInvoiceGenerated({
        client_id: selectedClientId,
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        gst_percent: parseFloat(gstPercent) || 5.0,
        notes,
        trips: payloadTrips
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setGeneratedResult({
        invoice: result.invoice,
        trips: result.trips,
        client: selectedClient
      });

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create direct invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Back to Dashboard</span>
          </button>

          <div className="hidden md:flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <img src={logoImg} alt="Sri Ram Transport" className="h-8 w-auto object-contain" />
            <span className="text-xs font-black tracking-widest text-brand-navy uppercase">
              {companySettings?.company_name || 'Sri Ram Transport Group'}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            <Zap className="w-3 h-3 text-indigo-600" />
            <span>Fast-Track Direct Billing</span>
          </div>
          <h2 className="text-2xl font-black text-brand-navy font-display tracking-tight mt-1">
            Direct Invoice Entry
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Single-entry multi-trip creation — deposits directly into Completed & routes to Payments
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmitDirectInvoice} className="space-y-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2.5 shadow-sm animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1: Client & Invoice Configuration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  1. Client & Invoice Master Header
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select client and define unified invoice parameters for all trips below
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Reverse Charge Applicable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Client Selector */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                value={selectedClientId}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowClientModal(true);
                    return;
                  }
                  setSelectedClientId(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 transition"
              >
                <option value="">-- Select Client --</option>
                <option value="__add_new__" className="font-bold text-emerald-700 bg-emerald-50">
                  ➕ + Add New Client...
                </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.gstin ? `(${c.gstin})` : ''}
                  </option>
                ))}
              </select>
              {selectedClient ? (
                <div className="text-[11px] text-slate-500 flex items-center space-x-2 pt-0.5">
                  <span className="font-semibold text-slate-700">GSTIN: {selectedClient.gstin || 'Unregistered'}</span>
                  <span>·</span>
                  <span className="truncate">{selectedClient.address || selectedClient.state || 'Karnataka'}</span>
                </div>
              ) : (
                clients.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-medium pt-0.5 flex items-center space-x-1">
                    <span>⚠️ No clients registered. Click</span>
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="font-bold underline text-amber-800 hover:text-amber-900 cursor-pointer"
                    >
                      + Add Client
                    </button>
                    <span>to create one.</span>
                  </p>
                )
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Direct Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="SRT-26-27/115"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy font-mono focus:bg-white focus:border-brand-navy transition"
              />
              <span className="text-[10px] text-slate-400 block">Auto-sequenced or customize</span>
            </div>

            {/* Invoice Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Invoice Date *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  setInvoiceDate(e.target.value);
                  setTripRows(prev => prev.map(r => ({ ...r, loading_date: e.target.value })));
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-navy transition"
              />
            </div>

            {/* Consignor Display Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Billed Consignor Name</label>
              <input
                type="text"
                value={consignor}
                onChange={(e) => setConsignor(e.target.value)}
                placeholder="Ashirvad Pipes Pvt Ltd"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
              />
            </div>

            {/* Consignee / Delivery Target */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Consignee Target (Optional)</label>
              <input
                type="text"
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                placeholder="Distributor / Destination Branch"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
              />
            </div>

            {/* Default Route Helper */}
            <div className="space-y-1.5 md:col-span-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-gold-dark" />
                  <span>Default Route Helper</span>
                </span>
                <button
                  type="button"
                  onClick={handleApplyDefaultRoute}
                  className="text-[10px] font-bold text-brand-navy hover:underline cursor-pointer"
                >
                  Apply to All Trips Below
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="text"
                  value={defaultFromLocation}
                  onChange={(e) => setDefaultFromLocation(e.target.value)}
                  placeholder="From (e.g. Bangalore)"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
                <input
                  type="text"
                  value={defaultToLocation}
                  onChange={(e) => setDefaultToLocation(e.target.value)}
                  placeholder="To (e.g. Hosur, Chennai)"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Multi-Trip Line Items Builder */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center text-sm font-black shadow-sm">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-navy tracking-tight">
                  2. Consignment Trips ({tripRows.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Add multiple trips for this direct invoice. All trips enter Completed status immediately.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddTripRow}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold shadow-md hover:bg-brand-navy-light transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-brand-gold" />
              <span>+ Add Another Trip</span>
            </button>
          </div>

          {/* Individual Trip Rows */}
          <div className="space-y-4">
            {tripRows.map((row, index) => {
              const freight = parseFloat(row.freight_amount) || 0;
              const vFreight = parseFloat(row.vehicle_freight) || 0;
              const profit = calculateProfit(freight, vFreight);

              return (
                <div 
                  key={row.temp_id || index}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-slate-200/90 space-y-4 transition-all hover:border-slate-300"
                >
                  {/* Trip Card Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="font-extrabold text-slate-800">
                        Load #{row.load_id}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ⚡ Direct to Completed
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 block uppercase">Trip Profit</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ₹{Math.round(profit).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {tripRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTripRow(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trip Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
                    {/* Vehicle */}
                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700">Vehicle / Lorry *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVehicleTripIndex(index);
                            setShowVehicleModal(true);
                          }}
                          className="text-[10px] font-bold text-brand-navy hover:underline"
                        >
                          + Quick Add
                        </button>
                      </div>
                      <select
                        value={row.vehicle_id}
                        onChange={(e) => handleUpdateTripRow(index, 'vehicle_id', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-navy"
                      >
                        <option value="">-- Select Lorry --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.vehicle_number} ({v.vehicle_type || 'Truck'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Route */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">From *</label>
                      <input
                        type="text"
                        value={row.from_location}
                        onChange={(e) => handleUpdateTripRow(index, 'from_location', e.target.value)}
                        placeholder="Bangalore, Jigani"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* To Route */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">To Destination *</label>
                      <input
                        type="text"
                        value={row.to_location}
                        onChange={(e) => handleUpdateTripRow(index, 'to_location', e.target.value)}
                        placeholder="Hosur / Chennai"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* LR Number */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">LR # / Ref</label>
                      <input
                        type="text"
                        value={row.lr_number}
                        onChange={(e) => handleUpdateTripRow(index, 'lr_number', e.target.value)}
                        placeholder={`LR-${row.load_id}`}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* Loading Date */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Loading Date</label>
                      <input
                        type="date"
                        value={row.loading_date}
                        onChange={(e) => handleUpdateTripRow(index, 'loading_date', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* Packages / Description */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Cargo / Packages</label>
                      <input
                        type="text"
                        value={row.packages}
                        onChange={(e) => handleUpdateTripRow(index, 'packages', e.target.value)}
                        placeholder="e.g. 520 Bundles CPVC Pipes"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* Weight & Unit */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Charged Wt / Qty</label>
                      <div className="flex">
                        <input
                          type="number"
                          step="any"
                          value={row.charged_weight}
                          onChange={(e) => handleUpdateTripRow(index, 'charged_weight', e.target.value)}
                          placeholder="10.5"
                          className="w-full px-3 py-2 rounded-l-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-navy"
                        />
                        <select
                          value={row.unit_type}
                          onChange={(e) => handleUpdateTripRow(index, 'unit_type', e.target.value)}
                          className="px-2 py-2 rounded-r-xl bg-slate-100 border-y border-r border-slate-200 text-[11px] font-bold text-slate-700"
                        >
                          <option value="MT">MT</option>
                          <option value="kg">kg</option>
                          <option value="boxes">Boxes</option>
                          <option value="bags">Bags</option>
                        </select>
                      </div>
                    </div>

                    {/* Rate per Unit */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Rate / Unit (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={row.rate}
                        onChange={(e) => handleUpdateTripRow(index, 'rate', e.target.value)}
                        placeholder="1200"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* Client Freight Amount */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Client Freight (₹) *</label>
                      <input
                        type="number"
                        step="any"
                        value={row.freight_amount}
                        onChange={(e) => handleUpdateTripRow(index, 'freight_amount', e.target.value)}
                        placeholder="15000"
                        className="w-full px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-300 text-xs font-bold text-emerald-900 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    {/* Vehicle Freight / Lorry Hire */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Lorry Hire (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={row.vehicle_freight}
                        onChange={(e) => handleUpdateTripRow(index, 'vehicle_freight', e.target.value)}
                        placeholder="12000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Summary & Submission Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/90 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Trips</span>
              <span className="text-xl font-black text-slate-900">{summaryMetrics.tripsCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Client Freight</span>
              <span className="text-xl font-black text-emerald-900">
                ₹{Math.round(summaryMetrics.totalBilled).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lorry Hire Total</span>
              <span className="text-xl font-black text-slate-700">
                ₹{Math.round(summaryMetrics.totalVehicleHire).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Net Trip Margin</span>
              <span className="text-xl font-black text-brand-gold-dark">
                ₹{Math.round(summaryMetrics.netProfit).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-700 font-bold block">({summaryMetrics.marginPercent}%)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">GST 5% (Reverse Charge)</span>
              <span className="text-base font-black text-indigo-900">
                ₹{Math.round(summaryMetrics.gstAmount).toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-indigo-600 block">Client Payable</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              💡 Submitting will create all {summaryMetrics.tripsCount} trips directly as <strong className="text-emerald-700">Completed</strong> and generate invoice <strong className="text-brand-navy">{invoiceNumber}</strong> ready for <strong className="text-indigo-700">Payments & Settlements</strong>.
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || summaryMetrics.totalBilled <= 0}
                className="w-1/2 sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-xl bg-gradient-to-r from-brand-navy to-indigo-900 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Direct Entry...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-brand-gold" />
                    <span>Generate Direct Invoice & Route to Payments</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* SUCCESS POST-GENERATION MODAL */}
      {generatedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Direct Invoice Generated Successfully!
              </span>
              <h3 className="text-xl font-black text-brand-navy font-display">
                Invoice #{generatedResult.invoice?.invoice_number}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All {generatedResult.trips?.length} consignment trips bypassed In-Transit, were logged as Completed, and are now available in Payments.
              </p>
            </div>

            {/* Metric snapshot */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Client</span>
                <span className="font-bold text-slate-800 truncate block">{generatedResult.client?.name || 'Client'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Total Freight</span>
                <span className="font-black text-emerald-700">₹{Math.round(generatedResult.invoice?.sub_total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Trips Created</span>
                <span className="font-bold text-slate-800">{generatedResult.trips?.length} Loads</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPayments) {
                    onNavigateToPayments(generatedResult.trips[0]?.id);
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-indigo-200" />
                <span>Go Directly to Payments & Record Settlement</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-gold-dark" />
                  <span>View / Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToStatusBoard) {
                      onNavigateToStatusBoard();
                    } else {
                      onBack();
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Completed Board</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PRINT MODAL */}
      {showPrintModal && generatedResult && (
        <InvoicePrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          invoice={generatedResult.invoice}
          client={generatedResult.client}
          trips={generatedResult.trips}
          companySettings={companySettings}
        />
      )}

      {/* QUICK ADD VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Quick Add Vehicle to Fleet</h3>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Registration # *</label>
                <input
                  type="text"
                  required
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                  placeholder="TN-70-AB-1234"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                <input
                  type="text"
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  placeholder="19FT / 32FT / Taurus"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={newVehicle.owner_name}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, owner_name: e.target.value }))}
                  placeholder="Lorry Owner"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Owner Phone (10 Digits)</label>
                  <span className={"text-[10px] font-mono font-bold " + (newVehicle.owner_phone.length === 10 ? "text-emerald-600" : "text-slate-400")}>
                    {newVehicle.owner_phone.length}/10
                  </span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9845012345"
                  value={newVehicle.owner_phone}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, owner_phone: cleanPhone(e.target.value) }))}
                  className={"w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono " + (newVehicle.owner_phone && newVehicle.owner_phone.length === 10 ? "border-emerald-400" : "border-slate-200")}
                />
                {newVehicle.owner_phone && (
                  <p className={"text-[10px] mt-0.5 font-medium " + (newVehicle.owner_phone.length === 10 ? "text-emerald-600 font-bold" : "text-slate-400")}>
                    {newVehicle.owner_phone.length === 10 ? "✓ 10-Digit Mobile Number" : "Must be strictly 10 digits"}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-navy text-white font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-display">Add New Client (Consignee Billed)</h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Legal Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ashirvad Pipes Pvt Ltd"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:bg-white focus:border-brand-navy focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    value={newClient.gstin}
                    onChange={(e) => {
                      const gstin = cleanGSTIN(e.target.value);
                      const pan = gstin.length >= 12 ? extractPanFromGSTIN(gstin) : newClient.pan;
                      setNewClient(prev => ({ ...prev, gstin, pan }));
                    }}
                    placeholder="e.g. 29AABCA7061K1ZH"
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
                    onChange={(e) => setNewClient(prev => ({ ...prev, pan: cleanPAN(e.target.value) }))}
                    className={"w-full px-3.5 py-2 border rounded-xl text-sm font-mono " + (newClient.pan && !isValidPAN(newClient.pan) && newClient.pan.length === 10 ? "border-rose-400 bg-rose-50/20" : "border-slate-200")}
                  />
                  {newClient.pan && (
                    <p className={"text-[10px] mt-0.5 font-medium " + (isValidPAN(newClient.pan) ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {isValidPAN(newClient.pan) ? "✓ Valid PAN Format" : "10-char PAN format (e.g. AABCA7061K)"}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: cleanPhone(e.target.value) }))}
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
                    onChange={(e) => setNewClient(prev => ({ ...prev, state: e.target.value }))}
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
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Plot / Sy No, Industrial Area, City"
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
