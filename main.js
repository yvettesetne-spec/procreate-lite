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
let canvasPool = [];

document.addEventListener('DOMContentLoaded', () => {
    canvasContainer = document.getElementById('canvas-container');
    init();
    boot();
});

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
    const brushBtn = document.getElementById('btn-brush');
    if (brushBtn) brushBtn.addEventListener('click', () => setMode('brush'));
    
    const eraserBtn = document.getElementById('btn-eraser');
    if (eraserBtn) eraserBtn.addEventListener('click', () => setMode('eraser'));
    
    const sizeSlider = document.getElementById('size-slider');
    if (sizeSlider) sizeSlider.addEventListener('input', e => brushSize = parseInt(e.target.value));
    
    // Canvas events
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-${mode}`);
    if (btn) btn.classList.add('active');
}

function handlePointerDown(e) {
    if (e.target.closest('.tool-btn') || e.target.closest('.panel')) return;
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

async function boot() {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            await reg.update();
        } catch (e) { console.log('SW registration failed'); }
    }
    console.log('Procreate Lite loaded - ready for iPad');
}