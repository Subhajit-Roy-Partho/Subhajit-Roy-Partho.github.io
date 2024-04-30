---
layout: post
title: All atoms simulation for DNA
date: 2024-02-12 00:00:00
description: All atoms simulation tutorial for DNA
tags: linux bash
categories: sample-posts
giscus_comments: true
featured: true
---

### System setup using Amber

- Generate the structure of DNA using tools like NAB, CHIMERA etc.
- Generate the ligand structure using GaussView or Avogardo2
- Run antechamber to obtain amber suitable structure as prepi or mol2 (mol2 is a preferred format). Then parmchk2 to convert it to simulation format interaction.

```bash
antechamber -fi pdb -fo prepi -i ligand.pdb -o ligand.prepi -rn LIG -c bcc -at gaff2
parmchk2 -f prepi -i ligand.prepi -o ligand.frcmod
```
- Add the dna, ligand and protein using tleap.
- Execute a tleap file using `tleap -s -f tleap.in > out.txt `

### Amber

- location of leaprc files $AMBERHOME/dat/leap/cmd

## Protein modelling

### Homology modelling for a missing residue:

- Easiest way to install modeller is through conda
```bash
mamba install -c salilab modeller

```
- Add the modeller license to the license as specified by the installer code.
- Figure out the modeller executable name, which should be in the following format modVersion, for my case it is mod10.5
- Modeller can be run manually following the documentation but Chimera already has a prebuilt function and beautiful visualizer to help us out.
- Load the structure which needs has the missing residues, for my case I am opening `5L2I`.
- 

## Special Comments

- **CYS** represents normal cysteine residues, while -ve charge or the depronated state is written as **CYM** and cysteine with disulphide bond or other special bonds are written as **CYX**. [[1]](https://ambermd.org/tutorials/advanced/tutorial1_adv/)



## References

1. [Amber tutorial A1](https://ambermd.org/tutorials/advanced/tutorial1_adv/)