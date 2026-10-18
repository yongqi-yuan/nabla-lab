(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const label = document.querySelector('.theme-label');
  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    label.textContent = dark ? 'Light theme' : 'Dark theme';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#17232b' : '#f8f7f3';
  }
  try { setTheme(localStorage.getItem('yongqi-yuan-theme') === 'dark' ? 'dark' : 'light'); }
  catch { setTheme('light'); }
  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try { localStorage.setItem('yongqi-yuan-theme', theme); } catch {}
  });
  document.getElementById('year').textContent = String(new Date().getFullYear());
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
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
    if (!scheduled) { scheduled = true; requestAnimationFrame(() => { updateActive(); scheduled = false; }); }
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
})();
