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
execType=0

program="oxDNA input"

mkdir -p output
for ((i=1;i<=replicas;i++)); do
    mkdir -p "output/$i"
    rsync -rzvP main/* "output/$i"
    cd "output/$i"
    if [ "$execType" -eq 1 ]; then
        $program >out.txt &
    fi
    if [ "$execType" -eq 2 ]; then
        sbatch submit.sh
    fi
    cd ../..

done
```

#### Check living status of job if not resubmit it

```bash

```

#### To change an input parameter like temperature and running simulation

```bash
start=0.11
stop=0.28
step=0.01
execType=1
program="oxDNA input"
mkdir -p output
for i in $(seq $start $step $stop); do
    mkdir -p "output/$i"
    rsync -rzvP main/* "output/$i"
    cd "output/$i"
    echo "T=$i" >> input
    if [ "$execType" -eq 1 ]; then
        $program >out.txt &
    fi
    if [ "$execType" -eq 2 ]; then
        sbatch submit.sh
    fi
    cd ../..
done
```
