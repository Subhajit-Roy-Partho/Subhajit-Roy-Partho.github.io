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
- Run antechamber to obtain amber suitable structure as prepi or mol2. Then parmchk2 to convert it to simulation format interaction.

```bash
antechamber -fi pdb -fo prepi -i ligand.pdb -o ligand.prepi -rn LIG -c bcc -at gaff2
parmchk2 -f prepi -i ligand.prepi -o ligand.frcmod
```
- Add the dna, ligand and protein using tleap.
- Execute a tleap file using `tleap -s -f tleap.in > out.txt `

### Amber

- location of leaprc files $AMBERHOME/dat/leap/cmd