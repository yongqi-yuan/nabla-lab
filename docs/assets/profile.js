(() => {
  const links = [...document.querySelectorAll('.profile-section-nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  if (!links.length || sections.some(section => !section)) return;
  function updateActive() {
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) active = section;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      active = sections[sections.length - 1];
    }
    for (const link of links) {
      const selected = link.getAttribute('href') === '#' + active.id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => { updateActive(); scheduled = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
})();
