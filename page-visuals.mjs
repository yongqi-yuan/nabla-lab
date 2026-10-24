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
// Page-specific vector studies share a precise blue/red line vocabulary.
function pageStudy(kind,members=[]) {
 const paper=`<rect x="105" y="24" width="205" height="174" fill="white" stroke="var(--blue-30)"/><path d="M129 51h113M129 61h76" stroke="var(--blue)" stroke-width="3"/><path d="M129 82h154M129 94h154M129 106h139M129 129h154M129 141h154M129 153h119M129 176h66" stroke="var(--blue-40)"/>`;
 let drawing='';
 if(kind==='research-map')drawing=`<defs><pattern id="study-mesh" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" stroke="var(--blue-30)" stroke-width=".65"/></pattern></defs><rect x="200" y="26" width="162" height="168" fill="url(#study-mesh)"/><path d="M30 88c28-38 55-38 83 0s55 38 83 0 55-38 83 0 55 38 83 0M30 106c28-38 55-38 83 0s55 38 83 0 55-38 83 0 55 38 83 0M30 124c28-38 55-38 83 0s55 38 83 0 55-38 83 0 55 38 83 0" stroke="var(--blue)"/><rect x="243" y="53" width="32" height="133" fill="var(--blue-10)" stroke="var(--blue)"/><path d="M283 77h37m-8-6 8 6-8 6M283 112h37m-8-6 8 6-8 6" stroke="var(--red)"/><path d="M30 179h332" stroke="var(--blue-40)"/>`;
 else if(kind==='people')drawing=`<path d="M50 161H370" stroke="var(--blue-30)"/>${[0,1,2,3,4].map(i=>`<g transform="translate(${35+i*69} 45)"><rect width="54" height="118" fill="white" stroke="var(--blue-30)"/><circle cx="27" cy="32" r="13" fill="var(--blue-10)" stroke="var(--blue)"/><path d="M10 78V66a17 17 0 0 1 34 0v12M12 94h30M18 103h18" stroke="var(--blue)"/><circle cx="27" cy="134" r="3" fill="var(--red)" stroke="none"/></g>`).join('')}`;
 else if(kind==='editorial')drawing=`<g transform="rotate(-7 210 110)"><rect x="94" y="22" width="205" height="174" fill="var(--blue-20)" stroke="none"/></g><g transform="rotate(4 210 110)">${paper}<path d="M125 110q28-10 58 0M240 143l18-6 12 6M273 79q29-15 37 2M281 104l24-8M200 173q32 9 65-4" stroke="var(--red)" stroke-width="1.5"/><path d="m321 64-8 108 5 13 6-12 8-108Z" fill="var(--blue-10)" stroke="var(--blue)"/></g>`;
 else if(kind==='news')drawing=`<path d="M62 38v146" stroke="var(--blue-30)"/>${[50,105,160].map((y,i)=>`<circle cx="62" cy="${y}" r="4" fill="${i===0?'var(--red)':'var(--blue)'}" stroke="none"/><path d="M77 ${y}h29" stroke="var(--blue-40)"/>`).join('')}<g transform="translate(4 0)">${paper}<rect x="130" y="80" width="51" height="37" fill="var(--blue-20)" stroke="none"/><path d="M192 83h91M192 95h91M192 107h65" stroke="var(--blue)"/></g>`;
 else if(kind==='contact')drawing=`<rect x="85" y="60" width="236" height="126" rx="2" fill="white" stroke="var(--blue-30)"/><path d="m86 62 117 78L320 62M86 184l80-69m154 69-80-69" stroke="var(--blue)"/><circle cx="310" cy="58" r="30" fill="var(--blue-10)" stroke="var(--blue-30)"/><path d="M296 58h28m-9-9 9 9-9 9" stroke="var(--red)"/><path d="M114 40h120M114 29h76" stroke="var(--blue-40)"/>`;
 else drawing=`<circle cx="210" cy="110" r="70" stroke="var(--blue-30)"/><path d="m80 65 130 45 125-66M95 173l115-63 123 59M80 65l15 108m240-129-2 125" stroke="var(--blue-40)"/><circle cx="80" cy="65" r="7" fill="white"/><circle cx="95" cy="173" r="7" fill="white"/><circle cx="335" cy="44" r="7" fill="var(--red)" stroke="none"/><circle cx="333" cy="169" r="7" fill="white"/><image href="/assets/nabla-mark-blue.svg" x="172" y="81" width="76" height="58"/>`;
 return `<svg class="page-study" viewBox="0 0 420 220" fill="none" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
}
export function visualMasthead({title,intro,eyebrow,trail,kind,members,diagram}) {
 let art='';
 if(['identity','research-map','people','news','editorial','contact'].includes(kind))art=pageStudy(kind,members);
 else if(kind==='diagram'&&diagram)art=`<div class="compact-science-art" aria-hidden="true">${diagram}</div>`;
 else if(kind==='history')art=`<div class="masthead-years" aria-hidden="true"><span>2025</span><span>2026</span><svg viewBox="0 0 440 100" fill="none"><path d="M20 50h400"/><circle cx="20" cy="50" r="6"/><circle cx="150" cy="50" r="6"/><circle cx="280" cy="50" r="6"/><circle cx="420" cy="50" r="6"/></svg></div>`;
 else art=pageStudy('editorial');
 return `<section class="page-masthead visual-masthead masthead-kind-${kind}"><div class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${trail||`<span aria-current="page">${title}</span>`}</nav><div class="visual-masthead-grid"><div class="visual-masthead-copy"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${intro}</p></div><div class="visual-masthead-art">${art}</div></div></div></section>`;
}
export function editorialArt() {
  return `<div class="editorial-cover-art" aria-hidden="true"><img class="nabla-mark editorial-cover-mark" src="/assets/nabla-mark-pale.svg" width="184" height="141" alt=""><svg viewBox="0 0 560 340" fill="none"><path d="M-20 235C150 80 340 340 580 120M-20 265C150 110 340 370 580 150M-20 295C150 140 340 400 580 180"/><path class="editorial-art-rule" d="M60 58h180M60 78h125"/></svg></div>`;
}
