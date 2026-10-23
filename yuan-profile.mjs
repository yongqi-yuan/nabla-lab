const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderYuanProfile({yuan, year, educationHistory, publicationCard, publications, wavesDiagram, academicLink, arrow}) {
  const month = date => new Intl.DateTimeFormat('en-GB', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'-01T12:00:00Z'));
  const sections = [['about','About'],['education','Education'],['research','Research'],['publications','Publications'],['awards','Awards & honours'],['contact','Contact details'],['links','Links']];
  const awards = yuan.awards.map(a => `<li><time datetime="${esc(a.date)}">${month(a.date)}</time><div><h3>${esc(a.name)}</h3><p class="profile-award-institution">${esc(a.institution)}</p>${a.description ? `<p>${esc(a.description)}</p>` : ''}</div></li>`).join('');
  const researchItems = yuan.interests.map(t => `<li>${esc(t)}</li>`).join('');
  return `<section class="profile-hero" id="home"><div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/people/">People</a><span aria-hidden="true">/</span><span aria-current="page">${esc(yuan.name)}</span></nav>
    <div class="profile-hero-grid"><div class="profile-intro"><span class="eyebrow">PERSONAL ACADEMIC PROFILE</span><h1>${esc(yuan.name)}</h1><span class="profile-chinese" lang="zh-Hans">${esc(yuan.chineseName)}</span><p class="profile-position">${esc(yuan.role)}<br><span>${esc(yuan.institution)} · ${esc(yuan.additionalAffiliation)}</span></p><p class="profile-summary">Fluid mechanics · Nonlinear wave forces · Wave–structure interaction</p><a class="button button-red" href="#research">Research interests <span aria-hidden="true">→</span></a></div>
    <figure class="profile-portrait"><img src="${esc(yuan.portrait.src)}" alt="${esc(yuan.portrait.alt)}" width="${yuan.portrait.width}" height="${yuan.portrait.height}" style="object-position:${esc(yuan.portrait.objectPosition)}" fetchpriority="high"></figure></div>
  </div></section>
  <div class="profile-section-bar"><nav class="wrap profile-section-nav profile-section-nav-yuan" aria-label="Profile sections">${sections.map(([id,label],i)=>`<a href="#${id}"${i===0?' class="active" aria-current="location"':''}>${label}</a>`).join('')}</nav></div>
  <div class="wrap section-space profile-layout"><div class="profile-main">
    <section class="profile-section prose" id="about" aria-labelledby="profile-about-title"><span class="eyebrow">01 / ABOUT</span><h2 id="profile-about-title">About</h2>
      <p class="lead">I am a graduate student in the Department of Engineering Science and at Lady Margaret Hall, University of Oxford.</p>
      <p>I am studying towards a DPhil in Engineering Science. My current academic status is ${esc(yuan.academicStatus)}.</p>
      <p>My research focuses on nonlinear wave forces and wave–structure interaction, combining computational fluid dynamics with theoretical analysis.</p>
      <p>I am a co-founder and member of Nabla Lab, where I continue collaborative research with members based at different institutions.</p>

    </section>
    <section class="profile-section prose" id="education" aria-labelledby="profile-education-title"><span class="eyebrow">02 / EDUCATION</span><h2 id="profile-education-title">Education</h2>${educationHistory(yuan)}
      <div class="profile-education-note"><span class="eyebrow">JOINT UNDERGRADUATE PROGRAMME</span><p>My undergraduate background is in the joint programme between Harbin Institute of Technology, Weihai and the University of Strathclyde.</p><a class="inline-action" href="/about/#shared-background">Our shared background ${arrow}</a></div>
    </section>
    <section class="profile-section prose" id="research" aria-labelledby="profile-research-title"><span class="eyebrow">03 / RESEARCH</span><h2 id="profile-research-title">Research interests</h2><ul class="profile-interest-list">${researchItems}</ul>
      <a class="inline-action" href="/research/fluid-mechanics/">Explore fluid mechanics and computation ${arrow}</a>
    </section>
    <section class="profile-section prose" id="publications" aria-labelledby="profile-publications-title"><span class="eyebrow">04 / PUBLICATIONS</span><h2 id="profile-publications-title">Publications</h2>${publications.filter(p=>p.authors.some(a=>a.slug===yuan.slug)).map(p=>publicationCard(p,yuan.slug)).join('')}<a class="inline-action" href="/research/publications/">All publications at Nabla Lab ${arrow}</a></section>
    <section class="profile-section prose" id="awards" aria-labelledby="profile-awards-title"><span class="eyebrow">05 / AWARDS</span><h2 id="profile-awards-title">Awards &amp; honours</h2><ol class="profile-awards-list">${awards}</ol></section>
    <section class="profile-section prose" id="contact" aria-labelledby="profile-contact-title"><span class="eyebrow">06 / CONTACT</span><h2 id="profile-contact-title">Contact details</h2><dl class="profile-contact-list"><dt>Academic email</dt><dd><a href="mailto:${esc(yuan.contact.academicEmail)}">${esc(yuan.contact.academicEmail)} ${arrow}</a></dd><dt>Personal email</dt><dd><a href="mailto:${esc(yuan.contact.personalEmail)}">${esc(yuan.contact.personalEmail)} ${arrow}</a></dd></dl></section>
    <section class="profile-section prose" id="links" aria-labelledby="profile-links-title"><span class="eyebrow">07 / ACADEMIC LINKS</span><h2 id="profile-links-title">Academic links</h2><div class="profile-academic-links">${yuan.academicProfiles.map(p=>academicLink(p.label,p.title,p.url,p.description)).join('')}</div></section>
    <div class="profile-credit"><span>© ${year} ${esc(yuan.name)}</span><a href="/people/">Back to People <span aria-hidden="true">←</span></a></div>
  </div><aside class="profile-facts" aria-labelledby="profile-facts-title"><h2 id="profile-facts-title">Academic details</h2><dl><dt>Position</dt><dd>Graduate student</dd><dt>Degree programme</dt><dd>${esc(yuan.degreeProgramme)}</dd><dt>Current status</dt><dd>${esc(yuan.academicStatus)}</dd><dt>Department</dt><dd>${esc(yuan.department)}</dd><dt>Institution</dt><dd>${esc(yuan.institution)}</dd><dt>College</dt><dd>${esc(yuan.additionalAffiliation)}</dd></dl></aside></div>`;
}
