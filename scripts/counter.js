// scripts/counter.js
// Animated count-up for [data-counter] elements triggered by IntersectionObserver

function parseValue(raw) {
  // Extract prefix (e.g. "+", "R$ "), numeric part, and suffix (e.g. "B", "%", "+")
  const match = raw.match(/^([^0-9]*)([0-9]+(?:[.,][0-9]+)?)([^0-9]*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const num = parseFloat(numStr.replace(',', '.'));
  const decimals = numStr.includes(',') ? numStr.split(',')[1].length
                 : numStr.includes('.') ? numStr.split('.')[1].length
                 : 0;
  return { prefix, num, suffix, decimals, raw: numStr };
}

function formatNum(n, decimals, originalRaw) {
  // Preserve original formatting style (comma vs dot decimal)
  const usesComma = originalRaw.includes(',');
  if (decimals === 0) return String(Math.round(n));
  const fixed = n.toFixed(decimals);
  return usesComma ? fixed.replace('.', ',') : fixed;
}

function animateCounter(el) {
  const raw = el.textContent.trim();
  const parsed = parseValue(raw);
  if (!parsed) return;

  const duration = 1800;
  const start = performance.now();
  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = parsed.num * ease(progress);
    el.textContent = parsed.prefix + formatNum(current, parsed.decimals, parsed.raw) + parsed.suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    animateCounter(entry.target);
  });
}, { threshold: 0.4 });

document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
