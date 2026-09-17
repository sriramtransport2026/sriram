import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  FileText, 
  Calendar, 
  Building2, 
  TrendingUp, 
  ChevronRight, 
  X, 
  DollarSign, 
  ShieldCheck, 
  FileCheck,
  Receipt,
  User,
  Hash,
  Sparkles
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export function PaymentsView({
  onBack,
  trips = [],
  clients = [],
  companySettings,
  onSavePayment,
  initialSelectedTripId = null,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'advance' | 'half_payment' | 'full_payment'
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  
  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [paymentType, setPaymentType] = useState('advance'); // 'advance' | 'half_payment' | 'full_payment'
  const [paymentMode, setPaymentMode] = useState('online'); // 'cash' | 'online'
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // History / Receipts Modal State
  const [historyTrip, setHistoryTrip] = useState(null);

  // Handle direct navigation from Reports or elsewhere with pre-selected trip
  React.useEffect(() => {
    if (initialSelectedTripId) {
      const target = trips.find(t => t.id === initialSelectedTripId);
      if (target) {
        handleOpenPaymentModal(target);
      }
    }
  }, [initialSelectedTripId, trips]);

  // Compute derived payment metrics for each trip
  const tripsWithPayments = useMemo(() => {
    return trips.map(t => {
      const freight = parseFloat(t.freight_amount) || 0;
      const totalPaid = parseFloat(t.total_paid_amount) || (t.payment_status === 'full_payment' ? freight : (parseFloat(t.advance_paid) || 0));
      const balance = t.balance_amount !== undefined ? parseFloat(t.balance_amount) : Math.max(0, freight - totalPaid);
      
      let computedStatus = t.payment_status || 'pending';
      if (!t.payment_status) {
        if (balance <= 0 && freight > 0) computedStatus = 'full_payment';
        else if (totalPaid >= freight * 0.45 && totalPaid < freight) computedStatus = 'half_payment';
        else if (totalPaid > 0) computedStatus = 'advance';
        else computedStatus = 'pending';
      }

      return {
        ...t,
        freightAmount: freight,
        totalPaidAmount: totalPaid,
        balanceAmount: balance,
        status: computedStatus
      };
    });
  }, [trips]);

  // Tab counts
  const pendingCount = tripsWithPayments.filter(t => t.status === 'pending').length;
  const advanceCount = tripsWithPayments.filter(t => t.status === 'advance').length;
  const halfCount = tripsWithPayments.filter(t => t.status === 'half_payment').length;
  const fullCount = tripsWithPayments.filter(t => t.status === 'full_payment').length;

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return tripsWithPayments.filter(trip => {
      // Tab filter
      if (activeTab !== 'all' && trip.status !== activeTab) {
        return false;
      }
      // Client filter
      if (clientFilter !== 'all' && trip.client_id !== clientFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesLoad = (trip.load_id || '').toLowerCase().includes(q);
        const matchesLr = (trip.lr_number || '').toLowerCase().includes(q);
        const matchesConsignor = (trip.consignor || '').toLowerCase().includes(q);
        const matchesConsignee = (trip.consignee || '').toLowerCase().includes(q);
        const matchesTo = (trip.to_location || '').toLowerCase().includes(q);
        if (!matchesLoad && !matchesLr && !matchesConsignor && !matchesConsignee && !matchesTo) {
          return false;
        }
      }
      return true;
    });
  }, [tripsWithPayments, activeTab, clientFilter, searchQuery]);

  // Aggregate KPI summary metrics
  const totalBilled = tripsWithPayments.reduce((acc, t) => acc + t.freightAmount, 0);
  const totalCollected = tripsWithPayments.reduce((acc, t) => acc + t.totalPaidAmount, 0);
  const totalBalance = tripsWithPayments.reduce((acc, t) => acc + t.balanceAmount, 0);
  const totalAdvanceCollected = tripsWithPayments.filter(t => t.status === 'advance').reduce((acc, t) => acc + t.totalPaidAmount, 0);

  // Open Payment Modal
  const handleOpenPaymentModal = (trip, defaultType = 'advance') => {
    setSelectedTrip(trip);
    setPaymentType(defaultType);
    setPaymentMode('online');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPayerName(trip.consignor || trip.client_name || '');
    setUtrNumber('');
    setNotes('');

    const remaining = trip.balanceAmount !== undefined ? trip.balanceAmount : Math.max(0, (parseFloat(trip.freight_amount) || 0) - (parseFloat(trip.total_paid_amount) || 0));

    if (defaultType === 'full_payment') {
      setAmount(remaining.toString());
    } else if (defaultType === 'half_payment') {
      setAmount(Math.round(remaining / 2).toString());
    } else {
      setAmount(Math.round(remaining * 0.4 || remaining).toString());
    }

    setIsModalOpen(true);
  };

  // Change payment type within modal with smart amount prefill
  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (!selectedTrip) return;
    const remaining = selectedTrip.balanceAmount !== undefined ? selectedTrip.balanceAmount : Math.max(0, (parseFloat(selectedTrip.freight_amount) || 0) - (parseFloat(selectedTrip.total_paid_amount) || 0));

    if (type === 'full_payment') {
      setAmount(remaining.toString());
    } else if (type === 'half_payment') {
      setAmount(Math.round(remaining / 2).toString());
    } else {
      setAmount(Math.round(remaining * 0.4 || remaining).toString());
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (paymentMode === 'online' && !utrNumber.trim()) {
      alert('Please enter Bank Reference / UTR Number for online transfer.');
      return;
    }

    setIsSaving(true);
    try {
      await onSavePayment({
        trip_id: selectedTrip.id,
        load_id: selectedTrip.load_id,
        lr_number: selectedTrip.lr_number || null,
        client_id: selectedTrip.client_id || null,
        client_name: selectedTrip.consignor || selectedTrip.client_name || '',
        total_freight: selectedTrip.freightAmount || parseFloat(selectedTrip.freight_amount) || 0,
        payment_type: paymentType,
        payment_mode: paymentMode,
        amount: payAmount,
        payer_name: payerName.trim(),
        utr_number: paymentMode === 'online' ? utrNumber.trim() : null,
        payment_date: paymentDate,
        notes: notes.trim(),
      });

      setToastMessage({
        type: 'success',
        text: `₹${payAmount.toLocaleString('en-IN')} ${paymentType.replace('_', ' ').toUpperCase()} recorded successfully!`
      });
      setTimeout(() => setToastMessage(null), 4000);

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save payment: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Dashboard</span>
          </button>

          <div className="hidden md:flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <img src={logoImg} alt="Sri Ram Group" className="h-8 w-auto object-contain" />
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

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Collections & Settlements
          </span>
          <h1 className="text-xl font-black text-brand-navy font-display">
            Payments Module
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Advance, Half Payment & Full Clearance with Cash / Online UTR audit logs.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-scale-up shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Freight Billed */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Freight Billed</span>
            <div className="p-2 rounded-xl bg-slate-100 text-brand-navy">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-slate-900">
            ₹{Number(totalBilled).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">{tripsWithPayments.length} Active Loads</p>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-emerald-200/80 space-y-2 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Collected</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-emerald-700">
            ₹{Number(totalCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Recovered in Bank / Cash</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-rose-200/80 space-y-2 bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between text-rose-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Balance</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-rose-700">
            ₹{Number(totalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-rose-600 font-medium">To be collected from clients</p>
        </div>

        {/* Advances Collected */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-amber-200/80 space-y-2 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Advance In-Hand</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-amber-800">
            ₹{Number(totalAdvanceCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-amber-700 font-medium">{advanceCount} Consignments on Advance</p>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 space-y-4">
        
        {/* Status Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Consignments</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {tripsWithPayments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Payment</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-800'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'advance'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Advance</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'advance' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {advanceCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('half_payment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'half_payment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Half Payment (Partial)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'half_payment' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'
            }`}>
              {halfCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('full_payment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'full_payment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Full Payment (Settled)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'full_payment' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {fullCount}
            </span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Load ID, LR, Consignor, Route..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Client:</span>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-navy"
              >
                <option value="all">All Clients ({clients.length})</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Consignments & Payments Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                <th className="py-4 px-6">Consignment / Load ID</th>
                <th className="py-4 px-4">Client / Destination</th>
                <th className="py-4 px-4 text-right">Freight Billed</th>
                <th className="py-4 px-4 text-right">Paid So Far</th>
                <th className="py-4 px-4 text-right">Balance Due</th>
                <th className="py-4 px-4 text-center">Payment Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600">No payment records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try changing the status tab or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Load ID & LR */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              #{trip.load_id}
                            </span>
                            {trip.lr_number && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-black">
                                LR: {trip.lr_number}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{trip.loading_date}</span>
                          </span>
                        </div>
                      </td>

                      {/* Client / Destination */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-bold text-slate-900">{trip.consignor || 'Ashirvad Pipes Pvt Ltd'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {trip.from_location} → <strong className="text-slate-700">{trip.to_location}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Freight Billed */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{trip.freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid So Far */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{trip.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Balance Due */}
                      <td className="py-4 px-4 text-right font-mono font-black text-rose-600">
                        ₹{trip.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {trip.status === 'full_payment' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Full Payment</span>
                          </span>
                        )}
                        {trip.status === 'half_payment' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>Half Payment</span>
                          </span>
                        )}
                        {trip.status === 'advance' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                            <Banknote className="w-3 h-3 text-amber-700" />
                            <span>Advance</span>
                          </span>
                        )}
                        {trip.status === 'pending' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {trip.balanceAmount > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(trip, trip.totalPaidAmount === 0 ? 'advance' : 'half_payment')}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-brand-gold" />
                              <span>Record Payment</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Settled</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          RECORD PAYMENT MODAL (ADVANCE / HALF PAYMENT / FULL PAYMENT)
         ========================================================================= */}
      {isModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-brand-navy text-brand-gold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy font-display">
                    Record Payment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Load #{selectedTrip.load_id} · {selectedTrip.consignor || 'Ashirvad Pipes'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Financial Snapshot Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Billed</span>
                <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                  ₹{selectedTrip.freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Paid So Far</span>
                <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                  ₹{selectedTrip.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600">Balance Due</span>
                <p className="text-sm font-black font-mono text-rose-700 mt-0.5">
                  ₹{selectedTrip.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-5">
              
              {/* Step 1: Select Payment Type */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Select Payment Action Type *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  
                  {/* Advance */}
                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange('advance')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                      paymentType === 'advance'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Banknote className={`w-4 h-4 ${paymentType === 'advance' ? 'text-amber-700' : 'text-slate-400'}`} />
                      <span className={`w-2 h-2 rounded-full ${paymentType === 'advance' ? 'bg-amber-600' : 'bg-transparent'}`} />
                    </div>
                    <span className="text-xs font-black text-slate-800">Advance</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Booking deposit</span>
                  </button>

                  {/* Half Payment */}
                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange('half_payment')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                      paymentType === 'half_payment'
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className={`w-4 h-4 ${paymentType === 'half_payment' ? 'text-blue-700' : 'text-slate-400'}`} />
                      <span className={`w-2 h-2 rounded-full ${paymentType === 'half_payment' ? 'bg-blue-600' : 'bg-transparent'}`} />
                    </div>
                    <span className="text-xs font-black text-slate-800">Half Payment</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Partial ~50% installment</span>
                  </button>

                  {/* Full Payment */}
                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange('full_payment')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                      paymentType === 'full_payment'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CheckCircle2 className={`w-4 h-4 ${paymentType === 'full_payment' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className={`w-2 h-2 rounded-full ${paymentType === 'full_payment' ? 'bg-emerald-600' : 'bg-transparent'}`} />
                    </div>
                    <span className="text-xs font-black text-slate-800">Full Payment</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Clear 100% balance</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Select Payment Mode (Cash vs Online) */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition cursor-pointer ${
                      paymentMode === 'online'
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Online (NEFT / IMPS / UPI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition cursor-pointer ${
                      paymentMode === 'cash'
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Settlement</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Payment Details Inputs */}
              <div className="space-y-4 pt-1">
                
                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Amount to Collect (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-brand-navy"
                    />
                  </div>
                </div>

                {/* If Online: Show Payer Name & UTR Number */}
                {paymentMode === 'online' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Payer / Client Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="e.g. Ashirvad Finance Desk"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Bank Reference / UTR Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. CMS290184719"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                    </div>
                  </div>
                )}

                {/* If Cash: Handed by & Date */}
                {paymentMode === 'cash' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700">
                      Collected By / Handed By
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="e.g. Received in cash at Hosur counter"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>
                )}

                {/* Payment Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Remarks / Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional settlement notes"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>
                </div>
              </div>

              {/* Projected Balance After Payment */}
              {parseFloat(amount) > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-900">Remaining Balance After Payment:</span>
                  <span className="font-mono font-black text-blue-900 text-sm">
                    ₹{Math.max(0, selectedTrip.balanceAmount - parseFloat(amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Recording Payment...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
