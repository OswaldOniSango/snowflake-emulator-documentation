import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createApp,textNodes} from './harness.mjs';
const refs=JSON.parse(readFileSync(new URL('../dist/reference.json',import.meta.url))).entries;
const functions=JSON.parse(readFileSync(new URL('../dist/emulator.json',import.meta.url)));

test('English preference is restored and translates navigation and page metadata',async()=>{
 const app=await createApp('en');
 assert.equal(app.document.documentElement.lang,'en');
 assert.equal(app.document.querySelector('h1').textContent,'Emulator SQL reference');
 assert.match(app.document.title,/Emulator SQL reference/);
 assert.equal(app.document.querySelector('#globalSearch').getAttribute('aria-label'),'Search all documentation');
 assert.equal(app.document.querySelector('[data-nav="sql"]').textContent.trim(),'Command reference 35');
});

test('switching languages preserves route, filters, input and SQL examples',async()=>{
 const app=await createApp();app.route('#statement/with');
 const sql=[...app.document.querySelectorAll('code')].map(n=>n.textContent);
 for(let i=0;i<3;i++){
  app.window.DocLanguage.setLanguage('en');
  assert.equal(app.document.querySelector('#limitations').textContent,'Emulator limitations');
  assert.equal(app.location.hash,'#statement/with');
  assert.deepEqual([...app.document.querySelectorAll('code')].map(n=>n.textContent),sql);
  assert.equal(app.data.get('emulator-docs-language'),'en');
  app.window.DocLanguage.setLanguage('es');
  assert.equal(app.document.querySelector('#limitations').textContent,'Limitaciones del emulador');
 }
 app.route('#catalog');app.document.querySelector('#catalogSearch').value='COPY';
 vm.runInContext("query='COPY';filterOrigin='reference';renderResults()",app.context);
 const rows=app.document.querySelector('#results').textContent;
 app.window.DocLanguage.setLanguage('en');
 assert.equal(app.document.querySelector('#catalogSearch').value,'COPY');
 assert.equal(vm.runInContext('filterOrigin',app.context),'reference');
 assert.match(rows,/COPY INTO/);
 assert.ok(app.document.querySelector('a[href="#statement/copy-into"]'));
});

test('all SQL and function detail pages translate without Spanish prose leaks',async()=>{
 const app=await createApp('en');
 const routes=['#overview','#catalog','#translations','#session','#native','#native/table_macro','#sql','#udf','#limits','#method','#missing',...refs.map(i=>'#statement/'+i.id),...functions.map(i=>'#function/emulator/'+i.name),'#function/native/abs','#function/native/listagg'];
 for(const route of routes){
  app.route(route);
  assert.ok(app.document.querySelector('h1'),route);
  const leaks=textNodes(app.document).filter(t=>t!=='Español'&&(/[áéíóúñ]|\b(el|las|los|del|para|se|por|una|sin|nombre|cargando|de)\b/i.test(t)));
  assert.deepEqual(leaks,[],route);
 }
});

test('global search includes commands and English descriptions',async()=>{
 const app=await createApp('en');app.route('#catalog');
 vm.runInContext("query='loads';filterOrigin='reference';renderResults()",app.context);
 assert.ok(app.document.querySelector('#results a[href="#statement/copy-into"]'));
 vm.runInContext("query='WITH';filterOrigin='reference';renderResults()",app.context);
 assert.ok(app.document.querySelector('#results a[href="#statement/with"]'));
});

test('COPY INTO exposes partial-load and validation-mode limitations in both languages',async()=>{
 const app=await createApp();app.route('#statement/copy-into');
 assert.match(app.document.querySelector('#content').textContent,/VALIDATION_MODE/);
 assert.match(app.document.querySelector('#content').textContent,/no evita INSERT/);
 app.window.DocLanguage.setLanguage('en');
 assert.match(app.document.querySelector('#content').textContent,/does not prevent INSERT/);
 assert.match(app.document.querySelector('#content').textContent,/atomicity is not guaranteed/);
 assert.match(app.document.querySelector('#content').textContent,/not a Snowflake regular expression/);
});

test('SQL reference has unique entries and bilingual descriptions and limitations',()=>{
 assert.equal(refs.length,35);assert.equal(new Set(refs.map(i=>i.id)).size,refs.length);
 for(const i of refs){for(const lang of ['es','en']){assert.ok(i.description[lang],i.id);assert.ok(i.limitations[lang],i.id)}assert.ok(i.syntax&&i.example&&i.source,i.id)}
 for(const id of ['with','copy-into','ctas','stage','session-variables','scripting'])assert.ok(refs.some(i=>i.id===id));
});
