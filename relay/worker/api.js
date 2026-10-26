const TTL=12*60*60*1000;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const validID=s=>/^[a-f0-9-]{36}$/.test(s);
export async function api(request,env){
 const u=new URL(request.url),internal=u.pathname.startsWith('/internal/');
 if(internal&&(!env.LIVE_RELAY_SECRET||request.headers.get('X-BL-Service-Key')!==env.LIVE_RELAY_SECRET))return json({error:'Forbidden'},403);
 if(!env.BUCKET)return json({error:'Storage unavailable'},503);
 if(internal&&request.method!=='POST')return json({error:'Method'},405);
 if(!internal&&request.method!=='GET')return json({error:'Method'},405);
 let body={};if(internal){const text=await request.text();if(text.length>4096)return json({error:'Too large'},413);try{body=JSON.parse(text)}catch{return json({error:'Invalid JSON'},400)}}
 if(u.pathname==='/internal/create'){
  const id=crypto.randomUUID(),token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join(''),expiresAt=Date.now()+TTL;
  await env.BUCKET.put('meta/'+id,JSON.stringify({tokenHash:await digest(token),expiresAt,createdAt:Date.now()}));
  return json({id,token,expiresAt,url:u.origin+'/#id='+id+'&token='+token});
 }
 const id=internal?body.id:u.pathname.split('/')[3];if(!id||!validID(id))return json({error:'Not found'},404);
 const obj=await env.BUCKET.get('meta/'+id);if(!obj)return json({error:'Not found'},404);const meta=await obj.json();
 if(!internal&&await digest((request.headers.get('X-BL-View-Key')||''))!==meta.tokenHash)return json({error:'Not found'},404);
 if(Date.now()>=meta.expiresAt){await env.BUCKET.delete(['meta/'+id,'position/'+id,'ended/'+id,'status/'+id]);return json({error:'Expired'},410)}
 if(u.pathname==='/internal/stop'){await env.BUCKET.put('ended/'+id,'true');await env.BUCKET.delete('position/'+id);return json({status:'ended'})}
 const ended=await env.BUCKET.get('ended/'+id);
 if(u.pathname==='/internal/status'){if(ended)return json({error:'Ended'},410);if(!['active','paused'].includes(body.status))return json({error:'Invalid status'},400);await env.BUCKET.put('status/'+id,body.status);if(body.status==='paused')await env.BUCKET.delete('position/'+id);return json({ok:true});}
 const statusObject=await env.BUCKET.get('status/'+id),paused=statusObject&&(await statusObject.text())==='paused';
 if(u.pathname==='/internal/update'){
  if(ended)return json({error:'Ended'},410);if(paused)return json({error:'Paused'},409);
  const {lat,lng,accuracy,measuredAt}=body;if(![lat,lng,accuracy,measuredAt].every(Number.isFinite)||Math.abs(lat)>90||Math.abs(lng)>180||accuracy<0||accuracy>100000||measuredAt>Date.now()+10000||measuredAt<Date.now()-120000)return json({error:'Invalid position'},400);
  await env.BUCKET.put('position/'+id,JSON.stringify({lat,lng,accuracy,measuredAt,receivedAt:Date.now()}));return json({ok:true});
 }
 if(!internal&&u.pathname==='/api/live/'+id){const p=(ended||paused)?null:await env.BUCKET.get('position/'+id);return json({status:ended?'ended':paused?'paused':'active',expiresAt:meta.expiresAt,position:p?await p.json():null})}
 return json({error:'Not found'},404);
}
