---
layout: post
title: Bash automation
date: 2024-02-12 00:00:00
description: Automation using bash scripts, the most powerful tool in linux.
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

```bash
originalDir=$(pwd)
folders=$(find . -maxdepth 1 -type d)


for dir in $folders; do
    first=1
    if [ "$dir" == "." ] || [ "$dir" == "./plot" ]; then
        continue
    fi

    echo "Entering $dir/output"

    cd "$dir/output"
    subfolders=$(find . -maxdepth 1 -type d)

    cp  -rf "$originalDir/plot.gnuplot" "./plot.gnuplot"
    ls
    sed -i "s/folder/${dir:2}/g" "./plot.gnuplot"
    for subdir in $subfolders; do
        if [ "$subdir" == "." ]; then
            continue
        fi
        if [ "$first" == "1" ]; then
            sed -i "s/#plottingHere/plot '${subdir:2}\/energy.ign' w l title '${subdir:2}'\n#plottingHere/g" "./plot.gnuplot"
            first=0
        else
            sed -i "s/#plottingHere/replot '${subdir:2}\/energy.ign' w l title '${subdir:2}'\n#plottingHere/g" "./plot.gnuplot"
        fi
    done
    gnuplot plot.gnuplot
    cd "$originalDir"
    echo ""
done
```

```bash
set terminal pngcairo size 1024,768

# Set the output file name
set output '../../plot/folder.png'

set logscale x
set yrange [:3]
# Set title and labels (optional)
set title 'Plot for folder'
set xlabel 'X in log SU'
set ylabel 'Y in linear SU'

# Plot the data
# Assuming the data file is named 'data.dat', and you want to plot column 1 as X and column 2 as Y
#plottingHere

# Unset output to finalize the file
unset output
set output '../../plot/folder.png'
replot
unset output
```