// Canvas module - Canvas initialization and management
// Export functions for use in main.js

function createLayerEl(className = '') {
    const canvas = document.createElement('canvas');
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    canvas.className = `canvas-layer ${className}`;
    canvas.style.display = 'none';

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);

    canvasContainer.appendChild(canvas);
    return { canvas, ctx };
}

function getFromPool(w, h) {
    for (let i = 0; i < canvasPool.length; i++) {
        const c = canvasPool[i];
        if (c.width === w && c.height === h && !c._inUse) {
            c._inUse = true;
            return c;
        }
    }
    if (canvasPool.length >= CANVAS_POOL_LIMIT) {
        for (let i = 0; i < canvasPool.length; i++) {
            if (!canvasPool[i]._inUse) { canvasPool.splice(i, 1); break; }
        }
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c._inUse = true;
    canvasPool.push(c);
    return c;
}

function releaseToPool(c) { c._inUse = false; }