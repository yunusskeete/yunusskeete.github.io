import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
// import { initDebugCoords } from './debug-coords.js';

const SCENE_PATH = "/assets/models/scene-208.glb";

// Fractions of scene diameter to shift the orbit target.
// Adjust until the scene feels visually centred in the canvas.
const TARGET_OFFSET = { x: 0.0, y: -0.05, z: -0.0 };

// Rotation speeds cycled by pressing R. 0 = off.
const ROTATION_SPEEDS = [0.6, 2.0, 0];

// Pre-rotation of the scene in degrees — tilts the effective axis of rotation.
// x: tips the scene forward/back. y: spins it on load. z: rolls it left/right.
const SCENE_ROTATION = { x: 0, y: 40, z: 0 };

// Camera distance as a multiple of scene diameter. Larger = more zoomed out.
const ZOOM_DISTANCE = 0.75;

function init() {
  const canvas = document.getElementById('scp-viewer');
  if (!canvas) return;

  // Defer all Three.js work until the canvas enters the viewport.
  // This prevents WebGL initialisation and GLB parsing from running on page
  // load when the user is scrolled away from the viewer — which would cause
  // stutter in the CSS transitions triggered by theme-transition.js.
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    startViewer(canvas);
  }, { threshold: 0.1 });
  observer.observe(canvas);
}

function startViewer(canvas) {

  const hint = document.querySelector('.viewer-hint');

  // ── Renderer ──────────────────────────────────────
  // alpha: true + transparent clear colour lets the CSS background: var(--bg)
  // show through, so the viewer background follows the light/dark theme switch.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Higher exposure than the dark-background reference — compensates for the
  // light page background which makes the scene read darker by contrast.
  renderer.toneMappingExposure = 1.8;
  renderer.setClearColor(0x000000, 0);

  // ── Camera ────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 10, 20);

  // ── Scene ─────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Lights ────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(5, 10, 7);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-5, 5, -5);
  scene.add(fill);

  // ── Controls ──────────────────────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  // Zoom disabled until the user clicks — prevents OrbitControls from calling
  // preventDefault() on wheel events and blocking page scroll.
  controls.enableZoom = false;

  // On first pointerdown: stop auto-rotate, enable zoom, fade hint.
  let interacted = false;
  function onInteract() {
    if (interacted) return;
    interacted = true;
    controls.autoRotate = false;
    controls.enableZoom = true;
    if (hint) hint.classList.add('viewer-hint--hidden');
  }
  renderer.domElement.addEventListener('pointerdown', onInteract, { once: true });

  // initDebugCoords(camera, controls, canvas.parentElement);

  // R key cycles through ROTATION_SPEEDS
  let speedIndex = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'r' && e.key !== 'R') return;
    speedIndex = (speedIndex + 1) % ROTATION_SPEEDS.length;
    const speed = ROTATION_SPEEDS[speedIndex];
    controls.autoRotate = speed !== 0;
    controls.autoRotateSpeed = speed;
  });

  // ── Load GLB ──────────────────────────────────────
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const loadingEl = document.querySelector('.viewer-loading');

  loader.load(
    SCENE_PATH,
    (gltf) => {
      // Centre model at origin
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      gltf.scene.position.sub(centre);

      // Wrap in a pivot group so SCENE_ROTATION tilts the effective rotation axis
      const pivot = new THREE.Group();
      pivot.rotation.x = THREE.MathUtils.degToRad(SCENE_ROTATION.x);
      pivot.rotation.y = THREE.MathUtils.degToRad(SCENE_ROTATION.y);
      pivot.rotation.z = THREE.MathUtils.degToRad(SCENE_ROTATION.z);
      pivot.add(gltf.scene);

      const size = box.getSize(new THREE.Vector3()).length();
      camera.position.set(0, size * 0.4, size * ZOOM_DISTANCE);
      camera.near = size * 0.001;
      camera.far = size * 10;
      camera.updateProjectionMatrix();
      controls.maxDistance = size * 4;
      controls.target.set(size * TARGET_OFFSET.x, size * TARGET_OFFSET.y, size * TARGET_OFFSET.z);
      controls.update();

      scene.add(pivot);

      // ── Debug axis (toggle with A) ─────────────────
      const axisHelper = new THREE.AxesHelper(size * 0.3);
      axisHelper.position.copy(controls.target);
      axisHelper.visible = false;
      scene.add(axisHelper);

      window.addEventListener('keydown', (e) => {
        if (e.key === 'a' || e.key === 'A') {
          axisHelper.visible = !axisHelper.visible;
          // Keep position in sync with target in case it was adjusted
          axisHelper.position.copy(controls.target);
        }
      });

      if (loadingEl) loadingEl.remove();
    },
    undefined,
    (err) => {
      console.error('GLB load error:', err);
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

  // Trigger initial size
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);

  // ── Render loop ───────────────────────────────────
  // Loop is paused when the canvas is off-screen to free GPU bandwidth for
  // CSS compositor animations (scroll-jacked theme transition, scroll progress).
  let animHandle = null;

  function startLoop() {
    if (animHandle !== null) return;
    animHandle = requestAnimationFrame(animate);
  }

  function stopLoop() {
    cancelAnimationFrame(animHandle);
    animHandle = null;
  }

  function animate() {
    animHandle = requestAnimationFrame(animate);
    controls.update();
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
