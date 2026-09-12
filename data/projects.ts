export type ProjectLink = { label: string; href: string };

export type ProjectSection = { heading: string; body: string[] };

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  category: "simulation" | "ml" | "infrastructure";
  status: string;
  featured?: boolean;
  liveLink?: ProjectLink;
  repoLink?: ProjectLink;
  publicationIds?: string[];
  figure?: { src: string; alt: string; caption: string };
  story: ProjectSection[];
};

export const projects: Project[] = [
  {
    id: "oxdna",
    name: "oxDNA",
    tagline: "The coarse-grained engine that lets DNA nanotechnology move at simulation speed",
    description:
      "A coarse-grained molecular dynamics engine for DNA and RNA — the workhorse that lets the field prototype nanostructures computationally before ever touching a pipette.",
    tags: ["C++", "CUDA", "Python", "Force fields"],
    category: "simulation",
    status: "Actively maintained · core developer",
    featured: true,
    liveLink: { label: "Run it at oxdna.org", href: "https://oxdna.org" },
    repoLink: { label: "Source on GitHub", href: "https://github.com/lorenzo-rovigatti/oxDNA" },
    publicationIds: ["wisna-dna-paint-2025", "roy-oxview-nar-2026"],
    figure: {
      src: "/images/publications/dna-origami-rmsf.jpeg",
      alt: "A spherical DNA origami modeled in oxDNA, colored by per-nucleotide root-mean-square fluctuation (RMSF)",
      caption:
        "A spherical DNA origami simulated in oxDNA, colored by per-nucleotide RMSF (7.10–11.45 nm) — this kind of flexibility map is what let us characterize the origami structures behind the DNA-PAINT cryptography work.",
    },
    story: [
      {
        heading: "The problem",
        body: [
          "Every DNA origami design starts as a bet: will thousands of short strands actually fold into the shape a researcher drew? Atomistic simulation could answer that, but at the scale of a real origami structure — thousands of nucleotides, microseconds of dynamics — it's computationally out of reach for routine design work.",
          "oxDNA solves this by representing each nucleotide as a single rigid body instead of dozens of atoms, with an interaction potential tuned to reproduce real DNA/RNA thermodynamics and mechanics. That trade-off is what makes it possible to simulate an entire origami's self-assembly, not just a fragment of one.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "As a core developer, my work has focused on making oxDNA fast and correct at scales the original codebase wasn't built for: implementing non-singular mass support, bringing the CUDA backend up to modern GPU architectures, and optimizing the build for ARM (both aarch64 servers and Apple Silicon).",
          "On the modeling side, I built a custom CUDA-optimized path that scales simulations up to roughly 6 million particles, and developed a new coarse-grained force field for irregular origami shapes using rigid-body physics and patchy particles — about 1000× faster than the standard oxDNA2 model for that class of structure. I also extended the patchy-particle force field used for DNA-mediated crystal growth, which fed directly into an experimental result: simulation-guided design that raised the crystal growth temperature by 12°C with a higher yield.",
        ],
      },
      {
        heading: "Where it shows up",
        body: [
          "oxDNA sits underneath most of the other tools on this page — oxView visualizes its output, oxCloud runs it in the browser, and nanobase stores structures designed for it. It's also the simulation backbone cited directly in the DNA-PAINT cryptography work published in Nature Communications, where oxDNA simulations were used to characterize the flexibility of the origami structures being imaged.",
        ],
      },
    ],
  },
  {
    id: "oxview",
    name: "oxView",
    tagline: "A browser you can fold DNA in",
    description:
      "An in-browser viewer and editor for oxDNA/oxRNA structures — load a design, watch a trajectory play back, edit strands by hand, and even drive a live simulation without leaving the tab.",
    tags: ["Three.js", "TypeScript", "WebSockets"],
    category: "simulation",
    status: "Live · core developer",
    featured: true,
    liveLink: { label: "Open oxView.org", href: "https://oxview.org" },
    repoLink: { label: "Source on GitHub", href: "https://github.com/sulcgroup/oxdna-viewer" },
    publicationIds: ["roy-oxview-nar-2026"],
    story: [
      {
        heading: "The problem",
        body: [
          "Simulation output is only useful if someone can actually look at it. Before a browser-based option existed, inspecting an oxDNA trajectory meant installing a desktop viewer, wrangling file formats, and losing the ability to just send a colleague a link.",
        ],
      },
      {
        heading: "What it does",
        body: [
          "oxView renders DNA/RNA nanostructures directly in WebGL: load a topology and configuration, scrub through a trajectory frame by frame, select and edit individual strands — extend, nick, or ligate them — and export the result. Through oxServe, it can also drive a live oxDNA simulation on a connected server and stream the results back over a WebSocket in real time, so relaxing a freshly designed structure becomes an interactive loop instead of a submit-and-wait job.",
          "My contributions have centered on the parts of oxView that talk to oxDNA itself: keeping the viewer in step with engine-side changes like non-singular masses and newer CUDA backends, and — more recently — an oxView LLM mode built by fine-tuning the Qwen model, so structure generation, relaxation, simulation, and analysis can be driven through natural-language prompts instead of the GUI.",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "For a field where the design–simulate–redesign loop used to require real computational expertise, oxView collapses most of that loop into a browser tab. It's the shared interface referenced in the paper describing oxView, oxCloud, and nanobase as one connected ecosystem for simulating, analyzing, and sharing nucleic acid nanostructures.",
        ],
      },
    ],
  },
  {
    id: "oxcloud",
    name: "oxCloud",
    tagline: "oxDNA without the HPC account",
    description:
      "A hosted simulation pipeline that takes a design straight through relaxation, production, and analysis — so an experimentalist can validate a structure without ever touching SLURM.",
    tags: ["Cloud", "GPU scheduling", "Simulation pipeline"],
    category: "infrastructure",
    status: "Live service",
    featured: true,
    liveLink: { label: "Public GPU server — oxdna.org", href: "https://oxdna.org" },
    publicationIds: ["roy-oxview-nar-2026"],
    story: [
      {
        heading: "The problem",
        body: [
          "Running oxDNA well requires knowing quite a bit that has nothing to do with DNA nanotechnology: how to write a relaxation protocol, how to request a GPU node, how to keep an eye on a multi-day job. That's a real barrier for the experimentalists who most need simulation feedback before committing lab time to a design.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "oxCloud packages the full oxDNA workflow — relaxation, equilibration, production, and analysis — into a single hosted pipeline, so a user submits a structure and gets back a relaxed, analyzed trajectory without ever writing an input file or a SLURM script by hand. It's the infrastructure layer connecting design tools upstream to oxView for visualization downstream.",
          "The public face of this work is the GPU-backed simulation server at oxdna.org, which runs on a shared bank of NVIDIA GPUs and is free to use — the same idea at the center of the oxCloud platform, aimed at making simulation a routine step in nanostructure design rather than a specialist's task.",
        ],
      },
    ],
  },
  {
    id: "nanobase",
    name: "nanobase.org",
    tagline: "A shared memory for the DNA nanotechnology field",
    description:
      "An open repository of DNA and RNA nanostructure designs — upload a structure once, and the community can browse, search, and reuse it in whatever tool they prefer.",
    tags: ["Database", "Django", "Design conversion"],
    category: "infrastructure",
    status: "Live",
    liveLink: { label: "Browse nanobase.org", href: "https://nanobase.org" },
    publicationIds: ["roy-oxview-nar-2026"],
    story: [
      {
        heading: "The problem",
        body: [
          "Structural DNA nanotechnology has produced an enormous number of designed nanostructures, but for years there was nowhere central to actually find them — designs lived in supplementary files, personal hard drives, and one-off lab websites, in a dozen incompatible formats.",
        ],
      },
      {
        heading: "What it does",
        body: [
          "nanobase.org is a searchable, browsable archive where a design is uploaded once — with an image, its native design file, an optional interactive 3D view, and metadata like experimental conditions or a literature reference — and made reusable by anyone. Built-in conversion tools translate designs into common simulation-ready formats (including oxDNA and PDB), so a structure deposited by one lab can be picked up and simulated, edited in oxView, or extended by another with minimal friction.",
          "My work here fits into the same ecosystem as oxView and oxCloud: making nanobase a first-class part of the simulate → visualize → share pipeline described in the OxView/oxCloud/nanobase paper.",
        ],
      },
    ],
  },
  {
    id: "fastdna",
    name: "fastDNA",
    tagline: "Skip the simulation, keep the physics",
    description:
      "A flow-matching generative model that predicts equilibrium 3D DNA/RNA structure directly from sequence — trading a slow simulation for a fast forward pass.",
    tags: ["PyTorch", "Flow matching", "SE(3)-equivariance", "Clifford algebra"],
    category: "ml",
    status: "Research prototype",
    featured: true,
    story: [
      {
        heading: "The problem",
        body: [
          "Getting an equilibrated 3D conformation for a DNA or RNA sequence normally means running a simulation — even with oxDNA's speed, that's still seconds to minutes per structure, which adds up fast when you want to screen thousands of candidate designs or generate training data at scale.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "fastDNA is a flow-matching generative model built around an SE(3)-equivariant transformer with Clifford geometric algebra attention, trained to map directly from sequence to an equilibrium 3D conformation — no simulation trajectory required at inference time. Model sizes range from 2M to 70M parameters, trained on HPC infrastructure with PyTorch Lightning and tracked in Weights & Biases.",
          "The equivariance built into the architecture matters here: a DNA helix's physical properties shouldn't depend on how you happened to orient it in space, and baking that symmetry into the model rather than hoping the network learns it from data makes training far more sample-efficient.",
        ],
      },
    ],
  },
  {
    id: "nanocanvas",
    name: "NanoCanvas",
    tagline: "Design DNA origami by describing it, not clicking through it",
    description:
      "A cadnano2-inspired origami design tool with a full agent API — so an LLM (or a script) can drive structural design programmatically, not just a human with a mouse.",
    tags: ["FastAPI", "React", "Three.js", "Model Context Protocol"],
    category: "ml",
    status: "Research prototype",
    featured: true,
    story: [
      {
        heading: "The problem",
        body: [
          "cadnano2 and its descendants are the standard way to lay out a DNA origami scaffold routing, but they're built for a human clicking through a 2D/3D editor one strand at a time. As LLM agents got good enough to reason about structural design, there was no way for one to actually drive a design tool — every existing tool assumed a mouse and a person.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "NanoCanvas reimplements the cadnano2 design workflow with a modern stack — FastAPI backend, React front end, Three.js 3D view — but the key addition is a full REST API exposed via the Model Context Protocol (MCP), so an LLM agent can create, route, and modify a design programmatically with the same expressiveness a human has in the GUI.",
          "That turns origami design into something an agent can iterate on: propose a routing, check it against design rules, adjust, and repeat — all without a human in the loop for every step.",
        ],
      },
    ],
  },
  {
    id: "physicsgrader",
    name: "PhysicsGrader / Graviton",
    tagline: "395 students, one grader that doesn't get tired",
    description:
      "A production LLM grading system for ASU's physics lab courses — built for accuracy and auditability, not just throughput, with hallucination checks and access controls to match.",
    tags: ["LangChain", "Next.js", "Canvas LMS API", "RBAC"],
    category: "ml",
    status: "Deployed internally at ASU",
    story: [
      {
        heading: "The problem",
        body: [
          "Grading experimental physics lab reports well takes real judgment — checking a student's error analysis, not just their final number — but doing that consistently for hundreds of students across ten lab sections is a lot of TA hours, and consistency between graders is hard to guarantee.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "PhysicsGrader (internally, Graviton) is a production LLM-based autograder integrated directly with Canvas via its LMS API, built on LangChain with a Next.js front end. It serves 395 students across 10 lab courses.",
          "Because this grades real coursework that affects real grades, correctness and trust mattered as much as the ML itself: the system runs hallucination and factuality checks on its own output before it reaches a student, and enforces role-based access control, multi-factor authentication, and data encryption to meet ASU's compliance requirements.",
        ],
      },
      {
        heading: "Impact",
        body: [
          "In practice, it cut grading time by 60% while improving feedback consistency across sections — the same rubric applied the same way to every submission, with TAs able to spend their remaining time on the students who actually need help rather than repetitive scoring.",
        ],
      },
    ],
  },
  {
    id: "dna-polycubes",
    name: "DNA Polycube Inverse Design",
    tagline: "Working backward from a shape to the blocks that build it",
    description:
      "Algorithms that solve the inverse problem for 3D DNA self-assembly: given a target shape, find the smallest set of building blocks and interaction rules that will fold into it — and nothing else.",
    tags: ["Inverse design", "Self-assembly", "Multiscale simulation"],
    category: "simulation",
    status: "Preprint · experimentally validated",
    featured: true,
    liveLink: { label: "Read the ChemRxiv preprint", href: "https://chemrxiv.org/doi/10.26434/chemrxiv-2025-qbk3f" },
    publicationIds: ["diep-polycubes-2026"],
    story: [
      {
        heading: "The problem",
        body: [
          "Forward design in DNA nanotechnology is straightforward to state and hard to scale: you can simulate whether a given set of building blocks self-assembles into a given shape, but searching for which blocks and rules produce an arbitrary target shape — while avoiding every possible misassembled alternative — is a much harder combinatorial problem.",
        ],
      },
      {
        heading: "What I helped build",
        body: [
          "This project treats cube-shaped DNA nanostructures as universal building blocks and solves the inverse design problem directly: given a target 3D shape, a multiscale simulation platform combined with constrained optimization identifies the minimal set of distinct polycubes and the interaction rules between them needed to assemble that shape — and only that shape.",
          "The approach was validated on both finite structures and periodic lattices, including a fractal Menger cube, and extends to out-of-equilibrium reconfiguration: assembled structures can be rearranged after the fact by introducing invader cubes that displace the ones already in place.",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "Minimizing the block count isn't just an efficiency detail — every additional distinct block is another opportunity for the system to misfold, so finding the truly minimal rule set is what makes complex, reliable 3D self-assembly practical rather than theoretical.",
        ],
      },
    ],
  },
];

export const researchAreas = [
  {
    key: "ml",
    title: "Machine Learning & AI",
    blurb: "Generative models, transformers, and LLM agents for structure generation, grading, and scientific retrieval.",
  },
  {
    key: "simulation",
    title: "Molecular Simulation & Force Fields",
    blurb: "Coarse-grained and all-atom modeling of DNA/RNA self-assembly, from force fields to million-particle GPU simulation.",
  },
  {
    key: "infrastructure",
    title: "Computational Infrastructure",
    blurb: "HPC clusters, simulation pipelines, and the experimental validation that closes the loop with wet-lab results.",
  },
] as const;

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
