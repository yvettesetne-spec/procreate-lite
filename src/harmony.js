// Color Harmony module - Generate color palettes

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = {
            [r]: ((g - b) / d + (g < b ? 6 : 0)) / 6,
            [g]: ((b - r) / d + 2) / 6,
            [b]: ((r - g) / d + 4) / 6
        }[max];
        h = Math.round(h * 360);
    } else {
        h = s = 0;
    }
    return { h: h || 0, s: s || 0, l: l || 0 };
}

function hslToRgb(h, s, l) {
    h /= 360;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
}

function generateColorHarmony(baseColor, mode) {
    const hsl = rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
    const hues = [];
    const offsets = {
        complementary: [180],
        analogous: [-30, 30],
        triadic: [120, 240],
        'split-complementary': [150, 210],
        square: [90, 180, 270]
    };
    const offset = offsets[mode] || [];
    offset.forEach(o => hues.push((hsl.h + o + 360) % 360));
    return hues.map(h => {
        const rgb = hslToRgb(h, hsl.s, hsl.l);
        return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    });
}