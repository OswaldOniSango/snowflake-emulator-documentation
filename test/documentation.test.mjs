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
 assert.equal(app.document.querySelector('[data-nav="sql"]').textContent.trim(),'Command reference '+refs.length);
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
 const routes=['#overview','#install','#catalog','#translations','#session','#native','#native/table_macro','#sql','#udf','#limits','#method','#missing',...refs.map(i=>'#statement/'+i.id),...functions.map(i=>'#function/emulator/'+i.name),'#function/native/abs','#function/native/listagg'];
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
 assert.equal(refs.length,47);assert.equal(new Set(refs.map(i=>i.id)).size,refs.length);
 for(const i of refs){for(const lang of ['es','en']){assert.ok(i.description[lang],i.id);assert.ok(i.limitations[lang],i.id)}assert.ok(i.syntax&&i.example&&i.source,i.id)}
 for(const id of ['with','copy-into','ctas','stage','session-variables','scripting'])assert.ok(refs.some(i=>i.id===id));
});

test('installation covers persistent Docker, frontend build and first warehouse in both languages',async()=>{
 const app=await createApp();app.route('#install');
 assert.equal(app.document.querySelector('h1').textContent,'Instalar el emulador');
 const before=[...app.document.querySelectorAll('code')].map(n=>n.textContent);
 assert.match(before.join('\n'),/DB_PATH=\/data\/snowflake.db/);
 assert.match(before.join('\n'),/STAGE_DIR=\/data\/stages/);
 const source=app.document.querySelector('#source').nextElementSibling.parentElement.textContent;
 assert.ok(source.indexOf('npm --prefix _web run build')<source.indexOf('CGO_ENABLED=1 go build'));
 assert.ok(app.document.querySelector('#login').parentElement.textContent.includes('CREATE WAREHOUSE COMPUTE_WH;'));
 app.window.DocLanguage.setLanguage('en');
 assert.equal(app.document.querySelector('h1').textContent,'Install the emulator');
 assert.deepEqual([...app.document.querySelectorAll('code')].map(n=>n.textContent),before);
});

test('audit additions preserve engine boundaries and correct unsupported session commands',async()=>{
 const app=await createApp();
 for(const id of ['pivot','unpivot','lateral','cube','rollup','grouping-sets','window-functions','identifier','scripting-status','bindings']){
  app.route('#statement/'+id);
  assert.ok(app.document.querySelector('a[href^="https://docs.snowflake.com/"]'),id);
  assert.ok(refs.find(i=>i.id===id).origin,id);
 }
 const use=refs.find(i=>i.id==='use');
 assert.equal(use.syntax,'USE ROLE role_name;');
 assert.match(use.limitations.en,/USE WAREHOUSE fail/);
 assert.doesNotMatch(refs.find(i=>i.id==='grants').syntax,/SHOW GRANTS;/);
 app.route('#statement/asof-join');app.window.DocLanguage.setLanguage('en');
 assert.match(app.document.querySelector('#content').textContent,/MATCH_CONDITION is not adapted/);
 app.route('#limits');
 assert.ok(app.document.querySelector('#unsupported-commands'));
});

test('Docker guide distinguishes the working memory example from the reproduced WAL restart failure',async()=>{
 const app=await createApp();app.route('#install');
 const guide=JSON.parse(readFileSync(new URL('../dist/installation.json',import.meta.url)));
 const quick=guide.sections.find(s=>s.id==='docker');
 assert.match(quick.code,/docker pull ghcr.io/);
 assert.match(quick.code,/-v snowflake-data:\/data/);
 assert.doesNotMatch(quick.code,/DB_PATH/);
 assert.match(quick.paragraphs.map(p=>p.en).join(' '),/mounting \/data alone does not make the database persistent/);
 assert.match(app.document.querySelector('#content').textContent,/Limitación comprobada en v0.7.0/);
 app.window.DocLanguage.setLanguage('en');
 const prose=app.document.querySelector('#content').textContent;
 assert.match(prose,/Verified v0.7.0 limitation/);
 assert.match(prose,/do not delete WAL files/);
 assert.match(prose,/does not recover their data/);
});
