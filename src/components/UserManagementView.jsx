import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Key, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  Layers, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  AlertCircle,
  Eye,
  EyeOff,
  PlusCircle,
  Navigation,
  FileCheck,
  Car,
  TrendingUp,
  Settings,
  Sparkles,
  ShieldAlert,
  CreditCard,
  Zap
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { db } from '../services/db';

const ALL_SYSTEM_MODULES = [
  { id: 'new-trip', label: 'New Trip Entry', icon: PlusCircle, description: 'Book loads, calculate rates & profits' },
  { id: 'direct-invoice', label: 'Direct Invoice Entry', icon: Zap, description: 'Single-entry multi-trip direct invoice generation to payments' },
  { id: 'status-board', label: 'Trip Status Board', icon: Navigation, description: 'Track loads & upload hard-gated POD' },
  { id: 'invoices', label: 'Generate Invoice', icon: FileCheck, description: 'Consolidated GST reverse-charge billing' },
  { id: 'clients', label: 'Clients Directory', icon: Users, description: 'Client profiles, addresses & GSTIN' },
  { id: 'vehicles', label: 'Vehicles Fleet', icon: Car, description: 'Lorry master database & hire rates' },
  { id: 'reports', label: 'Reports & P&L', icon: TrendingUp, description: 'Profit margins, freight billed vs paid' },
  { id: 'payments', label: 'Payments & Settlements', icon: CreditCard, description: 'Advance, Half Payment & Full Payment tracking with Cash/Online UTR' },
  { id: 'settings', label: 'Settings & Profile', icon: Settings, description: 'Branch coordinates & tax configuration' },
];

export function UserManagementView({ 
  onBack, 
  clients = [], 
  currentUser, 
  onUsersUpdated,
  activeCompanyGstin = '33GUPS2382N1ZF',
  activeCompany
}) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState(activeCompanyGstin || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Sync entity filter if active company changes
  useEffect(() => {
    if (activeCompanyGstin) {
      setEntityFilter(activeCompanyGstin);
    }
  }, [activeCompanyGstin]);

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Form State for Add / Edit
  const initialFormState = {
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'staff',
    operating_gstin: activeCompanyGstin || '33GUPS2382N1ZF',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'],
    scope_type: 'all', // 'all' | 'specific'
    assigned_company_ids: ['ALL'],
    assigned_company_name: 'All Companies',
  };
  const [formData, setFormData] = useState(initialFormState);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await db.getUsers();
      setUsers(list || []);
      if (onUsersUpdated) onUsersUpdated(list || []);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      ...initialFormState,
      operating_gstin: activeCompanyGstin || '33GUPS2382N1ZF'
    });
    setIsUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    const hasSpecificCompany = user.assigned_company_ids && 
      user.assigned_company_ids.length > 0 && 
      !user.assigned_company_ids.includes('ALL');

    const defaultMods = user.role === 'admin'
      ? ALL_SYSTEM_MODULES.map(m => m.id)
      : ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'];

    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '', // Blank unless changing
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'staff',
      operating_gstin: user.operating_gstin || '33GUPS2382N1ZF',
      is_active: user.is_active !== false,
      assigned_modules: (Array.isArray(user.assigned_modules) && user.assigned_modules.length > 0)
        ? user.assigned_modules
        : defaultMods,
      scope_type: hasSpecificCompany ? 'specific' : 'all',
      assigned_company_ids: user.assigned_company_ids || ['ALL'],
      assigned_company_name: user.assigned_company_name || 'All Companies',
    });
    setIsUserModalOpen(true);
  };

  // Toggle module selection
  const handleToggleModule = (moduleId) => {
    setFormData(prev => {
      const current = prev.assigned_modules || [];
      const updated = current.includes(moduleId)
        ? current.filter(id => id !== moduleId)
        : [...current, moduleId];
      return { ...prev, assigned_modules: updated };
    });
  };

  const handleSelectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      assigned_modules: ALL_SYSTEM_MODULES.map(m => m.id)
    }));
  };

  const handleClearAllModules = () => {
    setFormData(prev => ({
      ...prev,
      assigned_modules: []
    }));
  };

  // Handle company scope change
  const handleScopeTypeChange = (type) => {
    if (type === 'all') {
      setFormData(prev => ({
        ...prev,
        scope_type: 'all',
        assigned_company_ids: ['ALL'],
        assigned_company_name: 'All Companies'
      }));
    } else {
      const firstClient = clients[0];
      setFormData(prev => ({
        ...prev,
        scope_type: 'specific',
        assigned_company_ids: firstClient ? [firstClient.id] : [],
        assigned_company_name: firstClient ? firstClient.name : 'Selected Client'
      }));
    }
  };

  const handleSpecificCompanyChange = (clientId) => {
    const selected = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      assigned_company_ids: [clientId],
      assigned_company_name: selected ? selected.name : 'Assigned Client'
    }));
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.username.trim() || !formData.email.trim()) {
      alert('Please fill out Name, Username, and Email.');
      return;
    }

    if (!editingUser && !formData.password) {
      alert('Please enter a password for the new user.');
      return;
    }

    if (formData.assigned_modules.length === 0) {
      if (!confirm('This user has no operational modules assigned. Are you sure?')) {
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        id: editingUser ? editingUser.id : undefined,
        operating_gstin: editingUser ? (formData.operating_gstin || activeCompanyGstin) : activeCompanyGstin,
        assigned_company_ids: formData.scope_type === 'all' ? ['ALL'] : formData.assigned_company_ids,
        assigned_company_name: formData.scope_type === 'all' ? 'All Companies' : formData.assigned_company_name
      };

      await db.saveUser(payload);
      showNotice('success', editingUser ? `User '${formData.username}' updated successfully!` : `User '${formData.username}' created successfully!`);
      setIsUserModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error(err);
      showNotice('error', err.message || 'Failed to save user.');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own logged-in administrator account.');
      return;
    }

    const nextStatus = !user.is_active;
    try {
      await db.toggleUserStatus(user.id, nextStatus);
      showNotice('success', `User ${user.username} is now ${nextStatus ? 'Active' : 'Inactive'}.`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      showNotice('error', 'Failed to update user status.');
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own logged-in administrator account.');
      return;
    }

    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      alert('System requires at least one active Administrator.');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user '${user.username}' (${user.full_name})?`)) {
      try {
        await db.deleteUser(user.id);
        showNotice('success', `User '${user.username}' deleted successfully.`);
        await loadUsers();
      } catch (err) {
        console.error(err);
        showNotice('error', 'Failed to delete user.');
      }
    }
  };

  // Open Password Modal
  const handleOpenPasswordModal = (user) => {
    setPasswordTargetUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await db.changeUserPassword(passwordTargetUser.email, newPassword);
      showNotice('success', `Password for '${passwordTargetUser.username}' changed successfully!`);
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error(err);
      showNotice('error', 'Failed to change password.');
    }
  };

  // STRICT DUAL-GST USER ISOLATION:
  // Only users strictly belonging to activeCompanyGstin are visible! Users for other GSTs will NEVER show.
  const firmUsers = users.filter(u => {
    const userGstin = u.operating_gstin || '33GUPS2382N1ZF';
    return userGstin === activeCompanyGstin;
  });

  const filteredUsers = firmUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    const isRestricted = u.assigned_company_ids && 
      u.assigned_company_ids.length > 0 && 
      !u.assigned_company_ids.includes('ALL');

    const matchesCompany = 
      companyFilter === 'all' || 
      (companyFilter === 'restricted' && isRestricted) ||
      (companyFilter === 'global' && !isRestricted);

    return matchesSearch && matchesRole && matchesCompany;
  });

  // Calculate stats strictly for this active firm
  const totalUsersCount = firmUsers.length;
  const activeUsersCount = firmUsers.filter(u => u.is_active !== false).length;
  const companyRestrictedCount = firmUsers.filter(u => 
    u.assigned_company_ids && 
    u.assigned_company_ids.length > 0 && 
    !u.assigned_company_ids.includes('ALL')
  ).length;
  const adminCount = firmUsers.filter(u => u.role === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-sm font-bold text-brand-navy hover:text-brand-navy-light px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold-dark" />
            <span>Dashboard</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              <img src={logoImg} alt="Sri Ram Transport" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-brand-navy tracking-tight font-display">
                  User Management & Role Permissions
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Create system dispatchers, assign operational modules, and restrict company / client visibility.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Current Switched Firm:</span>
                <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                  activeCompanyGstin === '33GWYPP4027A1ZD'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeCompanyGstin === '33GWYPP4027A1ZD' ? 'bg-blue-600' : 'bg-amber-600'}`} />
                  <span>{activeCompany?.company_name || (activeCompanyGstin === '33GWYPP4027A1ZD' ? 'Sri Ram Logistics' : 'Sri Ram Transport')}</span>
                  <span className="font-mono text-[9px] opacity-75">({activeCompanyGstin})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-brand-gold" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification.message && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-semibold animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="p-2 rounded-xl bg-slate-100 text-brand-navy">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-navy font-display">{totalUsersCount}</span>
            <span className="text-xs text-slate-500 font-medium">Registered</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Accounts</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 font-display">{activeUsersCount}</span>
            <span className="text-xs text-slate-500 font-medium">Can Log In</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Company-Restricted</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-700 font-display">{companyRestrictedCount}</span>
            <span className="text-xs text-slate-500 font-medium">Dedicated Clients</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-gold-dark uppercase tracking-wider">Administrators</span>
            <div className="p-2 rounded-xl bg-amber-50 text-brand-gold-dark">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-navy font-display">{adminCount}</span>
            <span className="text-xs text-slate-500 font-medium">Super Users</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-navy/15 focus:border-brand-navy transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-navy"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Dispatch Manager</option>
              <option value="staff">Operations Staff</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          {/* Company Scope Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Scope:</span>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-navy"
            >
              <option value="all">All Scopes</option>
              <option value="global">All Companies (Agency-Wide)</option>
              <option value="restricted">Company-Restricted Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                <th className="py-4 px-6">User Profile</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Assigned Company Scope</th>
                <th className="py-4 px-4">Assigned Modules</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const isRestricted = user.assigned_company_ids && 
                    user.assigned_company_ids.length > 0 && 
                    !user.assigned_company_ids.includes('ALL');

                  const userModules = user.assigned_modules || [];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Profile */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-navy text-brand-gold text-xs font-black flex items-center justify-center uppercase shadow-sm shrink-0">
                            {user.full_name ? user.full_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-sm">{user.full_name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold-dark border border-brand-gold/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              @{user.username} · {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          user.role === 'admin'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : user.role === 'manager'
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : user.role === 'accountant'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </td>

                      {/* Company Scope */}
                      <td className="py-4 px-4">
                        {isRestricted ? (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div className="truncate max-w-[180px]">
                              <span className="font-bold text-xs block truncate">{user.assigned_company_name || 'Assigned Client'}</span>
                              <span className="text-[9px] text-blue-600 uppercase font-semibold">Restricted Access</span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
                            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <div>
                              <span className="font-bold text-xs block">All Companies</span>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold">Hosur Agency-wide</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Assigned Modules */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {user.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                              Full System Access (All Modules)
                            </span>
                          ) : userModules.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">None assigned</span>
                          ) : (
                            userModules.map(modId => {
                              const info = ALL_SYSTEM_MODULES.find(m => m.id === modId);
                              return (
                                <span
                                  key={modId}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80"
                                >
                                  {info ? info.label : modId}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrent}
                          title={isCurrent ? 'You cannot deactivate your own account' : 'Click to toggle status'}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.is_active !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {user.is_active !== false ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            title="Edit Permissions & Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(user)}
                            title="Reset User Password"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-gold-dark hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Cannot delete yourself' : 'Delete User'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT USER
         ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-brand-navy text-brand-gold">
                  {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy font-display">
                    {editingUser ? `Edit User: ${editingUser.username}` : 'Create New System User'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign role, operational module permissions, and restricted company workspace.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="space-y-6">
              
              {/* Locked Operating Firm Scope */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                activeCompanyGstin === '33GWYPP4027A1ZD'
                  ? 'bg-blue-50/80 border-blue-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl text-white font-black text-xs ${
                    activeCompanyGstin === '33GWYPP4027A1ZD' ? 'bg-blue-600' : 'bg-amber-600'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-800">
                        {activeCompany?.company_name || (activeCompanyGstin === '33GWYPP4027A1ZD' ? 'Sri Ram Logistics' : 'Sri Ram Transport')}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white font-bold text-slate-600 border border-slate-200">
                        GST: {activeCompanyGstin}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {editingUser ? 'This user belongs to this operating firm.' : 'New user will be assigned to this GST account only and will not show in other GST accounts.'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                  Firm Isolated
                </span>
              </div>

              {/* 1. Basic Account Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-black tracking-wider uppercase text-brand-navy flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-brand-gold-dark" />
                  <span>1. User Identity & Role</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="e.g. ramesh_ops"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Official Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ramesh@sriramtransport.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 9845012345"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    />
                  </div>

                  {/* Password Field (Only mandatory on create) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {editingUser ? 'New Password (Leave blank to keep existing)' : 'Initial Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={editingUser ? '••••••••' : 'Enter password (min 6 chars)'}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">System Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          role: newRole,
                          assigned_modules: newRole === 'admin'
                            ? ALL_SYSTEM_MODULES.map(m => m.id)
                            : (prev.assigned_modules.length > 0 
                                ? prev.assigned_modules 
                                : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'])
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                    >
                      <option value="admin">Administrator (Super User)</option>
                      <option value="manager">Dispatch Manager</option>
                      <option value="staff">Operations Staff</option>
                      <option value="accountant">Accountant / Billing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Operational Module Permissions */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase text-brand-navy flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-gold-dark" />
                      <span>2. Assign Accessible Operational Modules</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select which application modules this user can view and operate.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="text-[10px] font-bold text-brand-navy hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleClearAllModules}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_SYSTEM_MODULES.map((mod) => {
                    const isChecked = formData.assigned_modules.includes(mod.id);
                    const ModIcon = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'border-brand-navy bg-brand-navy/5 shadow-sm' 
                            : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.id)}
                          className="mt-0.5 rounded text-brand-navy focus:ring-brand-navy border-slate-300 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <ModIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-brand-navy' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold text-slate-800">{mod.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Company / Client Assignment */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase text-brand-navy flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-gold-dark" />
                    <span>3. Assign Company / Client Visibility Scope</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Restrict user to a specific company so only that company's trips, invoices, and records are visible.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: All Companies */}
                  <label className={`flex items-start space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    formData.scope_type === 'all'
                      ? 'border-brand-navy bg-brand-navy/5 shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="scope_type"
                      value="all"
                      checked={formData.scope_type === 'all'}
                      onChange={() => handleScopeTypeChange('all')}
                      className="mt-1 text-brand-navy focus:ring-brand-navy cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        ★ All Companies (Global Agency Access)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        User can view and manage trips, clients, and invoices for all transport clients across the Hosur agency.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Specific Company */}
                  <label className={`flex items-start space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    formData.scope_type === 'specific'
                      ? 'border-brand-navy bg-brand-navy/5 shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="scope_type"
                      value="specific"
                      checked={formData.scope_type === 'specific'}
                      onChange={() => handleScopeTypeChange('specific')}
                      className="mt-1 text-brand-navy focus:ring-brand-navy cursor-pointer"
                    />
                    <div className="w-full space-y-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Dedicated Specific Company / Client
                        </span>
                        <p className="text-[11px] text-slate-500">
                          User is restricted strictly to this single company. All other clients, trips, and invoices are hidden.
                        </p>
                      </div>

                      {formData.scope_type === 'specific' && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Select Assigned Company:
                          </label>
                          <select
                            value={formData.assigned_company_ids[0] || ''}
                            onChange={(e) => handleSpecificCompanyChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-brand-navy/30 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-navy/20"
                          >
                            {clients.map(cli => (
                              <option key={cli.id} value={cli.id}>
                                {cli.name} ({cli.state || 'Local'}) - GST: {cli.gstin || 'Unregistered'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingUser ? 'Update User Permissions' : 'Create & Authorize User'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESET USER PASSWORD
         ========================================================================= */}
      {isPasswordModalOpen && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-5 animate-scale-up">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-brand-navy">Reset Password</h3>
                  <p className="text-xs text-slate-500">For user: @{passwordTargetUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Enter New Password *</label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-navy"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                This will update the cryptographic hash immediately. The user can log in with this new password right away.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold shadow transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default UserManagementView;
