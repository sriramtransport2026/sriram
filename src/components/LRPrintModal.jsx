import React from 'react';
import { X, Printer, Download, Truck, ShieldCheck, MapPin, Calendar, FileText, Phone, Mail } from 'lucide-react';
import { numberToIndianWords } from '../utils/numberToWords';
import logoImg from '../assets/logo.png';

export function LRPrintModal({ isOpen, onClose, trip, client, vehicle, companySettings }) {
  if (!isOpen || !trip) return null;

  const lrNumber = trip.lr_number || trip.load_id || 'LR-PENDING';
  const lrDate = trip.loading_date || (trip.created_at ? trip.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  
  const clientObj = client || trip.client || null;
  const vehicleObj = vehicle || trip.vehicle || null;

  const vehicleNumber = (trip.vehicle_number || vehicleObj?.vehicle_number || '-').replace(/\s*\(.*?\)/g, '');
  const driverName = trip.driver_name || vehicleObj?.driver_name || 'Driver In-charge';
  const driverPhone = trip.driver_phone || vehicleObj?.driver_phone || vehicleObj?.phone || '-';

  const fromLocation = (trip.from_location || 'BANGALORE').toUpperCase();
  const toLocation = (trip.to_location || 'DESTINATION').toUpperCase();
  const packagesDesc = trip.packages || trip.description || 'Commercial Freight Cargo';

  const chargedWeight = parseFloat(trip.charged_weight || trip.actual_weight || trip.tons || trip.quantity) || 0;
  const rate = parseFloat(trip.rate || trip.freight_rate) || 0;
  const freightAmount = parseFloat(trip.freight_amount) || 0;
  const advancePaid = parseFloat(trip.advance_paid || trip.advance_amount) || 0;
  const balanceAmount = trip.balance_amount !== undefined && trip.balance_amount !== null
    ? parseFloat(trip.balance_amount)
    : Math.max(0, freightAmount - advancePaid);

  const isFixedUnit = trip.unit_type === 'fixed' || trip.rate_type === 'fixed';
  const isMTFixed = trip.unit_type === 'MT-fixed' || trip.rate_type === 'MT-fixed';

  const rateText = isMTFixed
    ? `₹${Number(rate || freightAmount).toLocaleString('en-IN')} (FIXED)`
    : isFixedUnit
    ? `₹${Number(freightAmount).toLocaleString('en-IN')} (FIXED)`
    : rate > 0
    ? `₹${Number(rate).toLocaleString('en-IN')}`
    : 'As Agreed';

  const weightText = isFixedUnit
    ? '1 Load (Fixed)'
    : isMTFixed
    ? `${chargedWeight > 0 ? chargedWeight.toLocaleString('en-IN') : '1.00'} MT`
    : chargedWeight > 0
    ? `${chargedWeight.toLocaleString('en-IN')} ${trip.unit_type || 'MT'}`
    : '1 Load';

  const words = freightAmount > 0 ? numberToIndianWords(freightAmount) : 'Zero Rupees';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[96vh]">
        {/* Modal Action Header (Hidden in Print) */}
        <div className="no-print bg-brand-navy text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-brand-navy-light/40">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-lg shrink-0">
              <img src={logoImg} alt="Sri Ram Transport" className="h-6 sm:h-7 w-auto object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-wide font-display">
                Consignment Note / Lorry Receipt (LR) Preview
              </h3>
              <p className="text-[10px] sm:text-xs text-brand-gold-light truncate">
                Official Bilty Document: {lrNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-black rounded-xl text-xs flex items-center space-x-2 transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print LR Copy</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-xl transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable LR Content */}
        <div className="overflow-y-auto overflow-x-auto p-3 sm:p-8 bg-slate-100/60 flex justify-center">
          <div 
            id="printable-lr" 
            className="bg-white border-2 border-slate-800 rounded-none shadow-sm p-4 sm:p-8 w-full max-w-[210mm] text-slate-900 font-sans text-xs space-y-3 mx-auto"
          >
            {/* Top Header Box */}
            <div className="border border-slate-800 p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="border-2 border-brand-navy bg-brand-navy/5 px-2.5 py-1 text-[11px] font-black tracking-widest text-brand-navy uppercase">
                  GOODS CONSIGNMENT NOTE (LORRY RECEIPT)
                </div>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-600 uppercase">
                  <span className="px-1.5 py-0.5 border border-slate-400 bg-slate-50">Consignor Copy</span>
                  <span className="px-1.5 py-0.5 border border-slate-400 bg-slate-50">Consignee Copy</span>
                  <span className="px-1.5 py-0.5 border border-brand-navy bg-brand-navy text-white">Driver / Fleet Copy</span>
                </div>
              </div>

              {/* Company Logo and Details */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
                <div className="flex items-center space-x-3">
                  <img src={logoImg} alt="Sri Ram Transport Logo" className="h-14 w-auto object-contain shrink-0" />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-brand-navy font-display tracking-tight leading-none">
                      {companySettings?.company_name || 'Sri Ram Transport'}
                    </h1>
                    <p className="text-[10px] text-slate-700 font-semibold mt-1">
                      FLEET OWNERS & LEADING HEAVY CARGO TRANSPORT CONTRACTORS
                    </p>
                    <p className="text-[9.5px] text-slate-600 leading-tight mt-0.5 max-w-md">
                      Address: {companySettings?.address || 'NO: 4/ KRISHNAPPA BUILDING NEAR VEGITABLE MARKET KRISHNAGIRI MAIN ROAD BATHALAPALLI HOSUR, Hosur - 635109, TAMIL NADU'}
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">
                      Phone: <span className="font-bold">{companySettings?.phone || '+91 94432 23820'}</span> &nbsp;|&nbsp; 
                      Email: <span className="font-bold">{companySettings?.email || 'sriramtransport2026@gmail.com'}</span>
                    </p>
                  </div>
                </div>

                <div className="border border-slate-700 p-2 text-right text-[10px] space-y-0.5 shrink-0 bg-slate-50 min-w-[170px]">
                  <div>GSTIN: <span className="font-mono font-black text-brand-navy">{companySettings?.gstin || '33GUPS2382N1ZF'}</span></div>
                  <div>SAC Code: <span className="font-mono font-bold">{companySettings?.sac_code || '9965'}</span></div>
                  <div>PAN: <span className="font-mono font-bold">{companySettings?.pan || 'GLIPS2382N'}</span></div>
                  <div>State: <span className="font-bold">{companySettings?.branch_state || 'TAMIL NADU (33)'}</span></div>
                </div>
              </div>
            </div>

            {/* LR Meta Information Strip */}
            <div className="border border-slate-800 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-800 bg-slate-50 text-[10.5px]">
              <div className="p-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">LR / Bilty Number</span>
                <span className="font-mono font-black text-sm text-brand-navy">{lrNumber}</span>
              </div>
              <div className="p-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Date of Booking</span>
                <span className="font-mono font-bold text-slate-800">{lrDate}</span>
              </div>
              <div className="p-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Vehicle / Truck No</span>
                <span className="font-mono font-black text-slate-900 uppercase">{vehicleNumber}</span>
              </div>
              <div className="p-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Driver & Contact</span>
                <span className="font-semibold text-slate-800 truncate block">{driverName} ({driverPhone})</span>
              </div>
            </div>

            {/* Consignor (Sender) & Consignee (Receiver) Two Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
              {/* Consignor */}
              <div className="border border-slate-800 p-2.5 space-y-1">
                <div className="font-black text-slate-900 border-b border-slate-300 pb-1 flex justify-between">
                  <span>CONSIGNOR (FROM):</span>
                  <span className="text-brand-navy font-bold">{fromLocation}</span>
                </div>
                <p className="font-black text-brand-navy text-[12px]">{trip.consignor || clientObj?.name || 'Ashirvad Pipes Pvt Ltd'}</p>
                <p className="text-[10px] text-slate-600 leading-snug">{clientObj?.address || 'Consignor Factory / Warehouse'}</p>
                <p className="text-[10px] font-bold text-slate-800 pt-0.5">
                  GSTIN: <span className="font-mono">{clientObj?.gstin || '-'}</span> &nbsp;|&nbsp; State: {clientObj?.state || 'TAMIL NADU'}
                </p>
              </div>

              {/* Consignee */}
              <div className="border border-slate-800 p-2.5 space-y-1">
                <div className="font-black text-slate-900 border-b border-slate-300 pb-1 flex justify-between">
                  <span>CONSIGNEE (TO):</span>
                  <span className="text-brand-navy font-bold">{toLocation}</span>
                </div>
                <p className="font-black text-brand-navy text-[12px]">{trip.consignee || clientObj?.name || 'Consignee / Destination Branch'}</p>
                <p className="text-[10px] text-slate-600 leading-snug">Destination: {toLocation}</p>
                <p className="text-[10px] font-bold text-slate-800 pt-0.5">
                  Delivery Address: {trip.delivery_address || `${toLocation} Delivery Hub`}
                </p>
              </div>
            </div>

            {/* Consignment Particulars Table */}
            <div className="border border-slate-800">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-800 font-black text-slate-900 uppercase text-[9.5px]">
                  <tr>
                    <th className="border-r border-slate-800 py-2 px-2 text-center w-10">S.No</th>
                    <th className="border-r border-slate-800 py-2 px-3">Description of Goods / Packages</th>
                    <th className="border-r border-slate-800 py-2 px-2 text-center w-28">Ref Invoice #</th>
                    <th className="border-r border-slate-800 py-2 px-2 text-center w-24">Weight / Qty</th>
                    <th className="border-r border-slate-800 py-2 px-2 text-right w-24">Rate</th>
                    <th className="py-2 px-3 text-right w-28">Freight (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="border-r border-slate-800 py-3 px-2 text-center font-bold">1</td>
                    <td className="border-r border-slate-800 py-3 px-3">
                      <p className="font-bold text-slate-900">{packagesDesc}</p>
                      <p className="text-[9px] text-slate-500">Route: {fromLocation} to {toLocation}</p>
                    </td>
                    <td className="border-r border-slate-800 py-3 px-2 text-center font-mono font-bold">
                      {trip.invoice_number || trip.invoice_no_ref || trip.ref_invoice_number || '-'}
                    </td>
                    <td className="border-r border-slate-800 py-3 px-2 text-center font-bold">
                      {weightText}
                    </td>
                    <td className="border-r border-slate-800 py-3 px-2 text-right font-bold">
                      {rateText}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-[11px]">
                      ₹{freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Financial & Terms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              {/* Payment Details Box */}
              <div className="border border-slate-800 p-2.5 space-y-1.5 bg-slate-50/60">
                <span className="font-black text-slate-900 uppercase block text-[10.5px] border-b border-slate-300 pb-1">
                  Freight Settlement Details
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Freight Basis:</span>
                    <span className="font-black text-brand-navy uppercase">
                      {trip.payment_basis || (freightAmount > 0 ? 'TO BE BILLED' : 'TO PAY')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Freight:</span>
                    <span className="font-bold text-slate-900">₹{freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {advancePaid > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Advance Received:</span>
                      <span className="font-bold">₹{advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-slate-900">
                    <span>Balance Payable:</span>
                    <span className="font-black text-brand-navy">₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-200 text-[9px] text-slate-600 italic">
                  Amount in words: <span className="font-bold uppercase text-slate-800">{words}</span>
                </div>
              </div>

              {/* Statutory Conditions Box */}
              <div className="border border-slate-800 p-2.5 space-y-1 text-[9px] text-slate-600 leading-tight">
                <span className="font-black text-slate-900 uppercase block text-[10px] border-b border-slate-300 pb-1">
                  Conditions of Carriage & GST Notice
                </span>
                <p>1. Goods accepted for transportation strictly at Owner's / Consignor's risk.</p>
                <p>2. Subject to Krishnagiri / Hosur Jurisdiction only.</p>
                <p>3. GST on GTA transport service is payable by recipient under Reverse Charge Mechanism (RCM).</p>
                <p>4. No claims for damage or shortage accepted unless noted on receipt copy at delivery.</p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="border border-slate-800 grid grid-cols-3 divide-x divide-slate-800 text-center text-[9.5px] pt-8 pb-2">
              <div className="space-y-1 px-2">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Consignor / Agent Signature</div>
              </div>
              <div className="space-y-1 px-2">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Driver / Truck In-charge</div>
              </div>
              <div className="space-y-1 px-2">
                <div className="border-t border-slate-400 pt-1 font-black text-brand-navy">
                  For {companySettings?.company_name || 'Sri Ram Transport'}
                  <span className="block text-[8px] font-normal text-slate-500">(Authorised Signatory)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
