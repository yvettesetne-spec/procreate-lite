// Layers module - Layer management functions
// Export functions for use in main.js

function getActiveLayer() {
    return layers[activeLayerIndex];
}

function getReferenceLayer() {
    return layers.find(l => l.referenceLayer) || null;
}

function addLayer() {
    if (layers.length >= MAX_LAYERS) {
        showAlert('Límite de capas', `Límite de capas alcanzado (${MAX_LAYERS})`);
        return;
    }

    const { canvas, ctx } = createLayerEl();
    const layer = {
        id: `layer-${layerIdCounter++}`,
        name: `Capa ${layers.length + 1}`,
        canvas, ctx, visible: true,
        opacity: 1,
        alphaLock: false,
        blendMode: 'source-over',
        maskData: null,
        clippingMask: false,
        effects: JSON.parse(JSON.stringify(defaultEffects))
    };

    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    renderLayersUI();
}