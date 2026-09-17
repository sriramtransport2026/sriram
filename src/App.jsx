import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Dashboard } from './components/Dashboard';
import { NewTripEntry } from './components/NewTripEntry';
import { TripStatusBoard } from './components/TripStatusBoard';
import { GenerateInvoice } from './components/GenerateInvoice';
import { ClientsView } from './components/ClientsView';
import { VehiclesView } from './components/VehiclesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { UserManagementView } from './components/UserManagementView';
import { PaymentsView } from './components/PaymentsView';
import { DirectInvoiceEntry } from './components/DirectInvoiceEntry';
import { CompanySelectionModal } from './components/CompanySelectionModal';
import logoImg from './assets/logo.png';

export function App() {
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser());
  const [activeCompanyGstin, setActiveCompanyGstin] = useState(() => {
    const user = db.getCurrentUser();
    if (user && user.role !== 'admin' && user.operating_gstin && user.operating_gstin !== 'ALL') {
      db.setActiveCompanyGstin(user.operating_gstin);
      return user.operating_gstin;
    }
    return db.getActiveCompanyGstin();
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'new-trip' | 'status-board' | 'invoices' | 'clients' | 'vehicles' | 'reports' | 'payments' | 'settings' | 'users'
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedPaymentTripId, setSelectedPaymentTripId] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Company Profile (Sri Ram Transport or Sri Ram Logistics)
  const activeCompany = db.getCompanyEntity(activeCompanyGstin);

  // Load all data on mount
  const loadAllData = async () => {
    try {
      const freshUser = db.getCurrentUser();
      if (freshUser) {
        setCurrentUser(freshUser);
      }
      const [cList, vList, tList, invList, pList, setts] = await Promise.all([
        db.getClients(),
        db.getVehicles(),
        db.getTrips(),
        db.getInvoices(),
        db.getPayments(),
        db.getCompanySettings(activeCompanyGstin),
      ]);
      setClients(cList);
      setVehicles(vList);
      setTrips(tList);
      setInvoices(invList);
      setPayments(pList);
      setCompanySettings(setts);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeCompanyGstin]);

  // DUAL OPERATING FIRM & COMPANY VISIBILITY SCOPING
  const isUserAdmin = currentUser?.role === 'admin';
  const hasCompanyFilter = !isUserAdmin && 
    currentUser?.assigned_company_ids && 
    currentUser.assigned_company_ids.length > 0 && 
    !currentUser.assigned_company_ids.includes('ALL');

  // 1. Filter trips strictly by active firm GSTIN (Sri Ram Transport vs Sri Ram Logistics)
  const firmTrips = trips.filter(t => (t.company_gstin || '33GUPS2382N1ZF') === activeCompanyGstin);

  // 2. Filter invoices strictly by active firm GSTIN
  const firmInvoices = invoices.filter(inv => (inv.company_gstin || '33GUPS2382N1ZF') === activeCompanyGstin);

  // 3. Filter clients strictly by active firm GSTIN
  const firmClients = clients.filter(c => (c.company_gstin || '33GUPS2382N1ZF') === activeCompanyGstin);

  // 4. Filter vehicles strictly by active firm GSTIN
  const firmVehicles = vehicles.filter(v => (v.company_gstin || '33GUPS2382N1ZF') === activeCompanyGstin);

  // 5. Filter clients based on user assigned company scope (within active firm)
  const accessibleClients = hasCompanyFilter
    ? firmClients.filter(c => currentUser.assigned_company_ids.includes(c.id))
    : firmClients;

  // 6. Filter trips based on user assigned company scope
  const accessibleTrips = hasCompanyFilter
    ? firmTrips.filter(t => currentUser.assigned_company_ids.includes(t.client_id))
    : firmTrips;

  // 7. Filter invoices based on user assigned company scope
  const accessibleInvoices = hasCompanyFilter
    ? firmInvoices.filter(inv => currentUser.assigned_company_ids.includes(inv.client_id))
    : firmInvoices;

  // 8. Accessible vehicles strictly for active firm
  const accessibleVehicles = firmVehicles;

  // Compute live dashboard metrics scoped to accessible data
  const bookedCount = accessibleTrips.filter(t => t.status === 'booked').length;
  const inTransitCount = accessibleTrips.filter(t => t.status === 'in_transit').length;
  const completedCount = accessibleTrips.filter(t => t.status === 'completed').length;
  const unInvoicedCount = accessibleTrips.filter(t => t.status === 'completed' && !t.invoiced).length;
  const totalFreight = accessibleTrips.reduce((acc, t) => acc + (parseFloat(t.freight_amount) || 0), 0);
  const totalPaid = accessibleTrips.reduce((acc, t) => acc + (parseFloat(t.vehicle_freight) || 0), 0);
  const totalProfit = accessibleTrips.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
  const totalCollected = accessibleTrips.reduce((acc, t) => acc + (parseFloat(t.total_paid_amount) || 0), 0);
  const pendingPaymentsCount = accessibleTrips.filter(t => (t.payment_status || 'pending') !== 'full_payment').length;

  const dashboardMetrics = {
    totalTrips: accessibleTrips.length,
    bookedCount,
    inTransitCount,
    completedCount,
    unInvoicedCount,
    clientsCount: accessibleClients.length,
    vehiclesCount: accessibleVehicles.length,
    totalProfit,
    totalFreight,
    totalPaid,
    totalCollected,
    pendingPaymentsCount,
  };

  // Safe navigation with permission check
  const handleNavigate = (viewId) => {
    if (viewId === 'users' && !isUserAdmin) {
      alert('Access restricted to Administrators.');
      return;
    }
    if (!isUserAdmin && currentUser?.assigned_modules && !currentUser.assigned_modules.includes(viewId)) {
      alert('You do not have access permissions for this module. Please contact your administrator.');
      return;
    }
    setCurrentView(viewId);
  };

  // COMPANY ENTITY SWITCHING (Strictly restricted to Admin)
  const handleSelectCompany = (gstin) => {
    if (!isUserAdmin) return;
    db.setActiveCompanyGstin(gstin);
    setActiveCompanyGstin(gstin);
    setShowCompanyModal(false);
  };

  const handleToggleCompanyDirect = () => {
    if (!isUserAdmin) return;
    const nextGstin = activeCompanyGstin === '33GUPS2382N1ZF' ? '33GWYPP4027A1ZD' : '33GUPS2382N1ZF';
    handleSelectCompany(nextGstin);
  };

  // TRIP ACTIONS
  const handleSaveTrip = async (tripData) => {
    await db.saveTrip({
      ...tripData,
      company_gstin: activeCompanyGstin,
      company_name: activeCompany.company_name
    });
    await loadAllData();
  };

  const handleUpdateTripStatus = async (tripId, newStatus) => {
    await db.updateTripStatus(tripId, newStatus);
    await loadAllData();
  };

  const handleTripCompleted = async (completedTrip) => {
    await loadAllData();
  };

  // INVOICE ACTIONS
  const handleGenerateInvoice = async (invoicePayload) => {
    const inv = await db.generateInvoice({
      ...invoicePayload,
      company_gstin: activeCompanyGstin,
      company_name: activeCompany.company_name
    });
    await loadAllData();
    return inv;
  };

  const handleDirectInvoiceGenerated = async (directPayload) => {
    const result = await db.saveDirectInvoiceEntry({
      ...directPayload,
      company_gstin: activeCompanyGstin,
      company_name: activeCompany.company_name
    });
    await loadAllData();
    return result;
  };

  // CLIENT ACTIONS
  const handleSaveClient = async (clientData) => {
    const saved = await db.saveClient({
      ...clientData,
      company_gstin: clientData.company_gstin || activeCompanyGstin,
      company_name: clientData.company_name || activeCompany.company_name
    });
    await loadAllData();
    return saved;
  };

  const handleDeleteClient = async (id) => {
    await db.deleteClient(id);
    await loadAllData();
  };

  // VEHICLE ACTIONS
  const handleSaveVehicle = async (vehicleData) => {
    const saved = await db.saveVehicle({
      ...vehicleData,
      company_gstin: vehicleData.company_gstin || activeCompanyGstin,
      company_name: vehicleData.company_name || activeCompany.company_name
    });
    await loadAllData();
    return saved;
  };

  const handleDeleteVehicle = async (id) => {
    await db.deleteVehicle(id);
    await loadAllData();
  };

  // PAYMENT ACTIONS
  const handleNavigateToPayments = (tripId) => {
    setSelectedPaymentTripId(tripId || null);
    setCurrentView('payments');
  };

  const handleSavePayment = async (paymentPayload) => {
    const saved = await db.savePayment(paymentPayload);
    await loadAllData();
    return saved;
  };

  // SETTINGS ACTIONS
  const handleSaveSettings = async (newSettings) => {
    const saved = await db.saveCompanySettings(newSettings);
    setCompanySettings(saved);
  };

  const handleResetDemoData = () => {
    db.resetToDemoData();
    loadAllData();
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-navy">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold tracking-wide font-display">Loading Sri Ram Transport System...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, show the Enterprise Login Page
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user?.role === 'admin') {
            // Admin logs in: show company selection popup so admin can pick the operating firm
            setShowCompanyModal(true);
          } else {
            // Non-admin user logs in: DO NOT show switch GST popup! Lock strictly to assigned GST
            setShowCompanyModal(false);
            const userGstin = user?.operating_gstin && user.operating_gstin !== 'ALL'
              ? user.operating_gstin
              : '33GUPS2382N1ZF';
            db.setActiveCompanyGstin(userGstin);
            setActiveCompanyGstin(userGstin);
          }
          loadAllData();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col font-sans">
      {/* Module Views Router (Full screen per module, no shared top navbar) */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            metrics={dashboardMetrics}
            companySettings={activeCompany}
            currentUser={currentUser}
            onLogout={handleLogout}
            onSwitchCompany={isUserAdmin ? handleToggleCompanyDirect : undefined}
            onOpenCompanyModal={isUserAdmin ? () => setShowCompanyModal(true) : undefined}
          />
        )}

        {currentView === 'new-trip' && (
          <NewTripEntry
            onBack={() => setCurrentView('dashboard')}
            clients={accessibleClients}
            vehicles={accessibleVehicles}
            onSaveTrip={handleSaveTrip}
            onQuickAddVehicle={handleSaveVehicle}
            onQuickAddClient={handleSaveClient}
          />
        )}

        {currentView === 'direct-invoice' && (
          <DirectInvoiceEntry
            onBack={() => setCurrentView('dashboard')}
            clients={accessibleClients}
            vehicles={accessibleVehicles}
            invoices={accessibleInvoices}
            companySettings={activeCompany}
            onDirectInvoiceGenerated={handleDirectInvoiceGenerated}
            onNavigateToPayments={handleNavigateToPayments}
            onNavigateToStatusBoard={() => setCurrentView('status-board')}
            onQuickAddVehicle={handleSaveVehicle}
            onQuickAddClient={handleSaveClient}
          />
        )}

        {currentView === 'status-board' && (
          <TripStatusBoard
            onBack={() => setCurrentView('dashboard')}
            trips={accessibleTrips}
            onUpdateTripStatus={handleUpdateTripStatus}
            onTripCompleted={handleTripCompleted}
            onNavigateToPayments={handleNavigateToPayments}
          />
        )}

        {currentView === 'invoices' && (
          <GenerateInvoice
            onBack={() => setCurrentView('dashboard')}
            clients={accessibleClients}
            trips={accessibleTrips}
            invoices={accessibleInvoices}
            companySettings={activeCompany}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )}

        {currentView === 'clients' && (
          <ClientsView
            onBack={() => setCurrentView('dashboard')}
            clients={accessibleClients}
            trips={accessibleTrips}
            companySettings={activeCompany}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {currentView === 'vehicles' && (
          <VehiclesView
            onBack={() => setCurrentView('dashboard')}
            vehicles={accessibleVehicles}
            trips={accessibleTrips}
            companySettings={activeCompany}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            onBack={() => setCurrentView('dashboard')}
            trips={accessibleTrips}
            clients={accessibleClients}
            vehicles={accessibleVehicles}
            companySettings={activeCompany}
            onNavigateToPayments={handleNavigateToPayments}
          />
        )}

        {currentView === 'payments' && (
          <PaymentsView
            onBack={() => setCurrentView('dashboard')}
            trips={accessibleTrips}
            clients={accessibleClients}
            companySettings={activeCompany}
            onSavePayment={handleSavePayment}
            initialSelectedTripId={selectedPaymentTripId}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onBack={() => setCurrentView('dashboard')}
            settings={activeCompany}
            onSaveSettings={handleSaveSettings}
            onResetDemoData={handleResetDemoData}
            currentUser={currentUser}
            onNavigateToUsers={() => setCurrentView('users')}
          />
        )}

        {currentView === 'users' && (
          <UserManagementView
            onBack={() => setCurrentView('dashboard')}
            clients={firmClients}
            currentUser={currentUser}
            onUsersUpdated={() => {
              const freshUser = db.getCurrentUser();
              if (freshUser) setCurrentUser(freshUser);
              loadAllData();
            }}
            activeCompanyGstin={activeCompanyGstin}
            activeCompany={activeCompany}
          />
        )}
      </main>

      {/* Interactive Company Selection Modal (Strictly Admin-Only) */}
      <CompanySelectionModal
        isOpen={showCompanyModal && isUserAdmin}
        onClose={() => setShowCompanyModal(false)}
        activeGstin={activeCompanyGstin}
        onSelectCompany={handleSelectCompany}
      />

      {/* Subtle Footer (Present only when on dashboard or scrollable bottom) */}
      <footer className="no-print py-6 text-center text-xs text-slate-500 border-t border-slate-200/70 mt-12 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src={logoImg} alt="Sri Ram Transport" className="h-6 w-auto object-contain" />
            <span className="font-black text-brand-navy tracking-wide">Sri Ram Transport, Hosur</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-bold tracking-widest text-brand-gold-dark uppercase">TRUST • TRANSPORT • TOGETHER</span>
          </div>
          <span className="font-semibold text-slate-600"></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
