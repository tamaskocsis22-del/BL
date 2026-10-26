import {readFileSync,writeFileSync} from 'node:fs';
writeFileSync('worker/index.js','const HTML='+JSON.stringify(readFileSync('index.html','utf8'))+';\nconst HERO='+readFileSync('worker/hero.json','utf8')+';\n'+readFileSync('worker/proxy.js','utf8'));
