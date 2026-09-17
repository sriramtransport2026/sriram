import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywwrbajsvfziidriquq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d3dyYmFqc3ZmemlpZHJpcXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjQxNTIsImV4cCI6MjEwNDYwMDE1Mn0.cREHKffOU4Iu42nPtz7KpK5IQun2N8iYdEA-eBq5N3o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAll() {
  console.log('--- Testing Supabase Connection ---');
  
  const tables = ['app_users', 'clients', 'vehicles', 'trips', 'invoices', 'payments'];
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`Table '${table}': ERROR ->`, error.message, '| Code:', error.code);
      } else {
        console.log(`Table '${table}': SUCCESS -> Row Count:`, data.length);
        if (data.length > 0) {
          console.log(`   Sample row from ${table}:`, Object.keys(data[0]));
        }
      }
    } catch (e) {
      console.log(`Table '${table}': EXCEPTION ->`, e.message);
    }
  }
}

checkAll();
