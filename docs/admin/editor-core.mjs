// Shared by the static build and editor: previews use the exact publication renderer.
export const escapeHTML = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function decodeHTML(s='') {return s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|#39);/gi,(all,k)=>{if(k[0]==='#'){const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):all;}return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[k.toLowerCase()]||all;});}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(36);}
const tokenRE=/<!--[\s\S]*?-->|<(script|style|svg|noscript|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]+>|[^<]+/gi;
const attr=(tag,name)=>decodeHTML(tag.match(new RegExp('\\b'+name+'="([^"]*)"','i'))?.[1]||'');
function setAttr(tag,name,value){const re=new RegExp('\\b'+name+'="[^"]*"','i');if(re.test(tag)&&attr(tag,name)===String(value))return tag;return re.test(tag)?tag.replace(re,`${name}="${escapeHTML(value)}"`):tag.replace(/\s*\/?>$/,` ${name}="${escapeHTML(value)}">`);}
export function safeURL(value,{image=false}={}) {
  if(typeof value!=='string'||/[\x00-\x20\\]/.test(value))return false;
  if(image)return /^\/assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)&&!value.includes('..');
  return /^https:\/\/[^/]+/i.test(value)||/^mailto:[^<>]+@[^<>]+$/i.test(value)||/^#[\w-]*$/.test(value)||(/^\/(?!\/)/.test(value)&&!value.includes('..'));
}
export function inspectPage(html,patch={},shared={}) {
  const fields=[],counts={},stack=[];let main=false,head=false,section='页面',out='';
  const id=(kind,value,scope)=>{const stem=`${scope}-${kind}-${hash(value)}`;const n=counts[stem]||0;counts[stem]=n+1;return `${stem}-${n}`;};
  const add=(kind,value,label,scope='main',extra={})=>{const key=id(kind,value,scope);const changed=(scope==='shared'?shared:patch)[key];const f={key,kind,value,label,scope,section,...extra};fields.push(f);return changed===undefined?value:changed;};
  for(const token of html.match(tokenRE)||[]) {
    if(/^<!--|^<(script|style|svg|noscript|textarea)\b/i.test(token)){out+=token;continue;}
    if(token[0]==='<'){
      const name=token.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();const closing=/^<\//.test(token);
      if(name==='main')main=!closing;if(name==='head')head=!closing;
      if(closing){const idx=stack.lastIndexOf(name);if(idx>=0)stack.splice(idx);out+=token;continue;}
      const scope=main?'main':'shared';let tag=token;
      if(main&&/^(section|article)$/.test(name))section=attr(token,'id')||attr(token,'class').split(' ')[0]||'页面';
      if(head&&name==='meta'&&attr(token,'name')==='description')tag=setAttr(tag,'content',add('description',attr(token,'content'),'搜索摘要','main'));
      if(!head&&name==='img'){
        const original=attr(token,'src'),value=add('image',original,'图片',scope,{alt:attr(token,'alt')});
        if(!safeURL(value,{image:true}))throw new Error('图片地址必须是本站 /assets/ 下的图片。');
        tag=setAttr(tag,'src',value);tag=setAttr(tag,'alt',add('alt',attr(token,'alt'),'图片说明',scope,{imageKey:fields.at(-1).key}));
      }
      if(!head&&name==='a'&&attr(token,'href')&&!/language-switch/.test(stack.join(' '))){
        // Language counterparts and anchors remain fixed; external/contact/content links may be edited.
        const href=attr(token,'href');
        if(!attr(token,'hreflang')&&!href.startsWith('#')){const v=add('link',href,'链接地址',scope);if(!safeURL(v))throw new Error('链接必须为 HTTPS、邮件地址或本站路径。');tag=setAttr(tag,'href',v);}
      }
      out+=tag;if(name&&!/^(img|meta|link|br|hr|input|source|wbr|area|base|embed)$/.test(name)&&!token.endsWith('/>'))stack.push(name);continue;
    }
    if(!token.trim()){out+=token;continue;}
    const parent=stack.at(-1);if(head&&parent!=='title'){out+=token;continue;}
    if(!head&&!stack.includes('body')){out+=token;continue;}
    if(parent==='time'&&/class="editorial-essay"/.test(html)){out+=token;continue;}
    const original=decodeHTML(token.trim());
    if(!/[\p{L}\p{N}]/u.test(original)){out+=token;continue;}
    const kind=head?'title':'text',scope=head||main?'main':'shared';
    const label=head?'浏览器标题':({h1:'主标题',h2:'章节标题',h3:'小标题',p:'正文',time:'日期',a:'链接文字',span:'文字',li:'列表项目'})[parent]||'文字';
    const value=add(kind,original,label,scope,{tag:parent});
    out+=value===original?token:token.replace(token.trim(),escapeHTML(value));
  }
  return {fields,html:out};
}
export function londonDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validateArticles(data) {
  if(!data||!Array.isArray(data.articles))throw new Error('社论数据格式错误。');
  const slugs=new Set();
  for(const a of data.articles){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)||a.slug==='an-exciting-and-unsettling-age'||slugs.has(a.slug))throw new Error('文章网址必须唯一，使用小写英文、数字和短横线。');slugs.add(a.slug);
    if(!['draft','published'].includes(a.status))throw new Error('文章状态错误。');
    if(!a.author?.trim()||!a.en?.title?.trim()||!a.zh?.title?.trim())throw new Error('请填写署名及中英文标题。');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||Number.isNaN(Date.parse(a.date+'T12:00:00Z'))||new Date(a.date+'T12:00:00Z').toISOString().slice(0,10)!==a.date)throw new Error('请填写有效的发表日期。');
    if(a.status==='published'&&(!a.en.abstract?.trim()||!a.zh.body?.trim()))throw new Error('公开社论需要英文摘要与中文正文。');
    if(a.cover&&!safeURL(a.cover,{image:true}))throw new Error('封面图片地址无效。');
  }
}
function inline(s){return escapeHTML(s).replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(all,alt,url)=>safeURL(decodeHTML(url),{image:true})?`<img src="${url}" alt="${alt}" loading="lazy">`:all).replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g,(all,label,url)=>safeURL(decodeHTML(url))?`<a href="${url}" rel="noopener noreferrer">${label}</a>`:all).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
export function markdown(text='') {
  return text.replace(/\r/g,'').split(/\n\s*\n/).filter(s=>s.trim()).map(block=>{const h=block.match(/^(#{1,3})\s+([^\n]+)$/);if(h)return `<h${h[1].length+1}>${inline(h[2])}</h${h[1].length+1}>`;if(block.split('\n').every(l=>/^[-*] /.test(l)))return '<ul>'+block.split('\n').map(l=>`<li>${inline(l.slice(2))}</li>`).join('')+'</ul>';return `<p>${inline(block).replace(/\n/g,'<br>')}</p>`;}).join('\n');
}
export function articleMain(a,lang='zh') {
  const zh=lang==='zh',base=zh?'/zh':'',l=a[lang],title=l.title||a.en.title;
  return `<article class="editorial-essay"><header class="editorial-essay-header"><nav class="breadcrumb" aria-label="${zh?'面包屑导航':'Breadcrumb'}"><a href="${base}/">${zh?'首页':'Home'}</a><span>/</span><a href="${base}/editorial/">${zh?'Nabla 社论':'Nabla Editorial'}</a></nav><span class="eyebrow">NABLA EDITORIAL</span><h1>${escapeHTML(title)}</h1><p class="editorial-subtitle">${escapeHTML(zh?a.en.title:a.zh.title)}</p><div class="editorial-meta"><span>${escapeHTML(a.author)}</span><time datetime="${a.date}">${a.date}</time>${a.status==='draft'?'<span>草稿 · DRAFT</span>':''}</div><div class="editorial-abstract" lang="en"><h2>Abstract</h2><p>${escapeHTML(a.en.abstract)}</p></div>${a.cover?`<figure class="cms-article-cover"><img src="${escapeHTML(a.cover)}" alt="${escapeHTML(a.coverAlt||'')}" loading="lazy"></figure>`:''}</header><div class="editorial-body" lang="${zh?'zh-Hans':'en'}">${l.body?.trim()?markdown(l.body):`<p>${zh?'':'This essay is available in Chinese. '}<a href="/zh/editorial/${a.slug}/">阅读中文原文</a></p>`}${a.revisions?.length?`<aside class="editorial-record"><h2>${zh?'更正与补充':'Corrections and additions'}</h2>${a.revisions.map(r=>`<p><time>${escapeHTML(r.date)}</time> — ${escapeHTML(r.note)}</p>`).join('')}</aside>`:''}<div class="editorial-record"><p>${zh?'首次发表':'First published'}: ${a.date}. © ${a.date.slice(0,4)} ${escapeHTML(a.author)}.</p><p>${zh?'本文代表署名作者的观点。':'This article represents the named author’s views.'}</p></div><div class="editorial-feedback"><h2>${zh?'继续这场讨论':'Continue the conversation'}</h2><a href="mailto:yongqi.yuan@eng.ox.ac.uk?subject=Nabla%20Editorial%20feedback">yongqi.yuan@eng.ox.ac.uk</a></div></div></article>`;
}
export function articleDocument(shell,a,lang='zh') {
  const url=`${lang==='zh'?'/zh':''}/editorial/${a.slug}/`,title=a[lang].title||a.en.title;
  return shell.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${articleMain(a,lang)}</main>`).replace(/<title>[\s\S]*?<\/title>/,`<title>${escapeHTML(title)} | Nabla Lab</title>`).replace(/(name="description" content=")[^"]*/,(_,p)=>p+escapeHTML(a[lang].abstract||a.en.abstract)).replace(/(property="og:title" content=")[^"]*/,(_,p)=>p+escapeHTML(title)).replace(/(property="og:description" content=")[^"]*/,(_,p)=>p+escapeHTML(a[lang].abstract||a.en.abstract)).replace(/(rel="canonical" href=")[^"]*/,(_,p)=>p+'https://nabla.ac.cn'+url).replace(/(property="og:url" content=")[^"]*/,(_,p)=>p+'https://nabla.ac.cn'+url).replace(/(<link rel="alternate" hreflang="(?:en|x-default)" href=")[^"]*/g,(_,p)=>p+'https://nabla.ac.cn/editorial/'+a.slug+'/').replace(/(<link rel="alternate" hreflang="zh-Hans" href=")[^"]*/g,(_,p)=>p+'https://nabla.ac.cn/zh/editorial/'+a.slug+'/').replace(/(<a href=")[^"]*(" lang="(?:en|zh-Hans)" hreflang=)/g,(_,p,suffix)=>p+(suffix.includes('zh-Hans')?'/zh':'')+'/editorial/'+a.slug+'/'+suffix);
}
