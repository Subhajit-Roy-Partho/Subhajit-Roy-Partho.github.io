/**
 * Electrostatic field simulator - physics core.
 *
 * Pure TypeScript, no React, no DOM. All lengths are in cm unless noted,
 * potentials in volts. The paper plane is 30 x 18 cm discretised at 8 cells/cm,
 * which mirrors the conductive sheet used in PHY 151 "Lab 3 - Relating
 * Electric Fields to Electric Potential".
 */

export const PAPER_W = 30; // cm
export const PAPER_H = 18; // cm
export const CELLS_PER_CM = 8;
export const CELL = 1 / CELLS_PER_CM; // 0.125 cm per cell
export const NX = PAPER_W * CELLS_PER_CM + 1; // 241 columns
export const NY = PAPER_H * CELLS_PER_CM + 1; // 145 rows

/** Discretization derived from a paper sheet size (cm). */
export interface GridShape {
  nx: number;
  ny: number;
  cell: number;
  w: number;
  h: number;
}

/** Grid for a paper sheet of w x h cm at the fixed 8 cells/cm resolution. */
export function gridOf(w: number, h: number): GridShape {
  return { nx: Math.round(w * CELLS_PER_CM) + 1, ny: Math.round(h * CELLS_PER_CM) + 1, cell: CELL, w, h };
}

export interface SimParams {
  /** Applied potential of the point conductor, V. */
  V0: number;
  /** Relative permittivity of the (uniform) dielectric paper. */
  epsr: number;
  /** Point conductor center, cm. */
  cx: number;
  cy: number;
  /** Point conductor radius, cm. */
  rp: number;
  /** Ground bar center, cm. */
  bx: number;
  by: number;
  /** Ground bar length along its axis, cm. */
  barLen: number;
  /** Ground bar orientation, degrees (0 = horizontal, 90 = vertical). */
  barAngleDeg: number;
  /** Paper sheet width, cm. */
  paperW: number;
  /** Paper sheet height, cm. */
  paperH: number;
}

export const DEFAULT_PARAMS: SimParams = {
  V0: 15,
  epsr: 1,
  cx: 15,
  cy: 9,
  rp: 0.9,
  bx: 24.5,
  by: 9,
  barLen: 15,
  barAngleDeg: 90,
  paperW: 30,
  paperH: 18,
};

/** Grid geometry attached to every solve result. */
export interface GridInfo {
  /** Paper sheet width, cm. */
  paperW: number;
  /** Paper sheet height, cm. */
  paperH: number;
  /** Grid resolution. */
  nx: number;
  ny: number;
  cell: number;
}

export interface SolveResult extends GridInfo {
  params: SimParams;
  /** Potential field, index i + j*nx. */
  V: Float64Array;
  /** x component of E, V/cm. Zero inside conductors. */
  Ex: Float64Array;
  /** y component of E, V/cm. Zero inside conductors. */
  Ey: Float64Array;
  /** 0 = open paper cell, 1 = ground bar cell, 2 = point conductor cell. */
  mask: Uint8Array;
  iterations: number;
  converged: boolean;
  /** Largest |E| over open (non-conductor) cells, V/cm. */
  maxE: number;
  /** Geometric factor: (1/V0) times the ring integral of |E|, epsr-independent. */
  g0: number;
  /** Normalized capacitance C* = g0 * epsr, arbitrary units. */
  Cstar: number;
  /** Stored energy U* = 0.5 * C* * V0^2, arbitrary units. */
  Ustar: number;
}

// Multigrid solver settings. Plain SOR stalls on the smooth, large-wavelength
// modes of this insulated-paper problem (measured ~0.999/sweep decay — the
// residual plateaus at ~1e-3 V and top/bottom symmetry never converges, even
// from a coarse warm start, because the coarse solve stalls on the same mode).
// The geometric V-cycle below chases all modes down to the coarsest grid,
// where brute-force relaxation is trivially cheap, and corrects each level on
// the way back up — converging everything at grid-scale cost.
const SOR_OMEGA = 1.4; // smoothing factor (moderate, near-safe range)

/**
 * Convergence gate. The solver stops when the RMS fine-grid residual falls
 * below REL_TOLERANCE * V0. The outer iteration is CG preconditioned by the
 * multigrid V-cycle, so the residual decreases iteratively (not geometrically
 * at a fixed rate) and this gate is reachable in a few dozen iterations for
 * every configuration; the value is set so the discrete solution is reached to
 * well below the discretization error, far under the visual precision of the
 * app.
 */
const REL_TOLERANCE = 3e-6; // fine residual tolerance, relative to V0

/** Iteration budget; typical layouts converge in ~50-60 PCG iterations, and
 * edge-case layouts (a bar touching the paper edge, a point overlapping the
 * bar) need a modest margin on top. */
const MAX_CYCLES = 160;

const CF = 2; // coarsening factor per dimension
const LEVELS = 5; // 241x145 -> 121x73 -> 61x37 -> 31x19 -> 16x10
// Pre-/post-smoothing sweeps per V-cycle level.
const SMOOTH_PRE = 2;
const SMOOTH_POST = 2;

export function onPaper(p: SimParams, x: number, y: number): boolean {
  return x >= 0 && x <= p.paperW && y >= 0 && y <= p.paperH;
}

/** Continuous (sub-cell) point-conductor test used for probes and seeding. */
export function isInPoint(p: SimParams, x: number, y: number): boolean {
  const dx = x - p.cx;
  const dy = y - p.cy;
  return dx * dx + dy * dy <= p.rp * p.rp;
}

/** Continuous ground-bar test: |u| along the axis, |w| across its 1 cm thickness. */
export function isInBar(p: SimParams, x: number, y: number): boolean {
  const a = (p.barAngleDeg * Math.PI) / 180;
  // Snap near-zero axis terms to exactly 0: for a 90°-vertical bar, cos(pi/2)
  // is 6.12e-17 (not 0), and dy*cosA adds a ~5e-16 bias to the cross-axis
  // coordinate that flips end-cap cells asymmetrically at the paper's top vs
  // bottom edge (breaking the y-mirror symmetry of the digitized conductor).
  const cosA = Math.abs(Math.cos(a)) < 1e-12 ? 0 : Math.cos(a);
  const sinA = Math.abs(Math.sin(a)) < 1e-12 ? 0 : Math.sin(a);
  const dx = x - p.bx;
  const dy = y - p.by;
  const u = dx * cosA + dy * sinA;
  const w = -dx * sinA + dy * cosA;
  return Math.abs(u) <= p.barLen / 2 && Math.abs(w) <= 0.5;
}

/**
 * Build the conductor mask for any discretization: bar cells = 1 (applied
 * first), point cells = 2 (applied last, so they win any overlap). A positive
 * `dilate` (cm) thickens both conductors by that amount; the fine grid passes
 * 0 and coarse multigrid levels pass a fraction of their cell size so the
 * thin bar and small point disk stay represented at every resolution.
 */
/** Four world-space corners of the grounded-bar rectangle. */
function barCorners(p: SimParams): [number, number][] {
  const a = (p.barAngleDeg * Math.PI) / 180;
  const cosA = Math.abs(Math.cos(a)) < 1e-12 ? 0 : Math.cos(a);
  const sinA = Math.abs(Math.sin(a)) < 1e-12 ? 0 : Math.sin(a);
  const u0 = p.barLen / 2;
  const v0 = 0.5;
  return [
    [p.bx + u0 * cosA + v0 * sinA, p.by + u0 * sinA - v0 * cosA],
    [p.bx + u0 * cosA - v0 * sinA, p.by + u0 * sinA + v0 * cosA],
    [p.bx - u0 * cosA - v0 * sinA, p.by - u0 * sinA + v0 * cosA],
    [p.bx - u0 * cosA + v0 * sinA, p.by - u0 * sinA - v0 * cosA],
  ];
}

/**
 * Separating-axis overlap test between an axis-aligned cell square
 * [x0, x0+cell] x [y0, y0+cell] and a convex polygon `poly`. The square is
 * clipped to the paper and shrunk by cell/10 on every side so that a
 * boundary-only touch (the polygon grazing a cell edge) does not count as
 * overlap — that would inflate the coarse conductor by a whole extra
 * row/column, and phantom off-paper squares would over-pin coarse grids.
 */
function polyOverlapsCell(poly: [number, number][], x0: number, y0: number, cell: number, w: number, h: number): boolean {
  const x0s = Math.max(x0, 0) + cell / 10;
  const y0s = Math.max(y0, 0) + cell / 10;
  const x1s = Math.min(x0 + cell, w) - cell / 10;
  const y1s = Math.min(y0 + cell, h) - cell / 10;
  if (x1s <= x0s || y1s <= y0s) return false; // cell is effectively off-paper
  const axes: [number, number][] = [];
  // Axes from the polygon's edge normals.
  for (let k = 0; k < poly.length; k++) {
    const [ax, ay] = poly[k];
    const [bx, by] = poly[(k + 1) % poly.length];
    axes.push([ay - by, bx - ax]); // (nx, ny) of edge (b-a)
  }
  // The cell's own axes are x and y.
  axes.push([1, 0], [0, 1]);
  for (const [nx, ny] of axes) {
    let polyMin = Infinity;
    let polyMax = -Infinity;
    for (const [px, py] of poly) {
      const d = px * nx + py * ny;
      polyMin = Math.min(polyMin, d);
      polyMax = Math.max(polyMax, d);
    }
    // Project the shrunk, paper-clipped cell square onto the same axis.
    let cellMin = Infinity;
    let cellMax = -Infinity;
    for (const [cx, cy] of [
      [x0s, y0s],
      [x1s, y0s],
      [x0s, y1s],
      [x1s, y1s],
    ] as [number, number][]) {
      const d = cx * nx + cy * ny;
      cellMin = Math.min(cellMin, d);
      cellMax = Math.max(cellMax, d);
    }
    if (cellMax < polyMin || polyMax < cellMin) return false; // separating axis found
  }
  return true;
}

/** True if the point-disk intersects the cell square (closest-point test). */
function diskOverlapsCell(p: SimParams, x0: number, y0: number, cell: number): boolean {
  const x1 = Math.min(x0 + cell, p.paperW);
  const y1 = Math.min(y0 + cell, p.paperH);
  const dx = Math.max(x0 - p.cx, 0, p.cx - x1);
  const dy = Math.max(y0 - p.cy, 0, p.cy - y1);
  return dx * dx + dy * dy <= p.rp * p.rp;
}

/** Per-conductor control of coarse sampling (a bare `true` applies to both). */
export type AreaSample = boolean | { bar?: boolean; point?: boolean };

/**
 * Build the conductor mask for any discretization: bar cells = 1 (applied
 * first), point cells = 2 (applied last, so they win any overlap). A positive
 * `dilate` (cm) thickens both conductors. The fine grid rasterizes with exact
 * node sampling; coarse multigrid levels may pass `areaSample` per conductor so
 * a cell counts as conductor if the shape *intersects* the cell square — with
 * center sampling alone, the thin bar and small point disk can vanish entirely
 * on a coarse grid, leaving that conductor unpinned and the coarse Neumann
 * problem unfaithful (or singular).
 */
export function makeMask(
  p: SimParams,
  ncols: number,
  nrows: number,
  cell: number,
  dilate = 0,
  areaSample: AreaSample = false
): Uint8Array {
  const sampleBarArea = typeof areaSample === 'object' ? !!areaSample.bar : areaSample;
  const samplePointArea = typeof areaSample === 'object' ? !!areaSample.point : areaSample;
  const a = (p.barAngleDeg * Math.PI) / 180;
  // Snap near-zero angle terms to 0 (see isInBar) so axis-aligned bars rasterize
  // mirror-symmetrically about the paper's midline.
  const cosA = Math.abs(Math.cos(a)) < 1e-12 ? 0 : Math.cos(a);
  const sinA = Math.abs(Math.sin(a)) < 1e-12 ? 0 : Math.sin(a);
  const mask = new Uint8Array(ncols * nrows);

  const halfLen = p.barLen / 2;
  const halfThick = 0.5 + dilate;
  const barCells = (i: number, j: number, x: number, y: number): boolean => {
    const dx = x - p.bx;
    const dy = y - p.by;
    const u = dx * cosA + dy * sinA;
    const w = -dx * sinA + dy * cosA;
    return Math.abs(u) <= halfLen && Math.abs(w) <= halfThick;
  };
  // Area sampling needs the exact bar polygon; with a positive dilation the
  // thickened rectangle differs from `barCorners`, so keep the node test then
  // (otherwise the area path would silently drop the bar entirely).
  const barPoly: [number, number][] | null = sampleBarArea && halfThick === 0.5 ? barCorners(p) : null;
  for (let j = 0; j < nrows; j++) {
    const y = j * cell;
    const row = j * ncols;
    for (let i = 0; i < ncols; i++) {
      const x = i * cell;
      if (sampleBarArea) {
        if (barPoly ? polyOverlapsCell(barPoly, x, y, cell, p.paperW, p.paperH) : barCells(i, j, x, y)) {
          mask[row + i] = 1;
        }
      } else if (barCells(i, j, x, y)) {
        mask[row + i] = 1;
      }
    }
  }

  for (let j = 0; j < nrows; j++) {
    const y = j * cell;
    const row = j * ncols;
    for (let i = 0; i < ncols; i++) {
      const x = i * cell;
      const covered = samplePointArea
        ? diskOverlapsCell(p, x, y, cell)
        : (x - p.cx) * (x - p.cx) + (y - p.cy) * (y - p.cy) <= p.rp * p.rp;
      if (covered) mask[row + i] = 2;
    }
  }
  return mask;
}

/** Set Dirichlet values on conductor cells: point = V0, bar = 0. */
export function applyDirichlet(mask: Uint8Array, V: Float64Array, v0: number): void {
  for (let k = 0; k < mask.length; k++) {
    if (mask[k] === 2) V[k] = v0;
    // Bar cells are already 0 by construction of the Float64Array.
  }
}

/**
 * One Gauss-Seidel SOR sweep over all open (non-conductor) paper cells of the
 * 5-point Laplacian L[V] = rhs, i.e. Avg(v) - v = rhs (rhs = null for the
 * homogeneous Laplace solve). Returns the largest |update| applied.
 *
 * Conductor cells (mask != 0) are never updated. Paper edges are insulating
 * (d/dn V = 0): the out-of-plane neighbor mirrors the boundary value and the
 * interior vertical neighbor is the adjacent in-paper row — the coupling that
 * keeps the edges from freezing at 0.
 */
export function sweepOnce(
  mask: Uint8Array,
  v: Float64Array,
  rhs: Float64Array | null,
  ncols: number,
  nrows: number,
  omega: number
): number {
  let md = 0;
  const upd = (idx: number, avg: number): void => {
    if (mask[idx] !== 0) return;
    const target = rhs === null ? avg : avg - rhs[idx];
    const delta = (target - v[idx]) * omega;
    v[idx] += delta;
    const ad = delta < 0 ? -delta : delta;
    if (ad > md) md = ad;
  };

  // Top and bottom rows: mirror-ghost Neumann (ghost = interior row value).
  for (let i = 1; i < ncols - 1; i++) {
    const top = i;
    upd(top, (v[top - 1] + v[top + 1] + v[top + ncols] + v[top + ncols]) * 0.25);
    const bot = (nrows - 1) * ncols + i;
    upd(bot, (v[bot - 1] + v[bot + 1] + v[bot - ncols] + v[bot - ncols]) * 0.25);
  }
  // Left/right edge columns (incl. paper corners), then interior columns.
  for (let j = 0; j < nrows; j++) {
    const row = j * ncols;
    const prev = j > 0 ? row - ncols : row;
    const next = j < nrows - 1 ? row + ncols : row;
    upd(row, (v[prev] + v[next] + v[row] + v[row + 1]) * 0.25); // (0, j)
    const right = row + ncols - 1;
    upd(right, (v[prev + ncols - 1] + v[next + ncols - 1] + v[right - 1] + v[right]) * 0.25);
    for (let i = 1; i < ncols - 1; i++) {
      const idx = row + i;
      upd(idx, (v[prev + i] + v[next + i] + v[idx - 1] + v[idx + 1]) * 0.25);
    }
  }
  return md;
}

/**
 * Iterate sweeps until max|delta| <= tol or the budget runs out.
 * Returns the sweep count and whether the tolerance was reached.
 */
export function relax(
  mask: Uint8Array,
  v: Float64Array,
  rhs: Float64Array | null,
  ncols: number,
  nrows: number,
  omega: number,
  tol: number,
  maxIter: number
): { iterations: number; converged: boolean } {
  if (v.length !== ncols * nrows) return { iterations: 0, converged: false };
  let md = Infinity;
  let iterations = 0;
  for (iterations = 0; iterations < maxIter && md > tol; iterations++) {
    md = sweepOnce(mask, v, rhs, ncols, nrows, omega);
  }
  return { iterations, converged: md <= tol };
}

/**
 * One red-black half-sweep (a single color). Stencil conventions match
 * sweepOnce: mirror-ghost Neumann on the top/bottom paper edges, clamp ghost
 * on the left/right edges, and the corner rule from the edge-column loop.
 */
export function sweepSOR(
  mask: Uint8Array,
  v: Float64Array,
  rhs: Float64Array | null,
  ncols: number,
  nrows: number,
  omega: number,
  color: number
): number {
  let md = 0;
  for (let j = 0; j < nrows; j++) {
    for (let i = (color ^ (j & 1)); i < ncols; i += 2) {
      const k = j * ncols + i;
      if (mask[k] !== 0) continue;
      const l = i > 0 ? v[k - 1] : v[k];
      const r = i < ncols - 1 ? v[k + 1] : v[k];
      let u: number;
      let d: number;
      if (j === 0) u = i === 0 || i === ncols - 1 ? v[k] : v[k + ncols];
      else u = v[k - ncols];
      if (j === nrows - 1) d = i === 0 || i === ncols - 1 ? v[k] : v[k - ncols];
      else d = v[k + ncols];
      const avg = (l + r + u + d) * 0.25;
      const target = rhs === null ? avg : avg - rhs[k];
      const delta = (target - v[k]) * omega;
      v[k] += delta;
      const ad = delta < 0 ? -delta : delta;
      if (ad > md) md = ad;
    }
  }
  return md;
}

/** Exactly `sweeps` smoothing passes; returns the last sweep's max update. */
export function smooth(
  mask: Uint8Array,
  v: Float64Array,
  rhs: Float64Array | null,
  ncols: number,
  nrows: number,
  omega: number,
  sweeps: number
): number {
  let md = 0;
  for (let t = 0; t < sweeps; t++) {
    const m1 = sweepSOR(mask, v, rhs, ncols, nrows, omega, 0);
    const m2 = sweepSOR(mask, v, rhs, ncols, nrows, omega, 1);
    md = m1 > m2 ? m1 : m2;
  }
  return md;
}

/**
 * Residual of the error equation on open cells, r = Avg(v) - v - rhs (rhs=null
 * means 0). Uses the exact same stencils as sweepOnce so the transferred
 * operator is consistent level to level.
 */
export function computeResidual(
  mask: Uint8Array,
  v: Float64Array,
  rhs: Float64Array | null,
  ncols: number,
  nrows: number
): Float64Array {
  const r = new Float64Array(ncols * nrows);
  const set = (idx: number, avg: number): void => {
    if (mask[idx] !== 0) return;
    r[idx] = avg - v[idx] - (rhs === null ? 0 : rhs[idx]);
  };
  for (let i = 1; i < ncols - 1; i++) {
    const top = i;
    set(top, (v[top - 1] + v[top + 1] + v[top + ncols] + v[top + ncols]) * 0.25);
    const bot = (nrows - 1) * ncols + i;
    set(bot, (v[bot - 1] + v[bot + 1] + v[bot - ncols] + v[bot - ncols]) * 0.25);
  }
  for (let j = 0; j < nrows; j++) {
    const row = j * ncols;
    const prev = j > 0 ? row - ncols : row;
    const next = j < nrows - 1 ? row + ncols : row;
    set(row, (v[prev] + v[next] + v[row] + v[row + 1]) * 0.25);
    const right = row + ncols - 1;
    set(right, (v[prev + ncols - 1] + v[next + ncols - 1] + v[right - 1] + v[right]) * 0.25);
    for (let i = 1; i < ncols - 1; i++) {
      const idx = row + i;
      set(idx, (v[prev + i] + v[next + i] + v[idx - 1] + v[idx + 1]) * 0.25);
    }
  }
  return r;
}

/**
 * Full-weighting restriction: coarse node (I, J) averages the fine 2x2 block
 * {2I, 2I+1} x {2J, 2J+1}, clamped to the grid edge where that block hangs
 * over. Duplicated corner contributions cancel through the 1/4 weighting.
 */
export function restrict(
  r: Float64Array,
  ncols: number,
  nrows: number,
  rC: Float64Array,
  ncolsC: number,
  nrowsC: number
): void {
  for (let j = 0; j < nrowsC; j++) {
    // Mirror-symmetric edge boxes: the top-most coarse row averages the two
    // fine rows {nrows-2, nrows-1} exactly as the bottom row averages {0, 1}.
    // Clamping the inner index alone (the old min(2j+1, nrows-1)) collapsed
    // the top box to a single row, biasing the transfer top vs bottom and
    // baking a persistent y-asymmetry into the multigrid fixed point.
    const row0 = Math.min(2 * j, nrows - 2) * ncols;
    const row1 = Math.min(2 * j + 1, nrows - 1) * ncols;
    for (let i = 0; i < ncolsC; i++) {
      const i0 = Math.min(2 * i, ncols - 2);
      const i1 = Math.min(2 * i + 1, ncols - 1);
      let sum = 0;
      let count = 0;
      for (const rr of [row0, row1]) {
        for (const ii of [i0, i1]) {
          const v = r[rr + ii];
          if (v === 0) continue; // conductor cells carry no residual
          sum += v;
          count++;
        }
      }
      rC[j * ncolsC + i] = count > 0 ? sum / count : 0;
    }
  }
}

/** Bilinear prolongation of the coarse solution onto the fine grid. */
export function prolong(Vc: Float64Array, nxc: number, nyc: number, V: Float64Array, nfx: number, nfy: number): void {
  for (let j = 0; j < nfy; j++) {
    const jc = j / CF;
    const j0 = Math.min(Math.max(Math.floor(jc), 0), nyc - 2);
    const j1 = j0 + 1;
    const ty = jc - j0;
    for (let i = 0; i < nfx; i++) {
      const ic = i / CF;
      const i0 = Math.min(Math.max(Math.floor(ic), 0), nxc - 2);
      const i1 = i0 + 1;
      const tx = ic - i0;
      const v00 = Vc[j0 * nxc + i0];
      const v01 = Vc[j0 * nxc + i1];
      const v10 = Vc[j1 * nxc + i0];
      const v11 = Vc[j1 * nxc + i1];
      const top = v00 + tx * (v01 - v00);
      const bot = v10 + tx * (v11 - v10);
      V[j * nfx + i] = top + ty * (bot - top);
    }
  }
}

/** One level of the multigrid hierarchy. */
interface MgLevel {
  ncols: number;
  nrows: number;
  mask: Uint8Array;
  v: Float64Array; // fine: the potential; coarser: the error estimate
  rhs: Float64Array; // fine: zero; coarser: restricted residual
  corr: Float64Array; // prolongated correction workspace
  sys?: CoarseSystem; // coarsest level only: exact dense solve data
}

/**
 * The coarsest grid (16x10, ~140 open cells) is solved EXACTLY by dense
 * Gaussian elimination. The coarse error problems are nearly singular — a
 * few small conductor pins on pure-Neumann walls — so plain Gauss-Seidel
 * cannot reduce them to a tight tolerance in any affordable iteration budget
 * (measured: still unconverged after 60000 sweeps). An exact coarse solve
 * restores the classic multigrid convergence rate at every level above it.
 */
interface CoarseSystem {
  n: number;
  idx: Int32Array; // cell index -> local row (open cells only)
  lu: Float64Array; // LU factors (with partial pivoting)
  piv: Int32Array;
  b: Float64Array; // recycled right-hand side workspace
}

/**
 * Assemble the coarsest 5-point operator A for (Avg(e) - e) * 4 = -4*rhs.
 *
 * The rows MUST reproduce sweepOnce's stencils exactly. Reading
 * `sweepOnce`: on the top edge the up term is the mirror of the row below
 * (u = d, so `below` appears twice); on the left/right edges the horizontal
 * neighbor clamps to the boundary cell itself; corners follow the
 * edge-column rule and clamp both vertical terms to themselves. A coarse
 * operator that differs from the fine one on boundary rows is not a
 * coarsening of it, and boundary smooth modes never converge.
 */
function assembleCoarseOperator(mask: Uint8Array, ncols: number, nrows: number): { n: number; idx: Int32Array; A: Float64Array } {
  const N = ncols * nrows;
  const idx = new Int32Array(N).fill(-1);
  let n = 0;
  for (let k = 0; k < N; k++) if (mask[k] === 0) idx[k] = n++;
  const A = new Float64Array(n * n);
  const sub = (row: number, col: number, w: number): void => {
    if (col >= 0) A[row * n + col] += w;
  };
  const corner = (i: number): boolean => i === 0 || i === ncols - 1;
  for (let j = 0; j < nrows; j++) {
    for (let i = 0; i < ncols; i++) {
      const k = j * ncols + i;
      const row = idx[k];
      if (row < 0) continue; // conductor: fixed at 0, no equation
      A[row * n + row] += 4;
      // left/right: clamp the ghost to the boundary cell itself (as sweepOnce
      // does for the edge columns).
      if (i > 0) sub(row, idx[k - 1], -1);
      else A[row * n + row] -= 1;
      if (i < ncols - 1) sub(row, idx[k + 1], -1);
      else A[row * n + row] -= 1;
      // top: mirror the row below (ghost value = below cell); corners clamp
      // to themselves (they are updated by sweepOnce's edge-column rule).
      if (j === 0) {
        if (corner(i)) A[row * n + row] -= 1;
        else sub(row, idx[k + ncols], -1);
      } else sub(row, idx[k - ncols], -1);
      // bottom: mirror the row above; corners clamp to themselves.
      if (j === nrows - 1) {
        if (corner(i)) A[row * n + row] -= 1;
        else sub(row, idx[k - ncols], -1);
      } else sub(row, idx[k + ncols], -1);
    }
  }
  return { n, idx, A };
}

/** In-place Doolittle LU factorization with partial pivoting. */
export function luFactor(A: Float64Array, n: number): { lu: Float64Array; piv: Int32Array } {
  const lu = Float64Array.from(A);
  const piv = new Int32Array(n);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(lu[i * n + k]) > Math.abs(lu[p * n + k])) p = i;
    }
    piv[k] = p;
    if (p !== k) {
      for (let c = 0; c < n; c++) {
        const t = lu[k * n + c];
        lu[k * n + c] = lu[p * n + c];
        lu[p * n + c] = t;
      }
    }
    const diag = lu[k * n + k];
    for (let i = k + 1; i < n; i++) {
      const f = lu[i * n + k] / diag;
      lu[i * n + k] = f;
      for (let c = k + 1; c < n; c++) lu[i * n + c] -= f * lu[k * n + c];
    }
  }
  return { lu, piv };
}

/** Solve L U x = b given the factors from luFactor. */
export function luSolve(lu: Float64Array, piv: Int32Array, n: number, b: Float64Array): Float64Array {
  const x = Float64Array.from(b);
  for (let i = 0; i < n; i++) {
    const p = piv[i];
    if (p !== i) {
      const t = x[i];
      x[i] = x[p];
      x[p] = t;
    }
  }
  for (let i = 0; i < n; i++) {
    let s = x[i];
    for (let c = 0; c < i; c++) s -= lu[i * n + c] * x[c];
    x[i] = s;
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i];
    for (let c = i + 1; c < n; c++) s -= lu[i * n + c] * x[c];
    x[i] = s / lu[i * n + i];
  }
  return x;
}

/**
 * Build the grid hierarchy. Every level re-rasterizes the exact conductor
 * geometry (no extra dilation) — increasing the dilation on coarse levels
 * inflated the conductors (up to 2.1 cm for the point on the coarsest grid),
 * so the coarse corrections were built for the wrong pin geometry and the
 * mismatch regenerated residual near the pins every cycle. The coarsest
 * level keeps its pins fixed, so the problem stays well-posed everywhere.
 */
export function buildLevels(p: SimParams): MgLevel[] {
  const levels: MgLevel[] = [];
  const g0 = gridOf(p.paperW, p.paperH);
  let ncols = g0.nx;
  let nrows = g0.ny;
  let cell = g0.cell;
  for (let k = 0; k < LEVELS && ncols >= 3 && nrows >= 3; k++) {
    // Node sampling reproduces the fine geometry at coarse resolution, but a
    // conductor can vanish entirely when no node center falls inside it (the
    // point disk on the coarsest 16x10 grid, whose nodes all miss its r = 0.9 cm;
    // a horizontal 1 cm bar on a 2 cm cell). Each conductor is checked
    // separately: a missing *point* pin while the bar still pins would keep the
    // coarse system well-posed but the coarse operator would be solving a
    // different BVP than the fine one, and the resulting smooth error mode
    // decays at ~0.99/cycle forever. A missing *bar* pin while the point pins
    // is equally unfaithful; only a grid with no conductor at all is singular.
    // Fall back per conductor to area sampling, which always lands a pin.
    const sampled = makeMask(p, ncols, nrows, cell, 0, false);
    let barPin = false;
    let pointPin = false;
    for (let q = 0; q < sampled.length; q++) {
      if (sampled[q] === 1) barPin = true;
      else if (sampled[q] === 2) pointPin = true;
    }
    const mask =
      barPin && pointPin
        ? sampled
        : makeMask(p, ncols, nrows, cell, 0, { bar: !barPin, point: !pointPin });
    levels.push({
      ncols,
      nrows,
      mask,
      v: new Float64Array(ncols * nrows),
      rhs: new Float64Array(ncols * nrows),
      corr: new Float64Array(ncols * nrows),
    });
    ncols = Math.floor(ncols / CF) + 1;
    nrows = Math.floor(nrows / CF) + 1;
    cell *= CF;
  }
  // Exact dense solve for the coarsest level: assemble once, factor once.
  const last = levels[levels.length - 1];
  const { n, idx, A } = assembleCoarseOperator(last.mask, last.ncols, last.nrows);
  if (n > 0) {
    const { lu, piv } = luFactor(A, n);
    last.sys = { n, idx, lu, piv, b: new Float64Array(n) };
  }
  return levels;
}

/**
 * One V-cycle from the given level: pre-smooth, restrict the residual to the
 * next-coarser error problem (built from scratch), recurse, prolongate and add
 * the correction on open cells, post-smooth. Returns level 0's post-smoothing
 * max update, which the driver uses as its convergence measure.
 */
export function vcycle(levels: MgLevel[], level: number, omega: number): number {
  const g = levels[level];
  if (level === levels.length - 1) {
    // Coarsest grid: exact dense solve (see CoarseSystem above).
    const sys = g.sys;
    if (sys && sys.n > 0) {
      for (let k = 0; k < g.ncols * g.nrows; k++) {
        const row = sys.idx[k];
        if (row >= 0) sys.b[row] = -4 * g.rhs[k];
      }
      const x = luSolve(sys.lu, sys.piv, sys.n, sys.b);
      for (let k = 0; k < g.ncols * g.nrows; k++) {
        const row = sys.idx[k];
        if (row >= 0) g.v[k] = x[row];
      }
    }
    return 0;
  }
  smooth(g.mask, g.v, g.rhs, g.ncols, g.nrows, omega, SMOOTH_PRE);
  const r = computeResidual(g.mask, g.v, g.rhs, g.ncols, g.nrows);
  const next = levels[level + 1];
  next.v.fill(0);
  next.rhs.fill(0);
  restrict(r, g.ncols, g.nrows, next.rhs, next.ncols, next.nrows);
  // The coarse problem solves T(e) = -r (with T = avg - id), then u += e
  // makes T(u + e) = T(u) + T(e) = r - r = 0.
  for (let k = 0; k < next.ncols * next.nrows; k++) next.rhs[k] = -next.rhs[k];
  vcycle(levels, level + 1, omega);
  prolong(next.v, next.ncols, next.nrows, g.corr, g.ncols, g.nrows);
  for (let k = 0; k < g.ncols * g.nrows; k++) {
    if (g.mask[k] === 0) g.v[k] += g.corr[k];
  }
  return smooth(g.mask, g.v, g.rhs, g.ncols, g.nrows, omega, SMOOTH_POST);
}

/**
 * Nested (FMG) seeding: the coarsest level is solved exactly by buildLevels,
 * then each finer level is initialized by prolongating the already-solved
 * coarser solution and polished with a few V-cycles of its sub-problem. This
 * makes the smooth, paper-wide modes essentially exact before the fine grid
 * has done its first V-cycle, so the remaining budget only resolves sub-grid
 * detail.
 */
function nestedSeed(levels: MgLevel[], p: SimParams, omega: number): void {
  for (let k = levels.length - 2; k >= 0; k--) {
    const cur = levels[k];
    cur.v.fill(0);
    cur.rhs.fill(0);
    prolong(levels[k + 1].v, levels[k + 1].ncols, levels[k + 1].nrows, cur.v, cur.ncols, cur.nrows);
    applyDirichlet(cur.mask, cur.v, p.V0);
    for (let t = 0; t < 2; t++) vcycle(levels, k, omega);
  }
}

/**
 * Solve the fine-grid Laplace problem with a preconditioned conjugate gradient
 * iteration that uses one multigrid V-cycle as the preconditioner.
 *
 * A plain V-cycle stalls on this problem: the paper-wide "DC offset" mode is a
 * near-null vector of the coarse-grid correction, so its error decays at only
 * ~0.996/cycle and the cycle's fixed point carries a ~0.8% of V0 bias (worst at
 * the bar tip). Wrapping the same V-cycle in CG removes that mode in a few
 * iterations, so the iteration reaches the true discrete solution and the
 * residual gate becomes meaningful.
 *
 * `relax` solves T(u) = rhs with T = Avg - u and the paper-edge/Neumann
 * stencil, so the discrete operator is A = -T = id - Avg, SPD on open cells with
 * Dirichlet conductors. We solve A e = b for the correction e (zero on
 * conductors), with b = T(v_pins) so that v = v_pins + e satisfies T(v) = 0.
 * The CG residual r = b - A e is then exactly T(v), i.e. the same fine residual
 * the convergence gate reports.
 */
function multigridSolve(
  p: SimParams
): { v: Float64Array; mask: Uint8Array; cycles: number; converged: boolean } {
  const levels = buildLevels(p);
  const fine = levels[0];
  const mask = fine.mask;
  const N = fine.ncols * fine.nrows;
  const ncols = fine.ncols;
  const nrows = fine.nrows;

  // Dirichlet pin values (point = V0, bar = 0) with open cells zero.
  const vPins = new Float64Array(N);
  applyDirichlet(mask, vPins, p.V0);

  let nOpen = 0;
  for (let k = 0; k < N; k++) if (mask[k] === 0) nOpen++;
  const rmsOf = (r: Float64Array): number => {
    let sum = 0;
    for (let k = 0; k < N; k++) {
      if (mask[k] !== 0) continue;
      sum += r[k] * r[k];
    }
    return nOpen > 0 ? Math.sqrt(sum / nOpen) : 0;
  };

  // Seed from the FMG nested solve so PCG starts from the smooth solution.
  fine.v.set(vPins);
  nestedSeed(levels, p, SOR_OMEGA);

  const tol = REL_TOLERANCE * Math.max(p.V0, 1e-9);
  const e = new Float64Array(N); // correction, zero on conductors
  for (let k = 0; k < N; k++) if (mask[k] === 0) e[k] = fine.v[k] - vPins[k];

  // A x = -(Avg(x) - x); zero on conductor cells.
  const applyA = (x: Float64Array, out: Float64Array): void => {
    const q = computeResidual(mask, x, null, ncols, nrows);
    for (let k = 0; k < N; k++) out[k] = mask[k] === 0 ? -q[k] : 0;
  };
  // M^-1 y: one V-cycle solving T(z) = y, so A z = -y and z = -A^-1 y.
  const applyM = (y: Float64Array, out: Float64Array): void => {
    fine.v.fill(0);
    fine.rhs.set(y);
    vcycle(levels, 0, SOR_OMEGA);
    for (let k = 0; k < N; k++) out[k] = mask[k] === 0 ? -fine.v[k] : 0;
  };
  const dot = (a: Float64Array, b: Float64Array): number => {
    let s = 0;
    for (let k = 0; k < N; k++) s += a[k] * b[k];
    return s;
  };

  const r = new Float64Array(N);
  const z = new Float64Array(N);
  const dir = new Float64Array(N);
  const ap = new Float64Array(N);

  // r = b - A e, with b = T(v_pins).
  const b = computeResidual(mask, vPins, null, ncols, nrows);
  applyA(e, r);
  for (let k = 0; k < N; k++) r[k] = (mask[k] === 0 ? b[k] : 0) - r[k];

  let rms = rmsOf(r);
  applyM(r, z);
  dir.set(z);
  let rz = dot(r, z);
  let cycles = 0;

  for (; cycles < MAX_CYCLES && rms > tol; cycles++) {
    if (!(rz > 0)) break; // preconditioner degenerated (e.g. all-conductor grid)
    applyA(dir, ap);
    const pAp = dot(dir, ap);
    if (!(pAp > 0)) break;
    const alpha = rz / pAp;
    for (let k = 0; k < N; k++) {
      e[k] += alpha * dir[k];
      r[k] -= alpha * ap[k];
    }
    rms = rmsOf(r);
    if (rms <= tol) break;
    applyM(r, z);
    const rzNext = dot(r, z);
    const beta = rzNext / rz;
    for (let k = 0; k < N; k++) dir[k] = z[k] + beta * dir[k];
    rz = rzNext;
  }

  for (let k = 0; k < N; k++) fine.v[k] = mask[k] === 0 ? vPins[k] + e[k] : vPins[k];
  return { v: fine.v, mask, cycles, converged: rms <= tol };
}

/**
 * Solve Laplace's equation on the paper grid with Dirichlet boundary
 * conditions on the conductors and Neumann (insulating) paper edges.
 *
 * Fixed conductor cells are never updated; the paper-edge stencil mirrors
 * out-of-bounds neighbors, which implements dV/dn = 0 there. Geometric
 * multigrid V-cycles are used so the smooth, slow-to-relax modes of this
 * insulated-paper problem converge at grid-scale cost.
 */
export function solve(p: SimParams): SolveResult {
  const { v: V, mask, cycles: iterations, converged } = multigridSolve(p);
  const { nx, ny, cell } = gridOf(p.paperW, p.paperH);

  // E components by central differences; zero inside conductor cells.
  const Ex = new Float64Array(nx * ny);
  const Ey = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const jUp = j + 1 < ny ? j + 1 : j;
    const jDn = j - 1 >= 0 ? j - 1 : j;
    const row = j * nx;
    const rowUp = jUp * nx;
    const rowDn = jDn * nx;
    for (let i = 0; i < nx; i++) {
      const idx = row + i;
      if (mask[idx] !== 0) continue;
      const iL = i > 0 ? i - 1 : i;
      const iR = i < nx - 1 ? i + 1 : i;
      Ex[idx] = -(V[row + iR] - V[row + iL]) / (2 * cell);
      Ey[idx] = -(V[rowUp + i] - V[rowDn + i]) / (2 * cell);
    }
  }

  let maxE = 0;
  for (let k = 0; k < nx * ny; k++) {
    if (mask[k] !== 0) continue;
    const mag = Math.hypot(Ex[k], Ey[k]);
    if (mag > maxE) maxE = mag;
  }

  const g0 = geometryFactor(p, V, Ex, Ey);

  return {
    params: p,
    paperW: p.paperW,
    paperH: p.paperH,
    nx,
    ny,
    cell,
    V,
    Ex,
    Ey,
    mask,
    iterations,
    converged,
    maxE,
    g0,
    Cstar: g0 * p.epsr,
    Ustar: 0.5 * g0 * p.epsr * p.V0 * p.V0,
  };
}

/**
 * Geometric factor g0 = (1/V0) * integral(|E| ds) evaluated on a ring of radius
 * rc = rp + 1.2 cm around the point-conductor center, 360 samples, ds = 2*pi*rc/360.
 * Only samples that lie inside the paper and outside the ground bar are used.
 * We normalize by the number of valid samples and multiply back by 360/validCount
 * so the estimate represents the full ring even when part of it falls off the
 * paper or into the bar. g0 depends only on the layout, never on epsr.
 */
function geometryFactor(p: SimParams, V: Float64Array, Ex: Float64Array, Ey: Float64Array): number {
  const rc = p.rp + 1.2;
  const ds = (2 * Math.PI * rc) / 360;
  const g = gridOf(p.paperW, p.paperH);
  let sum = 0;
  let valid = 0;
  for (let k = 0; k < 360; k++) {
    const th = (2 * Math.PI * k) / 360;
    const x = p.cx + rc * Math.cos(th);
    const y = p.cy + rc * Math.sin(th);
    if (!onPaper(p, x, y) || isInBar(p, x, y)) continue;
    const { ex, ey } = fieldAtArrays(g, V, Ex, Ey, x, y);
    sum += Math.hypot(ex, ey);
    valid++;
  }
  if (valid === 0) return 0;
  return (sum * ds * (360 / valid)) / p.V0;
}

function bilinearIndex(g: GridShape, xCm: number, yCm: number): { i: number; j: number; tx: number; ty: number } | null {
  if (!Number.isFinite(xCm) || !Number.isFinite(yCm)) return null;
  let fx = xCm / g.cell;
  let fy = yCm / g.cell;
  fx = Math.max(0, Math.min(g.nx - 1, fx));
  fy = Math.max(0, Math.min(g.ny - 1, fy));
  const i = Math.min(Math.floor(fx), g.nx - 2);
  const j = Math.min(Math.floor(fy), g.ny - 2);
  return { i, j, tx: fx - i, ty: fy - j };
}

/** Grid shape matching an existing solve result's discretization. */
export function resultGrid(result: SolveResult): GridShape {
  return { nx: result.nx, ny: result.ny, cell: result.cell, w: result.paperW, h: result.paperH };
}

function fieldAtArrays(
  g: GridShape,
  V: Float64Array,
  Ex: Float64Array,
  Ey: Float64Array,
  xCm: number,
  yCm: number
): { ex: number; ey: number } {
  const bl = bilinearIndex(g, xCm, yCm);
  if (!bl) return { ex: 0, ey: 0 };
  const a = bl.j * g.nx + bl.i;
  const b = a + 1;
  const c = a + g.nx;
  const d = c + 1;
  const tx = bl.tx;
  const ty = bl.ty;
  const ex = (Ex[a] * (1 - tx) + Ex[b] * tx) * (1 - ty) + (Ex[c] * (1 - tx) + Ex[d] * tx) * ty;
  const ey = (Ey[a] * (1 - tx) + Ey[b] * tx) * (1 - ty) + (Ey[c] * (1 - tx) + Ey[d] * tx) * ty;
  return { ex, ey };
}

/** Potential at a fractional position, in cm. Conductors report their fixed value. */
export function potAt(result: SolveResult, xCm: number, yCm: number): number {
  if (isInPoint(result.params, xCm, yCm)) return result.params.V0;
  if (isInBar(result.params, xCm, yCm)) return 0;
  const g: GridShape = resultGrid(result);
  const bl = bilinearIndex(g, xCm, yCm);
  if (!bl) return 0;
  const a = bl.j * g.nx + bl.i;
  const b = a + 1;
  const c = a + g.nx;
  const d = c + 1;
  const tx = bl.tx;
  const ty = bl.ty;
  const V = result.V;
  return (V[a] * (1 - tx) + V[b] * tx) * (1 - ty) + (V[c] * (1 - tx) + V[d] * tx) * ty;
}

/**
 * Electric field at a fractional position via bilinear interpolation of the
 * precomputed Ex/Ey arrays. Conductor cells contribute zero, so a probe
 * pressed against a conductor reports |E| = 0.
 */
export function fieldAt(result: SolveResult, xCm: number, yCm: number): { ex: number; ey: number } {
  if (isInPoint(result.params, xCm, yCm) || isInBar(result.params, xCm, yCm)) {
    return { ex: 0, ey: 0 };
  }
  return fieldAtArrays(resultGrid(result), result.V, result.Ex, result.Ey, xCm, yCm);
}

/* ------------------------------------------------------------------ */
/* Field lines                                                         */
/* ------------------------------------------------------------------ */

export interface FieldLine {
  /** Interleaved x,y coordinates in cm. */
  pts: Float64Array;
}

function unitField(
  result: SolveResult,
  x: number,
  y: number,
  fallbackX: number,
  fallbackY: number
): [number, number] {
  const { ex, ey } = fieldAt(result, x, y);
  const m = Math.hypot(ex, ey);
  if (m < 1e-9) return [fallbackX, fallbackY];
  return [ex / m, ey / m];
}

/**
 * Integrate field lines forward along E. Seeds sit evenly in angle on a ring
 * of radius rp + 0.3 cm around the point conductor. RK4 with a fixed 0.05 cm
 * step along the unit field direction (so the step is truly a fixed arc
 * length). A line stops when it leaves the paper, enters a conductor, meets a
 * field weaker than 0.02 V/cm, or exhausts 4000 steps.
 */
/**
 * Trace `lineCount` field lines outward from a ring around the point conductor
 * with fixed-step RK4 (0.05 cm). A line stops when it leaves the paper or
 * reaches a conductor; the final point is snapped onto the conductor surface
 * (the field magnitude vanishes exactly on a Dirichlet boundary, so without the
 * snap lines stall one step short). Tracing also gives up where |E| < 0.005
 * V/cm, i.e. in genuine dead zones such as the far corner at very low V0 — no
 * conductor contact there, so the renderer must not draw an arrowhead.
 */
export function computeFieldLines(result: SolveResult, lineCount: number): FieldLine[] {
  const p = result.params;
  const rSeed = p.rp + 0.3;
  const dt = 0.05;
  const maxSteps = 4000;
  /** Distance from (x,y) to the bar rectangle; 0 means inside/on it. */
  const barDist = (x: number, y: number): number => {
    const a = (p.barAngleDeg * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const u = (x - p.bx) * ca + (y - p.by) * sa;
    const w = -(x - p.bx) * sa + (y - p.by) * ca;
    return Math.hypot(Math.max(Math.abs(u) - p.barLen / 2, 0), Math.max(Math.abs(w) - 0.5, 0));
  };
  /**
   * Terminate a line a hair before a conductor edge if the step landed within
   * `eps` of it, snapping to the boundary so terminated ends lie on it. Field
   * lines reach conductor surfaces perpendicularly and the field magnitude
   * goes to zero exactly on the boundary, so without this snap lines stop one
   * step short of the plate.
   */
  const snapBoundary = (x: number, y: number): [number, number] | null => {
    if (barDist(x, y) <= 0.03) {
      const a = (p.barAngleDeg * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const u = (x - p.bx) * ca + (y - p.by) * sa;
      const w = -(x - p.bx) * sa + (y - p.by) * ca;
      const uc = Math.max(-p.barLen / 2, Math.min(p.barLen / 2, u));
      const wc = Math.max(-0.5, Math.min(0.5, w));
      return [p.bx + uc * ca - wc * sa, p.by + uc * sa + wc * ca];
    }
    const dp = Math.hypot(x - p.cx, y - p.cy);
    if (dp <= p.rp + 0.03) {
      return [p.cx + ((x - p.cx) / dp) * p.rp, p.cy + ((y - p.cy) / dp) * p.rp];
    }
    return null;
  };
  const lines: FieldLine[] = [];

  for (let k = 0; k < lineCount; k++) {
    const th = (2 * Math.PI * k) / lineCount;
    let x = p.cx + rSeed * Math.cos(th);
    let y = p.cy + rSeed * Math.sin(th);
    // Degenerate layouts: the point may sit inside the bar, so skip bad seeds.
    if (!onPaper(p, x, y) || isInBar(p, x, y) || isInPoint(p, x, y)) continue;

    const pts: number[] = [x, y];
    for (let step = 0; step < maxSteps; step++) {
      if (!onPaper(p, x, y) || isInBar(p, x, y) || isInPoint(p, x, y)) break;
      const m1Field = fieldAt(result, x, y);
      const m1 = Math.hypot(m1Field.ex, m1Field.ey);
      if (m1 < 0.005) break;

      const k1 = unitField(result, x, y, 0, 0);
      const k2 = unitField(result, x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1], k1[0], k1[1]);
      const k3 = unitField(result, x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1], k2[0], k2[1]);
      const k4 = unitField(result, x + dt * k3[0], y + dt * k3[1], k3[0], k3[1]);

      const nx = x + dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
      const ny = y + dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
      // Record the crossing point itself so terminated lines end exactly on the
      // conductor or paper edge (the boundary is reached within one step).
      if (!onPaper(p, nx, ny) || isInBar(p, nx, ny) || isInPoint(p, nx, ny)) {
        pts.push(nx, ny);
        break;
      }
      const snapped = snapBoundary(nx, ny);
      if (snapped) {
        pts.push(snapped[0], snapped[1]);
        break;
      }
      x = nx;
      y = ny;
      pts.push(x, y);
    }

    if (pts.length >= 4) {
      lines.push({ pts: new Float64Array(pts) });
    }
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Equipotential contours (marching squares)                           */
/* ------------------------------------------------------------------ */

export interface LevelSegments {
  /** Potential of this contour, V. */
  iso: number;
  /** Interleaved x1,y1,x2,y2 per segment, in cm. */
  coords: Float64Array;
}

/** Marching-squares edge pairs. Corners: 0=(i,j) 1=(i+1,j) 2=(i+1,j+1) 3=(i,j+1). */
const MS_CASES: Record<number, [number, number][]> = {
  1: [[0, 3]],
  2: [[0, 1]],
  3: [[1, 3]],
  4: [[1, 2]],
  5: [
    [0, 1],
    [2, 3],
  ],
  6: [[0, 2]],
  7: [[2, 3]],
  8: [[2, 3]],
  9: [
    [0, 3],
    [1, 2],
  ],
  10: [[0, 2]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[0, 3]],
};

function crossingOnEdge(
  v: [number, number, number, number],
  iso: number,
  edge: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): [number, number] {
  const va = v[edge];
  const vb = v[(edge + 1) % 4];
  let t = (iso - va) / (vb - va);
  if (!Number.isFinite(t)) t = 0.5;
  if (edge === 0) return [x0 + t * (x1 - x0), y0];
  if (edge === 1) return [x1, y0 + t * (y1 - y0)];
  if (edge === 2) return [x1 - t * (x1 - x0), y1];
  return [x0, y1 - t * (y1 - y0)];
}

/** Contour levels are V_k = V0 * k / (N+1) for k = 1..N. */
export function computeContours(result: SolveResult, levelCount: number): LevelSegments[] {
  const { V } = result;
  const out: LevelSegments[] = [];

  for (let k = 1; k <= levelCount; k++) {
    const iso = (result.params.V0 * k) / (levelCount + 1);
    const segs: number[] = [];
    for (let j = 0; j < result.ny - 1; j++) {
      const r0 = j * result.nx;
      const r1 = (j + 1) * result.nx;
      const y0 = j * result.cell;
      const y1 = (j + 1) * result.cell;
      for (let i = 0; i < result.nx - 1; i++) {
        const v: [number, number, number, number] = [V[r0 + i], V[r0 + i + 1], V[r1 + i + 1], V[r1 + i]];
        let bits = 0;
        if (v[0] >= iso) bits |= 1;
        if (v[1] >= iso) bits |= 2;
        if (v[2] >= iso) bits |= 4;
        if (v[3] >= iso) bits |= 8;
        if (bits === 0 || bits === 15) continue;
        const x0 = i * result.cell;
        const x1 = (i + 1) * result.cell;
        for (const [e1, e2] of MS_CASES[bits]) {
          const p1 = crossingOnEdge(v, iso, e1, x0, y0, x1, y1);
          const p2 = crossingOnEdge(v, iso, e2, x0, y0, x1, y1);
          segs.push(p1[0], p1[1], p2[0], p2[1]);
        }
      }
    }
    out.push({ iso, coords: new Float64Array(segs) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* E-vector overlay samples                                            */
/* ------------------------------------------------------------------ */

export interface VectorSample {
  /** Sample position, cm. */
  x: number;
  y: number;
  /** Display field magnitude: the physics |E| in V/cm (epsr-independent at fixed voltage). */
  ex: number;
  ey: number;
  /** |E| displayed by the overlay, V/cm. */
  disp: number;
}

export interface VectorField {
  samples: VectorSample[];
  /** Arrow length multiplier, cm per (V/cm). Tuned so median field maps to 0.9 cm. */
  scaleK: number;
  /** Largest display |E| among the retained samples, used for color scaling. */
  maxDisp: number;
}

/**
 * Sample E on a regular grid of the given spacing (cm), skipping conductor
 * cells and freak values right at the conductor surfaces (anything above
 * 4x the 90th percentile, which lives in the first cell ring where the
 * central difference is steepest). Arrow length is clamped in the renderer.
 */
export function computeVectorSamples(result: SolveResult, spacingCm: number): VectorField {
  const p = result.params;
  const raw: { x: number; y: number; ex: number; ey: number; disp: number }[] = [];

  for (let y = 0; y <= result.paperH; y += spacingCm) {
    for (let x = 0; x <= result.paperW; x += spacingCm) {
      if (isInPoint(p, x, y) || isInBar(p, x, y)) continue;
      const { ex, ey } = fieldAt(result, x, y);
      const mag = Math.hypot(ex, ey);
      if (mag <= 1e-12) continue;
      raw.push({ x, y, ex, ey, disp: mag });
    }
  }

  if (raw.length === 0) {
    return { samples: [], scaleK: 1, maxDisp: 0 };
  }

  const vals = raw.map((s) => s.disp).sort((a, b) => a - b);
  const median = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.5))];
  const p90 = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.9))];
  const cap = 4 * p90;

  const samples: VectorSample[] = [];
  let maxDisp = 0;
  for (const s of raw) {
    if (s.disp > cap) continue;
    samples.push({ x: s.x, y: s.y, ex: s.ex, ey: s.ey, disp: s.disp });
    if (s.disp > maxDisp) maxDisp = s.disp;
  }

  const scaleK = median > 1e-9 ? 0.9 / median : 1;
  return { samples, scaleK, maxDisp };
}

/* ------------------------------------------------------------------ */
/* Colormap                                                            */
/* ------------------------------------------------------------------ */

/** Smooth ramp over the potential range: deep violet to red through blue, cyan, green, amber. */
export const CMAP_STOPS: readonly (readonly [number, number, number])[] = [
  [59, 7, 100], // #3b0764
  [30, 27, 75], // #1e1b4b
  [29, 78, 216], // #1d4ed8
  [8, 145, 178], // #0891b2
  [16, 185, 129], // #10b981
  [245, 158, 11], // #f59e0b
  [239, 68, 68], // #ef4444
];

/** t = V/V0 clamped to [0,1]. Returns [r,g,b]. */
export function colormap(t: number): [number, number, number] {
  const tt = t < 0 ? 0 : t > 1 ? 1 : t;
  const pos = tt * (CMAP_STOPS.length - 1);
  const i = Math.min(CMAP_STOPS.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = CMAP_STOPS[i];
  const b = CMAP_STOPS[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

export function colormapCss(t: number): string {
  const [r, g, b] = colormap(t);
  return `rgb(${r}, ${g}, ${b})`;
}