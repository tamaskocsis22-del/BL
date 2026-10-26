import {startRegistration,startAuthentication,browserSupportsWebAuthn} from '@simplewebauthn/browser';
let working=false;
const q=id=>document.getElementById(id);
async function api(path,body){const r=await fetch('/api/passkey/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});let d;try{d=await r.json()}catch{throw Error('A kapcsolat megszakadt. Frissítsd az oldalt.')}if(!r.ok)throw Error(d.error||'A művelet nem sikerült.');return d}
function status(t){q('securityStatus').textContent=t}
async function run(kind){if(working)return;working=true;document.querySelectorAll('[data-passkey]').forEach(b=>b.disabled=true);status('Kövesd a telefon hitelesítési ablakát…');try{const d=await api(kind+'/options',{});const response=kind==='register'?await startRegistration({optionsJSON:d.options}):await startAuthentication({optionsJSON:d.options});await api(kind+'/verify',{id:d.id,response});location.reload()}catch(e){status(e.name==='NotAllowedError'?'A hitelesítés megszakadt vagy lejárt. Próbáld újra.':e.message)}finally{working=false;document.querySelectorAll('[data-passkey]').forEach(b=>b.disabled=false)}}
q('registerKey')?.addEventListener('click',()=>run('register'));
q('unlockKey')?.addEventListener('click',()=>run('unlock'));
q('lockApp')?.addEventListener('click',async()=>{try{await api('lock',{});localStorage.setItem('bl-lock-event',String(Date.now()));location.reload()}catch(e){status(e.message)}});
(async()=>{if(!browserSupportsWebAuthn()||!window.isSecureContext){status('Ez a böngésző nem támogatja a biztonságos feloldást. Nyisd meg az alkalmazást friss Chrome-ban vagy Safariban.');document.querySelectorAll('[data-passkey]').forEach(b=>b.disabled=true);return}try{const s=await api('status');if(s.expires){const check=()=>{if(Date.now()>=s.expires)location.reload()};setTimeout(check,Math.max(0,s.expires-Date.now()));document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()})}if(q('lockApp'))q('lockApp').hidden=!s.enrolled;if(q('registerKey'))q('registerKey').textContent=s.enrolled?'Tartalék hozzáférési kulcs hozzáadása':'Ujjlenyomatos feloldás beállítása';status(s.enrolled?(s.unlocked?'Feloldva • '+s.count+' regisztrált hozzáférési kulcs.':'A munkanapló zárolva. A feloldáshoz használd a regisztrált kulcsodat.'):'A feloldás még nincs bekapcsolva. Az első kulcs regisztrálásával aktiválod.')}catch(e){status(e.message)}})();
// When the server-side session expires, do not keep displaying a previously rendered page.


window.addEventListener('storage',e=>{if(e.key==='bl-lock-event')location.reload()});
