import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const scripts=[...readFileSync('index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
let now=1800000000000;class Clock extends Date{static now(){return now}}
const els={},handlers={},timers=new Map();let tid=0;
const el=id=>els[id]??={value:id==='period'?'all':id==='title'?'BTRF':'',elements:[],files:[],style:{},textContent:'',addEventListener(){},reset(){},hidden:false};
const c={document:{getElementById:el,hidden:false,addEventListener:(n,f)=>handlers[n]=f},window:{isSecureContext:true,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{onLine:true,geolocation:{getCurrentPosition(ok){ok({coords:{latitude:47.5,longitude:19.1,accuracy:10},timestamp:now})}}},crypto,Date:Clock,console,Blob,TextEncoder,setTimeout:(f,ms)=>{timers.set(++tid,{f,ms});return tid},clearTimeout:id=>timers.delete(id),AbortSignal,alert(){}};vm.createContext(c);vm.runInContext(scripts,c);const run=s=>vm.runInContext(s,c);
assert.equal(timers.size,0,'No recurring timers while idle');
await el('jobForm').onsubmit({preventDefault(){}});assert.ok(run('state.active.startPoint'));assert.equal(run('state.active.title'),'BTRF');assert.equal(run('state.active.distanceSource'),'gps');
now+=3600000;await el('pause').onclick();assert.equal(run('fee(state.active)'),3000);now+=1800000;assert.equal(run('fee(state.active)'),3000,'Paused time not billed');
assert.equal([...timers.values()].filter(t=>t.ms===60000||t.ms===15000).length,0,'Pause cancels GPS and clock');
await el('pause').onclick();now+=1800000;await el('stop').onclick();assert.equal(run('state.active'),null);assert.equal(run('state.jobs[0].pauses.length'),1);assert.equal(run('fee(state.jobs[0])'),4500,'2 hours minus 30 min pause');assert.ok(run('state.jobs[0].endPoint'));assert.equal(run('duration(state.jobs[0])'),5400000);
assert.equal(run('fee({start:0,end:3600000})'),3000,'Old records still bill correctly');
await el('jobForm').onsubmit({preventDefault(){}});c.document.hidden=true;handlers.visibilitychange();assert.equal([...timers.values()].filter(t=>[15000,60000].includes(t.ms)).length,0,'Hidden view suspends GPS and display timers');
assert.ok(run('kmBetween({lat:0,lng:0},{lat:0,lng:1})')>111);
assert.equal(run('withPoint({gpsKm:0,lastPoint:{lat:0,lng:0,accuracy:10,measuredAt:1000}},{lat:0,lng:1,accuracy:10,measuredAt:301000}).gpsKm'),0,'Do not count background gap as measured road distance');
console.log('PASS: GPS start/end, pause/resume billing, old records, idle/paused/hidden timers, GPS gaps.');
