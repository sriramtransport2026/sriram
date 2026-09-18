import React from 'react';
import { 
  Building2, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Globe2
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { DEFAULT_COMPANY_ENTITIES } from '../services/db';

export function CompanySelectionModal({ isOpen, onClose, activeGstin, onSelectCompany, isMandatory = false }) {
  if (!isOpen) return null;

  const srt = DEFAULT_COMPANY_ENTITIES['33GUPS2382N1ZF'];
  const srl = DEFAULT_COMPANY_ENTITIES['33GWYPP4027A1ZD'];

  const handleSelect = (gstin) => {
    onSelectCompany(gstin);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-4 sm:p-8 lg:p-10 border border-slate-200 space-y-5 sm:space-y-8 animate-scale-up relative overflow-hidden max-h-[90vh] overflow-y-auto my-auto">
        
        {/* Background glow styling */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-navy rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-gold rounded-full blur-3xl opacity-15 pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold-dark text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold-dark" />
            <span>Sri Ram Transport Group · Hosur Hub</span>
          </div>

          <div className="flex items-center justify-center space-x-3">
            <img src={logoImg} alt="Sri Ram Group" className="h-10 w-auto object-contain" />
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy font-display tracking-tight">
              Select Operating Firm & GSTIN Account
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Choose the business entity to load into the dashboard. The operational board, trip entries, GST tax invoices, and profit reports will switch to the selected firm.
          </p>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dual Company Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          
          {/* =========================================================================
              CARD 1: SRI RAM TRANSPORT (SRT)
             ========================================================================= */}
          <div 
            onClick={() => handleSelect('33GUPS2382N1ZF')}
            className={`rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
              activeGstin === '33GUPS2382N1ZF'
                ? 'border-brand-navy bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 shadow-xl ring-2 ring-brand-navy/10'
                : 'border-slate-200 hover:border-brand-navy/60 hover:shadow-lg bg-white'
            }`}
          >
            {activeGstin === '33GUPS2382N1ZF' && (
              <div className="absolute top-4 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-brand-navy text-white text-[10px] font-black uppercase tracking-wider shadow">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" />
                <span>Currently Active</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-brand-navy flex items-center justify-center font-black text-lg shadow-sm">
                  <Truck className="w-6 h-6 text-brand-gold-dark" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy font-display group-hover:text-brand-navy-light transition-colors">
                    {srt.company_name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-bold text-brand-gold-dark">
                    <span>{srt.tagline}</span>
                  </div>
                </div>
              </div>

              {/* GSTIN & PAN Badges */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">GSTIN No.</span>
                  <span className="font-mono text-xs font-black text-brand-navy px-2 py-0.5 rounded bg-white border border-amber-300">
                    {srt.gstin}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900">PAN Number</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {srt.pan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900">Tax Invoice Prefix</span>
                  <span className="font-mono text-xs font-bold text-brand-navy">
                    {srt.invoice_prefix}
                  </span>
                </div>
              </div>

              {/* Branch & Contact Info */}
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-brand-gold-dark shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed text-[11px]">
                    {srt.address}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{srt.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{srt.email}</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-6">
              <button
                type="button"
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeGstin === '33GUPS2382N1ZF'
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-slate-100 text-slate-800 group-hover:bg-brand-navy group-hover:text-white'
                }`}
              >
                <span>Launch Sri Ram Transport</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              CARD 2: SRI RAM LOGISTICS (SRL)
             ========================================================================= */}
          <div 
            onClick={() => handleSelect('33GWYPP4027A1ZD')}
            className={`rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
              activeGstin === '33GWYPP4027A1ZD'
                ? 'border-blue-600 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 shadow-xl ring-2 ring-blue-600/10'
                : 'border-slate-200 hover:border-blue-500 hover:shadow-lg bg-white'
            }`}
          >
            {activeGstin === '33GWYPP4027A1ZD' && (
              <div className="absolute top-4 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Currently Active</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-black text-lg shadow-sm">
                  <Globe2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-brand-navy font-display group-hover:text-blue-700 transition-colors">
                      {srl.company_name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                      SRL
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600">
                    <span>{srl.tagline}</span>
                  </div>
                </div>
              </div>

              {/* GSTIN & PAN Badges */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">GSTIN No.</span>
                  <span className="font-mono text-xs font-black text-blue-950 px-2 py-0.5 rounded bg-white border border-blue-300">
                    {srl.gstin}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-900">PAN Number</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {srl.pan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-900">Tax Invoice Prefix</span>
                  <span className="font-mono text-xs font-bold text-blue-900">
                    {srl.invoice_prefix}
                  </span>
                </div>
              </div>

              {/* Branch & Contact Info */}
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed text-[11px]">
                    {srl.address}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{srl.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{srl.email}</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-6">
              <button
                type="button"
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeGstin === '33GWYPP4027A1ZD'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-800 group-hover:bg-blue-600 group-hover:text-white'
                }`}
              >
                <span>Launch Sri Ram Logistics</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer Note */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-400 relative z-10 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-gold-dark shrink-0" />
          <span>You can switch between firm accounts and GST numbers anytime from the top navigation switcher.</span>
        </div>

      </div>
    </div>
  );
}

export default CompanySelectionModal;
