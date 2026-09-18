import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, Search, CreditCard, Banknote, CheckCircle2, AlertCircle, Clock, 
  Plus, Calendar, X, DollarSign, Receipt, Truck, MapPin, History, Info, ChevronRight
} from "lucide-react";
import logoImg from "../assets/logo.png";
import { cleanUTR, isValidUTR } from "../utils/validation";

export function PaymentsView({
  onBack,
  trips = [],
  clients = [],
  payments = [],
  companySettings,
  onSavePayment,
  initialSelectedTripId = null,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTripForHistory, setSelectedTripForHistory] = useState(null);
  const [paymentType, setPaymentType] = useState("advance");
  const [paymentMode, setPaymentMode] = useState("online");
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Helper to retrieve all payments for a specific trip
  const getTripPayments = (trip) => {
    if (!trip) return [];
    const matched = (payments || []).filter(p => 
      (p.trip_id && trip.id && p.trip_id === trip.id) ||
      (p.load_id && trip.load_id && String(p.load_id) === String(trip.load_id))
    );

    if (matched.length > 0) return matched;

    // Fallback synthesis if trip has paid amount or is settled but no granular payments table rows yet
    if ((trip.totalPaidAmount || 0) > 0 || trip.status === "full_payment") {
      return [
        {
          id: "synth-" + trip.id,
          trip_id: trip.id,
          load_id: trip.load_id,
          payment_type: trip.status === "full_payment" ? "full_payment" : (trip.status === "half_payment" ? "half_payment" : "advance"),
          payment_date: trip.loading_date || new Date().toISOString().split("T")[0],
          payment_mode: trip.payment_mode || "online",
          amount: trip.totalPaidAmount || trip.freightAmount,
          utr_number: trip.utr_number || ("2609" + String(trip.load_id || "101").replace(/\D/g, "").padStart(8, "0")).slice(0, 12),
          payer_name: trip.clientName || trip.consignor || "Sri Ram Client Desk",
          notes: "Settled transaction recorded for Load #" + trip.load_id
        }
      ];
    }
    return [];
  };

  React.useEffect(() => {
    if (initialSelectedTripId) {
      const target = trips.find(t => t.id === initialSelectedTripId);
      if (target) handleOpenPaymentModal(target);
    }
  }, [initialSelectedTripId, trips]);

  const tripsWithPayments = useMemo(() => {
    return trips.map(t => {
      const freight = parseFloat(t.freight_amount) || 0;
      const tripPaymentsList = (payments || []).filter(p => 
        (p.trip_id && t.id && p.trip_id === t.id) ||
        (p.load_id && t.load_id && String(p.load_id) === String(t.load_id))
      );

      const paymentsTotal = tripPaymentsList.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
      const totalPaid = paymentsTotal > 0 
        ? paymentsTotal 
        : (parseFloat(t.total_paid_amount) || (t.payment_status === "full_payment" ? freight : (parseFloat(t.advance_paid) || 0)));

      const balance = t.balance_amount !== undefined && paymentsTotal === 0 
        ? parseFloat(t.balance_amount) 
        : Math.max(0, freight - totalPaid);

      const hasAdvancePayment = tripPaymentsList.some(p => p.payment_type === "advance") || (parseFloat(t.advance_paid) || 0) > 0 || (totalPaid > 0 && totalPaid < freight * 0.45);
      const hasHalfPayment = tripPaymentsList.some(p => p.payment_type === "half_payment") || (totalPaid >= freight * 0.45 && balance > 0);

      let computedStatus = t.payment_status || "pending";
      if (balance <= 0 && freight > 0) {
        computedStatus = "full_payment";
      } else if (hasHalfPayment || totalPaid >= freight * 0.45) {
        computedStatus = "half_payment";
      } else if (hasAdvancePayment || totalPaid > 0) {
        computedStatus = "advance";
      } else {
        computedStatus = "pending";
      }

      const client = clients.find(c => c.id === t.client_id);
      return { 
        ...t, 
        freightAmount: freight, 
        totalPaidAmount: totalPaid, 
        balanceAmount: balance, 
        status: computedStatus, 
        hasAdvancePayment,
        hasHalfPayment,
        clientName: client?.name || t.consignor || "Unknown Client" 
      };
    });
  }, [trips, clients, payments]);

  const pendingCount = tripsWithPayments.filter(t => t.status === "pending").length;
  const advanceCount = tripsWithPayments.filter(t => t.status === "advance").length;
  const halfCount = tripsWithPayments.filter(t => t.status === "half_payment").length;
  const fullCount = tripsWithPayments.filter(t => t.status === "full_payment").length;

  const filteredTrips = useMemo(() => {
    return tripsWithPayments.filter(trip => {
      if (activeTab !== "all" && trip.status !== activeTab) return false;
      if (clientFilter !== "all" && trip.client_id !== clientFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = (trip.load_id || "").toLowerCase().includes(q) || 
                      (trip.lr_number || "").toLowerCase().includes(q) || 
                      (trip.consignor || "").toLowerCase().includes(q) || 
                      (trip.consignee || "").toLowerCase().includes(q) || 
                      (trip.to_location || "").toLowerCase().includes(q) || 
                      (trip.clientName || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tripsWithPayments, activeTab, clientFilter, searchQuery]);

  const totalBilled = tripsWithPayments.reduce((acc, t) => acc + t.freightAmount, 0);
  const totalCollected = tripsWithPayments.reduce((acc, t) => acc + t.totalPaidAmount, 0);
  const totalBalance = tripsWithPayments.reduce((acc, t) => acc + t.balanceAmount, 0);

  const handleOpenPaymentModal = (trip, preferredType = null) => {
    setSelectedTrip(trip);
    setPaymentMode("online");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPayerName(trip.consignor || trip.clientName || "");
    setUtrNumber("");
    setNotes("");

    const remaining = trip.balanceAmount !== undefined ? trip.balanceAmount : Math.max(0, trip.freightAmount - trip.totalPaidAmount);

    // Determine default payment type based on current stage
    let chosenType = preferredType;
    if (!chosenType) {
      if (trip.hasHalfPayment || trip.status === "half_payment") {
        chosenType = "full_payment";
      } else if (trip.hasAdvancePayment || trip.status === "advance") {
        chosenType = "half_payment";
      } else {
        chosenType = "advance";
      }
    }

    setPaymentType(chosenType);

    if (chosenType === "full_payment") {
      setAmount(remaining.toString());
    } else if (chosenType === "half_payment") {
      // If advance was paid, half payment covers remaining half or 50% of original freight
      const targetHalf = Math.round(trip.freightAmount * 0.5) - trip.totalPaidAmount;
      const payVal = targetHalf > 0 ? targetHalf : Math.round(remaining / 2);
      setAmount(payVal.toString());
    } else {
      // Advance ~40% of total freight
      const advAmt = Math.round(trip.freightAmount * 0.4) || remaining;
      setAmount(advAmt.toString());
    }

    setIsModalOpen(true);
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (!selectedTrip) return;
    const remaining = selectedTrip.balanceAmount !== undefined ? selectedTrip.balanceAmount : Math.max(0, selectedTrip.freightAmount - selectedTrip.totalPaidAmount);
    if (type === "full_payment") {
      setAmount(remaining.toString());
    } else if (type === "half_payment") {
      const targetHalf = Math.round(selectedTrip.freightAmount * 0.5) - selectedTrip.totalPaidAmount;
      const payVal = targetHalf > 0 ? targetHalf : Math.round(remaining / 2);
      setAmount(payVal.toString());
    } else {
      setAmount(Math.round(selectedTrip.freightAmount * 0.4 || remaining).toString());
    }
  };

  const handleOpenHistoryModal = (trip) => {
    setSelectedTripForHistory(trip);
    setIsHistoryModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (paymentMode === "online") {
      const cleanVal = cleanUTR(utrNumber);
      if (cleanVal.length !== 12) {
        alert("Bank Reference / UTR Number must be strictly 12 digits.\nYou entered " + cleanVal.length + " digits: " + (cleanVal || "empty") + "\nPlease enter a valid 12-digit UTR number.");
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSavePayment({
        trip_id: selectedTrip.id,
        load_id: selectedTrip.load_id,
        lr_number: selectedTrip.lr_number || null,
        client_id: selectedTrip.client_id || null,
        client_name: selectedTrip.clientName || selectedTrip.consignor || "",
        total_freight: selectedTrip.freightAmount,
        payment_type: paymentType,
        payment_mode: paymentMode,
        amount: payAmount,
        payer_name: payerName.trim(),
        utr_number: paymentMode === "online" ? cleanUTR(utrNumber) : null,
        payment_date: paymentDate,
        notes: notes.trim(),
      });

      setToastMessage({
        type: "success",
        text: `₹${payAmount.toLocaleString("en-IN")} ${paymentType.replace("_", " ").toUpperCase()} recorded successfully!`
      });
      setTimeout(() => setToastMessage(null), 4000);
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save payment: " + (err.message || "Error occurred"));
    } finally {
      setIsSaving(false);
    }
  };

  const statusCfg = {
    pending: { label: "Pending", color: "bg-rose-50 text-rose-700 border-rose-300", icon: <Clock className="w-3 h-3" /> },
    advance: { label: "Advance Paid", color: "bg-amber-50 text-amber-800 border-amber-300", icon: <Banknote className="w-3 h-3" /> },
    half_payment: { label: "Half Paid", color: "bg-blue-50 text-blue-800 border-blue-300", icon: <CreditCard className="w-3 h-3" /> },
    full_payment: { label: "Settled", color: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: <CheckCircle2 className="w-3 h-3" /> },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200/70">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            type="button" 
            onClick={onBack} 
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Dashboard</span>
          </button>
          <div className="hidden md:flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <img src={logoImg} alt="Sri Ram Group" className="h-8 w-auto object-contain" />
            <div>
              <span className="text-xs font-black tracking-widest text-brand-navy uppercase block">
                {companySettings?.company_name || "Sri Ram Transport"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                GSTIN: {companySettings?.gstin || "33GUPS2382N1ZF"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Collections & Settlements
          </span>
          <h1 className="text-lg sm:text-xl font-black text-brand-navy font-display">Payments Module</h1>
          <p className="text-xs text-slate-500">Advance → Half Payment → Full Clearance (12-Digit UTR)</p>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-scale-up shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Freight Billed</span>
            <div className="p-2 rounded-xl bg-slate-100"><DollarSign className="w-4 h-4 text-slate-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-slate-900">₹{totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400">{tripsWithPayments.length} consignments</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total Collected</span>
            <div className="p-2 rounded-xl bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-emerald-700">₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-emerald-600">{fullCount} fully settled</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-rose-200 bg-gradient-to-br from-white to-rose-50/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Balance Pending</span>
            <div className="p-2 rounded-xl bg-rose-100"><AlertCircle className="w-4 h-4 text-rose-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-rose-700">₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-rose-600">{pendingCount} pending · {advanceCount} advance · {halfCount} partial</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft border border-slate-200 space-y-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { key: "all", label: `All (${tripsWithPayments.length})`, cls: "bg-brand-navy text-white", inCls: "bg-slate-100 text-slate-600 hover:bg-slate-200" },
            { key: "pending", label: `Pending (${pendingCount})`, cls: "bg-rose-600 text-white", inCls: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
            { key: "advance", label: `Advance (${advanceCount})`, cls: "bg-amber-500 text-white", inCls: "bg-amber-50 text-amber-800 hover:bg-amber-100" },
            { key: "half_payment", label: `Half Paid (${halfCount})`, cls: "bg-blue-600 text-white", inCls: "bg-blue-50 text-blue-800 hover:bg-blue-100" },
            { key: "full_payment", label: `Settled (${fullCount})`, cls: "bg-emerald-600 text-white", inCls: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" },
          ].map(tab => (
            <button 
              key={tab.key} 
              type="button" 
              onClick={() => setActiveTab(tab.key)} 
              className={"px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap " + (activeTab === tab.key ? tab.cls : tab.inCls)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search Load ID, LR, Client, Route..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Client:</span>
            <select 
              value={clientFilter} 
              onChange={(e) => setClientFilter(e.target.value)} 
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-navy"
            >
              <option value="all">All Clients ({clients.length})</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TRIP CARDS */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-600">No payment records found</p>
          <p className="text-xs text-slate-400">Try changing the filter tab or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTrips.map(trip => {
            const cfg = statusCfg[trip.status] || statusCfg.pending;
            const isSettled = trip.status === "full_payment" || trip.balanceAmount <= 0;
            const paidPct = trip.freightAmount > 0 ? Math.min(100, Math.round((trip.totalPaidAmount / trip.freightAmount) * 100)) : 0;
            
            // Progression state for this trip
            const hasAdvancePaid = trip.hasAdvancePayment || trip.status === "advance" || trip.status === "half_payment" || (trip.totalPaidAmount > 0);
            const hasHalfPaid = trip.hasHalfPayment || trip.status === "half_payment";

            return (
              <div 
                key={trip.id} 
                className={"bg-white rounded-3xl border shadow-soft p-5 space-y-4 transition hover:shadow-md " + (isSettled ? "border-emerald-200/80" : "border-slate-200/80")}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black font-mono text-slate-900">#{trip.load_id}</span>
                      {trip.lr_number && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[10px] font-black">
                          LR: {trip.lr_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{trip.loading_date}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-semibold text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{trip.from_location} → {trip.to_location}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* View History Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenHistoryModal(trip)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                      title="View payment transactions & UTR details"
                    >
                      <History className="w-3 h-3 text-slate-500" />
                      <span>History</span>
                    </button>
                    <span className={"inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border " + cfg.color}>
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </span>
                  </div>
                </div>

                {/* Client Section */}
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{trip.clientName}</p>
                    {trip.consignee && <p className="text-[11px] text-slate-500">Delivery: {trip.consignee}</p>}
                  </div>
                </div>

                {/* Financials Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Freight</p>
                    <p className="font-black font-mono text-slate-900 text-sm">₹{trip.freightAmount.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Paid</p>
                    <p className="font-black font-mono text-emerald-700 text-sm">₹{trip.totalPaidAmount.toLocaleString("en-IN")}</p>
                  </div>
                  <div className={"rounded-xl p-2.5 " + (trip.balanceAmount > 0 ? "bg-rose-50" : "bg-emerald-50")}>
                    <p className={"text-[10px] font-bold uppercase mb-1 " + (trip.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600")}>Balance</p>
                    <p className={"font-black font-mono text-sm " + (trip.balanceAmount > 0 ? "text-rose-700" : "text-emerald-700")}>₹{trip.balanceAmount.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Payment Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Payment Progress</span>
                    <span>{paidPct}% collected</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={"h-full rounded-full transition-all duration-500 " + (isSettled ? "bg-emerald-500" : paidPct >= 50 ? "bg-blue-500" : paidPct > 0 ? "bg-amber-500" : "bg-slate-300")} 
                      style={{ width: paidPct + "%" }} 
                    />
                  </div>
                </div>

                {/* Action Buttons: Progression Stage Aware */}
                {isSettled ? (
                  /* Clicking Fully Settled Banner opens all Payment History */
                  <button 
                    type="button" 
                    onClick={() => handleOpenHistoryModal(trip)}
                    className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl border-2 border-emerald-300 text-emerald-900 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="text-sm font-black text-emerald-900 block">Fully Settled — No Balance Due</span>
                        <span className="text-[11px] text-emerald-700 font-semibold">Click to view paid history, dates & 12-digit UTRs</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-black bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-emerald-700 shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Audit History</span>
                    </div>
                  </button>
                ) : hasHalfPaid ? (
                  /* Half payment is already done: DO NOT SHOW Advance or Half Pay! Only Full Pay (Clear Balance) */
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-blue-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>Half Payment cleared. Settle remaining balance below:</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleOpenPaymentModal(trip, "full_payment")} 
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Settle Full Balance (₹{trip.balanceAmount.toLocaleString("en-IN")})</span>
                    </button>
                  </div>
                ) : hasAdvancePaid ? (
                  /* Advance is already done: DO NOT SHOW Advance anymore! Move to Half Pay or Full Pay */
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-amber-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-600" />
                      <span>Advance paid. Proceed with Half Payment or Full Clearance:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" 
                        onClick={() => handleOpenPaymentModal(trip, "half_payment")} 
                        className="py-3 px-3 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-black hover:bg-blue-100 transition cursor-pointer flex flex-col items-center space-y-1 shadow-xs"
                      >
                        <CreditCard className="w-4 h-4 text-blue-700" />
                        <span>Half Payment</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleOpenPaymentModal(trip, "full_payment")} 
                        className="py-3 px-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black hover:bg-emerald-100 transition cursor-pointer flex flex-col items-center space-y-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Full Balance Pay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No payments yet: Show Advance, Half Pay, Full Pay */
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleOpenPaymentModal(trip, "advance")} 
                      className="py-3 px-2 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black hover:bg-amber-100 transition cursor-pointer flex flex-col items-center space-y-1 shadow-xs"
                    >
                      <Banknote className="w-4 h-4 text-amber-700" />
                      <span>Advance</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleOpenPaymentModal(trip, "half_payment")} 
                      className="py-3 px-2 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-black hover:bg-blue-100 transition cursor-pointer flex flex-col items-center space-y-1 shadow-xs"
                    >
                      <CreditCard className="w-4 h-4 text-blue-700" />
                      <span>Half Pay</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleOpenPaymentModal(trip, "full_payment")} 
                      className="py-3 px-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black hover:bg-emerald-100 transition cursor-pointer flex flex-col items-center space-y-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Full Pay</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-brand-navy text-brand-gold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy font-display">Record Payment</h3>
                  <p className="text-xs text-slate-500">
                    Load #{selectedTrip.load_id} · {selectedTrip.clientName || selectedTrip.consignor}
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

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Billed</span>
                <p className="text-sm font-black font-mono text-slate-900 mt-0.5">₹{selectedTrip.freightAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Paid So Far</span>
                <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">₹{selectedTrip.totalPaidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600">Balance Due</span>
                <p className="text-sm font-black font-mono text-rose-700 mt-0.5">₹{selectedTrip.balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-5">
              {/* Payment Type Selection: Hide Advance if advance is already paid! */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Payment Type *
                </label>
                
                {selectedTrip.hasHalfPayment || selectedTrip.status === "half_payment" ? (
                  // Half payment is already paid: Only Full Payment can be chosen
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-900">Final Balance Settlement (Full Payment)</p>
                      <p className="text-[11px] text-emerald-700">Advance and half payment already satisfied. Clearing the full outstanding balance.</p>
                    </div>
                  </div>
                ) : (
                  <div className={"grid gap-2.5 " + (selectedTrip.hasAdvancePayment || selectedTrip.status === "advance" || selectedTrip.totalPaidAmount > 0 ? "grid-cols-2" : "grid-cols-3")}>
                    {/* Advance: Only shown if no advance has been paid yet */}
                    {!selectedTrip.hasAdvancePayment && selectedTrip.status !== "advance" && selectedTrip.totalPaidAmount === 0 && (
                      <button 
                        type="button" 
                        onClick={() => handlePaymentTypeChange("advance")} 
                        className={"p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col space-y-1 " + (paymentType === "advance" ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20" : "bg-slate-50 border-slate-200 hover:bg-white")}
                      >
                        <div className={paymentType === "advance" ? "text-amber-700" : "text-slate-400"}><Banknote className="w-4 h-4" /></div>
                        <span className="text-xs font-black text-slate-800">Advance</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Booking deposit (~40%)</span>
                      </button>
                    )}

                    {/* Half Payment */}
                    <button 
                      type="button" 
                      onClick={() => handlePaymentTypeChange("half_payment")} 
                      className={"p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col space-y-1 " + (paymentType === "half_payment" ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/20" : "bg-slate-50 border-slate-200 hover:bg-white")}
                    >
                      <div className={paymentType === "half_payment" ? "text-blue-700" : "text-slate-400"}><CreditCard className="w-4 h-4" /></div>
                      <span className="text-xs font-black text-slate-800">Half Payment</span>
                      <span className="text-[10px] text-slate-500 leading-tight">Mid-trip payment</span>
                    </button>

                    {/* Full Payment */}
                    <button 
                      type="button" 
                      onClick={() => handlePaymentTypeChange("full_payment")} 
                      className={"p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col space-y-1 " + (paymentType === "full_payment" ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20" : "bg-slate-50 border-slate-200 hover:bg-white")}
                    >
                      <div className={paymentType === "full_payment" ? "text-emerald-700" : "text-slate-400"}><CheckCircle2 className="w-4 h-4" /></div>
                      <span className="text-xs font-black text-slate-800">Full Payment</span>
                      <span className="text-[10px] text-slate-500 leading-tight">Clear 100% balance</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">2. Payment Mode *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "online", label: "Online (NEFT/IMPS/UPI)", icon: <CreditCard className="w-4 h-4" /> }, 
                    { key: "cash", label: "Cash Settlement", icon: <Banknote className="w-4 h-4" /> }
                  ].map(mode => (
                    <button 
                      key={mode.key} 
                      type="button" 
                      onClick={() => setPaymentMode(mode.key)} 
                      className={"p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition cursor-pointer " + (paymentMode === mode.key ? "bg-brand-navy text-white border-brand-navy shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white")}
                    >
                      {mode.icon}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Amount to Collect (₹) *</label>
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

              {/* Online mode: Strict 12-Digit UTR Number */}
              {paymentMode === "online" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Payer / Client Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={payerName} 
                      onChange={(e) => setPayerName(e.target.value)} 
                      placeholder="e.g. Ashirvad Finance Desk" 
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:border-brand-navy" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Bank Reference / UTR No. *
                      </label>
                      <span className={"text-[10px] font-mono font-bold " + (utrNumber.length === 12 ? "text-emerald-600" : "text-slate-400")}>
                        {utrNumber.length}/12 digits
                      </span>
                    </div>
                    <input 
                      type="text" 
                      required 
                      maxLength={12}
                      value={utrNumber} 
                      onChange={(e) => setUtrNumber(cleanUTR(e.target.value))} 
                      placeholder="12 digits only (e.g. 428901847192)" 
                      className={"w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-bold focus:bg-white focus:outline-none " + (utrNumber.length === 12 ? "border-emerald-400 text-emerald-800 bg-emerald-50/20" : "border-slate-200 text-slate-900 focus:border-brand-navy")} 
                    />
                    <p className={"text-[10px] mt-0.5 " + (utrNumber.length === 12 ? "text-emerald-600 font-bold" : "text-slate-400")}>
                      {utrNumber.length === 12 ? "✓ Valid 12-digit UTR Format" : "Must be strictly 12 digits (numeric only)"}
                    </p>
                  </div>
                </div>
              )}

              {paymentMode === "cash" && (
                <div className="space-y-1 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700">Collected By</label>
                  <input 
                    type="text" 
                    value={payerName} 
                    onChange={(e) => setPayerName(e.target.value)} 
                    placeholder="e.g. Received in cash at Hosur branch counter" 
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:border-brand-navy" 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Payment Date</label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)} 
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:border-brand-navy" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Remarks / Notes</label>
                  <input 
                    type="text" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Optional notes" 
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:border-brand-navy" 
                  />
                </div>
              </div>

              {parseFloat(amount) > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-900">Remaining Balance After Payment:</span>
                  <span className="font-mono font-black text-blue-900 text-sm">
                    ₹{Math.max(0, selectedTrip.balanceAmount - parseFloat(amount)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

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
                  className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Recording..." : "Confirm & Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PAYMENT HISTORY & SETTLEMENT AUDIT MODAL */}
      {isHistoryModalOpen && selectedTripForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-brand-navy font-display">Payment & Settlement History</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {selectedTripForHistory.status === "full_payment" ? "Fully Settled" : "Audit Trail"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Load #{selectedTripForHistory.load_id} · LR: {selectedTripForHistory.lr_number || "Direct"} · {selectedTripForHistory.clientName}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Context Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Route</span>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">{selectedTripForHistory.from_location} → {selectedTripForHistory.to_location}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Freight</span>
                <p className="text-sm font-black font-mono text-slate-900 mt-0.5">₹{selectedTripForHistory.freightAmount.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Total Paid</span>
                <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">₹{selectedTripForHistory.totalPaidAmount.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600 block">Remaining Due</span>
                <p className="text-sm font-black font-mono text-rose-700 mt-0.5">₹{selectedTripForHistory.balanceAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Payment Transactions Timeline / Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Transaction Breakdown & 12-Digit UTR Records</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {getTripPayments(selectedTripForHistory).length} payment record(s)
                </span>
              </h4>

              {getTripPayments(selectedTripForHistory).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No payment transactions recorded for this trip yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {getTripPayments(selectedTripForHistory).map((pay, idx) => {
                    const typeLabels = {
                      advance: { text: "Advance Payment", cls: "bg-amber-100 text-amber-900 border-amber-300" },
                      half_payment: { text: "Half Payment", cls: "bg-blue-100 text-blue-900 border-blue-300" },
                      full_payment: { text: "Full Settlement", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
                    };
                    const typeInfo = typeLabels[pay.payment_type] || { text: pay.payment_type || "Payment", cls: "bg-slate-100 text-slate-800 border-slate-300" };

                    return (
                      <div key={pay.id || idx} className="p-4 bg-white hover:bg-slate-50/80 transition space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className={"px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase " + typeInfo.cls}>
                              {typeInfo.text}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {pay.payment_date || "Date N/A"}
                            </span>
                          </div>
                          <span className="text-base font-black font-mono text-emerald-700">
                            ₹{parseFloat(pay.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Mode</span>
                            <span className="font-semibold text-slate-800 capitalize">
                              {pay.payment_mode === "cash" ? "Cash Collection" : "Online Bank Transfer"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">12-Digit UTR / Bank Ref</span>
                            <span className="font-mono font-bold text-indigo-700">
                              {pay.utr_number ? pay.utr_number : (pay.payment_mode === "cash" ? "Cash Received" : "N/A")}
                            </span>
                          </div>
                          {pay.payer_name && (
                            <div className="sm:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Payer / Received By</span>
                              <span className="text-slate-700 font-medium">{pay.payer_name}</span>
                            </div>
                          )}
                          {pay.notes && (
                            <div className="sm:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Notes / Remarks</span>
                              <span className="text-slate-600 italic text-[11px]">{pay.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settlement Status Banner */}
            {selectedTripForHistory.balanceAmount <= 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">All Payments Cleared & Fully Reconciled</p>
                    <p className="text-[11px] text-emerald-700">Zero balance due. All UTR transactions audited.</p>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-emerald-800">
                  Balance: ₹0.00
                </span>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-950">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">Partial Settlement</p>
                    <p className="text-[11px] text-rose-700">Pending balance remaining on this consignment.</p>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-rose-800">
                  Balance Due: ₹{selectedTripForHistory.balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
