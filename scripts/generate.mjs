import {readFileSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';
const client=await build({entryPoints:['scripts/passkey-client.js'],bundle:true,write:false,format:'iife',platform:'browser',minify:true});
const script='<script>'+client.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>';
const html=readFileSync('index.html','utf8').replace('<!--PASSKEY_SCRIPT-->',script);
const lock=readFileSync('lock.html','utf8').replace('<!--PASSKEY_SCRIPT-->',script);
writeFileSync('worker/entry.js','const HTML='+JSON.stringify(html)+';\nconst LOCK='+JSON.stringify(lock)+';\nconst HERO='+readFileSync('worker/hero.json','utf8')+';\n'+readFileSync('worker/proxy.js','utf8'));
await build({entryPoints:['worker/entry.js'],outfile:'worker/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
