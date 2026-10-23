import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectPage,inspectTextBlocks,renderEditedPage,safeURL,markdown,articleDocument,validateArticles} from '../editor/editor-core.mjs';
import {buildCMS} from '../cms-build.mjs';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'.local-studio/manifest.json')));
const home=fs.readFileSync(path.join(root,'.local-studio/base/home.zh.html'),'utf8');
const article={id:'test',slug:'test-essay',author:'测试作者 / Test Author',date:'2026-10-19',status:'published',zh:{title:'测试社论',abstract:'中文摘要',body:'# 一个问题\n\n思考 **科研** 与生活。\n\n![波浪](/assets/ocean-hero.png)'},en:{title:'A Test Essay',abstract:'A test abstract.',body:''},revisions:[{date:'2026-10-19',note:'更正测试。'}]};
test('every bilingual page round-trips without changing the public site',()=>{
  for(const p of manifest.pages)for(const lang of ['en','zh']){const html=fs.readFileSync(path.join(root,'.local-studio',p.base[lang].replace('/admin/','')),'utf8');assert.equal(inspectPage(html).html,html,p.url+' '+lang);}
});
test('exact field edits escape HTML, preserve adjacent copy and restore the original',()=>{
  const fields=inspectPage(home).fields,field=fields.find(f=>f.kind==='text'&&f.value.startsWith('Nabla Lab 成立于 2025 年。'));assert.ok(field);
  const changed=inspectPage(home,{[field.key]:'<script>alert(1)</script> & test'}).html;
  assert.ok(changed.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; test'));assert.ok(changed.includes('我们的研究兴趣包括'));
  assert.equal(inspectPage(home,{}).html,home);
});
test('shared header/footer field identifiers apply across routes',()=>{
  const field=inspectPage(home).fields.find(f=>f.scope==='shared'&&f.kind==='text'&&f.value==='探索 Nabla');assert.ok(field);
  const about=fs.readFileSync(path.join(root,'.local-studio/base/about.zh.html'),'utf8');
  assert.ok(inspectPage(about,{}, {[field.key]:'研究与交流'}).html.includes('研究与交流'));
});
test('image replacement, alt text and mail links are usable without allowing active content',()=>{
  const photoPage=fs.readFileSync(path.join(root,'.local-studio/base/people--yongqi-yuan.zh.html'),'utf8');
  const fields=inspectPage(photoPage).fields,img=fields.find(f=>f.kind==='image'&&f.scope==='main');assert.ok(img);
  assert.ok(inspectPage(photoPage,{[img.key]:'/assets/uploads/test.jpg'}).html.includes('src="/assets/uploads/test.jpg"'));
  assert.throws(()=>inspectPage(photoPage,{[img.key]:'javascript:alert(1)'}));
  assert.equal(safeURL('javascript:alert(1)'),false);assert.equal(safeURL('//evil.test/x'),false);assert.equal(safeURL('/assets/../admin/test.jpg',{image:true}),false);assert.equal(safeURL('mailto:yongqi.yuan@eng.ox.ac.uk'),true);
});
test('article rendering uses safe formatting, correct locale links and preserved publication dates',()=>{
  const shell=fs.readFileSync(path.join(root,'.local-studio/base/editorial.en.html'),'utf8');const html=articleDocument(shell,article,'en');
  assert.ok(html.includes('https://nabla.ac.cn/editorial/test-essay/'));assert.ok(html.includes('https://nabla.ac.cn/zh/editorial/test-essay/'));
  assert.ok(html.includes('href="/zh/editorial/test-essay/" lang="zh-Hans"'));assert.ok(html.includes('This essay is available in Chinese.'));assert.ok(html.includes('2026-10-19'));
  assert.ok(markdown('<script>bad()</script>').includes('&lt;script&gt;'));assert.ok(!markdown('[bad](javascript:alert)').includes('<a'));
  assert.ok(markdown(article.zh.body).includes('<strong>科研</strong>'));
  assert.ok(html.includes('Test Author'));assert.ok(!html.includes('测试作者'));assert.ok(!html.includes('中文摘要'));
  const zhHTML=articleDocument(shell,article,'zh');assert.ok(zhHTML.includes('测试作者'));assert.ok(!zhHTML.includes('A test abstract.'));assert.ok(!zhHTML.includes('A Test Essay'));
  validateArticles({articles:[article]});assert.throws(()=>validateArticles({articles:[{...article,date:'2026-02-31'}]}));
});
test('build applies bilingual edits and indexes published articles, excluding drafts',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nabla-cms-test-'));
  try{
    fs.cpSync(path.join(root,'docs'),path.join(tmp,'docs'),{recursive:true});
    const field=inspectPage(home).fields.find(f=>f.value.startsWith('Nabla Lab 成立于 2025 年。'));
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

const {commitContent}=await import('../editor/github-publisher.mjs');
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
test('whole-paragraph editing preserves links, formatting and saved legacy edits',()=>{
  const html='<html><head><title>Example</title></head><body><main id="main"><p class="lead">A <strong>research</strong> group.<br>Read <a href="/about/">about us</a>.</p><p>Another paragraph.</p></main></body></html>';
  const legacy=inspectPage(html).fields.find(f=>f.value==='research');const record={fields:{[legacy.key]:'small research'}};
  const blocks=inspectTextBlocks(html,record);assert.equal(blocks.length,2);assert.ok(blocks[0].value.includes('**small research**'));assert.ok(blocks[0].value.includes('[about us](/about/)'));
  record.blocks={[blocks[0].key]:'A complete introduction.\n\nRead [our work](/research/).'};
  const updated=renderEditedPage(html,record);assert.ok(updated.includes('<p class="lead">A complete introduction.</p><p>Read <a href="/research/"'));assert.ok(updated.includes('<p>Another paragraph.</p>'));
  record.blocks[blocks[0].key]='<script>alert(1)</script>';assert.ok(!renderEditedPage(html,record).includes('<script>'));
});
test('homepage presents research and publications without placeholder imagery, with five equal members',()=>{
  assert.ok(home.indexOf('id="research"')<home.indexOf('id="publications"'));
  assert.ok(home.indexOf('id="publications"')<home.indexOf('id="community"'));
  const research=home.split('id="research"')[1].split('id="publications"')[0];
  const papers=home.split('id="publications"')[1].split('id="community"')[0];
  assert.ok(!/<(?:img|svg|figure)\b/.test(research));
  assert.ok(!/<(?:img|svg|figure)\b/.test(papers));
  assert.equal((research.match(/<li>/g)||[]).length,9);
  assert.equal((home.match(/class="community-member"/g)||[]).length,5);
  assert.ok(home.includes('nabla-mark-white.svg'));
  assert.ok(!home.includes('id="people-list"'));
  assert.ok(!home.includes('class="visual-essay-arrow"'));
  const paper=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8')).publications[0];
  assert.ok(papers.includes(paper.title));assert.ok(papers.includes(paper.journal));
  for(const author of paper.authors)assert.ok(papers.includes(author.name));
});
