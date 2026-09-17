import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';
import { numberToIndianWords } from '../utils/numberToWords';
import logoImg from '../assets/logo.png';

export function InvoicePrintModal({ isOpen, onClose, invoice, client, trips = [], companySettings }) {
  if (!isOpen || !invoice) return null;

  const subTotal = invoice.sub_total || trips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
  const gstPercent = invoice.gst_percent || companySettings?.default_gst_percent || 5.00;
  const gstAmount = invoice.gst_amount || (subTotal * gstPercent / 100);
  const netAmount = invoice.net_amount || subTotal;
  const words = numberToIndianWords(netAmount);

  const handleDownloadPDF = () => {
    const doc = generateInvoicePDF({ invoice, client, trips, companySettings, logoUrl: logoImg });
    doc.save(`${invoice.invoice_number.replace(/\//g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Action Header (Hidden in Print) */}
        <div className="no-print bg-brand-navy text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-brand-navy-light/40">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-lg shrink-0">
              <img src={logoImg} alt="Sri Ram Transport" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide font-display">Tax Invoice Document Preview</h3>
              <p className="text-xs text-brand-gold-light">GST Reverse-Charge Invoice: {invoice.invoice_number}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-navy-dark hover:bg-brand-navy-light text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-brand-navy-light/50"
            >
              <Printer className="w-4 h-4 text-brand-gold" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-1.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-black rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg transition ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/60 flex justify-center">
          <div 
            id="printable-invoice" 
            className="bg-white border border-slate-400 rounded-none shadow-sm p-6 sm:p-8 w-full max-w-[210mm] text-slate-900 font-sans text-xs space-y-4"
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

              {/* Bill To & Invoice No Box */}
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
                  </div>
                  {/* <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block self-end">
                  
                  </div> */}
                </div>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="font-bold text-[11px] text-slate-800 px-1">
              Transportation charges as per detail given below:--
            </div>

            {/* Trips Table */}
            <div className="border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-700 font-bold text-slate-900 text-center uppercase tracking-wider text-[9.5px]">
                  <tr>
                    <th className="border-r border-slate-700 py-2.5 px-1.5 w-10 text-center">SNO</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-center w-22">DATE</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-center w-22">LRNO</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-center w-24">VEHICLE NO</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-left">FROM</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-left">TO</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-right w-20">RATE</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-right w-24">AMOUNT</th>
                    <th className="border-r border-slate-700 py-2.5 px-2 text-right w-24">OTHER CHARGES</th>
                    <th className="py-2.5 px-2.5 text-right w-24">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {trips.map((t, idx) => {
                    const charged = parseFloat(t.charged_weight) || 0;
                    const rate = parseFloat(t.rate) || 0;
                    const totalFreight = parseFloat(t.freight_amount) || 0;
                    const baseAmount = (charged > 0 && rate > 0) ? Math.round(charged * rate * 100) / 100 : totalFreight;

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

                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-50/50">
                        <td className="border-r border-slate-700 py-2 px-1.5 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="border-r border-slate-700 py-2 px-2 text-center font-mono whitespace-nowrap text-slate-800">{t.loading_date || '-'}</td>
                        <td className="border-r border-slate-700 py-2 px-2 text-center font-mono font-black text-brand-navy">{t.lr_number || t.load_id || '-'}</td>
                        <td className="border-r border-slate-700 py-2 px-2 text-center font-mono font-bold text-slate-800">{t.vehicle?.vehicle_number || '-'}</td>
                        <td className="border-r border-slate-700 py-2 px-2 font-medium uppercase text-slate-700">{t.from_location || 'BANGALORE'}</td>
                        <td className="border-r border-slate-700 py-2 px-2 font-bold uppercase text-slate-900">{t.to_location || '-'}</td>
                        <td className="border-r border-slate-700 py-2 px-2 text-right font-mono text-slate-800">
                          {rate > 0 ? Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="border-r border-slate-700 py-2 px-2 text-right font-mono font-semibold text-slate-800">
                          ₹{Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border-r border-slate-700 py-2 px-2 text-right font-mono">
                          {otherChargesNet === 0 ? (
                            <span className="text-slate-400">0.00</span>
                          ) : otherChargesNet < 0 ? (
                            <span className="text-rose-700 font-bold">&minus;₹{Math.abs(otherChargesNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">+₹{otherChargesNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-brand-navy">
                          ₹{Number(totalFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Subtotal & Net Amount Summary */}
              <div className="border-t border-slate-700 text-[11px] font-bold">
                <div className="flex justify-end border-b border-slate-400">
                  <div className="py-1.5 px-4 text-right border-r border-slate-700 w-44">Sub Total:</div>
                  <div className="py-1.5 px-4 text-right font-mono w-40">
                    ₹{Number(subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex justify-end bg-slate-50">
                  <div className="py-1.5 px-4 text-right border-r border-slate-700 w-44">Net Amount:</div>
                  <div className="py-1.5 px-4 text-right font-mono text-brand-navy font-black w-40">
                    ₹{Number(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Amount In Words */}
              <div className="border-t border-slate-700 p-2.5 bg-slate-50 font-bold text-[10px] text-slate-900">
                Amount In Words : <span className="font-black text-brand-navy">{words}</span>
              </div>

              {/* Reverse Charge Statement */}
              <div className="border-t border-slate-700 grid grid-cols-2 text-[10px] font-bold bg-white">
                <div className="p-2 border-r border-slate-700">
                  GST is payable on Reverse Charge: <span className="text-emerald-700 font-extrabold">Yes</span>
                </div>
                <div className="p-2 text-right">
                  Amount of GST subject to Reverse Charge : <span className="font-mono font-bold">IGST 5% ₹{Number(gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-1 text-[9.5px] text-slate-700 border-t border-slate-300 pt-3">
              <p className="font-bold text-slate-900">Terms and Conditions :</p>
              <p>(1) All disputes are subject to Hosur jurisdiction only.</p>
              <p>(2) Payment should be made by Cheque / NEFT / RTGS in favor of Sri Ram Transport.</p>
            </div>

            {/* Generous Official Signature & Seal Block (Print & Screen with Ample Space) */}
            <div className="mt-6 pt-3 border-t-2 border-slate-700 break-inside-avoid">
              <div className="grid grid-cols-3 gap-6 pt-1">
                {/* 1. Consignee / Receiver */}
                <div className="flex flex-col justify-between h-36 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Consignee / Receiver
                  </span>
                  <div className="text-center">
                    <div className="border-t border-dashed border-slate-400 pt-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Receiver's Signature & Stamp</p>
                    </div>
                  </div>
                </div>

                {/* 2. Verification */}
                <div className="flex flex-col justify-between h-36 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Verification
                  </span>
                  <div className="text-center">
                    <div className="border-t border-dashed border-slate-400 pt-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Prepared & Checked By</p>
                    </div>
                  </div>
                </div>

                {/* 3. Transport Agency Authorised Signatory */}
                <div className="flex flex-col justify-between h-36 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                      Issuing Transport Agency
                    </span>
                    <span className="text-xs font-black text-brand-navy tracking-wide">
                      For SRI RAM TRANSPORT
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="border-t border-dashed border-slate-400 pt-1.5">
                      <p className="text-[11px] font-black text-slate-900">Authorised Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-400 pt-2">Page 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
