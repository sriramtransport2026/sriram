import React from 'react';
import { Building2, ArrowLeftRight, Truck, Globe2 } from 'lucide-react';
import { DEFAULT_COMPANY_ENTITIES } from '../services/db';

export function CompanySwitcher({ activeGstin, onOpenModal, onToggleDirect, canSwitch = true }) {
  const currentEntity = DEFAULT_COMPANY_ENTITIES[activeGstin] || DEFAULT_COMPANY_ENTITIES['33GUPS2382N1ZF'];
  const isSRT = currentEntity.id === 'SRT';

  return (
    <div className="inline-flex items-center space-x-1.5 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      {/* Current Active Entity Chip */}
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
        isSRT 
          ? 'bg-amber-50 text-amber-950 border border-amber-200' 
          : 'bg-blue-50 text-blue-950 border border-blue-200'
      }`}>
        {isSRT ? (
          <Truck className="w-3.5 h-3.5 text-brand-gold-dark shrink-0" />
        ) : (
          <Globe2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        )}
        <span className="font-extrabold font-display tracking-tight text-[13px]">
          {currentEntity.company_name}
        </span>
        <span className="text-slate-300">|</span>
        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60 text-slate-700">
          GST: {currentEntity.gstin}
        </span>
      </div>

      {/* Switch Action Button - ONLY VISIBLE FOR ADMINS */}
      {canSwitch && (
        <button
          type="button"
          onClick={onOpenModal || onToggleDirect}
          title="Switch between Sri Ram Transport and Sri Ram Logistics"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-brand-gold-dark" />
          <span>Switch Entity</span>
        </button>
      )}
    </div>
  );
}

export default CompanySwitcher;
