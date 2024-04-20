---
layout: post
title: Bash automation
date: 2024-04-19 00:00:00
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

#### Automatic job management for private queue

- Create a watchdog script that needs to be executed from time to time, which will check if the jobs exists or has stopped. If stopped run a resume slurm script.

```bash
checkJob(){
    status=$(squeue -h -j $1 -o "%T")

    if [[ -z "$status" ]]; then
        echo "The job $1 has finished"
        return 1;
    else
        case $status in
        "RUNNING")
            echo "The job $1 is running"
            return 0
            ;;
        "PENDING")
            echo "The job $1 is pending in queue"
            return 2
            ;;
        *)
            echo "The job $1 is in: $status"
            return 3
            ;;
        esac
    fi
}

curretDir=$(pwd)

while IFS="*" read -ra p || [ -n "$p" ]; do
    checkJob ${p[0]}
    status=$?
    if [[ $status -eq 1 ]]; then
        echo "Restarting the job"
        cd ${p[1]}
        eval ${p[2]}
    fi
done < jobs.txt
```

- The above script will look into a `jobs.txt` which will have the `process id * location of slurm script * script`, for example

```bash
15169644*/scratch/sroy85/PHBdna2/duplex/5T/subResume.sh*"sbatch subResume.sh"
15080501*/scratch/sroy85/PHBdna2/duplex/*"sbatch subResume.sh"
```

- And the resume slurm script would look like below

```bash
#!/bin/sh
#SBATCH -q private
#SBATCH -p general
#SBATCH -G a100:1
#SBATCH -t 5-00:00
#SBATCH -c 20
#SBATCH -o code.out
#SBATCH -e code.err

module load cuda-11.7.0-gcc-11.2.0 gcc-11.2.0-gcc-11.2.0 cmake eigen-3.4.0-gcc-11.2.0

export CUDA_MPS_PIPE_DIRECTORY=/tmp/mps-pipe_$SLURM_TASK_PID
export CUDA_MPS_LOG_DIRECTORY=/tmp/mps-log_$SLURM_TASK_PID
mkdir -p $CUDA_MPS_PIPE_DIRECTORY
mkdir -p $CUDA_MPS_LOG_DIRECTORY
nvidia-cuda-mps-control -d

program="oxDNA input"
add="\nrefresh_vel = 0"
replicas=6

dir=("10T","15T","20T")
for folder in "${dir[@]}"; do
    cd $folder
    for((i=1;i<=$replicas;i++)); do
        cd "output/$i"
        echo $add >> inputProd
        /scratch/sroy85/Github/oxDNA/build/bin/oxDNA inputProd >outProd.txt 2>&1 &
        cd ../..
    done
    cd ..
done

wait 
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