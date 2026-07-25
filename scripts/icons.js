// scripts/icons.js
// Helper to render icons from /assets/icons/*.svg

/**
 * Render an icon from the assets/icons pack.
 *   icon('chevron-down')           → <img src="/assets/icons/chevron-down.svg" …>
 *   icon('pdf', 24)                → size 24
 *   icon('gmail', 20, 'my-class')  → adds class
 */
export function icon(name, size = 20, className = '') {
  return `<img src="/assets/icons/${name}.svg" width="${size}" height="${size}" aria-hidden="true"${className ? ` class="${className}"` : ''} alt="">`;
}
