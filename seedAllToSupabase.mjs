import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywwrbajsvfziidriquq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d3dyYmFqc3ZmemlpZHJpcXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjQxNTIsImV4cCI6MjEwNDYwMDE1Mn0.cREHKffOU4Iu42nPtz7KpK5IQun2N8iYdEA-eBq5N3o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAll() {
  console.log('=== STARTING COMPLETE SUPABASE DATA SEEDING ===');

  // 1. SEED CLIENTS
  console.log('\n1. Seeding Clients...');
  const clientsData = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Ashirvad Pipes Pvt Ltd',
      address: 'Plot 32 - WH, Sy No. 32/2 & Sy No.38/2Krishnasagara Village, Attibele Hobli, Anekal, BANGALORE, 562107',
      gstin: '29AABCA7061K1ZH',
      pan: 'AABCA7061K',
      state: 'KARNATAKA',
      phone: '080-27847000',
      email: 'dispatch@ashirvadpipes.com',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Sri Venkata Sai Agencies',
      address: 'Parvatipuram Main Road, Vizianagaram District, Andhra Pradesh, 535501',
      gstin: '37AABCS1234F1Z8',
      pan: 'AABCS1234F',
      state: 'ANDHRA PRADESH',
      phone: '9440187654',
      email: 'info@venkatasai.com',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Jaibalaji Electricals',
      address: 'Bazaar Street, Salem West, Tamil Nadu, 636001',
      gstin: '33AACFJ9876Q1ZM',
      pan: 'AACFJ9876Q',
      state: 'TAMIL NADU',
      phone: '9443214567',
      email: 'billing@jaibalaji.in',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000101',
      name: 'Sri Ram Logistics — Attibele Cargo Hub',
      address: 'Survey No. 44/2, Attibele-Hosur National Highway, Hosur - 635130',
      gstin: '33GWYPP4027A1ZD',
      pan: 'GWYPP4027A',
      state: 'TAMIL NADU',
      phone: '99441 21306',
      email: 'sriramtransporthosur@gmail.com',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000102',
      name: 'Hosur Precision Auto Components Ltd',
      address: 'Phase II, SIPCOT Industrial Complex, Mornapalli, Hosur - 635109',
      gstin: '33AABCH8877K1ZZ',
      pan: 'AABCH8877K',
      state: 'TAMIL NADU',
      phone: '04344-278900',
      email: 'logistics@hosurprecision.com',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000103',
      name: 'Apex Agro & Solar Equipment Hosur',
      address: 'Thorapalli Agraharam Main Road, Perandapalli, Hosur - 635130',
      gstin: '33AAICA5544L1Z1',
      pan: 'AAICA5544L',
      state: 'TAMIL NADU',
      phone: '96983 89111',
      email: 'dispatch@apexsolarhosur.in',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
    }
  ];

  for (const c of clientsData) {
    const { error } = await supabase.from('clients').upsert(c, { onConflict: 'id' });
    if (error) console.error('Error upserting client', c.name, error);
    else console.log('✓ Client synced:', c.name);
  }

  // Fetch verified clients map
  const { data: dbClients } = await supabase.from('clients').select('id, name, company_gstin');
  const clientMap = {};
  dbClients.forEach(c => { clientMap[c.name] = c.id; });

  // 2. SEED VEHICLES
  console.log('\n2. Seeding Vehicles...');
  const vehiclesData = [
    { id: 'b0000000-0000-0000-0000-000000000001', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA01AB5401', vehicle_type: '19FT-SA-IIMT', owner_name: 'Suresh Kumar', owner_phone: '9845012345' },
    { id: 'b0000000-0000-0000-0000-000000000002', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA53B3784', vehicle_type: '22FT-TB-10MT', owner_name: 'Manjunath Gowda', owner_phone: '9845123456' },
    { id: 'b0000000-0000-0000-0000-000000000003', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'TN70AP3051', vehicle_type: '14FT-LCV-4 MT', owner_name: 'Murugan Transport', owner_phone: '9443012345' },
    { id: 'b0000000-0000-0000-0000-000000000004', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA665220', vehicle_type: '19FT-SA-IIMT', owner_name: 'Ramesh Babu', owner_phone: '9880123456' },
    { id: 'b0000000-0000-0000-0000-000000000005', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA11A0846', vehicle_type: '19FT-SA-IIMT', owner_name: 'Venkatesh R', owner_phone: '9448123456' },
    { id: 'b0000000-0000-0000-0000-000000000006', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'TN30CC2936', vehicle_type: '22FT-TB-10MT', owner_name: 'Selvam Lorry Service', owner_phone: '9442123456' },
    { id: 'b0000000-0000-0000-0000-000000000007', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA25D5462', vehicle_type: '14FT-LCV-4 MT', owner_name: 'Anand K', owner_phone: '9844012345' },
    { id: 'b0000000-0000-0000-0000-000000000008', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'KA51AA8161', vehicle_type: '19FT-SA-IIMT', owner_name: 'Syed Transport', owner_phone: '9845987654' },
    { id: 'b0000000-0000-0000-0000-000000000009', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'TN12AE1752', vehicle_type: '14FT-LCV-4 MT', owner_name: 'Kumaravel Lorry', owner_phone: '9443198765' },
    { id: 'b0000000-0000-0000-0000-000000000010', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'TN29CE7789', vehicle_type: '22FT-TB-10MT', owner_name: 'Dharmapuri Carriers', owner_phone: '9443210987' },
    { id: 'b0000000-0000-0000-0000-000000000011', company_gstin: '33GUPS2382N1ZF', company_name: 'Sri Ram Transport', vehicle_number: 'TN34AE1077', vehicle_type: '22FT-TB-10MT', owner_name: 'Tiruchengode Transports', owner_phone: '9443321098' },
    { id: 'b0000000-0000-0000-0000-000000000101', company_gstin: '33GWYPP4027A1ZD', company_name: 'Sri Ram Logistics', vehicle_number: 'TN70AX9922', vehicle_type: '20FT Container Eicher', owner_name: 'SRL Fleet Express', owner_phone: '99441 21306' },
    { id: 'b0000000-0000-0000-0000-000000000102', company_gstin: '33GWYPP4027A1ZD', company_name: 'Sri Ram Logistics', vehicle_number: 'TN24AB5511', vehicle_type: '32FT Multi-Axle Truck', owner_name: 'Thorapalli Heavy Carriers', owner_phone: '96983 89111' },
    { id: 'b0000000-0000-0000-0000-000000000103', company_gstin: '33GWYPP4027A1ZD', company_name: 'Sri Ram Logistics', vehicle_number: 'KA51C8800', vehicle_type: '14FT LCV Closed Body', owner_name: 'Perandapalli Translines', owner_phone: '98450 12345' }
  ];

  for (const v of vehiclesData) {
    const { error } = await supabase.from('vehicles').upsert(v, { onConflict: 'vehicle_number' });
    if (error) console.error('Error upserting vehicle', v.vehicle_number, error);
    else console.log('✓ Vehicle synced:', v.vehicle_number);
  }

  // Fetch verified vehicles map
  const { data: dbVehicles } = await supabase.from('vehicles').select('id, vehicle_number');
  const vehicleMap = {};
  dbVehicles.forEach(v => { vehicleMap[v.vehicle_number] = v.id; });

  // 3. SEED INVOICES FIRST (So trips and payments can reference them)
  console.log('\n3. Seeding Invoices...');
  const invoicesData = [
    {
      id: 'd0000000-0000-0000-0000-000000000112',
      invoice_number: 'SRT-26-27/112',
      client_id: clientMap['Sri Venkata Sai Agencies'] || dbClients[1].id,
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      invoice_date: '2026-06-05',
      sub_total: 64300.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Vizianagaram multi-drop consignment billing'
    },
    {
      id: 'd0000000-0000-0000-0000-000000000111',
      invoice_number: 'SRT-26-27/111',
      client_id: clientMap['Ashirvad Pipes Pvt Ltd'] || dbClients[0].id,
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      invoice_date: '2026-06-03',
      sub_total: 86100.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Consolidated CPVC & SWR pipe consignments'
    },
    {
      id: 'd0000000-0000-0000-0000-000000000110',
      invoice_number: 'SRT-26-27/110',
      client_id: clientMap['Jaibalaji Electricals'] || dbClients[2].id,
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      invoice_date: '2026-06-01',
      sub_total: 48500.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Electrical switchgear industrial transit'
    },
    {
      id: 'd0000000-0000-0000-0000-000000000109',
      invoice_number: 'SRT-26-27/109',
      client_id: clientMap['Ashirvad Pipes Pvt Ltd'] || dbClients[0].id,
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      invoice_date: '2026-05-28',
      sub_total: 73900.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Jigani plant bulk freight invoice'
    },
    {
      id: 'd0000000-0000-0000-0000-000000000108',
      invoice_number: 'SRT-26-27/108',
      client_id: clientMap['Sri Venkata Sai Agencies'] || dbClients[1].id,
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      invoice_date: '2026-05-25',
      sub_total: 58000.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Hardware & CPVC pipes supply'
    },
    {
      id: 'd0000000-0000-0000-0000-000000000201',
      invoice_number: 'SRL-26-27/201',
      client_id: clientMap['Sri Ram Logistics — Attibele Cargo Hub'] || dbClients[3].id,
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
      invoice_date: '2026-06-04',
      sub_total: 46800.00,
      gst_percent: 5.0,
      reverse_charge: true,
      notes: 'Attibele Hub containerized cross-dock billing'
    }
  ];

  for (const inv of invoicesData) {
    const { error } = await supabase.from('invoices').upsert(inv, { onConflict: 'invoice_number' });
    if (error) console.error('Error upserting invoice', inv.invoice_number, error);
    else console.log('✓ Invoice synced:', inv.invoice_number);
  }

  // 4. SEED TRIPS
  console.log('\n4. Seeding Trips...');
  const ashirvadId = clientMap['Ashirvad Pipes Pvt Ltd'] || dbClients[0].id;
  const venkataId = clientMap['Sri Venkata Sai Agencies'] || dbClients[1].id;
  const jaibalajiId = clientMap['Jaibalaji Electricals'] || dbClients[2].id;
  const srlHubId = clientMap['Sri Ram Logistics — Attibele Cargo Hub'] || dbClients[3].id;
  const hosurAutoId = clientMap['Hosur Precision Auto Components Ltd'] || dbClients[4].id;

  const tripsData = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      load_id: '21913689',
      loading_date: '2026-06-02',
      vehicle_id: vehicleMap['KA01AB5401'],
      client_id: ashirvadId,
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
      status: 'completed',
      lr_number: '9081',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'advance',
      advance_paid: 5000.00,
      total_paid_amount: 5000.00,
      balance_amount: 4900.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      load_id: '21914630',
      loading_date: '2026-06-02',
      vehicle_id: vehicleMap['KA53B3784'],
      client_id: ashirvadId,
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
      status: 'completed',
      lr_number: '9082',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'half_payment',
      advance_paid: 4000.00,
      total_paid_amount: 4000.00,
      balance_amount: 3998.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      load_id: '21915060',
      loading_date: '2026-06-02',
      vehicle_id: vehicleMap['TN70AP3051'],
      client_id: ashirvadId,
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
      status: 'completed',
      lr_number: '9083',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'full_payment',
      advance_paid: 7200.00,
      total_paid_amount: 7200.00,
      balance_amount: 0.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      load_id: '21919535',
      loading_date: '2026-06-02',
      vehicle_id: vehicleMap['KA665220'],
      client_id: ashirvadId,
      from_location: 'BANGALORE',
      to_location: 'HOSKOTE',
      consignor: 'Ashirvad Pipes Pvt Ltd',
      consignee: 'National Pipe Depot',
      packages: '45 Bundles',
      description: 'PVC Pressure Pipes Class 2',
      actual_weight: 4.8,
      charged_weight: 5.0,
      rate: 1950,
      freight_amount: 9750.00,
      vehicle_freight: 8200.00,
      status: 'completed',
      lr_number: '9084',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'pending',
      advance_paid: 0.00,
      total_paid_amount: 0.00,
      balance_amount: 9750.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      load_id: '21921008',
      loading_date: '2026-06-03',
      vehicle_id: vehicleMap['KA11A0846'],
      client_id: ashirvadId,
      from_location: 'BANGALORE',
      to_location: 'VIJAYAPURA',
      consignor: 'Ashirvad Pipes Pvt Ltd',
      consignee: 'Gajanana Sanitary Ware',
      packages: '50 Bundles',
      description: 'Plumbing CPVC Pipe System',
      actual_weight: 5.2,
      charged_weight: 5.2,
      rate: 2100,
      freight_amount: 10920.00,
      vehicle_freight: 9200.00,
      status: 'completed',
      lr_number: '9085',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'pending',
      advance_paid: 0.00,
      total_paid_amount: 0.00,
      balance_amount: 10920.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      load_id: '21922441',
      loading_date: '2026-06-03',
      vehicle_id: vehicleMap['TN30CC2936'],
      client_id: ashirvadId,
      from_location: 'BANGALORE',
      to_location: 'ANEKAL',
      consignor: 'Ashirvad Pipes Pvt Ltd',
      consignee: 'Anekal Building Supplies',
      packages: '35 Bundles',
      description: 'Agricultural Column Pipes',
      actual_weight: 3.8,
      charged_weight: 4.0,
      rate: 2350,
      freight_amount: 9400.00,
      vehicle_freight: 8000.00,
      status: 'completed',
      lr_number: '9086',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      payment_status: 'pending',
      advance_paid: 0.00,
      total_paid_amount: 0.00,
      balance_amount: 9400.00
    },
    // Sri Ram Logistics Trips
    {
      id: 'c0000000-0000-0000-0000-000000000101',
      load_id: 'SRL-220101',
      loading_date: '2026-06-03',
      vehicle_id: vehicleMap['TN70AX9922'],
      client_id: srlHubId,
      from_location: 'ATTIBELE',
      to_location: 'HOSUR',
      consignor: 'Sri Ram Logistics — Attibele Hub',
      consignee: 'Hosur Distribution Warehouse',
      packages: '85 Cartons',
      description: 'Electronics & Component Consignment',
      actual_weight: 5.2,
      charged_weight: 5.2,
      rate: 2400,
      freight_amount: 12480.00,
      vehicle_freight: 10500.00,
      status: 'completed',
      lr_number: 'SRL-101',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
      payment_status: 'advance',
      advance_paid: 6000.00,
      total_paid_amount: 6000.00,
      balance_amount: 6480.00
    },
    {
      id: 'c0000000-0000-0000-0000-000000000102',
      load_id: 'SRL-220102',
      loading_date: '2026-06-04',
      vehicle_id: vehicleMap['TN24AB5511'],
      client_id: hosurAutoId,
      from_location: 'HOSUR, SIPCOT',
      to_location: 'CHENNAI, Ambattur',
      consignor: 'Hosur Precision Auto Components Ltd',
      consignee: 'Chennai Auto Hub',
      packages: '140 Crates',
      description: 'Precision Machined Crankshafts',
      actual_weight: 12.5,
      charged_weight: 13.0,
      rate: 2640,
      freight_amount: 34320.00,
      vehicle_freight: 29500.00,
      status: 'completed',
      lr_number: 'SRL-102',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
      payment_status: 'pending',
      advance_paid: 0.00,
      total_paid_amount: 0.00,
      balance_amount: 34320.00
    }
  ];

  for (const t of tripsData) {
    const { error } = await supabase.from('trips').upsert(t, { onConflict: 'load_id' });
    if (error) console.error('Error upserting trip', t.load_id, error);
    else console.log('✓ Trip synced:', t.load_id);
  }

  // 5. SEED PAYMENTS
  console.log('\n5. Seeding Payments...');
  const paymentsData = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      trip_id: 'c0000000-0000-0000-0000-000000000001',
      client_id: ashirvadId,
      amount: 5000.00,
      payment_type: 'advance',
      payment_mode: 'online',
      payer_name: 'Ashirvad Finance Desk',
      utr_number: 'CMS290184719',
      payment_date: '2026-06-02',
      notes: 'Advance booking NEFT transfer'
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      trip_id: 'c0000000-0000-0000-0000-000000000002',
      client_id: ashirvadId,
      amount: 4000.00,
      payment_type: 'half_payment',
      payment_mode: 'online',
      payer_name: 'Ashirvad Pipes Pvt Ltd',
      utr_number: 'HDFC00012948',
      payment_date: '2026-06-03',
      notes: '50% installment on dispatch'
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      company_gstin: '33GUPS2382N1ZF',
      company_name: 'Sri Ram Transport',
      trip_id: 'c0000000-0000-0000-0000-000000000003',
      client_id: ashirvadId,
      amount: 7200.00,
      payment_type: 'full_payment',
      payment_mode: 'cash',
      payer_name: 'Cash Depot Collection',
      utr_number: null,
      payment_date: '2026-06-04',
      notes: 'Full balance settled in cash on delivery'
    },
    {
      id: 'e0000000-0000-0000-0000-000000000101',
      company_gstin: '33GWYPP4027A1ZD',
      company_name: 'Sri Ram Logistics',
      trip_id: 'c0000000-0000-0000-0000-000000000101',
      client_id: srlHubId,
      amount: 6000.00,
      payment_type: 'advance',
      payment_mode: 'online',
      payer_name: 'Attibele Hub Logistics',
      utr_number: 'UTIB000293819',
      payment_date: '2026-06-03',
      notes: 'Advance booking transfer'
    }
  ];

  for (const p of paymentsData) {
    const { error } = await supabase.from('payments').upsert(p, { onConflict: 'id' });
    if (error) console.error('Error upserting payment', p.id, error);
    else console.log('✓ Payment synced:', p.id, 'Amount: ₹' + p.amount);
  }

  console.log('\n=== COMPLETE SUPABASE DATA SEEDING FINISHED ===');
}

seedAll();
