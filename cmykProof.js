// CMYK soft‑proofing utility
// Converts an RGB color (0‑255) to CMYK percentages (0‑100)
// Used for UI preview; does NOT affect actual canvas rendering.

/**
 * Convert RGB to CMYK.
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {{c:number,m:number,y:number,k:number}} CMYK values as percentages
 */
function rgbToCmyk({r, g, b}) {
  // Normalize to 0‑1
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const k = 1 - Math.max(rn, gn, bn);
  const denom = 1 - k || 1; // avoid division by zero
  const c = (1 - rn - k) / denom;
  const m = (1 - gn - k) / denom;
  const y = (1 - bn - k) / denom;

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

// Export for use in main.js (browser environment uses global scope)
window.rgbToCmyk = rgbToCmyk;
