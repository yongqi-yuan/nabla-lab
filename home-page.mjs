// Homepage uses real research descriptions and publication records, without placeholder figures.
export function homePage({copy,members,publications,editorial,homePeople,escapeHTML:e}) {
  const c=copy.en;
  const mark=(tone,cls)=>`<img class="nabla-mark ${cls}" src="/assets/nabla-mark-${tone}.svg" width="118" height="90" alt="" aria-hidden="true">`;
  return `<div class="quiet-home visual-home designed-home">
    <header class="photo-masthead">
      <div class="wrap photo-masthead-layout">
        <div class="photo-masthead-heading">
          <h1>${e(c.title)}</h1>
          <p class="photo-masthead-date">${mark('pale','photo-masthead-emblem')}<span>${e(c.foundedLabel)}</span></p>
        </div>
        <div class="photo-masthead-media"><img class="photo-masthead-photo" src="/assets/graduation-hero-full.jpg" width="2400" height="1600" alt="${e(c.heroImageAlt)}" fetchpriority="high"></div>
      </div>
    </header>
    <section class="visual-about wrap" id="about">
      <div class="visual-about-title"><span class="ui-section-number" aria-hidden="true">01 /</span><h2><a href="/about/">${e(c.introPrefix)} <span class="ui-brand-name">Nabla Lab</span></a></h2>${mark('pale','visual-brand-mark')}</div>
      <div>${c.intro.map(p=>`<p>${e(p)}</p>`).join('')}<a class="quiet-link" href="/about/history/">${e(c.aboutLink)} <span aria-hidden="true">→</span></a></div>
    </section>
    <section class="quiet-section visual-research-section" id="research"><div class="wrap">
      <div class="ui-section-heading"><div><span class="ui-section-number" aria-hidden="true">02 /</span><h2><a href="/research/">${e(c.researchTitle)}</a></h2></div></div>
      <div class="research-briefs">${c.topics.map((t,i)=>`<article class="research-brief"><div class="research-brief-heading"><span class="research-brief-index" aria-hidden="true">0${i+1}</span><h3><a href="${e(t.url)}">${e(t.title)}</a></h3></div><ul>${t.items.map(item=>`<li>${e(item)}</li>`).join('')}</ul></article>`).join('')}</div>
    </div></section>
    <section class="quiet-section visual-publications-section" id="publications"><div class="wrap">
      <div class="ui-section-heading"><div><span class="ui-section-number" aria-hidden="true">03 /</span><h2><a href="/research/publications/">${e(c.papersTitle)}</a></h2></div></div>
      ${publications.map(p=>`<article class="publication-record"><div class="publication-record-year"><strong>${p.year}</strong></div><div class="publication-record-body"><p class="visual-paper-journal">${e(p.journal)}</p><h3><a href="https://doi.org/${e(p.doi)}">${e(p.title)}</a></h3><p class="publication-record-authors">${p.authors.map(a=>e(a.name)).join(', ')}</p><a class="quiet-link" href="/research/publications/">${e(c.papersLink)} <span aria-hidden="true">↗</span></a></div></article>`).join('')}
    </div></section>
    <section class="quiet-section visual-people-section" id="community"><div class="wrap community-layout">
      <div class="community-overview"><span class="ui-section-number" aria-hidden="true">04 /</span><h2><a href="/people/">${e(c.peopleTitle)}</a></h2><p>${e(c.peopleIntro)}</p></div>
      <div id="people-circle">${homePeople()}</div>
    </div></section>
    <section class="quiet-section visual-editorial-section" id="editorial"><div class="wrap visual-editorial-grid">
      <div class="visual-editorial-intro"><span class="ui-section-number" aria-hidden="true">05 /</span><h2><a href="/editorial/">${e(c.editorialTitle)}</a></h2><p>${e(c.editorialIntro)}</p><a class="quiet-link" href="/editorial/">${e(c.editorialLink)} <span aria-hidden="true">→</span></a>${mark('white','editorial-ornament')}</div>
      <article class="quiet-essay"><p class="quiet-essay-meta"><time datetime="${editorial.date}">${editorial.date}</time><span>${e(c.foundingLabel)}</span></p><h3><a href="${editorial.url}">${e(editorial.title)}</a></h3><p class="quiet-essay-author">Yongqi Yuan</p></article>
    </div></section>
  </div>`;
}
