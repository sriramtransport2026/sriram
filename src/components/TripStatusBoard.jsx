import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Truck, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ExternalLink, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Navigation,
  FileCheck,
  AlertCircle,
  Zap,
  CreditCard,
  Trash2,
  Edit3,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';
import { LRUploadModal } from './LRUploadModal';
import logoImg from '../assets/logo.png';

export function TripStatusBoard({ onBack, trips = [], clients = [], vehicles = [], onUpdateTripStatus, onTripCompleted, onNavigateToPayments, onDeleteTrip, onSaveTrip }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');
  const [activeTripForLRModal, setActiveTripForLRModal] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [editingBookedTrip, setEditingBookedTrip] = useState(null);

  // Extract unique client options for filter dropdown
  const clientOptions = useMemo(() => {
    const map = new Map();
    if (Array.isArray(clients)) {
      clients.forEach(c => {
        if (c && c.id && c.name) {
          map.set(c.id, { id: c.id, name: c.name });
        }
      });
    }
    if (Array.isArray(trips)) {
      trips.forEach(t => {
        const cId = t.client_id || t.client?.id || t.client?.name || t.client_name;
        const cName = t.client?.name || t.client_name;
        if (cId && cName && !map.has(cId)) {
          map.set(cId, { id: cId, name: cName });
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, trips]);

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      (trip.load_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (trip.vehicle?.vehicle_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (trip.client?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (trip.client_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (trip.to_location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (trip.lr_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    const matchesClient = selectedClientFilter === 'all' ||
      trip.client_id === selectedClientFilter ||
      trip.client?.id === selectedClientFilter ||
      trip.client?.name === selectedClientFilter ||
      trip.client_name === selectedClientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const bookedTrips = filteredTrips.filter(t => t.status === 'booked');
  const inTransitTrips = filteredTrips.filter(t => t.status === 'in_transit');
  const completedTrips = filteredTrips.filter(t => t.status === 'completed');

  const handleAdvanceStatus = (trip) => {
    if (trip.status === 'booked') {
      onUpdateTripStatus(trip.id, 'in_transit');
    } else if (trip.status === 'in_transit') {
      // Trigger Hard Gate modal for completed
      setActiveTripForLRModal(trip);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'booked':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Booked</span>
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Navigation className="w-3 h-3" />
            <span>In Transit</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/70">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition self-start"
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
            Logistics Workflow
          </span>
          <h2 className="text-lg sm:text-xl font-black text-brand-navy font-display">Trip Status Board</h2>
        </div>
      </div>

      {/* Control Bar: Search, Filter, and Kanban/Table toggle */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search & Client Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full md:max-w-xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Load ID, Vehicle #, Client, City, LR #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            />
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition appearance-none cursor-pointer"
            >
              <option value="all">All Clients / Companies ({clientOptions.length})</option>
              {clientOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter & View Switcher */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({trips.length})
            </button>
            <button
              onClick={() => setStatusFilter('booked')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${statusFilter === 'booked' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-amber-700'}`}
            >
              Booked ({trips.filter(t => t.status === 'booked').length})
            </button>
            <button
              onClick={() => setStatusFilter('in_transit')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${statusFilter === 'in_transit' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-blue-700'}`}
            >
              Transit ({trips.filter(t => t.status === 'in_transit').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-emerald-700'}`}
            >
              Completed ({trips.filter(t => t.status === 'completed').length})
            </button>
          </div>

          <div className="border-l border-slate-200 pl-2 sm:pl-3 flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-xl border transition ${viewMode === 'kanban' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl border transition ${viewMode === 'table' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
          {/* Column 1: Booked */}
          <div className="space-y-3 bg-amber-500/5 p-4 rounded-2xl border border-amber-200/50">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">Booked Loads</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {bookedTrips.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[350px]">
              {bookedTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 space-y-3 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-navy">#{trip.load_id}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">{trip.loading_date}</span>
                      <button
                        type="button"
                        onClick={() => setEditingBookedTrip(trip)}
                        className="text-slate-400 hover:text-brand-navy p-0.5 rounded cursor-pointer transition"
                        title="Edit Booked Load"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteTrip && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete trip #${trip.load_id}?`)) onDeleteTrip(trip.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate">{trip.client?.name || 'Client'}</p>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{trip.vehicle?.vehicle_number}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{trip.from_location} → <strong>{trip.to_location}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Freight</span>
                      <span className="font-bold text-slate-800">₹{Number(trip.freight_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Profit</span>
                      <span className={`font-bold ${trip.profit >= 0 ? 'text-brand-green' : 'text-rose-600'}`}>
                        ₹{Number(trip.profit).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvanceStatus(trip)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
                  >
                    <span>Dispatch (In Transit)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {bookedTrips.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">No loads currently booked</div>
              )}
            </div>
          </div>

          {/* Column 2: In Transit */}
          <div className="space-y-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-200/50">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-bold text-sm text-slate-800">In Transit</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {inTransitTrips.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[350px]">
              {inTransitTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 space-y-3 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-navy">#{trip.load_id}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">{trip.loading_date}</span>
                      {onDeleteTrip && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete trip #${trip.load_id}?`)) onDeleteTrip(trip.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate">{trip.client?.name || 'Client'}</p>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-700">{trip.vehicle?.vehicle_number}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{trip.from_location} → <strong>{trip.to_location}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Freight</span>
                      <span className="font-bold text-slate-800">₹{Number(trip.freight_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Profit</span>
                      <span className={`font-bold ${trip.profit >= 0 ? 'text-brand-green' : 'text-rose-600'}`}>
                        ₹{Number(trip.profit).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Hard Gate Button */}
                  <button
                    onClick={() => handleAdvanceStatus(trip)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm hover:shadow transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Upload Signed LR & Complete</span>
                  </button>
                </div>
              ))}

              {inTransitTrips.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">No loads currently in transit</div>
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="space-y-3 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-200/50">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-brand-green" />
                <h3 className="font-bold text-sm text-slate-800">Completed (LR Verified)</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {completedTrips.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[350px]">
              {completedTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 space-y-3 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-extrabold text-brand-navy">#{trip.load_id}</span>
                      {(trip.is_direct_invoice || trip.entry_type === 'direct_invoice') && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          <span>Direct</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">{trip.loading_date}</span>
                      {onDeleteTrip && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete trip #${trip.load_id}?`)) onDeleteTrip(trip.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate">{trip.client?.name || 'Client'}</p>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{trip.vehicle?.vehicle_number}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{trip.from_location} → <strong>{trip.to_location}</strong></span>
                  </div>

                  {/* Verified LR details badge */}
                  <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">LR No: {trip.lr_number || 'Archived'}</span>
                      <span className="text-[10px] text-emerald-600">
                        {(trip.is_direct_invoice || trip.entry_type === 'direct_invoice') ? '⚡ Direct Invoice Verified' : 'Proof of Delivery Verified'}
                      </span>
                    </div>
                    {trip.lr_file_url && (
                      <button
                        onClick={() => setPreviewDocUrl(trip.lr_file_url)}
                        className="p-1.5 bg-white text-emerald-700 hover:text-emerald-900 rounded-lg shadow-sm border border-emerald-200"
                        title="View LR Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[10px]">Billed: ₹{Number(trip.freight_amount).toLocaleString('en-IN')}</span>
                    <span className="font-bold text-brand-green">Profit: ₹{Number(trip.profit).toLocaleString('en-IN')}</span>
                  </div>

                  {trip.invoiced ? (
                    <div className="w-full py-1.5 px-2.5 flex items-center justify-between text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200">
                      <span className="truncate">
                        Invoiced {trip.direct_invoice_number ? `(${trip.direct_invoice_number})` : ''}
                      </span>
                      {onNavigateToPayments && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToPayments(trip.id || trip.load_id);
                          }}
                          className="text-[10px] font-extrabold text-indigo-800 hover:underline flex items-center space-x-0.5 shrink-0 ml-1 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Payments ➔</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full py-1.5 px-2.5 flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="truncate">Ready for Invoice Batch</span>
                      {onNavigateToPayments && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToPayments(trip.id || trip.load_id);
                          }}
                          className="text-[10px] font-extrabold text-emerald-800 hover:underline flex items-center space-x-0.5 shrink-0 ml-1 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Payments ➔</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {completedTrips.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">No completed loads matching filter</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-soft border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">LR NO</th>
                  <th className="py-3.5 px-4">Loading Date</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Vehicle #</th>
                  <th className="py-3.5 px-4">Route</th>
                  <th className="py-3.5 px-4 text-right">Freight (Client)</th>
                  <th className="py-3.5 px-4 text-right">Vehicle Freight</th>
                  <th className="py-3.5 px-4 text-right">Profit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">LR Copy</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-brand-navy">
                      <div className="flex items-center space-x-1.5">
                        <span>#{trip.load_id}</span>
                        {(trip.is_direct_invoice || trip.entry_type === 'direct_invoice') && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Direct
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{trip.loading_date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{trip.client?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{trip.vehicle?.vehicle_number || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{trip.from_location} → {trip.to_location}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(trip.freight_amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{Number(trip.vehicle_freight).toLocaleString('en-IN')}</td>
                    <td className={`py-3 px-4 text-right font-bold ${trip.profit >= 0 ? 'text-brand-green' : 'text-rose-600'}`}>
                      ₹{Number(trip.profit).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(trip.status)}</td>
                    <td className="py-3 px-4 text-center">
                      {trip.lr_file_url ? (
                        <button
                          onClick={() => setPreviewDocUrl(trip.lr_file_url)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{trip.lr_number || 'View'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">{trip.lr_number || '—'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trip.status === 'booked' && (
                        <button
                          onClick={() => handleAdvanceStatus(trip)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] transition"
                        >
                          Dispatch
                        </button>
                      )}
                      {trip.status === 'in_transit' && (
                        <button
                          onClick={() => handleAdvanceStatus(trip)}
                          className="px-3 py-1 bg-brand-green hover:bg-brand-green-dark text-white rounded-lg font-bold text-[11px] transition flex items-center space-x-1 mx-auto"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Upload LR</span>
                        </button>
                      )}
                      {trip.status === 'completed' && (
                        onNavigateToPayments ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToPayments(trip.id || trip.load_id);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-extrabold transition cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Payments</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Completed</span>
                        )
                      )}
                      {onDeleteTrip && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete trip #${trip.load_id}?`)) onDeleteTrip(trip.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1.5 cursor-pointer inline-block"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {trip.status === 'booked' && (
                        <button
                          type="button"
                          onClick={() => setEditingBookedTrip(trip)}
                          className="p-1 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition ml-1 cursor-pointer inline-block"
                          title="Edit Booked Load"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HARD GATE MODAL */}
      <LRUploadModal
        trip={activeTripForLRModal}
        isOpen={Boolean(activeTripForLRModal)}
        onClose={() => setActiveTripForLRModal(null)}
        onSuccess={(updated) => {
          onTripCompleted(updated);
          setActiveTripForLRModal(null);
        }}
      />

      {/* EDIT BOOKED LOAD MODAL */}
      {editingBookedTrip && (
        <EditBookedTripModal
          trip={editingBookedTrip}
          clients={clients}
          vehicles={vehicles}
          onClose={() => setEditingBookedTrip(null)}
          onSave={onSaveTrip}
        />
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Archived Signed LR Proof of Delivery</h3>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
              >
                Close ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 p-2 flex justify-center bg-slate-50">
              <img src={previewDocUrl} alt="Signed LR Document" className="max-h-[60vh] object-contain rounded-lg shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditBookedTripModal({ trip, clients = [], vehicles = [], onClose, onSave }) {
  const matchedClient = clients.find(c => 
    c.id === trip?.client_id || 
    (c.name && trip?.client?.name && c.name.toLowerCase() === trip.client.name.toLowerCase()) ||
    (c.name && trip?.client_name && c.name.toLowerCase() === trip.client_name.toLowerCase())
  );
  
  const tripVehNo = trip?.vehicle_number || trip?.vehicle?.vehicle_number || trip?.truck_number;
  const matchedVehicle = vehicles.find(v => 
    v.id === trip?.vehicle_id || 
    (v.vehicle_number && tripVehNo && v.vehicle_number.replace(/\s+/g, '').toUpperCase() === tripVehNo.replace(/\s+/g, '').toUpperCase()) ||
    (v.truck_number && tripVehNo && v.truck_number.replace(/\s+/g, '').toUpperCase() === tripVehNo.replace(/\s+/g, '').toUpperCase())
  );

  const [formData, setFormData] = useState({
    loading_date: trip?.loading_date || new Date().toISOString().split('T')[0],
    load_id: trip?.load_id || trip?.lr_number || '',
    client_id: matchedClient?.id || trip?.client_id || (clients[0]?.id || ''),
    vehicle_id: matchedVehicle?.id || trip?.vehicle_id || (vehicles[0]?.id || ''),
    from_location: trip?.from_location || '',
    to_location: trip?.to_location || '',
    goods_description: trip?.goods_description || trip?.material_name || trip?.material || trip?.goods || trip?.product_name || trip?.item_description || trip?.notes || '',
    rate_type: trip?.rate_type || (trip?.unit_type === 'fixed' ? 'fixed' : 'MT'),
    tons: trip?.tons || trip?.quantity || trip?.charged_weight || 1,
    freight_rate: trip?.freight_rate || trip?.rate || trip?.freight_amount || 0,
    vehicle_rate: trip?.vehicle_rate || trip?.vehicle_freight || trip?.vehicle_hire_cost || 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tonsVal = parseFloat(formData.tons) || 0;
    const rateVal = parseFloat(formData.freight_rate) || 0;
    const freightAmount = formData.rate_type === 'fixed' ? rateVal : (tonsVal * rateVal);
    const vhRateVal = parseFloat(formData.vehicle_rate) || 0;
    const vehicleFreight = formData.rate_type === 'fixed' ? vhRateVal : (tonsVal * vhRateVal);
    const profit = freightAmount - vehicleFreight;

    const selectedClient = clients.find(c => c.id === formData.client_id) || matchedClient;
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id) || matchedVehicle;

    if (onSave) {
      await onSave({
        ...trip,
        ...formData,
        lr_number: formData.load_id,
        client_name: selectedClient?.name || trip.client_name || trip.client?.name,
        client: selectedClient || trip.client,
        vehicle_number: selectedVehicle?.vehicle_number || selectedVehicle?.truck_number || trip.vehicle_number || trip.vehicle?.vehicle_number,
        vehicle: selectedVehicle || trip.vehicle,
        freight_amount: freightAmount,
        vehicle_freight: vehicleFreight,
        profit: profit,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 font-display">
            Edit Booked Load #{trip.load_id}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Loading Date</label>
              <input
                type="date"
                required
                value={formData.loading_date}
                onChange={(e) => setFormData(f => ({ ...f, loading_date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">LR / Load ID</label>
              <input
                type="text"
                required
                value={formData.load_id}
                onChange={(e) => setFormData(f => ({ ...f, load_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Client</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData(f => ({ ...f, client_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle</label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData(f => ({ ...f, vehicle_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicle_number || v.truck_number || v.registration_number || v.id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">From Location</label>
              <input
                type="text"
                required
                value={formData.from_location}
                onChange={(e) => setFormData(f => ({ ...f, from_location: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">To Location</label>
              <input
                type="text"
                required
                value={formData.to_location}
                onChange={(e) => setFormData(f => ({ ...f, to_location: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Rate Type</label>
              <select
                value={formData.rate_type}
                onChange={(e) => setFormData(f => ({ ...f, rate_type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white"
              >
                <option value="MT">MT (Tonnage)</option>
                <option value="fixed">Fixed Rate</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {formData.rate_type === 'fixed' ? 'Qty / Units' : 'Weight (MT)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tons}
                onChange={(e) => setFormData(f => ({ ...f, tons: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Billing Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.freight_rate}
                onChange={(e) => setFormData(f => ({ ...f, freight_rate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Lorry Hire Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.vehicle_rate}
                onChange={(e) => setFormData(f => ({ ...f, vehicle_rate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Material / Goods</label>
              <input
                type="text"
                value={formData.goods_description}
                onChange={(e) => setFormData(f => ({ ...f, goods_description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl shadow transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
