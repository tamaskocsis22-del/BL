import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from '@simplewebauthn/server';
const ORIGIN='https://bl-driver-journal.cleareagle258.chatgpt.site', RP=new URL(ORIGIN).hostname;
const COOKIE='__Host-bl-unlock';
const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const hash=async s=>b64(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const token=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const cookie=(s,clear=false)=>`${COOKIE}=${s}; Path=/; Secure; HttpOnly; SameSite=Strict${clear?'; Max-Age=0':''}`;
async function session(request,db,user){const value=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!value||value.length>100)return null;return db.prepare('SELECT id,expires FROM bl_unlock_sessions WHERE id=? AND user=? AND expires>?').bind(await hash(value),user,Date.now()).first()}
async function issue(db,user){const t=token();await db.prepare('INSERT INTO bl_unlock_sessions (id,user,expires) VALUES (?,?,?)').bind(await hash(t),user,Date.now()+12*3600000).run();return json({ok:true},200,{'Set-Cookie':cookie(t)})}
export async function authGate(request,env,LOCK){
 const url=new URL(request.url),path=url.pathname,api=path.startsWith('/api/passkey/');
 // Sites supplies this header only after its own private-account sign-in.
 const identity=request.headers.get('oai-authenticated-user-id');
 if(!identity)return json({error:'A folytatáshoz jelentkezz be a saját ChatGPT-fiókoddal.'},401);
 if(!env.DB)return json({error:'A biztonságos feloldás átmenetileg nem érhető el.'},503);
 const user=await hash(identity),db=env.DB;
 try {
 const rows=(await db.prepare('SELECT * FROM bl_credentials WHERE user=?').bind(user).all()).results;
 const unlocked=await session(request,db,user);
 if(!api){if(path==='/hero-image')return null;if(rows.length&&!unlocked){if(path.startsWith('/api/'))return json({error:'Oldd fel a munkanaplót.',locked:true},423);return new Response(LOCK,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'}})}return null}
 if(path==='/api/passkey/status'&&request.method==='GET')return json({enrolled:rows.length>0,count:rows.length,unlocked:!!unlocked,expires:unlocked?.expires||null});
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(url.origin!==ORIGIN||request.headers.get('Origin')!==ORIGIN)return json({error:'Forbidden'},403);
 const raw=await request.text();if(raw.length>32768)return json({error:'Too large'},413);
 let body;try{body=JSON.parse(raw||'{}')}catch{return json({error:'Invalid JSON'},400)}
 const action=path.slice('/api/passkey/'.length);
 if(action==='lock'){if(unlocked)await db.prepare('DELETE FROM bl_unlock_sessions WHERE id=?').bind(unlocked.id).run();return json({ok:true},200,{'Set-Cookie':cookie('',true)})}
 const reg=action.startsWith('register/');
 if(!['register/options','register/verify','unlock/options','unlock/verify'].includes(action))return json({error:'Not found'},404);
 if(reg&&rows.length&&!unlocked)return json({error:'Új kulcs hozzáadásához előbb oldd fel a munkanaplót.'},423);
 if(reg&&rows.length>=5)return json({error:'Legfeljebb 5 hozzáférési kulcs regisztrálható.'},409);
 if(!reg&&!rows.length)return json({error:'Előbb regisztrálj egy hozzáférési kulcsot.'},409);
 await db.batch([db.prepare('DELETE FROM bl_challenges WHERE expires<?').bind(Date.now()),db.prepare('DELETE FROM bl_unlock_sessions WHERE expires<?').bind(Date.now())]);
 if(action.endsWith('/options')){
 const pending=await db.prepare('SELECT count(*) AS n FROM bl_challenges WHERE user=?').bind(user).first();if(pending.n>=10)return json({error:'Túl sok próbálkozás. Várj 5 percet.'},429);
 const options=reg?await generateRegistrationOptions({rpName:'Black Limousine munkanapló',rpID:RP,userID:enc.encode(user),userName:'Saját munkanapló',attestationType:'none',excludeCredentials:rows.map(r=>({id:r.id,transports:JSON.parse(r.transports)})),supportedAlgorithmIDs:[-7,-257],authenticatorSelection:{residentKey:'preferred',userVerification:'required',authenticatorAttachment:'platform'}}):await generateAuthenticationOptions({rpID:RP,userVerification:'required',allowCredentials:rows.map(r=>({id:r.id,transports:JSON.parse(r.transports)}))});
 const id=token();await db.prepare('INSERT INTO bl_challenges (id,user,kind,challenge,expires) VALUES (?,?,?,?,?)').bind(id,user,reg?'register':'unlock',options.challenge,Date.now()+300000).run();return json({id,options});
 }
 if(typeof body.id!=='string'||!body.response)return json({error:'Hiányos hitelesítési válasz.'},400);
 // DELETE RETURNING consumes the challenge atomically, including failed attempts.
 const challenge=await db.prepare('DELETE FROM bl_challenges WHERE id=? AND user=? AND kind=? AND expires>? RETURNING challenge').bind(body.id,user,reg?'register':'unlock',Date.now()).first();
 if(!challenge)return json({error:'A kérés lejárt vagy már felhasználták. Próbáld újra.'},400);
 if(reg){const v=await verifyRegistrationResponse({response:body.response,expectedChallenge:challenge.challenge,expectedOrigin:ORIGIN,expectedRPID:RP,requireUserVerification:true});if(!v.verified||!v.registrationInfo)return json({error:'A regisztráció nem igazolható.'},400);const c=v.registrationInfo.credential;await db.prepare('INSERT INTO bl_credentials (id,user,public_key,counter,transports,created) VALUES (?,?,?,?,?,?)').bind(c.id,user,b64(c.publicKey),c.counter,JSON.stringify(c.transports||[]),Date.now()).run();}
 else{const c=rows.find(r=>r.id===body.response.id);if(!c)return json({error:'Ismeretlen hozzáférési kulcs.'},400);const v=await verifyAuthenticationResponse({response:body.response,expectedChallenge:challenge.challenge,expectedOrigin:ORIGIN,expectedRPID:RP,requireUserVerification:true,credential:{id:c.id,publicKey:un64(c.public_key),counter:c.counter,transports:JSON.parse(c.transports)}});if(!v.verified)return json({error:'A feloldás nem igazolható.'},400);const result=await db.prepare('UPDATE bl_credentials SET counter=? WHERE id=? AND user=? AND counter=?').bind(v.authenticationInfo.newCounter,c.id,user,c.counter).run();if(result.meta.changes!==1)return json({error:'Párhuzamos feloldás. Próbáld újra.'},409);}
 return await issue(db,user);
 }catch{return json({error:'A hitelesítés nem sikerült. Próbáld újra; ha ismétlődik, hagyd meg a meglévő kulcsodat.'},400)}
}
