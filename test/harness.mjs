import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
export async function createApp(language='es',withI18n=true){
 const {document,Event}=parseHTML(readFileSync(new URL('index.html',root),'utf8'));
 const data=new Map([['emulator-docs-language',language]]);
 const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
 const location={hash:''};const listeners={};
 const window={document,location,localStorage,scrollTo(){},addEventListener:(n,f)=>{listeners[n]=f}};
 const context=vm.createContext({window,document,location,localStorage,URLSearchParams,URL,setTimeout,clearTimeout,console,navigator:{clipboard:{writeText:async()=>{}}},fetch:async file=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL(file,root),'utf8'))})});
 if(withI18n)vm.runInContext(readFileSync(new URL('i18n.js',root),'utf8'),context);
 vm.runInContext(readFileSync(new URL('app.js',root),'utf8'),context);
 if(withI18n)await window.DocLanguage.ready;
 await new Promise(r=>setTimeout(r,5));
 return {document,context,window,location,data,Event,route(hash){location.hash=hash;vm.runInContext('render()',context);},sourceText(){return document.body.textContent;}};
}
export function textNodes(document){
 document.documentElement.normalize();
 const walker=document.createTreeWalker(document.documentElement,4);const out=[];
 while(walker.nextNode()) {const n=walker.currentNode;if(n.parentElement?.closest('code:not([data-i18n-prose]),script,style,textarea,.native-description,[data-no-i18n]'))continue;const text=n.textContent.trim();if(text)out.push(text);}
 for(const n of document.querySelectorAll('[aria-label],[placeholder],[title],meta[name="description"]'))for(const a of ['aria-label','placeholder','title','content']){const v=n.getAttribute(a);if(v)out.push(v)}
 return out;
}
