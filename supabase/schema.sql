-- ==============================================================================
-- SRI RAM TRANSPORT & SRI RAM LOGISTICS: DUAL-GST MULTI-TENANT SCHEMA
-- Operating Firm 1: Sri Ram Transport (GSTIN: 33GUPS2382N1ZF)
-- Operating Firm 2: Sri Ram Logistics (GSTIN: 33GWYPP4027A1ZD)
-- ==============================================================================
-- This file contains:
--   SECTION 1: 1-CLICK INSTANT MIGRATION SCRIPT (For existing Supabase projects)
--   SECTION 2: FULL SCHEMA DEFINITION (For fresh database setups)
--   SECTION 3: DIRECT SQL CHEATSHEET (Add user, change password, assign GST)
-- ==============================================================================

-- ##############################################################################
-- SECTION 1: 1-CLICK INSTANT MIGRATION SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO UPGRADE YOUR EXISTING DATABASE!
-- It adds all required multi-GST isolation columns, indexes, and procedures safely.
-- ##############################################################################

-- 1. Ensure required cryptographic extensions are active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add Multi-GST Isolation & Direct Invoice Columns to Existing Tables (Non-Destructive)
ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS company_gstin text DEFAULT '33GUPS2382N1ZF',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'Sri Ram Transport',
  ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_direct_invoice boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_invoice_number text;

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS company_gstin text DEFAULT '33GUPS2382N1ZF',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'Sri Ram Transport';

ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS company_gstin text DEFAULT '33GUPS2382N1ZF',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'Sri Ram Transport';

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS company_gstin text DEFAULT '33GUPS2382N1ZF',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'Sri Ram Transport',
  ADD COLUMN IF NOT EXISTS is_direct boolean DEFAULT false;

ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS operating_gstin text DEFAULT '33GUPS2382N1ZF',
  ADD COLUMN IF NOT EXISTS assigned_modules text[] DEFAULT ARRAY['new-trip', 'direct-invoice', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings'],
  ADD COLUMN IF NOT EXISTS assigned_company_ids text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS assigned_company_name text DEFAULT 'All Companies';

-- 3. Create Multi-GST High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_trips_company_gstin ON trips(company_gstin);
CREATE INDEX IF NOT EXISTS idx_clients_company_gstin ON clients(company_gstin);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_gstin ON vehicles(company_gstin);
CREATE INDEX IF NOT EXISTS idx_invoices_company_gstin ON invoices(company_gstin);
CREATE INDEX IF NOT EXISTS idx_app_users_operating_gstin ON app_users(operating_gstin);

-- 4. Stored Procedure: Register New User with Bcrypt Hashing and Strict GST Assignment
DROP FUNCTION IF EXISTS register_app_user(text, text, text, text, text, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS register_app_user(text, text, text, text, text, text, text[], text[], text[], text);

CREATE OR REPLACE FUNCTION register_app_user(
  p_username text,
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'staff',
  p_phone text DEFAULT NULL,
  p_assigned_modules text[] DEFAULT ARRAY['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'settings'],
  p_assigned_company_ids text[] DEFAULT ARRAY[]::text[],
  p_assigned_company_name text DEFAULT 'All Companies',
  p_operating_gstin text DEFAULT '33GUPS2382N1ZF'
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO app_users (
    username, email, password_hash, full_name, role, phone, 
    assigned_modules, assigned_company_ids, assigned_company_name, operating_gstin
  )
  VALUES (
    lower(trim(p_username)),
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 10)),
    p_full_name,
    p_role,
    p_phone,
    p_assigned_modules,
    p_assigned_company_ids,
    p_assigned_company_name,
    p_operating_gstin
  )
  RETURNING id INTO v_user_id;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored Procedure: Change User Password
DROP FUNCTION IF EXISTS change_app_user_password(text, text);

CREATE OR REPLACE FUNCTION change_app_user_password(
  p_email text,
  p_new_password text
) RETURNS boolean AS $$
BEGIN
  UPDATE app_users
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf', 10)),
    updated_at = now()
  WHERE lower(email) = lower(trim(p_email));
  
  RETURN found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Stored Procedure: Authenticate User Login & Return Active GST Scope
DROP FUNCTION IF EXISTS verify_app_user_login(text, text);

CREATE OR REPLACE FUNCTION verify_app_user_login(
  p_identifier text,
  p_password text
) RETURNS TABLE (
  id uuid,
  username text,
  email text,
  full_name text,   
  role text,
  is_active boolean,
  assigned_modules text[],
  assigned_company_ids text[],
  assigned_company_name text,
  operating_gstin text
) AS $$
BEGIN
  UPDATE app_users au
  SET last_login = now()
  WHERE (lower(au.email) = lower(trim(p_identifier)) or lower(au.username) = lower(trim(p_identifier)))
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;

  RETURN QUERY
  SELECT 
    u.id, 
    u.username, 
    u.email, 
    u.full_name, 
    u.role, 
    u.is_active,
    COALESCE(u.assigned_modules, ARRAY['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'payments', 'settings'])::text[],
    COALESCE(u.assigned_company_ids, ARRAY[]::text[])::text[],
    COALESCE(u.assigned_company_name, 'All Companies')::text,
    COALESCE(u.operating_gstin, '33GUPS2382N1ZF')::text
  FROM app_users u
  WHERE (lower(u.email) = lower(trim(p_identifier)) or lower(u.username) = lower(trim(p_identifier)))
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure RLS Policies Permit Full Multi-GST Operational Access
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access on app_users" ON app_users;
CREATE POLICY "Enable all access on app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access on company_settings" ON company_settings;
CREATE POLICY "Enable all access on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access on clients" ON clients;
CREATE POLICY "Enable all access on clients" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access on vehicles" ON vehicles;
CREATE POLICY "Enable all access on vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access on invoices" ON invoices;
CREATE POLICY "Enable all access on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access on trips" ON trips;
CREATE POLICY "Enable all access on trips" ON trips FOR ALL USING (true) WITH CHECK (true);

-- 8. Seed Initial Dedicated Accounts for Sri Ram Transport & Sri Ram Logistics
-- Sri Ram Transport Accounts (GSTIN: 33GUPS2382N1ZF)
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, operating_gstin)
VALUES 
  ('admin', 'admin@sriramtransport.com', crypt('Admin@123', gen_salt('bf', 10)), 'Sri Ram Admin', '9944121306', 'admin', '33GUPS2382N1ZF'),
  ('manager', 'manager@sriramtransport.com', crypt('Manager@123', gen_salt('bf', 10)), 'SRT Dispatch Manager', '9845012345', 'manager', '33GUPS2382N1ZF'),
  ('staff', 'staff@sriramtransport.com', crypt('Staff@123', gen_salt('bf', 10)), 'SRT Booking Staff', '9443012345', 'staff', '33GUPS2382N1ZF')
ON CONFLICT (email) DO UPDATE 
SET operating_gstin = EXCLUDED.operating_gstin;

-- Sri Ram Logistics Accounts (GSTIN: 33GWYPP4027A1ZD)
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, operating_gstin)
VALUES 
  ('srl_manager', 'manager@sriramlogistics.com', crypt('Manager@123', gen_salt('bf', 10)), 'SRL Logistics Coordinator', '9698389111', 'manager', '33GWYPP4027A1ZD'),
  ('srl_staff', 'staff@sriramlogistics.com', crypt('Staff@123', gen_salt('bf', 10)), 'SRL Thorapalli Staff', '9944121306', 'staff', '33GWYPP4027A1ZD')
ON CONFLICT (email) DO UPDATE 
SET operating_gstin = EXCLUDED.operating_gstin;

-- Dedicated Seed Clients for Sri Ram Logistics
INSERT INTO clients (id, name, address, gstin, pan, state, phone, email, company_gstin, company_name)
VALUES 
  ('a0000000-0000-0000-0000-000000000101', 'Sri Ram Logistics — Attibele Cargo Hub', 'Survey No. 44/2, Attibele-Hosur National Highway, Hosur - 635130', '33GWYPP4027A1ZD', 'GWYPP4027A', 'TAMIL NADU', '99441 21306', 'sriramtransporthosur@gmail.com', '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
  ('a0000000-0000-0000-0000-000000000102', 'Hosur Precision Auto Components Ltd', 'Phase II, SIPCOT Industrial Complex, Mornapalli, Hosur - 635109', '33AABCH8877K1ZZ', 'AABCH8877K', 'TAMIL NADU', '04344-278900', 'logistics@hosurprecision.com', '33GWYPP4027A1ZD', 'Sri Ram Logistics')
ON CONFLICT (id) DO NOTHING;

-- Dedicated Seed Vehicles for Sri Ram Logistics
INSERT INTO vehicles (id, vehicle_number, vehicle_type, owner_name, owner_phone, company_gstin, company_name)
VALUES 
  ('b0000000-0000-0000-0000-000000000101', 'TN70AX9922', '20FT Container Eicher', 'SRL Fleet Express', '99441 21306', '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
  ('b0000000-0000-0000-0000-000000000102', 'TN24AB5511', '32FT Multi-Axle Truck', 'Thorapalli Heavy Carriers', '96983 89111', '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
  ('b0000000-0000-0000-0000-000000000103', 'KA51C8800', '14FT LCV Closed Body', 'Perandapalli Translines', '98450 12345', '33GWYPP4027A1ZD', 'Sri Ram Logistics')
ON CONFLICT (vehicle_number) DO UPDATE
SET company_gstin = EXCLUDED.company_gstin, company_name = EXCLUDED.company_name;

-- 9. PAYMENTS MODULE TABLE & TRIP PAYMENT COLUMNS (ADVANCE, HALF, FULL WITH CASH/ONLINE UTR)
ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS advance_paid numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_amount numeric(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  load_id text,
  lr_number text,
  total_freight numeric(12,2) NOT NULL DEFAULT 0,
  payment_type text NOT NULL CHECK (payment_type IN ('advance', 'half_payment', 'full_payment')),
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash', 'online')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payer_name text,
  utr_number text,
  payment_date date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_company_gstin ON payments(company_gstin);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access on payments" ON payments;
CREATE POLICY "Enable all access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);


-- ##############################################################################
-- SECTION 2: FULL REPEATABLE DATABASE SCHEMA (FOR NEW DATABASES)
-- ##############################################################################

-- Table 1: APP USERS
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'accountant', 'operator')),
  operating_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF', -- '33GUPS2382N1ZF' (SRT) or '33GWYPP4027A1ZD' (SRL)
  is_active boolean DEFAULT true,
  assigned_modules text[] DEFAULT ARRAY['new-trip', 'status-board', 'invoices', 'clients', 'vehicles', 'reports', 'settings'],
  assigned_company_ids text[] DEFAULT ARRAY[]::text[],
  assigned_company_name text DEFAULT 'All Companies',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 2: COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Sri Ram Transport',
  address text NOT NULL DEFAULT 'NO: 4/ KRISHNAPPA BUILDING NEAR VEGITABLE MARKET KRISHNAGIRI MAIN ROAD BATHALAPALLI HOSUR, Hosur - 635109, TAMIL NADU, India',
  email text NOT NULL DEFAULT 'sriramtransporthosur@gmail.com',
  phone text NOT NULL DEFAULT '9944121306',
  gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  sac_code text NOT NULL DEFAULT '9965',
  branch_state text NOT NULL DEFAULT 'TAMIL NADU',
  pan text NOT NULL DEFAULT 'GLIPS2382N',
  default_gst_percent numeric(5,2) DEFAULT 5.00,
  invoice_prefix text DEFAULT 'SRT-26-27/',
  tagline text DEFAULT 'TRUST • TRANSPORT • TOGETHER',
  updated_at timestamptz DEFAULT now()
);

-- Table 3: CLIENTS (Strictly Scoped by company_gstin)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  name text NOT NULL,
  address text,
  gstin text,
  pan text,
  state text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table 4: VEHICLES (Strictly Scoped by company_gstin)
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  vehicle_number text NOT NULL UNIQUE,
  vehicle_type text,
  owner_name text,
  owner_phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table 5: INVOICES (Strictly Scoped by company_gstin)
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  invoice_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT current_date,
  sub_total numeric(12,2) NOT NULL DEFAULT 0,
  gst_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  gst_amount numeric(12,2) GENERATED ALWAYS AS (round((sub_total * gst_percent / 100)::numeric, 2)) STORED,
  net_amount numeric(12,2) GENERATED ALWAYS AS (sub_total) STORED,
  reverse_charge boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table 6: TRIPS (Strictly Scoped by company_gstin)
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  load_id text NOT NULL UNIQUE,
  loading_date date NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE RESTRICT NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  consignor text,
  consignee text,
  invoice_no_ref text,
  packages text,
  description text,
  actual_weight numeric(10,2),
  charged_weight numeric(10,2),
  unit_type text DEFAULT 'MT',
  custom_unit text,
  rate numeric(10,2),
  has_loading_unloading text DEFAULT 'no',
  loading_unloading_amount numeric(10,2) DEFAULT 0,
  other_charges jsonb DEFAULT '[]'::jsonb,
  freight_amount numeric(12,2) NOT NULL DEFAULT 0,
  vehicle_freight numeric(12,2) NOT NULL DEFAULT 0,
  profit numeric(12,2) GENERATED ALWAYS AS (round((freight_amount - vehicle_freight)::numeric, 2)) STORED,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','in_transit','completed')),
  lr_number text,
  lr_file_url text,
  invoiced boolean DEFAULT false,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  entry_type text DEFAULT 'standard',
  is_direct_invoice boolean DEFAULT false,
  direct_invoice_number text,
  created_at timestamptz DEFAULT now()
);

-- Table 7: PAYMENTS (Settlements & Collections)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
  company_name text DEFAULT 'Sri Ram Transport',
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('advance', 'half_payment', 'full_payment')),
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash', 'online')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payer_name text,
  utr_number text,
  payment_date date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist on PAYMENTS even if table was created previously
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS company_gstin text NOT NULL DEFAULT '33GUPS2382N1ZF',
ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'Sri Ram Transport',
ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'advance',
ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'online',
ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payer_name text,
ADD COLUMN IF NOT EXISTS utr_number text,
ADD COLUMN IF NOT EXISTS payment_date date NOT NULL DEFAULT current_date,
ADD COLUMN IF NOT EXISTS notes text;

-- Ensure columns exist on TRIPS even if table was created previously
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS invoiced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_direct_invoice boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS direct_invoice_number text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS advance_paid numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paid_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount numeric(12,2) DEFAULT 0;

-- Ensure columns exist on INVOICES even if table was created previously
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS is_direct boolean DEFAULT false;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access on payments" ON payments;
CREATE POLICY "Enable all access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_payments_company_gstin ON payments(company_gstin);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_trips_invoice_id ON trips(invoice_id);


-- ##############################################################################
-- SECTION 3: DIRECT SQL CHEATSHEET
-- (Use these queries in Supabase SQL editor for direct manual management)
-- ##############################################################################

/*
-- [A] HOW TO ADD A USER DIRECTLY TO SRI RAM LOGISTICS (SRL):
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, operating_gstin)
VALUES (
  'srl_operator', 
  'operator@sriramlogistics.com', 
  crypt('Operator@123', gen_salt('bf', 10)), 
  'SRL Dedicated Operator', 
  '9698389111', 
  'staff',
  '33GWYPP4027A1ZD'
);

-- [B] HOW TO ADD A USER DIRECTLY TO SRI RAM TRANSPORT (SRT):
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, operating_gstin)
VALUES (
  'srt_operator', 
  'operator@sriramtransport.com', 
  crypt('Operator@123', gen_salt('bf', 10)), 
  'SRT Dedicated Operator', 
  '9944121306', 
  'staff',
  '33GUPS2382N1ZF'
);

-- [C] HOW TO MOVE AN EXISTING USER TO A DIFFERENT GST:
UPDATE app_users 
SET operating_gstin = '33GWYPP4027A1ZD'
WHERE username = 'srl_manager';

-- [D] HOW TO CHANGE A USER'S PASSWORD:
UPDATE app_users 
SET password_hash = crypt('NewPassword@2026', gen_salt('bf', 10)),
    updated_at = now()
WHERE email = 'admin@sriramtransport.com';

-- [E] HOW TO QUERY USERS FOR A SPECIFIC GST ACCOUNT:
SELECT id, username, email, full_name, role, operating_gstin, is_active 
FROM app_users 
WHERE operating_gstin = '33GWYPP4027A1ZD';
*/


-- ##############################################################################
-- SECTION 4: DEFAULT INITIAL SEED DATA (POPULATE ALL EMPTY TABLES)
-- ##############################################################################

-- [1] SEED CLIENTS
INSERT INTO clients (id, name, address, gstin, pan, state, phone, email, is_active, company_gstin, company_name)
VALUES
('a0000000-0000-0000-0000-000000000001', 'Ashirvad Pipes Pvt Ltd', 'Plot 32 - WH, Sy No. 32/2 & Sy No.38/2Krishnasagara Village, Attibele Hobli, Anekal, BANGALORE, 562107', '29AABCA7061K1ZH', 'AABCA7061K', 'KARNATAKA', '080-27847000', 'dispatch@ashirvadpipes.com', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('a0000000-0000-0000-0000-000000000002', 'Sri Venkata Sai Agencies', 'Parvatipuram Main Road, Vizianagaram District, Andhra Pradesh, 535501', '37AABCS1234F1Z8', 'AABCS1234F', 'ANDHRA PRADESH', '9440187654', 'info@venkatasai.com', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('a0000000-0000-0000-0000-000000000003', 'Jaibalaji Electricals', 'Bazaar Street, Salem West, Tamil Nadu, 636001', '33AACFJ9876Q1ZM', 'AACFJ9876Q', 'TAMIL NADU', '9443214567', 'billing@jaibalaji.in', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('a0000000-0000-0000-0000-000000000101', 'Sri Ram Logistics — Attibele Cargo Hub', 'Survey No. 44/2, Attibele-Hosur National Highway, Hosur - 635130', '33GWYPP4027A1ZD', 'GWYPP4027A', 'TAMIL NADU', '99441 21306', 'sriramtransporthosur@gmail.com', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
('a0000000-0000-0000-0000-000000000102', 'Hosur Precision Auto Components Ltd', 'Phase II, SIPCOT Industrial Complex, Mornapalli, Hosur - 635109', '33AABCH8877K1ZZ', 'AABCH8877K', 'TAMIL NADU', '04344-278900', 'logistics@hosurprecision.com', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
('a0000000-0000-0000-0000-000000000103', 'Apex Agro & Solar Equipment Hosur', 'Thorapalli Agraharam Main Road, Perandapalli, Hosur - 635130', '33AAICA5544L1Z1', 'AAICA5544L', 'TAMIL NADU', '96983 89111', 'dispatch@apexsolarhosur.in', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  gstin = EXCLUDED.gstin,
  pan = EXCLUDED.pan,
  state = EXCLUDED.state,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  company_gstin = EXCLUDED.company_gstin,
  company_name = EXCLUDED.company_name;

-- [2] SEED VEHICLES
INSERT INTO vehicles (id, vehicle_number, vehicle_type, owner_name, owner_phone, is_active, company_gstin, company_name)
VALUES
('b0000000-0000-0000-0000-000000000001', 'KA01AB5401', '19FT-SA-IIMT', 'Suresh Kumar', '9845012345', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000002', 'KA53B3784', '22FT-TB-10MT', 'Manjunath Gowda', '9845123456', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000003', 'TN70AP3051', '14FT-LCV-4 MT', 'Murugan Transport', '9443012345', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000004', 'KA665220', '19FT-SA-IIMT', 'Ramesh Babu', '9880123456', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000005', 'KA11A0846', '19FT-SA-IIMT', 'Venkatesh R', '9448123456', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000006', 'TN30CC2936', '22FT-TB-10MT', 'Selvam Lorry Service', '9442123456', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000007', 'TN28AR1872', '20FT Taurus 16MT', 'Kandasamy Logistics', '9842123456', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000008', 'KA04D1920', '32FT Multi-Axle 20MT', 'Bangalore Fast Track', '9845129999', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000009', 'TN34AE1077', '19FT-SA-IIMT', 'Senthil Kumar', '9842011111', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000010', 'TN29CE7789', '22FT-TB-10MT', 'Velavan Translines', '9443122222', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000011', 'TN12AE1752', '14FT-LCV-4 MT', 'Sri Balaji Roadways', '9442133333', true, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('b0000000-0000-0000-0000-000000000101', 'TN70AX9922', '19FT Container Closed', 'SRL Fleet Operations', '96983 89111', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
('b0000000-0000-0000-0000-000000000102', 'TN24AB5511', '22FT Multi-Axle 12MT', 'Hosur Transline Logistics', '99441 21306', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics'),
('b0000000-0000-0000-0000-000000000103', 'KA51C8800', '14FT LCV Closed Body', 'Perandapalli Translines', '98450 12345', true, '33GWYPP4027A1ZD', 'Sri Ram Logistics')
ON CONFLICT (id) DO UPDATE SET
  vehicle_number = EXCLUDED.vehicle_number,
  vehicle_type = EXCLUDED.vehicle_type,
  owner_name = EXCLUDED.owner_name,
  owner_phone = EXCLUDED.owner_phone,
  company_gstin = EXCLUDED.company_gstin,
  company_name = EXCLUDED.company_name;

-- [3] SEED INVOICES
INSERT INTO invoices (id, invoice_number, client_id, invoice_date, sub_total, gst_percent, reverse_charge, notes, is_direct, company_gstin, company_name)
VALUES
('d0000000-0000-0000-0000-000000000112', 'SRT-26-27/112', 'a0000000-0000-0000-0000-000000000002', '2026-06-05', 64300.00, 5.0, true, 'Vizianagaram multi-drop consignment billing', false, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('d0000000-0000-0000-0000-000000000111', 'SRT-26-27/111', 'a0000000-0000-0000-0000-000000000001', '2026-06-03', 86100.00, 5.0, true, 'Consolidated CPVC & SWR pipe consignments', false, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('d0000000-0000-0000-0000-000000000110', 'SRT-26-27/110', 'a0000000-0000-0000-0000-000000000003', '2026-06-01', 48500.00, 5.0, true, 'Electrical switchgear industrial transit', false, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('d0000000-0000-0000-0000-000000000109', 'SRT-26-27/109', 'a0000000-0000-0000-0000-000000000001', '2026-05-28', 73900.00, 5.0, true, 'Jigani plant bulk freight invoice', false, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('d0000000-0000-0000-0000-000000000108', 'SRT-26-27/108', 'a0000000-0000-0000-0000-000000000002', '2026-05-25', 58000.00, 5.0, true, 'North Andhra transit billing', false, '33GUPS2382N1ZF', 'Sri Ram Transport'),
('d0000000-0000-0000-0000-000000000201', 'SRL-26-27/201', 'a0000000-0000-0000-0000-000000000101', '2026-06-02', 54000.00, 5.0, true, 'Attibele hub dedicated container line haul', false, '33GWYPP4027A1ZD', 'Sri Ram Logistics')
ON CONFLICT (id) DO UPDATE SET
  invoice_number = EXCLUDED.invoice_number,
  client_id = EXCLUDED.client_id,
  sub_total = EXCLUDED.sub_total,
  gst_percent = EXCLUDED.gst_percent,
  reverse_charge = EXCLUDED.reverse_charge,
  notes = EXCLUDED.notes,
  is_direct = EXCLUDED.is_direct,
  company_gstin = EXCLUDED.company_gstin,
  company_name = EXCLUDED.company_name;

-- [4] SEED TRIPS
INSERT INTO trips (
  id, load_id, loading_date, vehicle_id, client_id,
  from_location, to_location, consignor, consignee,
  packages, description, actual_weight, charged_weight, rate,
  freight_amount, vehicle_freight, status,
  lr_number, lr_file_url, invoiced, invoice_id,
  company_gstin, company_name, payment_status,
  advance_paid, total_paid_amount, balance_amount,
  entry_type, is_direct_invoice
)
VALUES
('c0000000-0000-0000-0000-000000000001', '21913689', '2026-06-02', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BANGALORE, Jigani', 'BANGALORE', 'Ashirvad Pipes Pvt Ltd', 'Local Depot Warehouse', '42 Bundles', 'PVC Conduit Pipes & Bends', 4.5, 4.5, 2200, 9900.00, 8400.00, 'completed', '9081', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'advance', 5000.00, 5000.00, 4900.00, 'standard', false),
('c0000000-0000-0000-0000-000000000002', '21914630', '2026-06-02', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BANGALORE', 'RAMANAGAR', 'Ashirvad Pipes Pvt Ltd', 'Ramanagar Pipe Traders', '30 Bundles', 'CPVC Fitting Boxes', 3.2, 3.5, 2285, 7998.00, 6700.00, 'completed', '9082', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'half_payment', 4000.00, 4000.00, 3998.00, 'standard', false),
('c0000000-0000-0000-0000-000000000003', '21915060', '2026-06-02', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BANGALORE', 'KELAMANGALAM', 'Ashirvad Pipes Pvt Ltd', 'Sri Ram Agency Hardware', '25 Bundles', 'SWR Pipes & Rubber Rings', 2.8, 3.0, 2400, 7200.00, 6000.00, 'completed', '9083', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'full_payment', 0.00, 7200.00, 0.00, 'standard', false),
('c0000000-0000-0000-0000-000000000004', '21919535', '2026-06-02', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'BANGALORE', 'RAMANAGAR', 'Ashirvad Pipes Pvt Ltd', 'Sri Venkateswara Traders', '40 Bundles', 'PVC Agricultural Pipes', 4.0, 4.0, 2225, 8900.00, 7600.00, 'completed', '9084', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'pending', 0.00, 0.00, 8900.00, 'standard', false),
('c0000000-0000-0000-0000-000000000011', '22026110', '2026-06-06', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'GALORE, KELAMANGA', 'Paloncha', 'Ashirvad Pipes Pvt Ltd', 'Telangana Hardware & Sanitary', '110 Bundles', 'Heavy Industrial SWR Pipes', 14.5, 15.0, 2426, 36400.00, 31000.00, 'in_transit', NULL, NULL, false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'pending', 0.00, 0.00, 36400.00, 'standard', false),
('c0000000-0000-0000-0000-000000000013', '22060574', '2026-06-08', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'NGALORE, NELAMANGA', 'MYSURU', 'Ashirvad Pipes Pvt Ltd', 'Mysore Sanitary Corp', '60 Bundles', 'Plumbing Kits & Ball Valves', 6.8, 7.0, 2128, 14900.00, 12500.00, 'booked', NULL, NULL, false, NULL, '33GUPS2382N1ZF', 'Sri Ram Transport', 'pending', 0.00, 0.00, 14900.00, 'standard', false),
('c0000000-0000-0000-0000-000000000101', 'SRL-220101', '2026-06-03', 'b0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', 'THORAPALLI AGRAHARAM, HOSUR', 'BANGALORE, Whitefield', 'Sri Ram Logistics (Thorapalli)', 'Ashirvad Pipes Pvt Ltd Warehouse', '55 Boxes', 'Industrial UPVC Pipe Fittings & Valves', 5.2, 5.2, 2400, 12480.00, 10500.00, 'completed', 'SRL-101', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', false, NULL, '33GWYPP4027A1ZD', 'Sri Ram Logistics', 'advance', 6000.00, 6000.00, 6480.00, 'standard', false),
('c0000000-0000-0000-0000-000000000102', 'SRL-220102', '2026-06-04', 'b0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000102', 'PERANDAPALLI VILLAGE, HOSUR', 'SALEM INDUSTRIAL ESTATE', 'Sri Ram Logistics (Perandapalli)', 'Hosur Precision Auto Hub', '38 Bundles', 'High Pressure Agricultural Pipes', 4.0, 4.0, 2600, 10400.00, 8800.00, 'in_transit', 'SRL-102', NULL, false, NULL, '33GWYPP4027A1ZD', 'Sri Ram Logistics', 'pending', 0.00, 0.00, 10400.00, 'standard', false)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  freight_amount = EXCLUDED.freight_amount,
  vehicle_freight = EXCLUDED.vehicle_freight,
  payment_status = EXCLUDED.payment_status,
  advance_paid = EXCLUDED.advance_paid,
  total_paid_amount = EXCLUDED.total_paid_amount,
  balance_amount = EXCLUDED.balance_amount;

-- [5] SEED PAYMENTS
INSERT INTO payments (
  id, company_gstin, company_name, trip_id, client_id,
  load_id, lr_number, total_freight, payment_type, payment_mode,
  amount, payer_name, utr_number, payment_date, notes
)
VALUES
('e0000000-0000-0000-0000-000000000001', '33GUPS2382N1ZF', 'Sri Ram Transport', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '21913689', '9081', 9900.00, 'advance', 'online', 5000.00, 'Ashirvad Finance Desk', 'CMS290184719', '2026-06-02', 'Advance booking NEFT transfer'),
('e0000000-0000-0000-0000-000000000002', '33GUPS2382N1ZF', 'Sri Ram Transport', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '21914630', '9082', 7998.00, 'half_payment', 'online', 4000.00, 'Ashirvad Pipes Pvt Ltd', 'HDFC00012948', '2026-06-03', '50% installment on dispatch'),
('e0000000-0000-0000-0000-000000000003', '33GUPS2382N1ZF', 'Sri Ram Transport', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '21915060', '9083', 7200.00, 'full_payment', 'cash', 7200.00, 'Cash Depot Collection', NULL, '2026-06-04', 'Full balance settled in cash on delivery'),
('e0000000-0000-0000-0000-000000000101', '33GWYPP4027A1ZD', 'Sri Ram Logistics', 'c0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', 'SRL-220101', 'SRL-101', 12480.00, 'advance', 'online', 6000.00, 'Attibele Hub Logistics', 'UTIB000293819', '2026-06-03', 'Advance booking transfer')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  payment_type = EXCLUDED.payment_type,
  payment_mode = EXCLUDED.payment_mode,
  payer_name = EXCLUDED.payer_name,
  utr_number = EXCLUDED.utr_number;

