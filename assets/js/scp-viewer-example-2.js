import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const SCENE_PATH = "/assets/models/scene-208.glb";

// ── Coordinates discovered with debug-coords overlay ─────────────────────────
// All values are in centred scene space (origin = model bounding-box centre).

// Wide diagonal view of the full scene — pulled back to ~2× the Example 1 distance.
const OVERVIEW = {
  position: new THREE.Vector3(17.00, 28.00,  4.00),
  target:   new THREE.Vector3(-3.25,  2.55,  2.05),
};

// Close elevated view of the changing room shown in showcase_2a.
const ROOM = {
  position: new THREE.Vector3(-7.85,  5.50,  3.00),
  target:   new THREE.Vector3(-9.50,  0.50, -1.50),
};
// ─────────────────────────────────────────────────────────────────────────────

// Animation loop durations (seconds)
const D_ZOOM_IN   = 2.5;
const D_PAUSE_IN  = 2.0;
const D_ZOOM_OUT  = 2.5;
const D_PAUSE_OUT = 1.5;
const D_TOTAL     = D_ZOOM_IN + D_PAUSE_IN + D_ZOOM_OUT + D_PAUSE_OUT;

// Smoothstep easing: t * t * (3 - 2 * t)
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Returns { state, alpha } where alpha is the smoothstepped lerp parameter.
function animState(elapsed) {
  const t = elapsed % D_TOTAL;
  if (t < D_ZOOM_IN) {
    return { state: 'zoom-in',   alpha: smoothstep(t / D_ZOOM_IN) };
  }
  if (t < D_ZOOM_IN + D_PAUSE_IN) {
    return { state: 'pause-in',  alpha: 1 };
  }
  if (t < D_ZOOM_IN + D_PAUSE_IN + D_ZOOM_OUT) {
    return { state: 'zoom-out',  alpha: smoothstep((t - D_ZOOM_IN - D_PAUSE_IN) / D_ZOOM_OUT) };
  }
  return { state: 'pause-out', alpha: 0 };
}

function init() {
  const canvas = document.getElementById('example2-viewer');
  if (!canvas) return;

  // Defer all Three.js work until the canvas enters the viewport.
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    startViewer(canvas);
  }, { threshold: 0.1 });
  observer.observe(canvas);
}

function startViewer(canvas) {
  // ── Renderer ──────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  renderer.setClearColor(0x000000, 0);

  // ── Camera ────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.copy(OVERVIEW.position);
  camera.lookAt(OVERVIEW.target);

  // ── Scene ─────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Lights ────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(5, 10, 7);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-5, 5, -5);
  scene.add(fill);

  // ── Load GLB ──────────────────────────────────────
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const loadingEl = canvas.parentElement.querySelector('.viewer-loading');

  loader.load(
    SCENE_PATH,
    (gltf) => {
      // Centre model at origin.
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      gltf.scene.position.sub(centre);

      const size = box.getSize(new THREE.Vector3()).length();
      camera.near = size * 0.001;
      camera.far  = size * 10;
      camera.updateProjectionMatrix();

      scene.add(gltf.scene);

      if (loadingEl) loadingEl.remove();
    },
    undefined,
    (err) => {
      console.error('viewer-example-2 GLB load error:', err);
      if (loadingEl) loadingEl.textContent = 'Scene unavailable.';
    }
  );

  // ── Resize ────────────────────────────────────────
  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(canvas.parentElement);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // ── Render loop ───────────────────────────────────
  // Loop is paused when the canvas is off-screen to free GPU bandwidth for
  // CSS compositor animations (scroll-jacked theme transition, scroll progress).
  const _pos = new THREE.Vector3();
  const _tgt = new THREE.Vector3();
  let startTime = null;
  let animHandle = null;

  function startLoop() {
    if (animHandle !== null) return;
    startTime = null; // reset so animation begins from the start on resume
    animHandle = requestAnimationFrame(animate);
  }

  function stopLoop() {
    cancelAnimationFrame(animHandle);
    animHandle = null;
  }

  function animate(now) {
    animHandle = requestAnimationFrame(animate);

    if (startTime === null) startTime = now;
    const elapsed = (now - startTime) * 0.001;

    const { state, alpha } = animState(elapsed);

    if (state === 'zoom-in') {
      _pos.lerpVectors(OVERVIEW.position, ROOM.position, alpha);
      _tgt.lerpVectors(OVERVIEW.target,   ROOM.target,   alpha);
    } else if (state === 'pause-in') {
      _pos.copy(ROOM.position);
      _tgt.copy(ROOM.target);
    } else if (state === 'zoom-out') {
      _pos.lerpVectors(ROOM.position, OVERVIEW.position, alpha);
      _tgt.lerpVectors(ROOM.target,   OVERVIEW.target,   alpha);
    } else {
      _pos.copy(OVERVIEW.position);
      _tgt.copy(OVERVIEW.target);
    }

    camera.position.copy(_pos);
    camera.lookAt(_tgt);

    renderer.render(scene, camera);
  }

  // Pause when scrolled off-screen; resume when back in view.
  const visObs = new IntersectionObserver(
    entries => entries[0].isIntersecting ? startLoop() : stopLoop(),
    { threshold: 0.05 }
  );
  visObs.observe(canvas);

  // Pause when the browser tab is hidden.
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopLoop() : startLoop();
  });

  startLoop();
}

init();
