// scripts/theme-critical.js
// Classic (non-module) script, loaded synchronously right after the compiled
// stylesheet in every page's <head> — browsers block script execution until
// a preceding <link rel="stylesheet"> finishes loading, so this always runs
// before first paint. It reads window.__WL_THEME__ (scripts/theme-data.js,
// written per-portal by publish-config/provision-portal, excluded from the
// scripts/ self-heal sync so it never gets reset to the template's empty
// default) and injects the exact same CSS custom properties that
// components/theme.js's initTheme() computes at module-load time.
//
// Without this, the branded colors/fonts only appeared once the deferred
// `type="module"` bundle at the end of <body> finished running — well after
// first paint — so every page load flashed the compiled stylesheet's default
// values first. This duplicates theme.js's color-math on purpose: it must
// run as a plain blocking script, before the module graph even starts
// loading, so it can't import from it.
(function () {
  var theme = window.__WL_THEME__;
  if (!theme) return;
  var colors = theme.colors || {};
  var fonts = theme.fonts || {};

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHsl(rgb) {
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    var toHex = function (x) { return Math.round(x * 255).toString(16).padStart(2, '0'); };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  function luminance(rgb) {
    var c = [rgb.r, rgb.g, rgb.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrastRatio(hexA, hexB) {
    var lA = luminance(hexToRgb(hexA)), lB = luminance(hexToRgb(hexB));
    var lighter = Math.max(lA, lB), darker = Math.min(lA, lB);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function onColor(hex) {
    return contrastRatio(hex, '#000000') > contrastRatio(hex, '#ffffff') ? '#000000' : '#ffffff';
  }
  function buildScale(hex) {
    var rgb = hexToRgb(hex);
    var hsl = rgbToHsl(rgb);
    var h = hsl.h, s = hsl.s, l = hsl.l;
    var targets = {
      100: Math.min(97, l + (97 - l) * 0.90),
      200: Math.min(97, l + (97 - l) * 0.75),
      300: Math.min(97, l + (97 - l) * 0.55),
      400: Math.min(97, l + (97 - l) * 0.30),
      500: l,
      600: Math.max(0, l - l * 0.15),
      700: Math.max(0, l - l * 0.30),
      800: Math.max(0, l - l * 0.50),
      900: Math.max(0, l - l * 0.70),
    };
    var satScale = {
      100: s * 0.15, 200: s * 0.25, 300: s * 0.40, 400: s * 0.65,
      500: s, 600: s * 0.90, 700: s * 0.80, 800: s * 0.70, 900: s * 0.60,
    };
    var scale = {};
    [100, 200, 300, 400, 500, 600, 700, 800, 900].forEach(function (shade) {
      scale[shade] = hslToHex(h, satScale[shade], targets[shade]);
    });
    return scale;
  }

  var rules = [];
  function pushScaleRules(prefix, hex, withRgb) {
    var scale = buildScale(hex);
    var on = onColor(hex);
    rules.push('  --color-' + prefix + ': ' + scale[500] + ';');
    if (withRgb) {
      var rgb = hexToRgb(hex);
      rules.push('  --color-' + prefix + '-rgb: ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ';');
    }
    rules.push('  --color-' + prefix + '-light: ' + scale[100] + ';');
    rules.push('  --color-' + prefix + '-hover: ' + scale[700] + ';');
    if (!withRgb) rules.push('  --color-' + prefix + '-active: ' + scale[900] + ';');
    rules.push('  --color-on-' + prefix + ': ' + on + ';');
    [100, 200, 300, 400, 500, 600, 700, 800, 900].forEach(function (n) {
      rules.push('  --color-' + prefix + '-' + n + ': ' + scale[n] + ';');
    });
  }
  if (colors.primary) pushScaleRules('primary', colors.primary, false);
  if (colors.secondary) pushScaleRules('secondary', colors.secondary, true);
  if (colors.tertiary) pushScaleRules('tertiary', colors.tertiary, false);

  if (rules.length > 0) {
    var style = document.createElement('style');
    style.id = 'wl-theme-colors';
    style.textContent = ':root:not([data-contrast="on"]) {\n' + rules.join('\n') + '\n}';
    document.head.appendChild(style);
  }

  var FONT_ID_MAP = {
    'inter': 'Inter', 'plus-jakarta': 'Plus Jakarta Sans', 'montserrat': 'Montserrat',
    'poppins': 'Poppins', 'raleway': 'Raleway', 'lato': 'Lato', 'source-sans': 'Source Sans 3',
    'nunito': 'Nunito', 'playfair': 'Playfair Display', 'merriweather': 'Merriweather',
    'lora': 'Lora', 'eb-garamond': 'EB Garamond', 'libre-baskerville': 'Libre Baskerville',
    'cormorant': 'Cormorant Garamond',
  };
  function resolveFont(id) { return FONT_ID_MAP[id] || id; }

  var displayName = fonts.display ? resolveFont(fonts.display) : null;
  var bodyName = fonts.body ? resolveFont(fonts.body) : null;
  if (displayName || bodyName) {
    var fontRules = [];
    if (displayName) {
      fontRules.push('  --font-family-display: \'' + displayName + '\', sans-serif;');
      fontRules.push('  --font-display: \'' + displayName + '\', sans-serif;');
    }
    if (bodyName) {
      fontRules.push('  --font-family-base: \'' + bodyName + '\', sans-serif;');
      fontRules.push('  --font-body: \'' + bodyName + '\', sans-serif;');
    }
    var fontStyle = document.createElement('style');
    fontStyle.id = 'wl-theme-fonts';
    fontStyle.textContent = ':root {\n' + fontRules.join('\n') + '\n}';
    document.head.appendChild(fontStyle);
  }

  var families = [];
  if (displayName) families.push('family=' + encodeURIComponent(displayName) + ':wght@400;500;600;700');
  if (bodyName && bodyName !== displayName) families.push('family=' + encodeURIComponent(bodyName) + ':wght@400;500;600;700');
  if (families.length > 0) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + families.join('&') + '&display=swap';
    document.head.appendChild(link);
  }
})();
