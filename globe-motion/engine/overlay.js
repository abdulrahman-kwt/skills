// globe-motion overlay: everything drawn on top of the globe (names, pins, routes, counter, timeline, captions).
// All of it is plain DOM/SVG placed in 1080x1920 pixels, updated once per frame from renderAt(t).
import { W, H, SAFE, cl, lerp, D2R } from './globe.js';

const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
const NS = 'http://www.w3.org/2000/svg';

// Builds the stage inside <body>: the WebGL canvas plus an SVG layer and a DOM layer above it.
export function createStage() {
  const stage = el('div', 'gm-stage', document.body); stage.id = 'stage';
  const canvas = el('canvas', '', stage); canvas.width = W; canvas.height = H;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('class', 'gm-svg'); stage.appendChild(svg);
  const layer = el('div', 'gm-layer', stage);
  return { stage, canvas, svg, layer };
}

// A free text label centred on (x, y). size in px. kind: 'title' (display weight) or 'body'.
export function label(S, text, { size = 58, kind = 'body', color } = {}) {
  const e = el('div', 'gm-lab ' + (kind === 'title' ? 'gm-title' : ''), S.layer, text); e.style.fontSize = size + 'px'; if (color) e.style.color = color;
  return { el: e, set(x, y, opacity = 1, scale = 1) { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.opacity = opacity; e.style.transform = `translate(-50%,-50%) scale(${scale})`; } };
}

// A dot on a place with its name next to it. side: where the name sits ('top' | 'bottom' | 'left' | 'right').
// dx, dy: nudge the name in pixels when the four sides are not enough. dot: false = a name with no dot (a desert, a sea, a mountain range).
// update() returns { x, y, visible } of the place on screen.
export function pin(S, G, lon, lat, text, { size = 46, side = 'top', color = '#F5F7FA', dx = 0, dy = 0, dot: showDot = true } = {}) {
  const dot = el('div', 'gm-pin', S.layer), name = el('div', 'gm-lab', S.layer, text); name.style.fontSize = size + 'px'; name.style.color = color;
  const off = showDot ? { top: [0, -size * 0.95], bottom: [0, size * 0.95], left: [-1, 0], right: [1, 0] }[side] : [0, 0]; if (!showDot) dot.style.display = 'none';
  return { update(opacity = 1, pop = 1) {
    const p = G.project(lon, lat), o = (p.visible && p.x > SAFE.x0 - 15 && p.x < SAFE.x1 + 15 && p.y > 60 && p.y < H - 60) ? opacity : 0; // hidden behind the globe or outside what an iPhone shows
    dot.style.left = p.x + 'px'; dot.style.top = p.y + 'px'; dot.style.opacity = o; dot.style.transform = `scale(${pop})`;
    let x = p.x + off[0], y = p.y + off[1];
    if (showDot && (side === 'left' || side === 'right')) { const w = name.offsetWidth / 2 + 26; x = p.x + off[0] * w; }
    x += dx; y += dy;
    const hw = name.offsetWidth / 2; x = Math.min(SAFE.x1 - hw, Math.max(SAFE.x0 + hw, x)); // never leave the safe area
    name.style.left = x + 'px'; name.style.top = y + 'px'; name.style.opacity = o; name.style.transform = 'translate(-50%,-50%)';
    return p;
  } };
}

// A route between places that draws itself along the globe. points: [[lon,lat], ...] (the stops, in order).
// lift: how high it arcs above the surface (0 = on the ground, 0.08 = a flight). smooth: round the corners at the stops.
// update(progress, opacity) draws it; progress is by distance, so the tip moves at one steady speed.
// stops[i] = the progress at which the tip reaches stop i (use it to pop that stop's pin). at(progress) = [lon, lat] of the tip (use it to make the camera follow).
export function route(S, G, points, { color = '#9DBEFF', width = 8, lift = 0, glow = true, head = true, smooth = true } = {}) {
  const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', width);
  path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); if (glow) path.setAttribute('filter', 'url(#gm-glow)');
  if (!S.svg.querySelector('#gm-glow')) { const d = document.createElementNS(NS, 'defs'); d.innerHTML = '<filter id="gm-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'; S.svg.appendChild(d); }
  const casing = path.cloneNode(); casing.removeAttribute('filter'); casing.setAttribute('stroke', '#090A11'); casing.setAttribute('stroke-opacity', '.55'); casing.setAttribute('stroke-width', width + 6);   // dark edge so the line reads on bright land
  S.svg.appendChild(casing); S.svg.appendChild(path);
  const tip = head ? el('div', 'gm-pin gm-head', S.layer) : null;
  const U = p => { const lo = p[0] * D2R, la = p[1] * D2R; return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]; };
  const nrm = v => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; };
  const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const P = points.map(U), n = P.length, V = [], D = [0], stopIdx = [0];
  for (let i = 0; i < n - 1; i++) {
    const a = P[i], b = P[i + 1], w = ang(a, b), steps = Math.max(6, Math.ceil(w / D2R));
    const p0 = P[Math.max(0, i - 1)], p3 = P[Math.min(n - 1, i + 2)];
    for (let k = (i ? 1 : 0); k <= steps; k++) { const f = k / steps; let v;
      if (smooth && n > 2) { // Hermite curve with tangents weighted by leg length, so short legs next to long ones do not overshoot or loop
        const d0 = ang(p0, a) || w, d2 = ang(b, p3) || w, f2 = f * f, f3 = f2 * f, h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = -2 * f3 + 3 * f2, h11 = f3 - f2, soft = 0.7;
        v = [0, 1, 2].map(c => { const ma = soft * w * ((b[c] - a[c]) / w * d0 + (a[c] - p0[c]) / d0 * w) / (d0 + w), mb = soft * w * ((p3[c] - b[c]) / d2 * w + (b[c] - a[c]) / w * d2) / (w + d2); return h00 * a[c] + h10 * ma + h01 * b[c] + h11 * mb; }); }
      else { const s = Math.sin(w) || 1, A = Math.sin((1 - f) * w) / s, B = Math.sin(f * w) / s; v = [0, 1, 2].map(c => A * a[c] + B * b[c]); }
      v = nrm(v); if (V.length) D.push(D[D.length - 1] + ang(V[V.length - 1], v)); V.push(v); }
    stopIdx.push(V.length - 1);
  }
  const total = D[D.length - 1] || 1, stops = stopIdx.map(i => D[i] / total);
  const ll = v => [Math.atan2(v[1], v[0]) / D2R, Math.asin(Math.max(-1, Math.min(1, v[2]))) / D2R];
  const vecAt = pr => { const d = cl(pr) * total; let i = 1; while (i < D.length - 1 && D[i] < d) i++; const f = (d - D[i - 1]) / ((D[i] - D[i - 1]) || 1); return { i, v: nrm([0, 1, 2].map(c => V[i - 1][c] + (V[i][c] - V[i - 1][c]) * f)) }; };
  const H = d => lift * Math.sin(Math.PI * d / total);
  return { stops, length: total / D2R,
    at(progress) { return ll(vecAt(progress).v); },
    update(progress = 1, opacity = 1) {
      let d = '', pen = false, last = null;
      if (progress > 0) { const e = vecAt(progress), list = V.slice(0, e.i).map((v, k) => [v, D[k]]); list.push([e.v, cl(progress) * total]);
        for (const [v, dd] of list) { const q = ll(v), p = G.project(q[0], q[1], H(dd));
          if (p.visible) { d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1); pen = true; last = p; } else { pen = false; last = null; } } }
      path.setAttribute('d', d); path.style.opacity = casing.style.opacity = progress > 0 ? opacity : 0; casing.setAttribute('d', d);
      if (tip) { const show = last && progress > 0 && progress < 1; tip.style.opacity = show ? opacity : 0; if (last) { tip.style.left = last.x + 'px'; tip.style.top = last.y + 'px'; } }
    } };
}

// Captions: one short line at a time. list: [[start, end, 'text with <b>highlight</b>'], ...]
// shade: true puts a soft dark band behind the line (use it when the camera is close and there is bright land or sea under the text).
export function captions(S, list, { top = 1524, size = 58, maxWidth = 790, shade = false } = {}) {
  const sh = shade ? el('div', 'gm-shade', S.layer) : null; if (sh) sh.style.top = (top - 190) + 'px';
  const e = el('div', 'gm-cap', S.layer); e.style.top = top + 'px'; let cur = null;
  return { el: e, update(t) {
    let text = '', o = 0;
    for (const c of list) if (t >= c[0] - 0.05 && t <= c[1] + 0.12) { text = c[2]; o = Math.min(cl((t - c[0] + 0.05) / 0.13), 1 - cl((t - c[1]) / 0.12)); }
    if (text !== cur) { cur = text; e.innerHTML = text; e.style.fontSize = size + 'px'; const w = e.scrollWidth; if (w > maxWidth) e.style.fontSize = (size * maxWidth / w) + 'px'; }
    e.style.opacity = o; if (sh) { sh._o = sh._o == null ? o : (o > sh._o ? o : Math.max(o, 0)); sh.style.opacity = o * (shade === true ? 1 : shade); }
  } };
}

// A rolling number (like a car odometer) with a small line above and below, e.g. "قبل / 200 / مليون سنة".
// done: a word that replaces the number when it reaches the end value (e.g. "اليوم").
export function counter(S, { digits = 3, pre = '', post = '', done = '', top = 226 } = {}) {
  const box = el('div', 'gm-hud', S.layer); box.style.top = top + 'px';
  const preE = el('div', 'gm-pre', box, pre), odo = el('div', 'gm-odo', box), postE = el('div', 'gm-post', box, post), doneE = el('div', 'gm-done gm-title', box, done);
  const cols = [];
  for (let j = digits - 1; j >= 0; j--) { const sl = el('div', 'gm-sl', odo), col = el('div', 'gm-col', sl); for (let k = 0; k <= 10; k++) el('div', '', col, String(k % 10)); cols[j] = { sl, col }; }
  return { el: box, set(v, { opacity = 1, doneAt = null, bump = 0 } = {}) {
    v = Math.max(0, v); const u0 = v % 10, fu = u0 - Math.floor(u0), sm0 = cl((fu - 0.62) / 0.38), sm = sm0 * sm0 * (3 - 2 * sm0), c1 = Math.floor(u0) === 9 ? sm : 0;
    let chain = true, hidden = 0;
    for (let j = 0; j < digits; j++) {
      const dv = Math.floor(v / Math.pow(10, j)) % 10, pos = j === 0 ? Math.floor(u0) + sm : dv + (chain ? c1 : 0);
      if (j > 0) chain = chain && dv === 9;
      const op = j === 0 ? 1 : cl((v - (Math.pow(10, j) - 0.8)) / 0.8); hidden += 1 - op;
      cols[j].col.style.transform = `translateY(${-pos * 170}px)`; cols[j].sl.style.opacity = op;
    }
    odo.style.transform = `translateX(${-52 * hidden}px)`;
    const kd = doneAt == null ? 0 : cl((0.6 - Math.abs(v - doneAt)) / 0.35), kn = doneAt == null ? 1 : 1 - cl((1.0 - Math.abs(v - doneAt)) / 0.25);
    for (const e of [preE, odo, postE]) e.style.opacity = kn; doneE.style.opacity = kd; doneE.style.transform = `scale(${1 + 0.13 * bump})`;
    box.style.opacity = opacity;
  } };
}

// A thin timeline with a glowing dot. ticks: [[value, 'label'], ...]. The bar fills between "from" and the value given to set().
// reverse: true puts the max on the left.
export function timeline(S, { min = 0, max = 100, from = min, ticks = [], top = 592, width = 618, reverse = false } = {}) {
  const box = el('div', 'gm-tl', S.layer); box.style.top = top + 'px'; box.style.width = width + 'px'; box.style.left = (W - width) / 2 + 'px';
  el('div', 'gm-tl-ln', box); const fill = el('div', 'gm-tl-fill', box), dot = el('div', 'gm-tl-dot', box);
  const X = v => { const f = cl((v - min) / (max - min)); return width * (reverse ? 1 - f : f); };
  for (const [v, t] of ticks) { const k = el('div', 'gm-tl-tk', box); k.style.left = X(v) + 'px'; const n = el('div', 'gm-tl-tn', box, t); n.style.left = X(v) + 'px'; }
  return { el: box, set(v, opacity = 1) { const x = X(v), x0 = X(from); dot.style.left = x + 'px'; fill.style.left = Math.min(x, x0) + 'px'; fill.style.width = Math.abs(x0 - x) + 'px'; box.style.opacity = opacity; } };
}

// An extra transparent canvas above the globe (used by the block). Returns the canvas.
export function addCanvas(S) { const c = document.createElement('canvas'); c.width = W; c.height = H; c.style.opacity = 0; S.stage.insertBefore(c, S.svg); return c; }

// A raw SVG shape on the overlay (rect, path, line...). attrs: its SVG attributes.
export function shape(S, tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); S.svg.appendChild(e); return e; }
