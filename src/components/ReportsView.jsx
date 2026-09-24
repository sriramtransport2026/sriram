import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  Users, 
  Calendar, 
  Filter, 
  BarChart3, 
  PieChart as PieIcon,
  FileSpreadsheet,
  CreditCard,
  ChevronRight,
  Download,
  ArrowUpRight,
  Layers,
  Award,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import logoImg from '../assets/logo.png';

const COLORS = ['#0a2240', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'];

export function ReportsView({ onBack, trips = [], clients = [], vehicles = [], companySettings, onNavigateToPayments }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'clients' | 'fleet' | 'routes'
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'this_month' | 'last_month' | '30_days'

  // Date Preset Handler
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === '30_days') {
      const past = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      setStartDate(past);
      setEndDate(today);
    }
  };

  const handleResetFilters = () => {
    setSelectedClient('all');
    setSelectedVehicle('all');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  // Filtered trips based on criteria
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (selectedClient !== 'all' && trip.client_id !== selectedClient && trip.client?.id !== selectedClient) return false;
      if (selectedVehicle !== 'all' && trip.vehicle_id !== selectedVehicle && trip.vehicle?.id !== selectedVehicle) return false;
      if (startDate && trip.loading_date < startDate) return false;
      if (endDate && trip.loading_date > endDate) return false;
      return true;
    });
  }, [trips, selectedClient, selectedVehicle, startDate, endDate]);

  // Aggregate Key Financial Metrics
  const totalBilled = filteredTrips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
  const totalPaid = filteredTrips.reduce((acc, t) => acc + (parseFloat(t.vehicle_freight) || 0), 0);
  const totalProfit = Math.round((totalBilled - totalPaid) * 100) / 100;
  const marginPercent = totalBilled > 0 ? ((totalProfit / totalBilled) * 100).toFixed(1) : '0.0';
  const avgBilledPerTrip = filteredTrips.length > 0 ? (totalBilled / filteredTrips.length).toFixed(0) : 0;

  // Chart Data: Date-wise aggregation
  const dateWiseData = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const d = t.loading_date || 'Unknown';
      if (!map[d]) {
        map[d] = { date: d, Revenue: 0, Expenses: 0, Profit: 0, Trips: 0 };
      }
      const billed = parseFloat(t.freight_amount) || 0;
      const vhPaid = parseFloat(t.vehicle_freight) || 0;
      map[d].Revenue += billed;
      map[d].Expenses += vhPaid;
      map[d].Profit += (billed - vhPaid);
      map[d].Trips += 1;
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredTrips]);

  // Chart Data: Client Profitability Ranking
  const clientAnalytics = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const cName = t.client?.name || t.client_name || 'Direct Client';
      if (!map[cName]) {
        map[cName] = { name: cName, Billed: 0, Expenses: 0, Profit: 0, Trips: 0 };
      }
      const billed = parseFloat(t.freight_amount) || 0;
      const vhPaid = parseFloat(t.vehicle_freight) || 0;
      map[cName].Billed += billed;
      map[cName].Expenses += vhPaid;
      map[cName].Profit += (billed - vhPaid);
      map[cName].Trips += 1;
    });
    return Object.values(map).map(c => ({
      ...c,
      Margin: c.Billed > 0 ? ((c.Profit / c.Billed) * 100).toFixed(1) : 0
    })).sort((a, b) => b.Billed - a.Billed);
  }, [filteredTrips]);

  // Chart Data: Fleet Performance
  const vehicleAnalytics = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const vNum = t.vehicle?.vehicle_number || t.vehicle_number || 'Unassigned';
      if (!map[vNum]) {
        map[vNum] = { name: vNum, Billed: 0, Expenses: 0, Profit: 0, Trips: 0 };
      }
      const billed = parseFloat(t.freight_amount) || 0;
      const vhPaid = parseFloat(t.vehicle_freight) || 0;
      map[vNum].Billed += billed;
      map[vNum].Expenses += vhPaid;
      map[vNum].Profit += (billed - vhPaid);
      map[vNum].Trips += 1;
    });
    return Object.values(map).sort((a, b) => b.Billed - a.Billed);
  }, [filteredTrips]);

  // Chart Data: Route / Destination analytics
  const routeAnalytics = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const routeKey = `${t.from_location || 'BANGALORE'} → ${t.to_location || 'DESTINATION'}`;
      if (!map[routeKey]) {
        map[routeKey] = { name: routeKey, Billed: 0, Profit: 0, Trips: 0 };
      }
      const billed = parseFloat(t.freight_amount) || 0;
      const vhPaid = parseFloat(t.vehicle_freight) || 0;
      map[routeKey].Billed += billed;
      map[routeKey].Profit += (billed - vhPaid);
      map[routeKey].Trips += 1;
    });
    return Object.values(map).sort((a, b) => b.Billed - a.Billed).slice(0, 8);
  }, [filteredTrips]);

  // Settlement Distribution for Pie Chart
  const settlementPieData = useMemo(() => {
    const map = { full_payment: 0, half_payment: 0, advance: 0, pending: 0 };
    filteredTrips.forEach(t => {
      const st = t.payment_status || 'pending';
      map[st] = (map[st] || 0) + 1;
    });
    return [
      { name: 'Full Settlement', value: map.full_payment, color: '#10b981' },
      { name: 'Half Payment', value: map.half_payment, color: '#3b82f6' },
      { name: 'Advance Only', value: map.advance, color: '#f59e0b' },
      { name: 'Pending / Unpaid', value: map.pending, color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [filteredTrips]);

  // Export Filtered Data to CSV
  const handleExportCSV = () => {
    if (filteredTrips.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ['Load ID', 'Date', 'LR Number', 'Client', 'Vehicle', 'From', 'To', 'Billing Amount (INR)', 'Lorry Hire Cost (INR)', 'Net Profit (INR)', 'Payment Status'];
    const rows = filteredTrips.map(t => [
      `"${t.load_id || ''}"`,
      `"${t.loading_date || ''}"`,
      `"${t.lr_number || ''}"`,
      `"${(t.client?.name || t.client_name || '').replace(/"/g, '""')}"`,
      `"${(t.vehicle?.vehicle_number || t.vehicle_number || '').replace(/"/g, '""')}"`,
      `"${(t.from_location || '').replace(/"/g, '""')}"`,
      `"${(t.to_location || '').replace(/"/g, '""')}"`,
      t.freight_amount || 0,
      t.vehicle_freight || 0,
      t.profit || 0,
      `"${t.payment_status || 'pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in">
      {/* Top Navigation & Company Info */}
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

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-gold-dark" />
            <span>Export CSV</span>
          </button>

          {onNavigateToPayments && (
            <button
              type="button"
              onClick={() => onNavigateToPayments()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-brand-gold" />
              <span>Payments Module</span>
            </button>
          )}

          <div className="text-left sm:text-right hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Financial Intelligence Hub
            </span>
            <h2 className="text-lg font-black text-brand-navy font-display">P&L & Data Analytics</h2>
          </div>
        </div>
      </div>

      {/* Analytics Category Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial Overview & Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'clients'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Client Profitability ({clientAnalytics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vehicle Fleet Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'routes'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Route & Corridor Intelligence</span>
        </button>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-brand-navy" />
            <span>Smart Financial Filters</span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold lowercase">
              ({filteredTrips.length} loads matching)
            </span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: '30_days', label: 'Last 30 Days' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  datePreset === p.id 
                    ? 'bg-brand-gold text-brand-navy font-black shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            {(selectedClient !== 'all' || selectedVehicle !== 'all' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[11px] font-bold flex items-center space-x-1 transition ml-1"
                title="Reset All Filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Filter by Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            >
              <option value="all">All Clients ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Filter by Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            >
              <option value="all">All Vehicles ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Freight Billed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80 space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Total Billed Revenue</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-brand-navy">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-display text-slate-900">
              ₹{Number(totalBilled).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{filteredTrips.length} Consignments</span>
              <span className="font-semibold text-slate-700">₹{Number(avgBilledPerTrip).toLocaleString('en-IN')}/load</span>
            </div>
          </div>
        </div>

        {/* Total Lorry Freight Paid */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80 space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Lorry Hire Expenses</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-display text-slate-900">
              ₹{Number(totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Disbursed to Lorry Owners</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="font-bold uppercase tracking-wider text-[10px]">Net Retained Margin</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-brand-green">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-display text-brand-green">
              ₹{Number(totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">Net Retained Profit</p>
          </div>
        </div>

        {/* Margin % */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80 space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Operating Margin %</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-display text-purple-900">
              {marginPercent}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Profit Yield per Rupee Billed</p>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & TRENDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Financial Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-display">Revenue, Expenses & Profit Trend</h3>
                  <p className="text-xs text-slate-400">Daily financial timeline analysis</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {dateWiseData.length} Timeline Nodes
                </span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dateWiseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip 
                      formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Revenue" fill="#0a2240" radius={[6, 6, 0, 0]} name="Client Billed (₹)" />
                    <Bar dataKey="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Lorry Paid (₹)" />
                    <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Net Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Settlement Status Distribution */}
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 font-display">Settlement Status</h3>
                <PieIcon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-56 w-full relative flex items-center justify-center">
                {settlementPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={settlementPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {settlementPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${val} Consignments`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">No data for selected filters</span>
                )}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {settlementPieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-medium text-slate-700">{d.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consignment Freight & Direct Payments Table */}
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">Consignments Financial Breakdown</h3>
                <p className="text-xs text-slate-500">Filtered consignment revenue, lorry costs & net margins</p>
              </div>
              {onNavigateToPayments && (
                <button
                  type="button"
                  onClick={() => onNavigateToPayments()}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <span>Open Payments Module</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto w-full min-w-0">
              <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                    <th className="py-3 px-4">Load ID & Date</th>
                    <th className="py-3 px-4">Client / Route</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4 text-right">Freight Billed</th>
                    <th className="py-3 px-4 text-right">Lorry Hire Cost</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTrips.slice(0, 15).map((trip) => {
                    const status = trip.payment_status || 'pending';
                    return (
                      <tr key={trip.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-brand-navy">
                          #{trip.load_id}
                          <span className="block text-[10px] text-slate-400 font-sans">{trip.loading_date}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{trip.client?.name || trip.client_name || 'Client'}</span>
                          <span className="block text-[11px] text-slate-400">{trip.from_location} → {trip.to_location}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {trip.vehicle?.vehicle_number || trip.vehicle_number || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{parseFloat(trip.freight_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700 font-semibold">
                          ₹{parseFloat(trip.vehicle_freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{parseFloat(trip.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            status === 'full_payment' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            status === 'half_payment' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            status === 'advance' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onNavigateToPayments && (
                            <button
                              type="button"
                              onClick={() => onNavigateToPayments(trip.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3 text-brand-gold" />
                              <span>Settle</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTrips.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No consignments match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CLIENT PROFITABILITY */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Clients by Revenue Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 font-display">Client Billed Revenue Comparison</h3>
                <span className="text-xs text-slate-400">Top Accounts</span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientAnalytics.slice(0, 7)} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} width={100} />
                    <Tooltip 
                      formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} 
                    />
                    <Bar dataKey="Billed" fill="#0a2240" radius={[0, 6, 6, 0]} name="Billed (₹)" />
                    <Bar dataKey="Profit" fill="#10b981" radius={[0, 6, 6, 0]} name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Client Ranking Cards */}
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 font-display">Client Account Leaderboard</h3>
                <span className="text-xs text-slate-400">Ranked by Freight</span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {clientAnalytics.map((c, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-navy text-white flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                        <p className="text-[11px] text-slate-500">{c.Trips} Consignments Handled</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-900 block">
                        ₹{Number(c.Billed).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        ₹{Number(c.Profit).toLocaleString('en-IN')} ({c.Margin}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FLEET PERFORMANCE */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">Vehicle Freight Contribution & Lorry Costs</h3>
                <p className="text-xs text-slate-400">Individual lorry revenue and margin performance</p>
              </div>
              <Truck className="w-5 h-5 text-brand-navy" />
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleAnalytics.slice(0, 10)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip 
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Billed" fill="#0a2240" radius={[6, 6, 0, 0]} name="Freight Generated (₹)" />
                  <Bar dataKey="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Vehicle Hire Paid (₹)" />
                  <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Net Margin (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleAnalytics.map((v, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-brand-navy">{v.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {v.Trips} Trips
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Billed</span>
                    <span className="font-bold text-slate-900">₹{Number(v.Billed).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase">Net Profit</span>
                    <span className="font-bold text-emerald-800">₹{Number(v.Profit).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: ROUTE INTELLIGENCE */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">Top Route Freight Volumes</h3>
                <p className="text-xs text-slate-400">Freight volume breakdown by origin & destination corridor</p>
              </div>
              <MapPin className="w-5 h-5 text-rose-500" />
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeAnalytics} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} width={130} />
                  <Tooltip 
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} 
                  />
                  <Bar dataKey="Billed" fill="#0a2240" radius={[0, 6, 6, 0]} name="Route Freight (₹)" />
                  <Bar dataKey="Profit" fill="#10b981" radius={[0, 6, 6, 0]} name="Route Profit (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
