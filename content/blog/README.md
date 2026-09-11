# Blog posts

Drop a new `.mdx` file in this folder and it shows up on `/blog` automatically — no other wiring needed.

## Frontmatter schema

```yaml
---
title: "Post Title"          # required
date: "2025-01-31"            # required, YYYY-MM-DD
description: "One or two sentences shown on the index and in previews." # required
tags: ["oxdna", "hpc"]         # optional, used for the tag filter on /blog
categories: ["simulation"]     # optional, freeform grouping
cover: "/images/blog/xyz.jpg"  # optional, path under /public
draft: false                   # optional — set true to hide from the site while writing
toc: true                      # optional, defaults to true — set false to hide the on-page outline
---
```

## Writing content

- Standard Markdown/MDX: headings, lists, tables (via GFM), images, links.
- Fenced code blocks are syntax-highlighted automatically — just tag the language: \`\`\`bash, \`\`\`python, \`\`\`ini, etc.
- Use the built-in `<Callout type="note" | "tip" | "warning">...</Callout>` component for asides.
- Internal links (starting with `/` or `#`) automatically use Next's client-side router.

## File naming

The filename (minus `.mdx`) becomes the URL slug, e.g. `my-post.mdx` → `/blog/my-post`. Use lowercase, hyphenated names.
