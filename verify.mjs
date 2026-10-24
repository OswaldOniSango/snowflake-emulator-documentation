import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const load=n=>JSON.parse(readFileSync(new URL('./dist/'+n,import.meta.url),'utf8'));
const n=load('native.json'),e=load('emulator.json'),raw=load('duckdb-functions.json');
assert.equal(n.length,947);assert.equal(new Set(n.map(i=>i.name)).size,947);
assert.equal(e.length,15);assert.equal(e.filter(i=>i.origin==='translation').length,13);assert.equal(e.filter(i=>i.origin==='session').length,2);
assert.equal(raw.functions.length,2950);
for(const [type,count] of Object.entries({scalar:616,aggregate:88,table:89,macro:118,table_macro:4,pragma:45})) assert.equal(n.filter(i=>i.types.includes(type)).length,count);
for(const i of e){assert.ok(i.syntax&&i.target&&i.example&&i.result&&i.limitation);assert.ok(['partial','verified'].includes(i.status));}
for(const i of n){assert.ok(i.signatures.length);for(const s of i.signatures) assert.ok(i.types.includes(s.type));}
for(const name of ['LISTAGG','FLATTEN','TO_VARIANT','DATEADD','DATEDIFF']) assert.equal(e.find(i=>i.name===name).status,'partial');
for(const f of ['index.html','styles.css','app.js','icon.svg','native.json','emulator.json','duckdb-functions.json','inventario-funciones.md','reference.json','en.json','i18n.js']) assert.ok(existsSync(new URL('./dist/'+f,import.meta.url)));
execFileSync(process.execPath,['--check',new URL('./dist/app.js',import.meta.url).pathname]);
execFileSync(process.execPath,['--check',new URL('./dist/i18n.js',import.meta.url).pathname]);
console.log('PASS: conteos, firmas, 15 fichas, limitaciones, recursos y sintaxis JavaScript');
