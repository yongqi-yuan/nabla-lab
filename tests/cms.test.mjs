import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectPage,safeURL,markdown,articleDocument,validateArticles} from '../docs/admin/editor-core.mjs';
import {buildCMS} from '../cms-build.mjs';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/admin/manifest.json')));
const home=fs.readFileSync(path.join(root,'docs/admin/base/home.zh.html'),'utf8');
const article={id:'test',slug:'test-essay',author:'测试作者 / Test Author',date:'2026-10-19',status:'published',zh:{title:'测试社论',abstract:'中文摘要',body:'# 一个问题\n\n思考 **科研** 与生活。\n\n![波浪](/assets/ocean-hero.png)'},en:{title:'A Test Essay',abstract:'A test abstract.',body:''},revisions:[{date:'2026-10-19',note:'更正测试。'}]};
test('every bilingual page round-trips without changing the public site',()=>{
  for(const p of manifest.pages)for(const lang of ['en','zh']){const html=fs.readFileSync(path.join(root,'docs',p.base[lang]),'utf8');assert.equal(inspectPage(html).html,html,p.url+' '+lang);}
});
test('exact field edits escape HTML, preserve adjacent copy and restore the original',()=>{
  const fields=inspectPage(home).fields,field=fields.find(f=>f.kind==='text'&&f.value==='共同的起点。');assert.ok(field);
  const changed=inspectPage(home,{[field.key]:'<script>alert(1)</script> & test'}).html;
  assert.ok(changed.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; test'));assert.ok(changed.includes('因科研而相连。'));
  assert.equal(inspectPage(home,{}).html,home);
});
test('shared header/footer field identifiers apply across routes',()=>{
  const field=inspectPage(home).fields.find(f=>f.scope==='shared'&&f.kind==='text'&&f.value==='研究 · 成员 · 思想');assert.ok(field);
  const about=fs.readFileSync(path.join(root,'docs/admin/base/about.zh.html'),'utf8');
  assert.ok(inspectPage(about,{}, {[field.key]:'研究与交流'}).html.includes('研究与交流'));
});
test('image replacement, alt text and mail links are usable without allowing active content',()=>{
  const fields=inspectPage(home).fields,img=fields.find(f=>f.kind==='image'&&f.scope==='main');assert.ok(img);
  assert.ok(inspectPage(home,{[img.key]:'/assets/uploads/test.jpg'}).html.includes('src="/assets/uploads/test.jpg"'));
  assert.throws(()=>inspectPage(home,{[img.key]:'javascript:alert(1)'}));
  assert.equal(safeURL('javascript:alert(1)'),false);assert.equal(safeURL('//evil.test/x'),false);assert.equal(safeURL('/assets/../admin/test.jpg',{image:true}),false);assert.equal(safeURL('mailto:yongqi.yuan@eng.ox.ac.uk'),true);
});
test('article rendering uses safe formatting, correct locale links and preserved publication dates',()=>{
  const shell=fs.readFileSync(path.join(root,'docs/admin/base/editorial.en.html'),'utf8');const html=articleDocument(shell,article,'en');
  assert.ok(html.includes('https://nabla.ac.cn/editorial/test-essay/'));assert.ok(html.includes('https://nabla.ac.cn/zh/editorial/test-essay/'));
  assert.ok(html.includes('href="/zh/editorial/test-essay/" lang="zh-Hans"'));assert.ok(html.includes('This essay is available in Chinese.'));assert.ok(html.includes('2026-10-19'));
  assert.ok(markdown('<script>bad()</script>').includes('&lt;script&gt;'));assert.ok(!markdown('[bad](javascript:alert)').includes('<a'));
  assert.ok(markdown(article.zh.body).includes('<strong>科研</strong>'));
  validateArticles({articles:[article]});assert.throws(()=>validateArticles({articles:[{...article,date:'2026-02-31'}]}));
});
test('build applies bilingual edits and indexes published articles, excluding drafts',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nabla-cms-test-'));
  try{
    fs.cpSync(path.join(root,'docs'),path.join(tmp,'docs'),{recursive:true});
    const field=inspectPage(home).fields.find(f=>f.value==='共同的起点。');
    fs.writeFileSync(path.join(tmp,'site-edits.json'),JSON.stringify({version:1,pages:{'/zh/':{fields:{[field.key]:'共同探索。'}}},shared:{en:{},zh:{}}}));
    fs.writeFileSync(path.join(tmp,'editorial-articles.json'),JSON.stringify({version:1,articles:[article,{...article,id:'draft',slug:'draft-essay',status:'draft'}]}));
    buildCMS(tmp,new Set(manifest.pages.map(p=>p.url)));
    assert.ok(fs.readFileSync(path.join(tmp,'docs/zh/index.html'),'utf8').includes('共同探索。'));
    assert.ok(!fs.readFileSync(path.join(tmp,'docs/index.html'),'utf8').includes('共同探索。'));
    assert.ok(fs.readFileSync(path.join(tmp,'docs/zh/editorial/test-essay/index.html'),'utf8').includes('测试社论'));
    assert.ok(fs.readFileSync(path.join(tmp,'docs/editorial/index.html'),'utf8').includes('/editorial/test-essay/'));
    assert.ok(fs.readFileSync(path.join(tmp,'docs/assets/search-index.zh.js'),'utf8').includes('测试社论'));
    assert.ok(fs.readFileSync(path.join(tmp,'docs/sitemap.xml'),'utf8').includes('/zh/editorial/test-essay/'));
    assert.equal(fs.existsSync(path.join(tmp,'docs/editorial/draft-essay')),false);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

const {commitContent}=await import('../docs/admin/github-publisher.mjs');
const minimal={edits:{version:1,pages:{},shared:{en:{},zh:{}}},articles:{version:1,articles:[]}};
function mockGitHub({conflict=false,rejectRef=false}={}){
  const requests=[];
  const api=async(url,opts={})=>{
    requests.push({url,...opts});
    if(url.endsWith('/git/ref/heads/main'))return {object:{sha:'current-head'}};
    if(url.includes('/contents/')){const value=url.includes('site-edits')?(conflict?{...minimal.edits,updated:true}:minimal.edits):minimal.articles;return {content:Buffer.from(JSON.stringify(value)).toString('base64')};}
    if(url.endsWith('/git/commits/current-head'))return {tree:{sha:'current-tree'}};
    if(url.endsWith('/git/blobs'))return {sha:'image-blob'};
    if(url.endsWith('/git/trees'))return {sha:'new-tree'};
    if(url.endsWith('/git/commits'))return {sha:'new-commit'};
    if(url.endsWith('/git/refs/heads/main')){if(rejectRef)throw new Error('concurrent push rejected');return {object:{sha:'new-commit'}};}
    throw new Error('Unexpected request '+url);
  };return {api,requests};
}
test('publication commits content and image as one non-forced branch update',async()=>{
  const {api,requests}=mockGitHub();const result=await commitContent(api,{repo:'test/lab',baseline:minimal,candidate:minimal,images:[['/assets/uploads/test.jpg',{base64:'aGVsbG8='}]],message:'Test content update'});
  assert.equal(result.sha,'new-commit');const tree=requests.find(r=>r.url.endsWith('/git/trees'));assert.equal(tree.body.base_tree,'current-tree');assert.deepEqual(tree.body.tree.map(x=>x.path),['docs/assets/uploads/test.jpg','site-edits.json','editorial-articles.json']);
  assert.equal(requests.at(-1).method,'PATCH');assert.equal(requests.at(-1).body.force,false);
  assert.deepEqual(requests.find(r=>r.url.endsWith('/git/commits')).body.parents,['current-head']);
});
test('publication refuses stale content before any write',async()=>{
  const {api,requests}=mockGitHub({conflict:true});await assert.rejects(commitContent(api,{repo:'test/lab',baseline:minimal,candidate:minimal}),/其他编辑者/);assert.ok(requests.every(r=>!r.method));
});
test('a push racing the final update is not retried or forced',async()=>{
  const {api,requests}=mockGitHub({rejectRef:true});await assert.rejects(commitContent(api,{repo:'test/lab',baseline:minimal,candidate:minimal}),/concurrent push/);assert.equal(requests.filter(r=>r.method==='PATCH').length,1);assert.equal(requests.at(-1).body.force,false);
});
