import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
// import { initDebugCoords } from './debug-coords.js';

const SCENE_PATH = "/assets/models/scene-208.glb";

// ── Coordinates discovered with debug-coords overlay ─────────────────────────
// All values are in centred scene space (origin = model bounding-box centre).
// Press C in this viewer to toggle the debug overlay and tune values.

// Route waypoints at floor level: entrance lobby → corridor → junction → changing room.
const ROUTE_WAYPOINTS = [
  new THREE.Vector3(-7.85, 0.00, 11.00),   // entrance lobby doorway
  new THREE.Vector3(-7.85, 0.00,  7.10),   // lobby → corridor opening
  new THREE.Vector3(-4.00, 0.00,  7.10),   // corridor
  new THREE.Vector3(-4.00, 0.00, -0.85),   // corridor → changing room turn
  new THREE.Vector3(-7.85, 0.00, -0.85),   // changing room
];

// Landmark arrow definitions — XZ position + individual oscillation bounds.
const ARROW_DEFS = [
  { pos: new THREE.Vector3(-5.50, 0,  0.25), yLow: 0.75, yHigh: 1.50 },  // orange noticeboard
  { pos: new THREE.Vector3(-5.50, 0, -5.50), yLow: 0.75, yHigh: 1.50 },  // kitchen door
];

// Locked camera view — confirmed with debug-coords overlay.
// const CAM_POSITION = new THREE.Vector3( 4.89, 12.46,  1.84);
// const CAM_TARGET   = new THREE.Vector3(-3.18,  2.55,  1.54);
const CAM_POSITION = new THREE.Vector3( 3.25, 10.55,  2.30);
const CAM_TARGET   = new THREE.Vector3(-3.25,  2.55,  2.05);
// ─────────────────────────────────────────────────────────────────────────────

// true  = straight line segments between waypoints
// false = smooth CatmullRom spline
const STRAIGHT_ROUTE = true;

const ROUTE_COLOUR = 0xffff00;
const ARROW_COLOUR = 0xffff00;  // 0x00797a;  // matches --teal: oklch(52% 0.13 195)
const TUBE_RADIUS  = 0.1125;
const ARROW_RADIUS = 0.25;
const ARROW_HEIGHT = 0.60;

function init() {
  const canvas = document.getElementById('example1-viewer');
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
  camera.position.copy(CAM_POSITION);

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
  controls.autoRotate = false;
  // Zoom disabled until first pointerdown — prevents OrbitControls from calling
  // preventDefault() on wheel events and blocking page scroll.
  controls.enableZoom = false;
  controls.target.copy(CAM_TARGET);
  controls.update();

  renderer.domElement.addEventListener('pointerdown', () => {
    controls.enableZoom = true;
  }, { once: true });

  // initDebugCoords(camera, controls, canvas.parentElement);

  // ── Load GLB ──────────────────────────────────────
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const loadingEl = canvas.parentElement.querySelector('.viewer-loading');
  let arrowMeshes = [];

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
      camera.far = size * 10;
      camera.updateProjectionMatrix();
      controls.maxDistance = size * 4;

      scene.add(gltf.scene);

      // ── Route line ──────────────────────────────────────────────────────────
      let curve;
      if (STRAIGHT_ROUTE) {
        curve = new THREE.CurvePath();
        for (let i = 0; i < ROUTE_WAYPOINTS.length - 1; i++) {
          curve.add(new THREE.LineCurve3(ROUTE_WAYPOINTS[i], ROUTE_WAYPOINTS[i + 1]));
        }
      } else {
        curve = new THREE.CatmullRomCurve3(ROUTE_WAYPOINTS);
      }
      const tubeGeo = new THREE.TubeGeometry(curve, 64, TUBE_RADIUS, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: ROUTE_COLOUR, toneMapped: false });
      scene.add(new THREE.Mesh(tubeGeo, tubeMat));

      // ── Landmark arrows ─────────────────────────────────────────────────────
      // ConeGeometry apex points +Y by default; rotate π around X to point downward.
      const coneGeo = new THREE.ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: ARROW_COLOUR, toneMapped: false });

      arrowMeshes = ARROW_DEFS.map(({ pos }) => {
        const mesh = new THREE.Mesh(coneGeo, coneMat);
        mesh.rotation.x = Math.PI;
        mesh.position.copy(pos);
        scene.add(mesh);
        return mesh;
      });

      if (loadingEl) loadingEl.remove();
    },
    undefined,
    (err) => {
      console.error('viewer-example-1 GLB load error:', err);
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

    const t = performance.now() * 0.001;
    ARROW_DEFS.forEach(({ yLow, yHigh }, i) => {
      if (!arrowMeshes[i]) return;
      const mid = (yLow + yHigh) / 2;
      const amp = (yHigh - yLow) / 2;
      arrowMeshes[i].position.y = mid + amp * Math.sin(t);
    });

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
