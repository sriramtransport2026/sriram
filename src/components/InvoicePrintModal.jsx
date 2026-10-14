import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle, 
  ShieldCheck,
  Layout,
  CheckSquare,
  Square,
  Maximize2,
  FileText
} from 'lucide-react';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';
import { numberToIndianWords } from '../utils/numberToWords';
import logoImg from '../assets/logo.png';

export const ALL_INVOICE_COLUMNS = [
  { id: 'sno', label: 'S.No', default: true },
  { id: 'date', label: 'Date', default: true },
  { id: 'lr_no', label: 'LR No', default: true },
  { id: 'vehicle_no', label: 'Vehicle No', default: true },
  { id: 'from', label: 'From', default: true },
  { id: 'to', label: 'To', default: true },
  { id: 'packages', label: 'Cargo / Pkgs', default: false },
  { id: 'qty', label: 'Weight / Qty', default: true },
  { id: 'rate', label: 'Rate', default: true },
  { id: 'amount', label: 'Amount', default: true },
  { id: 'other_charges', label: 'Other Charges', default: false },
  { id: 'total', label: 'Total', default: true },
];

export function InvoicePrintModal({ isOpen, onClose, invoice, client, trips = [], vehicles = [], companySettings }) {
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  
  // Default selected columns
  const [selectedColumns, setSelectedColumns] = useState(() => {
    return ALL_INVOICE_COLUMNS.filter(col => col.default).map(c => c.id);
  });

  const [showColumnPicker, setShowColumnPicker] = useState(true);

  // Resolve trips: guarantees LR consignment details are never empty
  const resolvedTrips = useMemo(() => {
    if (!invoice) return [];
    if (Array.isArray(trips) && trips.length > 0) return trips;
    if (Array.isArray(invoice.trips) && invoice.trips.length > 0) return invoice.trips;
    
    // Look up in localStorage trips
    try {
      const allLocal = JSON.parse(localStorage.getItem('SRT_TRIPS') || '[]');
      const invNumLower = String(invoice.invoice_number || '').trim().toLowerCase();
      const matched = allLocal.filter(t => 
        (invoice.id && t.invoice_id === invoice.id) ||
        (invNumLower && (
          String(t.direct_invoice_number || '').trim().toLowerCase() === invNumLower ||
          String(t.invoice_number || '').trim().toLowerCase() === invNumLower ||
          String(t.invoice_no_ref || '').trim().toLowerCase() === invNumLower
        ))
      );
      if (matched.length > 0) return matched;
    } catch (e) {}

    // Fallback: If invoice has sub_total > 0, generate a clean consignment item from invoice details
    const invAmt = parseFloat(invoice.sub_total || invoice.net_amount) || 0;
    if (invAmt > 0) {
      return [{
        id: invoice.id ? `fallback-${invoice.id}` : 'fallback-trip-1',
        load_id: invoice.invoice_number || 'CONSIGNMENT-1',
        lr_number: invoice.lr_number || invoice.invoice_number || 'LR-DIR-001',
        loading_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        vehicle: null,
        vehicle_number: invoice.vehicle_number || '-',
        from_location: invoice.from_location || 'ORIGIN',
        to_location: invoice.to_location || 'DESTINATION',
        packages: invoice.packages || 'Commercial Cargo Freight',
        charged_weight: invoice.charged_weight || '1.00',
        unit_type: 'fixed',
        rate: invAmt,
        freight_amount: invAmt,
        vehicle_freight: 0,
      }];
    }
    return [];
  }, [trips, invoice]);

  if (!isOpen || !invoice) return null;

  const subTotal = invoice.sub_total || resolvedTrips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
  const gstPercent = invoice.gst_percent || companySettings?.default_gst_percent || 5.00;
  const gstAmount = invoice.gst_amount || (subTotal * gstPercent / 100);
  const netAmount = invoice.net_amount || subTotal;
  const words = numberToIndianWords(netAmount);

  const toggleColumn = (colId) => {
    setSelectedColumns(prev => 
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(ALL_INVOICE_COLUMNS.map(c => c.id));
  };

  const resetDefaultColumns = () => {
    setSelectedColumns(ALL_INVOICE_COLUMNS.filter(col => col.default).map(c => c.id));
  };

  const handleDownloadPDF = () => {
    const doc = generateInvoicePDF({ 
      invoice, 
      client, 
      trips: resolvedTrips, 
      vehicles, 
      companySettings, 
      logoUrl: logoImg,
      orientation,
      selectedColumns
    });
    doc.save(`${invoice.invoice_number ? invoice.invoice_number.replace(/\//g, '_') : 'Invoice'}_${orientation}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isAllFixed = trips.length > 0 && trips.every(t => t.unit_type === 'fixed' || t.rate_type === 'fixed');
  const hasMTFixed = trips.some(t => t.unit_type === 'MT-fixed' || t.rate_type === 'MT-fixed');
  const qtyHeaderLabel = isAllFixed ? 'FIXED' : (hasMTFixed ? 'MT / FIXED' : 'MT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-1 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Dynamic browser print page size injection */}
      <style>{`
        @media print {
          @page {
            size: ${orientation === 'landscape' ? 'landscape' : 'portrait'} !important;
            margin: 6mm !important;
          }
        }
      `}</style>

      <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[96vh] sm:max-h-[94vh] transition-all ${
        orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
      }`}>
        {/* Modal Action Header (Hidden in Print) */}
        <div className="no-print bg-brand-navy text-white px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 border-b border-brand-navy-light/40">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="bg-white p-1 rounded-lg shrink-0">
              <img src={logoImg} alt="Sri Ram Transport" className="h-6 sm:h-7 w-auto object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-wide font-display">Tax Invoice Document Customizer</h3>
              <p className="text-[10px] sm:text-xs text-brand-gold-light truncate max-w-[200px] sm:max-w-none">
                Invoice #{invoice.invoice_number} • Format: <strong className="capitalize">{orientation}</strong> ({selectedColumns.length} Columns)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                showColumnPicker 
                  ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{showColumnPicker ? 'Hide Customizer' : 'Customize Fields & Layout'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-brand-navy-dark hover:bg-brand-navy-light text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-brand-navy-light/50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-brand-gold" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 sm:px-4 py-1 sm:py-1.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-black rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 sm:p-1.5 rounded-lg transition ml-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FIELD SELECTION & ORIENTATION CUSTOMIZER TOOLBAR (Interactive Non-Print Panel) */}
        {showColumnPicker && (
          <div className="no-print bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3 shrink-0 animate-fade-in text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* 1. Orientation Selector */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Page Orientation:
                </span>
                <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      orientation === 'portrait' 
                        ? 'bg-brand-navy text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>📄 Portrait (Standard A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      orientation === 'landscape' 
                        ? 'bg-brand-navy text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>📃 Landscape (Wide Table)</span>
                  </button>
                </div>
              </div>

              {/* Quick Select Actions */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedColumns.length} of {ALL_INVOICE_COLUMNS.length} fields active
                </span>
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={resetDefaultColumns}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Reset Default
                </button>
              </div>
            </div>

            {/* 2. Column Checkbox Chips */}
            <div>
              <span className="block font-bold text-slate-600 text-[10px] uppercase tracking-wider mb-1.5">
                Select Table Fields To Include In Invoice:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_INVOICE_COLUMNS.map(col => {
                  const isChecked = selectedColumns.includes(col.id);
                  return (
                    <label
                      key={col.id}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition border select-none ${
                        isChecked 
                          ? 'bg-brand-navy text-white border-brand-navy shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.id)}
                        className="hidden"
                      />
                      <span>{isChecked ? '✓' : '+'}</span>
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto overflow-x-auto p-2 sm:p-6 bg-slate-100/60 flex justify-center">
          <div 
            id="printable-invoice" 
            className={`bg-white border border-slate-400 rounded-none shadow-sm p-4 sm:p-8 w-full text-slate-900 font-sans text-xs space-y-4 mx-auto transition-all ${
              orientation === 'landscape' ? 'max-w-[297mm] min-w-[270mm]' : 'max-w-[210mm] min-w-[200mm]'
            }`}
          >
            {/* Header Box with Official Logo */}
            <div className="border border-slate-700 p-4 relative space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                {/* TAX INVOICE Tag */}
                <div className="border border-slate-700 px-3 py-1 font-black text-[11px] tracking-wider uppercase text-brand-navy">
                  TAX INVOICE
                </div>

                {/* Right Tax IDs */}
                <div className="text-right text-[10px] font-bold text-slate-800 space-y-0.5 shrink-0">
                  <div>GST No. : <span className="font-mono text-brand-navy font-black">{companySettings?.gstin || '33GUPS2382N1ZF'}</span></div>
                  <div>SAC Code : <span className="font-mono">{companySettings?.sac_code || '9965'}</span></div>
                  <div>Branch State : {companySettings?.branch_state || 'TAMIL NADU'}</div>
                  <div>PAN No. : <span className="font-mono">{companySettings?.pan || 'GLIPS2382N'}</span></div>
                </div>
              </div>

              {/* Logo & Company Identity Block */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1 text-center">
                <img 
                  src={logoImg} 
                  alt="Sri Ram Transport Logo" 
                  className="h-16 w-auto object-contain shrink-0" 
                />
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight font-display">
                    {companySettings?.company_name || 'Sri Ram Transport'}
                  </h1>
                  <p className="text-[10px] text-slate-700 font-medium max-w-md mx-auto mt-0.5 leading-snug">
                    Address: {companySettings?.address || 'NO: 4/ KRISHNAPPA BUILDING NEAR VEGITABLE MARKET KRISHNAGIRI MAIN ROAD BATHALAPALLI HOSUR, Hosur - 635109, TAMIL NADU, India'}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Email: <span className="font-semibold">{companySettings?.email}</span> &nbsp;|&nbsp; Phone: <span className="font-semibold">{companySettings?.phone}</span>
                  </p>
                </div>
              </div>

              {/* Bill To & Invoice Info Box with PO Number Support */}
              <div className="border-t border-slate-400 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-[11px] text-slate-900">To,</p>
                  <p className="font-extrabold text-[12px] text-brand-navy">{client?.name || 'Ashirvad Pipes Pvt Ltd'}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{client?.address}</p>
                  <p className="text-[10px] font-bold text-slate-900 mt-1">
                    GSTIN : <span className="font-mono">{client?.gstin || '-'}</span> &nbsp;|&nbsp; PAN : <span className="font-mono">{client?.pan || '-'}</span> &nbsp;|&nbsp; State : {client?.state || '-'}
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300 sm:pl-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-brand-navy">
                      Invoice No. : <span className="font-mono font-black text-brand-navy">{invoice.invoice_number}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      Date : <span className="font-mono">{invoice.invoice_date}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      PO No. : <span className="font-mono font-black text-brand-navy">{invoice.po_number || invoice.poNumber || (resolvedTrips && resolvedTrips[0]?.po_number) || '—'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="font-bold text-[11px] text-slate-800 px-1">
              Transportation charges as per detail given below:--
            </div>

            {/* Dynamic Selected Columns Table */}
            <div className="border border-slate-700 overflow-x-auto w-full">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-700 font-bold text-slate-900 text-center uppercase tracking-wider text-[9.5px]">
                  <tr>
                    {selectedColumns.includes('sno') && (
                      <th className="border-r border-slate-700 py-2 px-1.5 w-9 text-center">SNO</th>
                    )}
                    {selectedColumns.includes('date') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-center w-20">DATE</th>
                    )}
                    {selectedColumns.includes('lr_no') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-center w-20">LRNO</th>
                    )}
                    {selectedColumns.includes('vehicle_no') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-center w-24">VEHICLE NO</th>
                    )}
                    {selectedColumns.includes('from') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-left">FROM</th>
                    )}
                    {selectedColumns.includes('to') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-left">TO</th>
                    )}
                    {selectedColumns.includes('packages') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-left w-28">CARGO / PKGS</th>
                    )}
                    {selectedColumns.includes('qty') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-center w-22">{qtyHeaderLabel}</th>
                    )}
                    {selectedColumns.includes('rate') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-right w-20">RATE</th>
                    )}
                    {selectedColumns.includes('amount') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-right w-22">AMOUNT</th>
                    )}
                    {selectedColumns.includes('other_charges') && (
                      <th className="border-r border-slate-700 py-2 px-2 text-right w-22">OTHER CHGS</th>
                    )}
                    {selectedColumns.includes('total') && (
                      <th className="py-2 px-2.5 text-right w-24">TOTAL</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {resolvedTrips.map((t, idx) => {
                    const charged = parseFloat(t.charged_weight || t.tons || t.quantity) || 0;
                    const rate = parseFloat(t.rate || t.freight_rate) || 0;
                    const totalFreight = parseFloat(t.freight_amount) || 0;
                    const isFixedUnit = t.unit_type === 'fixed' || t.rate_type === 'fixed';
                    const isMTFixed = t.unit_type === 'MT-fixed' || t.rate_type === 'MT-fixed';

                    const baseAmount = (isFixedUnit || isMTFixed) 
                      ? totalFreight 
                      : ((charged > 0 && rate > 0) ? Math.round(charged * rate * 100) / 100 : totalFreight);

                    let otherChargesNet = 0;
                    if (t.has_loading_unloading === 'yes' && t.loading_unloading_amount) {
                      otherChargesNet -= (parseFloat(t.loading_unloading_amount) || 0);
                    }
                    if (Array.isArray(t.other_charges)) {
                      t.other_charges.forEach(c => {
                        const a = parseFloat(c.amount) || 0;
                        if (c.type === 'add') otherChargesNet += a;
                        else if (c.type === 'subtract') otherChargesNet -= a;
                      });
                    }
                    if (otherChargesNet === 0 && Math.abs(totalFreight - baseAmount) > 0.01) {
                      otherChargesNet = totalFreight - baseAmount;
                    }

                    const rateNum = Number(rate || (isFixedUnit || isMTFixed ? totalFreight : 0));
                    const rateFormatted = isMTFixed
                      ? `${rateNum > 0 ? rateNum.toLocaleString('en-IN') : Number(totalFreight).toLocaleString('en-IN')} (FIXED)`
                      : (rateNum > 0 ? rateNum.toLocaleString('en-IN', { minimumFractionDigits: rateNum % 1 === 0 ? 0 : 2 }) : '');

                    const qtyText = isFixedUnit 
                      ? 'FIXED' 
                      : isMTFixed
                      ? `${charged > 0 ? charged.toLocaleString('en-IN', { minimumFractionDigits: charged % 1 === 0 ? 0 : 2 }) : '1.00'} MT`
                      : (charged > 0 ? `${charged.toLocaleString('en-IN', { minimumFractionDigits: charged % 1 === 0 ? 0 : 2 })} MT` : '1.00 MT');

                    let rawVehNo = t.vehicle?.vehicle_number || t.vehicle_number;
                    if (!rawVehNo && t.vehicle_id) {
                      const vList = (vehicles && vehicles.length > 0) ? vehicles : (() => {
                        try { return JSON.parse(localStorage.getItem('srt_vehicles_v1') || '[]'); } catch(e) { return []; }
                      })();
                      const found = vList.find(v => v.id === t.vehicle_id);
                      if (found) rawVehNo = found.vehicle_number;
                    }
                    const cleanVehNo = (rawVehNo || '-').replace(/\s*\(.*?\)/g, '');

                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-50/50">
                        {selectedColumns.includes('sno') && (
                          <td className="border-r border-slate-700 py-1.5 px-1.5 text-center font-bold text-slate-700">{idx + 1}</td>
                        )}
                        {selectedColumns.includes('date') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-center font-mono whitespace-nowrap text-slate-800">{t.loading_date || '-'}</td>
                        )}
                        {selectedColumns.includes('lr_no') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-center font-mono font-black text-brand-navy">{t.lr_number || t.load_id || '-'}</td>
                        )}
                        {selectedColumns.includes('vehicle_no') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-center font-mono font-bold text-slate-800">{cleanVehNo}</td>
                        )}
                        {selectedColumns.includes('from') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 font-medium uppercase text-slate-700">{t.from_location || 'BANGALORE'}</td>
                        )}
                        {selectedColumns.includes('to') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 font-bold uppercase text-slate-900">{t.to_location || '-'}</td>
                        )}
                        {selectedColumns.includes('packages') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-slate-700">{t.packages || t.description || '-'}</td>
                        )}
                        {selectedColumns.includes('qty') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                            <span className={isFixedUnit ? "text-[9.5px] font-black uppercase text-slate-700" : "text-[10px] font-bold text-slate-900"}>{qtyText}</span>
                          </td>
                        )}
                        {selectedColumns.includes('rate') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                            {rateFormatted || '-'}
                          </td>
                        )}
                        {selectedColumns.includes('amount') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        )}
                        {selectedColumns.includes('other_charges') && (
                          <td className="border-r border-slate-700 py-1.5 px-2 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                            {otherChargesNet === 0 ? '0.00' : (otherChargesNet < 0 ? `-${Math.abs(otherChargesNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `+${otherChargesNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)}
                          </td>
                        )}
                        {selectedColumns.includes('total') && (
                          <td className="py-1.5 px-2.5 text-right font-mono font-black text-brand-navy whitespace-nowrap">
                            {Number(totalFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div className="border border-slate-700 bg-slate-50 p-3 space-y-1">
              <div className="flex justify-between items-center text-xs font-black text-brand-navy">
                <span className="uppercase tracking-wider">Sub Total Freight ({resolvedTrips.length} Consignment{resolvedTrips.length !== 1 ? 's' : ''}):</span>
                <span className="font-mono text-sm">₹{Number(subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-[10px] text-slate-600 font-semibold pt-1 border-t border-slate-200">
                <strong>Amount in Words:</strong> {words}
              </div>
            </div>

            {/* Reverse Charge / RCM Notice */}
            {(invoice.reverse_charge !== false) && (
              <div className="border border-slate-700 grid grid-cols-2 text-[10px] font-bold bg-white p-2">
                <div>
                  GST is payable on Reverse Charge: <span className="text-emerald-700 font-extrabold">Yes (RCM)</span>
                </div>
                <div className="text-right">
                  GST 5% Subject to Reverse Charge : <span className="font-mono font-bold">₹{Number(gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-1 text-[9.5px] text-slate-700 border-t border-slate-300 pt-3">
              <p className="font-bold text-slate-900">Terms and Conditions :</p>
              <p>(1) All disputes are subject to Hosur jurisdiction only.</p>
              <p>(2) Payment should be made by Cheque / NEFT / RTGS in favor of {companySettings?.company_name || 'Sri Ram Transport'}.</p>
            </div>

            {/* Official Signature & Seal Block */}
            <div className="mt-4 pt-3 border-t-2 border-slate-700 break-inside-avoid">
              <div className="grid grid-cols-3 gap-6 pt-1">
                <div className="flex flex-col justify-between h-32 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Consignee / Receiver
                  </span>
                  <div className="text-center">
                    <div className="border-t border-dashed border-slate-400 pt-1">
                      <p className="text-[11px] font-bold text-slate-800">Receiver's Signature & Stamp</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between h-32 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Verification
                  </span>
                  <div className="text-center">
                    <div className="border-t border-dashed border-slate-400 pt-1">
                      <p className="text-[11px] font-bold text-slate-800">Prepared & Checked By</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between h-32 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                      Issuing Transport Agency
                    </span>
                    <span className="text-xs font-black text-brand-navy tracking-wide">
                      For {companySettings?.company_name || 'SRI RAM TRANSPORT'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="border-t border-dashed border-slate-400 pt-1">
                      <p className="text-[11px] font-black text-slate-900">Authorised Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
