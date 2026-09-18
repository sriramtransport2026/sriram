import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, Filter, ShieldCheck, User, Users, Clock, Calendar, 
  FileText, Download, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye, 
  Tag, Laptop, Layers, Activity, Truck, CreditCard, Banknote, Building2, 
  Zap, Settings, UserCheck, X, ChevronRight, Hash
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export function UserLogsView({
  onBack,
  logs = [],
  users = [],
  companySettings,
  currentUser,
  onRefreshLogs,
  onClearLogs,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'
  const [selectedFirmFilter, setSelectedFirmFilter] = useState('all');
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'table'
  const [inspectLog, setInspectLog] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // User filter
      if (selectedUserFilter !== 'all') {
        const matchUser = (log.user_id && log.user_id === selectedUserFilter) || 
                          (log.user_name && log.user_name.toLowerCase().includes(selectedUserFilter.toLowerCase())) ||
                          (log.user_email && log.user_email.toLowerCase() === selectedUserFilter.toLowerCase());
        if (!matchUser) return false;
      }

      // Module filter
      if (selectedModuleFilter !== 'all') {
        if ((log.module || '').toLowerCase() !== selectedModuleFilter.toLowerCase()) {
          return false;
        }
      }

      // Firm filter
      if (selectedFirmFilter !== 'all') {
        if (log.company_gstin !== selectedFirmFilter) {
          return false;
        }
      }

      // Date filter
      if (selectedDateFilter !== 'all' && log.created_at) {
        const logDate = new Date(log.created_at);
        const now = new Date();
        if (selectedDateFilter === 'today') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        } else if (selectedDateFilter === '7days') {
          const diffDays = (now - logDate) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedDateFilter === '30days') {
          const diffDays = (now - logDate) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = (log.user_name || '').toLowerCase().includes(q) ||
                      (log.user_email || '').toLowerCase().includes(q) ||
                      (log.action || '').toLowerCase().includes(q) ||
                      (log.module || '').toLowerCase().includes(q) ||
                      (log.description || '').toLowerCase().includes(q) ||
                      (log.company_name || '').toLowerCase().includes(q) ||
                      JSON.stringify(log.details || {}).toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [logs, selectedUserFilter, selectedModuleFilter, selectedDateFilter, selectedFirmFilter, searchQuery]);

  // Derived metrics
  const totalLogsCount = logs.length;
  const todayCount = logs.filter(l => {
    if (!l.created_at) return false;
    return new Date(l.created_at).toDateString() === new Date().toDateString();
  }).length;
  
  const uniqueUsersCount = new Set(logs.map(l => l.user_name || l.user_email || 'Unknown')).size;

  // Most active module
  const moduleCounts = useMemo(() => {
    const counts = {};
    logs.forEach(l => {
      const m = l.module || 'Other';
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const topModule = useMemo(() => {
    let top = 'Trips';
    let max = 0;
    Object.entries(moduleCounts).forEach(([mod, count]) => {
      if (count > max) {
        max = count;
        top = mod;
      }
    });
    return top;
  }, [moduleCounts]);

  // Action badge color helper
  const getActionBadge = (action = '') => {
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('ADD') || a.includes('RECORD')) {
      return { label: a.replace(/_/g, ' '), cls: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    }
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('COMPLETE')) {
      return { label: a.replace(/_/g, ' '), cls: 'bg-blue-50 text-blue-800 border-blue-300' };
    }
    if (a.includes('INVOICE') || a.includes('BILL')) {
      return { label: a.replace(/_/g, ' '), cls: 'bg-indigo-50 text-indigo-800 border-indigo-300' };
    }
    if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('SWITCH')) {
      return { label: a.replace(/_/g, ' '), cls: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
    if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('CANCEL')) {
      return { label: a.replace(/_/g, ' '), cls: 'bg-rose-50 text-rose-800 border-rose-300' };
    }
    return { label: a.replace(/_/g, ' '), cls: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  // Module icon helper
  const getModuleIcon = (module = '') => {
    const m = module.toLowerCase();
    if (m.includes('trip')) return <Truck className="w-3.5 h-3.5 text-blue-600" />;
    if (m.includes('pay')) return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
    if (m.includes('inv')) return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
    if (m.includes('client')) return <Users className="w-3.5 h-3.5 text-amber-600" />;
    if (m.includes('veh') || m.includes('lorry')) return <Truck className="w-3.5 h-3.5 text-purple-600" />;
    if (m.includes('auth')) return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    if (m.includes('sett')) return <Settings className="w-3.5 h-3.5 text-slate-600" />;
    return <Activity className="w-3.5 h-3.5 text-slate-600" />;
  };

  // Time formatter helper
  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoStr;
    }
  };

  const getRelativeTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch (e) {
      return '';
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const headers = ['ID', 'Date & Time', 'User Name', 'Email', 'Role', 'Action', 'Module', 'Description', 'Operating Firm', 'GSTIN', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      formatTimestamp(l.created_at),
      `"${(l.user_name || '').replace(/"/g, '""')}"`,
      l.user_email || '',
      l.user_role || '',
      l.action || '',
      l.module || '',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(l.company_name || '').replace(/"/g, '""')}"`,
      l.company_gstin || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `user_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshLogs) await onRefreshLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all user logs? This audit history will be permanently deleted.')) {
      if (onClearLogs) await onClearLogs();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200/70">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            type="button" 
            onClick={onBack} 
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Dashboard</span>
          </button>
          <div className="hidden md:flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <img src={logoImg} alt="Sri Ram Group" className="h-8 w-auto object-contain" />
            <div>
              <span className="text-xs font-black tracking-widest text-brand-navy uppercase block">
                {companySettings?.company_name || 'Sri Ram Transport'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                GSTIN: {companySettings?.gstin || '33GUPS2382N1ZF'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Logs</span>
            </button>
          )}

          <div className="text-left sm:text-right pl-2 sm:pl-3 border-l border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Audit Trail
            </span>
            <h1 className="text-lg sm:text-xl font-black text-brand-navy font-display">User Logs</h1>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-soft border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Logs</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100"><Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-slate-900">{totalLogsCount}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400">All recorded ops</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-soft border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600">Today</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-100"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-emerald-700">{todayCount}</p>
          <p className="text-[10px] sm:text-[11px] text-emerald-600">Today's actions</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-soft border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-600">Active Users</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-100"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /></div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-display text-indigo-700">{uniqueUsersCount}</p>
          <p className="text-[10px] sm:text-[11px] text-indigo-600">Team members</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-soft border border-purple-200 bg-gradient-to-br from-white to-purple-50/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-600">Top Module</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-100"><Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /></div>
          </div>
          <p className="text-lg sm:text-xl font-black font-display text-purple-700 truncate">{topModule}</p>
          <p className="text-[10px] sm:text-[11px] text-purple-600">{moduleCounts[topModule] || 0} operations</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search user, action, Load ID, UTR, invoice, description..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'feed' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Activity Feed
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Audit Table
            </button>
          </div>
        </div>

        {/* Multi-dropdown filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* User filter */}
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">User:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 text-xs"
            >
              <option value="all">All Users</option>
              {Array.from(new Set(logs.map(l => l.user_name).filter(Boolean))).map(uName => (
                <option key={uName} value={uName}>{uName}</option>
              ))}
            </select>
          </div>

          {/* Module filter */}
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Module:</span>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 text-xs"
            >
              <option value="all">All Modules</option>
              <option value="Trips">Trips</option>
              <option value="Payments">Payments</option>
              <option value="Invoices">Invoices</option>
              <option value="Clients">Clients</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Auth">Auth & Logins</option>
              <option value="Settings">Settings</option>
              <option value="User Management">User Management</option>
            </select>
          </div>

          {/* Date filter */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Timeframe:</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 text-xs"
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Firm filter */}
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Operating Firm:</span>
            <select
              value={selectedFirmFilter}
              onChange={(e) => setSelectedFirmFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 text-xs"
            >
              <option value="all">All Operating Firms</option>
              <option value="33GUPS2382N1ZF">Sri Ram Transport (33GUPS2382N1ZF)</option>
              <option value="33GWYPP4027A1ZD">Sri Ram Logistics (33GWYPP4027A1ZD)</option>
            </select>
          </div>

          {/* Clear filters button */}
          {(selectedUserFilter !== 'all' || selectedModuleFilter !== 'all' || selectedDateFilter !== 'all' || selectedFirmFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedUserFilter('all');
                setSelectedModuleFilter('all');
                setSelectedDateFilter('all');
                setSelectedFirmFilter('all');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
          <Activity className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 text-base">No user log records found</p>
          <p className="text-xs text-slate-400">Try adjusting your search terms or filters.</p>
        </div>
      ) : viewMode === 'feed' ? (
        /* Activity Feed Timeline */
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const badge = getActionBadge(log.action);
            const userInitials = (log.user_name || 'U')
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div 
                key={log.id} 
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-soft hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-brand-navy text-brand-gold font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {userInitials}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">{log.user_name || 'System Operator'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {log.user_role || 'staff'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{log.user_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {getModuleIcon(log.module)}
                      <span>{log.module}</span>
                    </span>
                  </div>
                </div>

                {/* Description Narrative */}
                <div className="pl-0 sm:pl-13 text-xs font-semibold text-slate-800 leading-relaxed">
                  {log.description}
                </div>

                {/* Metadata & Footer */}
                <div className="pl-0 sm:pl-13 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-3 font-medium">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTimestamp(log.created_at)}</span>
                      <span className="text-slate-400">({getRelativeTime(log.created_at)})</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700">{log.company_name}</span>
                      <span className="text-slate-400">({log.company_gstin})</span>
                    </span>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInspectLog(log)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Payload Data</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Audit Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Operating Firm</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.user_name}</div>
                        <div className="text-[10px] text-slate-400">{log.user_email}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700">
                        <span className="flex items-center space-x-1">
                          {getModuleIcon(log.module)}
                          <span>{log.module}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-600">
                        <span className="font-semibold block">{log.company_name}</span>
                        <span className="font-mono text-[9px] text-slate-400">{log.company_gstin}</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectLog(log)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Inspect raw log details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Payload Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 space-y-5 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-navy font-display">Log Operation Audit Record</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {inspectLog.id}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInspectLog(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Operator / User</span>
                <span className="font-bold text-slate-900">{inspectLog.user_name} ({inspectLog.user_role})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Logged Timestamp</span>
                <span className="font-mono text-slate-700">{formatTimestamp(inspectLog.created_at)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Action / Module</span>
                <span className="font-bold text-indigo-700">{inspectLog.action} / {inspectLog.module}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Operating Firm</span>
                <span className="font-bold text-slate-800">{inspectLog.company_name} ({inspectLog.company_gstin})</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Action Description:</span>
              <p className="text-xs font-medium text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {inspectLog.description}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Raw Parameter Payload:</span>
              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(inspectLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-5 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-dark cursor-pointer transition shadow-xs"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
