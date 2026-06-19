// Procreate Lite - Minimal Portable Version for iPad 5th Gen
// Optimized for 2GB RAM and generic stylus

let logicalWidth = 1024;
let logicalHeight = 768;
let dpr = window.devicePixelRatio || 1;
let layers = [];
let activeLayerIndex = 0;
let currentMode = 'brush';
let brushSize = 10;
let brushOpacity = 1;
let brushColor = '#ffffff';
let isDrawing = false;
let points = [];
let smoothBuffer = [];
let canvasContainer;

document.addEventListener('DOMContentLoaded', () => {
    canvasContainer = document.getElementById('canvas-container');
    init();
    boot();
    console.log('DOM loaded, buttons should work');
});

// Immediate test
console.log('Script loaded at', Date.now());

function init() {
    createLayerEl();
    setupEventListeners();
    setupUI();
}

function createLayerEl() {
    const canvas = document.createElement('canvas');
    canvas.width = logicalWidth;
    canvas.height = logicalHeight;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    canvas.className = 'canvas-layer';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    canvasContainer.appendChild(canvas);
    layers.push({ canvas, ctx, visible: true, opacity: 1 });
}

function setupEventListeners() {
    // Mode buttons - use both click and touchend for iPad Safari
    const brushBtn = document.getElementById('btn-brush');
    if (brushBtn) {
        brushBtn.addEventListener('click', () => setMode('brush'));
        brushBtn.addEventListener('touchend', e => { e.preventDefault(); setMode('brush'); });
    }
    
    const eraserBtn = document.getElementById('btn-eraser');
    if (eraserBtn) {
        eraserBtn.addEventListener('click', () => setMode('eraser'));
        eraserBtn.addEventListener('touchend', e => { e.preventDefault(); setMode('eraser'); });
    }
    
    const smudgeBtn = document.getElementById('btn-smudge');
    if (smudgeBtn) {
        smudgeBtn.addEventListener('click', () => setMode('smudge'));
        smudgeBtn.addEventListener('touchend', e => { e.preventDefault(); setMode('smudge'); });
    }
    
    const layersBtn = document.getElementById('btn-layers');
    if (layersBtn) {
        layersBtn.addEventListener('click', toggleLayersPanel);
        layersBtn.addEventListener('touchend', e => { e.preventDefault(); toggleLayersPanel(); });
    }
    
    // Sliders
    const sizeSlider = document.getElementById('size-slider');
    if (sizeSlider) sizeSlider.addEventListener('input', e => brushSize = parseInt(e.target.value));
    
    const opacitySlider = document.getElementById('opacity-slider');
    if (opacitySlider) opacitySlider.addEventListener('input', e => brushOpacity = parseInt(e.target.value) / 100);
    
    // Canvas drawing
    canvasContainer.addEventListener('pointerdown', handlePointerDown);
    canvasContainer.addEventListener('pointermove', handlePointerMove);
    canvasContainer.addEventListener('pointerup', handlePointerUp);
    canvasContainer.addEventListener('pointerleave', () => { isDrawing = false; });
    canvasContainer.addEventListener('pointercancel', () => { isDrawing = false; });
    
    // Other buttons
    const undoBtn = document.getElementById('btn-undo');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => alert('Undo'));
        undoBtn.addEventListener('touchend', e => { e.preventDefault(); alert('Undo'); });
    }
    
    const redoBtn = document.getElementById('btn-redo');
    if (redoBtn) {
        redoBtn.addEventListener('click', () => alert('Redo'));
        redoBtn.addEventListener('touchend', e => { e.preventDefault(); alert('Redo'); });
    }
    
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => alert('Export'));
        exportBtn.addEventListener('touchend', e => { e.preventDefault(); alert('Export'); });
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn, .tool-btn-style').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-${mode}`);
    if (btn) btn.classList.add('active');
    console.log('setMode called with:', mode);
}

function handlePointerDown(e) {
    const rect = canvasContainer.getBoundingClientRect();
    const pos = {
        x: (e.clientX - rect.left) / (rect.width / logicalWidth),
        y: (e.clientY - rect.top) / (rect.height / logicalHeight)
    };
    isDrawing = true;
    points = [{ x: pos.x, y: pos.y }];
    smoothBuffer = [{ ...pos }];
}

function handlePointerMove(e) {
    if (!isDrawing) return;
    const rect = canvasContainer.getBoundingClientRect();
    const pos = {
        x: (e.clientX - rect.left) / (rect.width / logicalWidth),
        y: (e.clientY - rect.top) / (rect.height / logicalHeight)
    };
    points.push({ x: pos.x, y: pos.y });
    smoothBuffer.push({ ...pos });
    drawStroke();
}

function handlePointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    points = [];
    smoothBuffer = [];
    const layer = layers[activeLayerIndex];
    if (layer) layer.ctx.beginPath();
}

function drawStroke() {
    const layer = layers[activeLayerIndex];
    if (!layer || points.length < 2) return;
    
    layer.ctx.lineCap = 'round';
    layer.ctx.lineJoin = 'round';
    layer.ctx.lineWidth = brushSize;
    layer.ctx.strokeStyle = brushColor;
    layer.ctx.globalCompositeOperation = currentMode === 'eraser' ? 'destination-out' : 'source-over';
    
    const prev = smoothBuffer[smoothBuffer.length - 2];
    const curr = smoothBuffer[smoothBuffer.length - 1];
    
    layer.ctx.beginPath();
    layer.ctx.moveTo(prev.x, prev.y);
    layer.ctx.lineTo(curr.x, curr.y);
    layer.ctx.stroke();
}

function setupUI() {
    const colorBtn = document.getElementById('btn-color');
    if (colorBtn) {
        colorBtn.addEventListener('click', () => {
            const color = prompt('Color (hex):', brushColor);
            if (color) brushColor = color;
            updateColorIndicator();
        });
    }
    updateColorIndicator();
}

function updateColorIndicator() {
    const indicator = document.getElementById('current-color-indicator');
    if (indicator) indicator.style.backgroundColor = brushColor;
}

function toggleLayersPanel() {
    const layersPanel = document.getElementById('layers-panel');
    if (layersPanel) layersPanel.classList.toggle('hidden');
}

async function boot() {
    // Make setMode global for onclick handlers
    window.setMode = setMode;
    window.toggleLayersPanel = toggleLayersPanel;
    
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            await reg.update();
        } catch (e) { console.log('SW registration failed'); }
    }
    console.log('Procreate Lite loaded - ready for iPad');
}