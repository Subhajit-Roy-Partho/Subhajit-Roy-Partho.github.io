---
layout: post
title: Useful bash commands and functions
date: 2024-02-12 00:00:00
description: Useful bashrc commands that I require to write every time I create a new system.
tags: linux bash
categories: sample-posts
giscus_comments: true
featured: true
---

#### To submit multiple replica job using bash script.

```bash
replicas=6
bashExec=$false
sbatchExec=$false

program="/scratch/sroy85/Github/oxDNA/build/bin/oxDNA input"

replicas=6
bashExec=$false
sbatchExec=$false

program="/scratch/sroy85/Github/oxDNA/build/bin/oxDNA input"

mkdir -p output
for ((i=1;i<=replicas;i++)); do
    mkdir -p "output/$i"
    rsync -rzvP main/* "output/$i"
    cd "output/$i"
    if $bashExec ; then
        $program >out.txt &
    fi
    if $sbatchExec ; then
        sbatch submit.sh
    fi
    cd ../..

done
```

#### Check living status of job if not resubmit it

```bash

```