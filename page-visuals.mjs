// Shared interior-page decoration uses the lab's own visual identity.
const contours=`<svg class="masthead-contours" viewBox="0 0 700 440" fill="none" aria-hidden="true"><path d="M-40 290C180 120 310 450 740 190M-40 320C180 150 310 480 740 220M-40 350C180 180 310 510 740 250M-40 380C180 210 310 540 740 280"/></svg>`;
export function publicationFigure() {
  // Keep the existing API until the lab supplies an approved publication image.
  return '';
}
export function nablaNameFigure() {
  return `<div class="name-origin-art" aria-hidden="true"><img class="nabla-mark name-origin-mark" src="/assets/nabla-mark-blue.svg" width="148" height="113" alt=""><svg viewBox="0 0 420 220" fill="none"><ellipse cx="210" cy="110" rx="175" ry="72"/><ellipse cx="210" cy="110" rx="140" ry="52"/><path d="M20 110h380M210 20v180"/></svg></div>`;
}
function peopleArt(members) {
  return `<div class="masthead-community" aria-hidden="true"><div class="masthead-community-ring"></div><img class="nabla-mark masthead-community-symbol" src="/assets/nabla-mark-blue.svg" width="86" height="66" alt="">${members.map((m,i)=>`<span class="masthead-community-node" style="--x:${50+Math.cos((i*72-90)*Math.PI/180)*34}%;--y:${50+Math.sin((i*72-90)*Math.PI/180)*34}%">${m.initials}</span>`).join('')}</div>`;
}
export function visualMasthead({title,intro,eyebrow,trail,kind,members}) {
  let art='';
  if(['diagram','research-map','paper'].includes(kind))art='<img class="nabla-mark masthead-identity masthead-brand-mark" src="/assets/nabla-mark-blue.svg" width="226" height="173" alt="" aria-hidden="true">';
  else if(kind==='people')art=peopleArt(members);
  else if(kind==='history')art=`<div class="masthead-years" aria-hidden="true"><span>2025</span><span>2026</span><svg viewBox="0 0 440 100" fill="none"><path d="M20 50h400"/><circle cx="20" cy="50" r="6"/><circle cx="150" cy="50" r="6"/><circle cx="280" cy="50" r="6"/><circle cx="420" cy="50" r="6"/></svg></div>`;
  else if(kind==='news')art=`<div class="masthead-news" aria-hidden="true"><img class="nabla-mark masthead-news-mark" src="/assets/nabla-lab-symbol.svg" width="118" height="90" alt=""><i></i><i></i><i></i></div>`;
  else art='<img class="masthead-identity" src="/assets/nabla-lab-wordmark.svg" width="380" height="168" alt="" aria-hidden="true">';
  return `<section class="page-masthead visual-masthead masthead-kind-${kind}"><div class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${trail||`<span aria-current="page">${title}</span>`}</nav><div class="visual-masthead-grid"><div class="visual-masthead-copy"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${intro}</p></div><div class="visual-masthead-art">${contours}${art}</div></div></div></section>`;
}
export function editorialArt() {
  return `<div class="editorial-cover-art" aria-hidden="true"><img class="nabla-mark editorial-cover-mark" src="/assets/nabla-mark-pale.svg" width="184" height="141" alt=""><svg viewBox="0 0 560 340" fill="none"><path d="M-20 235C150 80 340 340 580 120M-20 265C150 110 340 370 580 150M-20 295C150 140 340 400 580 180"/><path class="editorial-art-rule" d="M60 58h180M60 78h125"/></svg></div>`;
}
