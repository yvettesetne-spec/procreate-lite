// Brush Smoothing module - Spring, Catmull-Rom, Gaussian smoothing algorithms

function applySpringSmoothing(points) {
    const result = [];
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const prev = result[result.length - 1];
        if (!prev) { result.push({ ...p }); continue; }
        const dx = p.x - prev.x, dy = p.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 10;
        if (dist > maxDist) {
            result.push({ x: prev.x + dx * maxDist / dist, y: prev.y + dy * maxDist / dist });
        } else {
            result.push({ ...p });
        }
    }
    return result;
}

function applyCatmullRomSmoothing(points, tension = 0.5) {
    const result = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        for (let t = 0; t <= 1; t += 0.2) {
            const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
            const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
            result.push({ x, y });
        }
    }
    return result;
}

function applyGaussianSmoothing(points, sigma = 1.5) {
    const kernel = [0.05, 0.25, 0.4, 0.25, 0.05];
    return points.map((p, i) => {
        let sumX = 0, sumY = 0, total = 0;
        for (let j = -2; j <= 2; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < points.length) {
                sumX += points[idx].x * kernel[j + 2];
                sumY += points[idx].y * kernel[j + 2];
                total += kernel[j + 2];
            }
        }
        return { x: sumX / total, y: sumY / total };
    });
}