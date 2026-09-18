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
  ChevronRight
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
  Line 
} from 'recharts';
import logoImg from '../assets/logo.png';

export function ReportsView({ onBack, trips = [], clients = [], vehicles = [], companySettings, onNavigateToPayments }) {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered trips based on criteria
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (selectedClient !== 'all' && trip.client_id !== selectedClient) return false;
      if (selectedVehicle !== 'all' && trip.vehicle_id !== selectedVehicle) return false;
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

  // Chart Data: Date-wise aggregation
  const dateWiseData = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const d = t.loading_date || 'Unknown';
      if (!map[d]) {
        map[d] = { date: d, Billed: 0, Paid: 0, Profit: 0 };
      }
      map[d].Billed += parseFloat(t.freight_amount) || 0;
      map[d].Paid += parseFloat(t.vehicle_freight) || 0;
      map[d].Profit += parseFloat(t.profit) || 0;
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredTrips]);

  // Chart Data: Destination distribution
  const destinationData = useMemo(() => {
    const map = {};
    filteredTrips.forEach(t => {
      const dest = t.to_location || 'Other';
      if (!map[dest]) map[dest] = { name: dest, Billed: 0, Trips: 0 };
      map[dest].Billed += parseFloat(t.freight_amount) || 0;
      map[dest].Trips += 1;
    });
    return Object.values(map).sort((a, b) => b.Billed - a.Billed).slice(0, 6);
  }, [filteredTrips]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Bar */}
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
          {onNavigateToPayments && (
            <button
              type="button"
              onClick={() => onNavigateToPayments()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-brand-gold" />
              <span>Payments Module →</span>
            </button>
          )}
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Financial Intelligence
            </span>
            <h2 className="text-lg sm:text-xl font-black text-brand-navy font-display">Profit & Loss Reports</h2>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-600 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-brand-navy" />
          <span>Filter P&L Analytics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">All Clients ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">All Vehicles ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number} ({v.owner_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Freight Billed */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-soft border border-slate-200/80 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Freight Billed</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-slate-900">
            ₹{Number(totalBilled).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">Charged across {filteredTrips.length} active consignments</p>
        </div>

        {/* Total Vehicle Freight Paid */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Vehicle Freight Disbursed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-slate-900">
            ₹{Number(totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">Paid to lorry owners & drivers</p>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-emerald-200/80 space-y-2 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]"> Net Profit</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-brand-green">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-brand-green">
            ₹{Number(totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">Net retained brokerage margin</p>
        </div>

        {/* Margin % */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Operating Margin</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-purple-900">
            {marginPercent}%
          </p>
          <p className="text-[11px] text-slate-400">Average profit yield per rupee billed</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date-wise Revenue vs Lorry Cost Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 font-display">Revenue vs Vehicle Freight Timeline</h3>
            <span className="text-xs text-slate-400">Daily Trends</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateWiseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip 
                  formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Billed" fill="#0a2240" radius={[6, 6, 0, 0]} name="Client Billed (₹)" />
                <Bar dataKey="Paid" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Lorry Paid (₹)" />
                <Bar dataKey="Profit" fill="#16a34a" radius={[6, 6, 0, 0]} name="Net Profit (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Destination Freight Volume */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 font-display">Top Route Volumes</h3>
            <span className="text-xs text-slate-400">Freight Breakdown</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinationData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} width={90} />
                <Tooltip 
                  formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} 
                />
                <Bar dataKey="Billed" fill="#0a2240" radius={[0, 6, 6, 0]} name="Freight Billed (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consignment Freight & Direct Payments Table */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-display">Consignments & Freight Settlements</h3>
            <p className="text-xs text-slate-500">Filtered report consignments with direct payment action</p>
          </div>
          {onNavigateToPayments && (
            <button
              type="button"
              onClick={() => onNavigateToPayments()}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <span>View all in Payments Module</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                <th className="py-3 px-4">Load ID & Date</th>
                <th className="py-3 px-4">Consignor / Route</th>
                <th className="py-3 px-4 text-right">Freight Billed</th>
                <th className="py-3 px-4 text-right">Paid to Lorry</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTrips.slice(0, 10).map((trip) => {
                const status = trip.payment_status || 'pending';
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{trip.load_id}
                      <span className="block text-[10px] text-slate-400 font-sans">{trip.loading_date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{trip.consignor || 'Ashirvad Pipes'}</span>
                      <span className="block text-[11px] text-slate-400">{trip.from_location} → {trip.to_location}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{parseFloat(trip.freight_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">
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
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-navy hover:bg-brand-navy-dark text-white text-[11px] font-bold shadow-2xs transition cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3 text-brand-gold" />
                          <span>Record Payment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
