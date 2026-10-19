import fs from 'node:fs';
import path from 'node:path';
import { editorial } from './editorial.mjs';

export function localizeSite(root, routes) {
  const dir=path.join(root,'docs');
  const dictionary=JSON.parse(fs.readFileSync(path.join(root,'translations.zh.json'),'utf8'));
  const homeCopy=JSON.parse(fs.readFileSync(path.join(root,'home-copy.json'),'utf8'));
  const homeDictionary={};let translatingHome=false;
  function homeTranslations(en,zh){
    if(typeof en==='string'&&typeof zh==='string'&&!en.startsWith('/'))homeDictionary[en]=zh;
    else if(en&&zh&&typeof en==='object')for(const key of Object.keys(en))homeTranslations(en[key],zh[key]);
  }
  homeTranslations(homeCopy.en,homeCopy.zh);
  const english=JSON.parse(fs.readFileSync(path.join(root,'editorial.en.json'),'utf8'));
  const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
  const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const months={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  function translate(raw) {
    const value=decode(raw).trim();
    if(translatingHome&&homeDictionary[value])return raw.replace(raw.trim(),escape(homeDictionary[value]));
    if(dictionary[value]) return raw.replace(raw.trim(),escape(dictionary[value]));
    if(value.endsWith(' | Nabla Lab')) return escape(translate(value.slice(0,-12))+'｜Nabla Lab');
    const date=value.match(/^(?:(\d{1,2}) )?([A-Z][a-z]+) (\d{4})$/);
    if(date&&months[date[2]])return `${date[3]} 年 ${months[date[2]]} 月${date[1]?' '+date[1]+' 日':''}`;
    return raw;
  }
  const zhURL=url=>url==='/'?'/zh/':'/zh'+url;
  const isPage=url=>routes.has(url.split('#')[0].split('?')[0])||url==='/404.html';
  function textTransform(html,transform) {
    const scripts=[];
    html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,s=>`___SCRIPT_${scripts.push(s)-1}___`);
    html=html.replace(/>([^<]+)</g,(_,text)=>'>'+transform(text)+'<');
    return html.replace(/___SCRIPT_(\d+)___/g,(_,i)=>scripts[Number(i)]);
  }
  function languageLinks(html,url,zh) {
    const en=url,cn=zhURL(url);
    const controls=`<nav class="language-switch" aria-label="${zh?'语言切换':'Language selection'}"><a href="${en}" lang="en" hreflang="en"${zh?'':' aria-current="page"'}>EN<span class="sr-only"> — English</span></a><span aria-hidden="true">/</span><a href="${cn}" lang="zh-Hans" hreflang="zh-Hans"${zh?' aria-current="page"':''}>中文</a></nav>`;
    html=html.replace('</header>',controls+'</header>');
    html=html.replace('</head>','<script src="/assets/languages.js" defer></script></head>');
    html=html.replace('</head>',`<link rel="alternate" hreflang="en" href="https://nabla.ac.cn${en}"><link rel="alternate" hreflang="zh-Hans" href="https://nabla.ac.cn${cn}"><link rel="alternate" hreflang="x-default" href="https://nabla.ac.cn${en}"></head>`);
    return html;
  }
  function chinese(html,url){
    html=textTransform(html,translate);
    html=html.replace(/\b(aria-label|alt|placeholder|title)="([^"]*)"/g,(_,attr,value)=>`${attr}="${translate(value)}"`);
    html=html.replace(/<html lang="[^"]+">/,'<html lang="zh-Hans">');
    html=html.replace(/href="(\/[^\"]*)"/g,(full,url)=>isPage(url)?`href="${zhURL(url)}"`:full);
    html=html.replace(/(rel="canonical" href="https:\/\/nabla.ac.cn)([^"]*)/g,(_,prefix,url)=>prefix+zhURL(url));
    html=html.replace(/(property="og:url" content="https:\/\/nabla.ac.cn)([^"]*)/g,(_,prefix,url)=>prefix+zhURL(url));
    html=html.replace(/(name="description"|property="og:description") content="[^"]*"/g,(_,key)=>`${key} content="${escape(zhDescriptions[url]||'Nabla Lab 独立学术共同体：科研、成员与思想。')}"`);
    html=html.replace(/(property="og:title" content=")([^"]*)"/g,(_,p,t)=>p+translate(t)+'"');
    html=html.replace('/assets/lab.js','/assets/lab.zh.js').replace('/assets/search-index.js','/assets/search-index.zh.js');
    html=html.replace('<h1>Nabla 社论<span lang="zh-Hans">Nabla 社论</span></h1>','<h1>Nabla 社论<span lang="en">Nabla Editorial</span></h1>');
    html=html.replace('class="editorial-abstract" lang="en"','class="editorial-abstract" lang="zh-Hans"');
    html=html.replace(/<(p|h2)([^>]*)lang="en"([^>]*)>([^<]*[\u4e00-\u9fff][^<]*)<\/\1>/g,(_,tag,a,b,text)=>`<${tag}${a}lang="zh-Hans"${b}>${text}</${tag}>`);
    return languageLinks(html,url,true);
  }
  const zhDescriptions={'/':'Nabla Lab 是源于哈工大（威海）的独立学术共同体，持续开展合作研究、科研训练与经验交流。','/editorial/':'Nabla 社论：记录年轻科研工作者对科研、技术、职业与生活的思考。',[editorial.url]:'Nabla 社论创刊说明：在一个令人兴奋，也令人不安的时代。袁泳棋 / Yongqi Yuan。'};
  const enMap={
    'Nabla 社论':'Nabla Editorial','从组会中的交流出发，记录年轻科研工作者对科研、技术、职业与生活的思考。保持开放，容纳分歧，也为思想的变化留下时间的痕迹。':'Emerging from group discussions, this series records young researchers’ reflections on research, technology, careers and life. It remains open to disagreement and preserves how perspectives change over time.',
    '关于这个栏目':'About this series','每个人都可以有自己的声音':'A voice for every member','所有 Nabla 成员均可署名撰文。文章代表署名作者的观点，不要求形成团队共识。':'All Nabla members may contribute signed articles. Each piece expresses its author’s perspective, without requiring a team consensus.',
    '保留发表时的思考':'Preserving ideas in their time','保留原始论述与首次发表日期。后续认识以新文章、注明日期的注释或后记补充；更正保留说明。':'Original arguments and first publication dates are preserved. Later perspectives appear in new essays or dated annotations and postscripts; corrections remain documented.',
    '尊重讨论中的每个人':'Respecting everyone in a discussion','引用成员观点前征得本人同意，必要时经同意匿名处理。当前通过邮件交流读者反馈。':'Members’ views are quoted with consent and, where appropriate, anonymised by agreement. Reader feedback is currently welcomed by email.',
    '继续这场讨论':'Continue the conversation','欢迎通过邮件分享问题、不同意见或阅读反馈。未经同意，来信不会作为署名观点公开引用。':'Questions, differing views and feedback are welcome by email. Correspondence will not be quoted with attribution without consent.',
    '这是一个既让人兴奋，又让人不安的时代。我们希望把生活在其中的思考，认真地记录下来。':'This is an age that is both exciting and unsettling. We want to keep a thoughtful record of what it means to live through it.',
    '发表记录':'Publication record','首次发表：':'First published: ','2026 年 10 月 18 日':'18 October 2026','。本文为创刊说明。后续如有更正或补充，将在此标注日期与内容。':'. This is the founding note. Dated corrections or additions will be recorded here.',
    '© 2026 袁泳棋 / Yongqi Yuan。本文代表署名作者的观点。':'© 2026 袁泳棋 / Yongqi Yuan. This article represents the named author’s views.','返回 Nabla 社论':'Back to Nabla Editorial','记录科研、技术与生活中的问题，也记录我们如何改变自己的看法。':'Recording questions about research, technology and life — and how we change our minds.'
  };
  Object.assign(enMap,{
    '栏目源于组会中的非正式交流。所有成员都可以撰文，读者可通过邮件反馈。':'The series grew out of informal group discussions. All members may contribute, and readers can send feedback by email.',
    '成员署名':'Signed contributions','发表与更正记录':'Publication and correction records','引用与反馈':'Quotations and feedback','邮件反馈':'Feedback by email'
  });
  editorial.sections.forEach(([heading,paras],i)=>{enMap[heading]=english.headings[i];paras.forEach((p,j)=>{enMap[p]=english.paragraphs[i][j];});});
  for(const url of [...routes,'/404.html']){
    translatingHome=url==='/';
    const file=url==='/404.html'?path.join(dir,'404.html'):path.join(dir,url,'index.html');
    const original=fs.readFileSync(file,'utf8');
    const zhFile=url==='/404.html'?path.join(dir,'zh/404.html'):path.join(dir,'zh',url,'index.html');
    fs.mkdirSync(path.dirname(zhFile),{recursive:true});
    fs.writeFileSync(zhFile,chinese(original,url));
    let en=original;
    if(url.startsWith('/editorial/')||url==='/'){
      en=textTransform(en,text=>{const key=decode(text).trim();return enMap[key]?text.replace(text.trim(),escape(enMap[key])):text;});
      if(url===editorial.url){
        en=en.replace('<html lang="zh-Hans">','<html lang="en">').replace('"inLanguage":"zh-Hans"','"inLanguage":"en"').replace('class="editorial-body" lang="zh-Hans"','class="editorial-body" lang="en"');
        // The original Chinese remains unchanged at the corresponding Chinese URL.
        en=en.replace('<p class="editorial-opening">',`<p class="translation-note">English translation · 19 October 2026. <a href="${zhURL(url)}" lang="zh-Hans">中文原文</a> first published 18 October 2026.</p><p class="editorial-opening">`);
      }
      en=en.replace('<h1>Nabla Editorial<span lang="zh-Hans">Nabla Editorial</span></h1>','<h1>Nabla Editorial<span lang="zh-Hans">Nabla 社论</span></h1>');
      en=en.replace(/<(p|h2)([^>]*)lang="zh-Hans"([^>]*)>([^<]+)<\/\1>/g,(full,tag,a,b,text)=>/[\u4e00-\u9fff]/.test(text)?full:`<${tag}${a}lang="en"${b}>${text}</${tag}>`);
      for(const cls of ['editorial-feedback','editorial-principles'])en=en.replace(`class="${cls}" lang="zh-Hans"`,`class="${cls}" lang="en"`);
    }
    fs.writeFileSync(file,languageLinks(en,url,false));
  }
  const search=fs.readFileSync(path.join(dir,'assets/search-index.js'),'utf8');
  const pages=JSON.parse(search.slice(search.indexOf('=')+1).trim().replace(/;$/,''));
  const zpages=pages.map(p=>({...p,title:p.title.split(' · ').map(s=>decode(translate(s))).join(' · '),url:zhURL(p.url),description:decode(translate(p.description))}));
  // Read Chinese rendered page text to index full translated content, including names and subjects.
  for(const p of zpages){const file=path.join(dir,p.url.split('#')[0],'index.html');if(fs.existsSync(file)){
    const html=fs.readFileSync(file,'utf8');
    const main=html.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1]||'';
    const plain=fragment=>decode(fragment.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
    p.searchText=plain(main);
    p.description=plain(main.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||main).slice(0,180);
  }}
  fs.writeFileSync(path.join(dir,'assets/search-index.zh.js'),'window.NABLA_SEARCH_INDEX = '+JSON.stringify(zpages)+';\n');
  let js=fs.readFileSync(path.join(dir,'assets/lab.js'),'utf8');
  js=js.replace("(page.title+' '+page.description)","(page.title+' '+page.description+' '+(page.searchText||''))");
  js=js.replace("`${matches.length} result${matches.length === 1 ? '' : 's'} for “${input.value.trim()}”`",'`“${input.value.trim()}” 的搜索结果：${matches.length} 条`').replace('Browse the site, or type to search.','浏览本站，或输入关键词搜索。').replace('No matching pages. Try a research topic or a member’s name.','未找到匹配页面，请尝试研究主题或成员姓名。').replaceAll('Resume motion','继续运动').replaceAll('Pause motion','暂停运动');
  fs.writeFileSync(path.join(dir,'assets/lab.zh.js'),js);
  const sitemap=[...routes].flatMap(url=>[url,zhURL(url)]).map(url=>`<url><loc>https://nabla.ac.cn${url}</loc></url>`).join('');
  fs.writeFileSync(path.join(dir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</urlset>`);
  console.log(`Bilingual build: ${routes.size} English + ${routes.size} Chinese pages.`);
}
