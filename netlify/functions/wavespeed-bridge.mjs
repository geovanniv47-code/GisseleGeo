import { verifyUser } from './_auth.mjs';

const API_BASE = 'https://api.wavespeed.ai/api/v3';
const MODELS = { edit:'bytedance/seedream-v5.0-pro/edit', video:'bytedance/seedance-2.5/image-to-video' };
const FAILURE = new Set(['failed','cancelled','timeout','deleted']);
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const safeError=async response=>{const body=await response.json().catch(()=>null);return body?.message||body?.error||`WaveSpeed respondió con error ${response.status}.`;};

export default async (request) => {
  if(request.method!=='POST')return json({error:'Método no permitido.'},405);
  try{
    await verifyUser(request);
    const body=await request.json(); const key=String(body.waveSpeedKey||'').trim();
    if(key.length<10) return json({error:'La API key de WaveSpeed es obligatoria.'},400);
    const headers={Authorization:`Bearer ${key}`,'Content-Type':'application/json'};

    if(body.action==='upload-ticket'){
      const file=body.file||{}; const size=Number(file.size); const name=String(file.name||'reference.jpg').replace(/[^a-zA-Z0-9._-]/g,'_');
      if(!Number.isFinite(size)||size<=0||size>20*1024*1024)return json({error:'El archivo debe pesar entre 1 byte y 20 MB.'},400);
      if(!/^image\/(jpeg|png|webp)$/.test(String(file.type||'')))return json({error:'Formato de imagen no permitido.'},400);
      const response=await fetch(`${API_BASE}/media/uploads`,{method:'POST',headers,body:JSON.stringify({filename:name,size,content_type:file.type})});
      if(!response.ok)return json({error:await safeError(response)},response.status); const data=(await response.json()).data;
      return json({downloadUrl:data.download_url,upload:{method:data.upload.method,url:data.upload.url,headers:data.upload.headers}});
    }

    if(body.action==='submit'){
      const mode=body.mode; if(!MODELS[mode])return json({error:'Modo no permitido.'},400); const prompt=String(body.prompt||'').trim(); const imageUrl=String(body.imageUrl||'');
      if(!prompt||prompt.length>5000)return json({error:'El prompt debe tener entre 1 y 5000 caracteres.'},400); if(!imageUrl.startsWith('https://'))return json({error:'Falta una imagen de referencia válida.'},400);
      let payload;
      if(mode==='edit')payload={prompt,images:[imageUrl],resolution:['1k','1.5k','2k'].includes(body.resolution)?body.resolution:'1.5k',output_format:'jpeg',prompt_optimization_mode:'standard',...(body.aspectRatio?{aspect_ratio:body.aspectRatio}:{})};
      else payload={prompt,image:imageUrl,resolution:'720p',duration:[5,8,10].includes(Number(body.duration))?Number(body.duration):5,generate_audio:true};
      const response=await fetch(`${API_BASE}/${MODELS[mode]}`,{method:'POST',headers,body:JSON.stringify(payload)}); if(!response.ok)return json({error:await safeError(response)},response.status);
      const data=(await response.json()).data; if(!data?.id)return json({error:'WaveSpeed no devolvió un identificador de tarea.'},502); return json({id:data.id,status:data.status||'created'});
    }

    if(body.action==='poll'){
      const taskId=String(body.taskId||''); if(!/^[a-zA-Z0-9_-]{6,160}$/.test(taskId))return json({error:'Identificador de tarea inválido.'},400);
      const response=await fetch(`${API_BASE}/predictions/${encodeURIComponent(taskId)}/result`,{headers:{Authorization:`Bearer ${key}`}}); if(!response.ok)return json({error:await safeError(response)},response.status);
      const data=(await response.json()).data||{}; return json({status:data.status,outputs:data.status==='completed'?(data.outputs||[]):[],error:FAILURE.has(data.status)?(data.error||`Tarea ${data.status}`):undefined});
    }
    return json({error:'Acción no reconocida.'},400);
  }catch(error){return json({error:error.message||'Error interno.'},error.status||500);}
};
