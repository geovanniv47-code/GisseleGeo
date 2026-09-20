const ADMIN_EMAIL = 'geovanniv47@gmail.com';

export async function verifyUser(request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw Object.assign(new Error('Supabase no está configurado.'), { status: 503 });
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('Inicia sesión para continuar.'), { status: 401 });
  const response = await fetch(`${supabaseUrl.replace(/\/$/,'')}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } });
  if (!response.ok) throw Object.assign(new Error('La sesión no es válida o ya expiró.'), { status: 401 });
  return response.json();
}
export function isAdmin(user) { return String(user?.email || '').toLowerCase() === ADMIN_EMAIL; }
export { ADMIN_EMAIL };
