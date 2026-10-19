import fs from 'node:fs';
import path from 'node:path';
import {inspectPage, inspectTextBlocks, renderEditedPage, articleDocument, escapeHTML, validateArticles} from './editor/editor-core.mjs';
const e=escapeHTML;
export function buildCMS(root,routes){
  const dir=path.join(root,'docs'),admin=path.join(root,'.local-studio');
  fs.mkdirSync(admin,{recursive:true});
  const edits=JSON.parse(fs.readFileSync(path.join(root,'site-edits.json'),'utf8'));
  const articles=JSON.parse(fs.readFileSync(path.join(root,'editorial-articles.json'),'utf8'));
  validateArticles(articles);
  if(edits.version!==1||!edits.pages||!edits.shared)throw new Error('Invalid CMS edits');
  const baseDir=path.join(admin,'base');fs.rmSync(baseDir,{recursive:true,force:true});fs.mkdirSync(baseDir,{recursive:true});
  const pageFile=url=>path.join(dir,url,'index.html');
  const manifest={version:1,repo:'yongqi-yuan/nabla-lab',branch:'main',pages:[]};
  const publicArticles=articles.articles.filter(a=>a.status==='published');
  for(const url of routes){
    const originals={};const slug=url==='/'?'home':url.slice(1,-1).replaceAll('/','--');
    for(const lang of ['en','zh']){
      const localURL=(lang==='zh'?'/zh':'')+url;
      let html=fs.readFileSync(pageFile(localURL),'utf8');
      if(url==='/editorial/'&&publicArticles.length){
        const cards=[...publicArticles].sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<a class="editorial-card" href="${lang==='zh'?'/zh':''}/editorial/${a.slug}/"><span class="eyebrow">NABLA EDITORIAL</span><h2>${e(a[lang].title)}</h2><p class="editorial-card-title">${e(lang==='zh'?a.en.title:a.zh.title)}</p><p>${e(a[lang].abstract||a.en.abstract)}</p><div class="editorial-meta"><span>${e(a.author)}</span><time datetime="${a.date}">${a.date}</time></div><span class="inline-action">${lang==='zh'?'阅读全文':'Read the essay'} ↗</span></a>`).join('');
        html=html.replace('<a class="editorial-card"',cards+'<a class="editorial-card"').replace(/01 essay/,`${publicArticles.length+1} essays`);
      }
      originals[lang]=html;
      const file=`${slug}.${lang}.html`;
      fs.writeFileSync(path.join(baseDir,file),html);
      const patch=edits.pages[localURL]?.fields||{};
      const inspected=inspectPage(html,patch,edits.shared[lang]||{});
      const known=new Set(inspected.fields.map(f=>f.key));
      for(const key of Object.keys(patch))if(!known.has(key))console.warn(`CMS: stale field ${localURL} ${key}`);
      const blockKeys=new Set(inspectTextBlocks(html).map(b=>b.key));
      for(const key of Object.keys(edits.pages[localURL]?.blocks||{}))if(!blockKeys.has(key))console.warn(`CMS: stale paragraph ${localURL} ${key}`);
      const final=renderEditedPage(html,edits.pages[localURL]||{},edits.shared[lang]||{},lang);
      fs.writeFileSync(pageFile(localURL),final);
    }
    manifest.pages.push({url,title:decodeTitle(originals.en),zhTitle:decodeTitle(originals.zh),base:{en:`/admin/base/${slug}.en.html`,zh:`/admin/base/${slug}.zh.html`}});
  }
  const shells={en:fs.readFileSync(path.join(baseDir,'editorial.en.html'),'utf8'),zh:fs.readFileSync(path.join(baseDir,'editorial.zh.html'),'utf8')};
  for(const a of publicArticles)for(const lang of ['en','zh']){
    const url=`${lang==='zh'?'/zh':''}/editorial/${a.slug}/`;fs.mkdirSync(path.dirname(pageFile(url)),{recursive:true});
    fs.writeFileSync(pageFile(url),articleDocument(shells[lang],a,lang));
  }
  // Remove generated articles that have been explicitly unpublished or deleted.
  const previous=fs.existsSync(path.join(admin,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(admin,'manifest.json'),'utf8')):{};
  for(const slug of previous.articleSlugs||[])if(!publicArticles.some(a=>a.slug===slug))for(const lang of ['en','zh'])fs.rmSync(path.join(dir,lang==='zh'?'zh':'','editorial',slug),{recursive:true,force:true});
  manifest.articleSlugs=publicArticles.map(a=>a.slug);
  const assetFiles=[];
  function walkAssets(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())walkAssets(file);else if(/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name))assetFiles.push('/'+path.relative(dir,file).split(path.sep).join('/'));}}
  walkAssets(path.join(dir,'assets'));manifest.assets=assetFiles.sort();
  fs.writeFileSync(path.join(admin,'manifest.json'),JSON.stringify(manifest));
  fs.writeFileSync(path.join(admin,'state.json'),JSON.stringify({edits,articles}));
  const urls=[...routes].flatMap(url=>[url,'/zh'+(url==='/'?'/':url)]);
  for(const a of publicArticles)urls.push(`/editorial/${a.slug}/`,`/zh/editorial/${a.slug}/`);
  // Search always reflects the final edited copy, in the correct language.
  for(const lang of ['en','zh']){
    const items=urls.filter(url=>(url.startsWith('/zh/'))===(lang==='zh')).map(url=>{
      const html=fs.readFileSync(pageFile(url),'utf8'),main=html.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1]||'';
      const text=main.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      return {title:decodeTitle(html),url,description:text.slice(0,180),searchText:text};
    });
    fs.writeFileSync(path.join(dir,'assets',lang==='zh'?'search-index.zh.js':'search-index.js'),'window.NABLA_SEARCH_INDEX = '+JSON.stringify(items)+';\n');
  }
  fs.writeFileSync(path.join(dir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>https://nabla.ac.cn${url}</loc></url>`).join('')}</urlset>`);
  fs.writeFileSync(path.join(dir,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://nabla.ac.cn/sitemap.xml\n');
  const css=path.join(dir,'assets/lab.css'),extra='\n/* CMS article media */\n.editorial-body img,.cms-article-cover img{max-width:100%;height:auto}.cms-article-cover{margin:2rem 0}.editorial-body ul{padding-left:1.5rem}\n';
  if(!fs.readFileSync(css,'utf8').includes('/* CMS article media */'))fs.appendFileSync(css,extra);
  // The editor and its snapshots never enter the deployed static folder.
  fs.rmSync(path.join(dir,'admin'),{recursive:true,force:true});
  console.log(`CMS: ${routes.size} bilingual page pairs, ${publicArticles.length} additional published articles.`);
}
function decodeTitle(html){return (html.match(/<title>(.*?)<\/title>/)?.[1]||'Nabla Lab').replace(/\s*[|｜]\s*Nabla Lab$/,'').replace(/&amp;/g,'&');}
