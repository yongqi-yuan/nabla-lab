import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {inspectPage,validateArticles} from './editor/editor-core.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const maxBody=40*1024*1024;
function inside(parent,file){return file===parent||file.startsWith(parent+path.sep);}
function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function atomicJSON(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.tmp-'+process.pid;fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(temporary,file);}
function publicState(folder){const cached=path.join(folder,'.local-studio/published.json');if(fs.existsSync(cached))return readJSON(cached);return {edits:readJSON(path.join(folder,'site-edits.json')),articles:readJSON(path.join(folder,'editorial-articles.json'))};}
function validateState(state,folder,{published=false}={}){
  if(!state?.edits||state.edits.version!==1||!state.edits.pages||!state.edits.shared||!Array.isArray(state.articles?.articles))throw Error('草稿格式无效。');
  const manifest=readJSON(path.join(folder,'.local-studio/manifest.json'));
  const scan=(fields)=>{if(!fields||Array.isArray(fields)||Object.entries(fields).some(([k,v])=>!/^(main|shared)-[a-z]+-[a-z0-9]+-\d+$/.test(k)||typeof v!=='string'||v.length>100000))throw Error('编辑字段格式无效。');};
  for(const lang of ['en','zh'])scan(state.edits.shared[lang]);
  for(const [url,record] of Object.entries(state.edits.pages)){
    const en=url.startsWith('/zh/')?url.slice(3):url,p=manifest.pages.find(p=>p.url===en);
    if(!p)throw Error('草稿包含未知页面。');scan(record.fields);
    if(record.blocks&&Object.entries(record.blocks).some(([key,v])=>!/^block-[a-z0-9]+-\d+$/.test(key)||typeof v!=='string'||v.length>100000))throw Error('段落格式无效。');
    const lang=url.startsWith('/zh/')?'zh':'en';
    inspectPage(fs.readFileSync(path.join(folder,'.local-studio',p.base[lang].replace('/admin/','')),'utf8'),record.fields,state.edits.shared[lang]);
  }
  for(const article of state.articles.articles)if(typeof article.id!=='string'||!['draft','published'].includes(article.status)||!article.zh||!article.en)throw Error('文章格式无效。');
  validateArticles({...state.articles,articles:state.articles.articles.filter(a=>a.status==='published')});
  if(published&&state.articles.articles.some(a=>a.status!=='published'))throw Error('本机草稿不能进入发布文件。');
  return {edits:state.edits,articles:state.articles};
}
function validateImages(images=[]){
  if(!Array.isArray(images))throw Error('图片列表无效。');
  return images.map(image=>{
    if(!/^\/assets\/uploads\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|gif)$/.test(image.path)||typeof image.base64!=='string'||!/^[a-zA-Z0-9+/=\s]+$/.test(image.base64))throw Error('图片格式或路径无效。');
    const data=Buffer.from(image.base64,'base64');if(data.length>5*1024*1024)throw Error('图片超过 5 MB。');
    const start=data.subarray(0,12).toString('latin1');if(!(start.startsWith('\x89PNG')||start.startsWith('\xff\xd8\xff')||start.startsWith('GIF8')||(start.startsWith('RIFF')&&start.slice(8,12)==='WEBP')))throw Error('图片内容无效。');
    return {path:image.path,base64:image.base64,size:data.length};
  });
}
function sanitizeDraft(payload,folder){
  const state=validateState(payload.state,folder),base=validateState(payload.base,folder,{published:true});
  return {version:1,state,base,images:validateImages(payload.images),date:new Date().toISOString()};
}
async function bodyJSON(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>maxBody){const error=Error('草稿过大，请减少图片或分批发布。');error.status=413;throw error;}chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.pdf':'application/pdf','.bib':'text/plain; charset=utf-8'};
export function createStudioServer(folder=root){
  const local=path.join(folder,'.local-studio');fs.mkdirSync(local,{recursive:true});
  const previewFile=path.join(local,'preview-mode.json'),preview=fs.existsSync(previewFile)?readJSON(previewFile):{};
  const draftName=preview.previewOnly?'review-draft.json':'draft.json',draftFile=path.join(local,draftName);
  const server=http.createServer(async(req,res)=>{
    const origin='http://127.0.0.1:'+server.address().port;
    const send=(status,body,type='text/plain; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','X-Frame-Options':'SAMEORIGIN'});res.end(body);};
    const json=(status,data)=>send(status,JSON.stringify(data),'application/json; charset=utf-8');
    try{
      // A fixed loopback host prevents LAN access and DNS rebinding.
      if(req.headers.host!==new URL(origin).host)return send(403,'此编辑器仅允许本机地址。');
      const pathname=decodeURIComponent(new URL(req.url,origin).pathname);
      if(req.method==='OPTIONS')return send(403,'不允许跨站访问。');
      if(req.method==='POST'){
        // JSON + explicit header + exact Origin prevent a remote website from writing local files.
        if(req.headers.origin!==origin||req.headers['x-nabla-studio']!=='local'||!req.headers['content-type']?.startsWith('application/json'))return send(403,'不允许跨站写入。');
        const payload=await bodyJSON(req);
        if(pathname==='/local-api/save'){
          const draft=sanitizeDraft(payload,folder);if(fs.existsSync(draftFile))fs.copyFileSync(draftFile,path.join(local,draftName.replace('.json','.previous.json')));
          atomicJSON(draftFile,draft);return json(200,{saved:true,date:draft.date});
        }
        if(pathname==='/local-api/record-publication'){
          const candidate=validateState(payload.candidate,folder,{published:true}),images=validateImages(payload.images);
          if(!/^[a-f0-9]{40}$/.test(payload.sha||''))throw Error('发布记录无效。');
          const history=path.join(local,'history',payload.sha);fs.mkdirSync(history,{recursive:true});
          for(const file of ['site-edits.json','editorial-articles.json'])fs.copyFileSync(path.join(folder,file),path.join(history,file));
          for(const image of images){const destination=path.join(folder,'docs',image.path);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,Buffer.from(image.base64,'base64'));}
          const manifestFile=path.join(local,'manifest.json'),manifest=readJSON(manifestFile);manifest.assets=[...new Set([...(manifest.assets||[]),...images.map(image=>image.path)])];atomicJSON(manifestFile,manifest);
          atomicJSON(path.join(folder,'site-edits.json'),candidate.edits);atomicJSON(path.join(folder,'editorial-articles.json'),candidate.articles);atomicJSON(path.join(local,'published.json'),candidate);
          if(payload.draft)atomicJSON(draftFile,sanitizeDraft(payload.draft,folder));else if(fs.existsSync(draftFile))fs.unlinkSync(draftFile);
          return json(200,{recorded:true});
        }
        return send(404,'Not found');
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return send(405,'Method not allowed');
      if(req.headers.origin&&req.headers.origin!==origin)return send(403,'不允许跨站读取。');
      if(pathname==='/local-api/health')return json(200,{app:'nabla-local-studio',local:true});
      if(pathname==='/admin/manifest.json'){const manifest=readJSON(path.join(local,'manifest.json'));const flag=path.join(local,'preview-mode.json');return json(200,{...manifest,...(fs.existsSync(flag)?readJSON(flag):{})});}
      if(pathname==='/admin/state.json'){
        const current=publicState(folder);return json(200,fs.existsSync(draftFile)?{...readJSON(draftFile),current}:{version:1,state:current,base:current,images:[]});
      }
      let base,relative;
      if(pathname==='/admin/manifest.json'){base=local;relative='manifest.json';}
      else if(pathname.startsWith('/admin/base/')){base=local;relative=pathname.replace('/admin/','');}
      else if(pathname.startsWith('/admin/')){base=path.join(folder,'editor');relative=pathname.slice('/admin/'.length)||'index.html';}
      else {base=path.join(folder,'docs');relative=pathname.slice(1);}
      let file=path.resolve(base,relative);if(!inside(base,file)||relative.split('/').some(s=>s.startsWith('.')))return send(403,'Forbidden');
      if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,'Not found');
      if(!inside(fs.realpathSync(base),fs.realpathSync(file)))return send(403,'Forbidden');
      send(200,req.method==='HEAD'?'':fs.readFileSync(file),types[path.extname(file)]||'application/octet-stream');
    }catch(error){json(error.status||400,{error:error.message||'本地操作失败。'});}
  });return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  execFileSync(process.execPath,['build.mjs'],{cwd:root,stdio:'inherit'});
  const server=createStudioServer();const port=6178;
  server.on('error',async error=>{
    if(error.code==='EADDRINUSE')try{const response=await fetch(`http://127.0.0.1:${port}/local-api/health`);if((await response.json()).app==='nabla-local-studio'){console.log('Nabla 本地编辑器已在运行。');if(process.argv.includes('--open'))spawn('open',[`http://127.0.0.1:${port}/admin/`],{stdio:'ignore'});return;}}catch{}
    console.error('无法打开本地编辑器：'+error.message);process.exitCode=1;
  });
  server.listen(port,'127.0.0.1',()=>{console.log(`Nabla 本地编辑器：http://127.0.0.1:${port}/admin/\n草稿仅保存在本机；点击发布后才上传。关闭此窗口可停止编辑器。`);if(process.argv.includes('--open'))spawn('open',[`http://127.0.0.1:${port}/admin/`],{stdio:'ignore'});});
}
