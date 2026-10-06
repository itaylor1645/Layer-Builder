const assert = require("assert");
const M = require("./sphere.js");

function testDiameter(diameter) {
  for (const type of ["hollow", "filled"]) {
    const sphere = M.buildSphere(diameter, type);
    assert.equal(sphere.layers.length, Math.ceil(diameter / 2));
    for (const layer of sphere.layers) for (let z=0;z<diameter;z++) for(let x=0;x<diameter;x++) {
      assert.equal(layer.blocks[z*diameter+x], layer.blocks[z*diameter+(diameter-1-x)], "X symmetry");
      assert.equal(layer.blocks[z*diameter+x], layer.blocks[(diameter-1-z)*diameter+x], "Z symmetry");
    }
  }
}

testDiameter(3); testDiameter(25); testDiameter(50); testDiameter(200);
assert.equal(M.layerY(0, 70, 25), 70);
assert.equal(M.layerY(0, 70, 50), 71);
assert.equal(M.mirrorY(0, 70, 50), 70);
assert.equal(M.worldAxis(0, -500, 50), -524);
assert.deepEqual(M.getRowRanges({blocks:Uint8Array.from([0,1,1,0,1])},5,"x",0,{x:10,z:0}), [[9,10],[12,12]]);
console.log("Sphere math tests passed.");
