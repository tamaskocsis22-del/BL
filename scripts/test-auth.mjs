import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {encodeCBOR} from '@levischuck/tiny-cbor';
import {authGate} from '../worker/auth.js';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_careful_madelyne_pryor.sql','utf8'));
const db={prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:sql.prepare(query).run(...args)}}}}}},async batch(q){return Promise.all(q.map(x=>x.run()))}};
const origin='https://bl-driver-journal.cleareagle258.chatgpt.site',rp=new URL(origin).hostname;
const b64=x=>Buffer.from(x).toString('base64url');
const digest=x=>createHash('sha256').update(x).digest();
let cookie='';
async function call(path,body,extra={}){return authGate(new Request(origin+path,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':'test-owner','Origin':origin,'Cookie':cookie,...extra},body:body?JSON.stringify(body):undefined}),{DB:db},'<h1>LOCKED</h1>')}
const creds=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=creds.publicKey.export({format:'jwk'}),id=Buffer.alloc(32,9);
const cose=encodeCBOR(new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]));
const authData=Buffer.concat([digest(rp),Buffer.from([0x45]),Buffer.alloc(4),Buffer.alloc(16),Buffer.from([0,32]),id,Buffer.from(cose)]);
assert.equal(await call('/'),null);
assert.equal((await authGate(new Request(origin),{DB:db},'LOCK')).status,401);
assert.equal((await call('/api/passkey/register/options',{}, {Origin:'https://evil.example'})).status,403);
const reg=await (await call('/api/passkey/register/options',{})).json();
const cd=b64(JSON.stringify({type:'webauthn.create',challenge:reg.options.challenge,origin}));
const response={id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{},response:{clientDataJSON:cd,attestationObject:b64(encodeCBOR(new Map([['fmt','none'],['attStmt',new Map()],['authData',authData]]))),transports:['internal']}};
const registered=await call('/api/passkey/register/verify',{id:reg.id,response});assert.equal(registered.status,200,await registered.clone().text());cookie=registered.headers.get('Set-Cookie').split(';')[0];assert.match(registered.headers.get('Set-Cookie'),/HttpOnly/);
assert.equal(await call('/'),null);
assert.equal((await call('/api/passkey/register/verify',{id:reg.id,response})).status,400);
await call('/api/passkey/lock',{});assert.match(await (await call('/')).text(),/LOCKED/);assert.equal((await call('/api/live/create',{})).status,423);assert.equal((await call('/api/passkey/register/options',{})).status,423);
async function assertion(options,{uv=true,wrongOrigin=false,tamper=false}={}){const data=Buffer.concat([digest(rp),Buffer.from([uv?5:1]),Buffer.from([0,0,0,1])]);const cd=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:options.challenge,origin:wrongOrigin?'https://evil.example':origin}));const signature=sign('sha256',Buffer.concat([data,digest(cd)]),creds.privateKey);if(tamper)signature[signature.length-1]^=1;return {id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{},response:{authenticatorData:b64(data),clientDataJSON:b64(cd),signature:b64(signature),userHandle:null}}}
for(const bad of [{uv:false},{wrongOrigin:true},{tamper:true}]){const d=await(await call('/api/passkey/unlock/options',{})).json();assert.equal((await call('/api/passkey/unlock/verify',{id:d.id,response:await assertion(d.options,bad)})).status,400);}
const d=await(await call('/api/passkey/unlock/options',{})).json(),a=await assertion(d.options);const ok=await call('/api/passkey/unlock/verify',{id:d.id,response:a});assert.equal(ok.status,200,await ok.clone().text());cookie=ok.headers.get('Set-Cookie').split(';')[0];assert.equal(await call('/'),null);assert.equal((await call('/api/passkey/unlock/verify',{id:d.id,response:a})).status,400);
sql.exec('UPDATE bl_unlock_sessions SET expires=0');assert.match(await(await call('/')).text(),/LOCKED/);
const expired=await(await call('/api/passkey/unlock/options',{})).json();sql.exec('UPDATE bl_challenges SET expires=0');assert.equal((await call('/api/passkey/unlock/verify',{id:expired.id,response:await assertion(expired.options)})).status,400);
console.log('PASS: real WebAuthn registration + signed assertion; rejects missing identity, cross-origin, missing UV, forged signature, replay, expired challenge/session; locked APIs denied; logout revokes session.');
