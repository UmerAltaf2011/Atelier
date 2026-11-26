import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CHAR_BY_ID } from '../lib/characters.js';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';

// A procedural 3D mannequin that re-dresses itself for each style archetype.
// Drag (or swipe) to spin it. It idles with a gentle bob and slow turn. No model files to download.

const SKIN = '#e9c9b4';
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, ...o });
const skinMat = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color('#ffb7a0'), sheenRoughness: 0.5, clearcoat: 0.08 });
const cloth = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.8, sheen: 0.6, sheenColor: new THREE.Color(c).offsetHSL(0, 0, 0.15), ...o });
// smooth torso/leg profiles via lathe (much closer to a real body than stacked cylinders)
const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

function face(g, skin, hairColor, dark = '#2a1a1a', eyeColor = '#3b2a22') {
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
  [-1, 1].forEach(s => {
    add(new THREE.SphereGeometry(0.016, 16, 12), white, s * 0.042, 1.655, 0.105, 1.2, 0.8, 0.6);
    add(new THREE.SphereGeometry(0.0095, 16, 12), new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2 }), s * 0.042, 1.655, 0.114);
    add(new THREE.BoxGeometry(0.036, 0.006, 0.01), new THREE.MeshStandardMaterial({ color: hairColor }), s * 0.042, 1.685, 0.108).rotation.z = s * -0.12; // brows
  });
  add(new THREE.SphereGeometry(0.014, 12, 10), skin, 0, 1.628, 0.118, 0.9, 1.1, 1.1);           // nose
  add(new THREE.BoxGeometry(0.04, 0.006, 0.01), new THREE.MeshStandardMaterial({ color: '#b5655f', roughness: 0.5 }), 0, 1.598, 0.112);  // lips
  [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.02, 12, 10), skin, s * 0.112, 1.64, 0, 0.5, 1.2, 0.8)); // ears
}

function spikes(g, color, n, r, len, y, tilt = 0.5, thick = 0.032, jitter = 0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, l = len * (0.8 + ((i * 37) % 10) / 25 + jitter);
    const c = new THREE.Mesh(new THREE.ConeGeometry(thick, l, 8), m);
    c.position.set(Math.sin(a) * r, y + Math.cos(i) * 0.01, Math.cos(a) * r - 0.01);
    c.lookAt(c.position.x * 3, y + 1.2 * l * 3 + tilt, c.position.z * 3);
    c.rotateX(Math.PI / 2); c.castShadow = true; g.add(c);
  }
}

function buildAnime(ch) {
  const g = new THREE.Group();
  const add = (geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
  const skin = skinMat(ch.skin), top = cloth(ch.top), bottom = cloth(ch.bottom), accent = cloth(ch.accent, { roughness: 0.6 });
  // head, neck, shoulders, arms, hands
  add(new THREE.SphereGeometry(0.115, 48, 32), skin, 0, 1.64, 0, 1, 1.12, 1.02);
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 20), skin, 0, 1.5, 0);
  face(g, skin, ch.hair);
  add(lathe([[0.001, 0.86], [0.16, 0.9], [0.145, 1.0], [0.135, 1.1], [0.17, 1.28], [0.215, 1.4], [0.1, 1.47], [0.001, 1.47]]), top, 0, 0, 0, 1.12, 1, 0.76); // torso
  add(lathe([[0.001, 0.82], [0.185, 0.82], [0.17, 0.93], [0.001, 0.93]]), bottom, 0, 0, 0, 1.1, 1, 0.8);
  [-1, 1].forEach(s => {
    add(new THREE.SphereGeometry(0.07, 24, 18), top, s * 0.245, 1.42, 0);
    const arm = add(new THREE.CapsuleGeometry(0.05, 0.52, 8, 16), top, s * 0.27, 1.12, 0); arm.rotation.z = s * 0.07;
    add(new THREE.SphereGeometry(0.05, 16, 12), skin, s * 0.292, 0.8, 0);
    const leg = add(new THREE.CapsuleGeometry(0.075, 0.7, 8, 16), bottom, s * 0.095, 0.47, 0); leg.rotation.z = s * -0.01;
    add(new THREE.BoxGeometry(0.115, 0.075, 0.26), mat(ch.shoe, { roughness: 0.45 }), s * 0.095, 0.04, 0.05);
  });
  const hairM = mat(ch.hair, { roughness: 0.5 });
  const cap = (r = 0.125, ph = 0.58) => add(new THREE.SphereGeometry(r, 40, 24, 0, Math.PI * 2, 0, Math.PI * ph), hairM, 0, 1.655, -0.006, 1, 1.12, 1.04);
  switch (ch.id) {
    case 'gojo': // spiky white hair, black blindfold-style glasses, high collar jacket
      cap(); spikes(g, ch.hair, 14, 0.07, 0.15, 1.8, 0.8, 0.03);
      add(new THREE.BoxGeometry(0.19, 0.04, 0.03), mat('#0a0a0e', { roughness: 0.2, metalness: 0.4 }), 0, 1.66, 0.112);
      add(new THREE.CylinderGeometry(0.075, 0.085, 0.09, 24), top, 0, 1.46, 0); // standing collar
      add(new THREE.BoxGeometry(0.012, 0.58, 0.02), accent, 0, 1.15, 0.155);
      break;
    case 'naruto': // spiky blond hair, forehead protector, whisker marks
      cap(); spikes(g, ch.hair, 16, 0.08, 0.17, 1.78, 0.5, 0.034);
      add(new THREE.BoxGeometry(0.25, 0.034, 0.12), mat('#1f3a8a'), 0, 1.7, 0.035, 1, 1, 1);
      add(new THREE.BoxGeometry(0.07, 0.03, 0.01), mat('#c9ccd3', { metalness: 0.8, roughness: 0.3 }), 0, 1.7, 0.1);
      [-1, 1].forEach(s => [0, 1, 2].forEach(i => add(new THREE.BoxGeometry(0.03, 0.003, 0.004), mat('#6b3a2a'), s * 0.075, 1.625 - i * 0.012, 0.107)));
      add(new THREE.BoxGeometry(0.16, 0.2, 0.02), accent, 0, 1.3, 0.15); // collar block
      break;
    case 'luffy': // straw hat with red band, scar, open vest
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.012, 48), mat('#e8c76a', { roughness: 0.9 }), 0, 1.74, 0);
      add(new THREE.SphereGeometry(0.15, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), mat('#e8c76a', { roughness: 0.9 }), 0, 1.742, 0, 1, 0.85, 1);
      add(new THREE.CylinderGeometry(0.151, 0.151, 0.03, 32), mat('#d62828'), 0, 1.757, 0);
      add(new THREE.BoxGeometry(0.03, 0.004, 0.004), mat('#8a3a3a'), -0.04, 1.62, 0.11).rotation.z = 0.7;
      add(new THREE.BoxGeometry(0.11, 0.5, 0.02), skin, 0, 1.2, 0.15); // bare chest strip
      break;
    case 'tanjiro': { // checkered haori, burgundy hair, scar, earrings
      cap(); spikes(g, ch.hair, 10, 0.1, 0.08, 1.74, 0.3, 0.03);
      add(new THREE.BoxGeometry(0.024, 0.005, 0.004), mat('#8a1f1f'), -0.045, 1.688, 0.114).rotation.z = 0.5;
      const sq = [mat('#1d3b2a'), mat('#111111')];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) { const m = add(new THREE.BoxGeometry(0.056, 0.06, 0.012), sq[(r + c) % 2], -0.2 + c * 0.057, 0.95 + r * 0.075, 0.16 * Math.cos(((c - 3.5) / 8) * 1.4)); m.rotation.y = ((c - 3.5) / 8) * 1.2; }
      [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.014, 0.05, 0.01), mat('#e9e2d0'), s * 0.12, 1.57, 0));
      break;
    }
    case 'goku': // iconic wild spiky black hair, orange gi with blue sash
      cap(); spikes(g, ch.hair, 12, 0.075, 0.2, 1.78, 0.9, 0.04, 0.15);
      add(new THREE.CylinderGeometry(0.195, 0.19, 0.06, 28), accent, 0, 0.96, 0, 1.12, 1, 0.78);
      add(new THREE.BoxGeometry(0.1, 0.34, 0.02), accent, 0, 1.28, 0.145).rotation.z = 0.4;
      break;
    case 'levi': // neat undercut, white cravat, green cape
      cap(0.124, 0.5);
      add(new THREE.TorusGeometry(0.07, 0.025, 12, 24), mat('#ffffff'), 0, 1.46, 0.01).rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.2, 0.7, 0.012), accent, 0, 1.1, -0.17);
      add(new THREE.BoxGeometry(0.005, 0.5, 0.02), mat('#3b2a22'), 0, 1.15, 0.155);
      break;
    default: break;
  }
  return g;
}


function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}

function starShape(outer, inner) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer, a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return s;
}

function buildFigure(arch) {
  const [c1, c2, c3] = arch.swatches;
  const look = arch.look || { top: 'tee', accessory: 'none' };
  const g = new THREE.Group();
  const add = (geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    g.add(mesh);
    return mesh;
  };
  const skin = skinMat(SKIN);
  const top = mat(c1), bottom = mat(c2), accent = mat(c3);
  const long = ['blazer', 'jacket', 'hoodie', 'kurta'].includes(look.top);

  // body
  add(new THREE.SphereGeometry(0.115, 32, 24), skin, 0, 1.64, 0, 1, 1.15, 1);
  add(new THREE.CylinderGeometry(0.04, 0.045, 0.1, 16), skin, 0, 1.5, 0);
  [-1, 1].forEach(s => {
    add(new THREE.SphereGeometry(0.052, 16, 12), skin, s * 0.27, 0.83, 0);          // hands
    add(new THREE.CylinderGeometry(0.052, 0.04, 0.6, 16), skin, s * 0.255, 1.12, 0).rotation.z = s * 0.06; // arms
  });

  // trousers / shalwar
  const wide = look.top === 'kurta' || arch.id === 'streetwear' || arch.id === 'retro-vintage';
  [-1, 1].forEach(s => {
    const leg = add(new THREE.CylinderGeometry(wide ? 0.105 : 0.09, wide ? 0.09 : 0.065, 0.84, 20), bottom, s * 0.09, 0.5, 0);
    leg.rotation.z = s * -0.015;
    add(new THREE.BoxGeometry(0.12, 0.08, 0.27), mat(arch.id === 'old-money' || arch.id === 'business-casual' ? '#2a1d17' : c3, { roughness: 0.5 }), s * 0.09, 0.05, 0.05); // shoes
  });
  add(new THREE.CylinderGeometry(0.17, 0.165, 0.12, 24), bottom, 0, 0.93, 0, 1.12, 1, 0.78); // hips

  // top garment
  const len = look.top === 'kurta' ? 1.0 : long ? 0.64 : 0.56;
  const cy = look.top === 'kurta' ? 1.0 : long ? 1.14 : 1.175;
  const flare = look.top === 'kurta' ? 0.26 : long ? 0.2 : 0.18;
  add(new THREE.CylinderGeometry(0.2, flare, len, 28), top, 0, cy, 0, 1.12, 1, 0.78);
  [-1, 1].forEach(s => {
    add(new THREE.SphereGeometry(0.068, 16, 12), top, s * 0.235, 1.42, 0);          // shoulder
    const slLen = long ? 0.6 : 0.24;
    const sl = add(new THREE.CylinderGeometry(0.062, long ? 0.052 : 0.058, slLen, 16), top, s * 0.255, 1.42 - slLen / 2 + 0.02, 0);
    sl.rotation.z = s * 0.06;
  });

  if (look.top === 'blazer') {
    [-1, 1].forEach(s => { const l = add(new THREE.BoxGeometry(0.05, 0.3, 0.02), accent, s * 0.06, 1.33, 0.155); l.rotation.z = s * 0.35; });
    for (const y of [1.2, 1.08]) add(new THREE.SphereGeometry(0.014, 8, 8), accent, 0, y, 0.165);
  }
  if (look.top === 'hoodie') {
    add(new THREE.TorusGeometry(0.1, 0.035, 12, 24), top, 0, 1.5, -0.02).rotation.x = Math.PI / 2.4;
    add(new THREE.BoxGeometry(0.22, 0.1, 0.02), accent, 0, 1.0, 0.16);
  }
  if (look.top === 'jacket') add(new THREE.BoxGeometry(0.014, 0.6, 0.02), accent, 0, 1.14, 0.165);
  if (look.top === 'kurta') {
    add(new THREE.BoxGeometry(0.03, 0.55, 0.02), accent, 0, 1.2, 0.2);                 // placket
    add(new THREE.TorusGeometry(0.17, 0.014, 8, 40), accent, 0, 0.5, 0, 1.3, 1, 1).rotation.x = Math.PI / 2; // hem trim
  }

  face(g, skin, '#1b1412');

  // hair (skipped under a cap)
  if (look.accessory !== 'cap') {
    add(new THREE.SphereGeometry(0.122, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(arch.id === 'floral' || arch.id === 'y2k' ? '#6b3a2a' : '#1b1412', { roughness: 0.9 }), 0, 1.655, -0.005, 1, 1.15, 1);
  }

  // accessories
  switch (look.accessory) {
    case 'cap':
      add(new THREE.SphereGeometry(0.125, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), accent, 0, 1.67, 0, 1, 1.1, 1);
      add(new THREE.BoxGeometry(0.17, 0.012, 0.13), accent, 0, 1.675, 0.15);
      break;
    case 'star-shades': {
      const geo = new THREE.ExtrudeGeometry(starShape(0.05, 0.024), { depth: 0.012, bevelEnabled: false });
      const chrome = mat(arch.id === 'y2k' ? '#ff9ccf' : '#c9ccd3', { metalness: 0.7, roughness: 0.2 });
      [-1, 1].forEach(s => add(geo, chrome, s * 0.058, 1.655, 0.108));
      add(new THREE.BoxGeometry(0.04, 0.008, 0.01), chrome, 0, 1.66, 0.112);
      break;
    }
    case 'scarf':
      add(new THREE.TorusGeometry(0.075, 0.032, 12, 24), accent, 0, 1.47, 0.01).rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.06, 0.3, 0.02), accent, 0.04, 1.33, 0.12);
      break;
    case 'flowers': {
      const petals = ['#ffd1e1', '#fff1b8', '#ffffff', '#ffb3c8'];
      for (let i = 0; i < 14; i++) {
        const a = (i * 2.4) % (Math.PI * 1.1) - Math.PI * 0.55;       // across the front
        const y = 1.02 + ((i * 37) % 100) / 100 * 0.38;
        const f = new THREE.Group();
        f.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat(petals[i % 4])));
        const mid = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), mat('#f2a900'));
        mid.position.z = 0.022;
        f.add(mid);
        f.position.set(Math.sin(a) * 0.22, y, Math.cos(a) * 0.17);
        f.lookAt(f.position.x * 3, y, f.position.z * 3);
        g.add(f);
      }
      add(new THREE.TorusGeometry(0.062, 0.012, 8, 20), mat('#fff1b8'), 0, 1.74, 0, 1, 1, 1).rotation.x = Math.PI / 2; // flower crown ring
      break;
    }
    default: break;
  }
  return g;
}

export default function Mannequin3D({ archetype, character = 'style', className = '', height = 420, autoSpin = true }) {
  const host = useRef(null);
  const three = useRef(null);
  const reduce = useReducedMotion();
  const rot = useMotionValue(-0.4);
  const dragging = useRef(false);
  const [failed, setFailed] = useState(false);

  // scene setup (once)
  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch { setFailed(true); return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.0, 5.2);
    camera.lookAt(0, 0.92, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // soft studio reflections
    scene.add(new THREE.HemisphereLight('#fff4ec', '#d9c9ff', 0.7));
    const key = new THREE.DirectionalLight('#fff3e8', 2.4);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.4, bottom: -0.2, near: 0.5, far: 12 });
    key.position.set(2.5, 4, 3.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#ff9ccf', 1.2);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 48), mat('#ffffff', { roughness: 0.9 }));
    floor.position.y = -0.015; floor.receiveShadow = true;
    scene.add(floor);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 64), mat('#ff5d8f', { emissive: '#ff5d8f', emissiveIntensity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const state = { pmrem, renderer, scene, camera, pivot, floor, ring, figure: null, pop: 1, raf: 0 };
    three.current = state;

    const resize = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let last = performance.now(), t = 0, idle = 0;
    const tick = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;
      if (dragging.current) idle = 0; else idle += dt;
      if (autoSpin && !reduce && idle > 1.5) rot.set(rot.get() + dt * 0.6);
      pivot.rotation.y = rot.get();
      pivot.position.y = reduce ? 0 : Math.sin(t * 1.6) * 0.012;
      pivot.scale.setScalar(state.pop);
      renderer.render(scene, camera);
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      if (state.figure) { pivot.remove(state.figure); disposeGroup(state.figure); }
      disposeGroup(floor); disposeGroup(ring);
      state.pmrem.dispose(); scene.environment?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
      three.current = null;
    };
  }, [autoSpin, height, reduce, rot]);

  // re-dress when the archetype changes, with a springy pop
  useEffect(() => {
    const s = three.current;
    if (!s || !archetype) return undefined;
    if (s.figure) { s.pivot.remove(s.figure); disposeGroup(s.figure); }
    const ch = CHAR_BY_ID[character];
    const useAnime = ch && character !== 'style';
    s.figure = useAnime ? buildAnime(ch) : buildFigure(archetype);
    s.pivot.add(s.figure);
    const ringColor = useAnime ? ch.ring : archetype.swatches[2];
    s.ring.material.color.set(ringColor);
    s.ring.material.emissive.set(ringColor);
    // optional photoreal rig: put /public/models/<character|archetype>.glb in place and it replaces the procedural figure
    const glbId = useAnime ? character : archetype.id;
    let dead = false;
    fetch(`/models/${glbId}.glb`, { method: 'HEAD' }).then(r => {
      if (!r.ok || dead || /html/.test(r.headers.get('content-type') || '')) return;
      new GLTFLoader().load(`/models/${glbId}.glb`, gltf => {
        if (dead || !three.current) return;
        const box = new THREE.Box3().setFromObject(gltf.scene), k = 1.8 / (box.max.y - box.min.y || 1);
        gltf.scene.scale.setScalar(k); gltf.scene.position.y = -box.min.y * k;
        gltf.scene.traverse(o => { if (o.isMesh) o.castShadow = true; });
        if (s.figure) { s.pivot.remove(s.figure); disposeGroup(s.figure); }
        s.figure = gltf.scene; s.pivot.add(gltf.scene);
      });
    }).catch(() => {});
    if (reduce) { s.pop = 1; return () => { dead = true; }; }
    s.pop = 0.88;
    const c = animate(0.88, 1, { type: 'spring', stiffness: 260, damping: 12, onUpdate: v => { if (three.current) three.current.pop = v; } });
    const spin = animate(rot.get(), rot.get() + Math.PI * 2, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1], onUpdate: v => rot.set(v) });
    return () => { dead = true; c.stop(); spin.stop(); };
  }, [archetype, character, reduce, rot, failed]);

  if (failed) {
    return (
      <div className={`mannequin mannequin-fallback ${className}`} style={{ height }} role="img" aria-label={archetype?.name}>
        <span>{archetype?.emoji || '👗'}</span>
        <small>3D needs WebGL, which this browser has turned off.</small>
      </div>
    );
  }
  return (
    <motion.div
      className={`mannequin ${className}`}
      style={{ height }}
      ref={host}
      onPanStart={() => { dragging.current = true; }}
      onPan={(_, info) => rot.set(rot.get() + info.delta.x * 0.012)}
      onPanEnd={() => { dragging.current = false; }}
      role="img"
      aria-label={`3D mannequin dressed as ${archetype?.name || 'your style'}. Drag to rotate.`}
    />
  );
}
