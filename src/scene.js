import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const VIEWS = { iso: [[8, 6, 9], [0, 2.7, 0]], front: [[0, 2.7, 13], [0, 2.7, 0]], side: [[13, 2.7, 0], [0, 2.7, 0]],
  top: [[0, 15, 0.01], [0, 2.2, 0]], exploded: [[10, 7.5, 14], [0, 3.6, 0]], internal: [[4.5, 5.5, 5.5], [0, 0.4, 0]] };
const STATUS_COL = { Normal: 0x2fbf71, 'Low Gas': 0xf0a020, Critical: 0xe5383b };
const LABELS = { loadcell: 'Load Cell: measures total supported weight', hx711: 'HX711: amplifies and digitizes the load-cell signal',
  esp32: 'ESP32: processes the measurement', wifi: 'Wi-Fi: transmits readings to the dashboard' };
const DELAY = { cylinder: 0, plate: 0.1, enclosure: 0.3, led: 0.3, loadcell: 0.25, hx711: 0.35, esp32: 0.4, power: 0.45, wifi: 0.5 };
const M = (c, m = 0.4, r = 0.5, o = {}) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); return o; };
const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, open = false) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48, 1, open), mat); o.position.set(x, y, z); return o; };
const tor = (r, t, mat, x = 0, y = 0, z = 0, flat = true, arc = Math.PI * 2) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 48, arc), mat); if (flat) o.rotation.x = Math.PI / 2; o.position.set(x, y, z); return o; };
const smooth = (t) => t * t * (3 - 2 * t);

function canvasTex(w, h, bg, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.textAlign = 'center'; g.textBaseline = 'middle'; draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createScene(host, labelHost, cb) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { cb.onError && cb.onError(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const controls = new OrbitControls(cam, renderer.domElement); controls.enableDamping = true; controls.minDistance = 4; controls.maxDistance = 30; controls.autoRotateSpeed = 1.5;
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(6, 12, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); scene.add(sun, new THREE.HemisphereLight(0xbfd4ff, 0x20242c, 0.6));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), M(0x161b27, 0, 0.9)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const C = {}; const dispose = [];
  const add = (id, g, off, anchor) => { g.traverse((o) => { o.userData.comp = id; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    C[id] = { g, base: g.position.clone(), off: new THREE.Vector3(...off), anchor: new THREE.Vector3(...anchor) }; scene.add(g); };
  const steel = () => M(0x8d949c, 0.9, 0.35), dark = () => M(0x23262b, 0.5, 0.45), brass = () => M(0xb08d3c, 0.9, 0.3);

  // ---- LPG cylinder (lathe body, foot ring, collar, valve, 3D label)
  const cy = new THREE.Group(); cy.position.y = 0.4;
  const prof = [[1.4, 0.18], [1.5, 0.28], [1.5, 3.45], [1.47, 3.85], [1.28, 4.2], [0.9, 4.45], [0.6, 4.55], [0.5, 4.6]].map((p) => new THREE.Vector2(p[0], p[1]));
  cy.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), M(0xc9341f, 0.55, 0.32, { side: THREE.DoubleSide })));
  cy.add(cyl(1.52, 1.52, 0.2, steel(), 0, 0.1, 0), cyl(0.5, 0.5, 0.15, steel(), 0, 4.65, 0));
  cy.add(tor(0.95, 0.05, steel(), 0, 4.62), tor(0.95, 0.05, steel(), 0, 5.1));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; cy.add(cyl(0.05, 0.05, 0.5, steel(), 0.95 * Math.cos(a), 4.86, 0.95 * Math.sin(a))); }
  const vb = cyl(0.28, 0.28, 0.55, brass(), 0, 4.9, 0); cy.add(vb, tor(0.35, 0.05, brass(), 0, 5.28), box(0.7, 0.04, 0.06, brass(), 0, 5.28, 0),
    (() => { const o = cyl(0.1, 0.1, 0.4, brass(), 0.4, 4.9, 0); o.rotation.z = Math.PI / 2; return o; })());
  const labTex = canvasTex(1024, 680, '#f4f1ea', (g) => { g.fillStyle = '#c9341f'; g.fillRect(0, 0, 1024, 36); g.fillRect(0, 644, 1024, 36);
    g.fillStyle = '#14213d'; g.font = '700 150px Arial'; g.fillText('GASSENSE', 512, 250); g.font = '700 64px Arial'; g.fillText('SMART LPG MONITORING', 512, 390);
    g.fillStyle = '#555'; g.font = '400 38px Arial'; g.fillText('Weight-based gas level monitoring (concept)', 512, 500); });
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(1.505, 1.505, 1.7, 40, 1, true, -0.85, 1.7), M(0xffffff, 0, 0.6, { map: labTex })); lab.position.y = 2.0; cy.add(lab);
  add('cylinder', cy, [0, 3.4, 0], [0, 2, 1.5]);

  // ---- smart weighing base: upper plate, load cells, enclosure, boards
  const pl = new THREE.Group(); pl.add(cyl(1.65, 1.65, 0.08, M(0x3b4047, 0.7, 0.35), 0, 0.36, 0), tor(1.3, 0.05, M(0x0c0c0e, 0, 0.9), 0, 0.41));
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; pl.add(cyl(0.05, 0.05, 0.03, steel(), 1.5 * Math.cos(a), 0.405, 1.5 * Math.sin(a))); }
  add('plate', pl, [0, 1.8, 0], [0, 0.4, 1.65]);
  const lc = new THREE.Group();
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; const c1 = box(0.5, 0.14, 0.18, M(0x9aa3ad, 0.9, 0.3), 1.1 * Math.cos(a), 0.17, 1.1 * Math.sin(a)); c1.rotation.y = -a - Math.PI / 2;
    const p = box(0.18, 0.016, 0.12, M(0x1f5fbf, 0.1, 0.5), 0, 0.08, 0); c1.add(p); lc.add(c1); }
  add('loadcell', lc, [0, 1.0, 0], [0, 0.2, 1.1]);
  const en = new THREE.Group(); en.add(cyl(1.65, 1.65, 0.3, M(0x23262b, 0.5, 0.45, { side: THREE.DoubleSide }), 0, 0.15, 0, true), cyl(1.65, 1.65, 0.03, dark(), 0, 0.015, 0), box(0.9, 0.22, 0.5, M(0x1b1d21, 0.4, 0.5), 0, 0.14, 1.7));
  en.add(box(0.18, 0.06, 0.04, M(0x050505), 0.28, 0.12, 1.96));
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.09), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(512, 92, null, (g) => { g.fillStyle = '#e8e8e8'; g.font = '700 64px Arial'; g.fillText('GASSENSE', 256, 48); }) }));
  logo.position.set(-0.12, 0.1, 1.961); en.add(logo);
  add('enclosure', en, [0, -0.9, 0], [0, 0.15, 1.65]);
  const led = new THREE.Group(); const ledMat = new THREE.MeshStandardMaterial({ color: 0x2fbf71, emissive: 0x2fbf71, emissiveIntensity: 1.2 });
  const wifiDot = new THREE.MeshStandardMaterial({ color: 0x3aa0ff, emissive: 0x3aa0ff, emissiveIntensity: 1 });
  led.add(box(0.3, 0.035, 0.03, ledMat, 0, 0.2, 1.97), cyl(0.03, 0.03, 0.03, wifiDot, -0.3, 0.2, 1.97)); led.children[1].rotation.x = Math.PI / 2; led.traverse((o) => { o.userData.keep = true; });
  add('led', led, [0, -0.9, 0.4], [0, 0.2, 1.97]);
  const pcb = (w, d, col, x, z, id, off, parts) => { const g = new THREE.Group(); g.position.set(x, 0.05, z); g.add(box(w, 0.03, d, M(col, 0.2, 0.5)));
    parts(g); add(id, g, off, [0, 0.12, 0]); };
  pcb(0.95, 0.5, 0x143b6e, -0.75, 0.2, 'esp32', [-1.9, 0.9, 1.4], (g) => { g.add(box(0.42, 0.05, 0.3, steel(), -0.12, 0.04, 0), box(0.1, 0.04, 0.1, M(0x111111), 0.2, 0.03, 0.1));
    for (let k = 0; k < 4; k++) g.add(box(0.2, 0.012, 0.025, M(0xd4a017, 0.9, 0.3), 0.36, 0.02, -0.15 + k * 0.1));
    g.add(box(0.85, 0.06, 0.04, M(0x0d0d0d), 0, 0.045, 0.21), box(0.85, 0.06, 0.04, M(0x0d0d0d), 0, 0.045, -0.21), box(0.12, 0.05, 0.12, steel(), -0.5, 0.04, 0)); });
  pcb(0.6, 0.38, 0xa5202b, 0.65, -0.15, 'hx711', [1.9, 0.9, 1.0], (g) => { g.add(box(0.14, 0.04, 0.1, M(0x111111), 0, 0.035, 0), box(0.15, 0.08, 0.1, M(0x1f5fbf), -0.22, 0.05, 0), box(0.4, 0.06, 0.04, M(0x0d0d0d), 0.05, 0.045, 0.15)); });
  pcb(0.55, 0.35, 0x1e7a46, 0.1, -1.05, 'power', [0.2, 0.8, -2.2], (g) => { g.add(cyl(0.08, 0.08, 0.08, M(0xc9a227, 0.8, 0.4), -0.1, 0.055, 0), cyl(0.06, 0.06, 0.12, M(0x111111), 0.1, 0.075, 0.05), box(0.14, 0.09, 0.14, steel(), 0.22, 0.06, -0.08)); });
  const wf = new THREE.Group(); wf.position.set(-1.2, 0.05, -0.2); wf.add(cyl(0.04, 0.04, 0.1, dark(), 0, 0.05, 0), cyl(0.025, 0.025, 0.55, M(0x111111), 0, 0.37, 0));
  for (let k = 1; k <= 3; k++) wf.add(tor(0.12 * k, 0.012, M(0x2bd4e8, 0.2, 0.4, { emissive: 0x0a6a78 }), 0, 0.5, 0, false, Math.PI * 0.8));
  wf.children.slice(2).forEach((o) => { o.rotation.z = Math.PI * 0.1; o.rotation.y = Math.PI / 2 + Math.PI * 0.1; }); add('wifi', wf, [-2.0, 1.7, -0.2], [0, 0.6, 0]);

  // ---- wiring (cylinders between component anchors)
  const wires = [['loadcell', 'hx711', 0xf2d03b], ['hx711', 'esp32', 0xf28c28], ['power', 'esp32', 0xe5383b], ['esp32', 'wifi', 0x2bd4e8], ['esp32', 'led', 0x2fbf71]].map(([a, b, col]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), M(col, 0.2, 0.5)); scene.add(m); return { a, b, m }; });
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const wp = (id, out) => C[id].g.localToWorld(out.copy(C[id].anchor));
  function updateWires() { wires.forEach((w) => { wp(w.a, _a); wp(w.b, _b); const d = _b.clone().sub(_a), L = d.length() || 0.001;
    w.m.position.copy(_a).addScaledVector(d, 0.5); w.m.quaternion.setFromUnitVectors(Y, d.normalize()); w.m.scale.set(1, L, 1); }); }

  // ---- visual gas level indicator (explanatory only)
  const bar = new THREE.Group(); bar.position.set(2.9, 0.4, 0);
  bar.add(box(0.36, 3.6, 0.36, M(0xffffff, 0, 0.1, { transparent: true, opacity: 0.12 }), 0, 1.8, 0));
  const fill = box(0.28, 3.4, 0.28, new THREE.MeshStandardMaterial({ color: 0x2fbf71, emissive: 0x2fbf71, emissiveIntensity: 0.35 }), 0, 0, 0); fill.geometry.translate(0, 1.7, 0); fill.position.y = 0.1; bar.add(fill); scene.add(bar);
  let lvTarget = 1, lv = 1;

  // ---- labels
  const labs = {}; Object.keys(LABELS).forEach((id) => { const d = document.createElement('div'); d.className = 'tag'; d.textContent = LABELS[id]; labelHost.appendChild(d); labs[id] = d; });
  const dd = document.createElement('div'); dd.className = 'tag'; dd.textContent = 'Monitoring Dashboard: displays the estimated LPG level'; labelHost.appendChild(dd); labs.dash = dd;
  const dashPt = new THREE.Vector3(-3.4, 2.6, 1.5), _p = new THREE.Vector3();
  function updateLabels() { const r = host.getBoundingClientRect(); Object.keys(labs).forEach((id) => { const el = labs[id], on = e > 0.8;
    el.style.opacity = on ? 1 : 0; if (!on) return; if (id === 'dash') _p.copy(dashPt); else wp(id, _p); _p.project(cam);
    el.style.transform = `translate(${(_p.x * 0.5 + 0.5) * r.width + 14}px,${(-_p.y * 0.5 + 0.5) * r.height - 10}px)`; }); }

  // ---- state / animation
  let e = 0, et = 0, speed = 0.9, tw = null, dirty = true, last = performance.now(), raf, sel = null, hidden = false;
  function applyExplode() { Object.keys(C).forEach((id) => { const c = C[id], t = smooth(Math.max(0, Math.min(1, (e - DELAY[id]) / (1 - DELAY[id]))));
    c.g.position.copy(c.base).addScaledVector(c.off, t); }); bar.visible = e < 0.15 && !hidden; }
  function go(name, dur = 800) { const v = VIEWS[name]; if (!v) return; tw = { t0: performance.now(), dur, p: cam.position.clone(), q: controls.target.clone(), p2: new THREE.Vector3(...v[0]), q2: new THREE.Vector3(...v[1]) }; }
  function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; let act = false;
    if (Math.abs(e - et) > 1e-4) { e += Math.sign(et - e) * Math.min(Math.abs(et - e), speed * dt); applyExplode(); act = true; }
    if (Math.abs(lv - lvTarget) > 1e-3) { lv += (lvTarget - lv) * Math.min(1, dt * 6); fill.scale.y = Math.max(0.001, lv); act = true; }
    if (tw) { const a = Math.min(1, (now - tw.t0) / tw.dur), s = smooth(a); cam.position.lerpVectors(tw.p, tw.p2, s); controls.target.lerpVectors(tw.q, tw.q2, s); if (a >= 1) tw = null; act = true; }
    if (controls.update()) dirty = true;
    if (act || dirty || controls.autoRotate) { updateWires(); updateLabels(); renderer.render(scene, cam); dirty = false; } }
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => { tw = null; });
  const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); dirty = true; };
  const ro = new ResizeObserver(resize); ro.observe(host);
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  const pd = (ev) => { down = [ev.clientX, ev.clientY]; };
  const pu = (ev) => { if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return; const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObjects(Object.values(C).filter((c) => c.g.visible).map((c) => c.g), true)[0]; cb.onSelect && cb.onSelect(hit ? hit.object.userData.comp : null); };
  renderer.domElement.addEventListener('pointerdown', pd); renderer.domElement.addEventListener('pointerup', pu);
  cam.position.set(...VIEWS.iso[0]); controls.target.set(...VIEWS.iso[1]); resize(); applyExplode(); raf = requestAnimationFrame(frame);

  return {
    setLevel(pct, status) { lvTarget = Math.max(0.001, pct / 100); const col = STATUS_COL[status] || 0x2fbf71; [fill.material, ledMat].forEach((m) => { m.color.setHex(col); m.emissive.setHex(col); }); dirty = true; },
    setMode(m) { hidden = m === 'internal'; C.cylinder.g.visible = C.plate.g.visible = !hidden;
      if (m === 'exploded') { et = 1; speed = 0.55; go('exploded'); } else if (m === 'assembly') { e = Math.max(e, 1); et = 0; speed = 0.35; go('exploded', 1200); }
      else if (m === 'internal') { et = 0; speed = 0.9; go('internal'); } else { et = 0; speed = 0.9; go('iso'); } applyExplode(); dirty = true; },
    setExplode(v) { hidden = false; C.cylinder.g.visible = C.plate.g.visible = true; e = et = v; applyExplode(); dirty = true; },
    setView: (n) => go(n), setRotate(on) { controls.autoRotate = on; dirty = true; },
    select(id) { Object.values(C).forEach((c) => c.g.traverse((o) => { if (o.isMesh && !o.userData.keep && o.material.emissive) o.material.emissive.setHex(0x000000); }));
      if (id && C[id]) C[id].g.traverse((o) => { if (o.isMesh && !o.userData.keep && o.material.emissive) o.material.emissive.setHex(0x8a2a12); }); sel = id; dirty = true; },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.domElement.removeEventListener('pointerdown', pd); renderer.domElement.removeEventListener('pointerup', pu);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map && m.map.dispose(); m.dispose(); }); } });
      renderer.dispose(); renderer.domElement.remove(); labelHost.innerHTML = ''; },
  };
}
