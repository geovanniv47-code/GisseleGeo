import { requireSession } from './supabase-client.js';

const ADMIN_EMAIL = 'geovanniv47@gmail.com';
const state = { mode:'edit', file:null, previewUrl:null, busy:false, session:null, supabase:null, history:JSON.parse(sessionStorage.getItem('gisselegeo-history') || '[]') };
const $ = (selector) => document.querySelector(selector);
const keyInput=$('#api-key'), promptInput=$('#prompt'), fileInput=$('#reference-image'), generateButton=$('#generate'), message=$('#generation-message');

function setMessage(text='', type=''){ message.textContent=text; message.className=`message ${type}`; }
function validate(){ const ready=keyInput.value.trim() && promptInput.value.trim() && state.file && !state.busy; generateButton.disabled=!ready; }
function setBusy(active,label='Generando…'){ state.busy=active; generateButton.classList.toggle('loading',active); generateButton.querySelector('.button-label').textContent=active?label:'Generar'; validate(); }
function updateVideoCost(){
  const duration=Number($('#duration').value); const resolution=$('#video-quality').value;
  const cost=(duration*(resolution==='720p'?0.20:0.10)).toFixed(2);
  $('#video-cost').textContent=`Costo estimado: US$${cost}`;
}
function saveHistory(){ state.history=state.history.slice(0,8); sessionStorage.setItem('gisselegeo-history',JSON.stringify(state.history)); renderHistory(); }
function escapeHtml(value){ return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function outputUrl(output){ if(typeof output==='string') return output; return output?.url || output?.uri || output?.video || output?.image || ''; }

async function api(action,payload={}){
  const response=await fetch('/.netlify/functions/wavespeed-bridge',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.session.access_token}`},body:JSON.stringify({action,waveSpeedKey:keyInput.value.trim(),...payload})});
  const body=await response.json().catch(()=>({})); if(!response.ok) throw new Error(body.error || `Error ${response.status}`); return body;
}

async function uploadReference(file){
  setBusy(true,'Subiendo imagen…'); setMessage('Subiendo la imagen de forma segura…');
  const form=new FormData();
  form.append('action','upload-proxy');
  form.append('waveSpeedKey',keyInput.value.trim());
  form.append('file',file,file.name);
  const response=await fetch('/.netlify/functions/wavespeed-bridge',{method:'POST',headers:{'Authorization':`Bearer ${state.session.access_token}`},body:form});
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body.error || `No se pudo subir la imagen (Error ${response.status}).`);
  return body.downloadUrl;
}

async function poll(taskId){
  const started=Date.now(); let wait=2200;
  while(Date.now()-started < 12*60*1000){
    const result=await api('poll',{taskId}); const status=result.status || 'processing';
    $('#result-status').textContent=status==='created'?'En cola':status==='processing'?'Procesando':status;
    if(status==='completed') return result;
    if(['failed','cancelled','timeout','deleted'].includes(status)) throw new Error(result.error || `La tarea terminó con estado: ${status}`);
    await new Promise(resolve=>setTimeout(resolve,wait)); wait=Math.min(wait+350,5000);
  }
  throw new Error('La generación sigue tardando demasiado. Intenta revisar de nuevo en WaveSpeed.');
}

function showResult(url,mode,prompt){
  const isVideo=mode==='video'; const media=$('#result-media');
  media.innerHTML=isVideo?`<video src="${escapeHtml(url)}" controls playsinline></video>`:`<img src="${escapeHtml(url)}" alt="Resultado generado" />`;
  media.classList.remove('hidden'); $('#result-empty').classList.add('hidden'); $('#download-result').classList.remove('hidden'); $('#download-result').href=url; $('#download-result').download=isVideo?'gisselegeo-video.mp4':'gisselegeo-imagen.jpg'; $('#result-title').textContent=isVideo?'Video generado':'Imagen editada'; $('#result-status').textContent='Completado'; $('#result-status').className='status-pill';
  state.history.unshift({url,mode,prompt,createdAt:new Date().toISOString()}); saveHistory();
}

function renderHistory(){
  const list=$('#history-list'); if(!state.history.length){list.innerHTML='<p class="empty-history">Aún no hay generaciones.</p>';return;}
  list.innerHTML=state.history.map(item=>`<article class="history-item">${item.mode==='video'?`<video class="history-thumb" src="${escapeHtml(item.url)}" muted></video>`:`<img class="history-thumb" src="${escapeHtml(item.url)}" alt="" />`}<div class="history-info"><strong>${item.mode==='video'?'Video':'Edición'}</strong><small>${escapeHtml(item.prompt)}</small></div><a class="history-open" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Abrir</a></article>`).join('');
}

function useFile(file){
  if(!file) return; if(!/^image\/(jpeg|png|webp)$/.test(file.type)){setMessage('Usa una imagen JPG, PNG o WEBP.','error');return;} if(file.size>5*1024*1024){setMessage('La imagen supera 5 MB. Comprímela o elige una más pequeña.','error');return;}
  state.file=file; if(state.previewUrl) URL.revokeObjectURL(state.previewUrl); state.previewUrl=URL.createObjectURL(file); $('#image-preview').src=state.previewUrl; $('#image-preview').classList.remove('hidden'); $('#remove-image').classList.remove('hidden'); validate();
}

document.querySelectorAll('.mode-option').forEach(button=>button.addEventListener('click',()=>{ state.mode=button.dataset.mode; document.querySelectorAll('.mode-option').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-checked',String(active));}); const video=state.mode==='video'; $('#image-model-field').classList.toggle('hidden',video); $('#video-quality-field').classList.toggle('hidden',!video); $('#duration-field').classList.toggle('hidden',!video); $('#video-cost').classList.toggle('hidden',!video); promptInput.placeholder=video?'Describe el movimiento, la cámara y la acción del video…':'Describe exactamente qué deseas cambiar y qué debe conservarse…'; updateVideoCost(); validate(); }));
$('#duration').addEventListener('change',updateVideoCost); $('#video-quality').addEventListener('change',updateVideoCost);
keyInput.value=sessionStorage.getItem('gisselegeo-wavespeed-key') || ''; keyInput.addEventListener('input',()=>{sessionStorage.setItem('gisselegeo-wavespeed-key',keyInput.value);validate();}); promptInput.addEventListener('input',()=>{$('#prompt-count').textContent=`${promptInput.value.length} / 5000`;validate();});
$('#toggle-key').addEventListener('click',e=>{const show=keyInput.type==='password';keyInput.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Ver';});
fileInput.addEventListener('change',()=>useFile(fileInput.files[0])); ['dragenter','dragover'].forEach(name=>$('#dropzone').addEventListener(name,e=>{e.preventDefault();$('#dropzone').classList.add('dragover')})); ['dragleave','drop'].forEach(name=>$('#dropzone').addEventListener(name,e=>{e.preventDefault();$('#dropzone').classList.remove('dragover')})); $('#dropzone').addEventListener('drop',e=>useFile(e.dataTransfer.files[0]));
$('#remove-image').addEventListener('click',e=>{e.preventDefault();state.file=null;fileInput.value='';$('#image-preview').classList.add('hidden');$('#remove-image').classList.add('hidden');validate();});
$('#clear-history').addEventListener('click',()=>{state.history=[];saveHistory();});

generateButton.addEventListener('click',async()=>{
  if(generateButton.disabled)return; setMessage(); $('#result-status').textContent='Preparando'; $('#result-status').className='status-pill muted'; setBusy(true);
  try{
    const imageUrl=await uploadReference(state.file); setBusy(true,'Enviando tarea…'); setMessage('Imagen lista. Enviando la generación a WaveSpeed…');
    const payload=state.mode==='edit'?{mode:'edit',prompt:promptInput.value.trim(),imageUrl}:{mode:'video',prompt:promptInput.value.trim(),imageUrl,duration:Number($('#duration').value),resolution:$('#video-quality').value};
    const submitted=await api('submit',payload); setBusy(true,'Procesando…'); setMessage(state.mode==='video'?'Creando el video; puede tomar varios minutos…':'Editando la imagen…');
    const result=await poll(submitted.id); const url=outputUrl(result.outputs?.[0]); if(!url) throw new Error('WaveSpeed terminó, pero no devolvió un archivo utilizable.'); showResult(url,state.mode,promptInput.value.trim()); setMessage('Generación completada.','success');
  }catch(error){ setMessage(error.message || 'No se pudo generar.','error'); $('#result-status').textContent='Error'; }
  finally{setBusy(false);}
});

(async()=>{try{const auth=await requireSession();state.supabase=auth.supabase;state.session=auth.session;$('#user-email').textContent=auth.user.email || '';if((auth.user.email||'').toLowerCase()===ADMIN_EMAIL)$('#admin-link').classList.remove('hidden');$('#signout').addEventListener('click',async()=>{sessionStorage.removeItem('gisselegeo-wavespeed-key');await state.supabase.auth.signOut();location.replace('/');});renderHistory();validate();}catch(error){if(!/Sesión/.test(error.message))setMessage(error.message,'error');}})();
