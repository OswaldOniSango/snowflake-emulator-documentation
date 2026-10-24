/* Localize documentation prose and controls while preserving SQL, identifiers and catalog data. */
(() => {
  let language='es';
  try { if(localStorage.getItem('emulator-docs-language')==='en')language='en'; } catch {}
  const textSources=new WeakMap(),attributeSources=new WeakMap();
  let dictionary={};
  function english(text){
    if(dictionary[text])return dictionary[text];
    const title=text.match(/^(.*)( \| Snowflake Emulator)$/s);
    if(title)return english(title[1])+title[2];
    const arrow=text.match(/^(←\s*)(.*)$|^(.*?)(\s*[→↗])$/s);
    if(arrow)return arrow[1]?arrow[1]+english(arrow[2]):english(arrow[3])+arrow[4];
    const count=text.match(/^(\d[\d.,]*) (resultado|resultados)$/);
    if(count)return count[1]+' '+(count[2]==='resultado'?'result':'results');
    const range=text.match(/^(\d+–\d+) de (\d+)$/);
    if(range)return range[1]+' of '+range[2];
    const signature=text.match(/^FIRMA (\d+) · (.*)$/);
    if(signature)return 'SIGNATURE '+signature[1]+' · '+english(signature[2]);
    if(text.startsWith('Copiar '))return 'Copy '+english(text.slice(7));
    if(text.startsWith('REFERENCIA / '))return 'REFERENCE / '+english(text.slice(13));
    if(text.startsWith('DUCKDB / '))return 'DUCKDB / '+english(text.slice(9));
    if(text.includes(' · '))return text.split(' · ').map(english).join(' · ');
    return text;
  }
  function translate(text){return language==='en'?english(String(text??'')):String(text??'');}
  function transform(value,record){
    const source=record&&record.last===value?record.source:value;
    const match=source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const last=match[1]+translate(match[2])+match[3];
    return {source,last};
  }
  function refresh(){
    document.documentElement.lang=language;
    document.documentElement.normalize();
    const walker=document.createTreeWalker(document.documentElement,4);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(node.parentElement?.closest('code:not([data-i18n-prose]),script,style,textarea,.native-description,[data-no-i18n]'))continue;
      const record=transform(node.textContent,textSources.get(node));
      textSources.set(node,record);
      if(node.textContent!==record.last)node.textContent=record.last;
    }
    for(const element of document.querySelectorAll('[aria-label],[placeholder],[title],meta[name="description"]')){
      const records=attributeSources.get(element)||{};
      for(const attr of ['aria-label','placeholder','title',...(element.matches('meta[name="description"]')?['content']:[])]){
        if(!element.hasAttribute(attr))continue;
        const record=transform(element.getAttribute(attr),records[attr]);records[attr]=record;
        if(element.getAttribute(attr)!==record.last)element.setAttribute(attr,record.last);
      }
      attributeSources.set(element,records);
    }
    const picker=document.getElementById('languageSelect');if(picker)picker.value=language;
  }
  function setLanguage(value){
    if(!['es','en'].includes(value))return;
    language=value;try{localStorage.setItem('emulator-docs-language',language)}catch{}
    refresh();
  }
  document.getElementById('languageSelect').addEventListener('change',e=>setLanguage(e.target.value));
  const ready=fetch('en.json').then(r=>{if(!r.ok)throw Error('language');return r.json()}).then(d=>{dictionary=d;refresh()}).catch(()=>{language='es';refresh();const picker=document.getElementById('languageSelect');picker.disabled=true;picker.title='English is temporarily unavailable. Reload to retry.';});
  window.DocLanguage={refresh,setLanguage,translate,english,ready,get language(){return language}};
})();
