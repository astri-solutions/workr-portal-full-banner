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

  // Small grace period before closing on mouseleave — there's a visual gap
  // (margin-top) between the trigger and its dropdown, so moving the mouse
  // diagonally from one to the other briefly crosses a dead zone neither
  // element covers. Without a delay that dead zone closes the dropdown
  // before the pointer ever reaches it.
  let closeTimer = null;

  triggers.forEach(trigger => {
    const item = trigger.closest('.nav-list__item');

    // Hover (desktop)
    item.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      clearTimeout(closeTimer);
      closeAll();
      item.classList.add('nav-list__item--open');
      trigger.setAttribute('aria-expanded', 'true');
    });

    item.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        item.classList.remove('nav-list__item--open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 250);
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
    // navbar-blur (banner layout) reserves a 40px gap above the header for
    // the topbar showing through the hero — is-scrolled is what collapses
    // that gap to 0 (see .site-header--navbar-blur in _header.scss), so it
    // has to flip the instant scrolling starts, not only past the same
    // y > 80 threshold used below for the hide-on-scroll-down behavior —
    // otherwise the gap stayed visible for the first 80px of scroll.
    if (y > 0) {
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled');
    }
    if (y > 80) {
      header?.classList.toggle('is-hidden', y > lastY && y > 200);
    } else {
      header?.classList.remove('is-hidden');
    }
    lastY = y;
  }, { passive: true });
}
