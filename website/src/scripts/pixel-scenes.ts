// Pixel scenes for Nayki. Each scene returns brightness for a point:
// 0..1 draws in the ink colour, 2..3 draws in the accent colour (brightness minus 2).
// Coordinates are centred: u runs sideways, v runs -0.5..0.5 top to bottom, both in units of the canvas height.
import { ACC, type Scene } from "./pixel";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fract = (v: number) => v - Math.floor(v);
const hash = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const box = (u: number, v: number, cx: number, cy: number, hw: number, hh: number) =>
  Math.abs(u - cx) <= hw && Math.abs(v - cy) <= hh;
const segDist = (u: number, v: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = clamp(((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy));
  return Math.hypot(u - (x1 + t * dx), v - (y1 + t * dy));
};
/** Accent paint with a little ink underneath so the dither stays dense. */
const acc = (l: number) => ACC + clamp(l);

type P = [number, number];

function polyDist(u: number, v: number, pts: P[]) {
  let best = 9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    best = Math.min(best, segDist(u, v, a[0], a[1], b[0], b[1]));
  }
  return best;
}

function polyAt(pts: P[], f: number): P {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lens.push(l);
    total += l;
  }
  let d = fract(f) * total;
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i]!;
    if (d <= l) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const k = d / l;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    d -= l;
  }
  return pts[pts.length - 1]!;
}

/** Streets, blocks, soft risk patches and a route with a marker travelling along it. */
const ROUTE: P[] = [[-0.62, 0.3], [-0.62, 0.02], [-0.12, 0.02], [-0.12, -0.24], [0.5, -0.24]];

const map: Scene = (u, v, t) => {
  // roads
  const nearV = Math.abs(fract((u + 0.06) / 0.25) - 0.5) * 0.25 > 0.118;
  const nearH = Math.abs(fract((v + 0.05) / 0.2) - 0.5) * 0.2 > 0.093;
  const avenue = segDist(u, v, -0.9, -0.42, 0.9, 0.34) < 0.008;
  let l = 0;
  if (nearV || nearH) l = 0.26;
  if (avenue) l = 0.3;
  // buildings
  if (!nearV && !nearH) {
    const bx = Math.floor((u + 0.06) / 0.25);
    const by = Math.floor((v + 0.05) / 0.2);
    if (hash(bx * 13.1 + by * 7.7) > 0.45) l = 0;
  }
  // soft patches: moderate and higher risk, drifting slowly
  const blobs: [number, number, number, number][] = [
    [-0.32, 0.2, 0.2, 0.55],
    [0.38, -0.05, 0.17, 0.8],
    [0.05, 0.32, 0.14, 0.4],
  ];
  let heat = 0;
  for (const [bu, bv, r, k] of blobs) {
    heat = Math.max(heat, k * sm(r, 0, Math.hypot(u - bu, v - bv)) * (0.8 + 0.2 * Math.sin(t * 1.3 + bu * 9)));
  }
  if (heat > 0.18) return acc(heat * 0.7);
  // the route
  const d = polyDist(u, v, ROUTE);
  if (d < 0.011) return acc(1);
  // marker
  const [mu, mv] = polyAt(ROUTE, t * 0.08);
  if (box(u, v, mu, mv, 0.024, 0.024)) return t % 1 < 0.5 ? acc(1) : 1;
  // destination pin
  const end = ROUTE[ROUTE.length - 1]!;
  if (box(u, v, end[0], end[1] - 0.03, 0.02, 0.05)) return 1;
  if (box(u, v, end[0], end[1] + 0.04, 0.04, 0.012)) return 0.7;
  return l;
};

/** Rings that pulse out of a square button. */
const sos: Scene = (u, v, t) => {
  const r = Math.hypot(u, v);
  if (box(u, v, 0, 0, 0.1, 0.1)) {
    if (box(u, v, 0, 0, 0.055, 0.014) || box(u, v, 0, 0, 0.014, 0.055)) return 0;
    return acc(1);
  }
  for (let n = 0; n < 4; n++) {
    const rk = fract(t * 0.16 + n * 0.25) * 0.78 + 0.12;
    if (Math.abs(r - rk) < 0.013) return acc(1 - rk * 0.95);
  }
  // faint street grid behind it
  const gx = Math.abs(fract(u / 0.12) - 0.5) * 0.12 > 0.056;
  const gy = Math.abs(fract(v / 0.12) - 0.5) * 0.12 > 0.056;
  return gx || gy ? 0.1 * (1 - sm(0.2, 0.9, r)) : 0;
};

/** A grid of areas, each one at a risk level or marked as unknown. */
const heat: Scene = (u, v, t) => {
  const c = 0.075;
  const cx = Math.floor(u / c);
  const cy = Math.floor(v / c);
  const lu = fract(u / c);
  const lv = fract(v / c);
  if (lu < 0.1 || lv < 0.1) return 0;
  const h = hash(cx * 17.3 + cy * 31.9);
  if (h > 0.9) return lu > 0.22 && lu < 0.8 && lv > 0.22 && lv < 0.8 ? 0 : 0.55; // unknown: hollow cell
  const risk = clamp(h * 1.05 + 0.12 * Math.sin(t * 0.7 + h * 12) - 0.1);
  if (risk < 0.38) return 0.16;
  if (risk < 0.66) return 0.55;
  return acc(0.35 + risk * 0.65);
};

/** Two ways from A to B: the shorter one and the one with more evidence behind it. */
const A: P = [-0.58, 0.18];
const B: P = [0.58, -0.18];
const SHORT: P[] = [A, [-0.1, 0.18], [0.1, -0.18], B];
const LONG: P[] = [A, [-0.58, 0.38], [0.0, 0.38], [0.58, 0.38], B];
const routes: Scene = (u, v, t) => {
  if (box(u, v, A[0], A[1], 0.035, 0.035) || box(u, v, B[0], B[1], 0.035, 0.035)) return 1;
  const ds = polyDist(u, v, SHORT);
  const dl = polyDist(u, v, LONG);
  const [su, sv] = polyAt(SHORT, t * 0.09);
  const [lu2, lv2] = polyAt(LONG, t * 0.07);
  if (box(u, v, su, sv, 0.02, 0.02)) return 1;
  if (box(u, v, lu2, lv2, 0.022, 0.022)) return acc(1);
  if (dl < 0.01) return acc(0.9);
  if (ds < 0.01) return fract((u + v) * 14) < 0.55 ? 0.8 : 0;
  // street texture
  const gx = Math.abs(fract(u / 0.16) - 0.5) * 0.16 > 0.075;
  const gy = Math.abs(fract(v / 0.16) - 0.5) * 0.16 > 0.075;
  return gx || gy ? 0.14 : 0;
};

/** People and places joined up: nodes, links and pulses running between them. */
const NODES: P[] = [[-0.55, 0.15], [-0.3, -0.2], [-0.05, 0.22], [0.2, -0.12], [0.5, 0.18], [0.0, -0.36], [-0.5, -0.34], [0.55, -0.3]];
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3], [0, 6], [6, 1], [4, 7], [3, 7]];
const network: Scene = (u, v, t) => {
  for (let i = 0; i < NODES.length; i++) {
    const n = NODES[i]!;
    if (box(u, v, n[0], n[1], 0.03, 0.03)) return i % 3 === 0 ? acc(1) : 1;
  }
  for (let i = 0; i < LINKS.length; i++) {
    const [a, b] = LINKS[i]!;
    const p = NODES[a]!;
    const q = NODES[b]!;
    if (segDist(u, v, p[0], p[1], q[0], q[1]) < 0.007) {
      const k = fract(t * 0.18 + i * 0.37);
      const px = p[0] + (q[0] - p[0]) * k;
      const py = p[1] + (q[1] - p[1]) * k;
      if (box(u, v, px, py, 0.02, 0.02)) return acc(1);
      return 0.5;
    }
  }
  return hash(Math.floor(u * 28) * 7 + Math.floor(v * 28) * 131) > 0.985 ? 0.5 : 0;
};

type Centred = (u: number, v: number, t: number) => number;
const centred =
  (f: Centred): Scene =>
  (x, y, t, a) =>
    f(x - a / 2, y - 0.5, t);

export const SCENES: Record<string, Scene> = {
  map: centred(map),
  sos: centred(sos),
  heat: centred(heat),
  routes: centred(routes),
  network: centred(network),
};
