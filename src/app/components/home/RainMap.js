"use client";
import { useEffect, useRef } from "react";

// Uganda's border (simplified, Natural Earth 1:110m), [lng, lat].
const UGANDA = [
  [31.866, -1.027], [30.77, -1.015], [30.419, -1.135], [29.822, -1.443], [29.579, -1.341], [29.588, -0.587],
  [29.82, -0.205], [29.876, 0.597], [30.086, 1.062], [30.469, 1.584], [30.853, 1.849], [31.174, 2.204],
  [30.773, 2.34], [30.834, 3.509], [31.246, 3.782], [31.881, 3.558], [32.686, 3.792], [33.39, 3.79],
  [34.005, 4.25], [34.479, 3.556], [34.596, 3.054], [35.036, 1.906], [34.672, 1.177], [34.18, 0.515],
  [33.894, 0.11], [33.904, -0.95], [31.866, -1.027],
];
// Extra room at the bottom for the legend.
const BOX = { w: 29.3, e: 35.3, s: -2.3, n: 4.45 };

// The website rain map's blues, light to dark.
const RAMP = [
  [161, 218, 180],
  [65, 182, 196],
  [29, 145, 192],
  [34, 94, 168],
  [37, 52, 148],
  [8, 29, 88],
];

// Where the warning districts are, so the map reads as "our areas".
const PLACES = [
  { name: "Kisoro", lng: 29.685, lat: -1.285, dy: 14 },
  { name: "Kabale", lng: 29.99, lat: -1.249, dy: -6 },
  { name: "Mbarara", lng: 30.654, lat: -0.607 },
  { name: "Kasese", lng: 30.08, lat: 0.18 },
  { name: "Bundibugyo", lng: 30.06, lat: 0.71 },
  { name: "Mbale", lng: 34.175, lat: 1.08 },
  { name: "Kampala", lng: 32.58, lat: 0.35, muted: true },
];

function seeded(n) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Animated rain over Uganda with SIMULATED rain cells: storms drift east to
 * west, grow and fade, and the colour shows how heavy the rain is. An
 * illustration of how the risk map looks, not a forecast.
 */
export default function RainMap({ className = "", showPlaces = true }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext("2d");
    const rand = seeded(7);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let frame = 0;
    let raf = 0;

    // Storm cells in map degrees; each drifts, swells and fades on its own cycle.
    const cells = Array.from({ length: 14 }, () => ({
      lng: BOX.w + rand() * (BOX.e - BOX.w),
      lat: BOX.s + rand() * (BOX.n - BOX.s),
      r: 0.35 + rand() * 0.75,
      peak: 0.35 + rand() * 0.65,
      speed: 0.0025 + rand() * 0.004,
      phase: rand() * Math.PI * 2,
      wobble: rand() * 0.002,
    }));
    const streaks = Array.from({ length: 90 }, () => ({ x: rand(), y: rand(), v: 0.004 + rand() * 0.006 }));

    const project = (lng, lat) => {
      const scale = Math.min(w / (BOX.e - BOX.w), h / (BOX.n - BOX.s));
      const ox = (w - scale * (BOX.e - BOX.w)) / 2;
      const oy = (h - scale * (BOX.n - BOX.s)) / 2;
      return [ox + (lng - BOX.w) * scale, oy + (BOX.n - lat) * scale, scale];
    };

    const outline = () => {
      ctx.beginPath();
      UGANDA.forEach(([lng, lat], i) => {
        const [x, y] = project(lng, lat);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, w, h);

      // Land
      outline();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();

      // Rain, clipped to the country
      ctx.save();
      outline();
      ctx.clip();
      for (const c of cells) {
        if (!reduce) {
          c.lng -= c.speed;
          c.lat += Math.sin(frame * 0.01 + c.phase) * c.wobble;
          if (c.lng < BOX.w - c.r) c.lng = BOX.e + c.r;
        }
        const strength = c.peak * (0.55 + 0.45 * Math.sin(frame * 0.012 + c.phase));
        const [x, y, scale] = project(c.lng, c.lat);
        const radius = c.r * scale;
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const steps = Math.max(1, Math.round(strength * (RAMP.length - 1)));
        // Light rain at the edge, heaviest at the centre, fading out softly.
        for (let i = 0; i <= steps; i += 1) {
          const [r, gg, b] = RAMP[i];
          const t = i / steps;
          g.addColorStop(0.9 * (1 - t), `rgba(${r},${gg},${b},${(0.08 + 0.85 * t ** 1.5) * (0.6 + 0.4 * strength)})`);
        }
        g.addColorStop(1, "rgba(161,218,180,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      // Falling rain streaks
      ctx.strokeStyle = "rgba(200,230,255,0.35)";
      ctx.lineWidth = 1;
      for (const s of streaks) {
        if (!reduce) {
          s.y += s.v;
          s.x -= s.v * 0.3;
          if (s.y > 1) {
            s.y = 0;
            s.x = Math.random();
          }
          if (s.x < 0) s.x = 1;
        }
        ctx.beginPath();
        ctx.moveTo(s.x * w, s.y * h);
        ctx.lineTo(s.x * w - 2, s.y * h + 8);
        ctx.stroke();
      }
      ctx.restore();

      // Border
      outline();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (showPlaces) {
        ctx.font = "600 11px system-ui, sans-serif";
        for (const p of PLACES) {
          const [x, y] = project(p.lng, p.lat);
          ctx.fillStyle = p.muted ? "rgba(255,255,255,0.5)" : "#4ade80";
          ctx.beginPath();
          ctx.arc(x, y, p.muted ? 2.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = p.muted ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.9)";
          ctx.fillText(p.name, x + 6, y + 4 + (p.dy || 0));
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [showPlaces]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} role="img" aria-label="Illustration of rain moving across Uganda" />
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/70 font-[family-name:var(--font-body)]">
        <span className="flex items-center gap-1">
          {RAMP.map((c) => (
            <span key={c.join()} className="inline-block w-4 h-2 rounded-sm" style={{ background: `rgb(${c.join(",")})` }} />
          ))}
          <span className="ml-1">light → heavy rain</span>
        </span>
      </div>
    </div>
  );
}
