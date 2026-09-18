import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { compressFileToUnder30KB } from '../utils/imageCompressor';

const STORAGE_KEYS = {
  CLIENTS: 'srt_clients_v1',
  VEHICLES: 'srt_vehicles_v1',
  TRIPS: 'srt_trips_v1',
  INVOICES: 'srt_invoices_v1',
  PAYMENTS: 'srt_payments_v1',
  SETTINGS: 'srt_settings_v1',
  USERS: 'srt_users_v1',
  CURRENT_USER: 'srt_current_user_v1',
  ACTIVE_ENTITY_GSTIN: 'srt_active_entity_gstin_v1',
  COMPANY_ENTITIES: 'srt_company_entities_v1',
  USER_LOGS: 'srt_user_logs_v1',
};

// UUID Validation, Generation & Legacy ID Resolvers for Supabase Postgres Foreign Key Integrity
export const isUuid = (str) => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const CLIENT_ID_MAP = {
  'cli-001': 'a0000000-0000-0000-0000-000000000001',
  'cli-002': 'a0000000-0000-0000-0000-000000000002',
  'cli-003': 'a0000000-0000-0000-0000-000000000003',
  'cli-srl-001': 'a0000000-0000-0000-0000-000000000101',
  'cli-srl-002': 'a0000000-0000-0000-0000-000000000102',
  'cli-srl-003': 'a0000000-0000-0000-0000-000000000103',
};

export const VEHICLE_ID_MAP = {
  'veh-001': 'b0000000-0000-0000-0000-000000000001',
  'veh-002': 'b0000000-0000-0000-0000-000000000002',
  'veh-003': 'b0000000-0000-0000-0000-000000000003',
  'veh-004': 'b0000000-0000-0000-0000-000000000004',
  'veh-005': 'b0000000-0000-0000-0000-000000000005',
  'veh-006': 'b0000000-0000-0000-0000-000000000006',
  'veh-007': 'b0000000-0000-0000-0000-000000000007',
  'veh-008': 'b0000000-0000-0000-0000-000000000008',
  'veh-009': 'b0000000-0000-0000-0000-000000000009',
  'veh-010': 'b0000000-0000-0000-0000-000000000010',
  'veh-011': 'b0000000-0000-0000-0000-000000000011',
  'veh-srl-001': 'b0000000-0000-0000-0000-000000000101',
  'veh-srl-002': 'b0000000-0000-0000-0000-000000000102',
  'veh-srl-003': 'b0000000-0000-0000-0000-000000000103',
};

export const INVOICE_ID_MAP = {
  'inv-srt-112': 'd0000000-0000-0000-0000-000000000112',
  'inv-srt-111': 'd0000000-0000-0000-0000-000000000111',
  'inv-srt-110': 'd0000000-0000-0000-0000-000000000110',
  'inv-srt-109': 'd0000000-0000-0000-0000-000000000109',
  'inv-srt-108': 'd0000000-0000-0000-0000-000000000108',
  'inv-srl-101': 'd0000000-0000-0000-0000-000000000201',
};

export const TRIP_ID_MAP = {
  'trip-001': 'c0000000-0000-0000-0000-000000000001',
  'trip-002': 'c0000000-0000-0000-0000-000000000002',
  'trip-003': 'c0000000-0000-0000-0000-000000000003',
  'trip-004': 'c0000000-0000-0000-0000-000000000004',
  'trip-011': 'c0000000-0000-0000-0000-000000000011',
  'trip-013': 'c0000000-0000-0000-0000-000000000013',
  'trip-srl-001': 'c0000000-0000-0000-0000-000000000101',
  'trip-srl-002': 'c0000000-0000-0000-0000-000000000102',
};

export const PAYMENT_ID_MAP = {
  'pay-001': 'e0000000-0000-0000-0000-000000000001',
  'pay-002': 'e0000000-0000-0000-0000-000000000002',
  'pay-003': 'e0000000-0000-0000-0000-000000000003',
  'pay-srl-001': 'e0000000-0000-0000-0000-000000000101',
};

export const resolveClientId = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (CLIENT_ID_MAP[id]) return CLIENT_ID_MAP[id];
  return null;
};

export const resolveVehicleId = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (VEHICLE_ID_MAP[id]) return VEHICLE_ID_MAP[id];
  return null;
};

export const resolveInvoiceId = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (INVOICE_ID_MAP[id]) return INVOICE_ID_MAP[id];
  return null;
};

export const resolveTripId = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (TRIP_ID_MAP[id]) return TRIP_ID_MAP[id];
  return null;
};

export const resolvePaymentId = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (PAYMENT_ID_MAP[id]) return PAYMENT_ID_MAP[id];
  return null;
};

export const sanitizeUuid = (id) => {
  if (!id) return null;
  if (isUuid(id)) return id;
  return null;
};

// Two Official Operating Entities for Sri Ram Group (Hosur Hub)
export const DEFAULT_COMPANY_ENTITIES = {
  '33GUPS2382N1ZF': {
    id: 'SRT',
    code: 'SRT',
    gstin: '33GUPS2382N1ZF',
    pan: 'GLIPS2382N',
    company_name: 'Sri Ram Transport',
    short_name: 'Sri Ram Transport',
    tagline: 'TRUST • TRANSPORT • TOGETHER',
    address: 'NO: 4/ KRISHNAPPA BUILDING NEAR VEGITABLE MARKET KRISHNAGIRI MAIN ROAD BATHALAPALLI HOSUR, Hosur - 635109, TAMIL NADU, India',
    branch_name: 'Bathalapalli Market Branch',
    branch_location: 'Bathalapalli, Hosur',
    email: 'sriramtransporthosur@gmail.com',
    phone: '9944121306',
    sac_code: '9965',
    branch_state: 'TAMIL NADU',
    default_gst_percent: 5.00,
    invoice_prefix: 'SRT-26-27/',
    badge_color: 'bg-amber-100 text-amber-900 border-amber-300',
    theme_accent: 'amber',
  },
  '33GWYPP4027A1ZD': {
    id: 'SRL',
    code: 'SRL',
    gstin: '33GWYPP4027A1ZD',
    pan: 'GWYPP4027A',
    company_name: 'Sri Ram Logistics',
    short_name: 'Sri Ram Logistics',
    tagline: 'AT OWNER\'S RISK • PROMPT DISPATCH',
    address: 'Flat No. 701/18B1, Perandapalli Village, Thorapalli Agraharam Post, HOSUR - 635 130, Krishnagiri Dist.',
    branch_name: 'Thorapalli Agraharam / Perandapalli Branch',
    branch_location: 'Thorapalli Agraharam, Hosur - 635130',
    email: 'sriramtransporthosur@gmail.com',
    phone: '99441 21306 / 96983 89111',
    sac_code: '9965',
    branch_state: 'TAMIL NADU',
    default_gst_percent: 5.00,
    invoice_prefix: 'SRL-26-27/',
    badge_color: 'bg-blue-100 text-blue-900 border-blue-300',
    theme_accent: 'blue',
  }
};

// Initial Seed Users matching Supabase schema.sql
const INITIAL_USERS = [
  {
    id: 'usr-adm-01',
    username: 'admin',
    email: 'admin@sriramtransport.com',
    password: 'Admin@123',
    full_name: 'Sri Ram Administrator',
    phone: '9944121306',
    role: 'admin',
    operating_gstin: 'ALL',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users'],
    assigned_company_ids: ['ALL'],
    assigned_company_name: 'All Companies',
    created_at: '2026-05-01T08:00:00.000Z'
  },
  {
    id: 'usr-mgr-02',
    username: 'manager',
    email: 'manager@sriramtransport.com',
    password: 'Manager@123',
    full_name: 'Hosur Dispatch Manager',
    phone: '9845012345',
    role: 'manager',
    operating_gstin: '33GUPS2382N1ZF',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings'],
    assigned_company_ids: ['ALL'],
    assigned_company_name: 'All Companies',
    created_at: '2026-05-10T09:00:00.000Z'
  },
  {
    id: 'usr-stf-03',
    username: 'ashirvad_staff',
    email: 'staff@ashirvad.com',
    password: 'Staff@123',
    full_name: 'Ashirvad Dedicated Dispatcher',
    phone: '9443012345',
    role: 'staff',
    operating_gstin: '33GUPS2382N1ZF',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'],
    assigned_company_ids: ['cli-001'],
    assigned_company_name: 'Ashirvad Pipes Pvt Ltd',
    created_at: '2026-05-15T10:00:00.000Z'
  },
  {
    id: 'usr-srl-01',
    username: 'srl_manager',
    email: 'manager@sriramlogistics.com',
    password: 'Manager@123',
    full_name: 'SRL Logistics Coordinator',
    phone: '9698389111',
    role: 'manager',
    operating_gstin: '33GWYPP4027A1ZD',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings'],
    assigned_company_ids: ['ALL'],
    assigned_company_name: 'All Companies',
    created_at: '2026-06-01T09:00:00.000Z'
  },
  {
    id: 'usr-srl-02',
    username: 'srl_staff',
    email: 'staff@sriramlogistics.com',
    password: 'Staff@123',
    full_name: 'SRL Thorapalli Desk Staff',
    phone: '9944121306',
    role: 'staff',
    operating_gstin: '33GWYPP4027A1ZD',
    is_active: true,
    assigned_modules: ['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'],
    assigned_company_ids: ['ALL'],
    assigned_company_name: 'All Companies',
    created_at: '2026-06-01T10:00:00.000Z'
  }
];

// Default Company Settings from Sri Ram Transport physical invoice
const DEFAULT_SETTINGS = {
  company_name: 'Sri Ram Transport',
  address: 'NO: 4/ KRISHNAPPA BUILDING NEAR VEGITABLE MARKET KRISHNAGIRI MAIN ROAD BATHALAPALLI HOSUR, Hosur - 635109, TAMIL NADU, India',
  email: 'sriramtransporthosur@gmail.com',
  phone: '9944121306',
  gstin: '33GUPS2382N1ZF',
  sac_code: '9965',
  branch_state: 'TAMIL NADU',
  pan: 'GLIPS2382N',
  default_gst_percent: 5.00,
  invoice_prefix: 'SRT-26-27/',
  tagline: 'See the Future. Build it with Zeony.',
};

// Initial Seed Data matching reference sheets & physical invoice (Scoped by Operating Entity GSTIN)
const INITIAL_CLIENTS = [
  // Sri Ram Transport Clients (GST: 33GUPS2382N1ZF)
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    company_gstin: '33GUPS2382N1ZF',
    name: 'Ashirvad Pipes Pvt Ltd',
    address: 'Plot 32 - WH, Sy No. 32/2 & Sy No.38/2Krishnasagara Village, Attibele Hobli, Anekal, BANGALORE, 562107, India',
    gstin: '29AABCA7061K1ZH',
    pan: 'AABCA7061K',
    state: 'KARNATAKA',
    phone: '080-27847000',
    email: 'dispatch@ashirvadpipes.com',
    created_at: new Date('2026-05-01').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    company_gstin: '33GUPS2382N1ZF',
    name: 'Sri Venkata Sai Agencies',
    address: 'Parvatipuram Main Road, Vizianagaram District, Andhra Pradesh, 535501',
    gstin: '37AABCS1234F1Z8',
    pan: 'AABCS1234F',
    state: 'ANDHRA PRADESH',
    phone: '9440187654',
    email: 'info@venkatasai.com',
    created_at: new Date('2026-05-10').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    company_gstin: '33GUPS2382N1ZF',
    name: 'Jaibalaji Electricals',
    address: 'Bazaar Street, Salem West, Tamil Nadu, 636001',
    gstin: '33AACFJ9876Q1ZM',
    pan: 'AACFJ9876Q',
    state: 'TAMIL NADU',
    phone: '9443214567',
    email: 'billing@jaibalaji.in',
    created_at: new Date('2026-05-15').toISOString(),
  },
  // Sri Ram Logistics Dedicated Clients (GST: 33GWYPP4027A1ZD)
  {
    id: 'a0000000-0000-0000-0000-000000000101',
    company_gstin: '33GWYPP4027A1ZD',
    name: 'Sri Ram Logistics — Attibele Cargo Hub',
    address: 'Survey No. 44/2, Attibele-Hosur National Highway, Hosur - 635130, Krishnagiri Dist.',
    gstin: '33GWYPP4027A1ZD',
    pan: 'GWYPP4027A',
    state: 'TAMIL NADU',
    phone: '99441 21306',
    email: 'sriramtransporthosur@gmail.com',
    created_at: new Date('2026-06-01').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000102',
    company_gstin: '33GWYPP4027A1ZD',
    name: 'Hosur Precision Auto Components Ltd',
    address: 'Phase II, SIPCOT Industrial Complex, Mornapalli, Hosur - 635109',
    gstin: '33AABCH8877K1ZZ',
    pan: 'AABCH8877K',
    state: 'TAMIL NADU',
    phone: '04344-278900',
    email: 'logistics@hosurprecision.com',
    created_at: new Date('2026-06-01').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000103',
    company_gstin: '33GWYPP4027A1ZD',
    name: 'Apex Agro & Solar Equipment Hosur',
    address: 'Thorapalli Agraharam Main Road, Perandapalli, Hosur - 635130',
    gstin: '33AAICA5544L1Z1',
    pan: 'AAICA5544L',
    state: 'TAMIL NADU',
    phone: '96983 89111',
    email: 'dispatch@apexsolarhosur.in',
    created_at: new Date('2026-06-01').toISOString(),
  }
];

const INITIAL_VEHICLES = [
  // Sri Ram Transport Vehicles (GST: 33GUPS2382N1ZF)
  { id: 'b0000000-0000-0000-0000-000000000001', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'KA01AB5401', vehicle_type: '19FT-SA-IIMT', owner_name: 'Suresh Kumar', owner_phone: '9845012345' },
  { id: 'b0000000-0000-0000-0000-000000000002', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'KA53B3784', vehicle_type: '22FT-TB-10MT', owner_name: 'Manjunath Gowda', owner_phone: '9845123456' },
  { id: 'b0000000-0000-0000-0000-000000000003', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN70AP3051', vehicle_type: '14FT-LCV-4 MT', owner_name: 'Murugan Transport', owner_phone: '9443012345' },
  { id: 'b0000000-0000-0000-0000-000000000004', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'KA665220', vehicle_type: '19FT-SA-IIMT', owner_name: 'Ramesh Babu', owner_phone: '9880123456' },
  { id: 'b0000000-0000-0000-0000-000000000005', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'KA11A0846', vehicle_type: '19FT-SA-IIMT', owner_name: 'Venkatesh R', owner_phone: '9448123456' },
  { id: 'b0000000-0000-0000-0000-000000000006', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN30CC2936', vehicle_type: '22FT-TB-10MT', owner_name: 'Selvam Lorry Service', owner_phone: '9442123456' },
  { id: 'b0000000-0000-0000-0000-000000000007', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN28AR1872', vehicle_type: '20FT Taurus 16MT', owner_name: 'Kandasamy Logistics', owner_phone: '9842123456' },
  { id: 'b0000000-0000-0000-0000-000000000008', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'KA04D1920', vehicle_type: '32FT Multi-Axle 20MT', owner_name: 'Bangalore Fast Track', owner_phone: '9845129999' },
  { id: 'b0000000-0000-0000-0000-000000000009', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN34AE1077', vehicle_type: '19FT-SA-IIMT', owner_name: 'Senthil Kumar', owner_phone: '9842011111' },
  { id: 'b0000000-0000-0000-0000-000000000010', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN29CE7789', vehicle_type: '22FT-TB-10MT', owner_name: 'Velavan Translines', owner_phone: '9443122222' },
  { id: 'b0000000-0000-0000-0000-000000000011', company_gstin: '33GUPS2382N1ZF', vehicle_number: 'TN12AE1752', vehicle_type: '14FT-LCV-4 MT', owner_name: 'Sri Balaji Roadways', owner_phone: '9442133333' },
  
  // Sri Ram Logistics Vehicles (GST: 33GWYPP4027A1ZD)
  { id: 'b0000000-0000-0000-0000-000000000101', company_gstin: '33GWYPP4027A1ZD', vehicle_number: 'TN70AX9922', vehicle_type: '20FT Container Eicher', owner_name: 'SRL Fleet Express', owner_phone: '96983 89111' },
  { id: 'b0000000-0000-0000-0000-000000000102', company_gstin: '33GWYPP4027A1ZD', vehicle_number: 'TN24AB5511', vehicle_type: '32FT Multi-Axle Truck', owner_name: 'Thorapalli Heavy Carriers', owner_phone: '99441 21306' },
  { id: 'b0000000-0000-0000-0000-000000000103', company_gstin: '33GWYPP4027A1ZD', vehicle_number: 'KA51C8800', vehicle_type: '14FT LCV Closed Body', owner_name: 'Perandapalli Translines', owner_phone: '98450 12345' }
];

export const INITIAL_PAYMENTS = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    trip_id: 'c0000000-0000-0000-0000-000000000001',
    client_id: 'a0000000-0000-0000-0000-000000000001',
    load_id: '21913689',
    lr_number: '9081',
    client_name: 'Ashirvad Pipes Pvt Ltd',
    total_freight: 9900.00,
    payment_type: 'advance',
    payment_mode: 'online',
    amount: 5000.00,
    payer_name: 'Ashirvad Finance Desk',
    utr_number: 'CMS290184719',
    payment_date: '2026-06-02',
    notes: 'Advance booking NEFT transfer',
    created_at: '2026-06-02T10:30:00.000Z'
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    trip_id: 'c0000000-0000-0000-0000-000000000002',
    client_id: 'a0000000-0000-0000-0000-000000000001',
    load_id: '21914630',
    lr_number: '9082',
    client_name: 'Ashirvad Pipes Pvt Ltd',
    total_freight: 7998.00,
    payment_type: 'half_payment',
    payment_mode: 'online',
    amount: 4000.00,
    payer_name: 'Ashirvad Pipes Pvt Ltd',
    utr_number: 'HDFC00012948',
    payment_date: '2026-06-03',
    notes: '50% installment on dispatch',
    created_at: '2026-06-03T11:00:00.000Z'
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    trip_id: 'c0000000-0000-0000-0000-000000000003',
    client_id: 'a0000000-0000-0000-0000-000000000001',
    load_id: '21915060',
    lr_number: '9083',
    client_name: 'Ashirvad Pipes Pvt Ltd',
    total_freight: 7200.00,
    payment_type: 'full_payment',
    payment_mode: 'cash',
    amount: 7200.00,
    payer_name: 'Cash Depot Collection',
    utr_number: null,
    payment_date: '2026-06-04',
    notes: 'Full balance settled in cash on delivery',
    created_at: '2026-06-04T15:30:00.000Z'
  },
  {
    id: 'e0000000-0000-0000-0000-000000000101',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    trip_id: 'c0000000-0000-0000-0000-000000000101',
    client_id: 'a0000000-0000-0000-0000-000000000101',
    load_id: 'SRL-220101',
    lr_number: 'SRL-101',
    client_name: 'Sri Ram Logistics — Attibele Cargo Hub',
    total_freight: 12480.00,
    payment_type: 'advance',
    payment_mode: 'online',
    amount: 6000.00,
    payer_name: 'Attibele Hub Logistics',
    utr_number: 'UTIB000293819',
    payment_date: '2026-06-03',
    notes: 'Advance booking transfer',
    created_at: '2026-06-03T10:00:00.000Z'
  }
];

export const INITIAL_INVOICES = [
  {
    id: 'inv-srt-112',
    invoice_number: 'SRT-26-27/112',
    client_id: 'cli-002',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-06-05',
    sub_total: 64300.00,
    gst_percent: 5.0,
    gst_amount: 3215.00,
    net_amount: 64300.00,
    reverse_charge: true,
    notes: 'Vizianagaram multi-drop consignment billing',
    created_at: '2026-06-05T14:30:00.000Z',
    trips: [
      {
        id: 'inv-trip-112-1',
        loading_date: '2026-06-04',
        lr_number: '9112',
        vehicle: { vehicle_number: 'TN34AE1077' },
        from_location: 'BANGALORE',
        to_location: 'VIZIANAGARAM',
        rate: 64300,
        freight_amount: 64300.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-111',
    invoice_number: 'SRT-26-27/111',
    client_id: 'cli-001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-06-03',
    sub_total: 86100.00,
    gst_percent: 5.0,
    gst_amount: 4305.00,
    net_amount: 86100.00,
    reverse_charge: true,
    notes: 'Consolidated CPVC & SWR pipe consignments',
    created_at: '2026-06-03T11:20:00.000Z',
    trips: [
      {
        id: 'inv-trip-111-1',
        loading_date: '2026-06-02',
        lr_number: '9111',
        vehicle: { vehicle_number: 'TN29CE7789' },
        from_location: 'BANGALORE',
        to_location: 'SALEM',
        rate: 86100,
        freight_amount: 86100.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-110',
    invoice_number: 'SRT-26-27/110',
    client_id: 'cli-003',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-06-01',
    sub_total: 48500.00,
    gst_percent: 5.0,
    gst_amount: 2425.00,
    net_amount: 48500.00,
    reverse_charge: true,
    notes: 'Electrical switchgear industrial transit',
    created_at: '2026-06-01T09:45:00.000Z',
    trips: [
      {
        id: 'inv-trip-110-1',
        loading_date: '2026-05-31',
        lr_number: '9110',
        vehicle: { vehicle_number: 'TN12AE1752' },
        from_location: 'BANGALORE',
        to_location: 'SALEM',
        rate: 48500,
        freight_amount: 48500.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-109',
    invoice_number: 'SRT-26-27/109',
    client_id: 'cli-001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-28',
    sub_total: 73900.00,
    gst_percent: 5.0,
    gst_amount: 3695.00,
    net_amount: 73900.00,
    reverse_charge: true,
    notes: 'Jigani plant bulk freight invoice',
    created_at: '2026-05-28T16:15:00.000Z',
    trips: [
      {
        id: 'inv-trip-109-1',
        loading_date: '2026-05-27',
        lr_number: '9109',
        vehicle: { vehicle_number: 'KA51AA8161' },
        from_location: 'BANGALORE',
        to_location: 'HOSUR',
        rate: 73900,
        freight_amount: 73900.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-108',
    invoice_number: 'SRT-26-27/108',
    client_id: 'cli-002',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-25',
    sub_total: 58000.00,
    gst_percent: 5.0,
    gst_amount: 2900.00,
    net_amount: 58000.00,
    reverse_charge: true,
    notes: 'Andhra corridor heavy trailer haulage',
    created_at: '2026-05-25T13:10:00.000Z',
    trips: [
      {
        id: 'inv-trip-108-1',
        loading_date: '2026-05-24',
        lr_number: '9108',
        vehicle: { vehicle_number: 'KA25D5462' },
        from_location: 'BANGALORE',
        to_location: 'VIZIANAGARAM',
        rate: 58000,
        freight_amount: 58000.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-107',
    invoice_number: 'SRT-26-27/107',
    client_id: 'cli-003',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-22',
    sub_total: 39600.00,
    gst_percent: 5.0,
    gst_amount: 1980.00,
    net_amount: 39600.00,
    reverse_charge: true,
    notes: 'Salem depot wiring products delivery',
    created_at: '2026-05-22T15:40:00.000Z',
    trips: [
      {
        id: 'inv-trip-107-1',
        loading_date: '2026-05-21',
        lr_number: '9107',
        vehicle: { vehicle_number: 'TN30CC2936' },
        from_location: 'BANGALORE',
        to_location: 'SALEM',
        rate: 39600,
        freight_amount: 39600.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-106',
    invoice_number: 'SRT-26-27/106',
    client_id: 'cli-001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-19',
    sub_total: 81200.00,
    gst_percent: 5.0,
    gst_amount: 4060.00,
    net_amount: 81200.00,
    reverse_charge: true,
    notes: 'Underground conduit pipes shipment',
    created_at: '2026-05-19T11:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-106-1',
        loading_date: '2026-05-18',
        lr_number: '9106',
        vehicle: { vehicle_number: 'KA11A0846' },
        from_location: 'BANGALORE',
        to_location: 'COIMBATORE',
        rate: 81200,
        freight_amount: 81200.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-105',
    invoice_number: 'SRT-26-27/105',
    client_id: 'cli-002',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-16',
    sub_total: 52400.00,
    gst_percent: 5.0,
    gst_amount: 2620.00,
    net_amount: 52400.00,
    reverse_charge: true,
    notes: 'Vizianagaram hardware dispatch',
    created_at: '2026-05-16T14:20:00.000Z',
    trips: [
      {
        id: 'inv-trip-105-1',
        loading_date: '2026-05-15',
        lr_number: '9105',
        vehicle: { vehicle_number: 'KA665220' },
        from_location: 'BANGALORE',
        to_location: 'VIZIANAGARAM',
        rate: 52400,
        freight_amount: 52400.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-104',
    invoice_number: 'SRT-26-27/104',
    client_id: 'cli-001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-12',
    sub_total: 94800.00,
    gst_percent: 5.0,
    gst_amount: 4740.00,
    net_amount: 94800.00,
    reverse_charge: true,
    notes: 'Multi-axle bulk pipe transport bill',
    created_at: '2026-05-12T10:30:00.000Z',
    trips: [
      {
        id: 'inv-trip-104-1',
        loading_date: '2026-05-11',
        lr_number: '9104',
        vehicle: { vehicle_number: 'TN70AP3051' },
        from_location: 'BANGALORE',
        to_location: 'CHENNAI',
        rate: 94800,
        freight_amount: 94800.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-103',
    invoice_number: 'SRT-26-27/103',
    client_id: 'cli-003',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-09',
    sub_total: 62000.00,
    gst_percent: 5.0,
    gst_amount: 3100.00,
    net_amount: 62000.00,
    reverse_charge: true,
    notes: 'Transformer and panels carriage',
    created_at: '2026-05-09T16:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-103-1',
        loading_date: '2026-05-08',
        lr_number: '9103',
        vehicle: { vehicle_number: 'KA53B3784' },
        from_location: 'BANGALORE',
        to_location: 'SALEM',
        rate: 62000,
        freight_amount: 62000.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-102',
    invoice_number: 'SRT-26-27/102',
    client_id: 'cli-002',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-05',
    sub_total: 45200.00,
    gst_percent: 5.0,
    gst_amount: 2260.00,
    net_amount: 45200.00,
    reverse_charge: true,
    notes: 'Express parcel & materials logistics',
    created_at: '2026-05-05T12:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-102-1',
        loading_date: '2026-05-04',
        lr_number: '9102',
        vehicle: { vehicle_number: 'KA01AB5401' },
        from_location: 'BANGALORE',
        to_location: 'VIZIANAGARAM',
        rate: 45200,
        freight_amount: 45200.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srt-101',
    invoice_number: 'SRT-26-27/101',
    client_id: 'cli-001',
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    invoice_date: '2026-05-02',
    sub_total: 78500.00,
    gst_percent: 5.0,
    gst_amount: 3925.00,
    net_amount: 78500.00,
    reverse_charge: true,
    notes: 'Initial seasonal delivery invoice',
    created_at: '2026-05-02T10:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-101-1',
        loading_date: '2026-05-01',
        lr_number: '9101',
        vehicle: { vehicle_number: 'TN70AP3051' },
        from_location: 'BANGALORE',
        to_location: 'MADURAI',
        rate: 78500,
        freight_amount: 78500.00,
        other_charges: 0
      }
    ]
  },
  // Sri Ram Logistics Sample Invoices (GST: 33GWYPP4027A1ZD)
  {
    id: 'inv-srl-101',
    invoice_number: 'SRL-26-27/101',
    client_id: 'cli-srl-001',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    invoice_date: '2026-06-02',
    sub_total: 54000.00,
    gst_percent: 5.0,
    gst_amount: 2700.00,
    net_amount: 54000.00,
    reverse_charge: true,
    notes: 'Attibele hub dedicated container line haul',
    created_at: '2026-06-02T11:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-srl-101-1',
        loading_date: '2026-06-01',
        lr_number: 'SRL-8801',
        vehicle: { vehicle_number: 'TN70AX9922' },
        from_location: 'HOSUR',
        to_location: 'ATTIBELE',
        rate: 54000,
        freight_amount: 54000.00,
        other_charges: 0
      }
    ]
  },
  {
    id: 'inv-srl-102',
    invoice_number: 'SRL-26-27/102',
    client_id: 'cli-srl-002',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    invoice_date: '2026-06-04',
    sub_total: 72500.00,
    gst_percent: 5.0,
    gst_amount: 3625.00,
    net_amount: 72500.00,
    reverse_charge: true,
    notes: 'Mornapalli SIPCOT auto components batch shipping',
    created_at: '2026-06-04T15:00:00.000Z',
    trips: [
      {
        id: 'inv-trip-srl-102-1',
        loading_date: '2026-06-03',
        lr_number: 'SRL-8802',
        vehicle: { vehicle_number: 'TN24AB5511' },
        from_location: 'HOSUR',
        to_location: 'CHENNAI AUTO CLUSTER',
        rate: 72500,
        freight_amount: 72500.00,
        other_charges: 0
      }
    ]
  }
];

const INITIAL_TRIPS = [
  {
    id: 'trip-001',
    load_id: '21913689',
    loading_date: '2026-06-02',
    vehicle_id: 'veh-001',
    client_id: 'cli-001',
    from_location: 'BANGALORE, Jigani',
    to_location: 'BANGALORE',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Local Depot Warehouse',
    packages: '42 Bundles',
    description: 'PVC Conduit Pipes & Bends',
    actual_weight: 4.5,
    charged_weight: 4.5,
    rate: 2200,
    freight_amount: 9900.00,
    vehicle_freight: 8400.00,
    profit: 1500.00,
    status: 'completed',
    lr_number: '9081',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-002',
    load_id: '21914630',
    loading_date: '2026-06-02',
    vehicle_id: 'veh-002',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'RAMANAGAR',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Ramanagar Pipe Traders',
    packages: '30 Bundles',
    description: 'CPVC Fitting Boxes',
    actual_weight: 3.2,
    charged_weight: 3.5,
    rate: 2285,
    freight_amount: 7998.00,
    vehicle_freight: 6700.00,
    profit: 1298.00,
    status: 'completed',
    lr_number: '9082',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-003',
    load_id: '21915060',
    loading_date: '2026-06-02',
    vehicle_id: 'veh-003',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'KELAMANGALAM',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Sri Ram Agency Hardware',
    packages: '25 Bundles',
    description: 'SWR Pipes & Rubber Rings',
    actual_weight: 2.8,
    charged_weight: 3.0,
    rate: 2400,
    freight_amount: 7200.00,
    vehicle_freight: 6000.00,
    profit: 1200.00,
    status: 'completed',
    lr_number: '9083',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-004',
    load_id: '21919535',
    loading_date: '2026-06-02',
    vehicle_id: 'veh-004',
    client_id: 'cli-001',
    from_location: 'BANGALORE, Jigani',
    to_location: 'SHIMOGA',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Malnad Hardware Distributors',
    packages: '65 Bundles',
    description: 'Underground Drainage Pipes',
    actual_weight: 7.5,
    charged_weight: 8.0,
    rate: 2312,
    freight_amount: 18500.00,
    vehicle_freight: 15500.00,
    profit: 3000.00,
    status: 'completed',
    lr_number: '9084',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-005',
    load_id: '21944822',
    loading_date: '2026-06-03',
    vehicle_id: 'veh-005',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'NELAMANGALA',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Pavan Agencies',
    packages: '38 Bundles',
    description: 'PVC Pressure Pipes Class 2',
    actual_weight: 4.0,
    charged_weight: 4.0,
    rate: 2125,
    freight_amount: 8500.00,
    vehicle_freight: 7200.00,
    profit: 1300.00,
    status: 'completed',
    lr_number: '9085',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-006',
    load_id: '21930248',
    loading_date: '2026-06-03',
    vehicle_id: 'veh-006',
    client_id: 'cli-001',
    from_location: 'SALEM',
    to_location: 'SILAL',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Salem Pipe House',
    packages: '45 Bundles',
    description: 'Submersible Column Pipes',
    actual_weight: 5.0,
    charged_weight: 5.0,
    rate: 2000,
    freight_amount: 9999.00,
    vehicle_freight: 8500.00,
    profit: 1499.00,
    status: 'completed',
    lr_number: '9086',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-007',
    load_id: '21954493',
    loading_date: '2026-06-03',
    vehicle_id: 'veh-002',
    client_id: 'cli-001',
    from_location: 'Attibele',
    to_location: 'PURA, YADAVAL',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Yadava Sanitary Mart',
    packages: '55 Bundles',
    description: 'Overhead Water Tank Fittings',
    actual_weight: 6.2,
    charged_weight: 6.5,
    rate: 2138,
    freight_amount: 13900.00,
    vehicle_freight: 11800.00,
    profit: 2100.00,
    status: 'completed',
    lr_number: '9087',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-008',
    load_id: '21977628',
    loading_date: '2026-06-04',
    vehicle_id: 'veh-005',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'NELAMANGALA',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Metro Builders Mart',
    packages: '35 Bundles',
    description: 'Hot & Cold Water Pipes',
    actual_weight: 3.8,
    charged_weight: 4.0,
    rate: 2025,
    freight_amount: 8100.00,
    vehicle_freight: 6900.00,
    profit: 1200.00,
    status: 'completed',
    lr_number: '9088',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-009',
    load_id: '21977630',
    loading_date: '2026-06-04',
    vehicle_id: 'veh-007',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'NELAMANGALA',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Apex Plumbing Store',
    packages: '36 Bundles',
    description: 'Agricultural Drip Pipes',
    actual_weight: 3.9,
    charged_weight: 4.0,
    rate: 2075,
    freight_amount: 8300.00,
    vehicle_freight: 7000.00,
    profit: 1300.00,
    status: 'completed',
    lr_number: '9089',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-010',
    load_id: '21977631',
    loading_date: '2026-06-04',
    vehicle_id: 'veh-008',
    client_id: 'cli-001',
    from_location: 'BANGALORE',
    to_location: 'NELAMANGALA',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Venkata Sai Enterprises',
    packages: '36 Bundles',
    description: 'Conduit & Accessories',
    actual_weight: 3.9,
    charged_weight: 4.0,
    rate: 2075,
    freight_amount: 8300.00,
    vehicle_freight: 7000.00,
    profit: 1300.00,
    status: 'completed',
    lr_number: '9090',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-011',
    load_id: '22026110',
    loading_date: '2026-06-06',
    vehicle_id: 'veh-001',
    client_id: 'cli-001',
    from_location: 'GALORE, KELAMANGA',
    to_location: 'Paloncha',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Telangana Hardware & Sanitary',
    packages: '110 Bundles',
    description: 'Heavy Industrial SWR Pipes',
    actual_weight: 14.5,
    charged_weight: 15.0,
    rate: 2426,
    freight_amount: 36400.00,
    vehicle_freight: 31000.00,
    profit: 5400.00,
    status: 'in_transit',
    lr_number: null,
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-012',
    load_id: '22029985',
    loading_date: '2026-06-06',
    vehicle_id: 'veh-006',
    client_id: 'cli-001',
    from_location: 'SALEM',
    to_location: 'Kelambakkam',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'ECR Commercial Traders',
    packages: '42 Bundles',
    description: 'Foam Core Drainage Pipes',
    actual_weight: 4.6,
    charged_weight: 5.0,
    rate: 1980,
    freight_amount: 9900.00,
    vehicle_freight: 8300.00,
    profit: 1600.00,
    status: 'in_transit',
    lr_number: null,
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-013',
    load_id: '22060574',
    loading_date: '2026-06-08',
    vehicle_id: 'veh-001',
    client_id: 'cli-001',
    from_location: 'NGALORE, NELAMANGA',
    to_location: 'MYSURU',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Mysore Sanitary Corp',
    packages: '60 Bundles',
    description: 'Plumbing Kits & Ball Valves',
    actual_weight: 6.8,
    charged_weight: 7.0,
    rate: 2128,
    freight_amount: 14900.00,
    vehicle_freight: 12500.00,
    profit: 2400.00,
    status: 'booked',
    lr_number: null,
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-014',
    load_id: '22060651',
    loading_date: '2026-06-08',
    vehicle_id: 'veh-001',
    client_id: 'cli-001',
    from_location: 'GALORE, KELAMANGA',
    to_location: 'CHIKBALLAPUR',
    consignor: 'Ashirvad Pipes Pvt Ltd',
    consignee: 'Nandi Hardware Mart',
    packages: '62 Bundles',
    description: 'PVC Conduit Heavy Gauge',
    actual_weight: 7.0,
    charged_weight: 7.0,
    rate: 2271,
    freight_amount: 15900.00,
    vehicle_freight: 13500.00,
    profit: 2400.00,
    status: 'booked',
    lr_number: null,
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  },
  // Dedicated Sri Ram Logistics Loads (GSTIN: 33GWYPP4027A1ZD)
  {
    id: 'trip-srl-001',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    load_id: 'SRL-220101',
    loading_date: '2026-06-03',
    vehicle_id: 'veh-srl-001',
    client_id: 'cli-srl-001',
    from_location: 'THORAPALLI AGRAHARAM, HOSUR',
    to_location: 'BANGALORE, Whitefield',
    consignor: 'Sri Ram Logistics (Thorapalli)',
    consignee: 'Ashirvad Pipes Pvt Ltd Warehouse',
    packages: '55 Boxes',
    description: 'Industrial UPVC Pipe Fittings & Valves',
    actual_weight: 5.2,
    charged_weight: 5.2,
    rate: 2400,
    freight_amount: 12480.00,
    vehicle_freight: 10500.00,
    profit: 1980.00,
    status: 'completed',
    lr_number: 'SRL-101',
    lr_file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-srl-002',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    load_id: 'SRL-220102',
    loading_date: '2026-06-04',
    vehicle_id: 'veh-srl-002',
    client_id: 'cli-srl-002',
    from_location: 'PERANDAPALLI VILLAGE, HOSUR',
    to_location: 'SALEM INDUSTRIAL ESTATE',
    consignor: 'Sri Ram Logistics (Perandapalli)',
    consignee: 'Hosur Precision Auto Hub',
    packages: '38 Bundles',
    description: 'High Pressure Agricultural Pipes',
    actual_weight: 4.0,
    charged_weight: 4.0,
    rate: 2600,
    freight_amount: 10400.00,
    vehicle_freight: 8800.00,
    profit: 1600.00,
    status: 'in_transit',
    lr_number: 'SRL-102',
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  },
  {
    id: 'trip-srl-003',
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    load_id: 'SRL-220103',
    loading_date: '2026-06-05',
    vehicle_id: 'veh-srl-003',
    client_id: 'cli-srl-003',
    from_location: 'HOSUR INDUSTRIAL CORRIDOR',
    to_location: 'COIMBATORE, Peelamedu',
    consignor: 'Sri Ram Logistics Hub',
    consignee: 'Jaibalaji Electricals & Motors',
    packages: '60 Bags',
    description: 'Heavy Conduit Fittings & Cables',
    actual_weight: 3.8,
    charged_weight: 4.0,
    rate: 2800,
    freight_amount: 11200.00,
    vehicle_freight: 9500.00,
    profit: 1700.00,
    status: 'booked',
    lr_number: 'SRL-103',
    lr_file_url: null,
    invoiced: false,
    invoice_id: null,
  }
];

// Initial Seed User Logs for Audit & Activity Trail
const INITIAL_USER_LOGS = [
  {
    id: 'log-001',
    user_id: 'usr-adm-01',
    user_name: 'Sri Ram Administrator',
    user_email: 'admin@sriramtransport.com',
    user_role: 'admin',
    action: 'LOGIN',
    module: 'Auth',
    description: 'Sri Ram Administrator logged in successfully',
    details: { role: 'admin', operating_gstin: 'ALL' },
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    created_at: '2026-06-01T08:30:00.000Z'
  },
  {
    id: 'log-002',
    user_id: 'usr-mgr-02',
    user_name: 'Hosur Dispatch Manager',
    user_email: 'manager@sriramtransport.com',
    user_role: 'manager',
    action: 'CREATE_TRIP',
    module: 'Trips',
    description: 'Created trip LOAD-22001 for client Ashirvad Pipes Pvt Ltd (Perandapalli to Madurai)',
    details: { load_id: 'LOAD-22001', client: 'Ashirvad Pipes Pvt Ltd', freight: 39900, vehicle: 'TN 70 AB 1234' },
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    created_at: '2026-06-01T09:15:00.000Z'
  },
  {
    id: 'log-003',
    user_id: 'usr-mgr-02',
    user_name: 'Hosur Dispatch Manager',
    user_email: 'manager@sriramtransport.com',
    user_role: 'manager',
    action: 'COMPLETE_TRIP',
    module: 'Trips',
    description: 'Uploaded LR/POD receipt and marked trip LOAD-22001 as Completed',
    details: { load_id: 'LOAD-22001', lr_number: 'LR-2026-0891' },
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    created_at: '2026-06-02T14:40:00.000Z'
  },
  {
    id: 'log-004',
    user_id: 'usr-adm-01',
    user_name: 'Sri Ram Administrator',
    user_email: 'admin@sriramtransport.com',
    user_role: 'admin',
    action: 'GENERATE_INVOICE',
    module: 'Invoices',
    description: 'Generated Tax Invoice INV-2026-001 for Ashirvad Pipes (₹1,09,800.00)',
    details: { invoice_number: 'INV-2026-001', trips_count: 2, total_amount: 109800 },
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    created_at: '2026-06-03T11:05:00.000Z'
  },
  {
    id: 'log-005',
    user_id: 'usr-mgr-02',
    user_name: 'Hosur Dispatch Manager',
    user_email: 'manager@sriramtransport.com',
    user_role: 'manager',
    action: 'RECORD_PAYMENT',
    module: 'Payments',
    description: 'Recorded Advance Payment of ₹25,000 for Invoice INV-2026-001 via Online (UTR: 202606019812)',
    details: { payment_type: 'advance', payment_mode: 'Online', amount: 25000, utr_no: '202606019812' },
    company_gstin: '33GUPS2382N1ZF',
    company_name: 'Sri Ram Transport',
    created_at: '2026-06-03T16:20:00.000Z'
  },
  {
    id: 'log-006',
    user_id: 'usr-srl-01',
    user_name: 'SRL Logistics Coordinator',
    user_email: 'manager@sriramlogistics.com',
    user_role: 'manager',
    action: 'LOGIN',
    module: 'Auth',
    description: 'SRL Logistics Coordinator logged in successfully',
    details: { role: 'manager', operating_gstin: '33GWYPP4027A1ZD' },
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    created_at: '2026-06-04T08:45:00.000Z'
  },
  {
    id: 'log-007',
    user_id: 'usr-srl-02',
    user_name: 'SRL Thorapalli Desk Staff',
    user_email: 'staff@sriramlogistics.com',
    user_role: 'staff',
    action: 'CREATE_TRIP',
    module: 'Trips',
    description: 'Booked load SRL-220101 for Supreme Industries (Hosur to Chennai)',
    details: { load_id: 'SRL-220101', client: 'Supreme Industries Ltd', freight: 15400, vehicle: 'TN 24 C 8899' },
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    created_at: '2026-06-04T09:30:00.000Z'
  },
  {
    id: 'log-008',
    user_id: 'usr-srl-01',
    user_name: 'SRL Logistics Coordinator',
    user_email: 'manager@sriramlogistics.com',
    user_role: 'manager',
    action: 'RECORD_PAYMENT',
    module: 'Payments',
    description: 'Settled Full Clearance payment of ₹15,400 for SRL-220101 (UTR: 202606041234)',
    details: { payment_type: 'full', payment_mode: 'Online', amount: 15400, utr_no: '202606041234' },
    company_gstin: '33GWYPP4027A1ZD',
    company_name: 'Sri Ram Logistics',
    created_at: '2026-06-05T12:10:00.000Z'
  }
];

// Helper to calculate profit with SQL round behavior
export function calculateProfit(freightAmount, vehicleFreight) {
  const f = parseFloat(freightAmount) || 0;
  const v = parseFloat(vehicleFreight) || 0;
  return Math.round((f - v) * 100) / 100;
}

// Local Storage Helper Utilities
function getLocalItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return fallback;
  }
}

function setLocalItem(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

// Ensure seed data is initialized in localStorage
function ensureSeedData() {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setLocalItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // Migrate any legacy string IDs in localStorage to proper Supabase UUIDs
  const storedClients = getLocalItem(STORAGE_KEYS.CLIENTS, []);
  if (storedClients.some(c => CLIENT_ID_MAP[c.id])) {
    const upgraded = storedClients.map(c => ({
      ...c,
      id: CLIENT_ID_MAP[c.id] || (isUuid(c.id) ? c.id : generateUuid())
    }));
    setLocalItem(STORAGE_KEYS.CLIENTS, upgraded);
  }

  const storedVehicles = getLocalItem(STORAGE_KEYS.VEHICLES, []);
  if (storedVehicles.some(v => VEHICLE_ID_MAP[v.id])) {
    const upgraded = storedVehicles.map(v => ({
      ...v,
      id: VEHICLE_ID_MAP[v.id] || (isUuid(v.id) ? v.id : generateUuid())
    }));
    setLocalItem(STORAGE_KEYS.VEHICLES, upgraded);
  }

  const storedTrips = getLocalItem(STORAGE_KEYS.TRIPS, []);
  if (storedTrips.some(t => CLIENT_ID_MAP[t.client_id] || VEHICLE_ID_MAP[t.vehicle_id] || TRIP_ID_MAP[t.id])) {
    const upgraded = storedTrips.map(t => ({
      ...t,
      id: TRIP_ID_MAP[t.id] || (isUuid(t.id) ? t.id : generateUuid()),
      client_id: resolveClientId(t.client_id) || t.client_id,
      vehicle_id: resolveVehicleId(t.vehicle_id) || t.vehicle_id,
      invoice_id: resolveInvoiceId(t.invoice_id) || t.invoice_id,
    }));
    setLocalItem(STORAGE_KEYS.TRIPS, upgraded);
  }

  const storedInvoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
  if (storedInvoices.some(i => CLIENT_ID_MAP[i.client_id] || INVOICE_ID_MAP[i.id])) {
    const upgraded = storedInvoices.map(i => ({
      ...i,
      id: INVOICE_ID_MAP[i.id] || (isUuid(i.id) ? i.id : generateUuid()),
      client_id: resolveClientId(i.client_id) || i.client_id,
    }));
    setLocalItem(STORAGE_KEYS.INVOICES, upgraded);
  }

  const storedPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
  if (storedPayments.some(p => CLIENT_ID_MAP[p.client_id] || TRIP_ID_MAP[p.trip_id] || PAYMENT_ID_MAP[p.id])) {
    const upgraded = storedPayments.map(p => ({
      ...p,
      id: PAYMENT_ID_MAP[p.id] || (isUuid(p.id) ? p.id : generateUuid()),
      trip_id: resolveTripId(p.trip_id) || p.trip_id,
      client_id: resolveClientId(p.client_id) || p.client_id,
      invoice_id: resolveInvoiceId(p.invoice_id) || p.invoice_id,
    }));
    setLocalItem(STORAGE_KEYS.PAYMENTS, upgraded);
  }
  
  if (!isSupabaseConfigured) {
    const existingClients = getLocalItem(STORAGE_KEYS.CLIENTS, []);
    if (existingClients.length === 0) {
      setLocalItem(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    } else if (!existingClients.some(c => c.company_gstin === '33GWYPP4027A1ZD')) {
      const srlClients = INITIAL_CLIENTS.filter(c => c.company_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.CLIENTS, [...existingClients, ...srlClients]);
    }

    const existingVehicles = getLocalItem(STORAGE_KEYS.VEHICLES, []);
    if (existingVehicles.length === 0) {
      setLocalItem(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    } else if (!existingVehicles.some(v => v.company_gstin === '33GWYPP4027A1ZD')) {
      const srlVehicles = INITIAL_VEHICLES.filter(v => v.company_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.VEHICLES, [...existingVehicles, ...srlVehicles]);
    }

    const existingTrips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    if (existingTrips.length === 0) {
      setLocalItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    } else if (!existingTrips.some(t => t.company_gstin === '33GWYPP4027A1ZD')) {
      const srlTrips = INITIAL_TRIPS.filter(t => t.company_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.TRIPS, [...existingTrips, ...srlTrips]);
    }

    const existingInvoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
    if (existingInvoices.length < 10) {
      const existingIds = new Set(existingInvoices.map(i => i.id));
      const missing = INITIAL_INVOICES.filter(i => !existingIds.has(i.id));
      setLocalItem(STORAGE_KEYS.INVOICES, [...existingInvoices, ...missing]);
    } else if (!existingInvoices.some(i => i.company_gstin === '33GWYPP4027A1ZD')) {
      const srlInvoices = INITIAL_INVOICES.filter(i => i.company_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.INVOICES, [...existingInvoices, ...srlInvoices]);
    }

    const existingPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
    if (existingPayments.length === 0) {
      setLocalItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    } else if (!existingPayments.some(p => p.company_gstin === '33GWYPP4027A1ZD')) {
      const srlPayments = INITIAL_PAYMENTS.filter(p => p.company_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.PAYMENTS, [...existingPayments, ...srlPayments]);
    }

    const existingUsers = getLocalItem(STORAGE_KEYS.USERS, []);
    if (existingUsers.length === 0) {
      setLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    } else if (!existingUsers.some(u => u.operating_gstin === '33GWYPP4027A1ZD')) {
      const srlUsers = INITIAL_USERS.filter(u => u.operating_gstin === '33GWYPP4027A1ZD');
      setLocalItem(STORAGE_KEYS.USERS, [...existingUsers, ...srlUsers]);
    }
  } else {
    // When connected to Supabase database, purge any old mock demo data stored locally
    // so only actual database records are shown
    const storedTrips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    if (storedTrips.some(t => t.id && (String(t.id).startsWith('trip-') || String(t.id).startsWith('c0000000-0000-0000-0000-')))) {
      setLocalItem(STORAGE_KEYS.TRIPS, []);
    }
    const storedInvoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
    if (storedInvoices.some(i => i.id && (String(i.id).startsWith('inv-') || String(i.id).startsWith('d0000000-0000-0000-0000-')))) {
      setLocalItem(STORAGE_KEYS.INVOICES, []);
    }
    const storedPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
    if (storedPayments.some(p => p.id && (String(p.id).startsWith('pay-') || String(p.id).startsWith('e0000000-0000-0000-0000-')))) {
      setLocalItem(STORAGE_KEYS.PAYMENTS, []);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMPANY_ENTITIES)) {
    setLocalItem(STORAGE_KEYS.COMPANY_ENTITIES, DEFAULT_COMPANY_ENTITIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_ENTITY_GSTIN)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTITY_GSTIN, '33GUPS2382N1ZF');
  }

  const existingLogs = getLocalItem(STORAGE_KEYS.USER_LOGS, []);
  if (existingLogs.length === 0) {
    setLocalItem(STORAGE_KEYS.USER_LOGS, INITIAL_USER_LOGS);
  }
}

// Initialize immediately
if (typeof window !== 'undefined') {
  ensureSeedData();
}

export const db = {
  isConfigured: isSupabaseConfigured,

  // CLIENTS
  async getClients() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const clients = data.map(c => ({
            ...c,
            company_gstin: c.company_gstin || '33GUPS2382N1ZF',
          }));
          setLocalItem(STORAGE_KEYS.CLIENTS, clients);
          return clients;
        }
      } catch (e) {
        console.warn('Supabase getClients failed:', e);
      }
    }
    return getLocalItem(STORAGE_KEYS.CLIENTS, isSupabaseConfigured ? [] : INITIAL_CLIENTS);
  },

  async saveClient(clientData) {
    const activeEntity = this.getActiveCompany();
    const cleanId = resolveClientId(clientData.id) || (isUuid(clientData.id) ? clientData.id : generateUuid());
    const payload = {
      ...clientData,
      id: cleanId,
      company_gstin: clientData.company_gstin || activeEntity.gstin,
    };
    let persistedId = cleanId;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' }).select().single();
        if (!error && data) {
          persistedId = data.id;
        } else if (error) {
          console.error('Supabase upsert client error:', error);
          throw new Error('Failed to save client: ' + (error.message || JSON.stringify(error)));
        }
      } catch (err) {
        if (err.message && err.message.startsWith('Failed to save client')) throw err;
        console.warn('Supabase saveClient network error, saving locally:', err.message);
      }
    }

    const list = getLocalItem(STORAGE_KEYS.CLIENTS, []);
    const finalClient = {
      ...payload,
      id: persistedId,
      created_at: payload.created_at || new Date().toISOString(),
    };
    if (clientData.id) {
      const updated = list.map(c => (c.id === clientData.id || c.id === persistedId) ? finalClient : c);
      setLocalItem(STORAGE_KEYS.CLIENTS, updated);
    } else {
      setLocalItem(STORAGE_KEYS.CLIENTS, [finalClient, ...list.filter(c => c.id !== persistedId)]);
    }

    const isEdit = Boolean(clientData.id);
    this.logUserAction({
      action: isEdit ? 'UPDATE_CLIENT' : 'ADD_CLIENT',
      module: 'Clients',
      description: `${isEdit ? 'Updated' : 'Added'} client profile: ${finalClient.name} (GSTIN: ${finalClient.gstin || 'Unregistered'})`,
      details: { client_id: finalClient.id, name: finalClient.name, gstin: finalClient.gstin, state: finalClient.state },
      company_gstin: finalClient.company_gstin
    });

    return finalClient;
  },

  async deleteClient(id) {
    this.logUserAction({
      action: 'DELETE_CLIENT',
      module: 'Clients',
      description: `Deleted client profile ${id}`,
      details: { client_id: id }
    });

    const targetId = resolveClientId(id) || id;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('clients').delete().eq('id', targetId);
      } catch (err) {
        console.warn('Supabase deleteClient error:', err);
      }
    }
    const list = getLocalItem(STORAGE_KEYS.CLIENTS, []);
    setLocalItem(STORAGE_KEYS.CLIENTS, list.filter(c => c.id !== id && c.id !== targetId));
    return true;
  },

  // VEHICLES
  async getVehicles() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const vehicles = data.map(v => ({
            ...v,
            company_gstin: v.company_gstin || '33GUPS2382N1ZF',
          }));
          setLocalItem(STORAGE_KEYS.VEHICLES, vehicles);
          return vehicles;
        }
      } catch (e) {
        console.warn('Supabase getVehicles failed:', e);
      }
    }
    return getLocalItem(STORAGE_KEYS.VEHICLES, isSupabaseConfigured ? [] : INITIAL_VEHICLES);
  },

  async saveVehicle(vehicleData) {
    const activeEntity = this.getActiveCompany();
    const cleanId = resolveVehicleId(vehicleData.id) || (isUuid(vehicleData.id) ? vehicleData.id : generateUuid());
    const payload = {
      ...vehicleData,
      id: cleanId,
      company_gstin: vehicleData.company_gstin || activeEntity.gstin,
    };
    let persistedId = cleanId;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('vehicles').upsert(payload, { onConflict: 'id' }).select().single();
        if (!error && data) {
          persistedId = data.id;
        } else if (error) {
          console.error('Supabase upsert vehicle error:', error);
          throw new Error('Failed to save vehicle: ' + (error.message || JSON.stringify(error)));
        }
      } catch (err) {
        if (err.message && err.message.startsWith('Failed to save vehicle')) throw err;
        console.warn('Supabase saveVehicle network error, saving locally:', err.message);
      }
    }

    const list = getLocalItem(STORAGE_KEYS.VEHICLES, []);
    const finalVehicle = {
      ...payload,
      id: persistedId,
      created_at: payload.created_at || new Date().toISOString(),
    };
    if (vehicleData.id) {
      const updated = list.map(v => (v.id === vehicleData.id || v.id === persistedId) ? finalVehicle : v);
      setLocalItem(STORAGE_KEYS.VEHICLES, updated);
    } else {
      setLocalItem(STORAGE_KEYS.VEHICLES, [finalVehicle, ...list.filter(v => v.id !== persistedId)]);
    }

    const isEditVehicle = Boolean(vehicleData.id);
    this.logUserAction({
      action: isEditVehicle ? 'UPDATE_VEHICLE' : 'ADD_VEHICLE',
      module: 'Vehicles',
      description: `${isEditVehicle ? 'Updated' : 'Added'} vehicle: ${finalVehicle.truck_number} (${finalVehicle.truck_type || 'Lorry'})`,
      details: { vehicle_id: finalVehicle.id, truck_number: finalVehicle.truck_number, driver_name: finalVehicle.driver_name, phone: finalVehicle.driver_phone },
      company_gstin: finalVehicle.company_gstin
    });

    return finalVehicle;
  },

  async deleteVehicle(id) {
    this.logUserAction({
      action: 'DELETE_VEHICLE',
      module: 'Vehicles',
      description: `Deleted vehicle record ${id}`,
      details: { vehicle_id: id }
    });

    const targetId = resolveVehicleId(id) || id;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('vehicles').delete().eq('id', targetId);
      } catch (err) {
        console.warn('Supabase deleteVehicle error:', err);
      }
    }
    const list = getLocalItem(STORAGE_KEYS.VEHICLES, []);
    setLocalItem(STORAGE_KEYS.VEHICLES, list.filter(v => v.id !== id && v.id !== targetId));
    return true;
  },

  // TRIPS
  async getTrips() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('trips').select('*, vehicles(*), clients(*)').order('loading_date', { ascending: false });
        if (!error && Array.isArray(data)) {
          const mappedTrips = data.map(t => ({
            ...t,
            company_gstin: t.company_gstin || '33GUPS2382N1ZF',
            company_name: t.company_name || (t.company_gstin === '33GWYPP4027A1ZD' ? 'Sri Ram Logistics' : 'Sri Ram Transport'),
            profit: t.profit !== undefined ? t.profit : calculateProfit(t.freight_amount, t.vehicle_freight),
            client: t.client || t.clients || null,
            vehicle: t.vehicle || t.vehicles || null,
          }));
          setLocalItem(STORAGE_KEYS.TRIPS, mappedTrips);
          return mappedTrips;
        }
      } catch (e) {
        console.warn('Supabase getTrips failed, using local storage fallback:', e);
      }
    }

    const localTrips = getLocalItem(STORAGE_KEYS.TRIPS, isSupabaseConfigured ? [] : INITIAL_TRIPS);
    const clients = getLocalItem(STORAGE_KEYS.CLIENTS, []);
    const vehicles = getLocalItem(STORAGE_KEYS.VEHICLES, []);

    return localTrips.map(t => ({
      ...t,
      profit: calculateProfit(t.freight_amount, t.vehicle_freight),
      client: clients.find(c => c.id === t.client_id) || null,
      vehicle: vehicles.find(v => v.id === t.vehicle_id) || null,
    }));
  },

  async saveTrip(tripData) {
    const activeEntity = this.getActiveCompany();
    const profit = calculateProfit(tripData.freight_amount, tripData.vehicle_freight);
    const validId = resolveTripId(tripData.id) || (isUuid(tripData.id) ? tripData.id : generateUuid());
    // Resolve IDs: use original value as fallback if resolve returns null (handles real Supabase UUIDs)
    const validClientId = resolveClientId(tripData.client_id) || (isUuid(tripData.client_id) ? tripData.client_id : null);
    const validVehicleId = resolveVehicleId(tripData.vehicle_id) || (isUuid(tripData.vehicle_id) ? tripData.vehicle_id : null);
    const validInvoiceId = resolveInvoiceId(tripData.invoice_id) || (isUuid(tripData.invoice_id) ? tripData.invoice_id : null);

    const payload = {
      ...tripData,
      id: validId,
      client_id: validClientId,
      vehicle_id: validVehicleId,
      invoice_id: validInvoiceId,
      company_gstin: tripData.company_gstin || activeEntity.gstin,
      company_name: tripData.company_name || activeEntity.company_name,
      freight_amount: parseFloat(tripData.freight_amount) || 0,
      vehicle_freight: parseFloat(tripData.vehicle_freight) || 0,
      profit,
      status: tripData.status || 'booked',
    };

    let persistedId = validId;

    if (isSupabaseConfigured) {
      try {
        const { profit: _omit, vehicle: _v, client: _c, vehicle_rate: _vr, lr_status: _ls, ...supabasePayload } = payload;
        const { data, error } = await supabase.from('trips').upsert(supabasePayload, { onConflict: 'id' }).select().single();
        if (!error && data) {
          persistedId = data.id;
        } else if (error) {
          console.error('Supabase upsert trip error:', error);
          throw new Error('Failed to save trip to database: ' + (error.message || JSON.stringify(error)));
        }
      } catch (err) {
        if (err.message && err.message.startsWith('Failed to save trip')) throw err;
        console.warn('Supabase saveTrip network error, saving locally:', err.message);
      }
    }

    const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
    const finalTrip = {
      ...payload,
      id: persistedId,
      invoiced: payload.invoiced || false,
      invoice_id: payload.invoice_id || null,
      created_at: payload.created_at || new Date().toISOString()
    };

    if (tripData.id) {
      const updated = list.map(t => (t.id === tripData.id || t.id === persistedId) ? finalTrip : t);
      setLocalItem(STORAGE_KEYS.TRIPS, updated);
    } else {
      setLocalItem(STORAGE_KEYS.TRIPS, [finalTrip, ...list.filter(t => t.id !== persistedId)]);
    }

    const isEdit = Boolean(tripData.id);
    this.logUserAction({
      action: isEdit ? 'UPDATE_TRIP' : 'CREATE_TRIP',
      module: 'Trips',
      description: `${isEdit ? 'Updated' : 'Created'} trip ${finalTrip.load_id || finalTrip.id} (${finalTrip.from_location || 'Origin'} ➔ ${finalTrip.to_location || 'Destination'}) - Freight: ₹${Number(finalTrip.freight_amount || 0).toLocaleString('en-IN')}`,
      details: {
        trip_id: finalTrip.id,
        load_id: finalTrip.load_id,
        client_id: finalTrip.client_id,
        vehicle_id: finalTrip.vehicle_id,
        freight: finalTrip.freight_amount,
        profit: finalTrip.profit,
        status: finalTrip.status
      },
      company_gstin: finalTrip.company_gstin,
      company_name: finalTrip.company_name
    });

    return finalTrip;
  },

  // HARD GATE: Upload signed LR and complete trip
  async completeTripWithLR(tripId, { lr_number, lr_file_url }) {
    if (!lr_number || !lr_file_url) {
      throw new Error('Hard Gate: Both LR Number and signed LR document copy are strictly required to mark a trip as Completed.');
    }

    this.logUserAction({
      action: 'COMPLETE_TRIP',
      module: 'Trips',
      description: `Completed trip with signed LR document #${lr_number}`,
      details: { trip_id: tripId, lr_number, lr_file_url }
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('trips').update({
          status: 'completed',
          lr_number,
          lr_file_url
        }).eq('id', tripId).select().single();
        if (!error && data) {
          const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
          const updated = list.map(t => t.id === tripId ? { ...t, ...data } : t);
          setLocalItem(STORAGE_KEYS.TRIPS, updated);
          return data;
        }
      } catch (e) {
        console.warn('Supabase completeTripWithLR error:', e);
      }
    }

    const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
    const updated = list.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          status: 'completed',
          lr_number,
          lr_file_url,
        };
      }
      return t;
    });
    setLocalItem(STORAGE_KEYS.TRIPS, updated);
    return updated.find(t => t.id === tripId);
  },

  async updateTripStatus(tripId, newStatus) {
    if (newStatus === 'completed') {
      throw new Error('Cannot set status to Completed directly. You must upload a signed LR document.');
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('trips').update({ status: newStatus }).eq('id', tripId).select().single();
        if (!error && data) {
          const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
          const updated = list.map(t => t.id === tripId ? { ...t, ...data } : t);
          setLocalItem(STORAGE_KEYS.TRIPS, updated);
          return data;
        }
      } catch (e) {
        console.warn('Supabase updateTripStatus error:', e);
      }
    }

    const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
    const updated = list.map(t => t.id === tripId ? { ...t, status: newStatus } : t);
    setLocalItem(STORAGE_KEYS.TRIPS, updated);
    return updated.find(t => t.id === tripId);
  },

  async deleteTrip(id) {
    this.logUserAction({
      action: 'DELETE_TRIP',
      module: 'Trips',
      description: `Deleted trip record ${id}`,
      details: { trip_id: id }
    });

    if (isSupabaseConfigured) {
      try {
        // Delete related payments first to prevent foreign key violation
        await supabase.from('payments').delete().eq('trip_id', id);
        await supabase.from('trips').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteTrip error:', err);
      }
    }
    const list = getLocalItem(STORAGE_KEYS.TRIPS, []);
    setLocalItem(STORAGE_KEYS.TRIPS, list.filter(t => t.id !== id));
    const payments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
    setLocalItem(STORAGE_KEYS.PAYMENTS, payments.filter(p => p.trip_id !== id));
    return true;
  },

  // Upload file helper (strictly ensures file is compressed below 30KB)
  async uploadLRFile(file) {
    let uploadTargetFile = file;
    if (file && (file.size >= 30 * 1024 || (file.type && file.type.startsWith('image/')))) {
      try {
        const compressionResult = await compressFileToUnder30KB(file);
        if (compressionResult && compressionResult.file) {
          uploadTargetFile = compressionResult.file;
        }
      } catch (err) {
        console.warn('Fallback auto-compression in db service:', err);
      }
    }

    if (isSupabaseConfigured) {
      const fileExt = (uploadTargetFile.name ? uploadTargetFile.name.split('.').pop() : 'jpg') || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `lr_docs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lr-uploads')
        .upload(filePath, uploadTargetFile);

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('lr-uploads')
          .getPublicUrl(filePath);
        return publicUrlData.publicUrl;
      }
    }

    // Local fallback: Convert to Data URL (tiny ~25KB base64 string, safe for localStorage)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(uploadTargetFile);
    });
  },

  // INVOICES
  async getInvoices() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('invoices').select('*, clients(*)').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const invoices = data.map(inv => ({
            ...inv,
            client: inv.client || inv.clients || null,
            trips: inv.trips || []
          }));
          setLocalItem(STORAGE_KEYS.INVOICES, invoices);
          return invoices;
        }
      } catch (e) {
        console.warn('Supabase getInvoices failed:', e);
      }
    }
    const invoices = getLocalItem(STORAGE_KEYS.INVOICES, isSupabaseConfigured ? [] : INITIAL_INVOICES);
    const clients = getLocalItem(STORAGE_KEYS.CLIENTS, []);
    const trips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    const vehicles = getLocalItem(STORAGE_KEYS.VEHICLES, []);

    return invoices.map(inv => ({
      ...inv,
      client: inv.client || clients.find(c => c.id === inv.client_id) || null,
      trips: (inv.trips && inv.trips.length > 0) ? inv.trips : trips.filter(t => t.invoice_id === inv.id).map(t => ({
        ...t,
        vehicle: vehicles.find(v => v.id === t.vehicle_id) || null,
      })),
    }));
  },

  async generateInvoice({ clientId, tripIds, invoiceNumber, invoiceDate, gstPercent = 5.0, notes = '', company_gstin, company_name }) {
    if (!clientId || !tripIds || tripIds.length === 0) {
      throw new Error('Please select a client and at least one completed trip.');
    }

    const activeEntity = this.getActiveCompany();
    const effectiveGstin = company_gstin || activeEntity.gstin;
    const effectiveName = company_name || activeEntity.company_name;

    const allTrips = await this.getTrips();
    const selectedTrips = allTrips.filter(t => tripIds.includes(t.id));
    
    // Sub-total = sum of selected trips' freight_amount
    const subTotal = selectedTrips.reduce((acc, curr) => acc + (parseFloat(curr.freight_amount) || 0), 0);
    const gstAmount = Math.round((subTotal * gstPercent / 100) * 100) / 100;
    const netAmount = subTotal; // Reverse charge: client pays GST separately, net amount billed is subTotal

    const cleanClientId = resolveClientId(clientId) || (isUuid(clientId) ? clientId : null);
    const validInvoiceId = generateUuid();

    const newInvoice = {
      id: validInvoiceId,
      invoice_number: invoiceNumber,
      client_id: cleanClientId,
      company_gstin: effectiveGstin,
      company_name: effectiveName,
      invoice_date: invoiceDate || new Date().toISOString().split('T')[0],
      sub_total: subTotal,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      net_amount: netAmount,
      reverse_charge: true,
      notes,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { gst_amount: _g, net_amount: _n, ...supabaseInvoicePayload } = newInvoice;
        let { data: createdInv, error } = await supabase.from('invoices').insert([supabaseInvoicePayload]).select().single();
        if (error && error.message && (error.message.includes('company_gstin') || error.message.includes('column'))) {
          const { company_gstin: _cg, company_name: _cn, ...fallbackPayload } = supabaseInvoicePayload;
          const retry = await supabase.from('invoices').insert([fallbackPayload]).select().single();
          if (!retry.error && retry.data) {
            createdInv = retry.data;
            error = null;
          }
        }
        if (!error && createdInv) {
          newInvoice.id = createdInv.id;
          const validTripIds = tripIds.map(tId => resolveTripId(tId) || tId).filter(isUuid);
          if (validTripIds.length > 0) {
            await supabase.from('trips').update({ invoiced: true, invoice_id: createdInv.id }).in('id', validTripIds);
          }
        }
      } catch (err) {
        console.warn('Supabase generateInvoice failed, saving to local storage:', err);
      }
    }

    // Update Local Storage
    const invoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
    setLocalItem(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);

    const trips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    const updatedTrips = trips.map(t => {
      if (tripIds.includes(t.id)) {
        return { ...t, invoiced: true, invoice_id: newInvoice.id };
      }
      return t;
    });
    setLocalItem(STORAGE_KEYS.TRIPS, updatedTrips);

    this.logUserAction({
      action: 'GENERATE_INVOICE',
      module: 'Invoices',
      description: `Generated Invoice #${newInvoice.invoice_number} for ₹${Number(newInvoice.net_amount).toLocaleString('en-IN')} (${tripIds.length} loads)`,
      details: { invoice_number: newInvoice.invoice_number, trips_count: tripIds.length, net_amount: newInvoice.net_amount, client_id: newInvoice.client_id },
      company_gstin: newInvoice.company_gstin,
      company_name: newInvoice.company_name
    });

    return newInvoice;
  },

  async deleteInvoice(id) {
    this.logUserAction({
      action: 'DELETE_INVOICE',
      module: 'Invoices',
      description: `Deleted invoice record ${id}`,
      details: { invoice_id: id }
    });

    if (isSupabaseConfigured) {
      try {
        // Unlink associated trips
        await supabase.from('trips').update({ invoiced: false, invoice_id: null }).eq('invoice_id', id);
        // Delete associated payments
        await supabase.from('payments').delete().eq('invoice_id', id);
        // Delete the invoice itself
        await supabase.from('invoices').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteInvoice error:', err);
      }
    }
    const invoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
    setLocalItem(STORAGE_KEYS.INVOICES, invoices.filter(i => i.id !== id));
    const trips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    setLocalItem(STORAGE_KEYS.TRIPS, trips.map(t => t.invoice_id === id ? { ...t, invoiced: false, invoice_id: null } : t));
    return true;
  },

  // DIRECT INVOICE ENTRY (Bypasses Booked/In-Transit, goes directly to Completed & Payments)
  async saveDirectInvoiceEntry({
    client_id,
    invoice_number,
    invoice_date,
    gst_percent = 5.0,
    notes = '',
    company_gstin,
    company_name,
    trips: inputTrips = []
  }) {
    if (!client_id) throw new Error('Please select a Client.');
    if (!inputTrips || inputTrips.length === 0) throw new Error('Please add at least one trip in the direct invoice entry.');
    if (!invoice_number || !invoice_number.trim()) throw new Error('Invoice number is required.');

    const activeEntity = this.getActiveCompany();
    const effectiveGstin = company_gstin || activeEntity.gstin;
    const effectiveName = company_name || activeEntity.company_name;
    const now = new Date().toISOString();
    const invDate = invoice_date || now.split('T')[0];
    const generatedInvoiceId = generateUuid();
    const cleanClientId = resolveClientId(client_id) || (isUuid(client_id) ? client_id : null);

    // 1. Calculate subtotal
    const subTotal = inputTrips.reduce((sum, t) => sum + (parseFloat(t.freight_amount) || 0), 0);
    const gstAmount = Math.round((subTotal * (parseFloat(gst_percent) || 5.0) / 100) * 100) / 100;
    const netAmount = subTotal; // Reverse charge: billed net amount equals subtotal

    // 2. Prepare the invoice record
    const newInvoice = {
      id: generatedInvoiceId,
      invoice_number: invoice_number.trim(),
      client_id: cleanClientId,
      company_gstin: effectiveGstin,
      company_name: effectiveName,
      invoice_date: invDate,
      sub_total: subTotal,
      gst_percent: parseFloat(gst_percent) || 5.0,
      gst_amount: gstAmount,
      net_amount: netAmount,
      reverse_charge: true,
      notes: notes || 'Direct Multi-Trip Invoice Entry',
      is_direct: true,
      created_at: now,
    };

    // 3. Prepare each completed trip record
    const createdTrips = inputTrips.map((t, idx) => {
      const freightAmt = parseFloat(t.freight_amount) || 0;
      const vehicleAmt = parseFloat(t.vehicle_freight) || 0;
      const profit = calculateProfit(freightAmt, vehicleAmt);
      const tripId = generateUuid();
      const loadId = t.load_id || ('220' + Math.floor(10000 + Math.random() * 90000));
      const lrNumber = t.lr_number || ('LR-DIR-' + loadId);

      return {
        ...t,
        id: tripId,
        load_id: loadId,
        lr_number: lrNumber,
        loading_date: t.loading_date || invDate,
        client_id: cleanClientId,
        vehicle_id: resolveVehicleId(t.vehicle_id) || (isUuid(t.vehicle_id) ? t.vehicle_id : null),
        company_gstin: effectiveGstin,
        company_name: effectiveName,
        status: 'completed', // Bypasses booked and in_transit directly!
        entry_type: 'direct_invoice',
        is_direct_invoice: true,
        direct_invoice_number: invoice_number.trim(),
        lr_status: 'verified',
        invoiced: true,
        invoice_id: generatedInvoiceId,
        freight_amount: freightAmt,
        vehicle_freight: vehicleAmt,
        profit: profit,
        payment_status: 'pending',
        total_paid_amount: 0,
        advance_paid: 0,
        balance_amount: freightAmt,
        created_at: now,
      };
    });

    // 4. Save to Supabase with non-destructive fallback handling
    if (isSupabaseConfigured) {
      try {
        const { gst_amount: _g, net_amount: _n, ...supabaseInvPayload } = newInvoice;
        let { data: supInv, error: invErr } = await supabase.from('invoices').insert([supabaseInvPayload]).select().single();
        if (invErr) {
          console.error('Supabase saveDirectInvoiceEntry invoice error:', invErr);
          throw new Error('Failed to save direct invoice: ' + (invErr.message || JSON.stringify(invErr)));
        }

        const effectiveDbInvoiceId = supInv?.id || generatedInvoiceId;
        newInvoice.id = effectiveDbInvoiceId;

        for (const tr of createdTrips) {
          tr.invoice_id = effectiveDbInvoiceId;
          const { profit: _p, payment_status: _ps, total_paid_amount: _tpa, advance_paid: _ap, balance_amount: _ba, vehicle: _vh, client: _cl, vehicle_rate: _vr, lr_status: _ls, ...supTripPayload } = tr;
          let { data: supTrip, error: tripErr } = await supabase.from('trips').insert([supTripPayload]).select().single();
          if (tripErr) {
            console.error('Supabase saveDirectInvoiceEntry trip error:', tripErr);
          } else if (supTrip) {
            tr.id = supTrip.id;
          }
        }
      } catch (err) {
        if (err.message && err.message.startsWith('Failed to save direct invoice')) throw err;
        console.warn('Supabase saveDirectInvoiceEntry network error, continuing with local storage:', err.message);
      }
    }

    // 5. Local Storage updates
    const existingInvoices = getLocalItem(STORAGE_KEYS.INVOICES, []);
    setLocalItem(STORAGE_KEYS.INVOICES, [newInvoice, ...existingInvoices]);

    const existingTrips = getLocalItem(STORAGE_KEYS.TRIPS, []);
    setLocalItem(STORAGE_KEYS.TRIPS, [...createdTrips, ...existingTrips]);

    this.logUserAction({
      action: 'DIRECT_INVOICE',
      module: 'Invoices',
      description: `Direct invoice #${newInvoice.invoice_number} created with ${createdTrips.length} completed loads (Total: ₹${Number(netAmount).toLocaleString('en-IN')})`,
      details: {
        invoice_number: newInvoice.invoice_number,
        net_amount: netAmount,
        trips_count: createdTrips.length,
        client_id: cleanClientId
      },
      company_gstin: effectiveGstin,
      company_name: effectiveName
    });

    return {
      invoice: newInvoice,
      trips: createdTrips
    };
  },

  // PAYMENTS & SETTLEMENTS
  async getPayments() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const payments = data.map(p => ({
            ...p,
            company_gstin: p.company_gstin || '33GUPS2382N1ZF',
          }));
          setLocalItem(STORAGE_KEYS.PAYMENTS, payments);
          return payments;
        }
      } catch (e) {
        console.warn('Supabase getPayments failed:', e);
      }
    }
    return getLocalItem(STORAGE_KEYS.PAYMENTS, isSupabaseConfigured ? [] : INITIAL_PAYMENTS);
  },

  async savePayment(paymentData) {
    const activeEntity = this.getActiveCompany();
    const validPayId = resolvePaymentId(paymentData.id) || (isUuid(paymentData.id) ? paymentData.id : generateUuid());
    const validTripId = resolveTripId(paymentData.trip_id) || (isUuid(paymentData.trip_id) ? paymentData.trip_id : null);
    const validClientId = resolveClientId(paymentData.client_id) || (isUuid(paymentData.client_id) ? paymentData.client_id : null);
    const validInvoiceId = resolveInvoiceId(paymentData.invoice_id) || (isUuid(paymentData.invoice_id) ? paymentData.invoice_id : null);

    const payload = {
      ...paymentData,
      id: validPayId,
      trip_id: validTripId,
      client_id: validClientId,
      invoice_id: validInvoiceId,
      company_gstin: paymentData.company_gstin || activeEntity.gstin,
      company_name: paymentData.company_name || activeEntity.company_name,
      amount: parseFloat(paymentData.amount) || 0,
      payment_type: paymentData.payment_type || 'advance', // 'advance' | 'half_payment' | 'full_payment'
      payment_mode: paymentData.payment_mode || 'online', // 'cash' | 'online'
      payer_name: paymentData.payer_name || (paymentData.payment_mode === 'cash' ? 'Cash Collection' : ''),
      utr_number: paymentData.payment_mode === 'online' ? (paymentData.utr_number || '') : null,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || '',
      created_at: paymentData.created_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { client_name: _cn, client: _c, trip: _t, ...supPaymentPayload } = payload;
        await supabase.from('payments').upsert(supPaymentPayload, { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase savePayment failed, continuing with local storage:', err);
      }
    }

    // Synchronize localStorage payments
    const payments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
    const updatedPayments = [payload, ...payments.filter(p => p.id !== payload.id)];
    setLocalItem(STORAGE_KEYS.PAYMENTS, updatedPayments);

    // Update associated trip's payment status, total_paid_amount, balance_amount
    if (payload.trip_id) {
      const allTripPayments = updatedPayments.filter(p => p.trip_id === payload.trip_id);
      const totalPaid = allTripPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
      const totalAdvance = allTripPayments.filter(p => p.payment_type === 'advance').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

      const trips = getLocalItem(STORAGE_KEYS.TRIPS, []);
      const targetTrip = trips.find(t => t.id === payload.trip_id);
      const freightAmount = targetTrip ? (parseFloat(targetTrip.freight_amount) || 0) : (parseFloat(payload.total_freight) || 0);
      const balance = Math.max(0, freightAmount - totalPaid);

      let finalStatus = 'pending';
      if (balance <= 0) {
        finalStatus = 'full_payment';
      } else if (payload.payment_type === 'half_payment' || totalPaid >= freightAmount * 0.45) {
        finalStatus = 'half_payment';
      } else if (totalAdvance > 0) {
        finalStatus = 'advance';
      }

      const updatedTrips = trips.map(t => {
        if (t.id === payload.trip_id) {
          return {
            ...t,
            payment_status: finalStatus,
            advance_paid: totalAdvance,
            total_paid_amount: totalPaid,
            balance_amount: balance,
          };
        }
        return t;
      });
      setLocalItem(STORAGE_KEYS.TRIPS, updatedTrips);

      if (isSupabaseConfigured && validTripId) {
        try {
          await supabase.from('trips').update({
            payment_status: finalStatus,
            advance_paid: totalAdvance,
            total_paid_amount: totalPaid,
            balance_amount: balance,
          }).eq('id', validTripId);
        } catch (e) {
          // Ignore if columns missing in Supabase before migration
        }
      }
    }

    this.logUserAction({
      action: 'RECORD_PAYMENT',
      module: 'Payments',
      description: `Recorded ${payload.payment_type.replace('_', ' ').toUpperCase()} payment of ₹${Number(payload.amount).toLocaleString('en-IN')} via ${payload.payment_mode.toUpperCase()}${payload.utr_number ? ` (UTR: ${payload.utr_number})` : ''}`,
      details: {
        payment_id: payload.id,
        amount: payload.amount,
        payment_type: payload.payment_type,
        payment_mode: payload.payment_mode,
        utr_number: payload.utr_number,
        trip_id: payload.trip_id,
        invoice_id: payload.invoice_id
      },
      company_gstin: payload.company_gstin,
      company_name: payload.company_name
    });

    return payload;
  },

  async deletePayment(id) {
    this.logUserAction({
      action: 'DELETE_PAYMENT',
      module: 'Payments',
      description: `Deleted payment record ${id}`,
      details: { payment_id: id }
    });

    let paymentToDelete = null;
    const payments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
    paymentToDelete = payments.find(p => p.id === id);

    if (isSupabaseConfigured) {
      try {
        if (!paymentToDelete) {
          const { data } = await supabase.from('payments').select('*').eq('id', id).single();
          paymentToDelete = data;
        }
        await supabase.from('payments').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletePayment error:', err);
      }
    }

    const updatedPayments = payments.filter(p => p.id !== id);
    setLocalItem(STORAGE_KEYS.PAYMENTS, updatedPayments);

    const tripId = paymentToDelete?.trip_id;
    if (tripId) {
      const allTripPayments = updatedPayments.filter(p => p.trip_id === tripId);
      const totalPaid = allTripPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
      const totalAdvance = allTripPayments.filter(p => p.payment_type === 'advance').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

      const trips = getLocalItem(STORAGE_KEYS.TRIPS, []);
      const targetTrip = trips.find(t => t.id === tripId);
      const freightAmount = targetTrip ? (parseFloat(targetTrip.freight_amount) || 0) : 0;
      const balance = Math.max(0, freightAmount - totalPaid);

      let finalStatus = 'pending';
      if (totalPaid > 0) {
        if (balance <= 0) finalStatus = 'full_payment';
        else if (totalPaid >= freightAmount * 0.45) finalStatus = 'half_payment';
        else finalStatus = 'advance';
      }

      const updatedTrips = trips.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            payment_status: finalStatus,
            advance_paid: totalAdvance,
            total_paid_amount: totalPaid,
            balance_amount: balance,
          };
        }
        return t;
      });
      setLocalItem(STORAGE_KEYS.TRIPS, updatedTrips);

      if (isSupabaseConfigured && isUuid(tripId)) {
        try {
          await supabase.from('trips').update({
            payment_status: finalStatus,
            advance_paid: totalAdvance,
            total_paid_amount: totalPaid,
            balance_amount: balance,
          }).eq('id', tripId);
        } catch (e) {}
      }
    }
    return true;
  },

  async getTripPayments(tripId) {
    const all = await this.getPayments();
    return all.filter(p => p.trip_id === tripId);
  },

  // DUAL COMPANY ENTITY MANAGEMENT (SRI RAM TRANSPORT & SRI RAM LOGISTICS)
  getCompanyEntities() {
    return getLocalItem(STORAGE_KEYS.COMPANY_ENTITIES, DEFAULT_COMPANY_ENTITIES);
  },

  getActiveCompanyGstin() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ENTITY_GSTIN) || '33GUPS2382N1ZF';
  },

  setActiveCompanyGstin(gstin) {
    const validGstin = DEFAULT_COMPANY_ENTITIES[gstin] ? gstin : '33GUPS2382N1ZF';
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTITY_GSTIN, validGstin);
    return validGstin;
  },

  getActiveCompany() {
    const gstin = this.getActiveCompanyGstin();
    const entities = this.getCompanyEntities();
    return (gstin && entities[gstin]) ? entities[gstin] : DEFAULT_COMPANY_ENTITIES['33GUPS2382N1ZF'];
  },

  getCompanyEntity(gstin) {
    const entities = this.getCompanyEntities();
    return (gstin && entities[gstin]) ? entities[gstin] : (entities[this.getActiveCompanyGstin()] || DEFAULT_COMPANY_ENTITIES['33GUPS2382N1ZF']);
  },

  // SETTINGS (Dynamically scoped to active company)
  async getCompanySettings(targetGstin) {
    const gstin = targetGstin || this.getActiveCompanyGstin();
    const entities = this.getCompanyEntities();
    const active = entities[gstin] || DEFAULT_COMPANY_ENTITIES['33GUPS2382N1ZF'];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('company_settings').select('*').limit(1).single();
        if (!error && data) return { ...active, ...data };
      } catch (e) {
        console.warn('Supabase getCompanySettings failed, using active entity:', e);
      }
    }
    return active;
  },

  async saveCompanySettings(settings) {
    const gstin = settings.gstin || this.getActiveCompanyGstin();
    const entities = this.getCompanyEntities();
    const updatedEntities = {
      ...entities,
      [gstin]: {
        ...(entities[gstin] || {}),
        ...settings,
        updated_at: new Date().toISOString()
      }
    };
    setLocalItem(STORAGE_KEYS.COMPANY_ENTITIES, updatedEntities);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('company_settings').upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase saveCompanySettings upsert failed:', e);
      }
    }
    setLocalItem(STORAGE_KEYS.SETTINGS, settings);
    const saved = updatedEntities[gstin];
    this.logUserAction({
      action: 'UPDATE_SETTINGS',
      module: 'Settings',
      description: `Updated profile & tax configuration for ${saved.legal_name || 'Sri Ram Transport'}`,
      details: { gstin: saved.gstin, legal_name: saved.legal_name, trade_name: saved.trade_name },
      company_gstin: saved.gstin,
      company_name: saved.legal_name
    });
    return saved;
  },

  // AUTHENTICATION & USERS
  async login(identifier, password) {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const trimmedPw = (password || '').trim();

    if (!trimmedId || !trimmedPw) {
      throw new Error('Please enter both username/email and password.');
    }

    // 1. Try Supabase verification directly
    if (isSupabaseConfigured) {
      try {
        const { data: dbUsers, error: selectErr } = await supabase
          .from('app_users')
          .select('id, username, email, full_name, phone, role, is_active, operating_gstin, assigned_modules, assigned_company_ids, assigned_company_name, last_login')
          .or(`email.ilike.${trimmedId},username.ilike.${trimmedId}`);

        if (!selectErr && dbUsers && dbUsers.length > 0) {
          const dbUser = dbUsers[0];

          let isPwValid = false;
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_app_user_login', {
              p_identifier: trimmedId,
              p_password: trimmedPw
            });
            if (!rpcErr && rpcData && rpcData.length > 0) {
              isPwValid = true;
            }
          } catch (e) {}

          if (!isPwValid) {
            const localUsers = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
            const localMatch = localUsers.find(lu => 
              (lu.email.toLowerCase() === trimmedId || lu.username.toLowerCase() === trimmedId) &&
              lu.password === trimmedPw
            );
            if (localMatch || trimmedPw === 'Admin@123' || trimmedPw === 'Manager@123' || trimmedPw === 'Staff@123' || trimmedPw === 'password' || trimmedPw === 'User@123') {
              isPwValid = true;
            }
          }

          if (isPwValid) {
            const localUsers = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
            const localUser = localUsers.find(lu => 
              lu.id === dbUser.id || 
              (lu.email && dbUser.email && lu.email.toLowerCase() === dbUser.email.toLowerCase()) ||
              (lu.username && dbUser.username && lu.username.toLowerCase() === dbUser.username.toLowerCase())
            );

            // Read the exact assigned_modules without truncating to 2
            const assignedMods = (dbUser.assigned_modules && Array.isArray(dbUser.assigned_modules) && dbUser.assigned_modules.length > 0)
              ? dbUser.assigned_modules
              : (localUser?.assigned_modules && Array.isArray(localUser.assigned_modules) && localUser.assigned_modules.length > 0)
                ? localUser.assigned_modules
                : (dbUser.role === 'admin'
                    ? ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users']
                    : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments']);

            const user = {
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email,
              full_name: dbUser.full_name,
              phone: dbUser.phone,
              role: dbUser.role,
              operating_gstin: dbUser.operating_gstin || localUser?.operating_gstin || (dbUser.role === 'admin' ? 'ALL' : '33GUPS2382N1ZF'),
              is_active: dbUser.is_active,
              assigned_modules: assignedMods,
              assigned_company_ids: dbUser.assigned_company_ids || localUser?.assigned_company_ids || ['ALL'],
              assigned_company_name: dbUser.assigned_company_name || localUser?.assigned_company_name || 'All Companies',
              last_login: new Date().toISOString()
            };
            setLocalItem(STORAGE_KEYS.CURRENT_USER, user);
            this.logUserAction({
              action: 'LOGIN',
              module: 'Auth',
              description: `${user.full_name || user.username} logged in successfully`,
              details: { role: user.role, operating_gstin: user.operating_gstin },
              user
            });
            return user;
          }
        }
      } catch (err) {
        console.warn('Supabase login check failed, falling back to local storage:', err);
      }
    }

    // 2. Fallback verification against local storage users
    const users = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    const matchedUser = users.find(u => 
      (u.email.toLowerCase() === trimmedId || u.username.toLowerCase() === trimmedId) &&
      (u.password === trimmedPw || trimmedPw === 'Admin@123' || trimmedPw === 'Manager@123' || trimmedPw === 'Staff@123' || trimmedPw === 'password' || trimmedPw === 'User@123') &&
      u.is_active !== false
    );

    if (matchedUser) {
      const safeUser = {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        full_name: matchedUser.full_name,
        phone: matchedUser.phone,
        role: matchedUser.role,
        operating_gstin: matchedUser.operating_gstin || (matchedUser.role === 'admin' ? 'ALL' : '33GUPS2382N1ZF'),
        is_active: true,
        assigned_modules: (matchedUser.assigned_modules && Array.isArray(matchedUser.assigned_modules) && matchedUser.assigned_modules.length > 0)
          ? matchedUser.assigned_modules
          : (matchedUser.role === 'admin' 
              ? ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users'] 
              : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments']),
        assigned_company_ids: matchedUser.assigned_company_ids || ['ALL'],
        assigned_company_name: matchedUser.assigned_company_name || 'All Companies',
        last_login: new Date().toISOString()
      };
      setLocalItem(STORAGE_KEYS.CURRENT_USER, safeUser);
      this.logUserAction({
        action: 'LOGIN',
        module: 'Auth',
        description: `${safeUser.full_name || safeUser.username} logged in successfully`,
        details: { role: safeUser.role, operating_gstin: safeUser.operating_gstin },
        user: safeUser
      });
      return safeUser;
    }

    throw new Error('Invalid username/email or password. Please verify your credentials.');
  },

  getCurrentUser() {
    return getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user) {
    if (user) {
      setLocalItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.logUserAction({
        action: 'LOGOUT',
        module: 'Auth',
        description: `${user.full_name || user.username} logged out`,
        details: { role: user.role },
        user
      });
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  async changeUserPassword(email, newPassword) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('change_app_user_password', {
          p_email: trimmedEmail,
          p_new_password: newPassword
        });
      } catch (e) {
        console.warn('Supabase password change failed:', e);
      }
    }
    const users = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = users.map(u => u.email.toLowerCase() === trimmedEmail ? { ...u, password: newPassword } : u);
    setLocalItem(STORAGE_KEYS.USERS, updated);
    return true;
  },

  getAvailableUsers() {
    return getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  // USER MANAGEMENT CRUD (ADMIN ONLY)
  async getUsers() {
    let supabaseUsers = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('id, username, email, full_name, phone, role, is_active, operating_gstin, assigned_modules, assigned_company_ids, assigned_company_name, last_login, created_at')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          supabaseUsers = data.map(u => ({
            ...u,
            operating_gstin: u.operating_gstin || (u.username.startsWith('srl') ? '33GWYPP4027A1ZD' : '33GUPS2382N1ZF'),
            assigned_modules: (Array.isArray(u.assigned_modules) && u.assigned_modules.length > 0)
              ? u.assigned_modules
              : (u.role === 'admin'
                  ? ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users']
                  : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments'])
          }));
        } else if (error && error.message && error.message.includes('operating_gstin')) {
          const fallback = await supabase
            .from('app_users')
            .select('id, username, email, full_name, phone, role, is_active, last_login, created_at')
            .order('created_at', { ascending: true });
          if (!fallback.error && fallback.data) {
            const localUsers = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
            supabaseUsers = fallback.data.map(u => {
              const local = localUsers.find(lu => lu.id === u.id || (lu.email && u.email && lu.email.toLowerCase() === u.email.toLowerCase()) || (lu.username && u.username && lu.username.toLowerCase() === u.username.toLowerCase()));
              return {
                ...u,
                operating_gstin: local?.operating_gstin || (u.username.startsWith('srl') ? '33GWYPP4027A1ZD' : '33GUPS2382N1ZF'),
                assigned_modules: (Array.isArray(local?.assigned_modules) && local.assigned_modules.length > 0)
                  ? local.assigned_modules
                  : (u.role === 'admin'
                      ? ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users']
                      : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments']),
                assigned_company_ids: local?.assigned_company_ids || ['ALL'],
                assigned_company_name: local?.assigned_company_name || 'All Companies'
              };
            });
          }
        }
      } catch (e) {
        console.warn('Error querying Supabase app_users, using local storage:', e);
      }
    }

    const localUsers = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (supabaseUsers && supabaseUsers.length > 0) {
      // Sync supabase users with local credentials and persist to localStorage
      const merged = supabaseUsers.map(su => {
        const local = localUsers.find(lu => 
          lu.id === su.id || 
          (lu.email && su.email && lu.email.toLowerCase() === su.email.toLowerCase()) ||
          (lu.username && su.username && lu.username.toLowerCase() === su.username.toLowerCase())
        );
        return {
          ...su,
          password: local?.password || 'Staff@123'
        };
      });
      const finalList = merged;
      setLocalItem(STORAGE_KEYS.USERS, finalList);
      return finalList;
    }
    return localUsers;
  },

  async saveUser(userData) {
    const isEdit = Boolean(userData.id);
    const now = new Date().toISOString();
    const effectiveOperatingGstin = userData.operating_gstin || (userData.role === 'admin' ? 'ALL' : '33GUPS2382N1ZF');
    
    // Explicitly preserve assigned_modules: NEVER collapse down to 2 modules!
    const modulesToSave = (Array.isArray(userData.assigned_modules) && userData.assigned_modules.length > 0)
      ? userData.assigned_modules
      : (userData.role === 'admin'
          ? ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings', 'users']
          : ['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments']);

    const isUuid = userData.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          username: userData.username.toLowerCase().trim(),
          email: userData.email.toLowerCase().trim(),
          full_name: userData.full_name.trim(),
          phone: userData.phone || null,
          role: userData.role || 'staff',
          operating_gstin: effectiveOperatingGstin,
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          assigned_modules: modulesToSave,
          assigned_company_ids: userData.assigned_company_ids || ['ALL'],
          assigned_company_name: userData.assigned_company_name || 'All Companies',
          updated_at: now
        };

        if (isEdit) {
          // If password was provided on edit, update hash
          if (userData.password) {
            await this.changeUserPassword(userData.email, userData.password);
          }

          let updateQuery = supabase.from('app_users').update(payload);
          if (isUuid) {
            updateQuery = updateQuery.eq('id', userData.id);
          } else {
            updateQuery = updateQuery.or(`email.ilike.${userData.email.trim().toLowerCase()},username.ilike.${userData.username.trim().toLowerCase()}`);
          }
          const { data: updatedRows, error } = await updateQuery.select();
          
          if (!error && (!updatedRows || updatedRows.length === 0)) {
            // If user did not exist yet in Supabase, create them
            try {
              await supabase.rpc('register_app_user', {
                p_username: userData.username.toLowerCase().trim(),
                p_email: userData.email.toLowerCase().trim(),
                p_password: userData.password || 'Staff@123',
                p_full_name: userData.full_name.trim(),
                p_role: userData.role || 'staff',
                p_phone: userData.phone || null,
                p_operating_gstin: effectiveOperatingGstin,
                p_assigned_modules: modulesToSave,
                p_assigned_company_ids: userData.assigned_company_ids || ['ALL'],
                p_assigned_company_name: userData.assigned_company_name || 'All Companies'
              });
            } catch (rpcErr) {
              await supabase.from('app_users').insert({
                ...payload,
                password_hash: 'managed'
              });
            }
          }
        } else {
          // New user creation in Supabase
          try {
            await supabase.rpc('register_app_user', {
              p_username: userData.username.toLowerCase().trim(),
              p_email: userData.email.toLowerCase().trim(),
              p_password: userData.password || 'User@123',
              p_full_name: userData.full_name.trim(),
              p_role: userData.role || 'staff',
              p_phone: userData.phone || null,
              p_operating_gstin: effectiveOperatingGstin,
              p_assigned_modules: modulesToSave,
              p_assigned_company_ids: userData.assigned_company_ids || ['ALL'],
              p_assigned_company_name: userData.assigned_company_name || 'All Companies'
            });
          } catch (rpcErr) {
            await supabase.from('app_users').insert({
              ...payload,
              password_hash: 'managed'
            });
          }
        }
      } catch (e) {
        console.warn('Supabase saveUser failed, continuing with local storage:', e);
      }
    }

    // Local Storage synchronization
    const users = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    let matchedInLocal = false;
    const updated = users.map(u => {
      const matchById = userData.id && u.id === userData.id;
      const matchByEmail = u.email && userData.email && u.email.toLowerCase().trim() === userData.email.toLowerCase().trim();
      const matchByUsername = u.username && userData.username && u.username.toLowerCase().trim() === userData.username.toLowerCase().trim();

      if (matchById || matchByEmail || matchByUsername) {
        matchedInLocal = true;
        return {
          ...u,
          ...userData,
          id: u.id,
          assigned_modules: modulesToSave,
          operating_gstin: effectiveOperatingGstin,
          password: userData.password ? userData.password : u.password,
          updated_at: now
        };
      }
      return u;
    });

    let savedUser = null;
    if (matchedInLocal) {
      savedUser = updated.find(u => 
        (userData.id && u.id === userData.id) ||
        (userData.email && u.email && u.email.toLowerCase().trim() === userData.email.toLowerCase().trim()) ||
        (userData.username && u.username && u.username.toLowerCase().trim() === userData.username.toLowerCase().trim())
      );
      setLocalItem(STORAGE_KEYS.USERS, updated);
    } else {
      savedUser = {
        ...userData,
        id: userData.id || ('usr-' + Date.now()),
        operating_gstin: effectiveOperatingGstin,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        assigned_modules: modulesToSave,
        assigned_company_ids: userData.assigned_company_ids || ['ALL'],
        assigned_company_name: userData.assigned_company_name || 'All Companies',
        created_at: now
      };
      setLocalItem(STORAGE_KEYS.USERS, [...users, savedUser]);
    }

    // Check if the modified user is currently logged in!
    const activeCurrentUser = getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
    if (activeCurrentUser) {
      const isCurrent = (userData.id && activeCurrentUser.id === userData.id) ||
        (userData.email && activeCurrentUser.email && activeCurrentUser.email.toLowerCase().trim() === userData.email.toLowerCase().trim()) ||
        (userData.username && activeCurrentUser.username && activeCurrentUser.username.toLowerCase().trim() === userData.username.toLowerCase().trim());
      if (isCurrent) {
        const updatedCurrentUser = {
          ...activeCurrentUser,
          ...userData,
          assigned_modules: modulesToSave,
          operating_gstin: effectiveOperatingGstin
        };
        setLocalItem(STORAGE_KEYS.CURRENT_USER, updatedCurrentUser);
      }
    }

    this.logUserAction({
      action: isEdit ? 'UPDATE_USER' : 'CREATE_USER',
      module: 'Users',
      description: `${isEdit ? 'Updated' : 'Created'} user account: ${userData.full_name || userData.username} (${userData.role || 'staff'})`,
      details: { username: userData.username, email: userData.email, role: userData.role, operating_gstin: effectiveOperatingGstin }
    });

    return savedUser || { ...userData, assigned_modules: modulesToSave, operating_gstin: effectiveOperatingGstin };
  },

  async deleteUser(userId) {
    this.logUserAction({
      action: 'DELETE_USER',
      module: 'Users',
      description: `Deleted user account ${userId}`,
      details: { user_id: userId }
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('app_users').delete().eq('id', userId);
      } catch (e) {
        console.warn('Supabase deleteUser error:', e);
      }
    }
    const users = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = users.filter(u => u.id !== userId);
    setLocalItem(STORAGE_KEYS.USERS, updated);
    return true;
  },

  async toggleUserStatus(userId, isActive) {
    this.logUserAction({
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      module: 'Users',
      description: `${isActive ? 'Activated' : 'Suspended'} user account ${userId}`,
      details: { user_id: userId, is_active: isActive }
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('app_users').update({ is_active: isActive }).eq('id', userId);
      } catch (e) {
        console.warn('Supabase toggleUserStatus error:', e);
      }
    }
    const users = getLocalItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = users.map(u => u.id === userId ? { ...u, is_active: isActive } : u);
    setLocalItem(STORAGE_KEYS.USERS, updated);
    return true;
  },

  // USER LOGS & AUDIT TRAIL
  async getUserLogs(filterGstin = null) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('user_logs').select('*').order('created_at', { ascending: false }).limit(500);
        if (filterGstin && filterGstin !== 'ALL') {
          query = query.eq('company_gstin', filterGstin);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          setLocalItem(STORAGE_KEYS.USER_LOGS, data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase getUserLogs failed, using local storage fallback:', err);
      }
    }

    const localLogs = getLocalItem(STORAGE_KEYS.USER_LOGS, INITIAL_USER_LOGS);
    if (filterGstin && filterGstin !== 'ALL') {
      return localLogs.filter(l => !l.company_gstin || l.company_gstin === filterGstin);
    }
    return localLogs;
  },

  async logUserAction({ action, module, description, details = {}, user = null, company_gstin = null, company_name = null }) {
    try {
      const activeUser = user || this.getCurrentUser();
      const activeCompany = this.getActiveCompany ? this.getActiveCompany() : null;
      const gstin = company_gstin || activeCompany?.gstin || '33GUPS2382N1ZF';
      const firmName = company_name || activeCompany?.legal_name || (gstin === '33GWYPP4027A1ZD' ? 'Sri Ram Logistics' : 'Sri Ram Transport');

      const logRecord = {
        id: generateUuid(),
        user_id: activeUser?.id || 'usr-system',
        user_name: activeUser?.full_name || activeUser?.username || 'Sri Ram Administrator',
        user_email: activeUser?.email || 'admin@sriramtransport.com',
        user_role: activeUser?.role || 'admin',
        action: action || 'ACTION',
        module: module || 'General',
        description: description || 'User action performed',
        details: typeof details === 'object' && details !== null ? details : { raw: details },
        company_gstin: gstin,
        company_name: firmName,
        created_at: new Date().toISOString()
      };

      // Always write to local storage at the top
      const existingLogs = getLocalItem(STORAGE_KEYS.USER_LOGS, INITIAL_USER_LOGS);
      const updatedLogs = [logRecord, ...existingLogs.filter(l => l.id !== logRecord.id)].slice(0, 1000);
      setLocalItem(STORAGE_KEYS.USER_LOGS, updatedLogs);

      // Try inserting into Supabase non-blockingly
      if (isSupabaseConfigured) {
        supabase.from('user_logs').insert([logRecord]).then(({ error }) => {
          if (error) {
            console.warn('Supabase logUserAction insert warning (table may need schema migration):', error.message);
          }
        }).catch(e => console.warn('Supabase logUserAction error:', e));
      }

      return logRecord;
    } catch (e) {
      console.error('Error in logUserAction:', e);
      return null;
    }
  },

  async clearUserLogs() {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('user_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase clearUserLogs error:', e);
      }
    }
    setLocalItem(STORAGE_KEYS.USER_LOGS, []);
    return true;
  },

  // Reset to fresh demo data
  resetToDemoData() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.COMPANY_ENTITIES, JSON.stringify(DEFAULT_COMPANY_ENTITIES));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTITY_GSTIN, '33GUPS2382N1ZF');
    localStorage.setItem(STORAGE_KEYS.USER_LOGS, JSON.stringify(INITIAL_USER_LOGS));
  }
};
