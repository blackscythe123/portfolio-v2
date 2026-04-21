# threejs-blackhole — Integration Reference

Cloned from: https://github.com/vlwkaos/threejs-blackhole.git  
Live demo: https://vlwkaos-three-js-blackhole.netlify.app/  
Located at: `./threejs-blackhole/`

## What it does

Real general-relativity black hole raytracer running entirely in a GLSL fragment shader. Uses **leapfrog geodesic integration** (not fake rim-glow) to bend light around the Schwarzschild metric. Every pixel traces an actual light path.

## File map

| File | Purpose |
|---|---|
| `src/graphics/fragmentShader.glsl` | The entire black hole — geodesic raytracer, accretion disk, doppler shift, Lorentz transform, temperature→color |
| `src/graphics/render.js` | Scene setup: renderer, EffectComposer+UnrealBloomPass, texture loading, shader plane creation |
| `src/camera/Observer.js` | Camera class (extends PerspectiveCamera) — orbits at Schwarzschild distance r, provides `position`/`direction`/`velocity` as shader uniforms |
| `src/camera/CameraDragControls.js` | Mouse drag to rotate observer |
| `src/main.js` | Entry point: wires uniforms, runs animation loop |
| `src/gui/datGUI.js` | dat.GUI controls — default values listed below |
| `assets/milkyway.jpg` | Background sky texture (`bg_texture` uniform) |
| `assets/star_noise.png` | Star catalog — R=temperature, G=luminosity, B=velocity (`star_texture` uniform) |
| `assets/accretion_disk.png` | Disk texture used when `use_disk_texture=true` (`disk_texture` uniform) |

## Rendering architecture

```
PlaneGeometry(2,2)  ← vertex shader: gl_Position = vec4(position, 1.0)
                       fills screen in NDC regardless of camera
     ↓
fragmentShader.glsl ← gets cam_pos/cam_dir/cam_up/cam_vel/fov as uniforms
                       samples bg_texture + star_texture + disk_texture
     ↓
EffectComposer → UnrealBloomPass → screen
```

The shader plane uses `THREE.Camera` (not PerspectiveCamera) positioned at `z=1`. The actual view is driven entirely by uniforms, not by THREE.js projection.

## Key shader uniforms

```glsl
uniform float time;           // elapsed seconds
uniform vec2  resolution;     // viewport size in pixels
uniform vec3  cam_pos;        // observer world position (Schwarzschild units)
uniform vec3  cam_dir;        // normalized forward vector
uniform vec3  cam_up;         // normalized up vector
uniform vec3  cam_vel;        // velocity for doppler/Lorentz
uniform float fov;            // field of view in degrees

uniform bool  accretion_disk;   // enable disk
uniform bool  use_disk_texture; // use PNG vs blackbody
uniform bool  doppler_shift;    // enable frequency shift
uniform bool  lorentz_transform;
uniform bool  beaming;

uniform sampler2D bg_texture;   // milkyway
uniform sampler2D star_texture; // star catalog
uniform sampler2D disk_texture; // accretion disk PNG
```

## Shader defines (prepended at runtime)

```glsl
#define STEP   0.05   // integration step size
#define NSTEPS 600    // iteration count
```
Quality presets from `render.js`:
- low:    STEP=0.1,  NSTEPS=300
- medium: STEP=0.05, NSTEPS=600
- high:   STEP=0.02, NSTEPS=1000

## Coordinate system

- Units: **Schwarzschild radii** (event horizon at r=1)
- Event horizon: r < 1 → solid black
- Photon sphere: r = 1.5 (light can orbit)
- ISCO: r = 3 (innermost stable circular orbit)
- Accretion disk: `DISK_IN=2.0` to `DISK_IN+DISK_WIDTH=6.0`
- Default observer distance: **r=10**

## Default config values (from datGUI.js)

```js
bloom:       { strength:1.0, radius:0.5, threshold:0.6 }
camera:      { distance:10,  fov:90,     orbit:true }
effects:     { lorentz_transform:true, accretion_disk:true,
               use_disk_texture:true,  doppler_shift:true, beaming:true }
performance: { resolution:1.0, quality:'medium' }
```

## Observer.js key behaviour

- Extends `THREE.PerspectiveCamera`
- `observer.distance = r` → sets position on orbit circle, computes `maxAngularVelocity`
- `observer.update(delta)` → advances `theta`, sets `position` + `velocity`, applies `-5°` incline
- `observer.moving = true/false` → accelerate/decelerate angular velocity
- `observer.direction` is a **separate** `Vector3` (not THREE.js quaternion) — update manually for shader

## How to use the shader in a single HTML file

```html
<!-- vertex shader inline -->
<script id="vertexShader" type="x-shader/x-vertex">
  void main() { gl_Position = vec4(position, 1.0); }
</script>

<script type="module">
import * as THREE from 'three';
// prepend defines to shader string
const defines = `#define STEP 0.05\n#define NSTEPS 600\n`;
const frag = defines + RAW_GLSL; // inline the fragmentShader.glsl content

const uniforms = { time:{value:0}, resolution:{value:new THREE.Vector2()},
  cam_pos:{value:new THREE.Vector3()}, cam_dir:{value:new THREE.Vector3()},
  cam_up:{value:new THREE.Vector3()}, cam_vel:{value:new THREE.Vector3()},
  fov:{value:60.0}, accretion_disk:{value:true}, use_disk_texture:{value:true},
  doppler_shift:{value:true}, lorentz_transform:{value:true}, beaming:{value:true},
  bg_texture:{value:null}, star_texture:{value:null}, disk_texture:{value:null} };

const bhMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2,2),
  new THREE.ShaderMaterial({
    uniforms, depthTest:false, depthWrite:false,
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: frag
  })
);
bhMesh.renderOrder = -1000; // always behind planets

// Load textures
const loader = new THREE.TextureLoader();
loader.load('threejs-blackhole/assets/milkyway.jpg',   t => uniforms.bg_texture.value   = t);
loader.load('threejs-blackhole/assets/star_noise.png', t => uniforms.star_texture.value = t);
loader.load('threejs-blackhole/assets/accretion_disk.png', t => uniforms.disk_texture.value = t);
</script>
```

## Compositing planets on top

Because the shader plane uses `gl_Position = vec4(position, 1.0)` (ignores camera matrices), it fills the screen with any camera. Set `bhMesh.renderOrder = -1000`, `depthTest=false`, `depthWrite=false`. Add planets with default `renderOrder=0`. Single `scene.add()` for both. Single `RenderPass(scene, observerCamera)` + `UnrealBloomPass` in EffectComposer handles everything.

Planet sizing guide for Schwarzschild units:
- Observer at r=10, planets at r=6–9 → planet radius 0.20–0.25 looks correct
- Inspection camera at planetPos + normalize(planetPos)*1.5 → dramatic close-up
