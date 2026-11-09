import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { profile } from "@/data/site";

export const metadata: Metadata = {
  title: "For recruiters",
  description:
    "One-page summary: what I work on, what I can do, evidence you can check, and how to reach me.",
};

const focus = [
  {
    title: "Molecular simulation & force fields",
    body: "Developer of oxDNA and oxView (CUDA and ARM support, merged upstream; Metal GPU backend on a separate branch). All-atom MD with AMBER, GROMACS, NAMD and OpenMM; enhanced sampling (umbrella sampling, REMD); MM/PBSA and MM/GBSA free-energy ranking.",
  },
  {
    title: "Machine learning for molecules",
    body: "fastDNA: an SE(3)-equivariant flow-matching model that generates 3D DNA/RNA conformations from sequence (in preparation), with a JAX path optimized for TPUs. PLAS-5k: a 5,000-complex protein–ligand affinity dataset (Scientific Data, 2022). oxView LLM: a fine-tuned Qwen model that drives simulation and analysis from natural language.",
  },
  {
    title: "Scientific software & infrastructure",
    body: "C++/CUDA, Python, TypeScript/WebGL. oxCloud (hosted simulation), nanobase (shared structures), SLURM/HPC campaigns with checkpoint-and-resume, and web tools used by experimental labs.",
  },
  {
    title: "Closing the loop with experiments",
    body: "Simulation-guided design that raised the growth temperature of a DNA origami crystal by 12 °C in the lab; all-atom modelling for DNA-templated PROTACs (J. Am. Chem. Soc., 2025); image analysis for DNA-PAINT and AFM.",
  },
];

const evidence = [
  { label: "oxDNA", note: "Coarse-grained MD engine", href: "/research/oxdna" },
  { label: "oxView", note: "Browser viewer/editor + LLM mode", href: "/research/oxview" },
  { label: "fastDNA", note: "Generative model for DNA/RNA 3D structure", href: "/research/fastdna" },
  { label: "rigidDNA2 / rigidRNA", note: "Design → simulation-ready structure (in preparation)", href: "/research/rigiddna" },
  { label: "PLAS-5k", note: "Protein–ligand affinity dataset", href: "/research/plas5k" },
  { label: "NanoCanvas", note: "Multi-agent LLM origami design tool", href: "/research/nanocanvas" },
  { label: "Publications", note: "Papers, preprints and manuscripts", href: "/publications" },
];

const skills: { group: string; items: string }[] = [
  { group: "Languages", items: "Python, C++ (CUDA, OpenMP, MPI), TypeScript/JavaScript, Bash, Fortran, MATLAB" },
  { group: "ML", items: "PyTorch, JAX (TPU), TensorFlow, flow matching, equivariant transformers, LangChain, Hugging Face" },
  { group: "Simulation", items: "oxDNA/oxRNA, AMBER, GROMACS, NAMD, OpenMM, umbrella sampling, REMD, MM/PBSA, MM/GBSA" },
  { group: "Cheminformatics & structure", items: "RDKit, MDAnalysis, MOE, Rosetta, ViennaRNA, PyMOL, VMD" },
  { group: "Systems", items: "SLURM/HPC, Docker, Linux (x86 and ARM), Git, Weights & Biases" },
];

export default function RecruitersPage() {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">For recruiters</p>
          <h1 className="font-display mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            {profile.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Physics PhD candidate (Arizona State University, Šulc lab; defense expected 2027) working at the
            intersection of molecular simulation and machine learning.
          </p>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)]">
            I am looking for full-time research and engineering roles in machine learning for molecular
            simulation and biomolecular design, starting after my defense. Based in {profile.location}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a className="card-surface px-4 py-2" href="/cv/CV.pdf">Download CV (PDF)</a>
            <a className="card-surface px-4 py-2" href={`mailto:${profile.email}`}>Email</a>
            <a className="card-surface px-4 py-2" href={profile.links.linkedin}>LinkedIn</a>
            <a className="card-surface px-4 py-2" href={profile.links.github}>GitHub</a>
            <a className="card-surface px-4 py-2" href={profile.links.scholar}>Google Scholar</a>
          </div>
        </Reveal>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="What I do" title="Four things I can bring to a team" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {focus.map((f, i) => (
            <Reveal key={f.title} delay={0.05 * i}>
              <div className="card-surface h-full p-6">
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Evidence"
          title="Things you can open and check"
          description="Each project page says what is published, what is a prototype, and what is still in preparation."
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {evidence.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="card-surface block p-4">
                <span className="font-display font-semibold">{e.label}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{e.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Skills" title="Tools I use" />
        <dl className="mt-8 grid gap-4">
          {skills.map((s) => (
            <div key={s.group} className="card-surface p-4 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="font-display text-sm font-semibold">{s.group}</dt>
              <dd className="mt-1 text-sm text-[var(--muted)] sm:mt-0">{s.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Status" title="What is published and what is not" />
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>Published: PLAS-5k (Scientific Data 2022), the DNA-templated PROTAC paper (JACS 2025), and the DNA-PAINT cryptography paper (Nature Communications 2025).</li>
          <li>Accepted or under review: the neuroscience review (Frontiers in Neural Circuits) and the OxView/oxCloud/nanobase paper (Nucleic Acids Research).</li>
          <li>In preparation: fastDNA and rigidDNA2/rigidRNA. Numbers on their pages are preliminary until the papers are out.</li>
        </ul>
      </section>
    </div>
  );
}
