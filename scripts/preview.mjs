import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||8462);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8'};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(!file.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch(error){res.writeHead(error instanceof URIError?400:404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Documentación: http://127.0.0.1:${server.address().port}/`));
