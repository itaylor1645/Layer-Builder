(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SphereMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Coordinate convention: for odd diameters the geometric center is exactly at
  // the entered block coordinate. For even diameters it is 0.5 on the positive
  // side of the entered X/Y/Z, between the eight central blocks.
  function centerShift(diameter) { return diameter % 2 === 0 ? 0.5 : 0; }
  function axisOffset(index, diameter) { return index - Math.floor(diameter / 2) + (diameter % 2 === 0 ? 1 : 0); }
  function localPosition(index, diameter) { return axisOffset(index, diameter) - centerShift(diameter); }

  function filledAt(x, y, z, diameter) {
    const radius = diameter / 2;
    const px = localPosition(x, diameter), py = localPosition(y, diameter), pz = localPosition(z, diameter);
    return px * px + py * py + pz * pz <= radius * radius;
  }

  function isSphereBlock(x, y, z, diameter, type) {
    if (!filledAt(x, y, z, diameter)) return false;
    if (type === "filled") return true;
    const neighbors = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    return neighbors.some(([dx, dy, dz]) => !filledAt(x + dx, y + dy, z + dz, diameter));
  }

  function buildSphere(diameter, type) {
    const layers = [];
    const upperLayerCount = Math.ceil(diameter / 2);
    for (let layer = 0; layer < upperLayerCount; layer++) {
      const yIndex = Math.floor(diameter / 2) + layer;
      const blocks = new Uint8Array(diameter * diameter);
      let count = 0;
      for (let z = 0; z < diameter; z++) for (let x = 0; x < diameter; x++) {
        if (isSphereBlock(x, yIndex, z, diameter, type)) { blocks[z * diameter + x] = 1; count++; }
      }
      layers.push({ blocks, count, yIndex });
    }
    const upperCount = layers.reduce((sum, layer) => sum + layer.count, 0);
    // Odd spheres have one unpaired center layer. Even spheres have two central
    // layers: entered Y and entered Y+1; the displayed upper half starts at Y+1.
    const totalCount = diameter % 2 ? upperCount * 2 - layers[0].count : upperCount * 2;
    return { diameter, type, layers, upperCount, totalCount };
  }

  function worldAxis(index, center, diameter) { return center + axisOffset(index, diameter); }
  function layerY(layerIndex, centerY, diameter) { return centerY + layerIndex + (diameter % 2 === 0 ? 1 : 0); }
  function mirrorY(layerIndex, centerY, diameter) { return centerY - layerIndex; }

  function getEdges(layer, diameter, centers, y) {
    const points = [];
    for (let z = 0; z < diameter; z++) for (let x = 0; x < diameter; x++) if (layer.blocks[z * diameter + x]) points.push({ x, z });
    if (!points.length) return null;
    const pick = (key, value, tieKey, target) => points.filter(p => p[key] === value).sort((a,b) => Math.abs(a[tieKey]-target)-Math.abs(b[tieKey]-target))[0];
    const minX = Math.min(...points.map(p=>p.x)), maxX = Math.max(...points.map(p=>p.x));
    const minZ = Math.min(...points.map(p=>p.z)), maxZ = Math.max(...points.map(p=>p.z));
    const mid = (diameter - 1) / 2;
    const world = p => [worldAxis(p.x, centers.x, diameter), y, worldAxis(p.z, centers.z, diameter)];
    return { north: world(pick("z",minZ,"x",mid)), south: world(pick("z",maxZ,"x",mid)), west: world(pick("x",minX,"z",mid)), east: world(pick("x",maxX,"z",mid)) };
  }

  function getRowRanges(layer, diameter, direction, fixedIndex, centers) {
    const values = [];
    for (let i = 0; i < diameter; i++) {
      const x = direction === "x" ? i : fixedIndex, z = direction === "x" ? fixedIndex : i;
      if (layer.blocks[z * diameter + x]) values.push(worldAxis(i, direction === "x" ? centers.x : centers.z, diameter));
    }
    const ranges = [];
    for (const value of values) {
      const last = ranges[ranges.length - 1];
      if (last && value === last[1] + 1) last[1] = value; else ranges.push([value, value]);
    }
    return ranges;
  }

  return { centerShift, axisOffset, localPosition, filledAt, isSphereBlock, buildSphere, worldAxis, layerY, mirrorY, getEdges, getRowRanges };
});
