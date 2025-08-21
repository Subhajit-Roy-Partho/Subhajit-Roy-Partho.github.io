---
layout: post
title: oxDNA Simulatiion Guide
date: 2025-08-20 00:00:00
description: A simple step by step guide to simulation oxDNA with different relaxation technique.
tags: compilation tensorflow ml fun
categories: sample-posts
giscus_comments: true
featured: true
---

## oxDNA Installations

For oxDNA installation and running it one need to have a C, C++ compiler like gcc,g++, git to download the code, cmake and make to build it and preferably python for oxDNA analysis toolbar and oxpy.

```
cd oxDNA         # enter the oxDNA folder
mkdir build      # create a new build folder. It is good practice to compile out-of-source
cd build
cmake .. -DCUDA=ON -DPYTHON=ON -CMAKE_BUILD_TYPE=Release #For cpu only installation -DCUDA=OFF and can omit -DPYTHON completely
make -j$nproc
```

The binaries will be in build/bin folder. It is recommended to add it in PATH which can be easily accompolished with `echo "PATH="$PATH:/location/to/build/bin" >> ~/.bashrc && source ~/.bashrc`.

To run a restrained simulation it is advisable to run it with hydrogen bond restrains, which can be generated in oxview, using the following steps:

Dynamics -> Forces -> Set stiffness = ( something between 2 to 5) and Relaxed distance 1.2 -> create from base pair -> Yes.

It will take some time to search the base pairs and will generarte restrains for all the base pairs. Save the structure top and dat file and also the force.txt file as well.

These structure could be simulated with MC then MD with restrains and finally production run without any restrains or max backbone force.

#### MC Simulation setup

For simualtion we would need the .top, .dat and .txt force file and need to write a input file as given below.

