// Layer Groups module - Organize layers into folders

let layerGroups = [];

function createLayerGroup(name = 'Grupo') {
    const group = { id: 'group-' + Date.now(), name, layerIds: [], open: true };
    layerGroups.push(group);
    return group;
}

function addLayerToGroup(layerId, groupId) {
    const group = layerGroups.find(g => g.id === groupId);
    if (group && !group.layerIds.includes(layerId)) {
        group.layerIds.push(layerId);
    }
}

function removeLayerFromGroup(layerId) {
    layerGroups.forEach(g => {
        g.layerIds = g.layerIds.filter(id => id !== layerId);
    });
}

function toggleGroup(groupId) {
    const group = layerGroups.find(g => g.id === groupId);
    if (group) group.open = !group.open;
}

function deleteGroup(groupId) {
    layerGroups = layerGroups.filter(g => g.id !== groupId);
    localStorage.removeItem('procreate-lite-groups');
}