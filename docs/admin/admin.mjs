import {readRemoteState,commitContent} from './github-publisher.mjs';
import {inspectPage,escapeHTML as e,articleDocument,validateArticles,londonDate,safeURL} from './editor-core.mjs';
const $=id=>document.getElementById(id),repo='yongqi-yuan/nabla-lab',draftKey='nabla-content-studio-v1';
let previewGeneration=0;
let manifest,state,baseline,headAtConnect,token='',mode='pages',selected='/',articleID='',fieldKind='text',previewLanguage='zh',scope='main',filter='',busy=false,dirty=false,pendingImages=new Map(),baseCache=new Map(),previewTimer,renderGeneration=0,formLanguage=window.innerWidth<1150?'zh':'both',uploadedPreviews=new Map();
const clone=x=>JSON.parse(JSON.stringify(x));
const serial=x=>JSON.stringify(x);
const publishable=s=>({edits:s.edits,articles:{...s.articles,articles:s.articles.articles.filter(a=>a.status==='published')}});
const canPublish=()=>serial(publishable(state))!==serial(baseline)||pendingImages.size>0;
const notice=(text,error=false)=>{const n=$('notice');n.hidden=!text;n.textContent=text;n.className=error?'error':'';};
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`无法加载 ${url}（${r.status}）`);return r.json();}
function languageURL(url,lang){return (lang==='zh'?'/zh':'')+url;}
function currentPage(){return manifest.pages.find(p=>p.url===selected)||manifest.pages[0];}
function currentArticle(){return state.articles.articles.find(a=>a.id===articleID);}
function setDirty(){
  dirty=serial(state)!==serial(baseline)||pendingImages.size>0;
  $('save-state').textContent=dirty?(canPublish()?'有未发布修改 · 已存文字草稿':'社论草稿仅保存在本机'):'与已载入版本一致';
  $('publish').disabled=busy||!canPublish();
  if(dirty){try{localStorage.setItem(draftKey,serial({version:1,state,base:baseline,date:new Date().toISOString()}));}catch{$('save-state').textContent='有未发布修改 · 请导出备份';}}
  else localStorage.removeItem(draftKey);
  schedulePreview();
}
function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview().catch(err=>notice(err.message,true)),350);}
function pagePatch(url){if(!state.edits.pages[url])state.edits.pages[url]={fields:{}};return state.edits.pages[url].fields;}
function patchFor(lang){return scope==='shared'?state.edits.shared[lang]:state.edits.pages[languageURL(selected,lang)]?.fields||{};}
function updateField(lang,key,value,original){const p=scope==='shared'?state.edits.shared[lang]:pagePatch(languageURL(selected,lang));if(value===original)delete p[key];else p[key]=value;cleanEmptyPages();setDirty();}
function cleanEmptyPages(){for(const [url,p] of Object.entries(state.edits.pages))if(!Object.keys(p.fields||{}).length&&!p.revisions?.length)delete state.edits.pages[url];}
async function baseFor(url,lang){const p=manifest.pages.find(p=>p.url===url);if(!p)throw new Error('页面不存在。');const file=p.base[lang];if(!baseCache.has(file)){const response=await fetch(file,{cache:'no-store'});if(!response.ok)throw new Error('无法加载页面预览，请刷新。');baseCache.set(file,await response.text());}return baseCache.get(file);}
function sidebar(){
  const list=$('item-list');list.replaceChildren();
  if(mode==='pages')for(const p of manifest.pages){const b=document.createElement('button');b.className='item'+(selected===p.url?' active':'');b.textContent=p.zhTitle;const small=document.createElement('small');small.textContent=p.url;b.append(small);b.addEventListener('click',()=>{selected=p.url;render().catch(fail);});list.append(b);}
  if(mode==='articles'){
    const founding=document.createElement('button');founding.className='item';founding.textContent='创刊说明（已发表）';founding.addEventListener('click',()=>{mode='pages';selected='/editorial/an-exciting-and-unsettling-age/';render().catch(fail);});list.append(founding);
    for(const a of state.articles.articles){const b=document.createElement('button');b.className='item'+(articleID===a.id?' active':'');b.textContent=a.zh.title||'未命名社论';const small=document.createElement('small');small.textContent=a.status==='published'?'公开发布':'本机草稿';b.append(small);b.addEventListener('click',()=>{articleID=a.id;render().catch(fail);});list.append(b);}
  }
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
}
async function render(){
  const generation=++renderGeneration;sidebar();
  $('page-controls').hidden=mode!=='pages';$('new-article').hidden=mode!=='articles';document.querySelector('.studio').classList.toggle('wide-mode',mode==='media');
  if(mode==='pages'){
    const p=currentPage();$('editor-title').textContent=p.zhTitle;$('editor-description').textContent=scope==='shared'?'页眉与页脚的修改会应用到该语言的所有页面。':'中英文独立修改；此处只更新当前页面。同一介绍在其他页面出现时，请分别修改。';
    const htmls=await Promise.all(['en','zh'].map(lang=>baseFor(selected,lang)));if(generation!==renderGeneration)return;
    const form=$('editor-form');form.replaceChildren();
    if(selected.startsWith('/editorial/')&&selected!=='/editorial/')appendHint(form,'已发表文章保留首次发表日期。更正请在发布时填写说明；新的观点宜另发一篇社论。');
    const grid=document.createElement('div');grid.className='bilingual-grid';form.append(grid);
    grid.classList.toggle('single',formLanguage!=='both');
    for(const [index,lang] of ['en','zh'].entries()){
      if(formLanguage!=='both'&&formLanguage!==lang)continue;
      const column=document.createElement('div');column.className='language-fields';column.dataset.language=lang==='en'?'ENGLISH':'简体中文';grid.append(column);
      const h=document.createElement('div');h.className='bilingual-head';h.textContent=lang==='en'?'ENGLISH':'简体中文';column.append(h);
      const inspected=inspectPage(htmls[index]);const patch=patchFor(lang);
      const fields=inspected.fields.filter(f=>f.scope===scope&&(fieldKind==='text'?['text','title','description'].includes(f.kind):fieldKind==='image'?['image','alt'].includes(f.kind):f.kind==='link')).filter(f=>!filter||(patch[f.key]??f.value).toLowerCase().includes(filter.toLowerCase()));
      const groups=new Map();
      for(const f of fields){const group=f.kind==='title'||f.kind==='description'?'搜索与分享':scope==='shared'?'全站通用内容':f.section; if(!groups.has(group))groups.set(group,[]);groups.get(group).push(f);}
      let groupIndex=0;
      for(const [name,entries] of groups){const details=document.createElement('details');details.className='section-group';details.open=!!filter||groupIndex++<2;const summary=document.createElement('summary');summary.textContent=sectionName(name)+' · '+entries.length;const body=document.createElement('div');body.className='section-body';details.append(summary,body);column.append(details);for(const f of entries)body.append(fieldWidget(f,lang,patch));}
      if(!fields.length)column.innerHTML='<p class="empty">没有符合条件的内容。</p>';
    }
  }else if(mode==='articles'){renderArticle();}else renderMedia();
  await updatePreview();
}
function sectionName(name){return ({'home-hero':'首页主视觉','home-intro':'团队介绍','research-section':'研究方向','people-section':'团队成员','news-section':'新闻','editorial-feature':'社论入口','contact-band':'联系区域','page-masthead':'页面开头','profile-hero':'个人介绍','editorial-essay':'社论正文','editorial-index':'社论目录','editorial-masthead':'社论简介'})[name]||name;}
function appendHint(parent,text){const p=document.createElement('p');p.className='hint';p.textContent=text;parent.append(p);}
function fieldWidget(f,lang,patch){
  const wrap=document.createElement('div');wrap.className='field'+(patch[f.key]!==undefined?' changed':'');
  const head=document.createElement('div');head.className='field-head';const label=document.createElement('label');label.textContent=f.label;const inputID=`${lang}-${f.key}`;label.htmlFor=inputID;head.append(label);
  const reset=document.createElement('button');reset.className='reset-field';reset.textContent='恢复原文';reset.type='button';head.append(reset);wrap.append(head);
  const input=document.createElement(f.kind==='text'||f.kind==='description'?'textarea':'input');input.id=inputID;input.value=patch[f.key]??f.value;
  if(input.tagName==='TEXTAREA')input.rows=input.value.length>100?4:input.value.length>40?2:1;
  if(f.kind==='image'){
    const img=document.createElement('img');img.src=previewImage(input.value);img.alt=f.alt||'图片预览';wrap.append(img);
    const upload=document.createElement('label');upload.className='upload';upload.textContent='替换图片 ↑';const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;upload.append(file);wrap.append(upload);
    file.addEventListener('change',async()=>{try{const path=await uploadImage(file.files[0]);input.value=path;img.src=previewImage(path);updateField(lang,f.key,path,f.value);wrap.classList.add('changed');}catch(err){fail(err);}});
    input.addEventListener('change',()=>img.src=previewImage(input.value));
  }
  input.addEventListener('input',()=>{updateField(lang,f.key,input.value,f.value);wrap.classList.toggle('changed',input.value!==f.value);});
  reset.addEventListener('click',()=>{input.value=f.value;updateField(lang,f.key,f.value,f.value);wrap.classList.remove('changed');if(f.kind==='image')wrap.querySelector('img').src=previewImage(f.value);});wrap.append(input);return wrap;
}
function previewImage(path){return pendingImages.get(path)?.url||uploadedPreviews.get(path)||path;}
async function updatePreview(){
  if(!manifest||mode==='media')return;
  const generation=++previewGeneration;
  const lang=previewLanguage;let html;
  if(mode==='pages')html=inspectPage(await baseFor(selected,lang),state.edits.pages[languageURL(selected,lang)]?.fields||{},state.edits.shared[lang]).html;
  else {const a=currentArticle();if(!a){$('preview').srcdoc='<p style="font-family:system-ui;padding:40px;color:#617680">选择一篇社论，或点击「新建社论」。</p>';return;}html=articleDocument(await baseFor('/editorial/',lang),a,lang);html=inspectPage(html,{},state.edits.shared[lang]).html;}
  if(generation!==previewGeneration)return;
  // A script-free same-origin sandbox enables scroll restoration without executing article content.
  html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link rel="canonical"[^>]*>/g,'');
  for(const [path,img] of [...uploadedPreviews].map(([p,url])=>[p,{url}]).concat([...pendingImages]))html=html.replaceAll(`src="${e(path)}"`,`src="${img.url}"`);
  html=html.replace(/<a\b[^>]*>/gi,tag=>tag.replace(/\s+href="[^"]*"/gi,'').replace(/\s+tabindex="[^"]*"/gi,'')+'');
  html=html.replace('</head>',`<style>a{pointer-events:none}.community-members,.community-member>a{animation-play-state:paused!important}</style></head>`);
  const frame=$('preview');let scroll=0;try{scroll=frame.contentWindow.scrollY;}catch{}
  frame.onload=()=>{try{frame.contentWindow.scrollTo(0,scroll);}catch{}};frame.srcdoc=html;
}
function articleInput(parent,labelText,key,value,options={}){
  const label=document.createElement('label');label.textContent=labelText;const input=document.createElement(options.area?'textarea':'input');input.id='article-'+key.replaceAll('.','-');label.htmlFor=input.id;input.value=value||'';if(options.area)input.rows=options.rows||3;if(options.body)input.className='body-input';if(options.type)input.type=options.type;if(options.readOnly)input.readOnly=true;
  parent.append(label,input);input.addEventListener('input',()=>{const a=currentArticle();const keys=key.split('.');if(keys.length===2)a[keys[0]][keys[1]]=input.value;else a[key]=input.value;setDirty();if(key.endsWith('title'))sidebar();});return input;
}
function renderArticle(){
  $('editor-title').textContent='Nabla 社论';$('editor-description').textContent='中文正文、英文标题与摘要；可选英文全文。所有成员均可署名。';
  const root=$('editor-form');root.replaceChildren();const a=currentArticle();if(!a){root.innerHTML='<p class="empty">从左侧选择社论，或点击右上方「新建社论」。创刊说明可在页面内容中编辑。</p>';return;}
  const form=document.createElement('div');form.className='article-form';root.append(form);appendHint(form,'正文支持空行分段、# 小标题、**粗体**、[链接文字](https://...)、![图片说明](/assets/uploads/...)。社论草稿仅存本机；只有设为「公开发布」的文章才会随发布上传。');
  const old=baseline.articles.articles.find(b=>b.id===a.id),locked=old?.status==='published';
  articleInput(form,'署名（可填写多位作者）','author',a.author);articleInput(form,'文章网址（小写英文与短横线；已发表后固定）','slug',a.slug,{readOnly:locked});articleInput(form,'首次发表日期','date',a.date,{type:'date',readOnly:locked});
  const statusLabel=document.createElement('label');statusLabel.textContent='文章状态';const select=document.createElement('select');select.setAttribute('aria-label','文章状态');select.innerHTML='<option value="draft">草稿（本机编辑）</option><option value="published">公开发布</option>';select.value=a.status;select.disabled=locked;select.addEventListener('change',()=>{a.status=select.value;setDirty();sidebar();});form.append(statusLabel,select);
  const columns=document.createElement('div');columns.className='article-columns';form.append(columns);
  for(const lang of ['zh','en']){const col=document.createElement('div');columns.append(col);articleInput(col,lang==='zh'?'中文标题':'English title',lang+'.title',a[lang].title);articleInput(col,lang==='zh'?'中文摘要（选填）':'English abstract（必填）',lang+'.abstract',a[lang].abstract,{area:true});articleInput(col,lang==='zh'?'中文正文':'English full text（选填）',lang+'.body',a[lang].body,{area:true,body:true});}
  const cover=articleInput(form,'封面图片地址（选填）','cover',a.cover);articleInput(form,'封面图片说明','coverAlt',a.coverAlt);
  const uploadLabel=document.createElement('label');uploadLabel.className='file-link';uploadLabel.textContent='上传封面图片 ↑';const upload=document.createElement('input');upload.type='file';upload.hidden=true;upload.accept='image/png,image/jpeg,image/webp,image/gif';uploadLabel.append(upload);form.append(uploadLabel);upload.addEventListener('change',async()=>{try{a.cover=await uploadImage(upload.files[0]);cover.value=a.cover;setDirty();}catch(err){fail(err);}});
  if(!locked){const del=document.createElement('button');del.className='danger';del.textContent='移除此草稿';del.style.marginTop='22px';del.addEventListener('click',()=>{state.articles.articles=state.articles.articles.filter(x=>x.id!==a.id);articleID='';setDirty();render().catch(fail);});form.append(del);}
}
async function uploadImage(file){
  if(!file)throw new Error('请选择图片。');if(file.size>5*1024*1024)throw new Error('图片请小于 5 MB；大图建议先压缩。');
  const bytes=new Uint8Array(await file.arrayBuffer()),signature=String.fromCharCode(...bytes.slice(0,12));let ext;
  if(bytes[0]===137&&signature.slice(1,4)==='PNG')ext='png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';else if(signature.startsWith('GIF8'))ext='gif';else if(signature.startsWith('RIFF')&&signature.slice(8,12)==='WEBP')ext='webp';else throw new Error('支持 PNG、JPG、WebP 或 GIF 图片。');
  // Decode before accepting an image; original bytes and metadata are preserved.
  const image=await createImageBitmap(file);if(image.width*image.height>50000000){image.close();throw new Error('图片像素过大，请缩小后上传。');}image.close();
  const name=file.name.replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[^a-zA-Z0-9-]/g,'-').replace(/-+/g,'-').slice(0,45)||'image';
  const path=`/assets/uploads/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${name}.${ext}`;
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  pendingImages.set(path,{url:URL.createObjectURL(file),base64:btoa(binary),size:file.size});setDirty();notice('图片已加入本次草稿。请将图片用于页面或社论，并保持此标签页打开直至发布；也可以导出完整备份。');return path;
}
function renderMedia(){
  $('editor-title').textContent='图片素材';$('editor-description').textContent='上传图片后，复制地址到页面图片字段或社论正文。';
  const root=$('editor-form');root.replaceChildren();const upload=document.createElement('label');upload.className='media-upload';upload.innerHTML='<strong>＋ 上传图片</strong><small>PNG / JPG / WebP / GIF · 每张最多 5 MB</small>';const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;upload.append(file);root.append(upload);file.addEventListener('change',async()=>{try{await uploadImage(file.files[0]);renderMedia();}catch(err){fail(err);}});
  const grid=document.createElement('div');grid.className='media-grid';root.append(grid);
  const paths=[...new Set([...pendingImages.keys(),...(manifest.assets||[])])];
  for(const path of paths){const card=document.createElement('div');card.className='media-card';const img=document.createElement('img');img.src=previewImage(path);img.alt=path.split('/').at(-1);img.loading='lazy';const p=document.createElement('p');p.textContent=path;const button=document.createElement('button');button.textContent=pendingImages.has(path)?'复制地址 · 待发布':'复制图片地址';button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(path);button.textContent='已复制';}catch{notice('请选中并复制图片地址：'+path);}});card.append(img,p,button);if(pendingImages.has(path)){const remove=document.createElement('button');remove.className='danger';remove.textContent='移除';remove.addEventListener('click',()=>{if(serial(state).includes(path)){notice('这张图片已在草稿中使用，请先移除页面或社论中的引用。',true);return;}URL.revokeObjectURL(pendingImages.get(path).url);pendingImages.delete(path);setDirty();renderMedia();});card.append(remove);}grid.append(card);}
}
function fail(err){notice(err.message||String(err),true);}
async function api(path,{method='GET',body}={}) {
  const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  let data;try{data=await response.json();}catch{throw new Error('GitHub 返回了无法读取的响应。');}
  if(!response.ok){if(response.status===401)throw new Error('GitHub 授权无效或已过期，请重新连接。');if(response.status===403)throw new Error('GitHub 权限不足或请求受限。请确认令牌仅授权 nabla-lab，且 Contents 为 Read and write。');if(response.status===409||response.status===422)throw new Error('仓库已有更新或提交冲突。草稿已保留，请重新连接并检查后发布。');throw new Error(`GitHub 请求失败（${response.status}）：${data.message||'请稍后重试'}`);}return data;
}
async function remoteState(sha){return readRemoteState(api,repo,sha);}
async function connect(){
  const value=$('github-token').value.trim();if(!value){$('login-status').textContent='请先填写 GitHub 发布令牌。';return;}
  $('github-token').value='';token=value;$('login-submit').disabled=true;$('login-status').textContent='正在验证仓库权限…';
  try{const metadata=await api(`/repos/${repo}`);if(!metadata.permissions?.push)throw new Error('当前 GitHub 账号没有 Nabla 仓库写入权限。');
    const ref=await api(`/repos/${repo}/git/ref/heads/main`);const remote=await remoteState(ref.object.sha);
    if(serial(remote)!==serial(baseline))throw new Error('网站源内容已更新。请先导出本机草稿，刷新页面载入新版本，再恢复需要的修改。');
    headAtConnect=ref.object.sha;$('connect').textContent='已连接 · 退出';$('login-dialog').close();notice('已连接 Nabla 仓库。发布凭据仅保存在当前标签页内存中。');
  }catch(err){token='';$('login-status').textContent=err.message;}finally{$('login-submit').disabled=false;}
}
function changes(){
  const pages=[];for(const url of new Set([...Object.keys(state.edits.pages),...Object.keys(baseline.edits.pages)]))if(serial(state.edits.pages[url])!==serial(baseline.edits.pages[url]))pages.push(url);
  const shared=['en','zh'].filter(l=>serial(state.edits.shared[l])!==serial(baseline.edits.shared[l]));
  const articles=state.articles.articles.filter(a=>a.status==='published'&&serial(a)!==serial(baseline.articles.articles.find(b=>b.id===a.id)));
  const removed=baseline.articles.articles.filter(a=>!state.articles.articles.some(b=>b.id===a.id));
  return {pages,shared,articles,removed};
}
function review(){
  if(!canPublish())return;const c=changes();$('change-summary').innerHTML='<ul>'+[...c.pages.map(url=>`<li>页面：${e(url)}</li>`),...c.shared.map(l=>`<li>${l==='en'?'英文':'中文'}全站页眉与页脚</li>`),...c.articles.map(a=>`<li>社论：${e(a.zh.title)} · ${a.status==='published'?'公开':'草稿数据（仓库公开）'}</li>`),...c.removed.map(a=>`<li>移除草稿：${e(a.zh.title)}</li>`),...(pendingImages.size?[`<li>${pendingImages.size} 张图片</li>`]:[])].join('')+'</ul>';
  const root=$('revision-inputs');root.replaceChildren();
  const requirements=[...c.pages.filter(u=>/\/editorial\/.+\/$/.test(u)).map(url=>({id:'page:'+url,label:'已发表社论更正说明：'+url})),...c.articles.filter(a=>baseline.articles.articles.some(b=>b.id===a.id&&b.status==='published')).map(a=>({id:'article:'+a.id,label:'已发表社论更正说明：'+a.zh.title}))];
  for(const req of requirements){const label=document.createElement('label');label.textContent=req.label;label.style.display='block';label.style.margin='14px 0 7px';const input=document.createElement('textarea');input.rows=2;input.required=true;input.dataset.revision=req.id;input.placeholder='说明更正或补充的内容；保留原始日期。';label.append(input);root.append(label);}
  $('publish-status').textContent='';$('publish-confirm').disabled=false;$('publish-dialog').showModal();
}
function validateState(candidate){
  validateArticles({...candidate.articles,articles:candidate.articles.articles.filter(a=>a.status==='published')});
  if(candidate.edits.version!==1||!candidate.edits.pages||!candidate.edits.shared)throw new Error('页面草稿格式错误。');
  for(const [url,p] of Object.entries(candidate.edits.pages)){const base=url.startsWith('/zh/')?url.slice(3)||'/':url;if(!manifest.pages.some(x=>x.url===base))throw new Error('草稿包含未知页面。');if(!p.fields||Object.values(p.fields).some(v=>typeof v!=='string'||v.length>100000))throw new Error('页面字段格式错误。');}
  for(const lang of ['en','zh'])if(!candidate.edits.shared[lang]||Object.values(candidate.edits.shared[lang]).some(v=>typeof v!=='string'||v.length>100000))throw new Error('通用字段格式错误。');
  for(const a of candidate.articles.articles){if(typeof a.id!=='string'||!a.en||!a.zh)throw new Error('文章格式错误。');const old=baseline.articles.articles.find(b=>b.id===a.id);if(old?.status==='published'&&(old.slug!==a.slug||old.date!==a.date||a.status!=='published'))throw new Error('已发表文章的网址和首次发表日期不可更改。');}
}
async function publish(){
  if(busy)return;if(!token){$('publish-dialog').close();$('login-dialog').showModal();return;}
  busy=true;$('publish-confirm').disabled=true;$('publish').disabled=true;const status=$('publish-status');let published=false;
  try{
    const localDrafts=clone(state.articles.articles.filter(a=>a.status==='draft'));
    const candidate=clone(publishable(state));for(const input of document.querySelectorAll('[data-revision]')){if(!input.value.trim())throw new Error('请填写已发表社论的更正说明。');const [kind,...parts]=input.dataset.revision.split(':');const key=parts.join(':');const record={date:londonDate(),note:input.value.trim()};if(kind==='page'){candidate.edits.pages[key]??={fields:{}};candidate.edits.pages[key].revisions??=[];candidate.edits.pages[key].revisions.push(record);}else{const a=candidate.articles.articles.find(a=>a.id===key);a.revisions??=[];a.revisions.push(record);}}
    validateState(candidate);
    // Validate all edited URL fields with the same renderer used in production.
    for(const p of manifest.pages)for(const lang of ['en','zh'])if(candidate.edits.pages[languageURL(p.url,lang)]||Object.keys(candidate.edits.shared[lang]).length)inspectPage(await baseFor(p.url,lang),candidate.edits.pages[languageURL(p.url,lang)]?.fields||{},candidate.edits.shared[lang]);
    // A restored draft must still carry all its referenced uploaded images.
    const text=serial(candidate);for(const path of text.match(/\/assets\/uploads\/[a-zA-Z0-9_.-]+/g)||[])if(!pendingImages.has(path)&&!manifest.assets.includes(path))throw new Error('草稿使用的图片尚未上传，请重新选择该图片：'+path);
    const next=await commitContent(api,{repo,baseline,candidate,images:[...pendingImages],message:$('commit-message').value,onProgress:text=>status.textContent=text});published=true;headAtConnect=next.sha;
    baseline=clone(candidate);state=clone(candidate);state.articles.articles.push(...localDrafts);for(const [path,image] of pendingImages){if(!manifest.assets.includes(path))manifest.assets.push(path);uploadedPreviews.set(path,image.url);}pendingImages.clear();setDirty();
    status.innerHTML=`已保存到 GitHub，正在构建网站。<br><a href="https://github.com/${repo}/commit/${next.sha}" target="_blank" rel="noopener">查看修改记录 ↗</a><br><a href="https://github.com/${repo}/actions" target="_blank" rel="noopener">查看部署进度 ↗</a>`;
    notice('修改已提交，等待 GitHub 自动部署。部署完成前，公开网站仍显示上一版。');
    await waitForDeployment(next.sha,status);
  }catch(err){const message=err.message||String(err);if(published){status.append(document.createTextNode('\n内容已保存，但暂时无法确认部署结果：'+message+'。可通过上方部署进度链接检查。'));}else status.textContent=message;}
  finally{busy=false;$('publish-confirm').disabled=!canPublish();$('publish').disabled=!canPublish();}
}
async function waitForDeployment(sha,status){
  for(let i=0;i<36;i++){await new Promise(r=>setTimeout(r,5000));const response=await api(`/repos/${repo}/actions/runs?head_sha=${sha}&per_page=10`);const run=response.workflow_runs.find(r=>r.name==='Deploy Nabla Lab to GitHub Pages');if(!run)continue;
    if(run.status==='completed'){if(run.conclusion!=='success')throw new Error('GitHub 部署未成功，请打开部署进度查看原因。');status.append(document.createTextNode('\n网站已部署。刷新页面即可查看正式效果。'));notice('发布完成，网站已更新。');return;}}
  status.append(document.createTextNode('\n部署仍在进行，可稍后通过上方链接查看。'));
}
function exportDraft(){
  const images=[...pendingImages].map(([path,img])=>({path,base64:img.base64,size:img.size}));const blob=new Blob([JSON.stringify({version:1,state,base:baseline,images,date:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='nabla-draft-'+londonDate()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('草稿备份已导出，包含文字及本次上传图片，不包含发布令牌。');
}
async function restore(data){
  if(data.version!==1||!data.state)throw new Error('不是有效的 Nabla 草稿备份。');
  if(data.base&&serial(data.base)!==serial(baseline))throw new Error('这份草稿基于旧版内容，不能直接覆盖。请保留备份，按需要复制其中的文字。');
  validateState(data.state);
  for(const image of data.images||[]){if(!/^\/assets\/uploads\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|gif)$/.test(image.path))throw new Error('备份中的图片路径不合法。');const bytes=Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0));if(bytes.length>5*1024*1024)throw new Error('备份图片过大。');const blob=new Blob([bytes]);const bitmap=await createImageBitmap(blob);bitmap.close();pendingImages.set(image.path,{base64:image.base64,size:bytes.length,url:URL.createObjectURL(blob)});}
  state=clone(data.state);$('recovery').hidden=true;setDirty();await render();notice('已恢复草稿，请检查后发布。若页面提示缺少图片，请重新上传或导入含图片的备份。');
}
async function init(){
  [manifest,state]=await Promise.all([json('/admin/manifest.json'),json('/admin/state.json')]);baseline=clone(state);sidebar();
  let draft;try{draft=JSON.parse(localStorage.getItem(draftKey));}catch{}if(draft?.state&&serial(draft.state)!==serial(state)){$('recovery').hidden=false;$('restore-draft').onclick=()=>restore(draft).catch(fail);}
  $('discard-draft').onclick=()=>{localStorage.removeItem(draftKey);$('recovery').hidden=true;};
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;render().catch(fail);}));
  document.querySelectorAll('[data-field]').forEach(b=>b.addEventListener('click',()=>{fieldKind=b.dataset.field;document.querySelectorAll('[data-field]').forEach(x=>x.classList.toggle('active',x===b));render().catch(fail);}));
  $('form-language').value=formLanguage;$('form-language').onchange=()=>{formLanguage=$('form-language').value;render().catch(fail);};
  $('scope').onchange=()=>{scope=$('scope').value;render().catch(fail);};$('field-filter').oninput=()=>{filter=$('field-filter').value;render().catch(fail);};
  for(const lang of ['en','zh'])$('preview-'+lang).onclick=()=>{previewLanguage=lang;['en','zh'].forEach(l=>$('preview-'+l).classList.toggle('active',l===lang));updatePreview().catch(fail);};
  $('mobile-preview').onclick=()=>{const narrow=document.querySelector('.preview-frame-wrap').classList.toggle('narrow');$('mobile-preview').setAttribute('aria-pressed',String(narrow));};
  $('new-article').onclick=()=>{const a={id:crypto.randomUUID(),slug:'new-essay-'+Date.now(),author:'',date:londonDate(),status:'draft',zh:{title:'',abstract:'',body:''},en:{title:'',abstract:'',body:''},cover:'',coverAlt:'',revisions:[]};state.articles.articles.push(a);articleID=a.id;setDirty();render().catch(fail);};
  $('connect').onclick=()=>{if(token){token='';headAtConnect=null;$('connect').textContent='连接 GitHub';notice('已退出发布连接。文字草稿仍保留在本机。');}else $('login-dialog').showModal();};$('login-submit').onclick=connect;$('login-dialog').addEventListener('close',()=>{$('github-token').value='';});
  $('publish').onclick=review;$('publish-confirm').onclick=publish;$('export-draft').onclick=exportDraft;$('import-draft').onchange=async()=>{try{const file=$('import-draft').files[0];if(file.size>40*1024*1024)throw new Error('备份过大。');await restore(JSON.parse(await file.text()));}catch(err){fail(err);}};
  window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
  setDirty(); // Do not remove a recoverable draft while loading an unmodified remote version.
  if(draft?.state&&serial(draft.state)!==serial(state))try{localStorage.setItem(draftKey,serial(draft));}catch{}
  await render();
}
init().catch(err=>{fail(err);$('save-state').textContent='载入失败，请刷新重试';});
