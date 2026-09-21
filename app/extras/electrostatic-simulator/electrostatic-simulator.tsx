"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  CMAP_STOPS,
  DEFAULT_PARAMS,
  colormap,
  colormapCss,
  computeContours,
  computeFieldLines,
  computeVectorSamples,
  fieldAt,
  isInBar,
  isInPoint,
  potAt,
  solve,
} from "@/app/extras/electrostatic-simulator/solver";
import type {
  FieldLine,
  LevelSegments,
  SimParams,
  SolveResult,
  VectorField,
} from "@/app/extras/electrostatic-simulator/solver";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PX_PER_CM = 30; // logical pixels per cm of paper
const VIEW3D_W = 900; // fixed 3D viewport width (logical)
const VIEW3D_H = 270; // fixed 3D viewport height (logical)
const DEBOUNCE_MS = 150;

// The "paper" stays a warm dielectric beige in both themes: it is an
// apparatus in the scene rather than part of the page chrome.
const PAPER_BG = "#f1e9d8";
const PAPER_INK = "#5f5747";
const PAPER_LABEL = "#6b6351";
const LEAD_GND = "#41603c";
const LEAD_POS = "#c81e1e";
const YAW_DEFAULT = 0.785; // 45 degrees
const YAW_LIMIT = 1.0; // radians - keeps the base inside the canvas

/* ------------------------------------------------------------------ */
/* Module-scope helpers                                                */
/* ------------------------------------------------------------------ */

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Format a dimension in cm, dropping trailing ".0" (30 -> "30", 31.5 -> "31.5"). */
function fmtDim(v: number): string {
  const n = Math.round(v * 10) / 10;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Format a numeric coordinate readout, trimming to two decimals ("18", "14.5", "24.06"). */
function fmtNum(v: number): string {
  return String(Math.round(v * 100) / 100);
}

/** Compass label for an angle in degrees measured CCW from +x (0 east, 90 north). */
function compassLabel(thDeg: number): string {
  let d = thDeg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  if (d < -157.5 || d >= 157.5) return "← west";
  if (d < -112.5) return "↙ SW";
  if (d < -67.5) return "↓ south";
  if (d < -22.5) return "↘ SE";
  if (d < 22.5) return "→ east";
  if (d < 67.5) return "↗ NE";
  if (d < 112.5) return "↑ north";
  return "↖ NW";
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Fit the canvas backing store to its CSS size (dpr capped at 2) and map
 *  drawing onto a fixed logical coordinate system. */
function fitCanvas(canvas: HTMLCanvasElement, logicalW: number, logicalH: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.max(1, Math.round(rect.width * dpr));
  const bh = Math.max(1, Math.round(rect.width * (logicalH / logicalW) * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  ctx.setTransform(bw / logicalW, 0, 0, bh / logicalH, 0, 0);
  return ctx;
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  len: number,
  hw: number,
  fill: string,
  alpha: number
): void {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x + len * Math.cos(dir), y + len * Math.sin(dir));
  ctx.lineTo(x + hw * Math.cos(dir + 2.55), y + hw * Math.sin(dir + 2.55));
  ctx.lineTo(x + hw * Math.cos(dir - 2.55), y + hw * Math.sin(dir - 2.55));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Working state held between React renders                            */
/* ------------------------------------------------------------------ */

type DisplayToggles = { heat: boolean; lines: boolean; contours: boolean; vectors: boolean; grid: boolean };
type Densities = { lineCount: number; contourCount: number; vectorSpacing: number };

const DEFAULT_TOGGLES: DisplayToggles = { heat: true, lines: true, contours: true, vectors: false, grid: true };
const DEFAULT_DENSITIES: Densities = { lineCount: 18, contourCount: 12, vectorSpacing: 1.5 };

interface WorkingSim {
  result: SolveResult;
  lines: FieldLine[];
  contours: LevelSegments[];
  vectors: VectorField | null;
  heat: HTMLCanvasElement | null;
}

interface Readouts {
  maxEDisplay: number;
  g0: number;
  C: number;
  U: number;
  iterations: number;
  converged: boolean;
}

interface ProbeState {
  x: number;
  y: number;
  pinned: boolean;
}

/** Readout for the coordinate probe: live state of the V / |E| / θ panel. */
type CoordReadout =
  | { state: "ok"; v: number; mag: number; th: number }
  | { state: "offpaper" }
  | { state: "invalid" }
  | { state: "solving" };

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-[var(--foreground)]">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-[var(--accent)]">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[var(--accent)]"
        aria-label={`${label} value`}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--accent-soft)]"
    >
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--muted)]/40"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--border)] py-4 first:border-none first:pt-0">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        {title}
      </p>
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function ReadoutRows({ readouts, params }: { readouts: Readouts | null; params: SimParams }) {
  const rows: { label: string; value: string }[] = [
    { label: "Applied potential V₀", value: `${params.V0.toFixed(1)} V` },
    { label: "Dielectric constant εᵣ", value: `${params.epsr.toFixed(2)}` },
    { label: "Shown max |E|", value: readouts ? `${readouts.maxEDisplay.toFixed(2)} V/cm` : "—" },
    { label: "Geometry factor g₀", value: readouts ? `${readouts.g0.toFixed(4)}` : "—" },
    { label: "Capacitance C*", value: readouts ? `${readouts.C.toFixed(3)}` : "—" },
    { label: "Stored energy U*", value: readouts ? `${readouts.U.toFixed(1)}` : "—" },
  ];
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 bg-[var(--card)] px-3 py-1.5">
            <span className="text-[11px] text-[var(--muted)]">{r.label}</span>
            <span className="font-mono text-[11px] tabular-nums text-[var(--foreground)]">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
        C* and U* are in arbitrary units: they scale with the true capacitance and stored energy.
        {readouts && (
          <span className="block font-mono">
            solver: {readouts.converged ? "converged" : "budget used"} in {readouts.iterations} steps
          </span>
        )}
      </p>
    </div>
  );
}

function ReadoutCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[var(--card)] px-3 py-1.5">
      <span className="text-[11px] text-[var(--muted)]">{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--muted)]">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function ElectrostaticSimulator() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [toggles, setToggles] = useState<DisplayToggles>(DEFAULT_TOGGLES);
  const [densities, setDensities] = useState<Densities>(DEFAULT_DENSITIES);
  const [show3D, setShow3D] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [readouts, setReadouts] = useState<Readouts | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);

  const simRef = useRef<WorkingSim | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const probeRef = useRef<ProbeState | null>(null);
  const downRef = useRef(false);
  const yawRef = useRef(YAW_DEFAULT);
  const seqRef = useRef(0);
  const rafRef = useRef(0);

  const uiRef = useRef<{ params: SimParams; toggles: DisplayToggles; densities: Densities; show3D: boolean }>({
    params: DEFAULT_PARAMS,
    toggles: DEFAULT_TOGGLES,
    densities: DEFAULT_DENSITIES,
    show3D: false,
  });
  // uiRef carries the latest settings to the imperative draw helpers; the sync
  // effect below refreshes it after every commit (nothing reads it in render).

  // Probe-by-coordinates state. Strings keep the inputs editable while typed;
  // xRawRef/yRawRef mirror them so imperative passes (solves, pointer moves)
  // always read the latest raw text.
  const [xStr, setXStr] = useState("18");
  const [yStr, setYStr] = useState("9");
  const xRawRef = useRef("18");
  const yRawRef = useRef("9");
  const [coordReadout, setCoordReadout] = useState<CoordReadout>({ state: "solving" });
  // Last coordinates pinned onto the overlay probe. Solve completions re-render
  // the marker without silently re-pinning a probe the user just released.
  const lastCoordProbeRef = useRef<{ x: number; y: number } | null>(null);

  // Current sheet scale relative to the default 30 × 18 cm paper. Geometry
  // slider ranges stretch with it so values stay inside the browser range.
  const sheetScale = params.paperW / DEFAULT_PARAMS.paperW;

  /* ---------------- derived geometry (imperative helpers) ---------------- */

  const refreshDerived = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    const ui = uiRef.current;
    sim.lines = ui.toggles.lines ? computeFieldLines(sim.result, ui.densities.lineCount) : [];
    sim.contours = ui.toggles.contours ? computeContours(sim.result, ui.densities.contourCount) : [];
    sim.vectors = ui.toggles.vectors ? computeVectorSamples(sim.result, ui.densities.vectorSpacing) : null;
  }, []);

  /* ---------------- main paper renderer ---------------- */

  const drawHeatLayer = useCallback((ctx: CanvasRenderingContext2D, sim: WorkingSim, lw: number, lh: number) => {
    let heat = sim.heat;
    const nx = sim.result.nx;
    const ny = sim.result.ny;
    if (!heat) {
      heat = document.createElement("canvas");
      heat.width = nx;
      heat.height = ny;
      const hctx = heat.getContext("2d");
      if (!hctx) return;
      const img = hctx.createImageData(nx, ny);
      const d = img.data;
      const V = sim.result.V;
      const v0 = sim.result.params.V0 || 1;
      for (let k = 0; k < nx * ny; k++) {
        const c = colormap(V[k] / v0);
        const o = k * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 217; // alpha 0.85
      }
      hctx.putImageData(img, 0, 0);
      sim.heat = heat;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heat, 0, 0, nx, ny, 0, 0, lw, lh);
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, lw: number, lh: number) => {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = PAPER_INK;
    for (let x = 0; x <= lw; x += PX_PER_CM) {
      ctx.globalAlpha = x % (PX_PER_CM * 5) === 0 ? 0.3 : 0.16;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, lh);
      ctx.stroke();
    }
    for (let y = 0; y <= lh; y += PX_PER_CM) {
      ctx.globalAlpha = y % (PX_PER_CM * 5) === 0 ? 0.3 : 0.16;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(lw, y + 0.5);
      ctx.stroke();
    }
    // faint cross marks at every cm intersection, echoing conductive paper
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (let x = 0; x <= lw; x += PX_PER_CM) {
      for (let y = 0; y <= lh; y += PX_PER_CM) {
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x + 2, y);
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x, y + 2);
      }
    }
    ctx.stroke();
    // cm ruler labels along top and left, every 5 cm
    ctx.fillStyle = PAPER_LABEL;
    ctx.font = "9px monospace";
    ctx.globalAlpha = 0.8;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = PX_PER_CM * 5; x <= lw; x += PX_PER_CM * 5) {
      ctx.fillText(String(Math.round(x / PX_PER_CM)), x, 3);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = PX_PER_CM * 5; y < lh; y += PX_PER_CM * 5) {
      ctx.fillText(String(Math.round(y / PX_PER_CM)), 7, y);
    }
    ctx.restore();
  }, []);

  const contourSpotScore = useCallback((x: number, y: number, p: SimParams): number => {
    if (isInBar(p, x, y) || isInPoint(p, x, y)) return -Infinity;
    const dPoint = Math.hypot(x - p.cx, y - p.cy) - p.rp;
    const edge = Math.min(x, p.paperW - x, y, p.paperH - y);
    return Math.min(dPoint, edge);
  }, []);

  const drawContours = useCallback(
    (ctx: CanvasRenderingContext2D, contours: LevelSegments[], params: SimParams) => {
      const pen = "#54412e"; // warm ink, "printed" on the conductive paper
      ctx.save();
      ctx.lineCap = "round";
      for (const lv of contours) {
        if (lv.coords.length < 4) continue;
        // paper-colored halo keeps contours legible over any heat-map color
        ctx.strokeStyle = PAPER_BG;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let q = 0; q < lv.coords.length; q += 4) {
          ctx.moveTo(lv.coords[q] * 30, lv.coords[q + 1] * 30);
          ctx.lineTo(lv.coords[q + 2] * 30, lv.coords[q + 3] * 30);
        }
        ctx.stroke();
        ctx.strokeStyle = pen;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let q = 0; q < lv.coords.length; q += 4) {
          ctx.moveTo(lv.coords[q] * 30, lv.coords[q + 1] * 30);
          ctx.lineTo(lv.coords[q + 2] * 30, lv.coords[q + 3] * 30);
        }
        ctx.stroke();
      }

      // label a few levels where there is room (away from conductors and edges)
      const n = contours.length;
      const labelSel = [Math.round(n / 3), Math.round(n / 2), Math.round((2 * n) / 3)]
        .filter((k) => k >= 1 && k <= n)
        .filter((k, i, arr) => arr.indexOf(k) === i);
      ctx.font = "10px monospace";
      ctx.fillStyle = pen;
      ctx.globalAlpha = 0.7;
      ctx.textAlign = "center";
      for (const k of labelSel) {
        const lv = contours[k - 1];
        const coords = lv.coords;
        if (coords.length < 4) continue;
        let bestScore = -Infinity;
        let bx = 0;
        let by = 0;
        for (let q = 0; q < coords.length; q += 4) {
          const mx = (coords[q] + coords[q + 2]) / 2;
          const my = (coords[q + 1] + coords[q + 3]) / 2;
          const score = contourSpotScore(mx, my, params);
          if (score > bestScore) {
            bestScore = score;
            bx = mx;
            by = my;
          }
        }
        if (Number.isFinite(bestScore) && bestScore > 0.4) {
          ctx.fillText(`${lv.iso.toFixed(1)} V`, bx * 30, by * 30 - 4);
        }
      }
      ctx.restore();
    },
    [contourSpotScore]
  );

  const drawFieldLines = useCallback((ctx: CanvasRenderingContext2D, lines: FieldLine[], params: SimParams) => {
    const accent = cssVar("--accent", "#0891b2");
    const alpha = 0.9;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const line of lines) {
      const pts = line.pts;
      if (pts.length < 4) continue;
      // dark under-stroke keeps the accent visible over the heat map
      ctx.strokeStyle = "rgba(5,7,13,0.42)";
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(pts[0] * 30, pts[1] * 30);
      for (let q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q] * 30, pts[q + 1] * 30);
      ctx.stroke();

      ctx.strokeStyle = accent;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(pts[0] * 30, pts[1] * 30);
      for (let q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q] * 30, pts[q + 1] * 30);
      ctx.stroke();

      // Arrowhead only when the line actually ended on a conductor or the paper
      // edge: at very low V0 a line can die in a weak-field dead zone, and an
      // arrowhead floating in mid-air would misrepresent that.
      const n = pts.length;
      const ex = pts[n - 2];
      const ey = pts[n - 1];
      const terminated =
        isInBar(params, ex, ey) ||
        isInPoint(params, ex, ey) ||
        ex <= 0.05 ||
        ex >= params.paperW - 0.05 ||
        ey <= 0.05 ||
        ey >= params.paperH - 0.05;
      if (terminated) {
        const dir = Math.atan2(pts[n - 1] - pts[n - 3], pts[n - 2] - pts[n - 4]);
        arrowHead(ctx, ex * 30, ey * 30, dir, 5.5, 3, accent, alpha);
      }
    }
    ctx.restore();
  }, []);

  const drawVectors = useCallback((ctx: CanvasRenderingContext2D, vectors: VectorField) => {
    const { samples, scaleK, maxDisp } = vectors;
    ctx.save();
    ctx.lineCap = "round";
    for (const s of samples) {
      const lenCm = clamp(s.disp * scaleK, 0.15, 1.8);
      const len = lenCm * 30;
      const m = Math.hypot(s.ex, s.ey);
      if (m <= 1e-9) continue;
      const dx = (s.ex / m) * len;
      const dy = (s.ey / m) * len;
      const x1 = s.x * 30;
      const y1 = s.y * 30;
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      const color = colormapCss(maxDisp > 0 ? clamp(s.disp / maxDisp, 0, 1) : 0);
      ctx.strokeStyle = "rgba(5,7,13,0.35)";
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const dir = Math.atan2(dy, dx);
      arrowHead(ctx, x2, y2, dir, 4.5, 2.6, color, 1);
    }
    ctx.restore();
  }, []);

  const drawConductors = useCallback(
    (ctx: CanvasRenderingContext2D, p: SimParams, lw: number, lh: number) => {
      const cxp = p.cx * PX_PER_CM;
      const cyp = p.cy * PX_PER_CM;
      const R = p.rp * PX_PER_CM;
      const bxp = p.bx * PX_PER_CM;
      const byp = p.by * PX_PER_CM;
      const halfLen = (p.barLen * PX_PER_CM) / 2;
      const halfThick = PX_PER_CM / 2;

      // nearest paper edge for the ground lead
      const dRight = p.paperW - p.bx;
      const dLeft = p.bx;
      const dBottom = p.paperH - p.by;
      const dTop = p.by;
      const edge =
        dRight <= dLeft && dRight <= dBottom && dRight <= dTop
          ? "right"
          : dLeft <= dBottom && dLeft <= dTop
            ? "left"
            : dBottom <= dTop
              ? "bottom"
              : "top";
      const leadEndX = edge === "right" ? lw : edge === "left" ? 0 : bxp;
      const leadEndY = edge === "bottom" ? lh : edge === "top" ? 0 : byp;

      ctx.save();
      ctx.lineCap = "round";

      // leads under the conductors
      ctx.strokeStyle = LEAD_GND;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bxp, byp);
      ctx.lineTo(leadEndX, leadEndY);
      ctx.stroke();

      ctx.strokeStyle = LEAD_POS;
      ctx.beginPath();
      ctx.moveTo(cxp, cyp + R);
      ctx.lineTo(cxp, lh - 2);
      ctx.stroke();

      // ground bar (brushed metal, rounded)
      ctx.save();
      ctx.translate(bxp, byp);
      ctx.rotate((p.barAngleDeg * Math.PI) / 180);
      ctx.shadowColor = "rgba(20,16,8,0.4)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      const metal = ctx.createLinearGradient(0, -halfThick, 0, halfThick);
      metal.addColorStop(0, "#eef0f4");
      metal.addColorStop(0.35, "#d4d9e2");
      metal.addColorStop(1, "#8f98a8");
      ctx.fillStyle = metal;
      rr(ctx, -halfLen, -halfThick, halfLen * 2, halfThick * 2, 8);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(5,7,13,0.25)";
      ctx.lineWidth = 1;
      rr(ctx, bxp - halfLen, byp - halfThick, halfLen * 2, halfThick * 2, 8);
      ctx.stroke();

      // point conductor (metallic disk, red ring = positive terminal)
      ctx.save();
      ctx.shadowColor = "rgba(20,16,8,0.4)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      const metal2 = ctx.createRadialGradient(cxp - R * 0.3, cyp - R * 0.35, R * 0.15, cxp, cyp, R);
      metal2.addColorStop(0, "#f5f7fa");
      metal2.addColorStop(0.6, "#c6cdd9");
      metal2.addColorStop(1, "#79828f");
      ctx.fillStyle = metal2;
      ctx.beginPath();
      ctx.arc(cxp, cyp, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#d22b2b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cxp, cyp, R + 1.5, 0, Math.PI * 2);
      ctx.stroke();
      const s = R * 0.45;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cxp - s, cyp);
      ctx.lineTo(cxp + s, cyp);
      ctx.moveTo(cxp, cyp - s);
      ctx.lineTo(cxp, cyp + s);
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  const drawColorbar = useCallback((ctx: CanvasRenderingContext2D, params: SimParams, lw: number, lh: number) => {
    const x0 = lw - 28;
    const w = 12;
    const y0 = Math.round(lh * 0.06);
    const y1 = Math.round(lh * 0.925);
    ctx.save();
    ctx.fillStyle = "rgba(20,18,14,0.12)";
    rr(ctx, x0 - 20, y0 - 20, w + 58, y1 - y0 + 40, 8);
    ctx.fill();
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    CMAP_STOPS.forEach((c, k) => {
      grad.addColorStop(k / (CMAP_STOPS.length - 1), `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
    });
    ctx.fillStyle = grad;
    rr(ctx, x0, y0, w, y1 - y0, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(20,18,14,0.3)";
    ctx.lineWidth = 1;
    rr(ctx, x0, y0, w, y1 - y0, 3);
    ctx.stroke();
    ctx.font = "9px monospace";
    ctx.fillStyle = PAPER_LABEL;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${params.V0.toFixed(1)} V`, x0 + w + 4, y0 + 2);
    ctx.fillText("0 V", x0 + w + 4, y1 - 2);
    ctx.restore();
  }, []);

  const drawCornerNote = useCallback((ctx: CanvasRenderingContext2D, params: SimParams, lw: number, lh: number) => {
    ctx.save();
    ctx.font = "9px monospace";
    ctx.fillStyle = PAPER_INK;
    ctx.globalAlpha = 0.75;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`Paper ${fmtDim(params.paperW)} × ${fmtDim(params.paperH)} cm · 1 cm grid`, 8, lh - 7);
    ctx.restore();
  }, []);

  const drawPendingNote = useCallback((ctx: CanvasRenderingContext2D, lw: number, lh: number) => {
    ctx.save();
    ctx.font = "12px monospace";
    ctx.fillStyle = PAPER_INK;
    ctx.globalAlpha = 0.65;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("solving the potential field…", lw / 2, lh / 2);
    ctx.restore();
  }, []);

  const renderMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ui = uiRef.current;
    const lw = Math.round(ui.params.paperW * PX_PER_CM);
    const lh = Math.round(ui.params.paperH * PX_PER_CM);
    const ctx = fitCanvas(canvas, lw, lh);
    if (!ctx) return;
    const sim = simRef.current;
    // A stale solve (params changed, debounce still running) uses another
    // sheet geometry: draw only the paper shell so nothing is distorted.
    const fresh = !!sim && sim.result.paperW === ui.params.paperW && sim.result.paperH === ui.params.paperH;

    ctx.clearRect(0, 0, lw, lh);
    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, lw, lh);

    if (fresh && sim) {
      if (ui.toggles.heat) drawHeatLayer(ctx, sim, lw, lh);
    } else {
      drawPendingNote(ctx, lw, lh);
    }

    if (ui.toggles.grid) drawGrid(ctx, lw, lh);

    if (fresh && sim) {
      if (ui.toggles.contours && sim.contours.length > 0) drawContours(ctx, sim.contours, ui.params);
      if (ui.toggles.lines && sim.lines.length > 0) drawFieldLines(ctx, sim.lines, ui.params);
      if (ui.toggles.vectors && sim.vectors && sim.vectors.samples.length > 0) drawVectors(ctx, sim.vectors);
    }

    drawConductors(ctx, ui.params, lw, lh);
    if (fresh && sim && ui.toggles.heat) drawColorbar(ctx, ui.params, lw, lh);
    drawCornerNote(ctx, ui.params, lw, lh);
  }, [drawHeatLayer, drawGrid, drawContours, drawFieldLines, drawVectors, drawConductors, drawColorbar, drawCornerNote, drawPendingNote]);

  /* ---------------- probe overlay ---------------- */

  const drawCrosshair = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, primary: boolean) => {
    ctx.save();
    if (primary) {
      const accent = cssVar("--accent", "#0891b2");
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = cssVar("--muted", "#4b5563");
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x + 9, y);
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x, y + 9);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }, []);

  // Short arrow at a pinned probe showing the E-field direction on the paper.
  // Canvas y points down, so the raw atan2(ey, ex) angle points the way the
  // field lines actually run (matching the drawn lines, not a north-up compass).
  const drawEArrow = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, ex: number, ey: number) => {
    const m = Math.hypot(ex, ey);
    if (m <= 1e-9) return;
    const accent = cssVar("--accent", "#0891b2");
    const dir = Math.atan2(ey, ex);
    const startR = 11; // clears the crosshair ring (radius 8)
    const len = 11;
    const x1 = x + startR * Math.cos(dir);
    const y1 = y + startR * Math.sin(dir);
    const x2 = x1 + len * Math.cos(dir);
    const y2 = y1 + len * Math.sin(dir);
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    arrowHead(ctx, x2, y2, dir, 5, 3, accent, 0.95);
    ctx.restore();
  }, []);

  const renderOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ui = uiRef.current;
    const lw = Math.round(ui.params.paperW * PX_PER_CM);
    const lh = Math.round(ui.params.paperH * PX_PER_CM);
    const ctx = fitCanvas(canvas, lw, lh);
    if (!ctx) return;
    ctx.clearRect(0, 0, lw, lh);
    const sim = simRef.current;
    if (!sim) return;
    const fresh = sim.result.paperW === ui.params.paperW && sim.result.paperH === ui.params.paperH;

    const hover = hoverRef.current;
    const probe = probeRef.current;
    const showProbe = !!probe && probe.pinned;
    if (hover) drawCrosshair(ctx, hover.x * PX_PER_CM, hover.y * PX_PER_CM, false);
    if (showProbe) drawCrosshair(ctx, probe.x * PX_PER_CM, probe.y * PX_PER_CM, true);

    // Direction arrow for the pinned probe (coordinate probe and pointer probe alike).
    if (showProbe && fresh) {
      const f = fieldAt(sim.result, probe!.x, probe!.y);
      drawEArrow(ctx, probe!.x * PX_PER_CM, probe!.y * PX_PER_CM, f.ex, f.ey);
    }

    if (!fresh) return;

    const anchor = showProbe ? probe : hover;
    if (!anchor) return;

    const v = potAt(sim.result, anchor.x, anchor.y);
    const f = fieldAt(sim.result, anchor.x, anchor.y);
    const mag = Math.hypot(f.ex, f.ey);
    const text = `V = ${v.toFixed(2)} V   |E| = ${mag.toFixed(2)} V/cm`;

    ctx.save();
    ctx.font = "10px monospace";
    const tw = ctx.measureText(text).width;
    const bw = tw + 16;
    const bh = 18;
    let bx = anchor.x * PX_PER_CM + 12;
    let by = anchor.y * PX_PER_CM - bh - 10;
    if (bx + bw > lw - 4) bx = anchor.x * PX_PER_CM - bw - 12;
    if (by < 4) by = anchor.y * PX_PER_CM + 14;
    ctx.fillStyle = "rgba(20,18,14,0.78)";
    rr(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.fillStyle = "#f4efe2";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 8, by + bh / 2 + 0.5);
    ctx.restore();
  }, [drawCrosshair, drawEArrow]);

  /* ---------------- 3D surface painter ---------------- */

  const draw3D = useCallback(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = fitCanvas(canvas, VIEW3D_W, VIEW3D_H);
    if (!ctx) return;

    const W = VIEW3D_W;
    const H = VIEW3D_H;
    const sim = simRef.current;
    const ui = uiRef.current;
    const pw = ui.params.paperW;
    const ph = ui.params.paperH;
    const fresh = !!sim && sim.result.paperW === pw && sim.result.paperH === ph;

    const yaw = yawRef.current;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    // Keep the paper's projected footprint constant whatever its size
    // (matches 900/48 and 270/64 at the default 30 x 18 cm sheet).
    const SCX = W / (1.6 * Math.max(pw, ph));
    const SCY = H / (1.3334 * (pw + ph));
    const SZ = 0.27 * H;
    const OX = W / 2;
    const OY = Math.round(H * 0.367);

    const proj = (x: number, y: number, z: number): [number, number] => {
      return [(x - y) * cosY * SCX + OX, (x + y) * sinY * SCY - z * SZ + OY];
    };

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.lineJoin = "round";

    // paper base silhouette
    const basePts = [proj(0, 0, 0), proj(pw, 0, 0), proj(pw, ph, 0), proj(0, ph, 0)];
    ctx.fillStyle = "#e9dfc6";
    ctx.beginPath();
    ctx.moveTo(basePts[0][0], basePts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(basePts[i][0], basePts[i][1]);
    ctx.closePath();
    ctx.fill();

    if (sim && fresh) {
      // subsample so the quad count stays close to the default sheet's
      // (2 x 2 on 241 x 145) — bigger sheets sample more coarsely.
      const res = sim.result;
      const step = Math.max(2, Math.round(Math.sqrt((res.nx * res.ny) / 9000)));
      const nii = Math.floor((res.nx - 1) / step) + 1;
      const njj = Math.floor((res.ny - 1) / step) + 1;
      const cell = res.cell;
      const v0 = Math.max(res.params.V0, 1e-9);

      const zc = new Float64Array(nii * njj);
      const sx0 = new Float64Array(nii * njj);
      const sy0 = new Float64Array(nii * njj);
      for (let jj = 0; jj < njj; jj++) {
        const j = jj * step;
        const row = j * res.nx;
        const yCm = j * cell;
        for (let ii = 0; ii < nii; ii++) {
          const i = ii * step;
          const idx = jj * nii + ii;
          zc[idx] = clamp(res.V[row + i] / v0, 0, 1);
          const xCm = i * cell;
          sx0[idx] = (xCm - yCm) * cosY * SCX + OX;
          sy0[idx] = (xCm + yCm) * sinY * SCY + OY;
        }
      }

      // fixed light direction + exaggerated normals for readable shading
      const lightLen = Math.hypot(0.35, -0.28, 1);
      const LX = 0.35 / lightLen;
      const LY = -0.28 / lightLen;
      const LZ = 1 / lightLen;
      const K = 10; // slope exaggeration factor (aesthetic)
      const g2 = 2 * step * cell; // physical spacing between samples, cm

      const paintQuad = (jj: number, ii: number) => {
        const base = jj * nii;
        const qa = base + ii;
        const qb = qa + 1;
        const qc = base + nii + 1;
        const qd = base + nii;
        const zA = zc[qa];
        const zB = zc[qb];
        const zC = zc[qc];
        const zD = zc[qd];
        const zM = (zA + zB + zC + zD) * 0.25;

        let dzx = 0;
        let dzy = 0;
        if (ii > 0 && ii < nii - 2) dzx = (zc[qa + 1] - zc[qa - 1]) / g2;
        if (jj > 0 && jj < njj - 2) dzy = (zc[base + nii + ii] - zc[base - nii + ii]) / g2;
        const nx = -dzx * K;
        const ny = -dzy * K;
        const inv = 1 / Math.hypot(nx, ny, 1);
        const shade = Math.max(0, (nx * LX + ny * LY + LZ) * inv);

        const [r, g, b] = colormap(zM);
        const k = 0.58 + 0.42 * shade;
        ctx.fillStyle = `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
        ctx.strokeStyle = "rgba(5,7,13,0.06)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(sx0[qa], sy0[qa] - zA * SZ);
        ctx.lineTo(sx0[qb], sy0[qb] - zB * SZ);
        ctx.lineTo(sx0[qc], sy0[qc] - zC * SZ);
        ctx.lineTo(sx0[qd], sy0[qd] - zD * SZ);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(5,7,13,0.05)";
      for (let jj = 0; jj < njj - 1; jj++) {
        if (sinY >= 0) {
          for (let ii = 0; ii < nii - 1; ii++) paintQuad(jj, ii);
        } else {
          for (let ii = nii - 2; ii >= 0; ii--) paintQuad(jj, ii);
        }
      }

      // axis + peak labels
      const labelColor = cssVar("--muted", "#4b5563");
      ctx.font = "11px monospace";
      ctx.fillStyle = labelColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lx = proj(pw + 1.4, 0, 0);
      ctx.fillText("x", lx[0], lx[1]);
      const ly = proj(0, ph + 1.4, 0);
      ctx.fillText("y", ly[0], ly[1]);
      const lv = proj(sim.result.params.cx, sim.result.params.cy, 1);
      ctx.fillText("V", lv[0], lv[1] - 16);
    }

    ctx.restore();
  }, []);

  /* ---------------- probe pointer handlers ---------------- */

  // Recompute the V / |E| / θ panel from the latest typed coordinates and the
  // latest solve, and pin the shared overlay probe there so the on-canvas tag
  // agrees. Reads raw text via refs so callers (input handlers, pointer moves,
  // solve completion) always see the freshest values. While the solve for the
  // current params is pending, or before the first solve, the panel shows "—".
  const recomputeCoordProbe = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.result.params !== params) {
      setCoordReadout({ state: "solving" });
      return;
    }
    const x = Number(xRawRef.current);
    const y = Number(yRawRef.current);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setCoordReadout({ state: "invalid" });
      return;
    }
    if (x < 0 || x > params.paperW || y < 0 || y > params.paperH) {
      setCoordReadout({ state: "offpaper" });
      return;
    }
    const v = potAt(sim.result, x, y);
    const f = fieldAt(sim.result, x, y);
    const mag = Math.hypot(f.ex, f.ey);
    setCoordReadout({ state: "ok", v, mag, th: (Math.atan2(f.ey, f.ex) * 180) / Math.PI });

    const last = lastCoordProbeRef.current;
    if (!last || last.x !== x || last.y !== y) {
      lastCoordProbeRef.current = { x, y };
      probeRef.current = { x, y, pinned: true };
    }
    // Re-paint either way so the tag shows fresh field values under the probe.
    renderOverlay();
  }, [params, renderOverlay]);

  // Coordinate-input change: accept the raw text, mirror it in the refs so
  // solves and pointers read the latest value, then recompute the readout.
  const handleCoordInput = useCallback(
    (isY: boolean, raw: string) => {
      if (isY) {
        yRawRef.current = raw;
        setYStr(raw);
      } else {
        xRawRef.current = raw;
        setXStr(raw);
      }
      recomputeCoordProbe();
    },
    [recomputeCoordProbe]
  );

  const toCm = useCallback((e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const p = uiRef.current.params;
    const x = clamp(((e.clientX - rect.left) / rect.width) * p.paperW, 0, p.paperW);
    const y = clamp(((e.clientY - rect.top) / rect.height) * p.paperH, 0, p.paperH);
    return { x, y };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const cm = toCm(e);
      if (downRef.current && probeRef.current?.pinned) {
        probeRef.current = { ...probeRef.current, x: cm.x, y: cm.y };
        // Keep the coordinate inputs in step with the dragged probe so the
        // readout panel, the on-canvas tag and the inputs all agree.
        xRawRef.current = fmtNum(cm.x);
        yRawRef.current = fmtNum(cm.y);
        setXStr(xRawRef.current);
        setYStr(yRawRef.current);
        recomputeCoordProbe();
      } else {
        hoverRef.current = cm;
        renderOverlay();
      }
    },
    [toCm, recomputeCoordProbe, renderOverlay]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      overlayRef.current?.setPointerCapture?.(e.pointerId);
      downRef.current = true;
      const cm = toCm(e);
      const p = probeRef.current;
      if (p?.pinned && Math.hypot(p.x - cm.x, p.y - cm.y) < 0.7) {
        probeRef.current = { ...p, pinned: false };
        renderOverlay();
      } else {
        probeRef.current = { x: cm.x, y: cm.y, pinned: true };
        xRawRef.current = fmtNum(cm.x);
        yRawRef.current = fmtNum(cm.y);
        setXStr(xRawRef.current);
        setYStr(yRawRef.current);
        recomputeCoordProbe();
      }
      hoverRef.current = cm;
    },
    [toCm, recomputeCoordProbe, renderOverlay]
  );

  const handlePointerEnd = useCallback(() => {
    downRef.current = false;
    renderOverlay();
  }, [renderOverlay]);

  const handlePointerLeave = useCallback(() => {
    if (!downRef.current) hoverRef.current = null;
    renderOverlay();
  }, [renderOverlay]);

  const handleDoubleClick = useCallback(() => {
    probeRef.current = probeRef.current ? { ...probeRef.current, pinned: false } : null;
    renderOverlay();
  }, [renderOverlay]);

  /* ---------------- 3D drag handlers ---------------- */

  const on3DPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    canvas3DRef.current?.setPointerCapture?.(e.pointerId);
    downRef.current = true;
  }, []);

  const on3DPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!downRef.current) return;
      yawRef.current = clamp(yawRef.current + e.movementX * 0.008, -YAW_LIMIT, YAW_LIMIT);
      if (canvas3DRef.current) {
        fitCanvas(canvas3DRef.current, VIEW3D_W, VIEW3D_H);
        draw3D();
      }
    },
    [draw3D]
  );

  const on3DPointerUp = useCallback(() => {
    downRef.current = false;
  }, []);

  const on3DDoubleClick = useCallback(() => {
    yawRef.current = YAW_DEFAULT;
    if (canvas3DRef.current) {
      fitCanvas(canvas3DRef.current, VIEW3D_W, VIEW3D_H);
      draw3D();
    }
  }, [draw3D]);

  /* ---------------- effects ---------------- */

  // 0. Keep uiRef in step with the current settings for the imperative draw
  // helpers (renderMain / renderOverlay / draw3D / toCm), all of which run
  // from effects and event handlers — never during render itself.
  useEffect(() => {
    uiRef.current = { params, toggles, densities, show3D };
  });

  // 1. Debounced solve on physics-parameter change.
  useEffect(() => {
    const token = ++seqRef.current;
    const id = window.setTimeout(() => {
      setIsComputing(true);
      // A pending solve means the current sheet geometry may differ from the
      // last result; the coordinate probe must not read the stale field.
      setCoordReadout({ state: "solving" });
      // double rAF guarantees the indicator is painted before the synchronous solve
      requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          if (token !== seqRef.current) return;
          const result = solve(params);
          simRef.current = {
            result,
            lines: [],
            contours: [],
            vectors: null,
            heat: null,
          };
          refreshDerived();
          setReadouts({
            maxEDisplay: result.maxE,
            g0: result.g0,
            C: result.Cstar,
            U: result.Ustar,
            iterations: result.iterations,
            converged: result.converged,
          });
          renderMain();
          if (uiRef.current.show3D && canvas3DRef.current) draw3D();
          recomputeCoordProbe();
          setIsComputing(false);
        });
        rafRef.current = raf2;
      });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(rafRef.current);
    };
  }, [params, refreshDerived, renderMain, draw3D, recomputeCoordProbe]);

  // 2. Rebuild overlay geometry when only display settings change (no re-solve).
  useEffect(() => {
    if (!simRef.current) return;
    refreshDerived();
    renderMain();
  }, [toggles, densities, refreshDerived, renderMain]);

  // 3. Size canvases, draw the paper shell, watch for container resizes.
  const fitAll = useCallback(() => {
    if (!mainCanvasRef.current) return;
    renderMain();
    renderOverlay();
    if (canvas3DRef.current) {
      fitCanvas(canvas3DRef.current, VIEW3D_W, VIEW3D_H);
      draw3D();
    }
  }, [renderMain, renderOverlay, draw3D]);

  useEffect(() => {
    fitAll();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => fitAll());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [fitAll]);

  // 4. Re-render when the page theme flips (accent colors used on the paper).
  useEffect(() => {
    const mo = new MutationObserver(() => {
      renderMain();
      renderOverlay();
      if (canvas3DRef.current) draw3D();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [renderMain, renderOverlay, draw3D]);

  // 5. Draw the 3D surface when its card opens.
  useEffect(() => {
    if (!show3D) return;
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    fitCanvas(canvas, VIEW3D_W, VIEW3D_H);
    draw3D();
  }, [show3D, draw3D]);

  // 6. Escape releases the probe.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        probeRef.current = probeRef.current ? { ...probeRef.current, pinned: false } : null;
        renderOverlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [renderOverlay]);

  /* ---------------- reset ---------------- */

  const resetDefaults = useCallback(() => {
    setParams({ ...DEFAULT_PARAMS });
    setToggles({ ...DEFAULT_TOGGLES });
    setDensities({ ...DEFAULT_DENSITIES });
    yawRef.current = YAW_DEFAULT;
  }, []);

  // Scale the whole experiment about the default layout: paper, point and bar
  // all keep their relative geometry; V0, epsr and the bar angle are untouched.
  const setSheetScale = useCallback((s: number) => {
    setParams((p) => ({
      ...p,
      paperW: DEFAULT_PARAMS.paperW * s,
      paperH: DEFAULT_PARAMS.paperH * s,
      cx: DEFAULT_PARAMS.cx * s,
      cy: DEFAULT_PARAMS.cy * s,
      rp: DEFAULT_PARAMS.rp * s,
      bx: DEFAULT_PARAMS.bx * s,
      by: DEFAULT_PARAMS.by * s,
      barLen: DEFAULT_PARAMS.barLen * s,
    }));
  }, []);

  // Clamp a coordinate input back onto the current sheet when it loses focus.
  const commitCoord = useCallback(
    (isY: boolean) => {
      const raw = isY ? yStr : xStr;
      const n = Number(raw);
      if (!Number.isFinite(n)) return;
      const bound = isY ? params.paperH : params.paperW;
      const next = fmtNum(clamp(n, 0, bound));
      if (raw !== next) {
        if (isY) {
          yRawRef.current = next;
          setYStr(next);
        } else {
          xRawRef.current = next;
          setXStr(next);
        }
        recomputeCoordProbe();
      }
    },
    [xStr, yStr, params, recomputeCoordProbe]
  );

  // Coordinate-probe panel readouts, derived from the latest effect run.
  const coord = coordReadout;
  const vDisp = coord?.state === "ok" ? `${coord.v.toFixed(2)} V` : "—";
  const eDisp = coord?.state === "ok" ? `${coord.mag.toFixed(2)} V/cm` : "—";
  const thDisp =
    coord?.state === "ok"
      ? coord.mag > 1e-9
        ? `${coord.th.toFixed(1)}° ${compassLabel(coord.th)}`
        : "—"
      : "—";

  /* ---------------- render ---------------- */

  return (
    <div className="mt-12">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* apparatus */}
        <div className="min-w-0">
          <div className="card-surface p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Paper {fmtDim(params.paperW)} × {fmtDim(params.paperH)} cm · conductive sheet
              </p>
              {isComputing && (
                <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                  updating simulation…
                </p>
              )}
            </div>

            <div ref={wrapperRef} className="relative overflow-hidden rounded-xl border border-[var(--border)]">
              <canvas
                ref={mainCanvasRef}
                aria-label="Electrostatic potential and field lines on dielectric paper"
                className="pointer-events-none block w-full"
                style={{ aspectRatio: `${params.paperW} / ${params.paperH}` }}
              />
              <canvas
                ref={overlayRef}
                aria-label="Potential and field probe"
                className="absolute inset-0 h-full w-full"
                style={{ cursor: "crosshair", touchAction: "none" }}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerLeave={handlePointerLeave}
                onDoubleClick={handleDoubleClick}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-[11px] text-[var(--muted)]">
                Click the paper to probe potential &amp; field · drag to keep probing · double-click or Esc releases
                the probe.
              </p>
              <p className="font-mono text-[10px] text-[var(--muted)]">V₀ = {params.V0.toFixed(1)} V</p>
            </div>
          </div>
        </div>

        {/* controls */}
        <aside className="card-surface min-w-0 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <ControlGroup title="Sheet size">
            <Slider
              id="sl-sheet"
              label="Sheet size"
              min={0.5}
              max={2}
              step={0.05}
              value={sheetScale}
              onChange={setSheetScale}
              format={(s) =>
                `${Math.round(s * 100)}% · ${fmtDim(DEFAULT_PARAMS.paperW * s)} × ${fmtDim(DEFAULT_PARAMS.paperH * s)} cm`
              }
            />
          </ControlGroup>

          <ControlGroup title="Probe by coordinates">
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="coord-x" className="mb-1 block text-sm text-[var(--foreground)]">
                    X (cm)
                  </label>
                  <input
                    id="coord-x"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={xStr}
                    onChange={(e) => handleCoordInput(false, e.target.value)}
                    onBlur={() => commitCoord(false)}
                    aria-label="Probe x coordinate in cm"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-xs tabular-nums text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label htmlFor="coord-y" className="mb-1 block text-sm text-[var(--foreground)]">
                    Y (cm)
                  </label>
                  <input
                    id="coord-y"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={yStr}
                    onChange={(e) => handleCoordInput(true, e.target.value)}
                    onBlur={() => commitCoord(true)}
                    aria-label="Probe y coordinate in cm"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-xs tabular-nums text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[var(--muted)]">
                Bounds 0–{fmtDim(params.paperW)} cm (x) · 0–{fmtDim(params.paperH)} cm (y)
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)]">
              <ReadoutCell label="V" value={vDisp} />
              <ReadoutCell label="|E|" value={eDisp} />
              <ReadoutCell label="θ" value={thDisp} />
            </div>
            {coord?.state === "offpaper" && (
              <p className="mt-1.5 text-[10px] text-[var(--muted)]">That point is off the paper sheet.</p>
            )}
            {coord?.state === "solving" && (
              <p className="mt-1.5 text-[10px] text-[var(--muted)]">Solving the field…</p>
            )}
          </ControlGroup>

          <ControlGroup title="Power supply & material">
            <Slider
              id="sl-v0"
              label="Applied potential"
              min={1}
              max={50}
              step={0.5}
              value={params.V0}
              onChange={(v) => setParams((p) => ({ ...p, V0: v }))}
              format={(v) => `${v.toFixed(1)} V`}
            />
            <Slider
              id="sl-epsr"
              label="Dielectric constant εᵣ"
              min={1}
              max={10}
              step={0.1}
              value={params.epsr}
              onChange={(v) => setParams((p) => ({ ...p, epsr: v }))}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>

          <ControlGroup title="Ground bar geometry">
            <Slider
              id="sl-len"
              label="Bar length"
              min={5 * sheetScale}
              max={25 * sheetScale}
              step={0.5}
              value={params.barLen}
              onChange={(v) => setParams((p) => ({ ...p, barLen: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
            <Slider
              id="sl-ang"
              label="Bar angle"
              min={-90}
              max={90}
              step={5}
              value={params.barAngleDeg}
              onChange={(v) => setParams((p) => ({ ...p, barAngleDeg: v }))}
              format={(v) => `${v.toFixed(0)}°`}
            />
            <Slider
              id="sl-bx"
              label="Bar X"
              min={2 * sheetScale}
              max={28 * sheetScale}
              step={0.5}
              value={params.bx}
              onChange={(v) => setParams((p) => ({ ...p, bx: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
            <Slider
              id="sl-by"
              label="Bar Y"
              min={2 * sheetScale}
              max={16 * sheetScale}
              step={0.5}
              value={params.by}
              onChange={(v) => setParams((p) => ({ ...p, by: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
          </ControlGroup>

          <ControlGroup title="Point conductor">
            <Slider
              id="sl-px"
              label="Point X"
              min={3.5 * sheetScale}
              max={26.5 * sheetScale}
              step={0.5}
              value={params.cx}
              onChange={(v) => setParams((p) => ({ ...p, cx: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
            <Slider
              id="sl-py"
              label="Point Y"
              min={3.5 * sheetScale}
              max={14.5 * sheetScale}
              step={0.5}
              value={params.cy}
              onChange={(v) => setParams((p) => ({ ...p, cy: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
            <Slider
              id="sl-rp"
              label="Point radius"
              min={0.5 * sheetScale}
              max={2 * sheetScale}
              step={0.1}
              value={params.rp}
              onChange={(v) => setParams((p) => ({ ...p, rp: v }))}
              format={(v) => `${v.toFixed(1)} cm`}
            />
          </ControlGroup>

          <ControlGroup title="Display options">
            <div className="space-y-1">
              <Toggle
                label="Potential map"
                checked={toggles.heat}
                onChange={(v) => setToggles((t) => ({ ...t, heat: v }))}
              />
              <Toggle
                label="Field lines"
                checked={toggles.lines}
                onChange={(v) => setToggles((t) => ({ ...t, lines: v }))}
              />
              <Toggle
                label="Equipotentials"
                checked={toggles.contours}
                onChange={(v) => setToggles((t) => ({ ...t, contours: v }))}
              />
              <Toggle
                label="E vectors"
                checked={toggles.vectors}
                onChange={(v) => setToggles((t) => ({ ...t, vectors: v }))}
              />
              <Toggle
                label="Grid & ruler"
                checked={toggles.grid}
                onChange={(v) => setToggles((t) => ({ ...t, grid: v }))}
              />
            </div>

            <Slider
              id="sl-nlines"
              label="Field lines"
              min={6}
              max={48}
              step={2}
              value={densities.lineCount}
              onChange={(v) => setDensities((d) => ({ ...d, lineCount: v }))}
              format={(v) => `${v}`}
            />
            <Slider
              id="sl-ncont"
              label="Equipotentials"
              min={3}
              max={24}
              step={1}
              value={densities.contourCount}
              onChange={(v) => setDensities((d) => ({ ...d, contourCount: v }))}
              format={(v) => `${v}`}
            />

            <div>
              <p className="mb-1.5 text-sm text-[var(--foreground)]">Vector spacing</p>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--border)] p-0.5">
                {[1, 1.5, 2].map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setDensities((d) => ({ ...d, vectorSpacing: sp }))}
                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                      densities.vectorSpacing === sp
                        ? "bg-[var(--accent)] font-medium text-[#04121a]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {sp} cm
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShow3D((v) => !v)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
                show3D
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {show3D ? "Hide" : "Show"} 3D potential surface
            </button>
          </ControlGroup>

          <ControlGroup title="Live measurements">
            <ReadoutRows readouts={readouts} params={params} />
            <button
              type="button"
              onClick={resetDefaults}
              className="text-xs text-[var(--muted)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              Reset defaults
            </button>
          </ControlGroup>
        </aside>
      </div>

      {/* 3D surface */}
      {show3D && (
        <div className="card-surface mt-6 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="font-display text-sm font-semibold">3D potential surface</h3>
            <p className="font-mono text-[10px] text-[var(--muted)]">drag to rotate · double-click to reset</p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
            <canvas
              ref={canvas3DRef}
              aria-label="Rotatable 3D view of the potential surface"
              className="block w-full"
              style={{ aspectRatio: "10 / 3", cursor: "grab", touchAction: "none" }}
              onPointerDown={on3DPointerDown}
              onPointerMove={on3DPointerMove}
              onPointerUp={on3DPointerUp}
              onPointerCancel={on3DPointerUp}
              onDoubleClick={on3DDoubleClick}
            />
          </div>
        </div>
      )}

      {/* info cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <InfoCard title="What am I looking at">
          <p>
            A disc-shaped conductor on the left is held at V₀ and a long metal bar on the right is grounded to 0 V.
            The page solves Laplace&rsquo;s equation on the whole sheet with insulating paper edges, then reads the field off
            as E = −∇V. Colors show low-to-high potential, the cyan lines trace the field, and the thin ink contours
            are equipotentials. This is the same two-conductor setup you reproduce on conductive paper in the lab.
          </p>
        </InfoCard>
        <InfoCard title="Field lines cross equipotentials at right angles">
          <p>
            Because E = −∇V, the field always points down the steepest slope of the potential, which is exactly
            perpendicular to surfaces of constant V. Pick any point here and compare the field-line direction with the
            tangent of the equipotential through it: the angle should be 90°. That check, done with your four-point
            probe and the signal probe, is the heart of the lab report.
          </p>
        </InfoCard>
        <InfoCard title="A note on the dielectric">
          <p>
            With the conductors held at fixed voltages and a uniform dielectric, raising εᵣ does not reshape the
            potential. Laplace&rsquo;s equation between the conductors contains no εᵣ, so the equipotentials stay exactly the
            same. What does change: the field for a given conductor charge is weaker (E ∝ 1/εᵣ) because the dielectric
            screens the charges, while capacitance and stored energy grow (C, U ∝ εᵣ). The simulator draws E divided by
            εᵣ, so arrows and line brightness fade as εᵣ rises, but the pattern stays put.
          </p>
        </InfoCard>
        <InfoCard title="Tips for the lab report">
          <ul className="list-inside">
            <li>
              Use the symmetry: with the point near the sheet center and the bar absent, equipotentials are circles and
              field lines are radial.
            </li>
            <li>The field falls off fast away from the point conductor. Probe densely near it and sparsely near the edges.</li>
            <li>
              The line integral ∮E·dl around any closed loop is ≈ 0, which is what makes a unique potential possible.
              Walk the probe around a small loop and watch V come back to nearly its start value.
            </li>
            <li>
              Build your equipotential map from the E readings and overlay it on the direct probe map; the two should
              agree within probe error.
            </li>
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}