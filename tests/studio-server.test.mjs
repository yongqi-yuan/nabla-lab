import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import http from 'node:http';
import {createStudioServer} from '../studio-server.mjs';
const root=path.resolve(import.meta.dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nabla-local-studio-'));
fs.cpSync(path.join(root,'docs'),path.join(tmp,'docs'),{recursive:true});
fs.cpSync(path.join(root,'editor'),path.join(tmp,'editor'),{recursive:true});
for(const file of ['site-edits.json','editorial-articles.json'])fs.copyFileSync(path.join(root,file),path.join(tmp,file));
fs.mkdirSync(path.join(tmp,'.local-studio'),{recursive:true});
for(const name of ['manifest.json','base'])fs.cpSync(path.join(root,'.local-studio',name),path.join(tmp,'.local-studio',name),{recursive:true});
const server=createStudioServer(tmp);server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const original={edits:JSON.parse(fs.readFileSync(path.join(tmp,'site-edits.json'))),articles:JSON.parse(fs.readFileSync(path.join(tmp,'editorial-articles.json')))};
const post=(route,value,headers={})=>fetch(base+route,{method:'POST',headers:{Origin:base,'X-Nabla-Studio':'local','Content-Type':'application/json',...headers},body:JSON.stringify(value)});
test.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true});});
test('editor and public previews run locally; production output excludes editor files',async()=>{
  assert.equal(server.address().address,'127.0.0.1');
  assert.equal((await fetch(base+'/admin/')).status,200);assert.equal((await fetch(base+'/zh/')).status,200);assert.equal((await fetch(base+'/admin/editor-core.mjs')).status,200);
  assert.equal(fs.existsSync(path.join(root,'docs/admin')),false);
});
test('a remote website cannot save files through this server',async()=>{
  assert.equal((await post('/local-api/save',{}, {Origin:'https://evil.example'})).status,403);
  assert.equal((await post('/local-api/save',{}, {'X-Nabla-Studio':''})).status,403);
  assert.equal((await fetch(base+'/admin/state.json',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal(fs.existsSync(path.join(tmp,'.local-studio/draft.json')),false);
});
test('unexpected hosts and paths outside allowed directories are rejected',async()=>{
  const status=await new Promise((resolve,reject)=>{const request=http.get(base+'/admin/',{headers:{Host:'evil.example'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);});
  assert.equal(status,403);assert.equal((await fetch(base+'/.git/config')).status,403);assert.notEqual((await fetch(base+'/admin/%2e%2e%2f%2e%2e%2fsite-edits.json')).status,200);
});
test('draft text and images persist on disk without changing published sources',async()=>{
  const draft=structuredClone(original);draft.articles.articles.push({id:'local-only',slug:'',author:'',date:'2026-10-19',status:'draft',zh:{title:'尚未完成的私有草稿',body:''},en:{title:'',body:''}});
  const image={path:'/assets/uploads/test.png',base64:Buffer.from('\x89PNG\r\n\x1a\n','latin1').toString('base64')};
  const response=await post('/local-api/save',{state:draft,base:original,images:[image]});assert.equal(response.status,200);
  const loaded=await (await fetch(base+'/admin/state.json')).json();assert.equal(loaded.state.articles.articles[0].zh.title,'尚未完成的私有草稿');assert.equal(loaded.images[0].base64,image.base64);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmp,'editorial-articles.json'))),original.articles);
  assert.equal(fs.existsSync(path.join(tmp,'docs/assets/uploads/test.png')),false);
  assert.equal((fs.statSync(path.join(tmp,'.local-studio/draft.json')).mode&0o777),0o600);
});
test('invalid uploads and invalid paths cannot be saved',async()=>{
  const response=await post('/local-api/save',{state:original,base:original,images:[{path:'/assets/uploads/../../outside.png',base64:'aGVsbG8='}]});assert.equal(response.status,400);
});
test('after a successful publication the working copy updates and private drafts stay local',async()=>{
  const candidate=structuredClone(original);const remaining=structuredClone(candidate);
  remaining.articles.articles.push({id:'still-local',status:'draft',zh:{title:'保留在电脑的文章'},en:{title:''}});
  const image={path:'/assets/uploads/published.png',base64:Buffer.from('\x89PNG\r\n\x1a\n','latin1').toString('base64')};
  const response=await post('/local-api/record-publication',{candidate,sha:'a'.repeat(40),images:[image],draft:{state:remaining,base:candidate,images:[]}});assert.equal(response.status,200);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmp,'editorial-articles.json'))),candidate.articles);
  const stored=JSON.parse(fs.readFileSync(path.join(tmp,'.local-studio/draft.json')));assert.equal(stored.state.articles.articles[0].zh.title,'保留在电脑的文章');
  assert.equal(fs.existsSync(path.join(tmp,'docs/assets/uploads/published.png')),true);
});
