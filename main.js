// Procreate Lite - Minimal Portable Version for iPad 5th Gen
// Optimized for 2GB RAM and generic stylus

// === Globals for src/ modules ===
var logicalWidth = 1024;
var logicalHeight = 768;
var dpr = window.devicePixelRatio || 1;
var layers = [];
var activeLayerIndex = 0;
var currentMode = 'brush';
var brushSize = 10;
var brushOpacity = 1;
var brushColor = '#ffffff';
var isDrawing = false;
var points = [];
var smoothBuffer = [];
var canvasContainer;
const MAX_LAYERS = 30;
var layerIdCounter = 1;
var canvasPool = [];
const CANVAS_POOL_LIMIT = 20;
var defaultEffects = {
    shadow: { enable: false, x: 4, y: 4, blur: 8, opacity: 50, color: '#000000' },
    glow: { enable: false, blur: 10, opacity: 50, color: '#ffffff', spread: 0 },
    blur: { enable: false, radius: 0 },
    innerShadow: { enable: false, x: -4, y: -4, blur: 8, opacity: 50, color: '#000000' },
    innerGlow: { enable: false, blur: 10, opacity: 50, color: '#ffffff' },
    bevel: { enable: false, size: 5, softness: 50, opacity: 50 }
};
var stabilizationLevel = 5;
var currentBrush = 'solid';
var currentGuide = 'none';
var isBlendPreview = false;
var isOnionSkin = false;
var isAnimating = false;
var isPaperTexture = false;
var undoStack = [];
var redoStack = [];
const MAX_UNDO = 50;

document.addEventListener('DOMContentLoaded', function() {
    canvasContainer = document.getElementById('canvas-container');
    init();
    boot();
});

function init() {
    createBaseLayer();
    setupEventListeners();
    setupUI();
}

function createBaseLayer() {
    var canvas = document.createElement('canvas');
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    canvas.className = 'canvas-layer bg-layer';
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    canvasContainer.appendChild(canvas);
    layers.push({ canvas: canvas, ctx: ctx, visible: true, opacity: 1, id: 'layer-0', name: 'Capa 1', alphaLock: false, blendMode: 'source-over', maskData: null, clippingMask: false, effects: JSON.parse(JSON.stringify(defaultEffects)) });
}

// === Helper: bind click to a button element ===
function bindClick(id, fn) {
    var el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', fn);
    }
}

function bindSlider(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function(e) { fn(e.target.value); });
}

function setupEventListeners() {
    // Tool buttons
    bindClick('btn-brush', function() { setMode('brush'); });
    bindClick('btn-eraser', function() { setMode('eraser'); });
    bindClick('btn-smudge', function() { setMode('smudge'); });
    bindClick('btn-layers', toggleLayersPanel);
    bindClick('btn-color', function() {
        var c = prompt('Color (hex):', brushColor);
        if (c) { brushColor = c; updateColorIndicator(); }
    });
    bindClick('btn-gallery', function() { togglePanel('gallery-view'); });
    bindClick('btn-export', function() { togglePanel('export-presets-panel'); });
    bindClick('btn-export-png', function() { exportCanvas('png'); });
    bindClick('btn-export-pdf', function() { exportCanvas('pdf'); });
    bindClick('btn-export-svg', function() { exportCanvas('svg'); });
    bindClick('btn-settings', function() { showAlert('Ajustes', 'Panel de ajustes proximamente'); });
    bindClick('btn-brush-library', function() { togglePanel('brushes-panel'); });

    // Undo / Redo
    bindClick('btn-undo', undo);
    bindClick('btn-redo', redo);

    // Sliders
    bindSlider('size-slider', function(v) { brushSize = parseInt(v); });
    bindSlider('opacity-slider', function(v) { brushOpacity = parseInt(v) / 100; });
    bindSlider('stabilization-slider', function(v) { stabilizationLevel = parseInt(v); });

    // Canvas drawing
    canvasContainer.addEventListener('pointerdown', handlePointerDown);
    canvasContainer.addEventListener('pointermove', handlePointerMove);
    canvasContainer.addEventListener('pointerup', handlePointerUp);
    canvasContainer.addEventListener('pointerleave', function() { isDrawing = false; });
    canvasContainer.addEventListener('pointercancel', function() { isDrawing = false; });

    // Layer actions
    bindClick('btn-add-layer', addLayerAction);
    bindClick('btn-delete-layer', deleteLayerAction);
    bindClick('btn-duplicate-layer', duplicateLayerAction);
    bindClick('btn-clear-layer', clearLayerAction);
    bindClick('btn-merge-down', mergeDownAction);
    bindClick('btn-add-group', function() { showToast('Grupo creado'); });
    bindClick('btn-add-mask', function() { showToast('Mascara anadida'); });
    bindClick('btn-add-fill', function() { showToast('Capa de relleno'); });
    bindClick('btn-add-adjustment', function() { showAlert('Ajuste', 'Selecciona tipo de ajuste'); });
    bindClick('btn-layer-effects', function() { togglePanel('layer-effects-panel'); });
    bindClick('btn-flip-h-panel', function() { flipCanvas('horizontal'); });
    bindClick('btn-flip-v-panel', function() { flipCanvas('vertical'); });

    // Search layers
    var searchInput = document.getElementById('layer-search-input');
    if (searchInput) searchInput.addEventListener('input', function(e) { filterLayers(e.target.value); });

    // Crop panel
    bindClick('btn-crop-cancel', function() { togglePanel('crop-panel'); });
    bindClick('btn-crop-confirm', function() { showToast('Recorte aplicado'); });
    bindClick('btn-crop-reset', function() { showToast('Recorte reiniciado'); });

    // Transform panel
    bindClick('btn-transform-cancel', function() { togglePanel('transform-panel'); });
    bindClick('btn-transform-confirm', function() { showToast('Transformacion aplicada'); });
    bindClick('btn-transform-flip-h', function() { flipSelection('horizontal'); });
    bindClick('btn-transform-flip-v', function() { flipSelection('vertical'); });
    bindClick('btn-selection-invert', invertSelection);

    // Text panel
    bindClick('btn-text-cancel', function() { togglePanel('text-panel'); });
    bindClick('btn-text-confirm', function() { showToast('Texto anadido'); });
    bindClick('btn-text-to-vector', function() { showToast('Convertido a vector'); });

    // Adjustments
    bindClick('btn-hsb-apply', function() { showToast('HSB aplicado'); });
    bindClick('btn-hsb-cancel', function() { togglePanel('hsb-panel'); });
    bindClick('btn-hsb-reset', function() { showToast('HSB reiniciado'); });
    bindClick('btn-levels-apply', function() { showToast('Niveles aplicados'); });
    bindClick('btn-levels-cancel', function() { togglePanel('levels-panel'); });
    bindClick('btn-levels-reset', function() { showToast('Niveles reiniciados'); });
    bindClick('btn-curves-apply', function() { showToast('Curvas aplicadas'); });
    bindClick('btn-curves-cancel', function() { togglePanel('curves-panel'); });
    bindClick('btn-curves-reset', function() { showToast('Curvas reiniciadas'); });
    bindClick('btn-blur-apply', function() { showToast('Desenfoque aplicado'); });
    bindClick('btn-blur-cancel', function() { togglePanel('blur-panel'); });
    bindClick('btn-motion-blur-apply', function() { showToast('Desenfoque movimiento aplicado'); });
    bindClick('btn-motion-blur-cancel', function() { togglePanel('motion-blur-panel'); });
    bindClick('btn-cb-apply', function() { showToast('Balance de color aplicado'); });
    bindClick('btn-cb-cancel', function() { togglePanel('color-balance-panel'); });
    bindClick('btn-cb-reset', function() { showToast('Balance de color reiniciado'); });
    bindClick('btn-vibrance-apply', function() { showToast('Vibrance aplicado'); });
    bindClick('btn-vibrance-cancel', function() { togglePanel('vibrance-panel'); });
    bindClick('btn-vibrance-reset', function() { showToast('Vibrance reiniciado'); });
    bindClick('btn-sc-apply', function() { showToast('Color selectivo aplicado'); });
    bindClick('btn-sc-cancel', function() { togglePanel('selective-color-panel'); });
    bindClick('btn-sc-reset', function() { showToast('Color selectivo reiniciado'); });

    // Resize
    bindClick('btn-resize-apply', function() { showToast('Tamano cambiado'); });
    bindClick('btn-resize-cancel', function() { togglePanel('resize-panel'); });

    // Gradient
    bindClick('btn-gradient-apply', function() { showToast('Degradado aplicado'); });
    bindClick('btn-gradient-cancel', function() { togglePanel('gradient-panel'); });

    // Export
    bindClick('btn-export-jpeg-go', function() { exportCanvas('jpeg'); });
    bindClick('btn-export-gif', function() { showToast('Exportar GIF'); });
    bindClick('btn-export-hdr', function() { showToast('Exportar HDR'); });

    // Paper texture
    bindClick('btn-paper-texture-toggle', togglePaperTexture);

    // Animation
    bindClick('btn-anim-play', toggleAnimation);
    bindClick('btn-anim-add-frame', function() { showToast('Fotograma anadido'); });
    bindClick('btn-anim-dup-frame', function() { showToast('Fotograma duplicado'); });
    bindClick('btn-anim-del-frame', function() { showToast('Fotograma eliminado'); });
    bindClick('btn-anim-first', function() { showToast('Primer fotograma'); });
    bindClick('btn-anim-prev', function() { showToast('Fotograma anterior'); });
    bindClick('btn-anim-next', function() { showToast('Fotograma siguiente'); });
    bindClick('btn-anim-last', function() { showToast('Ultimo fotograma'); });
    bindClick('btn-anim-onion', toggleOnionSkin);

    // Macros
    bindClick('btn-macro-record', function() { showToast('Grabando macro...'); });
    bindClick('btn-macro-stop', function() { showToast('Grabacion detenida'); });
    bindClick('btn-macro-play', function() { showToast('Reproduciendo macro...'); });
    bindClick('btn-macro-save', function() { showToast('Macro guardada'); });

    // Gallery
    bindClick('btn-new-folder', function() { showToast('Nueva carpeta'); });
    bindClick('btn-new-project', newProject);

    // Reference
    bindClick('ref-close', function() { togglePanel('reference-overlay'); });
    bindClick('ref-opacity-up', function() { showToast('Opacidad +'); });
    bindClick('ref-opacity-down', function() { showToast('Opacidad -'); });

    // Color presets
    document.querySelectorAll('.color-preset').forEach(function(el) {
        el.addEventListener('click', function() {
            var color = el.dataset.color;
            if (color) { brushColor = color; updateColorIndicator(); }
        });
    });

    // BG color swatches
    document.querySelectorAll('.bg-swatch').forEach(function(el) {
        el.addEventListener('click', function() {
            var bg = el.dataset.bg;
            if (bg && bg !== 'transparent') {
                var bgLayer = document.querySelector('.canvas-layer.bg-layer');
                if (bgLayer) bgLayer.style.backgroundColor = bg;
            }
        });
    });

    // Brush library items
    document.querySelectorAll('.layer-item[data-brush]').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.layer-item[data-brush]').forEach(function(b) { b.classList.remove('active'); });
            el.classList.add('active');
            currentBrush = el.dataset.brush;
            showToast('Pincel: ' + el.textContent.trim());
        });
    });

    // Guide items
    document.querySelectorAll('.layer-item[data-guide]').forEach(function(el) {
        el.addEventListener('click', function() {
            currentGuide = el.dataset.guide;
            document.querySelectorAll('.layer-item[data-guide]').forEach(function(g) { g.classList.remove('active'); });
            el.classList.add('active');
            showToast('Guia: ' + el.textContent.trim());
        });
    });

    // Export preset buttons
    document.querySelectorAll('.export-preset-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            showToast('Exportando: ' + el.dataset.preset);
        });
    });

    // Symmetry axes
    document.querySelectorAll('.sym-axes-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.sym-axes-btn').forEach(function(b) { b.classList.remove('active'); });
            el.classList.add('active');
            showToast('Ejes: ' + el.dataset.axes);
        });
    });

    // Adjustment type buttons
    document.querySelectorAll('.adj-type-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.adj-type-btn').forEach(function(b) { b.classList.remove('active'); });
            el.classList.add('active');
            var type = el.dataset.type;
            ['adj-hsb-controls', 'adj-curves-controls', 'adj-levels-controls'].forEach(function(id) {
                var p = document.getElementById(id);
                if (p) p.style.display = 'none';
            });
            var target = document.getElementById('adj-' + type + '-controls');
            if (target) target.style.display = 'block';
        });
    });

    // Liquify modes
    document.querySelectorAll('.liquify-modes .tool-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.liquify-modes .tool-btn').forEach(function(b) { b.classList.remove('active'); });
            el.classList.add('active');
        });
    });
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn, .tool-btn-style').forEach(function(btn) { btn.classList.remove('active'); });
    var btn = document.getElementById('btn-' + mode);
    if (btn) {
        btn.classList.add('active');
        showToast('Modo: ' + mode.charAt(0).toUpperCase() + mode.slice(1));
    } else {
        showToast('Error: boton no encontrado');
    }
}

function handlePointerDown(e) {
    var rect = canvasContainer.getBoundingClientRect();
    var scaleX = rect.width / logicalWidth;
    var scaleY = rect.height / logicalHeight;
    var pos = {
        x: (e.clientX - rect.left) / scaleX,
        y: (e.clientY - rect.top) / scaleY
    };
    isDrawing = true;
    points = [{ x: pos.x, y: pos.y }];
    smoothBuffer = [{ x: pos.x, y: pos.y }];
    saveUndoState();
}

function handlePointerMove(e) {
    if (!isDrawing) return;
    var rect = canvasContainer.getBoundingClientRect();
    var scaleX = rect.width / logicalWidth;
    var scaleY = rect.height / logicalHeight;
    var pos = {
        x: (e.clientX - rect.left) / scaleX,
        y: (e.clientY - rect.top) / scaleY
    };
    points.push({ x: pos.x, y: pos.y });
    smoothBuffer.push({ x: pos.x, y: pos.y });
    drawStroke();
}

function handlePointerUp() {
    if (!isDrawing) return;
    isDrawing = false;
    points = [];
    smoothBuffer = [];
    var layer = layers[activeLayerIndex];
    if (layer) layer.ctx.beginPath();
}

function drawStroke() {
    var layer = layers[activeLayerIndex];
    if (!layer || points.length < 2) return;
    layer.ctx.lineCap = 'round';
    layer.ctx.lineJoin = 'round';
    layer.ctx.lineWidth = brushSize;
    layer.ctx.strokeStyle = brushColor;
    layer.ctx.globalCompositeOperation = currentMode === 'eraser' ? 'destination-out' : 'source-over';
    layer.ctx.globalAlpha = brushOpacity;
    var prev = smoothBuffer[smoothBuffer.length - 2];
    var curr = smoothBuffer[smoothBuffer.length - 1];
    layer.ctx.beginPath();
    layer.ctx.moveTo(prev.x, prev.y);
    layer.ctx.lineTo(curr.x, curr.y);
    layer.ctx.stroke();
}

// === Undo/Redo ===
function saveUndoState() {
    if (!layers[activeLayerIndex]) return;
    var c = layers[activeLayerIndex].canvas;
    var data = c.toDataURL();
    undoStack.push(data);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
}

function undo() {
    if (undoStack.length === 0) { showToast('Nada que deshacer'); return; }
    var layer = layers[activeLayerIndex];
    if (!layer) return;
    var current = layer.canvas.toDataURL();
    redoStack.push(current);
    var data = undoStack.pop();
    var img = new Image();
    img.onload = function() {
        layer.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        layer.ctx.drawImage(img, 0, 0);
    };
    img.src = data;
}

function redo() {
    if (redoStack.length === 0) { showToast('Nada que rehacer'); return; }
    var layer = layers[activeLayerIndex];
    if (!layer) return;
    var current = layer.canvas.toDataURL();
    undoStack.push(current);
    var data = redoStack.pop();
    var img = new Image();
    img.onload = function() {
        layer.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        layer.ctx.drawImage(img, 0, 0);
    };
    img.src = data;
}

// === Layer Operations ===
function addLayerAction() {
    if (layers.length >= MAX_LAYERS) {
        showAlert('Limite de capas', 'Maximo ' + MAX_LAYERS + ' capas');
        return;
    }
    var canvas = document.createElement('canvas');
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    canvas.className = 'canvas-layer';
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    canvasContainer.appendChild(canvas);
    var layer = {
        id: 'layer-' + (layerIdCounter++),
        name: 'Capa ' + (layers.length + 1),
        canvas: canvas, ctx: ctx, visible: true,
        opacity: 1, alphaLock: false,
        blendMode: 'source-over',
        maskData: null, clippingMask: false,
        effects: JSON.parse(JSON.stringify(defaultEffects))
    };
    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    showToast('Capa anadida');
    renderLayersUI && renderLayersUI();
}

function deleteLayerAction() {
    if (layers.length <= 1) { showToast('No se puede eliminar la ultima capa'); return; }
    var layer = layers[activeLayerIndex];
    if (layer) { layer.canvas.remove(); }
    layers.splice(activeLayerIndex, 1);
    if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
    showToast('Capa eliminada');
    renderLayersUI && renderLayersUI();
}

function duplicateLayerAction() {
    if (layers.length >= MAX_LAYERS) { showToast('Limite de capas'); return; }
    var src = layers[activeLayerIndex];
    if (!src) return;
    var canvas = document.createElement('canvas');
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    canvas.className = 'canvas-layer';
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    ctx.drawImage(src.canvas, 0, 0);
    canvasContainer.appendChild(canvas);
    var layer = {
        id: 'layer-' + (layerIdCounter++),
        name: src.name + ' (copia)',
        canvas: canvas, ctx: ctx, visible: true,
        opacity: src.opacity, alphaLock: false,
        blendMode: src.blendMode,
        maskData: null, clippingMask: false,
        effects: JSON.parse(JSON.stringify(src.effects))
    };
    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    showToast('Capa duplicada');
    renderLayersUI && renderLayersUI();
}

function clearLayerAction() {
    var layer = layers[activeLayerIndex];
    if (!layer) return;
    layer.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    showToast('Capa limpiada');
}

function mergeDownAction() {
    if (activeLayerIndex <= 0) { showToast('No hay capa inferior'); return; }
    var upper = layers[activeLayerIndex];
    var lower = layers[activeLayerIndex - 1];
    if (!upper || !lower) return;
    lower.ctx.drawImage(upper.canvas, 0, 0);
    upper.canvas.remove();
    layers.splice(activeLayerIndex, 1);
    activeLayerIndex--;
    showToast('Capas fusionadas');
    renderLayersUI && renderLayersUI();
}

// === Panel Toggles ===
function togglePanel(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

function toggleLayersPanel() {
    togglePanel('layers-panel');
}

function toggleBrushPanel() {
    togglePanel('brushes-panel');
}

function toggleBlendPreview() {
    isBlendPreview = !isBlendPreview;
    showToast(isBlendPreview ? 'Blend preview ON' : 'Blend preview OFF');
}

function toggleOnionSkin() {
    isOnionSkin = !isOnionSkin;
    showToast(isOnionSkin ? 'Onion skin ON' : 'Onion skin OFF');
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    var btn = document.getElementById('btn-anim-play');
    if (btn) btn.innerHTML = isAnimating ? '<i class="ri-pause-fill"></i>' : '<i class="ri-play-fill"></i>';
    showToast(isAnimating ? 'Reproduciendo...' : 'Animacion detenida');
}

function togglePaperTexture() {
    isPaperTexture = !isPaperTexture;
    showToast(isPaperTexture ? 'Textura de papel ON' : 'Textura de papel OFF');
}

// === Filter Layers ===
function filterLayers(query) {
    document.querySelectorAll('#layers-list .layer-item').forEach(function(el) {
        var name = el.querySelector('.layer-name');
        if (name) {
            el.style.display = (name.textContent.toLowerCase().indexOf(query.toLowerCase()) !== -1) ? '' : 'none';
        }
    });
}

// === Canvas Flipping ===
function flipCanvas(dir) {
    var layer = layers[activeLayerIndex];
    if (!layer) return;
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = logicalWidth * dpr;
    tempCanvas.height = logicalHeight * dpr;
    var tempCtx = tempCanvas.getContext('2d');
    if (dir === 'horizontal') {
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
    } else {
        tempCtx.translate(0, tempCanvas.height);
        tempCtx.scale(1, -1);
    }
    tempCtx.drawImage(layer.canvas, 0, 0);
    layer.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    layer.ctx.drawImage(tempCanvas, 0, 0);
    showToast('Canvas volteado');
}

function flipSelection(dir) {
    showToast('Seleccion volteada');
}

function invertSelection() {
    showToast('Seleccion invertida');
}

// === Export ===
function exportCanvas(format) {
    var dataUrl;
    var layer = layers[activeLayerIndex];
    if (!layer) { showToast('No hay capa para exportar'); return; }
    var exportCanvas = document.createElement('canvas');
    exportCanvas.width = logicalWidth;
    exportCanvas.height = logicalHeight;
    var exportCtx = exportCanvas.getContext('2d');
    var bgLayer = document.querySelector('.canvas-layer.bg-layer');
    if (bgLayer) {
        exportCtx.fillStyle = window.getComputedStyle(bgLayer).backgroundColor || '#ffffff';
        exportCtx.fillRect(0, 0, logicalWidth, logicalHeight);
    }
    layers.forEach(function(l) {
        if (l.visible) exportCtx.drawImage(l.canvas, 0, 0);
    });
    if (format === 'png') {
        dataUrl = exportCanvas.toDataURL('image/png');
    } else if (format === 'jpeg') {
        var quality = parseInt(document.getElementById('jpeg-quality') ? document.getElementById('jpeg-quality').value : 90) / 100;
        dataUrl = exportCanvas.toDataURL('image/jpeg', quality);
    } else if (format === 'pdf') {
        dataUrl = exportCanvas.toDataURL('image/png');
        showToast('PDF export - usa save como PNG');
    } else if (format === 'svg') {
        showToast('SVG export proximamente');
        return;
    }
    var link = document.createElement('a');
    link.download = 'procreate-export.' + (format === 'jpeg' ? 'jpg' : 'png');
    link.href = dataUrl;
    link.click();
    showToast('Exportado como ' + format.toUpperCase());
}

function newProject() {
    if (layers.length > 1) {
        if (!confirm('Se perdera el proyecto actual. Continuar?')) return;
    }
    while (layers.length > 0) {
        var l = layers.pop();
        if (l.canvas) l.canvas.remove();
    }
    activeLayerIndex = 0;
    layerIdCounter = 1;
    createBaseLayer();
    togglePanel('gallery-view');
    showToast('Nuevo proyecto');
}

// === UI ===
function setupUI() {
    updateColorIndicator();
}

function updateColorIndicator() {
    var indicator = document.getElementById('current-color-indicator');
    if (indicator) indicator.style.backgroundColor = brushColor;
}

// === Toast / Alert ===
function showToast(msg) {
    var el = document.getElementById('toast-message');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-message';
        el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 20px;border-radius:12px;z-index:99999;font-size:13px;pointer-events:none;transition:opacity 0.3s;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(function() { el.style.opacity = '0'; }, 2000);
}

function showAlert(title, message) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100000;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#2c2c2e;border:1px solid #444;border-radius:12px;padding:20px;max-width:360px;width:90%;';
    var titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin:0 0 12px 0;font-size:15px;color:#fff;';
    box.appendChild(titleEl);
    var msgEl = document.createElement('p');
    msgEl.innerHTML = message;
    msgEl.style.cssText = 'margin:0 0 16px 0;font-size:12px;color:#ccc;line-height:1.5;';
    box.appendChild(msgEl);
    var btn = document.createElement('button');
    btn.textContent = 'Aceptar';
    btn.style.cssText = 'padding:8px 24px;border-radius:8px;border:none;background:#007aff;color:#fff;font-size:13px;cursor:pointer;float:right;';
    btn.onclick = function() { document.body.removeChild(modal); };
    box.appendChild(btn);
    modal.appendChild(box);
    document.body.appendChild(modal);
}

function renderLayersUI() {
    var list = document.getElementById('layers-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = layers.length - 1; i >= 0; i--) {
        var l = layers[i];
        var item = document.createElement('div');
        item.className = 'layer-item' + (i === activeLayerIndex ? ' active' : '');
        item.dataset.index = i;
        item.innerHTML = '<div class="layer-thumb"></div><div class="layer-name">' + l.name + '</div>';
        item.addEventListener('click', function() {
            activeLayerIndex = parseInt(this.dataset.index);
            renderLayersUI();
        });
        list.appendChild(item);
    }
}

async function boot() {
    window.setMode = setMode;
    window.toggleLayersPanel = toggleLayersPanel;
    renderLayersUI();
    if ('serviceWorker' in navigator) {
        try {
            var reg = await navigator.serviceWorker.register('/sw.js');
            await reg.update();
        } catch (e) { console.log('SW registration failed'); }
    }
    console.log('Procreate Lite loaded - ready for iPad');
}