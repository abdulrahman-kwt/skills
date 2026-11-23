// globe-motion block: a piece of the Earth's crust cut out as a 3D block, showing its layers.
// squeeze 0→1 pushes its two sides together: the layers fold and a snowy mountain rises in the middle.
// Draws on its own transparent canvas, placed above the globe canvas.
import * as THREE from '../node_modules/three/build/three.module.js';
import { W, H } from './globe.js';

export function createBlock({ canvas, length = 4, depth = 2.4, thick = 1.15,
  layers = [[.93, [.62, .60, .36]], [.80, [.86, .74, .52]], [.66, [.55, .56, .60]], [.50, [.80, .38, .22]], [.36, [.36, .40, .52]], [.18, [.20, .25, .42]], [0, [.10, .13, .26]]] } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false); r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(20, W / H, 0.1, 200);
  const BL = length, BD = depth, BT = thick, NX = 240, NY = 44, NZ = 70;
  const hash = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), w = zf * zf * (3 - 2 * zf);
    return (hash(xi, zi) * (1 - u) + hash(xi + 1, zi) * u) * (1 - w) + (hash(xi, zi + 1) * (1 - u) + hash(xi + 1, zi + 1) * u) * w; };
  const ridge = (x, z) => { let a = 0, amp = .5, f = 1.6; for (let o = 0; o < 4; o++) { a += amp * (1 - Math.abs(2 * vnoise(x * f + o * 9.1, z * f + o * 3.7) - 1)); amp *= .5; f *= 2.05; } return a; };
  // where a point of the block sits after squeezing by q
  const shape = (x0, z, q) => { const x = x0 * (1 - 0.2 * q) + 0.10 * q, g = Math.exp(-Math.pow((x - 0.12) / 0.62, 2)), rz = 0.45 + 0.9 * ridge(x0 * 1.3, z * 1.3);
    return { x, top: BT / 2 + q * 1.25 * g * rz + q * 0.06 * g, bot: -BT / 2 - q * 0.30 * g, g }; };
  const grid = (nu, nv) => { const g = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aX', new THREE.BufferAttribute(new Float32Array(n), 1));
    const idx = []; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); } g.setIndex(idx); return g; };
  const gFront = grid(NX, NY), gTop = grid(NX, NZ), gL = grid(NZ, NY), gR = grid(NZ, NY);
  const band = layers.map(([v, c], i) => i < layers.length - 1 ? `if(v>${v.toFixed(3)}) return vec3(${c.join(',')});` : `return vec3(${c.join(',')});`).join('\n');
  const sideMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uShade: { value: 1 } },
    vertexShader: `attribute float aV; attribute float aX; varying float vV; varying float vX; void main(){vV=aV; vX=aX; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uShade; varying float vV; varying float vX;
      vec3 band(float v){ ${band} }
      void main(){ vec3 c=band(vV); float seam=smoothstep(.022,.006,abs(vX-(vV-.5)*.55)); c=mix(c,vec3(.05,.06,.12),seam*.85); gl_FragColor=vec4(c*uShade,1.);} ` });
  const sideDark = sideMat.clone(); sideDark.uniforms.uShade = { value: .62 };
  const top = layers[0][1];
  const topMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: new THREE.Vector3(-0.45, 0.75, 0.5).normalize() } },
    vertexShader: `varying vec3 vN; varying float vH; void main(){vN=normalize(normal); vH=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying float vH;
      void main(){ float h=vH-${(BT / 2 - 0.075).toFixed(3)}; vec3 n=normalize(vN);
        vec3 land=vec3(${top.join(',')}), rock=vec3(.47,.44,.42), snow=vec3(.96,.97,1.); float slope=1.-n.y;
        vec3 c=mix(land,rock,smoothstep(.10,.32,h+slope*.25)); c=mix(c,snow,smoothstep(.42,.60,h-slope*.18));
        c*=.42+.78*max(dot(n,uSun),0.); gl_FragColor=vec4(c,1.);} ` });
  scene.add(new THREE.Mesh(gFront, sideMat), new THREE.Mesh(gTop, topMat), new THREE.Mesh(gL, sideDark), new THREE.Mesh(gR, sideDark));
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vU; void main(){vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vU; void main(){ float d=length((vU-.5)*vec2(1.,1.4)); gl_FragColor=vec4(.20,.43,.91,1.)*smoothstep(.5,.0,d)*.22; }` }));
    g.rotation.x = -Math.PI / 2; g.position.y = -1.1; scene.add(g); }

  let lastQ = null;
  const B = {
    length: BL, depth: BD, thick: BT, shape,
    // squeeze the block: 0 = flat, 1 = full mountain
    squeeze(q) {
      if (q === lastQ) return; lastQ = q;
      let P = gFront.attributes.position.array, V = gFront.attributes.aV.array, X = gFront.attributes.aX.array, k = 0;
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) { const x0 = -BL / 2 + BL * i / NX, v = j / NY, s = shape(x0, BD / 2, q);
        const fold = q * 0.085 * Math.sin(x0 * 11.) * s.g * Math.sin(Math.PI * v) * (1. - .3 * v);
        P[k * 3] = s.x; P[k * 3 + 1] = s.bot + (s.top - s.bot) * v + fold * (v < .999 ? 1 : 0); P[k * 3 + 2] = BD / 2; V[k] = v; X[k] = x0; }
      P = gTop.attributes.position.array; k = 0;
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++, k++) { const x0 = -BL / 2 + BL * i / NX, z = BD / 2 - BD * j / NZ, s = shape(x0, z, q); P[k * 3] = s.x; P[k * 3 + 1] = s.top; P[k * 3 + 2] = z; }
      for (const [g, x0] of [[gL, -BL / 2], [gR, BL / 2]]) { P = g.attributes.position.array; V = g.attributes.aV.array; X = g.attributes.aX.array; k = 0;
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NZ; i++, k++) { const z = BD / 2 - BD * i / NZ, v = j / NY, s = shape(x0, z, q); P[k * 3] = s.x; P[k * 3 + 1] = s.bot + (s.top - s.bot) * v; P[k * 3 + 2] = z; V[k] = v; X[k] = 9.; } }
      for (const g of [gFront, gTop, gL, gR]) { g.attributes.position.needsUpdate = true; g.attributes.aV.needsUpdate = true; g.attributes.aX.needsUpdate = true; }
      gTop.computeVertexNormals();
    },
    // Camera around the block. az: turn (radians, -PI/2 = straight above reads as a map), el: height angle, dist, ty: look height.
    view({ az = -0.5, el = 0.52, dist = 32, ty = 0.45, lookX = 0 } = {}) {
      cam.position.set(Math.sin(az) * Math.cos(el) * dist, ty + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
      cam.up.set(0, 1, 0); cam.lookAt(lookX, ty, 0); cam.updateMatrixWorld(true);
    },
    render() { r.render(scene, cam); },
    // screen position of a point of the block (x along its length, y up, z towards the viewer)
    project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(cam); return { x: (v.x * .5 + .5) * W, y: (-v.y * .5 + .5) * H }; },
  };
  B.squeeze(0); B.view(); return B;
}
