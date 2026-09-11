export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  category: "simulation" | "ml" | "infrastructure";
  link?: string;
};

export const projects: Project[] = [
  {
    id: "oxdna-oxview",
    name: "oxDNA & oxView",
    tagline: "Core developer of the coarse-grained DNA/RNA simulation engine",
    description:
      "Active core developer of oxDNA and its companion visualization suite oxView — implementing non-singular mass support, modern CUDA/GPU compatibility, and ARM optimization, and scaling simulations to ~6 million particles.",
    tags: ["C++", "CUDA", "Python", "Force fields"],
    category: "simulation",
    link: "https://github.com/lorenzo-rovigatti/oxDNA",
  },
  {
    id: "fastdna",
    name: "fastDNA",
    tagline: "Flow-matching generative model for 3D nucleic acid structure",
    description:
      "An SE(3)-equivariant transformer with Clifford geometric algebra attention that generates equilibrium 3D DNA/RNA conformations directly from sequence — trained on HPC with PyTorch Lightning, model sizes from 2M to 70M parameters.",
    tags: ["PyTorch", "Flow matching", "SE(3)-equivariance"],
    category: "ml",
  },
  {
    id: "nanocanvas",
    name: "NanoCanvas",
    tagline: "cadnano2-inspired DNA origami design tool with an agentic API",
    description:
      "A modern origami design tool exposing a full LLM agent REST API (FastAPI, React, Three.js) via Model Context Protocol, enabling programmatic structural design straight from natural-language prompts.",
    tags: ["FastAPI", "React", "Three.js", "MCP"],
    category: "ml",
  },
  {
    id: "physicsgrader",
    name: "PhysicsGrader / Graviton",
    tagline: "Production LLM grading system serving 395 students",
    description:
      "An LLM-based autograder for ASU Physics experimental coursework across 10 lab sections — LangChain + Next.js + Canvas LMS API, with hallucination/factuality checks, RBAC, MFA, and encryption to meet ASU compliance.",
    tags: ["LangChain", "Next.js", "RBAC"],
    category: "ml",
  },
  {
    id: "oxcloud",
    name: "oxCloud",
    tagline: "Unified simulation, analysis, and hosting platform",
    description:
      "A single pipeline for simulating, analyzing, and hosting DNA origami structures — built to make the full oxDNA workflow accessible to experimentalists without HPC expertise.",
    tags: ["Cloud", "Simulation pipeline"],
    category: "infrastructure",
  },
  {
    id: "polycube-design",
    name: "DNA Polycube Inverse Design",
    tagline: "Minimal rule sets for universal 3D nanoscale assembly",
    description:
      "Co-developed algorithms for the inverse design of 3D polycube architectures — determining the minimal set of building blocks and interaction rules needed to self-assemble arbitrary target geometries.",
    tags: ["Inverse design", "Self-assembly"],
    category: "simulation",
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
