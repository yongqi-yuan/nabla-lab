// Homepage uses real research descriptions and publication records, without placeholder figures.
export function homePage({copy,members,publications,editorial,homePeople,escapeHTML:e}) {
  const c=copy.en;
  const mark=(tone,cls)=>`<img class="nabla-mark ${cls}" src="/assets/nabla-mark-${tone}.svg" width="118" height="90" alt="" aria-hidden="true">`;
  return `<div class="quiet-home visual-home designed-home">
    <header class="visual-hero">
      <img class="visual-hero-photo" src="/assets/graduation-dscf4592-4.webp" width="2000" height="1333" alt="${e(c.heroImageAlt)}" fetchpriority="high">
      <div class="visual-hero-shade"></div>
      <div class="wrap visual-hero-inner"><div class="visual-hero-copy">
        <div class="ui-hero-kicker"><span class="ui-red-square" aria-hidden="true"></span><span>${e(c.groupLabel)}</span></div>
        <h1>${e(c.title)}</h1><p>${e(c.heroResearch)}</p>
        <div class="ui-hero-date">${mark('white','hero-brand-mark')}<span>${e(c.foundedLabel)}</span></div>
      </div><p class="visual-image-caption">${e(c.heroImageCaption)}</p></div>
    </header>
    <nav class="ui-home-index" aria-label="${e(c.moreLabel)}"><div class="wrap">${[['about',c.introTitle],['research',c.researchTitle],['publications',c.papersTitle],['community',c.peopleTitle],['editorial',c.editorialTitle]].map(([id,label],i)=>`<a href="#${id}"><span aria-hidden="true">0${i+1}</span>${e(label)}<span aria-hidden="true">↓</span></a>`).join('')}</div></nav>
    <section class="visual-about wrap" id="about">
      <div class="visual-about-title"><span class="ui-section-number" aria-hidden="true">01 /</span><h2>${e(c.introPrefix)} <span class="ui-brand-name">Nabla Lab</span></h2>${mark('pale','visual-brand-mark')}</div>
      <div>${c.intro.map(p=>`<p>${e(p)}</p>`).join('')}<a class="quiet-link" href="/about/history/">${e(c.aboutLink)} <span aria-hidden="true">→</span></a></div>
    </section>
    <section class="quiet-section visual-research-section" id="research"><div class="wrap">
      <div class="ui-section-heading"><div><span class="ui-section-number" aria-hidden="true">02 /</span><h2>${e(c.researchTitle)}</h2></div></div>
      <div class="research-briefs">${c.topics.map((t,i)=>`<article class="research-brief"><span class="research-brief-index" aria-hidden="true">0${i+1}</span><h3>${e(t.title)}</h3><ul>${t.items.map(item=>`<li>${e(item)}</li>`).join('')}</ul></article>`).join('')}</div>
    </div></section>
    <section class="quiet-section visual-publications-section" id="publications"><div class="wrap">
      <div class="ui-section-heading"><div><span class="ui-section-number" aria-hidden="true">03 /</span><h2>${e(c.papersTitle)}</h2></div></div>
      ${publications.map(p=>`<article class="publication-record"><div class="publication-record-year"><span>${e(c.paperYearLabel)}</span><strong>${p.year}</strong></div><div class="publication-record-body"><p class="visual-paper-journal">${e(p.journal)}</p><h3>${e(p.title)}</h3><p class="publication-record-authors">${p.authors.map(a=>e(a.name)).join(', ')}</p><dl class="publication-record-meta"><div><dt>${e(c.volumeLabel)}</dt><dd>${e(p.volume)}</dd></div><div><dt>${e(c.articleLabel)}</dt><dd>${e(p.articleNumber)}</dd></div><div><dt>DOI</dt><dd>${e(p.doi)}</dd></div></dl><a class="quiet-link" href="/research/publications/">${e(c.papersLink)} <span aria-hidden="true">↗</span></a></div></article>`).join('')}
    </div></section>
    <section class="quiet-section visual-people-section" id="community"><div class="wrap community-layout">
      <div class="community-overview"><span class="ui-section-number" aria-hidden="true">04 /</span><h2>${e(c.peopleTitle)}</h2><p>${e(c.peopleIntro)}</p><div class="community-count"><strong>${String(members.length).padStart(2,'0')}</strong><span>${e(c.membersLabel)}</span></div></div>
      <div id="people-circle">${homePeople()}</div>
    </div></section>
    <section class="quiet-section visual-editorial-section" id="editorial"><div class="wrap visual-editorial-grid">
      <div class="visual-editorial-intro"><span class="ui-section-number" aria-hidden="true">05 /</span><h2>${e(c.editorialTitle)}</h2><p>${e(c.editorialIntro)}</p><a class="quiet-link" href="/editorial/">${e(c.editorialLink)} <span aria-hidden="true">→</span></a>${mark('white','editorial-ornament')}</div>
      <article class="quiet-essay"><p class="quiet-essay-meta"><time datetime="${editorial.date}">${editorial.date}</time><span>${e(c.foundingLabel)}</span></p><h3><a href="${editorial.url}">${e(editorial.title)}</a></h3><p class="quiet-essay-author">Yongqi Yuan</p></article>
    </div></section>
  </div>`;
}
