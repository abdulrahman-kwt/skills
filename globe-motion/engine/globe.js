// globe-motion engine: a shaded 3D globe with real coastlines (today or any age back to 200 Ma),
// camera moves, region tint, mountain ridge, and screen projection for labels/pins/routes.
// Needs: three (ES module) and the d3-array + d3-geo UMD scripts loaded before this module (window.d3).
import * as THREE from '../node_modules/three/build/three.module.js';

export const W = 1080, H = 1920;
// Everything important stays inside this box (Instagram crops the sides on iPhone and covers top/bottom with UI).
export const SAFE = { x0: 131, x1: 949, y0: 150, y1: 1620 };
export const D2R = Math.PI / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const cl = x => Math.min(1, Math.max(0, x));
export const seg = (t, a, b) => cl((t - a) / (b - a));          // 0→1 between two times
export const es = x => x * x * (3 - 2 * x);                      // smoothstep
export const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // slow-fast-slow
export const spring = x => x <= 0 ? 0 : (x >= 1 ? 1 : 1 - Math.pow(1 - x, 3) * Math.cos(x * 5.2)); // pop with overshoot

const DEF = {
  bg: '#090A11',
  deep: [.035, .10, .30], shallow: [.16, .42, .86],
  coast: [.93, .82, .60], inland: [.62, .60, .36],
  tint: [.98, .80, .46], glow: [.30, .55, 1.0], atmo: [.20, .43, .91],
  radius: 0.74, stars: true, data: 'data/coast', shine: 0.3, terrain: 1, terrainMap: 'data/terrain.jpg',   // shine: the sun's glint on the sea (0 = none)
};

export async function createGlobe(options = {}) {
  const o = { ...DEF, ...options };
  const d3 = window.d3;
  if (!d3 || !d3.geoPath) throw new Error('load d3-array and d3-geo before the engine');
  const TW = 4096, TH = 2048, R = o.radius;

  // ---------- coastline data: every polygon point at every 5 Myr step ----------
  const meta = await (await fetch(o.data + '.json')).json();
  const raw = new Int16Array(await (await fetch(o.data + '.bin')).arrayBuffer());
  const times = meta.times, sizes = meta.sizes, NP = meta.points, SC = meta.scale;
  const offs = []; { let a = 0; for (const s of sizes) { offs.push(a); a += s; } }
  const V = times.map((_, k) => { // unit vectors, NaN where the point does not exist at that age
    const out = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) {
      const lo = raw[(k * NP + i) * 2], la = raw[(k * NP + i) * 2 + 1];
      if (lo === 32767) { out[i * 3] = NaN; continue; }
      const L = lo / SC * D2R, A = la / SC * D2R;
      out[i * 3] = Math.cos(A) * Math.cos(L); out[i * 3 + 1] = Math.cos(A) * Math.sin(L); out[i * 3 + 2] = Math.sin(A);
    }
    return out;
  });
  const ringAt = (i, age) => {
    let k = 0; while (k < times.length - 2 && times[k + 1] < age) k++;
    const f = cl((age - times[k]) / (times[k + 1] - times[k])), A = V[k], B = V[k + 1], ring = [];
    for (let j = offs[i]; j < offs[i] + sizes[i]; j++) {
      const ax = A[j * 3], bx = B[j * 3]; if (ax !== ax || bx !== bx) return null;
      const x = ax + (bx - ax) * f, y = A[j * 3 + 1] + (B[j * 3 + 1] - A[j * 3 + 1]) * f, z = A[j * 3 + 2] + (B[j * 3 + 2] - A[j * 3 + 2]) * f, n = Math.hypot(x, y, z);
      ring.push([Math.atan2(y, x) / D2R, Math.asin(z / n) / D2R]);
    }
    return ring;
  };
  const rev = sizes.map((s, i) => { // winding of each polygon, read from today's shape
    const r = []; for (let j = offs[i]; j < offs[i] + s; j++) { const x = V[0][j * 3], y = V[0][j * 3 + 1], z = V[0][j * 3 + 2]; if (x !== x) return false; r.push([Math.atan2(y, x) / D2R, Math.asin(z) / D2R]); }
    r.push(r[0]); return d3.geoArea({ type: 'Polygon', coordinates: [r] }) > 2 * Math.PI; });
  const closed = (i, age) => { const r = ringAt(i, age); if (!r) return null; if (rev[i]) r.reverse(); r.push(r[0]); return r; };

  // ---------- land mask texture (R = land, B = 0 where tinted) ----------
  const mask = document.createElement('canvas'); mask.width = TW; mask.height = TH; const mc = mask.getContext('2d');
  const soft = document.createElement('canvas'); soft.width = TW / 2; soft.height = TH / 2; const sc = soft.getContext('2d');
  const proj = d3.geoEquirectangular().scale(TW / (2 * Math.PI)).translate([TW / 2, TH / 2]).precision(0.3);
  const path = d3.geoPath(proj, mc);
  let tintPolys = [], tintRings = [], maskKey = null;
  const drawMask = age => {
    const key = age.toFixed(3) + '|' + tintPolys.join(',') + '|' + tintRings.length;
    if (key === maskKey) return; maskKey = key;
    const polys = [], tp = [];
    for (let i = 0; i < sizes.length; i++) { const r = closed(i, age); if (!r) continue; polys.push([r]); if (tintPolys.includes(i)) tp.push([r]); }
    mc.fillStyle = '#000'; mc.fillRect(0, 0, TW, TH);
    mc.beginPath(); path({ type: 'MultiPolygon', coordinates: polys }); mc.fillStyle = '#fff'; mc.fill(); mc.strokeStyle = '#fff'; mc.lineWidth = 3; mc.lineJoin = 'round'; mc.stroke();
    if (tp.length) { mc.beginPath(); path({ type: 'MultiPolygon', coordinates: tp }); mc.fillStyle = '#ffff00'; mc.fill(); mc.strokeStyle = '#ffff00'; mc.stroke(); }
    if (tintRings.length) { // free shapes: only the land inside them gets tinted
      mc.save(); mc.globalCompositeOperation = 'multiply'; mc.beginPath();
      path({ type: 'MultiPolygon', coordinates: tintRings.map(r => [r]) }); mc.fillStyle = '#ffff00'; mc.fill(); mc.restore();
    }
    sc.filter = 'blur(7px)'; sc.drawImage(mask, 0, 0, TW / 2, TH / 2); sc.filter = 'none';
    tMask.needsUpdate = true; tSoft.needsUpdate = true;
  };

  // ---------- scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(new THREE.Color(o.bg), 1);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(20, W / H, 0.1, 100); cam.position.set(0, 0, 10);
  const tMask = new THREE.CanvasTexture(mask), tSoft = new THREE.CanvasTexture(soft);
  for (const t of [tMask, tSoft]) { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = THREE.RepeatWrapping; }
  // real terrain (mountains, deserts, green) painted on the land. Only valid for today's map, so it fades out as soon as age > 0.
  let tTerr = null, terrAmt = o.terrain;
  if (o.terrainMap) { try { tTerr = await new THREE.TextureLoader().loadAsync(o.terrainMap); tTerr.colorSpace = THREE.NoColorSpace; tTerr.wrapS = THREE.RepeatWrapping; tTerr.minFilter = THREE.LinearMipmapLinearFilter; tTerr.anisotropy = 8; } catch (e) { tTerr = null; } }
  const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
  const SUN = new THREE.Vector3(-0.55, 0.55, 0.63).normalize();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMask: { value: tMask }, uSoft: { value: tSoft }, uSun: { value: SUN },
      uRidge: { value: 0 }, uGlow: { value: 0 }, uTint: { value: 0 }, uFar: { value: 1 }, uShine: { value: o.shine }, uTerr: { value: 0 }, uTmap: { value: tTerr },
      uPts: { value: Array.from({ length: 9 }, () => new THREE.Vector2()) },
      cDeep: { value: v3(o.deep) }, cShallow: { value: v3(o.shallow) }, cCoast: { value: v3(o.coast) }, cInland: { value: v3(o.inland) },
      cTint: { value: v3(o.tint) }, cGlow: { value: v3(o.glow) }, cAtmo: { value: v3(o.atmo) },
    },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vView;
      void main(){ vP=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.); vView=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform sampler2D uMask,uSoft,uTmap; uniform vec3 uSun,cDeep,cShallow,cCoast,cInland,cTint,cGlow,cAtmo; uniform float uRidge,uGlow,uFar,uTint,uShine,uTerr; uniform vec2 uPts[9]; varying vec3 vP; varying vec3 vN; varying vec3 vView;
      float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}
      float rdg(vec2 p){ float a=0.,amp=.5; for(int o=0;o<4;o++){ a+=amp*(1.-abs(2.*vn(p)-1.)); p=p*2.03+vec2(7.3,3.1); amp*=.5; } return a; }
      float him(vec2 ll){ float d=99., sa=0.; for(int i=0;i<8;i++){ vec2 a=uPts[i],b=uPts[i+1]; vec2 pa=ll-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); float di=length(pa-ba*h); if(di<d){ d=di; sa=(float(i)+h)/8.; } }
        float taper=smoothstep(0.,.16,sa)*smoothstep(1.,.84,sa);
        float w=1.55*(.55+.45*taper);
        float base=pow(clamp(1.-d/w,0.,1.),1.35)*taper;
        float r=rdg(ll*1.7);
        return base*(.30+.95*r*r); }
      void main(){
        float lon=atan(vP.x,vP.z), lat=asin(clamp(vP.y,-1.,1.));
        vec2 uv=vec2(lon/6.2831853+.5, .5+lat/3.14159265);
        vec4 mk=texture2D(uMask,uv);
        float m=smoothstep(.35,.65,mk.r);
        float s=texture2D(uSoft,uv).r;
        vec3 ocean=mix(cDeep,cShallow,smoothstep(.02,.5,s)*.85);
        ocean+=cGlow*smoothstep(.28,.62,s)*uGlow*.85;
        vec3 land=mix(cCoast,cInland,smoothstep(.55,1.,s));
        if(uTerr>0.){ vec3 tx=texture2D(uTmap,uv).rgb; float lum=dot(tx,vec3(.3,.59,.11));
          float water=smoothstep(.02,.10,tx.b-tx.r);                       // the map's own sea colour: ignore it
          vec3 g=mix(vec3(lum),tx,1.12); g=pow(max(g,0.),vec3(1.9))*1.02;   // deeper than the pastel original
          g=mix(g,vec3(lum*lum)*cInland*2.1,.42);                                       // pull it toward the film's own land colour
          land=mix(land,g,uTerr*(1.-water)*smoothstep(.42,.80,s)); }
        float tn=(1.-mk.b)*m*uTint;
        land=mix(land,cTint*(.92+.16*smoothstep(1.,.55,s)),tn*.78);
        vec3 col=mix(ocean,land,m);
        if(uRidge>0.){ vec2 ll=vec2(lon,lat)*57.29578; float e=.05;
          float hh=him(ll)*uRidge, hx=him(ll+vec2(e,0.))*uRidge, hy=him(ll+vec2(0.,e))*uRidge;
          vec3 nn=normalize(vec3(-(hx-hh)/e*1.15,-(hy-hh)/e*1.15,1.));
          float df=max(dot(nn,normalize(vec3(-.55,.55,.63))),0.), slope=1.-nn.z;
          vec3 foot=mix(land,vec3(.50,.50,.33),.6), rock=vec3(.50,.46,.42), snow=vec3(.97,.98,1.);
          vec3 mc=mix(foot,rock,smoothstep(.10,.26,hh+slope*.10));
          mc=mix(mc,snow,smoothstep(.34,.50,hh-slope*.12));
          mc*=.50+.80*df; mc=mix(mc,vec3(.97,.98,1.),.50*uFar*smoothstep(.10,.28,hh));
          float sh=him(ll+vec2(-.30,.26))*uRidge; mc*=1.-.35*clamp(sh-hh,0.,1.);
          col=mix(col,mc,smoothstep(.015,.09,hh)*m);
          col*=1.-.30*clamp(sh-hh,0.,1.)*(1.-smoothstep(.015,.09,hh))*m; }
        vec3 n=normalize(vN);
        float light=.30+.80*smoothstep(-.25,.9,dot(n,uSun));
        vec3 h=normalize(uSun+vView);
        float spec=pow(max(dot(n,h),0.),60.)*(1.-m)*uShine;
        float fr=pow(1.-max(dot(n,vView),0.),3.);
        col=col*light+spec+cAtmo*fr*.55;
        gl_FragColor=vec4(col,1.);
      }`,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 120), mat);
  const group = new THREE.Group(); group.add(globe); scene.add(group);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 96, 72), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { c: { value: v3(o.atmo) } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float a=pow(max(dot(-vN,vV),0.),2.2); gl_FragColor=vec4(c,1.)*a*1.25; }`,
  }));
  scene.add(atmo);
  if (o.stars) {
    const n = 900, pos = new Float32Array(n * 3); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - .5) * 5; pos[i * 3 + 1] = (rnd() - .5) * 8; pos[i * 3 + 2] = -6 - rnd() * 4; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb4e8, size: 0.018, transparent: true, opacity: .7 })));
  }

  let curAge = 0;
  const G = {
    THREE, scene, cam, renderer, radius: R, polygons: sizes.length, maxAge: times[times.length - 1],

    // Camera: the point (lon, lat) sits at the centre of the frame. dist 10 = whole globe fits the safe width, ~2.2 = close-up.
    // y moves the globe up (+) or down (-) on screen, in globe units (0.2 ≈ 110 px at dist 10).
    view({ lon = 0, lat = 0, dist = 10, y = 0 } = {}) {
      globe.rotation.set(0, -lon * D2R, 0); group.rotation.x = lat * D2R; group.position.y = y; atmo.position.y = y; cam.position.z = dist;
      scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    },
    // Coastlines at "age" million years ago (0 = today, up to 200).
    age(a) { curAge = Math.max(0, Math.min(G.maxAge, a)); },
    // Paint some land in the highlight colour. polys: polygon indexes (see polyAt). rings: free shapes [[lon,lat],...] (only land inside is painted).
    tint({ polys = [], rings = [], amount = 1 } = {}) {
      tintPolys = polys.slice(); tintRings = rings.map(r => { const c = r.slice(); c.push(c[0]); if (d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse(); return c; });
      mat.uniforms.uTint.value = amount;
    },
    // A snowy mountain range along a line of [lon,lat] points. amount 0→1 grows it. far 1 = brighter so it reads from a distance.
    ridge(points, amount = 1, far = 1) {
      if (points && points.length > 1) { const n = points.length - 1;
        for (let i = 0; i < 9; i++) { const u = i / 8 * n, k = Math.min(n - 1, Math.floor(u)), f = u - k; mat.uniforms.uPts.value[i].set(lerp(points[k][0], points[k + 1][0], f), lerp(points[k][1], points[k + 1][1], f)); } }
      mat.uniforms.uRidge.value = amount; mat.uniforms.uFar.value = far;
    },
    // Light up the shallow water around the coasts (0→1): a pulse that says "something is happening here".
    glow(amount) { mat.uniforms.uGlow.value = amount; },
    // How much real terrain shows on the land (0 = flat colour, 1 = full). It hides itself whenever age > 0, because the terrain map is today's Earth.
    terrain(amount) { terrAmt = amount; },
    render() { drawMask(curAge); mat.uniforms.uTerr.value = tTerr ? terrAmt * (1 - Math.min(1, curAge / 2)) : 0; renderer.render(scene, cam); },

    // Screen position of a place. h lifts the point above the surface (0.1 = 10% of the radius). visible is false behind the globe.
    project(lon, lat, h = 0) {
      const lo = lon * D2R, la = lat * D2R;
      const p = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)).multiplyScalar(R * (1 + h));
      globe.localToWorld(p);
      const c = new THREE.Vector3(); globe.getWorldPosition(c);
      const d = p.clone().sub(cam.position), L = d.length(); d.normalize();
      const tc = c.clone().sub(cam.position).dot(d), near = c.clone().sub(cam.position).addScaledVector(d, -tc).length();
      const visible = !(near < R * 0.995 && tc > 0 && tc < L - 1e-4);
      const s = p.project(cam);
      return { x: (s.x * .5 + .5) * W, y: (-s.y * .5 + .5) * H, visible };
    },
    // The camera distance at which `degrees` of the globe's surface (measured along the equator of the view) fit inside the safe width.
    // e.g. a route spanning 80° of longitude at mid latitudes → view({ dist: G.distFor(80 * 0.8) }) (longitude degrees shrink by cos(latitude)).
    distFor(degrees) { const a = Math.min(170, Math.max(2, degrees)) / 2 * D2R, half = (SAFE.x1 - SAFE.x0) / 2 * 0.78 /* leaves room for the names at both ends */, k = (H / 2) / Math.tan(10 * D2R);
      return Math.max(2.2, R * Math.cos(a) + R * Math.sin(a) * k / half); },
    // Which coastline polygon contains this place today (-1 if it is sea). Use it with tint() and centroid().
    polyAt(lon, lat) {
      for (let i = 0; i < sizes.length; i++) { const r = closed(i, 0); if (r && d3.geoContains({ type: 'Polygon', coordinates: [r] }, [lon, lat])) return i; }
      return -1;
    },
    // Centre [lon,lat] of a polygon at an age: follow a landmass while it drifts.
    centroid(i, age = curAge) {
      const r = ringAt(i, age); if (!r) return null; let x = 0, y = 0, z = 0;
      for (const [lo, la] of r) { x += Math.cos(la * D2R) * Math.cos(lo * D2R); y += Math.cos(la * D2R) * Math.sin(lo * D2R); z += Math.sin(la * D2R); }
      const n = Math.hypot(x, y, z); return [Math.atan2(y, x) / D2R, Math.asin(z / n) / D2R];
    },
  };
  G.view(); return G;
}
