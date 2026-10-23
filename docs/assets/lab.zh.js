(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const compactNavigation = window.matchMedia('(max-width: 1020px)');
  function setMenuOpen(open) {
    const expanded = compactNavigation.matches && open;
    nav.classList.toggle('is-open', expanded);
    menu.setAttribute('aria-expanded', String(expanded));
    nav.inert = compactNavigation.matches && !expanded;
  }
  function closeMenu() { setMenuOpen(false); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    setMenuOpen(open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  nav.addEventListener('click', event => {
    if (compactNavigation.matches && event.target.closest('a')) closeMenu();
  });
  compactNavigation.addEventListener('change', event => {
    const navHadFocus = nav.contains(document.activeElement);
    const menuHadFocus = document.activeElement === menu;
    closeMenu();
    if (event.matches && navHadFocus) menu.focus();
    else if (!event.matches && menuHadFocus) nav.querySelector('a')?.focus();
  });
  closeMenu();

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
    status.textContent = query ? `“${input.value.trim()}” 的搜索结果：${matches.length} 条` : '浏览本站，或输入关键词搜索。';
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
      empty.textContent = '未找到匹配页面，请尝试研究主题或成员姓名。';
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
  toggle?.addEventListener('click', () => {
    const paused = community.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '继续运动' : '暂停运动';
  });
}
