(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  function closeMenu() { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });

  const dialog = document.querySelector('.search-dialog');
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const pages = window.NABLA_SEARCH_INDEX || [];
  function renderSearch() {
    const query = input.value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const matches = pages.filter(page => tokens.every(token => (page.title+' '+page.description+' '+(page.searchText||'')).toLocaleLowerCase().includes(token)));
    results.replaceChildren();
    status.textContent = query ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${input.value.trim()}”` : 'Browse the site, or type to search.';
    for (const page of matches) {
      const link = document.createElement('a');
      link.href = page.url;
      link.append(document.createTextNode(page.title));
      const description = document.createElement('span');
      description.textContent = page.description;
      link.append(description);
      results.append(link);
    }
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No matching pages. Try a research topic or a member’s name.';
      results.append(empty);
    }
  }
  document.querySelector('.search-open').addEventListener('click', () => {
    closeMenu();
    input.value = '';
    renderSearch();
    dialog.showModal();
    input.focus();
  });
  document.querySelector('.search-close').addEventListener('click', () => dialog.close());
  input.addEventListener('input', renderSearch);
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
})();

const community = document.querySelector('.community');
if (community) {
  const toggle = community.querySelector('.community-toggle');
  toggle.addEventListener('click', () => {
    const paused = community.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
  });
}
