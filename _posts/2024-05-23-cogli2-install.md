---
layout: post
title: Software Installation and Environment Setup
date: 2024-05-23 00:00:00
description: Software Installation and Environment Setup
tags: linux bash
categories: sample-posts
giscus_comments: true
featured: true
---

## Cogli 2 requirements

#### Ubuntu Libraries

- libxrandr-dev
- libxi-dev
- libxxf86vm-dev
- libxinerama-dev
- libxcursor-dev

#### Conda packages

- conda-forge:%3Axorg-libxxf86vm

#### CMAKE addition for conda

```c
if(CONDA)
    include_directories("~/miniconda3/include")
    link_directories("~/miniconda3/lib")
endif(CONDA)
```
change the path accourding to the conda path.