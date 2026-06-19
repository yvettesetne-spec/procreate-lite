# Procreate Lite - iPad Portable App

## Instalación PWA en iPad 5ta generación

### Requisitos
- iPad con iOS 12+ (Safari)
- 2GB RAM soportado (optimizado)
- Stylus genérico soportado

### Instalación
1. Abrir Safari en iPad
2. Navegar a: `https://[tu-servidor]/index.html`
3. Click en "Compartir" → "Agregar a pantalla de inicio"
4. La app funcionará como aplicación nativa

### Características iPad-optimized
- Soporte completo para Apple Pencil/simulación stylus genérico
- Touch cursor para modos sin stylus
- Gestures multi-touch: 2 dedos rotar, 3 undo, 4 redo
- Memory management optimizado para 2GB RAM
- Canvas adaptativo a pantalla completa

### Servidor recomendado
Para despliegue local, usar:
```bash
npx serve -s . -l 8080
```

O usar GitHub Pages para acceso remoto.

### Estructura de archivos
```
procreate-lite/
├── index.html          # App principal
├── main.js             # ~25,700 líneas
├── style.css           # Estilos premium
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── icons/              # Iconos app
│   └── icon.svg        # Favicon SVG
└── src/              # Módulos JS
    ├── canvas.js
    ├── brushes.js
    ├── layers.js
    ├── modals.js
    ├── smoothing.js
    ├── harmony.js
    └── groups.js
```

### Compatibilidad
- iOS Safari 12+
- Chrome/iPadOS 13+
- Funciona offline con Service Worker
- Cache de recursos con v53