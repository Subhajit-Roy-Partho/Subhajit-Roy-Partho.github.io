---
layout: post
title: Optimization of a molecular structure using DFT calculations
date: 2024-02-26 00:00:00
description: Optimization of a molecular structure using DFT calculations
tags: Quantum CML
categories: sample-posts
giscus_comments: true
featured: true
---

In this project I was trying to figure out distance between two ligands bounded to a phosphate backbone of DNA with highest degree of accuracy. The ligand also contains non standard elements which motivated me to use quantum forcefields instead of classical all atoms MD simulations.

- To draw the different structures of the ligands and the DNA I use avagadro which draws them and somewhat optimizes them as well.
- This cml files are now optimized using `MMFF94s` forcefield before proceeding with calculation in GAMESS, Gaussian or any other Quantum Engines. This is carried out with the help of open babel using the following code. `obabel initial.cml -O optimized.cml --minimize --steps 15000 --sd --log --ff MMFF94s`. Here initial is the initial structure and optimized is the final output. --sd to use steepest descent algorithm --log will log all the proceding. Following all the force field that can be used:

```bash
C:\>obabel -L forcefields
GAFF    General Amber Force Field (GAFF).
Ghemical    Ghemical force field.
MMFF94    MMFF94 force field.
MMFF94s    MMFF94s force field.
UFF    Universal Force Field.
```


### References

- https://open-babel.readthedocs.io/en/latest/Command-line_tools/babel.html#forcefield-energy-and-minimization
- https://avogadro.cc/
