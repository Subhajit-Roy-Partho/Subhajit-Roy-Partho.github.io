import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ElectrostaticSimulator } from "./electrostatic-simulator";

export const metadata: Metadata = { title: "Electrostatic Field Simulator" };

export default function ElectrostaticSimulatorPage() {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal className="max-w-3xl">
          <Link href="/extras" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← All extras
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            Extras · Physics teaching tools
          </p>
          <h1 className="font-display mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            Electrostatic field simulator
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[var(--muted)]">
            A virtual conductive-paper sheet for PHY&nbsp;151 — <em>Relating Electric Fields to Electric Potential</em>.
            Put a charged disc and a grounded bar on the paper, and the page solves Laplace&rsquo;s equation over the
            whole sheet. Then explore the equipotentials, follow the field lines, and check right angles the way you
            would with the four-point probe and the signal probe in the lab.
          </p>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">PHY 151 · Lab 3</span>
          <span className="chip">Laplace&rsquo;s equation</span>
          <span className="chip">Multigrid + CG</span>
          <span className="chip">E = −∇V</span>
          <span className="chip">εᵣ scaling</span>
        </div>
      </section>

      <section className="container-page section pt-0">
        <Reveal>
          <ElectrostaticSimulator />
        </Reveal>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Reading the sheet"
          title="Six things to try in two minutes"
          description="The simulator reproduces the two-piece conductor setup from the lab, so every exploration below carries over to the real paper."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Right angles",
              body: "Field lines must cross equipotentials at 90°. With E vectors on and contours on, pick a point away from both conductors and check that the arrow meets the contour squarely.",
            },
            {
              title: "Face the point",
              body: "Drag the point conductor to the sheet center and slide the bar out to the edge. Equipotentials become circles and field lines become radial — a clean symmetry check.",
            },
            {
              title: "Probe the falloff",
              body: "Click the paper and drag to read V and |E|. The field drops sharply inside a couple of centimeters of the disc, then flattens — the same behavior you log with the four-point probe.",
            },
            {
              title: "Walk a loop",
              body: "∮E·dl around any closed path is zero, which is what lets a single V exist at all. Drag the probe around a small loop and watch V return to nearly its starting value.",
            },
            {
              title: "Raise the dielectric",
              body: "Bump εᵣ from 1 to 10. Nothing moves — V and E are εᵣ-independent at fixed conductor voltages — while C* and U* grow. That is the honest physics, not a bug.",
            },
            {
              title: "Fly the surface",
              body: "Open the 3D potential view and drag to rotate. Height is V; the disc rises to V₀, the bar sits at 0, and the saddle between them is where the field lines bend hardest.",
            },
          ].map((card) => (
            <div key={card.title} className="card-surface p-5">
              <h3 className="font-display text-sm font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Under the hood" title="How the field is computed" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">The solver</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The sheet is sampled at 8 cells/cm — 241 × 145 cells for the default 30 × 18 cm paper; the Sheet
              size control scales the whole experiment from half to double size at that same resolution. The code
              sets V₀ on the disc and 0 V on the bar, then solves Laplace&rsquo;s equation with a conjugate-gradient
              iteration preconditioned by a five-level multigrid V-cycle. Paper edges are insulating, so potential
              cannot leak across them. A solve reaches the field to about a tenth of a percent of V₀ in roughly
              fifty steps — a fraction of a second in the browser.
            </p>
          </div>
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">The reading</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              E is the negative gradient of V, taken with clamped (one-sided) differences at the paper edges and
              forced to zero inside the conductors. Field lines are integrated with a fourth-order Runge–Kutta
              step along E, seeded just outside the disc; equipotentials are extracted with a marching-squares
              contour. The pointer, the readouts, and the colormap all share the same field arrays.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}