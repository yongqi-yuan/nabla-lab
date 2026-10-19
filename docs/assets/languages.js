// Keep the reader's section when switching between corresponding language pages.
document.querySelectorAll('.language-switch a').forEach(link => {
  link.addEventListener('click', () => {
    const destination = new URL(link.href);
    destination.hash = window.location.hash;
    link.href = destination.href;
  });
});
