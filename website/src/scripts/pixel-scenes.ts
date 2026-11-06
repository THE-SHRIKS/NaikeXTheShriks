// Pixel scenes for Nayki. Each scene returns brightness for one canvas cell:
// 0..1 draws in the ink colour, 2..3 draws in the accent colour (brightness minus 2).
// Every scene carries its own on-canvas labels, drawn with a tiny 3x5 pixel font,
// so a figure explains itself. Longer explanations sit in the figure caption on the page.
import { ACC, type Grid, type Scene } from "./pixel";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fract = (v: number) => v - Math.floor(v);
const hash = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const acc = (l: number) => ACC + clamp(l);

/* ───── pixel font, 3 wide by 5 tall ───── */
const GLYPHS: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
  E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
  Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111",
  "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001110001110",
  "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010",
  "8": "111101111101111", "9": "111101111001110",
  "-": "000000111000000", ".": "000000000000010", ":": "000010000010000", "?": "110001010000010",
  "+": "000010111010000", ">": "100010001010100", "/": "001001010100100", " ": "000000000000000",
};

/** True when cell (x, y) is part of `text` drawn with its top-left corner at (ax, ay). */
function textHit(g: Grid, text: string, ax: number, ay: number, scale = 1) {
  const gx = Math.floor((g.x - ax) / scale);
  const gy = Math.floor((g.y - ay) / scale);
  if (gy < 0 || gy > 4 || gx < 0) return false;
  const ci = Math.floor(gx / 4);
  if (ci >= text.length) return false;
  const col = gx - ci * 4;
  if (col > 2) return false;
  const glyph = GLYPHS[text[ci]!] ?? GLYPHS[" "]!;
  return glyph[gy * 3 + col] === "1";
}
const textWidth = (text: string, scale = 1) => (text.length * 4 - 1) * scale;

/** Unit coordinates: u sideways (0 in the middle), v from -0.5 to 0.5 top to bottom, both in canvas heights. */
const toU = (g: Grid) => (g.x + 0.5) / g.rows - g.cols / g.rows / 2;
const toV = (g: Grid) => (g.y + 0.5) / g.rows - 0.5;
const cellX = (g: Grid, u: number) => Math.round(u * g.rows + g.cols / 2);
const cellY = (g: Grid, v: number) => Math.round(v * g.rows + g.rows / 2);
const label = (g: Grid, text: string, u: number, v: number, scale = 1) =>
  textHit(g, text, cellX(g, u), cellY(g, v), scale);

const box = (u: number, v: number, cx: number, cy: number, hw: number, hh: number) =>
  Math.abs(u - cx) <= hw && Math.abs(v - cy) <= hh;
const segDist = (u: number, v: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = clamp(((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy));
  return Math.hypot(u - (x1 + t * dx), v - (y1 + t * dy));
};

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
      return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l];
    }
    d -= l;
  }
  return pts[pts.length - 1]!;
}

/* ═════ FIG: a night walk ═════
   Two ways from A to B across a street grid. The fast one cuts through an unlit patch marked as higher risk.
   The longer one keeps to lit streets and passes a help point. A walker moves along the lit route. */
const A: P = [-0.5, 0.32];
const B: P = [0.55, -0.3];
const FAST: P[] = [A, [-0.5, 0.02], [0.22, 0.02], [0.22, -0.3], B];
const LIT: P[] = [A, [-0.15, 0.32], [-0.15, -0.3], B];
const LAMPS: P[] = [[-0.36, 0.32], [-0.15, 0.2], [-0.15, 0.06], [-0.15, -0.1], [-0.15, -0.24], [0.05, -0.3], [0.32, -0.3], [-0.5, 0.18], [-0.34, 0.02]];
const HELP: P[] = [[-0.02, -0.12], [0.5, 0.22]];
const ROADS_H = [-0.3, 0.02, 0.32];
const ROADS_V = [-0.5, -0.15, 0.22, 0.55];

const nightwalk: Scene = (_x, _y, t, _a, _h, g) => {
  const u = toU(g);
  const v = toV(g);
  const px = 1 / g.rows; // one canvas cell, in units

  // labels first, so they stay readable on top of everything
  if (label(g, "A", A[0] - 0.01, A[1] + 0.05) || label(g, "B", B[0] - 0.01, B[1] - 0.12)) return 1;
  if (label(g, "FAST", -0.47, -0.07)) return 1;
  if (label(g, "LIT", -0.32, 0.25)) return acc(1);
  if (label(g, "RISK", 0.1, 0.13)) return acc(1);
  if (label(g, "HELP", -0.01, -0.21)) return 1;

  // the walker, a blinking figure on the lit route, with a tag
  const [wu, wv] = polyAt(LIT, t * 0.045);
  if (box(u, v, wu, wv, 1.6 * px, 2.4 * px)) return t % 0.5 < 0.25 ? acc(1) : 1;
  if (label(g, "YOU", wu + 0.035, wv - 0.012)) return 1;

  // endpoints
  if (box(u, v, A[0], A[1], 1.8 * px, 1.8 * px) || box(u, v, B[0], B[1], 1.8 * px, 1.8 * px)) return 1;

  // help points: a plus sign
  for (const [hu, hv] of HELP) {
    if (box(u, v, hu, hv, 2.4 * px, 0.6 * px) || box(u, v, hu, hv, 0.6 * px, 2.4 * px)) return 1;
  }

  // the lit route and the fast route (dashed)
  if (polyDist(u, v, LIT) < 0.9 * px) return acc(1);
  if (polyDist(u, v, FAST) < 0.8 * px) return Math.floor((g.x + g.y) / 2) % 2 === 0 ? 1 : 0;

  // higher-risk patch around the dark junction
  const pd = Math.hypot(u - 0.22, v - 0.02);
  const pulse = 0.82 + 0.18 * Math.sin(t * 1.6);
  if (pd < 0.2) return acc(0.75 * sm(0.2, 0.02, pd) * pulse);

  // street lights: a bright dot and a soft glow
  let glow = 0;
  for (const [lu, lv] of LAMPS) {
    const d = Math.hypot(u - lu, v - lv);
    if (d < 1.2 * px) return 1;
    glow = Math.max(glow, sm(0.12, 0, d) * 0.5);
  }
  let road = 0;
  for (const r of ROADS_H) if (Math.abs(v - r) < 0.55 * px) road = 0.3;
  for (const r of ROADS_V) if (Math.abs(u - r) < 0.55 * px) road = 0.3;
  return Math.max(road, glow * 0.55);
};

/* ═════ FIG: the risk gauge ═════
   The four things a risk level is built from, as bars, and the level that results.
   It cycles through lower, moderate, higher and unknown. */
const STATES = [
  { name: "LOWER", vals: [0.92, 0.82, 0.12, 0.9], conf: "0.8", accent: false },
  { name: "MODERATE", vals: [0.55, 0.5, 0.42, 0.72], conf: "0.6", accent: true },
  { name: "HIGHER", vals: [0.2, 0.18, 0.85, 0.85], conf: "0.7", accent: true },
  { name: "UNKNOWN", vals: [0, 0, 0, 0], conf: "0.0", accent: false },
];
const ROWS = ["LIGHT", "HELP", "REPORTS", "DATA"];
const HOLD = 4;

const gauge: Scene = (_x, _y, t, _a, _h, g) => {
  const si = Math.floor(t / HOLD) % STATES.length;
  const prev = STATES[(si + STATES.length - 1) % STATES.length]!;
  const cur = STATES[si]!;
  const p = clamp(((t % HOLD) / HOLD) * 3.2);
  const cx = Math.floor(g.cols / 2);
  const top = Math.max(2, Math.floor(g.rows / 2) - 27);

  for (let i = 0; i < ROWS.length; i++) {
    const ry = top + i * 8;
    if (textHit(g, ROWS[i]!, cx - 40, ry)) return 1;
    const val = prev.vals[i]! + (cur.vals[i]! - prev.vals[i]!) * p;
    const bx = g.x - (cx - 8);
    const by = g.y - ry;
    if (bx >= 0 && bx < 42 && by >= 0 && by <= 4) {
      if (bx % 3 === 2) return 0;
      const lit = Math.floor(bx / 3) < Math.round(val * 14);
      if (lit) return i === 2 ? acc(1) : 1; // the reports row is drawn in rose
      return cur.name === "UNKNOWN" ? (by === 0 || by === 4 ? 0.5 : 0) : 0.12;
    }
  }

  // the result box
  const boxTop = top + 4 * 8 + 2;
  const bx = g.x - (cx - 40);
  const by = g.y - boxTop;
  if (bx >= 0 && bx < 80 && by >= 0 && by < 17) {
    const word = cur.name;
    const tx = cx - Math.floor(textWidth(word, 2) / 2);
    if (textHit(g, word, tx, boxTop + 4, 2)) return cur.accent ? acc(1) : 1;
    const edge = bx < 2 || bx >= 78 || by < 2 || by >= 15;
    if (edge) return cur.name === "UNKNOWN" ? (fract((bx + by) / 4) < 0.5 ? 0.8 : 0) : cur.accent ? acc(1) : 0.9;
    return 0;
  }
  const conf = cur.name === "UNKNOWN" ? "NO DATA" : `CONFIDENCE ${cur.conf}`;
  if (textHit(g, conf, cx - Math.floor(textWidth(conf) / 2), boxTop + 21)) return 0.9;
  return 0;
};

/* ═════ FIG: areas at risk levels, with a legend ═════ */
const heat: Scene = (_x, _y, t, _a, _h, g) => {
  const legendTop = g.rows - 8;
  if (g.y >= legendTop) {
    const items: [string, number][] = [["LOW", 0], ["MID", 1], ["HIGH", 2], ["NONE", 3]];
    const slot = Math.floor(g.cols / 4);
    for (let i = 0; i < 4; i++) {
      const lx = i * slot + 3;
      const [name, kind] = items[i]!;
      const sx = g.x - lx;
      const sy = g.y - (legendTop + 1);
      if (sx >= 0 && sx < 5 && sy >= 0 && sy < 5) {
        if (kind === 0) return 0.16;
        if (kind === 1) return 0.62;
        if (kind === 2) return acc(1);
        return sx === 0 || sx === 4 || sy === 0 || sy === 4 ? 0.8 : 0;
      }
      if (textHit(g, name, lx + 6, legendTop + 1)) return 1;
    }
    return 0;
  }
  const S = 7;
  const gx = Math.floor(g.x / S);
  const gy = Math.floor(g.y / S);
  const lx = g.x % S;
  const ly = g.y % S;
  if (lx === S - 1 || ly === S - 1) return 0;
  const h = hash(gx * 17.3 + gy * 31.9);
  if (h > 0.9) return lx === 0 || ly === 0 || lx === S - 2 || ly === S - 2 ? 0.8 : 0; // unknown: hollow
  const risk = clamp(h * 1.05 + 0.12 * Math.sin(t * 0.7 + h * 12) - 0.1);
  if (risk < 0.38) return 0.16;
  if (risk < 0.66) return 0.62;
  return acc(0.4 + risk * 0.6);
};

/* ═════ FIG: how a project grows ═════
   Five modules and an empty slot marked YOU. Contributors arrive from the edges and plug into modules. */
const MODULES: [string, number, number][] = [
  ["APP", 0.18, 0.3], ["API", 0.5, 0.3], ["DATA", 0.82, 0.3],
  ["MAP", 0.18, 0.72], ["SOS", 0.5, 0.72],
];
const SLOT: [number, number] = [0.82, 0.72];
const LINKS: [number, number][] = [[0, 1], [1, 2], [1, 4], [3, 4]];

const build: Scene = (_x, _y, t, _a, _h, g) => {
  const W = 8;
  const H = 6;
  const cell = (fx: number, fy: number): [number, number] => [Math.round(fx * g.cols), Math.round(fy * g.rows)];

  for (let i = 0; i < MODULES.length; i++) {
    const [name, fx, fy] = MODULES[i]!;
    const [mx, my] = cell(fx, fy);
    const dx = g.x - mx;
    const dy = g.y - my;
    if (Math.abs(dx) <= W && Math.abs(dy) <= H) {
      if (textHit(g, name, mx - Math.floor(textWidth(name) / 2), my - 2)) return 1;
      const edge = Math.abs(dx) >= W - 1 || Math.abs(dy) >= H - 1;
      const working = fract(t * 0.18 + i * 0.21) < 0.45; // someone is working on it
      if (edge) return working ? acc(1) : 0.9;
      return working ? acc(0.18) : 0.1;
    }
  }
  {
    const [sx, sy] = cell(SLOT[0], SLOT[1]);
    const dx = g.x - sx;
    const dy = g.y - sy;
    if (Math.abs(dx) <= W && Math.abs(dy) <= H) {
      if (textHit(g, "YOU", sx - 5, sy - 2)) return Math.floor(t * 2) % 2 === 0 ? acc(1) : 1;
      const edge = Math.abs(dx) >= W - 1 || Math.abs(dy) >= H - 1;
      return edge && fract((dx + dy) / 4) < 0.5 ? acc(1) : 0;
    }
  }
  for (const [a, b] of LINKS) {
    const [ax, ay] = cell(MODULES[a]![1], MODULES[a]![2]);
    const [bx, by] = cell(MODULES[b]![1], MODULES[b]![2]);
    if (segDist(g.x, g.y, ax, ay, bx, by) < 0.6) return 0.45;
  }
  {
    const [ax, ay] = cell(MODULES[4]![1], MODULES[4]![2]);
    const [bx, by] = cell(SLOT[0], SLOT[1]);
    if (segDist(g.x, g.y, ax, ay, bx, by) < 0.6) return (g.x + g.y) % 4 < 2 ? 0.5 : 0;
  }
  // contributors: small dots travelling in from the corners to a module
  for (let k = 0; k < 4; k++) {
    const target = MODULES[(k * 2 + 1) % MODULES.length]!;
    const [tx, ty] = cell(target[1], target[2]);
    const sx = k % 2 === 0 ? 0 : g.cols - 1;
    const sy = k < 2 ? 0 : g.rows - 1;
    const f = fract(t * 0.12 + k * 0.25);
    const e = f < 0.8 ? sm(0, 0.8, f) : 1;
    const px = sx + (tx - sx) * e;
    const py = sy + (ty - sy) * e;
    if (f < 0.85 && Math.abs(g.x - px) < 1.6 && Math.abs(g.y - py) < 1.6) return acc(1);
  }
  return 0;
};

export const SCENES: Record<string, Scene> = { nightwalk, gauge, heat, build };
