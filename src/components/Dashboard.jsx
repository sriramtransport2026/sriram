import React from 'react';
import { 
  PlusCircle, 
  Truck, 
  FileCheck, 
  Users, 
  Car, 
  TrendingUp, 
  Settings, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
  LogOut,
  UserCheck,
  Building2,
  ArrowLeftRight,
  CreditCard,
  Zap,
  ClipboardList
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { CompanySwitcher } from './CompanySwitcher';

export function Dashboard({ 
  onNavigate, 
  metrics = { 
    totalTrips: 0, 
    bookedCount: 0, 
    inTransitCount: 0, 
    completedCount: 0, 
    unInvoicedCount: 0,
    clientsCount: 0,
    vehiclesCount: 0,
    totalProfit: 0,
    totalFreight: 0
  },
  companySettings,
  currentUser,
  onLogout,
  onSwitchCompany,
  onOpenCompanyModal
}) {
  const isUserAdmin = currentUser?.role === 'admin';
  const allowedModuleIds = (Array.isArray(currentUser?.assigned_modules) && currentUser.assigned_modules.length > 0)
    ? currentUser.assigned_modules
    : (isUserAdmin 
        ? ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users'] 
        : ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments']);

  const baseModules = [
    {
      id: 'new-trip',
      title: 'New Trip Entry',
      subtitle: 'Issue digitized LR & calculate trip profit instantly',
      icon: PlusCircle,
      badge: 'Quick Book Load',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'hover:border-brand-gold group-hover:text-brand-gold-dark',
      iconBg: 'bg-amber-50 text-brand-gold-dark',
      statLabel: 'Today Ready',
      statValue: 'Digitized LR',
    },
    {
      id: 'direct-invoice',
      title: 'Direct Invoice Entry',
      subtitle: 'Single-entry multi-trip batch directly into completed & payments',
      icon: Zap,
      badge: '⚡ Multi-Trip Direct',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold',
      accentColor: 'hover:border-indigo-500 group-hover:text-indigo-700',
      iconBg: 'bg-indigo-50 text-indigo-700',
      statLabel: 'Bypasses Transit',
      statValue: 'Direct to Pay',
    },
    {
      id: 'status-board',
      title: 'Trip Status Board',
      subtitle: 'Track Booked, In Transit & LR Hard-Gated Completed loads',
      icon: Navigation,
      badge: `${metrics.inTransitCount} In Transit · ${metrics.bookedCount} Booked`,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      accentColor: 'hover:border-blue-500 group-hover:text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
      statLabel: 'Active Trips',
      statValue: `${metrics.inTransitCount + metrics.bookedCount} Loads`,
    },
    {
      id: 'invoices',
      title: 'Generate Invoice',
      subtitle: 'Batch completed trips into consolidated GST reverse-charge invoice',
      icon: FileCheck,
      badge: `${metrics.unInvoicedCount} Ready to Bill`,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      accentColor: 'hover:border-brand-gold group-hover:text-brand-gold-dark',
      iconBg: 'bg-amber-50 text-brand-gold-dark',
      statLabel: 'Completed Unbilled',
      statValue: `${metrics.unInvoicedCount} Trips`,
    },
    {
      id: 'clients',
      title: 'Clients Directory',
      subtitle: 'Manage consignees, GSTIN, billing addresses & ledger balances',
      icon: Users,
      badge: `${metrics.clientsCount} Registered`,
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      accentColor: 'hover:border-brand-navy-light group-hover:text-brand-navy',
      iconBg: 'bg-slate-100 text-brand-navy',
      statLabel: 'Key Accounts',
      statValue: 'Ashirvad +',
    },
    {
      id: 'vehicles',
      title: 'Vehicles Fleet',
      subtitle: 'Lorry master database with types, owners & freight rates',
      icon: Car,
      badge: `${metrics.vehiclesCount} Lorries`,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'hover:border-brand-gold group-hover:text-brand-gold-dark',
      iconBg: 'bg-amber-50 text-brand-gold-dark',
      statLabel: 'Fleet Size',
      statValue: `${metrics.vehiclesCount} Trucks`,
    },
    {
      id: 'reports',
      title: 'Reports & P&L',
      subtitle: 'Real-time profit margin analytics, freight billed vs paid breakdown',
      icon: TrendingUp,
      badge: `₹${Math.round(metrics.totalProfit).toLocaleString('en-IN')} Net Profit`,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentColor: 'hover:border-emerald-500 group-hover:text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-700',
      statLabel: 'Total Freight Billed',
      statValue: `₹${Math.round(metrics.totalFreight).toLocaleString('en-IN')}`,
    },
    {
      id: 'payments',
      title: 'Payments & Settlements',
      subtitle: 'Advance, Half Payment & Full Clearance with Cash / Online UTR tracking',
      icon: CreditCard,
      badge: `${metrics.pendingPaymentsCount || 0} Pending`,
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      accentColor: 'hover:border-indigo-500 group-hover:text-indigo-700',
      iconBg: 'bg-indigo-50 text-indigo-700',
      statLabel: 'Total Recovered',
      statValue: `₹${Math.round(metrics.totalCollected || 0).toLocaleString('en-IN')}`,
    },
    {
      id: 'settings',
      title: 'Settings & Profile',
      subtitle: 'Company GSTIN, Hosur branch coordinates, SAC 9965 & invoice sequencing',
      icon: Settings,
      badge: companySettings?.gstin || '33GUPS2382N1ZF',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      accentColor: 'hover:border-slate-500 group-hover:text-slate-600',
      iconBg: 'bg-slate-100 text-slate-700',
      statLabel: 'Branch Office',
      statValue: 'Bathalapalli, Hosur',
    },
    {
      id: 'user-logs',
      title: 'User Activity Logs',
      subtitle: 'Complete audit trail of user logins, trips, invoices, payments & master edits',
      icon: ClipboardList,
      badge: 'Audit Trail',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      accentColor: 'hover:border-emerald-500 group-hover:text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-700',
      statLabel: 'Full History',
      statValue: 'User Actions',
    },
  ];

  const adminModules = isUserAdmin ? [
    {
      id: 'users',
      title: 'User Management & Roles',
      subtitle: 'Create users, assign operational modules & restrict company visibility',
      icon: UserCheck,
      badge: 'Admin Access',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold',
      accentColor: 'hover:border-indigo-500 group-hover:text-indigo-700',
      iconBg: 'bg-indigo-50 text-indigo-700',
      statLabel: 'Security Scope',
      statValue: 'User Manager',
    },
  ] : [];

  const modules = isUserAdmin 
    ? [...baseModules, ...adminModules] 
    : baseModules.filter(m => allowedModuleIds.includes(m.id));

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Utility Bar: Terminal Status, Company Switcher & Authorized User Session */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-700">Sri Ram Transport Group</span>
          <span className="text-slate-300">|</span>
          <span className="text-brand-navy font-semibold">Hosur Regional Hub</span>

          {currentUser?.assigned_company_name && currentUser.assigned_company_name !== 'All Companies' && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[10px] sm:text-[11px] font-bold shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>Scope: <strong className="text-brand-navy underline">{currentUser.assigned_company_name}</strong></span>
            </div>
          )}
        </div>

        {/* Company Switcher & User Profile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Active Operating Firm Switcher (Switching is Admin-Only) */}
          <CompanySwitcher 
            activeGstin={companySettings?.gstin} 
            onOpenModal={isUserAdmin ? onOpenCompanyModal : undefined} 
            onToggleDirect={isUserAdmin ? onSwitchCompany : undefined} 
            canSwitch={isUserAdmin}
          />

          {currentUser && (
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-200/80 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-brand-navy text-brand-gold text-[11px] font-black flex items-center justify-center uppercase shadow-inner shrink-0">
                {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight max-w-[120px] sm:max-w-none truncate">
                  {currentUser.full_name || currentUser.username}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-brand-gold-dark uppercase tracking-wider block">
                  {currentUser.role || 'Staff'}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out of Portal"
                className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Branding Header featuring Logo & Logo Colors */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy-dark via-brand-navy to-brand-navy-subtle rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-soft-lg text-white border border-brand-navy-light/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          
          {/* Logo & Brand Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Logo Badge Container */}
            <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border border-white/20 shrink-0 flex items-center justify-center">
              <img 
                src={logoImg} 
                alt="Sri Ram Transport Group Logo" 
                className="h-12 sm:h-20 w-auto object-contain"
              />
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>{companySettings?.branch_name || 'Bathalapalli Branch'} · Transport Logistics Hub</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-white">
                  {companySettings?.company_name || 'Sri Ram Transport'}
                </h1>
                {companySettings?.id === 'SRL' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/30 border border-blue-400 text-blue-300 font-extrabold text-xs">
                    SRL
                  </span>
                )}
              </div>

              {/* GSTIN, PAN & Quick Switch Pills */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 text-white font-mono text-[11px] sm:text-xs font-black border border-white/20 shadow-sm flex items-center space-x-1.5">
                  <span className="text-slate-300 font-sans text-[10px] uppercase font-bold">GSTIN:</span>
                  <span className="text-brand-gold font-bold">{companySettings?.gstin || '33GUPS2382N1ZF'}</span>
                </span>
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 text-slate-200 font-mono text-[11px] sm:text-xs font-bold border border-white/20 shadow-sm flex items-center space-x-1.5">
                  <span className="text-slate-300 font-sans text-[10px] uppercase font-bold">PAN:</span>
                  <span>{companySettings?.pan || 'GLIPS2382N'}</span>
                </span>
                {isUserAdmin && (
                  <button
                    type="button"
                    onClick={onOpenCompanyModal || onSwitchCompany}
                    className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-gold hover:bg-brand-gold-light text-brand-navy font-black text-[11px] sm:text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Switch Firm</span>
                  </button>
                )}
              </div>

              {/* Logo Sub-tagline */}
              <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-extrabold tracking-widest text-brand-gold uppercase pt-0.5">
                <span>{companySettings?.tagline || 'TRUST • TRANSPORT • TOGETHER'}</span>
              </div>

              <p className="text-xs text-slate-300 max-w-xl font-light leading-relaxed">
                {companySettings?.address}
              </p>

              <div className="text-xs text-slate-300 font-medium flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5">
                <span>Phones: <strong className="text-white font-bold">{companySettings?.phone}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>Email: <strong className="text-white font-bold">{companySettings?.email}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Banner styled with Logo Gold Accent */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 shrink-0 bg-white/5 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 text-center">
            <div className="px-1.5 sm:px-3">
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-gold-light uppercase tracking-wider">Booked</p>
              <div className="mt-0.5 sm:mt-1 flex items-center justify-center space-x-1 text-brand-gold font-black text-base sm:text-xl font-display">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline" />
                <span>{metrics.bookedCount}</span>
              </div>
            </div>
            <div className="px-1.5 sm:px-3 border-x border-white/10">
              <p className="text-[9px] sm:text-[10px] font-bold text-blue-300 uppercase tracking-wider">In Transit</p>
              <div className="mt-0.5 sm:mt-1 flex items-center justify-center space-x-1 text-blue-400 font-black text-base sm:text-xl font-display">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline" />
                <span>{metrics.inTransitCount}</span>
              </div>
            </div>
            <div className="px-1.5 sm:px-3">
              <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Completed</p>
              <div className="mt-0.5 sm:mt-1 flex items-center justify-center space-x-1 text-brand-green font-black text-base sm:text-xl font-display">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline" />
                <span>{metrics.completedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic speed streak background glow based on Logo Gold */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-12 w-96 h-96 bg-brand-navy-light/40 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Module Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-brand-navy tracking-tight font-display">
              Operations Hub
            </h2>
            <p className="text-xs text-slate-500">
              Select an operations module to enter full-screen view
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white border border-slate-200 rounded-full text-brand-navy shadow-sm">
            {modules.length} Modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className={`group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-soft-lg transition-all duration-200 cursor-pointer border border-slate-200/80 ${mod.accentColor} flex flex-col justify-between`}
              >
                <div>
                  {/* Card Header: Icon & Live Badge */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${mod.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-brand-navy group-hover:text-brand-navy-light transition mb-1 font-display">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed sm:min-h-[36px]">
                    {mod.subtitle}
                  </p>
                </div>

                {/* Card Bottom Meta */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      {mod.statLabel}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {mod.statValue}
                    </p>
                  </div>

                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 group-hover:bg-brand-navy group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
