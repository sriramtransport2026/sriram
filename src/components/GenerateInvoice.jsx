import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  CheckSquare, 
  Square, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  History,
  RotateCcw,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { numberToIndianWords } from '../utils/numberToWords';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';
import { InvoicePrintModal } from './InvoicePrintModal';
import logoImg from '../assets/logo.png';

export function GenerateInvoice({ 
  onBack, 
  clients = [], 
  trips = [], 
  invoices = [], 
  companySettings, 
  onGenerateInvoice 
}) {
  const ITEMS_PER_PAGE = 10;
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pagination & Search state for Generated Invoices History (10 per page)
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // Modal for reviewing / printing newly generated or past invoice
  const [viewInvoiceModal, setViewInvoiceModal] = useState({
    isOpen: false,
    invoice: null,
    client: null,
    trips: [],
  });

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Filter completed and un-invoiced trips for the selected client
  const availableTrips = useMemo(() => {
    return trips
      .filter(t => t.client_id === selectedClientId && t.status === 'completed' && !t.invoiced)
      .sort((a, b) => new Date(a.loading_date) - new Date(b.loading_date)); // oldest first
  }, [trips, selectedClientId]);

  // Default: Pre-select oldest 10 trips whenever client changes or available trips update
  useEffect(() => {
    const oldestTen = availableTrips.slice(0, 10).map(t => t.id);
    setSelectedTripIds(oldestTen);
  }, [selectedClientId, availableTrips.length]);

  // Auto-generate invoice number based on sequence
  useEffect(() => {
    const prefix = companySettings?.invoice_prefix || 'SRT-26-27/';
    const nextSeq = (invoices.length + 114); // Matches 114 from sample invoice
    setInvoiceNumber(`${prefix}${nextSeq}`);
  }, [invoices.length, companySettings?.invoice_prefix]);

  const toggleTrip = (id) => {
    setSelectedTripIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTripIds(availableTrips.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTripIds([]);
  };

  const selectTop10 = () => {
    setSelectedTripIds(availableTrips.slice(0, 10).map(t => t.id));
  };

  // Financial calculations
  const selectedTrips = availableTrips.filter(t => selectedTripIds.includes(t.id));
  const subTotal = selectedTrips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
  const gstPercent = companySettings?.default_gst_percent || 5.00;
  const gstAmount = Math.round((subTotal * gstPercent / 100) * 100) / 100;
  const netAmount = subTotal; // Reverse charge
  const amountWords = numberToIndianWords(netAmount);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMsg('Please choose a client.');
      return;
    }
    if (selectedTripIds.length === 0) {
      setErrorMsg('Please select at least one completed trip to invoice.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setErrorMsg('Invoice number cannot be empty.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');

    try {
      const createdInvoice = await onGenerateInvoice({
        clientId: selectedClientId,
        tripIds: selectedTripIds,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        gstPercent,
        notes,
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (cErr) {}

      // Reset history pagination to page 1 so newly created invoice is at the top of page 1
      setHistoryCurrentPage(1);
      setHistorySearchTerm('');

      // Open print/download modal immediately
      setViewInvoiceModal({
        isOpen: true,
        invoice: createdInvoice,
        client: selectedClient,
        trips: selectedTrips,
      });

    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate tax invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPastInvoice = (inv) => {
    const invClient = inv.client || clients.find(c => c.id === inv.client_id) || null;
    const invTrips = (inv.trips && inv.trips.length > 0) ? inv.trips : trips.filter(t => t.invoice_id === inv.id);
    setViewInvoiceModal({
      isOpen: true,
      invoice: inv,
      client: invClient,
      trips: invTrips,
    });
  };

  // Filter invoices for active search query
  const filteredInvoices = useMemo(() => {
    if (!historySearchTerm.trim()) return invoices;
    const term = historySearchTerm.toLowerCase().trim();
    return invoices.filter(inv => {
      const clientName = (inv.client?.name || clients.find(c => c.id === inv.client_id)?.name || '').toLowerCase();
      const invNum = (inv.invoice_number || '').toLowerCase();
      const invDate = (inv.invoice_date || '').toLowerCase();
      const netAmt = (inv.net_amount ? String(inv.net_amount) : '').toLowerCase();
      return invNum.includes(term) || clientName.includes(term) || invDate.includes(term) || netAmt.includes(term);
    });
  }, [invoices, historySearchTerm, clients]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, historyCurrentPage), totalHistoryPages);

  const paginatedInvoices = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, safeCurrentPage]);

  const startRecordIndex = filteredInvoices.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecordIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredInvoices.length);

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
            <span className="text-xs font-black tracking-widest text-brand-navy uppercase">Sri Ram Transport</span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Billing & GST Desk
          </span>
          <h2 className="text-xl font-black text-brand-navy font-display">Generate Tax Invoice</h2>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-rose-800 text-sm flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Client Selection & Completed Trips Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection Card */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Building2 className="w-4 h-4 text-brand-navy" />
                <span>Select Client for Billing</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Step 1 of 2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Client Consignee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gstin || c.state})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <p className="font-bold text-slate-800">{selectedClient.name}</p>
                  <p className="truncate">GSTIN: <span className="font-mono font-bold text-slate-700">{selectedClient.gstin || 'N/A'}</span></p>
                  <p className="truncate">State: {selectedClient.state}</p>
                </div>
              )}
            </div>
          </div>

          {/* Trips Checklist Card */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                  <Layers className="w-4 h-4 text-brand-navy" />
                  <span>Select Completed Trips for Consolidation</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {availableTrips.length} completed un-invoiced loads available for {selectedClient?.name || 'Client'}
                </p>
              </div>

              {/* Quick Batch Select Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={selectTop10}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                  title="Default batch size (10 trips)"
                >
                  Pick 10 (Default)
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  All ({availableTrips.length})
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Checklist Table */}
            {availableTrips.length > 0 ? (
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="py-2.5 px-3">Trip / Load ID</th>
                      <th className="py-2.5 px-3">LR Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vehicle</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3 text-right">Freight Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableTrips.map((trip) => {
                      const isSelected = selectedTripIds.includes(trip.id);
                      return (
                        <tr
                          key={trip.id}
                          onClick={() => toggleTrip(trip.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50/60 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-navy inline" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 inline" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-brand-navy">#{trip.load_id}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-800 font-bold">{trip.lr_number || 'LR Stamped'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{trip.loading_date}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{trip.vehicle?.vehicle_number}</td>
                          <td className="py-2.5 px-3 uppercase text-slate-800 font-medium truncate max-w-[140px]">{trip.to_location}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ₹{Number(trip.freight_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No un-invoiced completed trips for this client</p>
                <p className="text-[11px] text-slate-400 mt-1">Complete more trips on the Status Board with signed LR uploads.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Specs, Live Summary & Generation Button */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-5 sticky top-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 font-display">Tax Invoice Summary</span>
              <span className="text-xs font-bold text-brand-navy bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {selectedTripIds.length} Trips Selected
              </span>
            </div>

            {/* Invoice Number & Date */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
                />
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Trips:</span>
                <span className="font-bold text-slate-900">{selectedTripIds.length} loads</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sub Total:</span>
                <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                <span>Reverse Charge IGST ({gstPercent}%):</span>
                <span className="font-bold text-emerald-700">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t border-slate-300 pt-2">
                <span>Net Billed Amount:</span>
                <span className="text-brand-navy text-base">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 leading-snug">
                <strong>In Words:</strong> {amountWords || 'Zero Rupees only'}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              disabled={isGenerating || selectedTripIds.length === 0}
              onClick={handleGenerate}
              className="w-full py-3.5 px-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-black text-sm rounded-xl shadow-md hover:shadow-glow-gold transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Consolidating & Billing...' : `Generate Invoice (${selectedTripIds.length} Trips)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GENERATED INVOICES HISTORY (10 PER PAGE PAGINATION) */}
      {invoices.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-navy/5 text-brand-navy rounded-xl border border-brand-navy/10">
                <History className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base text-slate-900 font-display">Generated Invoices History</h3>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-navy/10 text-brand-navy">
                    {invoices.length} Total
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                    10 per page
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {startRecordIndex}–{endRecordIndex} of {filteredInvoices.length} invoices
                  {historySearchTerm && ` (filtered from ${invoices.length} total)`}
                </p>
              </div>
            </div>

            {/* Quick Search Filter */}
            <div className="flex items-center space-x-2">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => {
                    setHistorySearchTerm(e.target.value);
                    setHistoryCurrentPage(1);
                  }}
                  placeholder="Search invoice #, client, date..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition bg-slate-50/50 hover:bg-white focus:bg-white"
                />
                {historySearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearchTerm('');
                      setHistoryCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-center">Trips</th>
                  <th className="py-3 px-4 text-right">Sub Total</th>
                  <th className="py-3 px-4 text-right">Reverse Charge (5%)</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInvoices.map((inv) => {
                  const clientName = inv.client?.name || clients.find(c => c.id === inv.client_id)?.name || 'Client';
                  const tripCount = (inv.trips && inv.trips.length > 0) ? inv.trips.length : (trips.filter(t => t.invoice_id === inv.id).length || 1);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{inv.invoice_date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{clientName}</div>
                        {inv.company_name && (
                          <span className="text-[10px] text-slate-400 block">{inv.company_name}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-full border border-slate-200/50">
                          {tripCount} {tripCount === 1 ? 'Trip' : 'Trips'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">
                        ₹{Number(inv.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                        ₹{Number(inv.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        ₹{Number(inv.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPastInvoice(inv)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-xs rounded-xl shadow-xs transition duration-150"
                        >
                          <Printer className="w-3.5 h-3.5 text-brand-gold" />
                          <span>View / Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty Search Result */}
          {filteredInvoices.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-700">No invoices match your search</p>
              <p className="text-xs text-slate-400">
                No invoice records found for &quot;{historySearchTerm}&quot;
              </p>
              <button
                type="button"
                onClick={() => {
                  setHistorySearchTerm('');
                  setHistoryCurrentPage(1);
                }}
                className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-brand-navy hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Search Filter</span>
              </button>
            </div>
          )}

          {/* Pagination Controls Bar */}
          {filteredInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold text-slate-800">{safeCurrentPage}</span> of{' '}
                <span className="font-bold text-slate-800">{totalHistoryPages}</span>
                <span className="mx-2 text-slate-300">•</span>
                Showing records{' '}
                <span className="font-bold text-slate-800">{startRecordIndex}–{endRecordIndex}</span> of{' '}
                <span className="font-bold text-slate-800">{filteredInvoices.length}</span>
              </div>

              <div className="flex items-center space-x-1 self-end sm:self-auto">
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span>Previous</span>
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      totalHistoryPages > 7 &&
                      pageNum !== 1 &&
                      pageNum !== totalHistoryPages &&
                      Math.abs(pageNum - safeCurrentPage) > 2
                    ) {
                      if (pageNum === 2 || pageNum === totalHistoryPages - 1) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setHistoryCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                          isActive
                            ? 'bg-brand-navy text-white shadow-sm ring-2 ring-brand-navy/20'
                            : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalHistoryPages}
                  onClick={() => setHistoryCurrentPage((p) => Math.min(totalHistoryPages, p + 1))}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Invoices Issued Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select completed, un-billed trips above for any client and click &quot;Generate Invoice&quot; to issue your first consolidated GST tax invoice.
          </p>
        </div>
      )}

      {/* PRINT/VIEW MODAL */}
      <InvoicePrintModal
        isOpen={viewInvoiceModal.isOpen}
        invoice={viewInvoiceModal.invoice}
        client={viewInvoiceModal.client}
        trips={viewInvoiceModal.trips}
        companySettings={companySettings}
        onClose={() => setViewInvoiceModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
