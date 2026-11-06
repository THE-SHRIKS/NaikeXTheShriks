// Where two colour fields meet, one breaks into the other as chunky pixel blocks of mixed sizes.
// The seam is alive: the break line travels as you scroll through it, and the blocks along the
// edge flicker in whole frames, like a sprite sheet.

const COLORS: Record<string, [number, number, number]> = {
  forest: [22, 88, 35],
  cream: [255, 242, 242],
  blush: [255, 218, 218],
};
const CELL = 12;
const FRAME_MS = 140;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const clamp = (v: number) => Math.min(1, Math.max(0, v));

interface Seam {
  wrap: HTMLElement;
  canvas: HTMLCanvasElement;
  from: string;
  to: string;
  salt: number;
  visible: boolean;
  lastKey: string;
  image: ImageData | null;
  cols: number;
  rows: number;
}

const main = document.querySelector("main");
const seams: Seam[] = [];

const themeOf = (el: Element) => (el.classList.contains("forest") ? "forest" : el.classList.contains("blush") ? "blush" : "cream");

const make = (from: string, to: string, salt: number): HTMLElement => {
  const wrap = document.createElement("div");
  wrap.className = "seam";
  wrap.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  wrap.append(canvas);
  seams.push({ wrap, canvas, from, to, salt, visible: false, lastKey: "", image: null, cols: 0, rows: 0 });
  return wrap;
};

const size = (s: Seam) => {
  const rect = s.canvas.getBoundingClientRect();
  s.cols = Math.max(8, Math.ceil(rect.width / CELL));
  s.rows = Math.max(4, Math.ceil(rect.height / CELL));
  s.canvas.width = s.cols;
  s.canvas.height = s.rows;
  s.image = s.canvas.getContext("2d")?.createImageData(s.cols, s.rows) ?? null;
  s.lastKey = "";
};

const paint = (s: Seam, time: number) => {
  const ctx = s.canvas.getContext("2d");
  if (!ctx || !s.image) return;
  const rect = s.wrap.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = reduced ? 0.5 : clamp((vh - rect.top) / (vh + rect.height));
  const frame = reduced ? 0 : Math.floor(time / FRAME_MS);
  const key = `${Math.round(p * 200)}:${frame}`;
  if (key === s.lastKey) return;
  s.lastKey = key;

  const a = COLORS[s.from]!;
  const b = COLORS[s.to]!;
  const { cols, rows, image } = s;
  for (let y = 0; y < rows; y++) {
    const t0 = (y + 0.5) / rows;
    const t = t0 * t0 * (3 - 2 * t0);
    for (let x = 0; x < cols; x++) {
      const bx = Math.floor(x / 2);
      const by = Math.floor(y / 2);
      const coarse = hash(bx * 7.1 + by * 13.7 + s.salt) > 0.5;
      const r = coarse ? hash(bx * 31.3 + by * 57.1 + s.salt * 3) : hash(x * 17.7 + y * 29.3 + s.salt * 5);
      const lane = (hash(Math.floor(x / 9) * 3.3 + s.salt) - 0.5) * 0.2;
      const edge = clamp(t + lane + (p - 0.5) * 0.42) * 1.04;
      const on = Math.abs(r - edge) < 0.075 ? hash(x * 3.7 + y * 9.1 + frame * 1.37 + s.salt) < 0.5 : r < edge;
      const c = on ? b : a;
      const i = (y * cols + x) * 4;
      image.data[i] = c[0];
      image.data[i + 1] = c[1];
      image.data[i + 2] = c[2];
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
};

if (main) {
  const kids = [...main.children].filter((el) => el.tagName === "SECTION");
  let salt = 1;
  for (let i = 0; i < kids.length - 1; i++) {
    const a = themeOf(kids[i]!);
    const b = themeOf(kids[i + 1]!);
    if (a !== b) kids[i]!.after(make(a, b, salt++));
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = seams.find((x) => x.wrap === e.target);
        if (s) s.visible = e.isIntersecting;
      }
    },
    { rootMargin: "120px" },
  );

  seams.forEach((s) => {
    size(s);
    paint(s, 0);
    io.observe(s.wrap);
    new ResizeObserver(() => {
      size(s);
      paint(s, performance.now());
    }).observe(s.canvas);
  });

  if (!reduced) {
    const loop = (time: number) => {
      requestAnimationFrame(loop);
      for (const s of seams) if (s.visible) paint(s, time);
    };
    requestAnimationFrame(loop);
  }
}

export {};
