// Shared interior-page art. All scientific drawings are conceptual illustrations.
const contours=`<svg class="masthead-contours" viewBox="0 0 700 440" fill="none" aria-hidden="true"><path d="M-40 290C180 120 310 450 740 190M-40 320C180 150 310 480 740 220M-40 350C180 180 310 510 740 250M-40 380C180 210 310 540 740 280"/></svg>`;
export function publicationFigure() {
  return `<figure class="publication-study-figure"><img src="/assets/gap-resonance-sketch.svg" width="640" height="400" alt="A schematic of two adjacent boxes and the water in their narrow gap" loading="lazy"><figcaption>Gap resonance · schematic</figcaption></figure>`;
}
export function nablaNameFigure() {
  return `<div class="name-origin-art" aria-hidden="true"><span>∇</span><svg viewBox="0 0 420 220" fill="none"><ellipse cx="210" cy="110" rx="175" ry="72"/><ellipse cx="210" cy="110" rx="140" ry="52"/><path d="M20 110h380M210 20v180"/></svg></div>`;
}
function peopleArt(members) {
  return `<div class="masthead-community" aria-hidden="true"><div class="masthead-community-ring"></div><span class="masthead-community-symbol">∇</span>${members.map((m,i)=>`<span class="masthead-community-node" style="--x:${50+Math.cos((i*72-90)*Math.PI/180)*34}%;--y:${50+Math.sin((i*72-90)*Math.PI/180)*34}%">${m.initials}</span>`).join('')}</div>`;
}
export function visualMasthead({title,intro,eyebrow,trail,kind,diagram,members}) {
  let art='';
  if(kind==='diagram')art=`<div class="masthead-diagram">${diagram}</div>`;
  else if(kind==='paper')art='<img class="masthead-paper" src="/assets/gap-resonance-sketch.svg" width="640" height="400" alt="" aria-hidden="true">';
  else if(kind==='people')art=peopleArt(members);
  else if(kind==='history')art=`<div class="masthead-years" aria-hidden="true"><span>2025</span><span>2026</span><svg viewBox="0 0 440 100" fill="none"><path d="M20 50h400"/><circle cx="20" cy="50" r="6"/><circle cx="150" cy="50" r="6"/><circle cx="280" cy="50" r="6"/><circle cx="420" cy="50" r="6"/></svg></div>`;
  else if(kind==='news')art=`<div class="masthead-news" aria-hidden="true"><span>∇</span><i></i><i></i><i></i></div>`;
  else art='<img class="masthead-identity" src="/assets/nabla-lab-wordmark.svg" width="380" height="168" alt="" aria-hidden="true">';
  return `<section class="page-masthead visual-masthead masthead-kind-${kind}"><div class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${trail||`<span aria-current="page">${title}</span>`}</nav><div class="visual-masthead-grid"><div class="visual-masthead-copy"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${intro}</p></div><div class="visual-masthead-art">${contours}${art}</div></div></div></section>`;
}
export function editorialArt() {
  return `<div class="editorial-cover-art" aria-hidden="true"><span>∇</span><svg viewBox="0 0 560 340" fill="none"><path d="M-20 235C150 80 340 340 580 120M-20 265C150 110 340 370 580 150M-20 295C150 140 340 400 580 180"/><path class="editorial-art-rule" d="M60 58h180M60 78h125"/></svg></div>`;
}
