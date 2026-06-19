self.addEventListener('message', (e) => {
    const { type, imageData, params } = e.data;
    const data = imageData.data;

    if (type === 'hsb') {
        const { hueShift, satMult, briMult } = params;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                else if (max === g) h = ((b - r) / d + 2) / 6;
                else h = ((r - g) / d + 4) / 6;
            }
            h = (h + hueShift / 360 + 1) % 1;
            s = Math.max(0, Math.min(1, s * satMult));
            l = Math.max(0, Math.min(1, l * briMult));
            if (s === 0) { r = g = b = l; }
            else {
                const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
                const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p2 = 2 * l - q2;
                r = hue2rgb(p2, q2, h + 1/3);
                g = hue2rgb(p2, q2, h);
                b = hue2rgb(p2, q2, h - 1/3);
            }
            data[i] = Math.round(r * 255);
            data[i + 1] = Math.round(g * 255);
            data[i + 2] = Math.round(b * 255);
        }
    } else if (type === 'levels') {
        const { inMin, inMax, gamma } = params;
        const range = inMax - inMin || 1;
        const invGamma = 1 / gamma;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            for (let c = 0; c < 3; c++) {
                let v = (data[i + c] - inMin) / range;
                v = Math.max(0, Math.min(1, v));
                v = Math.pow(v, invGamma);
                data[i + c] = Math.round(v * 255);
            }
        }
    } else if (type === 'curves') {
        const { points } = params;
        const lut = new Uint8Array(256);
        for (let v = 0; v < 256; v++) {
            let result = 0;
            for (let k = 0; k < points.length - 1; k++) {
                if (v >= points[k][0] && v <= points[k + 1][0]) {
                    const t = points[k + 1][0] === points[k][0] ? 0 : (v - points[k][0]) / (points[k + 1][0] - points[k][0]);
                    result = points[k][1] + t * (points[k + 1][1] - points[k][1]);
                    break;
                }
            }
            lut[v] = Math.max(0, Math.min(255, Math.round(result)));
        }
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            data[i] = lut[data[i]];
            data[i + 1] = lut[data[i + 1]];
            data[i + 2] = lut[data[i + 2]];
        }
    } else if (type === 'blur') {
        // Separable Gaussian blur O(n*r)
        const { radius, width, height } = params;
        const r = Math.max(1, Math.round(radius));
        const sigma = r / 3;
        const kernel = new Float32Array(r + 1);
        let sum = 0;
        for (let i = 0; i <= r; i++) {
            kernel[i] = Math.exp(-(i * i) / (2 * sigma * sigma));
            sum += kernel[i] * (i === 0 ? 1 : 2);
        }
        for (let i = 0; i <= r; i++) kernel[i] /= sum;
        const temp = new Uint8ClampedArray(data);
        // Horizontal pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let rr = 0, gg = 0, bb = 0;
                for (let k = -r; k <= r; k++) {
                    const nx = Math.max(0, Math.min(width - 1, x + k));
                    const idx = (y * width + nx) * 4;
                    const w = kernel[Math.abs(k)];
                    rr += temp[idx] * w;
                    gg += temp[idx + 1] * w;
                    bb += temp[idx + 2] * w;
                }
                const idx = (y * width + x) * 4;
                data[idx] = Math.round(rr);
                data[idx + 1] = Math.round(gg);
                data[idx + 2] = Math.round(bb);
            }
        }
        // Vertical pass
        const temp2 = new Uint8ClampedArray(data);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let rr = 0, gg = 0, bb = 0;
                for (let k = -r; k <= r; k++) {
                    const ny = Math.max(0, Math.min(height - 1, y + k));
                    const idx = (ny * width + x) * 4;
                    const w = kernel[Math.abs(k)];
                    rr += temp2[idx] * w;
                    gg += temp2[idx + 1] * w;
                    bb += temp2[idx + 2] * w;
                }
                const idx = (y * width + x) * 4;
                data[idx] = Math.round(rr);
                data[idx + 1] = Math.round(gg);
                data[idx + 2] = Math.round(bb);
            }
        }
    } else if (type === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = Math.round(avg);
        }
    } else if (type === 'invert') {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    } else if (type === 'posterize') {
        const { levels } = params;
        const step = 255 / (levels - 1);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            data[i] = Math.round(Math.round(data[i] / step) * step);
            data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
            data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
        }
    } else if (type === 'brightness') {
        const { amount } = params;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + amount));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
        }
    } else if (type === 'contrast') {
        const { amount } = params;
        const factor = (259 * (amount + 255)) / (255 * (259 - amount));
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            data[i] = Math.max(0, Math.min(255, Math.round(factor * (data[i] - 128) + 128)));
            data[i + 1] = Math.max(0, Math.min(255, Math.round(factor * (data[i + 1] - 128) + 128)));
            data[i + 2] = Math.max(0, Math.min(255, Math.round(factor * (data[i + 2] - 128) + 128)));
        }
    } else if (type === 'threshold') {
        const { level } = params;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const v = avg >= level ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
        }
    } else if (type === 'edge') {
        const copy = new Uint8ClampedArray(data);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    const gx = -copy[((y-1)*width+(x-1))*4+c] + copy[((y-1)*width+(x+1))*4+c]
                              -2*copy[(y*width+(x-1))*4+c] + 2*copy[(y*width+(x+1))*4+c]
                              -copy[((y+1)*width+(x-1))*4+c] + copy[((y+1)*width+(x+1))*4+c];
                    const gy = -copy[((y-1)*width+(x-1))*4+c] - 2*copy[((y-1)*width+x)*4+c] - copy[((y-1)*width+(x+1))*4+c]
                              +copy[((y+1)*width+(x-1))*4+c] + 2*copy[((y+1)*width+x)*4+c] + copy[((y+1)*width+(x+1))*4+c];
                    data[idx + c] = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
                }
            }
        }
    } else if (type === 'emboss') {
        const copy = new Uint8ClampedArray(data);
        const kernel = [-2,-1,0,-1,1,1,0,1,2];
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let val = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            val += copy[((y+ky)*width+(x+kx))*4+c] * kernel[(ky+1)*3+(kx+1)];
                        }
                    }
                    data[idx + c] = Math.max(0, Math.min(255, val + 128));
                }
            }
        }
    } else if (type === 'pixelate') {
        const { size } = params;
        const ps = Math.max(1, size);
        for (let y = 0; y < height; y += ps) {
            for (let x = 0; x < width; x += ps) {
                let sr = 0, sg = 0, sb = 0, count = 0;
                for (let py = 0; py < ps && y + py < height; py++) {
                    for (let px = 0; px < ps && x + px < width; px++) {
                        const idx = ((y + py) * width + (x + px)) * 4;
                        sr += data[idx]; sg += data[idx + 1]; sb += data[idx + 2]; count++;
                    }
                }
                const r2 = Math.round(sr / count), g2 = Math.round(sg / count), b2 = Math.round(sb / count);
                for (let py = 0; py < ps && y + py < height; py++) {
                    for (let px = 0; px < ps && x + px < width; px++) {
                        const idx = ((y + py) * width + (x + px)) * 4;
                        data[idx] = r2; data[idx + 1] = g2; data[idx + 2] = b2;
                    }
                }
            }
        }
    }

    self.postMessage({ type, imageData }, [imageData.data.buffer]);
});
