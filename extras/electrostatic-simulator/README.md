# Electrostatic Field Simulator

An interactive, hand-drawn canvases physics teaching tool for PHY 151 —
_Relating Electric Fields to Electric Potential_ (Lab 3). It simulates the
conductive-paper apparatus the lab uses: a disc-shaped conductor held at V₀,
a grounded metal bar, and the potential field between them.

**Live at:** `/extras/electrostatic-simulator`

## What it models

- A 30 × 18 cm "conductive paper" sheet sampled at 8 cells/cm (241 × 145 cells).
- The point conductor is a disc (default center 15, 9 cm; radius 0.9 cm) held at V₀.
- The grounded bar (default center 24.5, 9 cm; length 15 cm; 1 cm thick, rotatable) sits at 0 V.
- Laplace's equation ∇²V = 0 on the sheet, with insulating (Neumann) paper edges.
- Solved with a conjugate-gradient iteration preconditioned by a 5-level
  full-multigrid V-cycle: RB-Gauss–Seidel smoothing (ω = 1.4, 2 + 2 sweeps),
  coarsening by 2 with a matching coarse operator, exact dense solves on the
  16 × 10 coarsest grid, and an FMG nested-seed start. Coarse conductor masks
  are node-sampled per conductor with an area-sampling fallback, so the thin bar
  and the small disc stay represented at every level (a missing pin would make
  the coarse operator solve a different problem and stall convergence).
  CG is used because a plain V-cycle stalls on the paper-wide "DC offset" mode,
  whose error decays at only ~0.996/cycle; the preconditioned iteration removes
  it in a few dozen steps. The solve stops when the fine residual RMS falls
  below 4.5e-5 V, typically in ~50 iterations in 150–200 ms. Measured against a
  tightly converged solve, the stopping solution is within 0.12% of V₀.

## Physics commitments

- **Equipotential shapes are εᵣ-independent.** With a uniform dielectric and
  fixed conductor voltages, εᵣ drops out of Laplace's equation, so the pattern
  of equal-potential lines never moves. The simulator uses this honestly:
  nudging εᵣ leaves the pattern untouched.
- **Displayed E = E/εᵣ.** The field for a given conductor charge is screened
  by the dielectric, `E ∝ 1/εᵣ`. The arrows, field-line brightness, and the
  probe readout all divide by εᵣ, so the field visibly fades as εᵣ rises.
- **C\* and U\* scale like εᵣ.** The readouts are normalized estimates
  (g₀ = ring integral of |E| at radius rp + 1.2 cm), so C\* = g₀·εᵣ and
  U\* = ½·C\*·V₀² are in arbitrary units.

## Controls

- **Probe** — hover the paper for a live crosshair, click to pin, drag to
  follow the probe, double-click or press `Esc` to release.
- **Power supply** — V₀ (1–50 V), dielectric constant εᵣ (1–10).
- **Ground bar** — length, angle, and position.
- **Point conductor** — center and radius.
- **Display** — potential map, field lines, equipotentials, E vectors, grid;
  plus line/contour density and E-vector spacing. Display toggles redraw only —
  they never re-solve.
- **3D surface** — oblique projection of V over the sheet; drag to rotate
  (yaw clamped ±1 rad), double-click to reset.

## Structure

```
app/extras/electrostatic-simulator/
  page.tsx                         # server shell, metadata, explainer sections
  electrostatic-simulator.tsx      # "use client" component: two stacked 2D
                                   # canvases + optional 3D canvas, controls
  solver.ts                        # pure-TS physics core (no React, no DOM)
extras/electrostatic-simulator/
  README.md                        # this file
```

`solver.ts` exports everything the UI needs: `solve`, `potAt`, `fieldAt`,
`computeFieldLines`, `computeContours`, `computeVectorSamples`, the colormap
helpers, and the paper/geometry constants. It can be unit-tested or run in a
plain Node script with no dependencies.

## Dev notes

- The page is statically exported (`output: "export"`); the solver and all
  painting run client-side, after first paint.
- The paper is drawn in a fixed warm beige regardless of theme; accent colors on
  top re-read the theme, so the canvases re-paint on `data-theme` changes.
- The solver is coded for speed: interior-row RB SOR with clamped edge columns,
  mirror-symmetric normalized restriction, central-difference E, marching-squares
  contouring, RK4 field lines that snap onto conductor surfaces. A full solve
  takes roughly 150–200 ms on typical hardware.