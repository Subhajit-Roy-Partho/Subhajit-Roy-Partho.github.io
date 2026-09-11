export const profile = {
  name: "Subhajit Roy",
  role: "PhD Candidate, Computational Biophysics",
  affiliation: "Petr Šulc's Lab, Department of Physics, Arizona State University",
  location: "Tempe, AZ",
  email: "me.subhajitroy1999@gmail.com",
  summary:
    "Highly motivated PhD candidate specializing in computational biophysics with expertise in DNA nanotechnology, molecular dynamics simulation, and machine learning. Experienced in developing novel computational tools (oxDNA, oxView) and applying deep learning to structural biology problems. Strong track record of publications, cross-disciplinary collaboration, and translating computational insights into experimental validation. Passionate about advancing scientific computing through innovative algorithm development and open-source contributions.",
  links: {
    github: "https://github.com/subhajit-roy-partho",
    linkedin: "https://www.linkedin.com/in/subhajit-r-692ba6113",
    scholar: "https://scholar.google.com/citations?hl=en&user=17ItoNYAAAAJ",
    portfolio: "https://subhajit-roy-partho.github.io",
  },
};

export const stats = [
  { label: "Years in research", value: "4+" },
  { label: "Publications", value: "8" },
  { label: "Tools & platforms built", value: "6" },
  { label: "Students served by PhysicsGrader", value: "395" },
];

export type Education = {
  degree: string;
  institution: string;
  period: string;
  detail: string;
  extra?: string;
};

export const education: Education[] = [
  {
    degree: "Physics, PhD",
    institution: "Petr Šulc's Lab, Arizona State University",
    period: "August 2022 – Spring 2027",
    detail: "Computational design and analysis of genetic materials, focusing on DNA origami self-assembly.",
    extra: "CGPA 3.94 / 4.00",
  },
  {
    degree: "Physics, Integrated BS-MS",
    institution: "UM-DAE Centre for Excellence in Basic Sciences",
    period: "August 2017 – July 2022",
    detail:
      "Master's Thesis: PLAS-5k binding affinity database and retrosynthesis prediction using deep learning. Advisor: Prof. Deva Priyakumar, IIIT Hyderabad.",
    extra: "CGPA 7.3 / 10.0",
  },
];

export type ResearchRole = {
  title: string;
  institution: string;
  period: string;
  advisor: string;
  categories: {
    heading: string;
    skills: string;
    bullets: string[];
  }[];
};

export const experience: ResearchRole[] = [
  {
    title: "PhD Research",
    institution: "Arizona State University",
    period: "August 2022 – Spring 2027",
    advisor: "Prof. Petr Šulc",
    categories: [
      {
        heading: "Machine Learning & AI Development",
        skills:
          "PyTorch, TensorFlow, LangChain, CuPy, Transformers, GCNN, Boltzmann Machines, Clustering, Molecular embedding, OpenCV",
        bullets: [
          "Created a Scalable Interpolant Transformer with SE(3)-invariant coordinates to generate equilibrated 3D conformations of DNA/RNA from sequence inputs, achieving atomic-level structural accuracy.",
          "Extended the transformer architecture to produce relaxed 3D DNA origami structures from line diagrams, enabling biophysics-informed design of complex nanostructures.",
          "Designed oxView LLM, fine-tuning the Qwen model for end-to-end DNA/RNA structure generation, relaxation, simulation, and analysis through natural language prompts.",
          "Improved DNA-PAINT super-resolution microscopy to 1nm resolution using DBSCAN clustering algorithms for 3D origami geometry deconvolution.",
          "Integrated oxDNA simulation with ML algorithms to uncover detailed nucleic acid dynamics and folding pathways.",
          "Accelerated AFM image analysis of DNA origami using OpenCV-based automated feature detection.",
          "Developed an LLM-based autograder using LangChain for ASU Physics experimental coursework, reducing grading time by 60% while improving feedback consistency.",
          "Built fastDNA: a flow-matching generative model (SE(3)-equivariant transformer, Clifford geometric algebra attention) for generating equilibrium 3D DNA/RNA conformations; trained on HPC with PyTorch Lightning and Weights & Biases; model sizes 2M–70M parameters.",
          "Developed PhysicsGrader / Graviton: a production LLM grading system (LangChain, Next.js, Canvas LMS API) serving 395 students across 10 lab courses; implemented hallucination/factuality checks, RBAC, MFA, and data encryption (ASU compliance).",
          "Built NanoCanvas: a cadnano2-inspired DNA origami design tool with a full LLM agent REST API (FastAPI, React, Three.js) enabling programmatic structural design via Model Context Protocol (MCP).",
          "Developed RAG-backed retrieval pipelines using LangChain, FAISS vector database, and Hugging Face embeddings for domain-specific scientific document search and context-aware LLM responses.",
        ],
      },
      {
        heading: "Molecular Simulation & Force Field Development",
        skills:
          "Developer of oxDNA and oxView, AMBER MD, GROMACS, OpenMM, C++, CUDA, Force field development, Cython",
        bullets: [
          "Active core developer of oxDNA and oxView: implemented non-singular mass support, modern GPU compatibility (CUDA), and ARM architecture optimization.",
          "Co-developed algorithms for inverse design of 3D polycube architectures, determining minimal building block sets and interaction rules for target geometries.",
          "Built custom CUDA-optimized code to simulate unprecedented system sizes, scaling molecular dynamics simulations to ~6 million particles.",
          "Formulated protein-DNA hybrid system (PROTAC) denaturation pathways using quantum-classical all-atom simulations for targeted protein degradation.",
          "Developed a novel coarse-grain force field for irregular origami shapes using rigid body physics and patchy particle models, achieving a 1000× speedup over oxDNA2.",
          "Enhanced the patchy particle force field for DNA-mediated crystal growth with improved dynamics and phase behavior prediction.",
          "Achieved experimental validation: increased DNA origami crystal growth temperature by 12°C with higher yield based on simulation-guided design.",
          "Designed DNA icosahedron-helix crystal systems with optical properties at visible wavelengths for photonic applications.",
          "Built oxCloud: a unified platform for simulation, analysis, and hosting of DNA origami structures, simplifying the complete simulation pipeline for experimentalists.",
          "Developed a Babylon.js-based 3D visualization platform for non-standard coarse-grain molecular models.",
          "Fitted SAXS experimental results with simulation using constrained GROMACS simulation.",
        ],
      },
      {
        heading: "Computational Infrastructure & Experimental Validation",
        skills: "SLURM, Linux Kernel, Docker, Kubernetes, DNA purification, AFM, DNA-PAINT, PCR",
        bullets: [
          "Set up and maintain Linux HPC clusters with x86-64 and ARM64-v8 CPUs and NVIDIA GPUs using the SLURM workload manager.",
          "Hands-on experience with experimental techniques: DNA gel electrophoresis, PCR, DNA-PAINT super-resolution microscopy, AFM imaging.",
          "Validated computational predictions through wet-lab experiments, closing the loop between simulation and experimental design.",
        ],
      },
    ],
  },
  {
    title: "Master's Thesis",
    institution: "IIIT Hyderabad",
    period: "2021 – 2022",
    advisor: "Prof. Deva Priyakumar",
    categories: [
      {
        heading: "Binding Affinity Prediction",
        skills: "PyTorch, CNN, AMBER MD, MM-PBSA, MM-GBSA, AutoDock Vina, Molecular docking",
        bullets: [
          "Generated the PLAS-5k dataset: 5,000 protein-ligand complexes with binding affinities for ML training (published in Scientific Data).",
          "Developed a CNN model achieving a Pearson correlation coefficient of 0.96 in 10-fold cross-validation.",
          "Automated all-atom MD simulations and extracted binding parameters (MM-PBSA/MM-GBSA), outperforming AutoDock Vina in accuracy and speed.",
          "Published an open-access dataset enabling broader community research in drug discovery.",
        ],
      },
    ],
  },
  {
    title: "Summer Research",
    institution: "IISER Kolkata",
    period: "2017 – 2020",
    advisor: "Prof. Neelanjana Sengupta",
    categories: [
      {
        heading: "Viral Protein Dynamics",
        skills: "NAMD, Conformational entropy analysis, SASA calculations, Structural persistence analysis",
        bullets: [
          "Investigated allosteric destabilization of the Zika virus NS1 protein β-ladder domain through disulfide bond reduction.",
          "Performed extensive NAMD simulations, analyzing conformational entropy, enthalpy, SASA, and structural persistence.",
          "Identified biochemical pathways for NS1 destabilization, informing structure-based drug design strategies (published in Biophysical Journal).",
        ],
      },
    ],
  },
];

export const skillGroups: { label: string; items: string }[] = [
  {
    label: "Programming Languages",
    items:
      "Python (PyTorch, TensorFlow, CuPy, Cython, Biopython), C++ (CUDA, OpenMP, MPI), JavaScript (Babylon.js, Three.js, React/Gatsby, Node.js), FORTRAN, MATLAB, Mathematica, Bash, Java, R, C#, Lua",
  },
  {
    label: "Machine Learning",
    items:
      "PyTorch, TensorFlow, Keras, LangChain, Transformers, GCNN, Boltzmann Machines, Clustering algorithms (DBSCAN), Molecular embeddings, OpenCV, MCP, Hugging Face (fine-tuning, model hub), RAG pipelines, FAISS (vector DB), Weights & Biases, PyTorch Lightning, Flow matching, Diffusion models",
  },
  {
    label: "Molecular Simulation",
    items: "Developer: oxDNA, oxView · Expert: AMBER, NAMD, GROMACS, OpenMM · Force field development, Coarse-graining, Enhanced sampling methods",
  },
  {
    label: "Visualization Tools",
    items: "VMD, UCSF Chimera, PyMOL, oxView, Custom Babylon.js/Three.js platforms",
  },
  {
    label: "HPC & DevOps",
    items: "SLURM, Linux kernel, Docker, Kubernetes, Tinycore/EDK2, Git/GitHub",
  },
  {
    label: "Experimental Methods",
    items: "DNA gel electrophoresis, PCR, DNA-PAINT microscopy, AFM imaging, DNA purification, sample preparation",
  },
  {
    label: "Web Development",
    items: "Gatsby (React), Laravel, Lumen, Node.js, React Native, Flutter (iOS/Android)",
  },
  {
    label: "Hardware / Embedded",
    items: "Embedded C (Arduino, STM32), Raspberry Pi, Android (Java), OpenCL",
  },
];

export const awards: string[] = [
  "NSF Travel Award (2025) and ASU Graduate Travel Award for conference participation",
  "DST-INSPIRE Fellowship — a prestigious national fellowship awarded to the top 1% of students in India pursuing a PhD in sciences",
  "Vijyoshi Science Camp 2018 — selected participant at IISc Bangalore (organized by KVPY)",
  "Teaching & Research Assistantships — Arizona State University (2022–Present)",
];

export const presentations: string[] = [
  "FNANO 2025 — presented oxDNA software ecosystem developments and applications",
  "Science Leadership Workshop 2020 — participant",
  "Big Data 2020 — Centre for Mathematical Sciences and Applications, Harvard University",
  "AWS World Summit Online 2020 — attended cloud computing and ML sessions",
  "Journal of Physical Chemistry Workshop — IISER Kolkata, June 2018",
];

export const service: string[] = [
  "Member — Biophysical Society Student Chapter, Arizona",
  "Science Outreach — presenter at Biodesign Open Door, ASU BioFest 2023 & 2024, Bioscience Network ACP, ASU Homecoming",
  "Community Engagement — represented ASU Physics Department at Luke Air Force Base Air Day 2024",
  "Event Organizer — hosted career conversation sessions and the BPS student chapter image contest for calendars",
];

export const additionalProjects: string[] = [
  "Generated and analyzed radio telescope images from GMRT and NASA SkyView across multiple wavelengths (radio, IR, UV, visible)",
  "Classified radio galaxies using multi-spectrum data analysis techniques",
  "Analyzed real-time radio astronomy data to study Milky Way structure and properties",
  "Designed a high-altitude quadcopter using Arduino and STM32 microcontrollers",
  "Developed a uniform job distribution algorithm for multi-GPU/CPU systems using OpenCL",
];
