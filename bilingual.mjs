import fs from 'node:fs';
import path from 'node:path';
import { editorial } from './editorial.mjs';

export function localizeSite(root, routes) {
  const dir=path.join(root,'docs');
  const dictionary=JSON.parse(fs.readFileSync(path.join(root,'translations.zh.json'),'utf8'));
  const content=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
  const bibliographicNames=new Set((content.publications||[]).flatMap(publication=>[publication.title,publication.journal]));
  const members=content.people?.members||[];
  const names=members.filter(member=>member.name&&member.chineseName).map(member=>[member.name,member.chineseName]);
  for(const [en,zh] of names)dictionary[en]=zh;
  dictionary[editorial.title]=editorial.chineseTitle;
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
  function chineseValue(value) {
    // Published titles and journal names keep the publisher's English wording.
    if(bibliographicNames.has(value))return value;
    if(translatingHome&&homeDictionary[value])return homeDictionary[value];
    if(dictionary[value])return dictionary[value];
    if(value.endsWith(' | Nabla Lab'))return chineseValue(value.slice(0,-12))+'｜Nabla Lab';
    // Bibliographic numbers, identifiers and software names remain intact.
    let translated=value;
    for(const [en,zh] of names)translated=translated.replaceAll(`${zh} / ${en}`,zh).replaceAll(en,zh);
    translated=translated.replaceAll(editorial.title,editorial.chineseTitle);
    translated=translated.replace(/(?:(\d{1,2}) )?([A-Z][a-z]+) (\d{4})\b/g,(full,day,month,year)=>months[month]?`${year} 年 ${months[month]} 月${day?' '+day+' 日':''}`:full);
    translated=translated.replace(/\bPart (\d+)\b/g,'第 $1 分册').replace(/\bArticle (\d+)\b/g,'文章编号 $1');
    if(translated.includes(' · '))translated=translated.split(' · ').map(part=>dictionary[part]||part).join(' · ');
    return translated;
  }
  const translate=raw=>raw.replace(raw.trim(),escape(chineseValue(decode(raw).trim())));
  const zhURL=url=>url==='/'?'/zh/':'/zh'+url;
  const isPage=url=>routes.has(url.split('#')[0].split('?')[0])||url==='/404.html';
  function textTransform(html,transform) {
    const scripts=[];
    html=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,s=>`___SCRIPT_${scripts.push(s)-1}___`);
    html=html.replace(/>([^<]+)</g,(_,text)=>'>'+transform(text)+'<');
    return html.replace(/___SCRIPT_(\d+)___/g,(_,i)=>scripts[Number(i)]);
  }
  function languageLinks(html,url,zh) {
    const en=url,cn=zhURL(url);
    const controls=`<nav class="language-switch" aria-label="${zh?'语言切换':'Language selection'}"><a href="${en}" lang="en" hreflang="en"${zh?'':' aria-current="page"'}>${zh?'英文':'EN'}<span class="sr-only">${zh?'版本':' — English'}</span></a><span aria-hidden="true">/</span><a href="${cn}" lang="zh-Hans" hreflang="zh-Hans"${zh?' aria-current="page"':''}>${zh?'中文':'ZH'}<span class="sr-only">${zh?'版本':' — Chinese'}</span></a></nav>`;
    html=html.replace('<button class="search-open"',controls+'<button class="search-open"');
    html=html.replace('</head>','<script src="/assets/languages.js" defer></script></head>');
    html=html.replace('</head>',`<link rel="alternate" hreflang="en" href="https://nabla.ac.cn${en}"><link rel="alternate" hreflang="zh-Hans" href="https://nabla.ac.cn${cn}"><link rel="alternate" hreflang="x-default" href="https://nabla.ac.cn${en}"></head>`);
    return html;
  }
  function removeParallelCopy(html) {
    // Templates use English primary names/titles and a second Chinese line.
    // Keep the primary line; Chinese pages translate it once below.
    html=html.replace(/<span\b[^>]*class="(?:profile-chinese|member-chinese|community-chinese)"[^>]*>[\s\S]*?<\/span>/g,'');
    html=html.replace(/(<a\b[^>]*class="quiet-person-name"[^>]*>)\s*<span(?:\s[^>]*)?>[\u3400-\u9fff]+<\/span>/g,'$1');
    html=html.replace(/<p\b[^>]*class="(?:editorial-subtitle|editorial-card-title)"[^>]*>[\s\S]*?<\/p>/g,'');
    html=html.replace(/<span\s+lang="zh-Hans">Nabla 社论<\/span>/g,'');
    html=html.replace(/<p\s+lang="zh-Hans">在一个令人兴奋，也令人不安的时代<\/p>/g,'');
    return html;
  }
  function typesetNabla(html) {
    // This is mathematical notation in prose; logos and metadata are untouched.
    return html.replace(/(<main\b[^>]*>)([\s\S]*?)(<\/main>)/g,(_,start,body,end)=>start+body.replace(/<p\b[^>]*>[\s\S]*?<\/p>/g,paragraph=>paragraph.includes('∇')&&!paragraph.includes('class="math-nabla"')?textTransform(paragraph,text=>text.replaceAll('∇','<span class="math-nabla">∇</span>')):paragraph)+end);
  }
  function structuredData(html,zh) {
    return html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(full,start,json,end)=>{
      let data;try{data=JSON.parse(json);}catch{return full;}
      const localize=(item)=>{
        if(Array.isArray(item))return item.map(localize);
        if(!item||typeof item!=='object')return item;
        if(item['@type']==='ScholarlyArticle')return item;
        const result={};
        for(const [key,value] of Object.entries(item)){
          if(key==='alternateName'||key==='alternativeHeadline')continue;
          if(key==='inLanguage')result[key]=zh?'zh-Hans':'en';
          else if(['headline','name','description'].includes(key)&&typeof value==='string')result[key]=zh?chineseValue(value):englishValue(value);
          else if(key==='mainEntityOfPage'&&typeof value==='string')result[key]=zh?value.replace('https://nabla.ac.cn/','https://nabla.ac.cn/zh/'):value;
          else result[key]=localize(value);
        }
        return result;
      };
      return start+JSON.stringify(localize(data)).replace(/</g,'\\u003c')+end;
    });
  }
  function chinese(html,url){
    html=removeParallelCopy(html);
    // Bibliographic author lines and citations remain verbatim. Profile names
    // and explanatory prose still use Chinese, as do the surrounding labels.
    const bibliography=[];
    html=html.replace(/<(p|cite)\b[^>]*class="[^"]*\b(?:publication-authors|publication-record-authors|publication-journal|quiet-authors|quiet-citation|visual-paper-journal)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g,fragment=>`___BIBLIOGRAPHY_${bibliography.push(fragment)-1}___`);
    html=textTransform(html,translate);
    html=html.replace(/\b(aria-label|alt|placeholder|title)="([^"]*)"/g,(_,attr,value)=>`${attr}="${translate(value)}"`);
    html=html.replace(/\blang="(?:en|zh-Hans)"/g,'lang="zh-Hans"');
    html=html.replace(/href="(\/[^\"]*)"/g,(full,url)=>isPage(url)?`href="${zhURL(url)}"`:full);
    html=html.replace(/(rel="canonical" href="https:\/\/nabla.ac.cn)([^"]*)/g,(_,prefix,url)=>prefix+zhURL(url));
    html=html.replace(/(property="og:url" content="https:\/\/nabla.ac.cn)([^"]*)/g,(_,prefix,url)=>prefix+zhURL(url));
    html=html.replace(/(name="description"|property="og:description") content="[^"]*"/g,(_,key)=>`${key} content="${escape(zhDescriptions[url]||'Nabla Lab 独立学术共同体：科研、成员与思想。')}"`);
    html=html.replace(/(property="og:title" content=")([^"]*)"/g,(_,p,t)=>p+translate(t)+'"');
    html=html.replace('/assets/lab.js','/assets/lab.zh.js').replace('/assets/search-index.js','/assets/search-index.zh.js');
    html=html.replace(/___BIBLIOGRAPHY_(\d+)___/g,(_,index)=>bibliography[Number(index)].replace(/\blang="[^"]*"/g,'').replace(/^<(p|cite)\b/,'<$1 lang="en"').replace(/href="(\/[^\"]*)"/g,(full,href)=>isPage(href)?`href="${zhURL(href)}"`:full));
    // The formal English title is also marked for correct screen-reader pronunciation.
    html=html.replace(/(<main\b[^>]*>)([\s\S]*?)(<\/main>)/g,(_,start,body,end)=>start+textTransform(body,raw=>bibliographicNames.has(decode(raw).trim())?raw.replace(raw.trim(),`<span lang="en">${raw.trim()}</span>`):raw)+end);
    html=typesetNabla(structuredData(html,true));
    return languageLinks(html,url,true);
  }
  const zhDescriptions={'/':'Nabla Lab 是源于哈工大（威海）的独立学术共同体，持续开展合作研究、科研训练与经验交流。','/editorial/':'Nabla 社论：记录年轻科研工作者对科研、技术、职业与生活的思考。',[editorial.url]:'Nabla 社论创刊说明：在一个令人兴奋，也令人不安的时代。袁泳棋。'};
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
    '成员署名':'Signed contributions','发表与更正记录':'Publication and correction records','引用与反馈':'Quotations and feedback','邮件反馈':'Feedback by email',
    'NABLA EDITORIAL · NABLA 社论':'NABLA EDITORIAL','FOUNDING NOTE · 创刊说明':'FOUNDING NOTE','创刊说明 / Founding note':'Founding note',
    'Nabla 社论：以中文文章、英文标题与摘要，记录年轻科研工作者对科研、人工智能、技术、职业与生活的思考。':'Nabla Editorial: essays by young researchers on research, artificial intelligence, technology, careers and everyday life.'
  });
  editorial.sections.forEach(([heading,paras],i)=>{enMap[heading]=english.headings[i];paras.forEach((p,j)=>{enMap[p]=english.paragraphs[i][j];});});
  function englishValue(value) {
    let translated=enMap[value]||value;
    for(const [en,zh] of names)translated=translated.replaceAll(`${zh} / ${en}`,en).replaceAll(zh,en);
    return translated.replaceAll(editorial.chineseTitle,editorial.title);
  }
  const translateEnglish=raw=>raw.replace(raw.trim(),escape(englishValue(decode(raw).trim())));
  for(const url of [...routes,'/404.html']){
    translatingHome=url==='/';
    const file=url==='/404.html'?path.join(dir,'404.html'):path.join(dir,url,'index.html');
    const original=fs.readFileSync(file,'utf8');
    const zhFile=url==='/404.html'?path.join(dir,'zh/404.html'):path.join(dir,'zh',url,'index.html');
    fs.mkdirSync(path.dirname(zhFile),{recursive:true});
    fs.writeFileSync(zhFile,chinese(original,url));
    let en=textTransform(removeParallelCopy(original),translateEnglish);
    en=en.replace(/\b(aria-label|alt|placeholder|title|content)="([^"]*)"/g,(_,attr,value)=>`${attr}="${translateEnglish(value)}"`);
    en=en.replace(/\blang="zh-Hans"/g,'lang="en"');
    if(url===editorial.url){
      // The corresponding Chinese page retains the original essay and publication date.
      en=en.replace('<p class="editorial-opening">',`<p class="translation-note">English translation · 19 October 2026. <a href="${zhURL(url)}">Chinese original</a> first published 18 October 2026.</p><p class="editorial-opening">`);
    }
    en=typesetNabla(structuredData(en,false));
    fs.writeFileSync(file,languageLinks(en,url,false));
  }
  const search=fs.readFileSync(path.join(dir,'assets/search-index.js'),'utf8');
  const pages=JSON.parse(search.slice(search.indexOf('=')+1).trim().replace(/;$/,''));
  const titleFor=(title,localize)=>[...new Set(title.split(' · ').map(localize))].join(' · ');
  const epages=pages.map(p=>({...p,title:titleFor(p.title,englishValue),description:englishValue(p.description)}));
  const zpages=pages.map(p=>({...p,title:titleFor(p.title,chineseValue),url:zhURL(p.url),description:chineseValue(p.description)}));
  // Both indexes derive their searchable copy from the final single-language pages.
  const plain=fragment=>decode(fragment.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
  for(const p of [...epages,...zpages]){const file=path.join(dir,p.url.split('#')[0],'index.html');if(fs.existsSync(file)){
    const html=fs.readFileSync(file,'utf8');
    const main=html.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1]||'';
    p.searchText=plain(main);
    p.description=plain(main.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||main).slice(0,180);
  }}
  fs.writeFileSync(path.join(dir,'assets/search-index.js'),'window.NABLA_SEARCH_INDEX = '+JSON.stringify(epages)+';\n');
  fs.writeFileSync(path.join(dir,'assets/search-index.zh.js'),'window.NABLA_SEARCH_INDEX = '+JSON.stringify(zpages)+';\n');
  let js=fs.readFileSync(path.join(dir,'assets/lab.js'),'utf8');
  js=js.replace("(page.title+' '+page.description)","(page.title+' '+page.description+' '+(page.searchText||''))");
  js=js.replace("`${matches.length} result${matches.length === 1 ? '' : 's'} for “${input.value.trim()}”`",'`“${input.value.trim()}” 的搜索结果：${matches.length} 条`').replace('Browse the site, or type to search.','浏览本站，或输入关键词搜索。').replace('No matching pages. Try a research topic or a member’s name.','未找到匹配页面，请尝试研究主题或成员姓名。').replaceAll('Resume motion','继续运动').replaceAll('Pause motion','暂停运动');
  fs.writeFileSync(path.join(dir,'assets/lab.zh.js'),js);
  const sitemap=[...routes].flatMap(url=>[url,zhURL(url)]).map(url=>`<url><loc>https://nabla.ac.cn${url}</loc></url>`).join('');
  fs.writeFileSync(path.join(dir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</urlset>`);
  console.log(`Bilingual build: ${routes.size} English + ${routes.size} Chinese pages.`);
}
