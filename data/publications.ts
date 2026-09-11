export type Publication = {
  id: string;
  authors: string; // "Roy, S." rendered with self-name bolded in the UI via `**Roy, S.**` marker
  title: string;
  venue: string;
  year: number;
  status?: "under review" | "accepted" | "preprint";
  link?: string;
  doi?: string;
};

// Self-name marker: wrap the author's own name in ** so components can bold it.
export const publications: Publication[] = [
  {
    id: "roy-oxview-nar-2026",
    authors: "**Roy, S.**, Sikand, N., Sample, M., Evans, J., Haggenmueller, S., Kikla, A., Matthies, M., Šulc, P.",
    title: "OxView, oxCloud and nanobase: an interactive interface for simulation, analysis and sharing of DNA and RNA nanostructures.",
    venue: "Nucleic Acids Research",
    year: 2026,
    status: "under review",
  },
  {
    id: "roy-molecular-origami-2026",
    authors: "**Roy, S.**, Pradhan, A. K., Jainarayanan, A. K.",
    title:
      "Molecular Origami in Neuroscience: Noncanonical DNA Structures and Functional Nucleic Acids in Neural Regulation and Disease.",
    venue: "Frontiers in Neural Circuits",
    year: 2026,
    status: "accepted",
    link: "https://www.frontiersin.org/journals/neural-circuits/articles/10.3389/fncir.2026.1893836/abstract",
  },
  {
    id: "satyabola-chiral-metamaterial-2026",
    authors:
      "Satyabola, D., Feng, S., Chopade, P., Prasad, A., Wang, L., Bamrah, N., Chen, L., **Roy, S.**, Sakai, A., Wang, C., Sulc, P.",
    title: "DNA-templated Chiral Metamaterial Array as Information Bits.",
    venue: "bioRxiv",
    year: 2026,
    status: "preprint",
    link: "https://www.biorxiv.org/content/10.64898/2026.01.25.701623v1",
  },
  {
    id: "diep-polycubes-2026",
    authors:
      "Diep, T.†, Liu, H.†, Evans, J., Matthies, M., Sample, M., **Roy, S.**, Podbielski, D., Vaidyanathan, S., Williams, D., Kim, K., Kroc, L., Wang, H., Ke, Y., Hihath, J., Yan, H., Šulc, P.",
    title: "Universal 3D Nanoscale Assembly with DNA Polycubes.",
    venue: "Nature Chemistry",
    year: 2026,
    status: "under review",
    link: "https://chemrxiv.org/doi/10.26434/chemrxiv-2025-qbk3f",
  },
  {
    id: "zheng-jacs-2025",
    authors: "Zheng, R., Prasad, A., Satyabola, D., Xu, Y., **Roy, S.**, Yan, Y., Sulc, P., Yan, H.",
    title:
      "DNA-Templated Spatially Controlled Proteolysis Targeting Chimera for Cyclin D1–CDK4/6 Complex Protein Degradation.",
    venue: "Journal of the American Chemical Society, 147(33), 29742–29755",
    year: 2025,
    link: "https://doi.org/10.1021/jacs.5c04918",
    doi: "10.1021/jacs.5c04918",
  },
  {
    id: "wisna-dna-paint-2025",
    authors:
      "Wisna, G. B. M., Sukhareva, D., Zhao, J., Satyabola, D., Matthies, M., **Roy, S.**, Šulc, P., Yan, H., Hariadi, R. F.",
    title: "High-speed 3D DNA-PAINT and unsupervised clustering for unlocking 3D DNA origami cryptography.",
    venue: "Nature Communications",
    year: 2025,
    link: "https://www.nature.com/articles/s41467-025-66338-y",
  },
  {
    id: "korlepara-plas5k-2022",
    authors:
      "Korlepara, D. B., Vasavi, C. S., Jeurkar, S., Pal, P., **Roy, S.**, et al.",
    title: "PLAS-5k: Dataset of Protein-Ligand Affinities from Molecular Dynamics for Machine Learning Applications.",
    venue: "Scientific Data, 9, 548",
    year: 2022,
    link: "https://doi.org/10.1038/s41597-022-01631-9",
    doi: "10.1038/s41597-022-01631-9",
  },
  {
    id: "roy-zikv-2020",
    authors: "Roy, P., **Roy, S.**, Sengupta, N.",
    title:
      "Disulfide Reduction Allosterically Destabilizes the β-Ladder Subdomain Assembly within the NS1 Dimer of ZIKV.",
    venue: "Biophysical Journal, 119(8), 1525–1537",
    year: 2020,
    link: "https://doi.org/10.1016/j.bpj.2020.08.036",
    doi: "10.1016/j.bpj.2020.08.036",
  },
];
