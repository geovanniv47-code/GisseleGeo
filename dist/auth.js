import { getSupabase } from './supabase-client.js';

const form = document.querySelector('#auth-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const submit = document.querySelector('#email-submit');
const message = document.querySelector('#auth-message');
let mode = 'signin';

function setMessage(text='', type='') { message.textContent = text; message.className = `message ${type}`; }
function setLoading(active) { submit.disabled = active; submit.classList.toggle('loading', active); }
function friendlyError(error) {
  const value = String(error?.message || error || 'No se pudo completar el acceso.');
  if (/invalid login/i.test(value)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(value)) return 'Ese correo ya tiene una cuenta.';
  if (/email not confirmed/i.test(value)) return 'Confirma tu correo antes de entrar.';
  return value;
}

async function redirectIfSignedIn() {
  try { const supabase = await getSupabase(); const { data } = await supabase.auth.getSession(); if (data.session) location.replace('/app.html'); }
  catch (error) { setMessage(friendlyError(error), 'error'); }
}

document.querySelectorAll('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
  mode = tab.id === 'signup-tab' ? 'signup' : 'signin';
  document.querySelectorAll('.auth-tab').forEach(item => { const active = item === tab; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); });
  submit.querySelector('.button-label').textContent = mode === 'signup' ? 'Crear cuenta' : 'Entrar';
  passwordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  setMessage();
}));

document.querySelector('#toggle-password').addEventListener('click', (event) => { const show = passwordInput.type === 'password'; passwordInput.type = show ? 'text' : 'password'; event.currentTarget.textContent = show ? 'Ocultar' : 'Ver'; });

document.querySelector('#google-login').addEventListener('click', async () => {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${location.origin}/app.html` } });
    if (error) throw error;
  } catch (error) { setMessage(friendlyError(error), 'error'); }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault(); setMessage();
  if (!form.reportValidity()) return;
  setLoading(true);
  try {
    const supabase = await getSupabase();
    const email = emailInput.value.trim(); const password = passwordInput.value;
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options:{ emailRedirectTo:`${location.origin}/app.html` } });
      if (error) throw error;
      if (data.session) location.replace('/app.html'); else setMessage('Cuenta creada. Revisa tu correo para confirmarla.', 'success');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.replace('/app.html');
    }
  } catch (error) { setMessage(friendlyError(error), 'error'); }
  finally { setLoading(false); }
});

document.querySelector('#forgot-password').addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email) { setMessage('Escribe primero tu correo.', 'error'); emailInput.focus(); return; }
  try { const supabase = await getSupabase(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo:`${location.origin}/` }); if (error) throw error; setMessage('Te enviamos un enlace para recuperar tu acceso.', 'success'); }
  catch (error) { setMessage(friendlyError(error), 'error'); }
});

redirectIfSignedIn();
