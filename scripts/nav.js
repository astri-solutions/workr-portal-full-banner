// scripts/nav.js
export function initNav() {
  const nav       = document.querySelector('[data-nav]');
  const hamburger = document.querySelector('[data-nav-hamburger]');
  const closeBtn  = document.querySelector('[data-nav-close]');
  const overlay   = document.querySelector('[data-nav-overlay]');
  const triggers  = document.querySelectorAll('[data-nav-trigger]');

  // Drawer mobile
  function openDrawer() {
    nav?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    nav?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  // Leaf links (no submenu) close the drawer on click. On banner layout
  // this is moot (the page navigates away anyway); on sidebar/tabmenu the
  // link only changes the URL hash and swaps the in-page panel — without
  // this the drawer would stay open over the newly-activated content.
  document.querySelectorAll('.nav-list__trigger--link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Dropdowns — hover no desktop, click no mobile
  const isMobile = () => window.innerWidth < 1024;

  function closeAll() {
    document.querySelectorAll('.nav-list__item--open').forEach(el => {
      el.classList.remove('nav-list__item--open');
      el.querySelector('[data-nav-trigger]')?.setAttribute('aria-expanded', 'false');
    });
  }

  triggers.forEach(trigger => {
    const item = trigger.closest('.nav-list__item');

    // Hover (desktop)
    item.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      closeAll();
      item.classList.add('nav-list__item--open');
      trigger.setAttribute('aria-expanded', 'true');
    });

    item.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      item.classList.remove('nav-list__item--open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    // Click (mobile drawer)
    trigger.addEventListener('click', () => {
      if (!isMobile()) return;
      const isOpen = item.classList.contains('nav-list__item--open');
      closeAll();
      if (!isOpen) {
        item.classList.add('nav-list__item--open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Fechar ao clicar fora (mobile)
  document.addEventListener('click', e => {
    if (isMobile() && !e.target.closest('.nav-list__item')) closeAll();
  });

  // Scroll hide/show
  let lastY = 0;
  const header = document.querySelector('.site-header');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      header?.classList.toggle('is-hidden', y > lastY && y > 200);
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled', 'is-hidden');
    }
    lastY = y;
  }, { passive: true });
}
