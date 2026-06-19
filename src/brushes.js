// Brushes module - Brush definitions and rendering
// Export functions for use in main.js

const brushStudio = {
    solid: { spacing: 4, scatter: 0, jitter: 0, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 0 },
    pencil: { spacing: 4, scatter: 0, jitter: 0, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 20 },
    airbrush: { spacing: 4, scatter: 0, jitter: 0, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 0 },
    marker: { spacing: 4, scatter: 0, jitter: 0, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 10 },
    calligraphy: { spacing: 2, scatter: 0, jitter: 0, rotation: 0, dirRotation: 80, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 30 },
    splatter: { spacing: 6, scatter: 60, jitter: 40, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: false, stabilization: 0 },
    texture: { spacing: 3, scatter: 10, jitter: 20, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 0 },
    charcoal: { spacing: 3, scatter: 15, jitter: 30, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 15 },
    watercolor: { spacing: 2, scatter: 5, jitter: 10, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 40, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 25 },
    oilpaint: { spacing: 2, scatter: 5, jitter: 0, rotation: 0, dirRotation: 60, colorDynamics: 0, wetMix: 70, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 20 },
    ink: { spacing: 3, scatter: 8, jitter: 5, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 40 },
    fountain: { spacing: 2, scatter: 0, jitter: 0, rotation: 0, dirRotation: 45, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 35 },
    marker2: { spacing: 4, scatter: 0, jitter: 0, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 10 },
    charcoal2: { spacing: 3, scatter: 15, jitter: 30, rotation: 0, dirRotation: 0, colorDynamics: 0, wetMix: 0, dual: false, dualType: 'airbrush', pressureResponsive: true, stabilization: 15 }
};