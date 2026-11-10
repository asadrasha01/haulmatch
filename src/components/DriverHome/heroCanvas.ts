// Hero canvas animation for the public driver landing page.
// Ported from the "HaulMatch Home" design handoff: a seamless 10s loop over
// the supplied wet-road truck photo — gentle camera drift, rippling road
// reflections, light streaks from the vanishing point, tire spray, a
// soft-light sweep across the truck, pulsing lights and faint drizzle.
// With prefers-reduced-motion we draw a single static frame instead.

const W = 1920;
const H = 1080;
const IMG_W = 1672;
const IMG_H = 941;
const S = W / IMG_W; // scale from image coords to canvas coords
const VP: [number, number] = [320, 662]; // vanishing point (image coords)
const LOOP_SECONDS = 10;

// Polygon outlining the truck (image coords) — excluded from the road ripple
// and used as the clip for the light sweep.
const TRUCK: Array<[number, number]> = [
  [330, 415], [600, 185], [630, 175], [680, 135], [1080, 130], [1110, 215],
  [1165, 300], [1240, 330], [1262, 420], [1340, 470], [1385, 432], [1412, 462],
  [1398, 600], [1416, 700], [1408, 792], [1342, 802], [1332, 828], [1238, 828],
  [1200, 802], [884, 802], [862, 838], [778, 832], [758, 772], [600, 762],
  [560, 768], [500, 748], [400, 702], [350, 698], [328, 640]
];

interface Streak { a: number; c: number; o: number; w: number }
interface Spray { x: number; y: number; k: number; c: number; o: number; dx: number; dy: number; r: number }
interface Drop { x: number; y: number; c: number; l: number }

function makeParticles() {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const streaks: Streak[] = Array.from({ length: 110 }, () => ({
    a: -0.25 + rnd() * 3.3,
    c: 2 + Math.floor(rnd() * 4),
    o: rnd(),
    w: 0.6 + rnd() * 1.4
  }));
  const tires: Array<[number, number, number]> = [
    [360, 690, 0.6], [540, 735, 0.9], [592, 748, 0.9], [826, 812, 1.2]
  ];
  const spray: Spray[] = Array.from({ length: 90 }, (_, i) => {
    const t = tires[i % 4];
    return {
      x: t[0] + rnd() * 30,
      y: t[1] + rnd() * 10,
      k: t[2],
      c: 3 + Math.floor(rnd() * 3),
      o: rnd(),
      dx: -(60 + rnd() * 160),
      dy: -(10 + rnd() * 50),
      r: 14 + rnd() * 26
    };
  });
  const rain: Drop[] = Array.from({ length: 70 }, () => ({
    x: rnd() * IMG_W,
    y: rnd() * IMG_H,
    c: 6 + Math.floor(rnd() * 5),
    l: 14 + rnd() * 22
  }));
  return { streaks, spray, rain };
}

function tracePath(g: CanvasRenderingContext2D, pts: Array<[number, number]>) {
  g.moveTo(pts[0][0] * S, pts[0][1] * S);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * S, pts[i][1] * S);
  g.closePath();
}

function roadClip(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.moveTo(0, 690 * S);
  g.lineTo(330 * S, 655 * S);
  g.lineTo(1420 * S, 700 * S);
  g.lineTo(1672 * S, 720 * S);
  g.lineTo(1672 * S, 941 * S);
  g.lineTo(0, 941 * S);
  g.closePath();
  tracePath(g, TRUCK);
  g.clip('evenodd');
}

/**
 * Starts the hero animation on the provided canvas (expected to be
 * width=1920 height=1080). Returns a cleanup function.
 */
export function startHeroCanvas(canvas: HTMLCanvasElement, src: string): () => void {
  const g = canvas.getContext('2d');
  if (!g) return () => {};

  const { streaks, spray, rain } = makeParticles();
  const still =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let raf = 0;
  let t0 = 0;
  let stopped = false;
  const img = new Image();

  const draw = (t: number) => {
    const TAU = Math.PI * 2;
    const p = ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS / LOOP_SECONDS;
    const vx = VP[0] * S;
    const vy = VP[1] * S;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);

    // Very gentle camera drift — whole cycles so the loop is seamless.
    const sc = 1.006 + 0.004 * Math.sin(TAU * p);
    const dx = -4 * Math.sin(TAU * p);
    const dy = 1.5 * Math.sin(TAU * p + 1);
    g.translate(W / 2 + dx, H / 2 + dy);
    g.scale(sc, sc);
    g.translate(-W / 2, -H / 2);
    g.drawImage(img, 0, 0, W, IMG_H * S);

    // Wet asphalt: rows displaced by travelling sine waves, truck excluded.
    g.save();
    roadClip(g);
    for (let y = 690; y < 941; y += 3) {
      const depth = (y - 690) / 251;
      const off =
        Math.sin(y * 0.09 - TAU * p * 6) * (0.3 + 1.6 * depth) +
        Math.sin(y * 0.023 + TAU * p * 2) * 0.6 * depth;
      g.drawImage(img, 0, y, IMG_W, 3, off * S, y * S, W, 3 * S + 0.5);
    }

    // Faint light streaks radiating from the vanishing point.
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    streaks.forEach((s) => {
      const u = (p * s.c + s.o) % 1;
      const r = (30 + 1900 * u * u) * S;
      const len = (8 + 200 * u * u) * S;
      const cx = Math.cos(s.a);
      const cy = Math.sin(s.a);
      g.strokeStyle = 'rgba(255,214,170,' + 0.13 * Math.sin(Math.PI * u) + ')';
      g.lineWidth = s.w * (0.5 + 2.5 * u);
      g.beginPath();
      g.moveTo(vx + cx * r, vy + cy * r);
      g.lineTo(vx + cx * (r + len), vy + cy * (r + len));
      g.stroke();
    });

    // Lane dashes streaming outward.
    g.globalCompositeOperation = 'source-over';
    (
      [
        [1000, 900, 6, '236,232,224'],
        [1672, 832, 5, '232,190,80'],
        [0, 740, 5, '236,232,224']
      ] as Array<[number, number, number, string]>
    ).forEach(([tx, ty, n, col]) => {
      let ux = tx * S - vx;
      let uy = ty * S - vy;
      const d = Math.hypot(ux, uy);
      ux /= d;
      uy /= d;
      for (let k = 0; k < n; k++) {
        const u = (p * 4 + k / n) % 1;
        const r = (20 + 1900 * u * u) * S;
        const len = (10 + 280 * u * u) * S;
        g.strokeStyle = 'rgba(' + col + ',' + 0.45 * Math.sin(Math.PI * u) + ')';
        g.lineWidth = 1 + 8 * u;
        g.beginPath();
        g.moveTo(vx + ux * r, vy + uy * r);
        g.lineTo(vx + ux * (r + len), vy + uy * (r + len));
        g.stroke();
      }
    });
    g.restore();

    // Tire spray drifting backward from the wheels.
    g.save();
    g.globalCompositeOperation = 'lighter';
    spray.forEach((s) => {
      const u = (p * s.c + s.o) % 1;
      const x = (s.x + s.dx * u) * S;
      const y = (s.y + s.dy * u) * S;
      const r = s.r * (0.5 + 1.6 * u) * S * s.k;
      const a = 0.09 * s.k * Math.sin(Math.PI * Math.min(1, u * 1.3)) * (1 - u);
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(225,230,238,' + a + ')');
      rg.addColorStop(1, 'rgba(225,230,238,0)');
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    g.restore();

    // Soft-light sweep across the polished cab and trailer.
    g.save();
    g.beginPath();
    tracePath(g, TRUCK);
    g.clip();
    g.globalCompositeOperation = 'soft-light';
    const sx = -600 + 2800 * p;
    const lg = g.createLinearGradient(sx - 260, 0, sx + 260, 220);
    lg.addColorStop(0, 'rgba(255,230,190,0)');
    lg.addColorStop(0.5, 'rgba(255,238,210,0.8)');
    lg.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
    g.restore();

    // Headlight / marker-light pulse and ambient sky glow.
    g.save();
    g.globalCompositeOperation = 'lighter';
    const glow = (x: number, y: number, rad: number, col: string, a: number) => {
      const rg = g.createRadialGradient(x * S, y * S, 0, x * S, y * S, rad * S);
      rg.addColorStop(0, col + a + ')');
      rg.addColorStop(1, col + '0)');
      g.fillStyle = rg;
      g.fillRect(x * S - rad * S, y * S - rad * S, rad * 2 * S, rad * 2 * S);
    };
    const hl = 0.3 + 0.06 * Math.sin(TAU * p * 5);
    glow(950, 628, 80, 'rgba(225,240,255,', hl);
    glow(1385, 632, 55, 'rgba(225,240,255,', hl);
    glow(960, 900, 120, 'rgba(225,235,255,', hl * 0.35);
    glow(180, 300, 340 + 20 * Math.sin(TAU * p * 2), 'rgba(255,170,90,', 0.1);
    (
      [
        [850, 276], [962, 280], [1003, 282], [1045, 283], [1140, 293]
      ] as Array<[number, number]>
    ).forEach(([x, y], i) =>
      glow(x, y, 16, 'rgba(255,170,60,', 0.35 + 0.15 * Math.sin(TAU * p * 3 + i))
    );
    g.restore();

    // Light drizzle (drawn in screen space, outside the drift transform).
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.strokeStyle = 'rgba(220,228,240,0.09)';
    g.lineWidth = 1;
    g.beginPath();
    rain.forEach((d) => {
      const y = ((d.y + p * d.c * IMG_H) % IMG_H) * S;
      const x = ((d.x - p * d.c * 160 + IMG_W * 4) % IMG_W) * S;
      g.moveTo(x, y);
      g.lineTo(x - d.l * 0.25 * S, y + d.l * S);
    });
    g.stroke();
  };

  const loop = () => {
    if (stopped) return;
    draw((performance.now() - t0) / 1000);
    raf = requestAnimationFrame(loop);
  };

  img.onload = () => {
    if (stopped) return;
    if (still) {
      // Static frame for prefers-reduced-motion.
      draw(0);
      return;
    }
    t0 = performance.now();
    loop();
  };
  img.src = src;

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
