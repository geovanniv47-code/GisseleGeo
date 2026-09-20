import { requireSession } from './supabase-client.js';
const $=selector=>document.querySelector(selector); let auth;
function setMessage(text='',type=''){const el=$('#admin-message');el.textContent=text;el.className=`message ${type}`;}
function formatDate(value){return value?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';}
async function load(){
  setMessage('Cargando información…');
  try{
    const response=await fetch('/.netlify/functions/admin',{headers:{Authorization:`Bearer ${auth.session.access_token}`}}); const body=await response.json(); if(response.status===403){location.replace('/app.html');return;} if(!response.ok)throw new Error(body.error||'No se pudo abrir el panel.');
    $('#admin-content').classList.remove('hidden');$('#admin-identity').textContent=`Sesión de ${body.adminEmail}`;$('#user-count').textContent=body.userCount ?? '—';
    if(body.setupMissing){$('#service-status').textContent='Configuración pendiente';$('#admin-setup-note').textContent='Agrega SUPABASE_SERVICE_ROLE_KEY en Netlify para consultar la lista de usuarios. El acceso y la generación ya pueden funcionar sin esta vista.';$('#admin-setup-note').classList.remove('hidden');$('#users-body').innerHTML='<tr><td colspan="3">La lectura administrativa de usuarios aún no está conectada.</td></tr>';}
    else{$('#service-status').textContent='Conectado';$('#admin-setup-note').classList.add('hidden');$('#users-body').innerHTML=(body.users||[]).map(user=>`<tr><td>${user.email||'Sin correo'}</td><td>${formatDate(user.createdAt)}</td><td>${formatDate(user.lastSignInAt)}</td></tr>`).join('')||'<tr><td colspan="3">No hay usuarios.</td></tr>';}
    setMessage('Panel actualizado.','success');
  }catch(error){setMessage(error.message,'error');}
}
(async()=>{try{auth=await requireSession();$('#signout').addEventListener('click',async()=>{await auth.supabase.auth.signOut();location.replace('/');});$('#refresh-admin').addEventListener('click',load);await load();}catch(error){setMessage(error.message,'error');}})();
