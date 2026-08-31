---
name: web-game-development
description: Universal blueprint, architectural patterns, and engineering principles for building high-performance 2D, 2.5D, and 3D web games (Arcade, Action, Shooters, Runners, Strategy, Platformers, Puzzles) using Three.js or Canvas2D, procedural asset generation (zero external 3D/audio files), Web Audio API synthesis, object pooling, and decoupled ECS game loops.
---

# Universal Web Game Development Skill & Architectural Blueprint

This skill is a production-grade guide and architectural specification for building **any high-performance web game** (2D Canvas, 2.5D Isometric, or 3D WebGL via Three.js / Web standards).

It establishes universal engineering patterns, procedural asset generation techniques, in-memory canvas texture synthesis, Web Audio API sound engines, and modular systems required to build **any game genre** (e.g., Endless Runner, Top-Down Shooter, 3D Space Combat, Arcade Racer, Platformer, Roguelike, Tower Defense, Puzzle) **with zero external 3D model (.gltf) or audio (.mp3/.wav) file dependencies**.

---

## 1. The 7 Immutable Laws of Web Game Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN ORCHESTRATOR                        │
│        (State Machine: BOOT / MENU / PLAY / GAMEOVER)       │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐
│ CORE ENGINE ││ ENTITIES &  ││ WORLD & ENV ││ SYSTEMS &   │
│ - Render/Ctx││ PROCEDURAL  ││ - Chunks/Map││ PERSISTENCE │
│ - Camera Rig││   GRAPHICS  ││ - ObjectPool││ - Collision │
│ - Web Audio ││ - Physics   ││ - Biome/Grid││ - Powerups  │
│ - Input Mgr ││ - Keyframes ││ - Scenery   ││ - LocalSave │
└──────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬──────┘
       │              │              │              │
       └──────────────┴───────┬──────┴──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  HTML/CSS UI HUD  │
                    │ (Glassmorphism &  │
                    │  Screen FX Tray)  │
                    └───────────────────┘
```

### Law 1: Zero External Asset Dependency (Code-First Procedural Generation)
* **3D Visuals**: Build meshes procedurally by composing Three.js primitives (`BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `TorusGeometry`, `ConeGeometry`, `ExtrudeGeometry`) into hierarchical `THREE.Group` rigs.
* **Procedural Textures**: Generate architectural facades, window grids, neon signs, and road marks dynamically using in-memory HTML5 Canvas and `THREE.CanvasTexture`.
* **2D Visuals**: Render sprites procedurally using vector `Path2D`, procedural gradients, canvas drawing commands, or pixel-matrix generation.
* **Audio**: Synthesize 100% of sound effects and music in real time using the native Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`). No audio file downloads required.

### Law 2: Clamped Delta Time & Independent Game Loop
* Never tie movement or physics directly to frame rate. Always multiply velocities by delta time (`dt`).
* Always clamp delta time (`const dt = Math.min(clock.getDelta(), 0.1)`) to prevent physics tunneling or explosions when the browser tab loses focus or encounters a frame stutter.

### Law 3: Zero-GC (Garbage Collection) Object Pooling
* Never call `new Object()`, `new THREE.Mesh()`, or allocate temporary vectors/arrays inside the active per-frame update loop.
* Pre-allocate reusable instances in an `ObjectPool` for bullets, particles, enemies, tiles, and collectibles. Activate, deactivate, and reposition pooled objects using visibility/alive flags.

### Law 4: Decoupled Entity-Component-System (ECS) Architecture
Organize code into modular, single-responsibility ES modules:
* `core/`: Engine rendering, Camera/Viewport, Web Audio Manager, Multi-Input Manager.
* `entities/`: Player, Enemies/NPCs, Projectiles, Hazards, Collectibles, Particle Systems.
* `world/`: Map/Grid generator, Endless chunk streamer, Biome/Theme manager, Object pools.
* `systems/`: Collision detection (AABB/Spatial Grid), Power-up managers, Quest/Missions, SaveManager.
* `ui/`: DOM overlay, HUD, Menus, Modals, Toasts, Screen Effects.
* `config/`: Constants, Balance tuning, Unlockables catalog.

### Law 5: Two-Layer Presentation (Graphics Canvas + Glassmorphic DOM UI)
* **Layer 0 (Canvas)**: Dedicated full-screen `<canvas>` rendering 60+ FPS graphics (WebGL 3D or Canvas 2D).
* **Layer 1 (DOM UI)**: Layered HTML/CSS overlay using glassmorphic styling (`backdrop-filter: blur(12px)`), responsive typography, floating HUD counters, damage flashes, speed lines, and celebration confetti (`canvas-confetti`).

### Law 6: Unified Multi-Input Abstraction
* Abstract input actions into logical events (`MOVE_LEFT`, `MOVE_RIGHT`, `JUMP`, `SHOOT`, `ACTION`, `PAUSE`).
* Support Keyboard (WASD + Arrows), Mouse/Pointer, Touch Gestures (Swipes + Virtual Buttons), and Gamepad API through a single unified `InputManager`.

### Law 7: Resilient State Machine & Save Persistence
* Use explicit lifecycle states: `BOOT` -> `MENU` -> `PLAYING` -> `PAUSED` -> `GAMEOVER`.
* Automatically serialize high scores, currency, unlocked skins, upgrades, and settings into `localStorage` with fallback defaults.

---

## 2. Standard Universal Codebase Structure

```
game-root/
├── index.html                   # HTML structure, UI overlay layers & canvas
├── package.json                 # Minimal dependencies: three (or canvas), canvas-confetti, vite
├── vite.config.js               # Dev server & production bundler
└── src/
    ├── main.js                  # Central game orchestrator & state machine
    ├── index.css                # Glassmorphic UI, animations, HUD layout
    ├── config/
    │   ├── constants.js         # Physics constants, speeds, boundaries, timings
    │   └── items.js             # Unlockables, upgrades, cosmetics, quests
    ├── core/
    │   ├── Engine.js            # Three.js / Canvas renderer, lights, camera rig
    │   ├── AudioManager.js      # Procedural Web Audio API sound & music synth
    │   └── InputManager.js      # Unified Keyboard / Touch / Mouse controller
    ├── entities/
    │   ├── Player.js            # Procedural player mesh/sprite, animation & physics
    │   ├── EnemyManager.js      # AI entities / obstacles / enemies
    │   ├── CollectibleManager.js# Pickups, coins, power-up orbs
    │   └── ParticleSystem.js    # Spark, trail, burst, and aura particle pools
    ├── systems/
    │   ├── CollisionSystem.js   # AABB / Circle / Spatial hash collision detection
    │   ├── PowerUpSystem.js     # Timers & gameplay modifiers
    │   ├── MissionSystem.js     # Quests, progression & achievements
    │   └── SaveManager.js       # LocalStorage data persistence
    ├── ui/
    │   └── UIManager.js         # Menus, Modals, HUD, Toasts, Screen FX
    └── world/
        ├── ObjectPool.js        # Generic high-performance object pooling engine
        ├── BiomeManager.js      # Environment themes, lighting & atmosphere
        └── WorldManager.js      # Map generator / Chunk streamer / Grid layout
```

---

## 3. Procedural Real-World Object Assembly & Canvas Texture Engine

### A. Dynamic In-Memory Canvas Texture Generator (Skyscrapers & Buildings)
*Generates rich architectural facades with lit/dark office windows, concrete floor slabs, and neon LED edge strips without image files.*

```javascript
const textureCache = new Map();

export function getFacadeTexture(style = 'glass', baseColorHex = '#1e293b', winColorHex = '#38bdf8') {
  const key = `${style}_${baseColorHex}_${winColorHex}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Base building facade color
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 256, 512);

  const floors = 32;
  const cols = 8;
  const floorHeight = 512 / floors;
  const colWidth = 256 / cols;

  for (let f = 0; f < floors; f++) {
    const y = f * floorHeight;
    // Floor concrete divider band
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, y, 256, 3);

    for (let c = 0; c < cols; c++) {
      const x = c * colWidth;
      // Vertical mullion
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(x, y, 3, floorHeight);

      const isLit = Math.random() > 0.35;
      const winW = colWidth - 7;
      const winH = floorHeight - 6;

      if (isLit) {
        // Glowing interior light
        ctx.fillStyle = winColorHex;
        ctx.fillRect(x + 4, y + 3, winW, winH);
        // Glass reflection sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(x + 4, y + 3, winW * 0.4, winH);
      } else {
        // Dark reflective glass
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x + 4, y + 3, winW, winH);
      }
    }
  }

  // Neon edge strip for futuristic/metropolis feel
  if (style === 'cyber' || style === 'glass') {
    ctx.fillStyle = winColorHex;
    ctx.fillRect(250, 0, 6, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}
```

### B. Procedural Skyscraper Assembly
```javascript
export function createSkyscraperMesh() {
  const group = new THREE.Group();
  const width = 18 + Math.random() * 8;
  const height = 50 + Math.random() * 60;
  const depth = 18 + Math.random() * 8;

  const texture = getFacadeTexture('glass', '#0f172a', '#38bdf8');

  // Main Tower Body
  const bodyGeo = new THREE.BoxGeometry(width, height, depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    map: texture,
    roughness: 0.2,
    metalness: 0.7
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Stepped Penthouse Tier
  const tierHeight = 16 + Math.random() * 12;
  const tierGeo = new THREE.BoxGeometry(width * 0.7, tierHeight, depth * 0.7);
  const tier = new THREE.Mesh(tierGeo, bodyMat);
  tier.position.y = height + tierHeight / 2;
  group.add(tier);

  // Broadcast Spire & Aviation Beacon
  const spireGeo = new THREE.ConeGeometry(0.5, 12, 8);
  const spireMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = height + tierHeight + 6;
  group.add(spire);

  return group;
}
```

### C. Procedural Vehicle Assembly (Cars, Trucks, Transports)
```javascript
export function createCarMesh(colorHex = 0xef4444) {
  const group = new THREE.Group();

  // 1. Lower Chassis
  const bodyGeo = new THREE.BoxGeometry(2.1, 0.8, 4.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // 2. Cabin & Angled Windshield
  const cabinGeo = new THREE.BoxGeometry(1.9, 0.65, 2.4);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.25, -0.3);
  group.add(cabin);

  const glassGeo = new THREE.BoxGeometry(1.8, 0.7, 0.1);
  const frontGlass = new THREE.Mesh(glassGeo, cabinMat);
  frontGlass.position.set(0, 1.25, 0.85);
  frontGlass.rotation.x = -Math.PI / 6; // 30 deg sloped windshield
  group.add(frontGlass);

  // 3. Headlights (Emissive White) & Taillights (Emissive Red)
  const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

  const lHead = new THREE.Mesh(lightGeo, headMat); lHead.position.set(-0.8, 0.6, 2.21); group.add(lHead);
  const rHead = new THREE.Mesh(lightGeo, headMat); rHead.position.set(0.8, 0.6, 2.21); group.add(rHead);
  const lTail = new THREE.Mesh(lightGeo, tailMat); lTail.position.set(-0.8, 0.6, -2.21); group.add(lTail);
  const rTail = new THREE.Mesh(lightGeo, tailMat); rTail.position.set(0.8, 0.6, -2.21); group.add(rTail);

  // 4. Wheels with rubber material
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheelPositions = [[-1.1, 0.4, 1.3], [1.1, 0.4, 1.3], [-1.1, 0.4, -1.3], [1.1, 0.4, -1.3]];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(...pos);
    wheel.castShadow = true;
    group.add(wheel);
  });

  return group;
}
```

---

## 4. Universal Code Engine Templates

### A. Procedural Web Audio Synthesizer (`core/AudioManager.js`)
*Generates all game sound effects and musical loops dynamically via Web Audio API without audio files.*

```javascript
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- PARAMETRIC SFX GENERATORS ---

  playTone(freqStart, freqEnd, type = 'sine', duration = 0.15, gainVal = 0.3) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
    }

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  // Pickup / Coin chime (rising sine)
  playCoinSound(multiplier = 1) {
    const base = 880 * (1 + (multiplier - 1) * 0.1);
    this.playTone(base, base * 1.5, 'sine', 0.12, 0.3);
  }

  // Laser / Shoot (fast pitch down sawtooth)
  playShootSound() {
    this.playTone(900, 120, 'sawtooth', 0.14, 0.25);
  }

  // Jump / Whoosh (bandpass triangle sweep)
  playJumpSound() {
    this.playTone(150, 450, 'triangle', 0.18, 0.25);
  }

  // Crash / Explosion (decaying low frequency rumble)
  playCrashSound() {
    this.playTone(130, 25, 'sawtooth', 0.35, 0.45);
  }

  // Power-Up / Level Up Arpeggio
  playPowerupSound() {
    if (!this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, freq * 1.1, 'sine', 0.15, 0.25), idx * 60);
    });
  }
}
```

---

### B. High-Performance Object Pool (`world/ObjectPool.js`)
*Eliminates JavaScript garbage collection pauses by recycling 3D meshes or 2D sprites.*

```javascript
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 15) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.visible = false;
      this.pool.push(obj);
    }
  }

  get(...args) {
    let obj = this.pool.find(o => !o.visible);
    if (!obj) {
      obj = this.createFn();
      this.pool.push(obj);
    }
    obj.visible = true;
    if (this.resetFn) this.resetFn(obj, ...args);
    return obj;
  }

  release(obj) {
    obj.visible = false;
  }

  releaseAll() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
  }

  getActive() {
    return this.pool.filter(o => o.visible);
  }
}
```

---

### C. Cinematic PBR Lighting & Camera Follow (`core/Engine.js`)

```javascript
export function initEngineLights(scene) {
  // 1. Sky/Ground Ambient fill
  const hemi = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 1.4);
  scene.add(hemi);

  // 2. Soft Ambient fill
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  // 3. Directional Sun with soft shadows
  const sun = new THREE.DirectionalLight(0xfffaed, 2.2);
  sun.position.set(30, 60, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  return { hemi, ambient, sun };
}

export function updateCameraFollow(camera, targetPos, offset, lookOffset, dt, speedRatio = 1.0, shakeAmount = 0) {
  const desiredPos = new THREE.Vector3(
    targetPos.x * 0.45 + offset.x,
    targetPos.y + offset.y,
    targetPos.z + offset.z
  );

  // Camera Shake
  if (shakeAmount > 0.001) {
    desiredPos.x += (Math.random() - 0.5) * shakeAmount;
    desiredPos.y += (Math.random() - 0.5) * shakeAmount;
  }

  camera.position.lerp(desiredPos, 1.0 - Math.exp(-dt * 15.0));

  const lookTarget = new THREE.Vector3(
    targetPos.x * 0.25 + lookOffset.x,
    targetPos.y + lookOffset.y,
    targetPos.z + lookOffset.z
  );
  camera.lookAt(lookTarget);
}
```

---

### D. Universal Collision Detection Formulas (`systems/CollisionSystem.js`)

```javascript
export const CollisionMath = {
  // 3D Axis-Aligned Bounding Box (AABB)
  checkAABB3D(boxA, boxB) {
    return (
      boxA.min.x <= boxB.max.x && boxA.max.x >= boxB.min.x &&
      boxA.min.y <= boxB.max.y && boxA.max.y >= boxB.min.y &&
      boxA.min.z <= boxB.max.z && boxA.max.z >= boxB.min.z
    );
  },

  // 2D Circle vs Circle (uses distance squared for speed)
  checkCircle2D(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const rSum = r1 + r2;
    return (dx * dx + dy * dy) <= (rSum * rSum);
  },

  // 2D AABB vs Point
  pointInBox2D(px, py, minX, minY, maxX, maxY) {
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }
};
```

---

## 5. Production & Optimization Checklist

Before shipping any web game, verify these benchmarks:

- [ ] **Zero Per-Frame Allocations**: Geometries, materials, vectors, and array containers are pooled; no `new` operators inside `animate()`.
- [ ] **Pixel Ratio Capped**: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))` to prevent GPU thermal throttling on 4K/retina screens.
- [ ] **Audio Autoplay Compliance**: Initialize or call `audioManager.resume()` on the first user interaction (`click`, `touchstart`, `keydown`).
- [ ] **Responsive Resizing**: Camera aspect ratio and renderer viewport resize automatically with window dimensions.
- [ ] **Safe LocalStorage**: All save/load operations are wrapped in `try/catch` blocks with fallback default schemas.
- [ ] **Touch & Mobile Support**: Virtual buttons or swipe gestures work seamlessly alongside keyboard controls.
- [ ] **Visual Impact & Polish**: UI includes screen shake on impacts, damage flash vignettes, speed lines during boost, and particle bursts on pickups.
