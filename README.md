# subhajit-roy-partho.github.io

Personal site and blog, built with Next.js (static export) + Tailwind CSS + Three.js/GSAP/Framer Motion, deployed to GitHub Pages via GitHub Actions on every push to `master`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs the static site to /out
```

## Add a blog post

Drop a new `.mdx` file into `content/blog/` — see `content/blog/README.md` for the frontmatter schema. It appears on `/blog` automatically on the next build.

## Content

- `data/site.ts` — profile, education, experience, skills, awards, presentations, service
- `data/publications.ts` — publication list
- `data/projects.ts` — featured tools/projects and research areas
- `content/blog/` — blog posts (MDX)
- `public/cv/CV.pdf` — downloadable CV (replace with an updated export from the LaTeX source)

The previous Jekyll (al-folio) version of this site is preserved on the `legacy-jekyll-site` branch.
