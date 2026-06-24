import { createClient } from '@supabase/supabase-js';

// Reemplazar con variables de entorno reales en el futuro
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*');
  if (error) throw error;
  return data;
};

export const saveUserLineup = async (lineupData) => {
  const { data, error } = await supabase
    .from('user_lineups')
    .insert([lineupData]);
  if (error) throw error;
  return data;
};
