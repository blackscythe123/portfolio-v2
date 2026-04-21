# 🌑 Planet Orbits Around a Black Hole — Three.js Implementation Guide

This document is a complete technical and visual reference for building a **realistic black hole orbital simulation** in Three.js. It covers the physics, the geometry, the visual layers, and the exact parameters to use in code.

---

## 1. The Physics: How Orbits Work Near a Black Hole

Unlike orbits around normal stars, planets near a black hole experience **extreme relativistic effects**. Here's what must be simulated:

### 1.1 Orbital Shape — Ellipse + Precession

Normal planetary orbits are ellipses (Kepler's laws). Near a black hole, **General Relativity causes the ellipse itself to rotate** — this is called **perihelion precession**.

**Ellipse parameters:**
| Parameter | Description |
|---|---|
| `a` | Semi-major axis (half the long diameter) |
| `b` | Semi-minor axis (half the short diameter) |
| `e` | Eccentricity = `sqrt(1 - (b/a)²)` — 0 = circle, 1 = parabola |
| `focus` | Black hole sits at ONE focus of the ellipse, not the center |

**Precession angle per orbit (GR approximation):**
```
Δφ = (6π × G × M) / (a × c² × (1 - e²))
```
- `G` = gravitational constant
- `M` = black hole mass
- `c` = speed of light
- In Three.js: add a small `precessionRate` (e.g. `0.002` to `0.008` radians per orbit) to the orbit's rotation each full cycle

### 1.2 Orbital Speed — Varies Along the Ellipse

Planets move **faster near the black hole** and slower far away. This is Kepler's Second Law (equal areas in equal times).

**Angular velocity at angle θ:**
```
v(θ) = sqrt(G×M × (2/r - 1/a))   ← vis-viva equation
r(θ) = a(1 - e²) / (1 + e×cos(θ))  ← polar form of ellipse
```

**In Three.js simulation:**
```javascript
// At each frame, compute distance r from black hole
const r = a * (1 - e * e) / (1 + e * Math.cos(theta));

// Speed is inversely proportional to distance
const angularSpeed = baseSpeed * (a / r);  // faster when r is small

theta += angularSpeed * deltaTime;
```

### 1.3 Gravitational Lensing Zone (Visual Only)

The region near the black hole **bends light**. This is a visual effect, not affecting orbit math:
- **Photon sphere radius** = `1.5 × Schwarzschild radius` — light orbits here
- **Innermost Stable Circular Orbit (ISCO)** = `3 × Schwarzschild radius` — no stable orbits inside this
- Planets with `perihelion < ISCO` should be destroyed (spiraled in)

**Schwarzschild radius:**
```
Rs = 2GM / c²
```
In Three.js units, normalize: if black hole visual radius = `2`, then `Rs = 2`, `ISCO = 6`.

---

## 2. Three.js Scene Structure

```
Scene
├── BlackHole (center)
│   ├── EventHorizonSphere        ← pure black sphere
│   ├── AccretionDisk             ← flat glowing ring geometry
│   ├── GravitationalLensRing     ← thin bright ring at photon sphere
│   └── JetCone (optional)        ← relativistic jets (top/bottom)
│
├── OrbitGroup[]                  ← one per planet
│   ├── OrbitLine                 ← ellipse path (Line geometry)
│   ├── Planet (Mesh)             ← sphere with texture
│   └── TrailMesh                 ← fading tail behind planet
│
├── StarField                     ← background particle system
├── LensDistortionPass            ← postprocessing distortion near BH
└── Lighting
    ├── AccretionDiskLight        ← orange-white point light at center
    └── AmbientLight              ← very dim, deep blue
```

---

## 3. Black Hole Visual Setup

### 3.1 Event Horizon (the Black Sphere)
```javascript
const bhGeom = new THREE.SphereGeometry(2, 64, 64);
const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const blackHole = new THREE.Mesh(bhGeom, bhMat);
```
- Radius: `2` units (= Rs in our scale)
- Must be `MeshBasicMaterial` — it absorbs all light, never lit

### 3.2 Accretion Disk
The glowing flat ring of superheated gas spiraling inward.

```javascript
const diskGeom = new THREE.RingGeometry(
  2.5,   // inner radius (just outside event horizon)
  12,    // outer radius
  128,   // segments — high for smooth glow
  8      // rings — for color gradient layers
);
const diskMat = new THREE.ShaderMaterial({
  // Custom shader: orange-white inner → deep red outer → transparent edge
  uniforms: {
    time: { value: 0 },
    innerColor: { value: new THREE.Color(0xfff4cc) },
    outerColor: { value: new THREE.Color(0xff2200) },
  },
  vertexShader: diskVertexShader,
  fragmentShader: diskFragmentShader,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const disk = new THREE.Mesh(diskGeom, diskMat);
disk.rotation.x = Math.PI / 2;  // lay flat on XZ plane
```

**Accretion disk fragment shader (GLSL):**
```glsl
uniform float time;
uniform vec3 innerColor;
uniform vec3 outerColor;
varying vec2 vUv;
varying float vRadius;

void main() {
  float t = smoothstep(0.0, 1.0, vRadius);          // 0 = inner, 1 = outer
  vec3 color = mix(innerColor, outerColor, t);
  
  // Spiral swirl bands
  float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float swirl = sin(angle * 8.0 - time * 2.0 + vRadius * 20.0) * 0.5 + 0.5;
  color *= 0.7 + 0.3 * swirl;
  
  // Fade at outer edge
  float alpha = (1.0 - t) * (1.0 - t) * 0.9 + 0.1;
  gl_FragColor = vec4(color, alpha);
}
```

### 3.3 Gravitational Lensing Ring
Bright thin ring at the photon sphere:
```javascript
const lensRing = new THREE.Mesh(
  new THREE.RingGeometry(2.9, 3.1, 256),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
);
lensRing.rotation.x = Math.PI / 2;
```

### 3.4 Relativistic Jets (Optional)
Two bright cones shooting from poles:
```javascript
const jetGeom = new THREE.ConeGeometry(0.3, 20, 32, 1, true);
const jetMat = new THREE.MeshBasicMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.15,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});
// Place one at top (y+) and one flipped at bottom (y-)
```

---

## 4. Planet Orbit Setup

### 4.1 Defining Multiple Orbits

Each planet needs an orbital config object:
```javascript
const PLANETS = [
  {
    name: "Keth",
    a: 20,          // semi-major axis
    e: 0.45,        // eccentricity (highly elliptical)
    inclination: 0.2,        // tilt in radians from disk plane
    ascendingNode: 0.5,      // rotation around Y axis
    precessionRate: 0.005,   // radians added per orbit
    baseSpeed: 0.008,        // orbital speed factor
    radius: 0.5,             // planet visual size
    color: 0x4488ff,
    trailLength: 80,         // number of trail points
  },
  {
    name: "Vreth",
    a: 35,
    e: 0.2,
    inclination: -0.5,
    ascendingNode: 2.1,
    precessionRate: 0.002,
    baseSpeed: 0.004,
    radius: 0.8,
    color: 0xff8844,
    trailLength: 60,
  },
  {
    name: "Solum",
    a: 55,
    e: 0.7,        // very elongated — comes close to black hole
    inclination: 1.1,
    ascendingNode: 4.3,
    precessionRate: 0.008,
    baseSpeed: 0.002,
    radius: 0.4,
    color: 0xaaff66,
    trailLength: 120,
  },
];
```

### 4.2 Generating the Orbit Path Line
Draw the full ellipse as a visual guide:
```javascript
function createOrbitLine(a, e, segments = 256) {
  const points = [];
  const b = a * Math.sqrt(1 - e * e);       // semi-minor axis
  const c = a * e;                            // focus offset
  
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = a * Math.cos(theta) - c;        // offset so BH is at focus
    const z = b * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, z));
  }
  
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
  });
  return new THREE.Line(geom, mat);
}
```

### 4.3 Advancing Planet Position Each Frame
```javascript
function updatePlanet(planet, state, deltaTime) {
  const { a, e, baseSpeed } = planet;
  
  // Current radius from black hole (polar ellipse formula)
  const r = a * (1 - e * e) / (1 + e * Math.cos(state.theta));
  
  // Angular speed inversely proportional to distance (Kepler 2nd law)
  const angularSpeed = baseSpeed * (a / r) * deltaTime * 60;
  state.theta += angularSpeed;
  
  // Accumulate precession (perihelion advances each orbit)
  if (state.theta > Math.PI * 2) {
    state.theta -= Math.PI * 2;
    state.precessionAngle += planet.precessionRate;
  }
  
  // Convert polar → Cartesian in the orbital plane
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e;
  const localX = a * Math.cos(state.theta) - c;
  const localZ = b * Math.sin(state.theta);
  
  // Apply precession rotation around Y
  const px = localX * Math.cos(state.precessionAngle) - localZ * Math.sin(state.precessionAngle);
  const pz = localX * Math.sin(state.precessionAngle) + localZ * Math.cos(state.precessionAngle);
  
  return new THREE.Vector3(px, 0, pz);
}
```

### 4.4 Applying 3D Orientation (Inclination + Ascending Node)
The `localPosition` from 4.3 is in the orbital plane. Lift it into 3D:
```javascript
function applyOrbitalOrientation(localPos, inclination, ascendingNode) {
  // Tilt the orbital plane
  localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
  // Rotate around the black hole's polar axis
  localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), ascendingNode);
  return localPos;
}
```

---

## 5. Planet Trail Effect

Trails show how fast the planet is moving (denser = slower).

### 5.1 Trail as a Fading Line
```javascript
class PlanetTrail {
  constructor(maxPoints = 100) {
    this.positions = [];
    this.maxPoints = maxPoints;
    
    this.geom = new THREE.BufferGeometry();
    this.posAttr = new THREE.Float32BufferAttribute(
      new Float32Array(maxPoints * 3), 3
    );
    this.geom.setAttribute('position', this.posAttr);
    
    this.line = new THREE.Line(
      this.geom,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      })
    );
  }
  
  update(newPoint) {
    this.positions.unshift(newPoint.clone());
    if (this.positions.length > this.maxPoints) {
      this.positions.pop();
    }
    
    for (let i = 0; i < this.maxPoints; i++) {
      if (i < this.positions.length) {
        this.posAttr.setXYZ(i, ...this.positions[i].toArray());
      } else {
        // Fill remaining with last known point (collapsed)
        this.posAttr.setXYZ(i, ...this.positions[this.positions.length-1].toArray());
      }
    }
    this.posAttr.needsUpdate = true;
    this.geom.setDrawRange(0, this.positions.length);
  }
}
```

---

## 6. Post-Processing for Realism

Use `THREE.EffectComposer` with these passes:

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.4,    // strength — glow intensity
  0.4,    // radius — glow spread
  0.1     // threshold — only bright pixels glow
);
composer.addPass(bloom);
```

**Bloom makes:**
- Accretion disk look intensely luminous
- Planet trails softly glow
- Lensing ring pop with light

---

## 7. Camera & Controls

```javascript
// Perspective camera: wide FOV for dramatic depth
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
camera.position.set(0, 40, 80);
camera.lookAt(0, 0, 0);

// OrbitControls for interaction
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 300;
```

---

## 8. Lighting Setup

```javascript
// Accretion disk light — warm white/orange, centered on black hole
const diskLight = new THREE.PointLight(0xffaa44, 3.0, 200);
diskLight.position.set(0, 0, 0);
scene.add(diskLight);

// Very dim ambient — deep space is nearly dark
const ambient = new THREE.AmbientLight(0x111133, 0.3);
scene.add(ambient);

// Optional: subtle hemisphere light (space glow)
const hemi = new THREE.HemisphereLight(0x0033aa, 0x000000, 0.2);
scene.add(hemi);
```

---

## 9. Starfield Background

```javascript
function createStarfield(count = 8000) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 800 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  return new THREE.Points(
    geom,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true })
  );
}
```

---

## 10. Animation Loop

```javascript
const clock = new THREE.Clock();
const planetStates = PLANETS.map(() => ({ theta: Math.random() * Math.PI * 2, precessionAngle: 0 }));

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  
  // Update accretion disk shader time
  diskMat.uniforms.time.value = elapsed;
  
  // Slowly rotate entire disk (frame-dragging effect)
  disk.rotation.z += 0.0005;
  
  // Update each planet
  PLANETS.forEach((planet, i) => {
    const localPos = updatePlanet(planet, planetStates[i], deltaTime);
    const worldPos = applyOrbitalOrientation(localPos, planet.inclination, planet.ascendingNode);
    
    planetMeshes[i].position.copy(worldPos);
    trails[i].update(worldPos);
  });
  
  controls.update();
  composer.render();
}

animate();
```

---

## 11. Realism Checklist

| Feature | Required | Notes |
|---|---|---|
| Black sphere (event horizon) | ✅ | `MeshBasicMaterial`, pitch black |
| Accretion disk with shader | ✅ | Glowing, swirling, additive blend |
| Elliptical orbits (not circular) | ✅ | Black hole at focus, not center |
| Variable orbital speed | ✅ | Fast at perihelion, slow at aphelion |
| Perihelion precession | ✅ | Orbit rotates each revolution |
| 3D orbital inclinations | ✅ | Different tilt angles per planet |
| Planet trails | ✅ | Fading line behind each planet |
| Bloom post-processing | ✅ | Makes glow effects shine |
| Starfield background | ✅ | Spherical point cloud |
| Gravitational lensing ring | ⚡ Bonus | Thin ring at photon sphere |
| Relativistic jets | ⚡ Bonus | Blue cones from poles |
| ISCO destruction | ⚡ Bonus | Destroy planets that orbit too close |

---

## 12. Scale Reference Table

| Object | Visual Radius / Size | Real Analogy |
|---|---|---|
| Black hole (event horizon) | `2` units | ~10 solar mass BH |
| Photon sphere (lensing ring) | `3` units | 1.5 × Rs |
| ISCO (minimum safe orbit) | `6` units | 3 × Rs |
| Accretion disk outer edge | `12` units | ~6 × Rs |
| Closest planet perihelion | ≥ `8` units | Just outside ISCO |
| Farthest planet aphelion | `60–80` units | Outer system |
| Starfield sphere | `800–1200` units | Deep space background |

---

*Feed this document to Claude and say: "Build the Three.js visualization described in this guide." Claude has all the orbital math, shader code, scene structure, and parameters it needs to build a complete, physically-grounded black hole orbital simulation.*