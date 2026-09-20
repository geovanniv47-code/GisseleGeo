import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

let clientPromise;
export async function getSupabase() {
  if (!clientPromise) clientPromise = fetch('/.netlify/functions/app-config', { cache: 'no-store' })
    .then(async (response) => {
      const config = await response.json();
      if (!response.ok || !config.supabaseUrl || !config.supabaseAnonKey) throw new Error(config.error || 'Falta configurar Supabase en Netlify.');
      return createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'gisselegeo-auth' }
      });
    });
  return clientPromise;
}

export async function requireSession() {
  const supabase = await getSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) { location.replace('/'); throw new Error('Sesión requerida'); }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) { await supabase.auth.signOut(); location.replace('/'); throw new Error('Sesión inválida'); }
  return { supabase, session, user };
}
