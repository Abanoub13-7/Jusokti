/* ==========================================================
   چسوكتي — Cinematic Romantic Experience
   Three.js + GSAP orchestrated single-page experience
   ========================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --------------------------- Utilities ---------------------------
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const PARTICLE_COUNT = isMobile ? 4500 : 9000;
const DPR_CAP = isMobile ? 1.5 : 2;

const $ = (s) => document.querySelector(s);
const loader = $('#loader');
const startBtn = $('#start-btn');
const sceneText = $('#scene-text');
const nameReveal = $('#name-reveal');
const quoteEl = $('#quote');
const ctaWrap = $('#cta-wrap');
const finalLine = $('#final-line');
const modal = $('#modal');
const musicToggle = $('#music-toggle');
const bgMusic = $('#bg-music');

// --------------------------- Three.js core ---------------------------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060f, 0.012);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 2000
);
camera.position.set(0, 0, 60);

// Lights for the heart
const ambient = new THREE.AmbientLight(0xffe5b8, 0.4);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight(0xfff0c2, 1.4);
keyLight.position.set(20, 30, 30);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0xe8b4a0, 2.0, 200);
rimLight.position.set(-30, -10, -20);
scene.add(rimLight);
const fillLight = new THREE.PointLight(0xffb6c1, 1.2, 200);
fillLight.position.set(30, -20, 10);
scene.add(fillLight);

// --------------------------- Post-processing ---------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  isMobile ? 0.9 : 1.25,   // strength
  0.85,                    // radius
  0.05                     // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// --------------------------- Background starfield (static) ---------------------------
const starGeo = new THREE.BufferGeometry();
const starCount = isMobile ? 1200 : 2500;
const starPos = new Float32Array(starCount * 3);
const starCol = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 250 + Math.random() * 400;
  const t = Math.random() * Math.PI * 2;
  const p = Math.acos(2 * Math.random() - 1);
  starPos[i * 3]     = r * Math.sin(p) * Math.cos(t);
  starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
  starPos[i * 3 + 2] = r * Math.cos(p);
  const tint = 0.6 + Math.random() * 0.4;
  starCol[i * 3]     = tint;
  starCol[i * 3 + 1] = tint * (0.85 + Math.random() * 0.15);
  starCol[i * 3 + 2] = tint * (0.7  + Math.random() * 0.2);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
const starMat = new THREE.PointsMaterial({
  size: 1.1,
  vertexColors: true,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// --------------------------- Nebula clouds (sprite-like points) ---------------------------
const nebulaGeo = new THREE.BufferGeometry();
const nebulaCount = isMobile ? 60 : 120;
const nebulaPos = new Float32Array(nebulaCount * 3);
const nebulaCol = new Float32Array(nebulaCount * 3);
const palette = [
  new THREE.Color(0xff8da1),
  new THREE.Color(0xd4af37),
  new THREE.Color(0xe8b4a0),
  new THREE.Color(0x6a4fb6),
];
for (let i = 0; i < nebulaCount; i++) {
  const r = 80 + Math.random() * 180;
  const t = Math.random() * Math.PI * 2;
  const p = (Math.random() - 0.5) * 0.8;
  nebulaPos[i * 3]     = r * Math.cos(t);
  nebulaPos[i * 3 + 1] = r * Math.sin(t) * 0.5 + p * 60;
  nebulaPos[i * 3 + 2] = r * Math.sin(t);
  const c = palette[(Math.random() * palette.length) | 0];
  nebulaCol[i * 3]     = c.r;
  nebulaCol[i * 3 + 1] = c.g;
  nebulaCol[i * 3 + 2] = c.b;
}
nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
nebulaGeo.setAttribute('color',    new THREE.BufferAttribute(nebulaCol, 3));
const nebulaMat = new THREE.PointsMaterial({
  size: 38,
  map: makeSoftDiskTexture(),
  vertexColors: true,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const nebula = new THREE.Points(nebulaGeo, nebulaMat);
scene.add(nebula);

function makeSoftDiskTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --------------------------- Hero particle system (morphs across scenes) ---------------------------
const particleGeo = new THREE.BufferGeometry();
const positions  = new Float32Array(PARTICLE_COUNT * 3);
const targets    = new Float32Array(PARTICLE_COUNT * 3);   // current target
const origins    = new Float32Array(PARTICLE_COUNT * 3);   // morph start
const colorsArr  = new Float32Array(PARTICLE_COUNT * 3);
const sizes      = new Float32Array(PARTICLE_COUNT);
const seeds      = new Float32Array(PARTICLE_COUNT);

// Start: all at center (single star)
for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i*3] = positions[i*3+1] = positions[i*3+2] = 0;
  targets[i*3]   = targets[i*3+1]   = targets[i*3+2]   = 0;
  origins[i*3]   = origins[i*3+1]   = origins[i*3+2]   = 0;
  colorsArr[i*3]   = 1.0;
  colorsArr[i*3+1] = 0.86;
  colorsArr[i*3+2] = 0.55;
  sizes[i] = 1.2 + Math.random() * 1.8;
  seeds[i] = Math.random();
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('color',    new THREE.BufferAttribute(colorsArr, 3));
particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

const particleMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:    { value: 0 },
    uPixel:   { value: renderer.getPixelRatio() },
    uOpacity: { value: 1.0 },
    uMap:     { value: makeSoftDiskTexture() },
  },
  vertexShader: /* glsl */`
    attribute float size;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uPixel;
    void main() {
      vColor = color;
      vec3 p = position;
      // tiny per-particle jitter for life
      float n = sin(uTime * 1.7 + position.x * 0.05 + position.y * 0.03);
      p += normalize(vec3(0.5, 0.7, 0.3)) * n * 0.15;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = size * uPixel * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    uniform sampler2D uMap;
    uniform float uOpacity;
    void main() {
      vec4 t = texture2D(uMap, gl_PointCoord);
      if (t.a < 0.02) discard;
      gl_FragColor = vec4(vColor, t.a * uOpacity);
    }
  `,
  vertexColors: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// Morph helper — animate positions toward targets using GSAP on a proxy
const morphProxy = { t: 0 };
function setTargets(buildFn, opts = {}) {
  // capture current positions as origins
  origins.set(positions);
  buildFn(targets);
  morphProxy.t = 0;
  return gsap.to(morphProxy, {
    t: 1,
    duration: opts.duration ?? 2.2,
    ease: opts.ease ?? 'power3.inOut',
    onUpdate: () => {
      const k = morphProxy.t;
      // smoothstep
      const s = k * k * (3 - 2 * k);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        positions[i] = origins[i] + (targets[i] - origins[i]) * s;
      }
      particleGeo.attributes.position.needsUpdate = true;
    }
  });
}
function setColor(rgb, duration = 1.2) {
  const target = { r: rgb[0], g: rgb[1], b: rgb[2] };
  const proxy = { k: 0 };
  // capture starting colors
  const start = colorsArr.slice();
  return gsap.to(proxy, {
    k: 1,
    duration,
    ease: 'sine.inOut',
    onUpdate: () => {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        colorsArr[i*3]   = start[i*3]   + (target.r - start[i*3])   * proxy.k;
        colorsArr[i*3+1] = start[i*3+1] + (target.g - start[i*3+1]) * proxy.k;
        colorsArr[i*3+2] = start[i*3+2] + (target.b - start[i*3+2]) * proxy.k;
      }
      particleGeo.attributes.color.needsUpdate = true;
    }
  });
}

// ----------- Target builders -----------
function buildSinglePoint(arr) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i*3] = arr[i*3+1] = arr[i*3+2] = 0;
  }
}
function buildSphereBurst(arr, radius = 38) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.6 + Math.random() * 0.6);
    arr[i*3]     = r * Math.sin(p) * Math.cos(t);
    arr[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
    arr[i*3 + 2] = r * Math.cos(p);
  }
}
function buildGalaxy(arr) {
  const arms = 4;
  const armSpread = 0.45;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.pow(Math.random(), 0.6) * 55 + 4;
    const arm = (i % arms) * (Math.PI * 2 / arms);
    const swirl = r * 0.13;
    const t = arm + swirl + (Math.random() - 0.5) * armSpread;
    const y = (Math.random() - 0.5) * (3 + r * 0.06);
    arr[i*3]     = Math.cos(t) * r;
    arr[i*3 + 1] = y;
    arr[i*3 + 2] = Math.sin(t) * r;
  }
}
function buildHeart3D(arr, scale = 1.0) {
  // parametric heart with thickness
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = (Math.random() - 0.5) * Math.PI;
    // classic 2D heart curve, extruded
    const x =  16 * Math.pow(Math.sin(u), 3);
    const y =  13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u);
    const depth = Math.cos(v) * (3.5 + Math.random() * 1.8);
    arr[i*3]     = x * 0.9 * scale + (Math.random() - 0.5) * 0.6;
    arr[i*3 + 1] = y * 0.9 * scale + (Math.random() - 0.5) * 0.6;
    arr[i*3 + 2] = depth * scale;
  }
}
function buildManySmallHearts(arr) {
  // distribute particles into ~60 small floating hearts
  const cluster = 60;
  const perCluster = Math.ceil(PARTICLE_COUNT / cluster);
  let idx = 0;
  for (let c = 0; c < cluster; c++) {
    const cx = (Math.random() - 0.5) * 110;
    const cy = (Math.random() - 0.5) * 60;
    const cz = (Math.random() - 0.5) * 60;
    const s  = 0.18 + Math.random() * 0.18;
    for (let k = 0; k < perCluster && idx < PARTICLE_COUNT; k++, idx++) {
      const u = Math.random() * Math.PI * 2;
      const x =  16 * Math.pow(Math.sin(u), 3);
      const y =  13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u);
      arr[idx*3]     = cx + x * s;
      arr[idx*3 + 1] = cy + y * s;
      arr[idx*3 + 2] = cz + (Math.random() - 0.5) * 0.8;
    }
  }
}

// Build target positions from text drawn on a hidden canvas
function buildFromText(arr, text, opts = {}) {
  const fontSize = opts.fontSize ?? 200;
  const font = opts.font ?? `bold ${fontSize}px "Aref Ruqaa", "Amiri", serif`;
  const c = document.createElement('canvas');
  const measure = c.getContext('2d');
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width) + 40;
  const h = Math.ceil(fontSize * 1.6);
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.font = font;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.direction = 'rtl';
  g.fillText(text, w / 2, h / 2);
  const img = g.getImageData(0, 0, w, h).data;

  // collect filled pixels (sparse sample for performance)
  const points = [];
  const step = Math.max(1, Math.floor(Math.sqrt(w * h / (PARTICLE_COUNT * 1.2))));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const a = img[(y * w + x) * 4]; // r channel (white text on black)
      if (a > 128) {
        points.push([x, y]);
      }
    }
  }
  // map pixels to world coords, centered, with depth jitter
  const targetScale = opts.scale ?? 0.18;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pt = points[i % points.length];
    if (!pt) {
      arr[i*3] = arr[i*3+1] = arr[i*3+2] = 0;
      continue;
    }
    const px = (pt[0] - w / 2) * targetScale;
    const py = -(pt[1] - h / 2) * targetScale;
    arr[i*3]     = px + (Math.random() - 0.5) * 0.3;
    arr[i*3 + 1] = py + (Math.random() - 0.5) * 0.3;
    arr[i*3 + 2] = (Math.random() - 0.5) * 1.6;
  }
}

// --------------------------- Crystal heart (3D mesh) ---------------------------
function makeHeartGeometry() {
  // Build a 3D heart by extruding the 2D heart curve along Z, with rounded thickness via Shape
  const shape = new THREE.Shape();
  const pts = 200;
  for (let i = 0; i <= pts; i++) {
    const u = (i / pts) * Math.PI * 2;
    const x =  16 * Math.pow(Math.sin(u), 3);
    const y = -(13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u));
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 6,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: 2.4,
    bevelThickness: 2.4,
    curveSegments: 64,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

const heartGeo = makeHeartGeometry();
const crystalMat = new THREE.MeshPhysicalMaterial({
  color: 0xffe5c2,
  metalness: 0.1,
  roughness: 0.08,
  transmission: 0.95,
  thickness: 4.5,
  ior: 1.55,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  attenuationColor: new THREE.Color(0xffb6c1),
  attenuationDistance: 6,
  emissive: new THREE.Color(0xd4af37),
  emissiveIntensity: 0.18,
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide,
});

// Two halves via clipping planes
const planeRight = new THREE.Plane(new THREE.Vector3( 1, 0, 0), 0);
const planeLeft  = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
renderer.localClippingEnabled = true;

const heartGroup = new THREE.Group();
const matLeft  = crystalMat.clone();
const matRight = crystalMat.clone();
matLeft.clippingPlanes  = [planeRight];
matRight.clippingPlanes = [planeLeft];
const heartLeft  = new THREE.Mesh(heartGeo, matLeft);
const heartRight = new THREE.Mesh(heartGeo, matRight);
heartGroup.add(heartLeft, heartRight);
heartGroup.scale.setScalar(0.001);
heartGroup.visible = false;
scene.add(heartGroup);

// Inner golden glow sphere (revealed when heart splits)
const coreGeo = new THREE.SphereGeometry(2.4, 32, 32);
const coreMat = new THREE.MeshBasicMaterial({
  color: 0xffe5a0,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
});
const heartCore = new THREE.Mesh(coreGeo, coreMat);
heartGroup.add(heartCore);

// --------------------------- Resize / loop ---------------------------
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  particleMat.uniforms.uPixel.value = renderer.getPixelRatio();
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();
let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) clock.getDelta();
});

function tick() {
  requestAnimationFrame(tick);
  if (!running) return;
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();
  particleMat.uniforms.uTime.value = t;

  // Slow rotation of star field for cosmic motion
  stars.rotation.y += dt * 0.01;
  nebula.rotation.y += dt * 0.015;

  // Subtle camera breathing
  camera.position.x += (Math.sin(t * 0.15) * 0.5 - camera.position.x * 0.0) * 0.0;
  // (kept minimal; GSAP drives major camera moves)

  // Floating heart
  if (heartGroup.visible) {
    heartGroup.position.y = Math.sin(t * 1.2) * 0.6;
    heartGroup.rotation.y += dt * 0.25;
  }

  composer.render();
}
tick();

// --------------------------- Music ---------------------------
let musicOn = false;
musicToggle.addEventListener('click', async () => {
  try {
    if (musicOn) {
      bgMusic.pause();
      musicOn = false;
    } else {
      await bgMusic.play();
      musicOn = true;
    }
  } catch (e) {
    // file missing or blocked — silently keep off
    musicOn = false;
  }
  musicToggle.setAttribute('aria-pressed', String(musicOn));
});

// --------------------------- Modal ---------------------------
function openModal() {
  modal.hidden = false;
  document.addEventListener('keydown', onEsc);
  modal.querySelector('.modal-close').focus();
}
function closeModal() {
  modal.hidden = true;
  document.removeEventListener('keydown', onEsc);
  // After modal closes the first time, trigger final scene
  if (!finalTriggered) {
    finalTriggered = true;
    playFinalScene();
  }
}
function onEsc(e) { if (e.key === 'Escape') closeModal(); }
modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
$('#open-letter').addEventListener('click', openModal);

// --------------------------- Overlays helpers ---------------------------
function showOverlay(el, opts = {}) {
  el.setAttribute('aria-hidden', 'false');
  return gsap.fromTo(el,
    { opacity: 0, y: 24, filter: 'blur(8px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)',
      duration: opts.duration ?? 1.6, ease: 'power3.out' }
  );
}
function hideOverlay(el, opts = {}) {
  return gsap.to(el, {
    opacity: 0, y: -16, filter: 'blur(8px)',
    duration: opts.duration ?? 1.2, ease: 'power2.in',
    onComplete: () => el.setAttribute('aria-hidden', 'true'),
  });
}

// --------------------------- Main cinematic timeline ---------------------------
let finalTriggered = false;

function startExperience() {
  startBtn.classList.remove('visible');
  setTimeout(() => startBtn.remove(), 600);

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

  // Scene 1 — opening pulse already implied; now ignite explosion
  tl.add(() => setColor([1.0, 0.86, 0.55], 0.4), 0);

  // Scene 2 — Cosmic Explosion + galaxy
  tl.add(() => {
    setTargets(buildSphereBurst, { duration: 2.4, ease: 'expo.out' });
  }, 0.2);
  tl.to(starMat,   { opacity: 0.9, duration: 2.5 }, 0.4);
  tl.to(nebulaMat, { opacity: 0.55, duration: 3.0 }, 0.6);
  tl.to(camera.position, { z: 95, duration: 3.5, ease: 'power2.inOut' }, 0.2);

  tl.add(() => setTargets(buildGalaxy, { duration: 3.0 }), 2.6);
  tl.to(camera.position, { z: 70, x: 8, y: 4, duration: 4.0, ease: 'sine.inOut' }, 2.8);
  tl.to(camera.rotation, { z: 0.05, duration: 4.0, ease: 'sine.inOut' }, 2.8);

  // Scene 3 — Text formation: إلى أجمل فتاة في عالمي
  tl.add(() => setTargets(
    (a) => buildFromText(a, 'إلى أجمل فتاة في عالمي', { fontSize: 180, scale: 0.16 }),
    { duration: 2.6, ease: 'power3.inOut' }
  ), 6.2);
  tl.to(camera.position, { x: 0, y: 0, z: 55, duration: 2.6, ease: 'power2.inOut' }, 6.2);
  tl.to(camera.rotation, { z: 0, duration: 2.6 }, 6.2);
  tl.add(() => showOverlay(sceneText, { duration: 1.6 }), 7.8);
  tl.add(() => hideOverlay(sceneText, { duration: 1.4 }), 11.4);

  // Scene 4 — Crystal Heart
  tl.add(() => setColor([1.0, 0.78, 0.6], 1.2), 12.0);
  tl.add(() => setTargets(
    (a) => buildHeart3D(a, 1.0),
    { duration: 2.4, ease: 'power3.inOut' }
  ), 12.0);
  tl.to(particleMat.uniforms.uOpacity, { value: 0.35, duration: 1.8 }, 14.6);
  tl.add(() => {
    heartGroup.visible = true;
  }, 14.0);
  tl.fromTo(heartGroup.scale,
    { x: 0.001, y: 0.001, z: 0.001 },
    { x: 1.2, y: 1.2, z: 1.2, duration: 1.8, ease: 'back.out(1.6)' }, 14.4);

  // Heartbeat pulse
  const beat = gsap.timeline({ repeat: 3, defaults: { ease: 'sine.inOut' } });
  beat.to(heartGroup.scale, { x: 1.32, y: 1.32, z: 1.32, duration: 0.18 })
      .to(heartGroup.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 0.22 })
      .to(heartGroup.scale, { x: 1.28, y: 1.28, z: 1.28, duration: 0.15 })
      .to(heartGroup.scale, { x: 1.2,  y: 1.2,  z: 1.2,  duration: 0.5  });
  tl.add(beat, 16.5);

  // Scene 5 — Reveal (split + golden burst)
  tl.add(() => setColor([1.0, 0.92, 0.62], 0.6), 20.5);
  tl.to(heartLeft.position,  { x: -14, duration: 2.0, ease: 'power3.inOut' }, 20.8);
  tl.to(heartRight.position, { x:  14, duration: 2.0, ease: 'power3.inOut' }, 20.8);
  tl.to(heartLeft.rotation,  { z:  0.35, duration: 2.0, ease: 'power2.inOut' }, 20.8);
  tl.to(heartRight.rotation, { z: -0.35, duration: 2.0, ease: 'power2.inOut' }, 20.8);
  tl.to(coreMat, { opacity: 1.0, duration: 1.4 }, 21.0);
  tl.to(heartCore.scale, { x: 6, y: 6, z: 6, duration: 1.6, ease: 'expo.out' }, 21.2);
  tl.to(bloom, { strength: isMobile ? 1.8 : 2.4, duration: 1.2 }, 21.2);

  // Particles burst outward and reform around camera
  tl.add(() => setTargets(buildSphereBurst, { duration: 1.4, ease: 'expo.out' }), 22.0);
  tl.to(particleMat.uniforms.uOpacity, { value: 1.0, duration: 1.0 }, 22.0);
  tl.to(coreMat, { opacity: 0, duration: 1.2 }, 23.0);
  tl.to(heartLeft.material,  { opacity: 0, duration: 1.0 }, 23.0);
  tl.to(heartRight.material, { opacity: 0, duration: 1.0 }, 23.0);
  tl.add(() => { heartGroup.visible = false; }, 24.2);
  tl.to(bloom, { strength: isMobile ? 1.0 : 1.4, duration: 1.5 }, 23.5);

  // Scene 6 — Name reveal "چسوكتي"
  tl.add(() => setTargets(
    (a) => buildFromText(a, 'چسوكتي', { fontSize: 320, scale: 0.22 }),
    { duration: 2.0, ease: 'power3.inOut' }
  ), 24.2);
  tl.to(particleMat.uniforms.uOpacity, { value: 0.45, duration: 1.6 }, 25.6);
  tl.add(() => showOverlay(nameReveal, { duration: 1.8 }), 25.4);

  // Scene 7 — Romantic Quote
  tl.add(() => showOverlay(quoteEl, { duration: 1.6 }), 29.5);
  tl.fromTo(quoteEl,
    { y: 220 }, { y: 200, duration: 1.6, ease: 'power3.out' }, 29.5);
  // shift name a bit upward to make space
  tl.to(nameReveal, { y: -120, duration: 1.4, ease: 'power3.out' }, 29.5);

  // Scene 8 — CTA button
  tl.add(() => showOverlay(ctaWrap, { duration: 1.2 }), 32.5);
  tl.fromTo(ctaWrap, { y: 0 }, { y: 320, duration: 1.2, ease: 'power3.out' }, 32.5);
}

function playFinalScene() {
  // Hide previous overlays
  hideOverlay(nameReveal);
  hideOverlay(quoteEl);
  hideOverlay(ctaWrap);

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

  // Many small hearts
  tl.add(() => setColor([1.0, 0.5, 0.55], 1.2), 0);
  tl.add(() => setTargets(buildManySmallHearts, { duration: 2.6 }), 0);
  tl.to(particleMat.uniforms.uOpacity, { value: 1.0, duration: 1.2 }, 0);

  // Then morph into final text
  tl.add(() => setColor([1.0, 0.78, 0.45], 1.2), 3.5);
  tl.add(() => setTargets(
    (a) => buildFromText(a, 'أحبكِ يا چسوكتي ❤', { fontSize: 200, scale: 0.16 }),
    { duration: 2.8, ease: 'power3.inOut' }
  ), 3.5);
  tl.to(particleMat.uniforms.uOpacity, { value: 0.7, duration: 1.4 }, 5.5);
  tl.add(() => showOverlay(finalLine, { duration: 1.8 }), 6.0);
}

// --------------------------- Bootstrap ---------------------------
// Show opening pulse for 2s, then reveal start button
window.addEventListener('load', () => {
  // tiny delay so fonts paint
  setTimeout(() => {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 800);
    startBtn.classList.add('visible');
  }, 2200);
});

startBtn.addEventListener('click', startExperience);

// Keyboard: Enter on body starts when start button visible
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && startBtn.classList.contains('visible')) {
    startExperience();
  }
});

onResize();
