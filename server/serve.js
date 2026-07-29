const h=require('http'),f=require('fs'),p=require('path')
const root=p.join(__dirname,'..','public')
const t={'html':'text/html','js':'application/javascript','glb':'model/gltf-binary','hdr':'image/vnd.radiance','mjs':'application/javascript'}
h.createServer((q,r)=>{
  let u=p.normalize(root+decodeURI(q.url))
  if(!u.startsWith(root)){r.writeHead(403);r.end();return}
  let u2=u.endsWith('\\')?u+'index.html':u
  try{
    const s=f.statSync(u2)
    if(!s.isFile()){r.writeHead(404);r.end();return}
    r.writeHead(200,{'Content-Type':t[p.extname(u2).slice(1)]||'application/octet-stream','Cache-Control':'no-cache'})
    f.createReadStream(u2).pipe(r)
  }catch(e){r.writeHead(404);r.end()}
}).listen(8000)
console.log('Server listening on http://localhost:8000')
