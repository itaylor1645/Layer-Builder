(function () {
  "use strict";
  const M = window.SphereMath;
  const $ = id => document.getElementById(id);
  const canvas = $("layer-canvas"), ctx = canvas.getContext("2d");
  const state = { sphere:null, centers:{x:0,y:0,z:0}, layer:0, zoom:1, selected:null, rowIndex:null };
  const fmt = n => n.toLocaleString();

  function readInteger(id, label) {
    const input = $(id), value = Number(input.value);
    if (!Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
    return value;
  }

  function generate() {
    try {
      const diameter = readInteger("diameter", "Diameter");
      if (diameter < 3 || diameter > 200) throw new Error("Diameter must be between 3 and 200.");
      state.centers = { x:readInteger("center-x","Center X"), y:readInteger("center-y","Center Y"), z:readInteger("center-z","Center Z") };
      state.sphere = M.buildSphere(diameter, $("sphere-type").value);
      state.layer = 0; state.selected = null; state.rowIndex = null; state.zoom = 1;
      $("form-error").textContent = "";
      render();
    } catch (error) { $("form-error").textContent = error.message; }
  }

  function canvasMetrics() {
    const d = state.sphere.diameter;
    const available = Math.min(720, Math.max(280, $("canvas-scroller").clientWidth - 2));
    const baseCell = Math.max(2, Math.min(22, Math.floor(available / d)));
    return { cell: Math.max(2, baseCell * state.zoom), size: Math.max(2, baseCell * state.zoom) * d };
  }

  function renderGrid() {
    const { diameter:d, layers } = state.sphere, current = layers[state.layer], {cell,size} = canvasMetrics();
    const ratio = window.devicePixelRatio || 1;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`; canvas.width = Math.round(size*ratio); canvas.height = Math.round(size*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,size,size); ctx.fillStyle="#090d0b";ctx.fillRect(0,0,size,size);
    const adjacent = $("show-adjacent").checked && state.layer > 0 ? layers[state.layer-1] : null;
    if (adjacent) { ctx.fillStyle="rgba(125,155,129,.24)"; for(let i=0;i<adjacent.blocks.length;i++) if(adjacent.blocks[i]) ctx.fillRect((i%d)*cell,(i/d|0)*cell,cell,cell); }
    ctx.fillStyle="#9bd35a"; for(let i=0;i<current.blocks.length;i++) if(current.blocks[i]) ctx.fillRect((i%d)*cell,(i/d|0)*cell,cell,cell);
    if (cell >= 7) { ctx.strokeStyle="rgba(8,13,10,.35)";ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<=d;i++){ctx.moveTo(i*cell+.5,0);ctx.lineTo(i*cell+.5,size);ctx.moveTo(0,i*cell+.5);ctx.lineTo(size,i*cell+.5)}ctx.stroke(); }
    const center = d/2;
    ctx.strokeStyle="rgba(243,201,105,.9)";ctx.lineWidth=Math.max(1,Math.min(2,cell/4));ctx.beginPath();ctx.moveTo(center*cell,0);ctx.lineTo(center*cell,size);ctx.moveTo(0,center*cell);ctx.lineTo(size,center*cell);ctx.stroke();
    if (state.rowIndex != null) { ctx.fillStyle="rgba(243,201,105,.18)"; const alongX=$("row-direction").value==="x"; ctx.fillRect(alongX?0:state.rowIndex*cell,alongX?state.rowIndex*cell:0,alongX?size:cell,alongX?cell:size); }
    if (state.selected) { const {x,z}=state.selected;ctx.strokeStyle="#fff5bd";ctx.lineWidth=Math.max(2,cell*.15);ctx.strokeRect(x*cell+1,z*cell+1,Math.max(1,cell-2),Math.max(1,cell-2)); }
  }

  function renderDetails() {
    const s=state.sphere,d=s.diameter,layer=s.layers[state.layer],c=state.centers;
    const y=M.layerY(state.layer,c.y,d), mirror=M.mirrorY(state.layer,c.y,d), even=d%2===0;
    $("sphere-title").textContent=`${d} Block ${s.type === "hollow" ? "Hollow " : ""}Sphere`;
    $("layer-summary").textContent=`Layer +${state.layer} · Minecraft Y ${y}`;
    $("layer-progress").textContent=`Layer ${state.layer+1} of ${s.layers.length}`;
    $("relative-layer").textContent=state.layer===0 ? (even ? "First upper layer" : "Center layer") : `+${state.layer}`;
    $("world-y").textContent=String(y);
    $("mirror-y").textContent=!even&&state.layer===0 ? "Center — none" : `Y ${mirror}`;
    const minX=M.worldAxis(0,c.x,d),maxX=M.worldAxis(d-1,c.x,d),minZ=M.worldAxis(0,c.z,d),maxZ=M.worldAxis(d-1,c.z,d);
    $("grid-range").innerHTML=`X ${minX} → ${maxX}<br>Z ${minZ} → ${maxZ}`;
    const edges=M.getEdges(layer,d,c,y);
    $("edge-list").innerHTML=Object.entries(edges||{}).map(([name,coord])=>`<div class="edge"><span>${name}</span><strong>${coord.join(", ")}</strong></div>`).join("") || '<div class="empty-state">No blocks in this layer.</div>';
    $("layer-count").textContent=fmt(layer.count);$("upper-count").textContent=fmt(s.upperCount);$("total-count").textContent=fmt(s.totalCount);
    $("previous-layer").disabled=state.layer===0;$("next-layer").disabled=state.layer===s.layers.length-1;
    $("zoom-value").textContent=`${Math.round(state.zoom*100)}%`;
    renderSelection(y);
  }

  function renderSelection(y) {
    const d=state.sphere.diameter,c=state.centers,dir=$("row-direction").value;
    if (state.selected) { const x=M.worldAxis(state.selected.x,c.x,d),z=M.worldAxis(state.selected.z,c.z,d),exists=state.sphere.layers[state.layer].blocks[state.selected.z*d+state.selected.x]; $("cell-info").className="selection-value"; $("cell-info").innerHTML=`<b>${exists ? "Place block" : "Empty cell"}</b><br>${x}, ${y}, ${z}`; }
    else { $("cell-info").className="empty-state";$("cell-info").textContent="Select a block to see its coordinates."; }
    if (state.rowIndex != null) { const fixedCenter=dir==="x"?c.z:c.x,fixed=M.worldAxis(state.rowIndex,fixedCenter,d),ranges=M.getRowRanges(state.sphere.layers[state.layer],d,dir,state.rowIndex,c); const axis=dir.toUpperCase(),fixedAxis=dir==="x"?"Z":"X"; $("row-info").className="selection-value";$("row-info").innerHTML=`${fixedAxis} = <b>${fixed}</b><br>${ranges.length ? ranges.map(r=>`${axis} ${r[0]}${r[1]!==r[0]?` through ${r[1]}`:""}`).join("<br>") : "No blocks in this row"}`; }
    else { $("row-info").className="empty-state";$("row-info").textContent="Select a row on the grid."; }
  }

  function render(){ renderDetails();renderGrid(); }
  function moveLayer(delta){const next=Math.max(0,Math.min(state.sphere.layers.length-1,state.layer+delta));if(next!==state.layer){state.layer=next;state.selected=null;state.rowIndex=null;render();}}
  $("sphere-form").addEventListener("submit",e=>{e.preventDefault();generate()});
  $("previous-layer").addEventListener("click",()=>moveLayer(-1));$("next-layer").addEventListener("click",()=>moveLayer(1));
  document.addEventListener("keydown",e=>{if(["INPUT","SELECT"].includes(document.activeElement.tagName))return;if(e.key==="ArrowUp"){e.preventDefault();moveLayer(1)}if(e.key==="ArrowDown"){e.preventDefault();moveLayer(-1)}});
  canvas.addEventListener("click",e=>{const rect=canvas.getBoundingClientRect(),d=state.sphere.diameter,x=Math.min(d-1,Math.floor((e.clientX-rect.left)/rect.width*d)),z=Math.min(d-1,Math.floor((e.clientY-rect.top)/rect.height*d));state.selected={x,z};state.rowIndex=$("row-direction").value==="x"?z:x;render()});
  $("row-direction").addEventListener("change",()=>{if(state.selected)state.rowIndex=$("row-direction").value==="x"?state.selected.z:state.selected.x;render()});
  $("show-adjacent").addEventListener("change",renderGrid);
  $("zoom-in").addEventListener("click",()=>{state.zoom=Math.min(4,state.zoom+.25);render()});$("zoom-out").addEventListener("click",()=>{state.zoom=Math.max(.5,state.zoom-.25);render()});
  window.addEventListener("resize",()=>{clearTimeout(window.__resizeTimer);window.__resizeTimer=setTimeout(renderGrid,100)});
  generate();
})();
