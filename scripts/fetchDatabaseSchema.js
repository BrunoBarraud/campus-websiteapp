import { createClient } from '@supabase/supabase-js';

// Configura tu URL y clave de Supabase
const SUPABASE_URL = 'https://<your-supabase-url>.supabase.co';
const SUPABASE_KEY = '<your-supabase-key>';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchDatabaseSchema() {
  try {
    // Ejecuta una consulta para obtener las tablas y columnas
    const { data, error } = await supabase.rpc('pg_catalog.pg_tables', {});

    if (error) {
      console.error('Error fetching schema:', error);
      return;
    }

    console.log('Database Schema:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fetchDatabaseSchema();
