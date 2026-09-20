export default async () => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return Response.json({ error:'Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en Netlify.' }, { status:503 });
  return Response.json({ supabaseUrl, supabaseAnonKey }, { headers:{'Cache-Control':'no-store'} });
};
