---
layout: cpage
title: Tutorial 1, Creating simple preparation file in Amber.
parent: Amber MD Tutorial
nav_order: A
prevLink: "/home"
nextLink: "/home"
---

### Introduction

For this tutorial we will be working with RvSAHS4 (5z4g).

#### Correct the structures with Pymol, Chimera or any other tool. 
#### Run H++ server. 
#### Tleap file

```
source leaprc.protein.ff14SB
source leaprc.water.tip3p
set default PBRadii mbondi3
foo = loadPDB protein.pdb
solvatebox foo TIP3PBOX 10.0
addions foo Cl- 0
addions foo Na+	0
savepdb foo proteinSolv.pdb
saveamberparm foo protein.parm7 protein.rst7
quit
```

- ff14SB amber force filed is used.
- 
- mbondi3 is part of the force-field.
- Loading the pdb file of the protein.
- saving the parameter of the pdb file.


```

```