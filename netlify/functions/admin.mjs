import { ADMIN_EMAIL, isAdmin, verifyUser } from './_auth.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async (request)=>{
  try{
    const user=await verifyUser(request); if(!isAdmin(user))return json({error:'No tienes permisos de administrador.'},403);
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY; const supabaseUrl=process.env.SUPABASE_URL;
    if(!serviceKey)return json({adminEmail:ADMIN_EMAIL,setupMissing:true,userCount:null,users:[]});
    const response=await fetch(`${supabaseUrl.replace(/\/$/,'')}/auth/v1/admin/users?page=1&per_page=100`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}});
    if(!response.ok)throw Object.assign(new Error('No se pudo consultar Supabase Auth.'),{status:502}); const body=await response.json(); const users=body.users||[];
    return json({adminEmail:ADMIN_EMAIL,setupMissing:false,userCount:body.total??users.length,users:users.map(item=>({email:item.email||'',createdAt:item.created_at,lastSignInAt:item.last_sign_in_at}))});
  }catch(error){return json({error:error.message||'Error interno.'},error.status||500);}
};
