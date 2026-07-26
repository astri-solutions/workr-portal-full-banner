// scripts/components/timeline.js
// Drives the "Linha do tempo" matéria block: fills the line as the user
// scrolls through it, fades each item in, and enlarges the year label of
// whichever item is currently centered in the viewport (or in the
// horizontal scroller, for the horizontal variant).
export function initTimelines(root = document) {
  root.querySelectorAll('.timeline--vertical[data-timeline]').forEach(initVerticalTimeline);
  root.querySelectorAll('.timeline--horizontal[data-timeline]').forEach(initHorizontalTimeline);
}

function initVerticalTimeline(el) {
  if (el.dataset.timelineInit) return;
  el.dataset.timelineInit = '1';

  const itemsEl = el.querySelector('.timeline__items');
  const fillEl = el.querySelector('[data-timeline-fill]');
  const items = [...el.querySelectorAll('.timeline__item')];
  if (!itemsEl || items.length === 0) return;

  // Fade each item in once it enters the viewport, and mark whichever item
  // is closest to vertical center as "active" (enlarges its year).
  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15 });

  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  items.forEach(item => {
    visibilityObserver.observe(item);
    activeObserver.observe(item);
  });

  // Line fill — how far the viewport's vertical center has progressed from
  // the top of the first item to the center of the last one (not the very
  // bottom of the container) — that's where "active" kicks in for the last
  // item too, so the fill actually reaches 100% right as it lights up,
  // instead of stalling short because the container extends past its center.
  if (fillEl) {
    const lastItem = items[items.length - 1];
    let ticking = false;
    function updateFill() {
      ticking = false;
      const rect = itemsEl.getBoundingClientRect();
      const lastRect = lastItem.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const total = (lastRect.top + lastRect.height / 2) - rect.top;
      if (total <= 0) return;
      const progressed = viewportCenter - rect.top;
      let pct = Math.max(0, Math.min(100, (progressed / total) * 100));
      // A timeline that ends near the bottom of the document runs out of
      // page before the viewport's center can ever reach the last item's
      // center, so the line would freeze a few percent short no matter how
      // far the visitor scrolls. Once there's no scroll left and that last
      // item is on screen, the line has to read as complete.
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const atPageEnd = maxScroll <= 0 || window.scrollY >= maxScroll - 2;
      if (atPageEnd && lastRect.top < window.innerHeight) pct = 100;
      fillEl.style.height = `${pct}%`;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateFill);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateFill();
  }
}

// Horizontal — same idea, rotated 90°: the scroller itself (.timeline__items,
// overflow-x: auto) is the "viewport" all measurements are relative to,
// instead of the window. The track/fill live inside that scroller so they
// travel with the content; the track's width is pinned to scrollWidth so
// it always spans the full row, and the fill's width in px tracks how far
// the row has been scrolled (up to its horizontal center).
function initHorizontalTimeline(el) {
  if (el.dataset.timelineInit) return;
  el.dataset.timelineInit = '1';

  const itemsEl = el.querySelector('.timeline__items');
  const trackEl = el.querySelector('.timeline__track');
  const fillEl = el.querySelector('[data-timeline-fill]');
  const items = [...el.querySelectorAll('.timeline__item')];
  if (!itemsEl || items.length === 0) return;

  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { root: itemsEl, threshold: 0.15 });

  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { root: itemsEl, rootMargin: '0px -45% 0px -45%', threshold: 0 });

  items.forEach(item => {
    visibilityObserver.observe(item);
    activeObserver.observe(item);
  });

  if (!trackEl && !fillEl) return;

  const lastItem = items[items.length - 1];
  let ticking = false;
  function updateTrack() {
    ticking = false;
    if (trackEl) trackEl.style.width = `${itemsEl.scrollWidth}px`;
    if (fillEl) {
      // Same reasoning as the vertical variant — fill up to the last
      // item's own center, not the full scrollable width, so it reaches
      // 100% exactly as the last item becomes active instead of stalling
      // short. And, likewise, the row can run out of scroll before its
      // center reaches that point, so snap once there's nothing left to
      // scroll.
      const total = lastItem.offsetLeft + lastItem.offsetWidth / 2;
      const maxScrollLeft = itemsEl.scrollWidth - itemsEl.clientWidth;
      const atEnd = maxScrollLeft <= 0 || itemsEl.scrollLeft >= maxScrollLeft - 2;
      const center = itemsEl.scrollLeft + itemsEl.clientWidth / 2;
      fillEl.style.width = `${atEnd ? total : Math.max(0, Math.min(total, center))}px`;
    }
  }
  function onChange() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateTrack);
  }
  itemsEl.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  // Images loading in changes scrollWidth after the initial layout pass.
  itemsEl.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', onChange, { once: true });
  });
  updateTrack();
}
