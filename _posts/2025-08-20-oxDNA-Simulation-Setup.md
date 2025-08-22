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

<div>
  <button onclick="document.getElementById('compile-block').style.display='block';document.getElementById('container-block').style.display='none';" style="margin-right:10px;">Compile</button>
  <button onclick="document.getElementById('compile-block').style.display='none';document.getElementById('container-block').style.display='block';">Docker/Singularity</button>
</div>

<div id="compile-block" style="margin-top:20px;">
  <h3>Compile</h3>
  <p>
For oxDNA installation and running it one need to have a C, C++ compiler like gcc,g++, git to download the code, cmake and make to build it and preferably python for oxDNA analysis toolbar and oxpy.

```
cd oxDNA         # enter the oxDNA folder
mkdir build      # create a new build folder. It is good practice to compile out-of-source
cd build
cmake .. -DCUDA=ON -DPYTHON=ON -CMAKE_BUILD_TYPE=Release #For cpu only installation -DCUDA=OFF and can omit -DPYTHON completely
make -j$nproc
```

The binaries will be in build/bin folder. It is recommended to add it in PATH which can be easily accompolished with `echo "PATH="$PATH:/location/to/build/bin" >> ~/.bashrc && source ~/.bashrc`.
  </p>
</div>

<div id="container-block" style="display:none; margin-top:20px;">
  <h3>Singularity</h3>
  <p>
One can use docker or singularity to completely avoid the trouble of compiling by using my Docker container, with all the dependencies taken care of.
  </p>
</div>

To run a restrained simulation it is advisable to run it with hydrogen bond restrains, which can be generated in oxview, using the following steps:

```
Dynamics -> Forces -> Set stiffness = ( something between 2 to 5) and Relaxed distance 1.2 -> create from base pair -> Yes.
```

It will take some time to search the base pairs and will generarte restrains for all the base pairs. Save the structure top and dat file and also the force file as well.

These structure could be simulated with MC then MD with restrains and finally production run without any restrains or max backbone force.
<div style="background:rgba(255, 217, 102, 0.84);color:black;padding:12px;border-radius:0px;font-family:monospace;white-space:pre-wrap;overflow-wrap:break-word;">
<b>Assuming Topology = input.top
Initial and saved configuration = last_conf.dat</b>
<br>Using the same filename for the initial and saved configuration simplifies restarts: after an interruption, rerunning with the same inputs resumes from the last saved configuration.
</div>

## MC Simulation 1 - Restrains + Max Backbone Force
A sample input for MC simulation with restraints and max backbone force:

An astrick # indicates a comment

The input section takes all the file input

```
##############################
####  PROGRAM PARAMETERS  ####
##############################
interaction_type=DNA2
salt_concentration=1.0
sim_type = MC
backend = CPU
#backend_precision = mixed
#mismatch_repulsion = 1
#debug = 1
#seed = 42
#CUDA_list = verlet
#CUDA_sort_every = 0
#use_edge = 1
#edge_n_forces = 1

##############################
####    SIM PARAMETERS    ####
##############################
steps = 1e5
max_backbone_force = 10.
ensemble = nvt
delta_translation = 0.02
delta_rotation = 0.04
use_average_seq = no
seq_dep_file = oxDNA2_sequence_dependent_parameters.txt
thermostat = john
T = 25C
dt = 0.003
verlet_skin = 0.6
maxclust = 63
diff_coeff = 2.5
newtonian_steps = 103
max_density_multiplier=5

##############################
####    INPUT             ####
##############################
topology = output.top
conf_file = output.dat
external_forces = 1
external_forces_file = output_force.txt

##############################
####     OUTPUT           ####
##############################
lastconf_file = last_conf.dat
trajectory_file = trajectoryRelaxCPU.dat
max_io = 5
refresh_vel = 1
log_file = log.dat
no_stdout_energy = 0
restart_step_counter = 0
energy_file = energyRelaxCPU.dat
print_conf_interval = 1e4
print_energy_every = 1e4
time_scale = linear
```

## MD Simulation 2 - Restrains + Max Backbone Force
A input with Restrains and Max Backbone Force, starting from the last configuration:

```
##############################
####  PROGRAM PARAMETERS  ####
##############################
interaction_type=DNA2
salt_concentration=1.0
sim_type = MD
backend = CUDA
backend_precision = mixed
#mismatch_repulsion = 1
#debug = 1
#seed = 42
CUDA_list = verlet
CUDA_sort_every = 0
use_edge = 1
edge_n_forces = 1

##############################
####    SIM PARAMETERS    ####
##############################
steps = 1e7
max_backbone_force = 10.
ensemble = nvt
delta_translation = 0.02
delta_rotation = 0.04
use_average_seq = no
seq_dep_file = oxDNA2_sequence_dependent_parameters.txt
thermostat = john
T = 25C
dt = 0.003
verlet_skin = 0.6
maxclust = 63
diff_coeff = 2.5
newtonian_steps = 103
max_density_multiplier=5

##############################
####    INPUT             ####
##############################
topology = output.top
conf_file = last_conf.dat
external_forces = 1
external_forces_file = output_force.txt

##############################
####     OUTPUT           ####
##############################
lastconf_file = last_conf.dat
trajectory_file = trajectoryRelaxMD.dat
max_io = 5
refresh_vel = 1
log_file = log.dat
no_stdout_energy = 0
restart_step_counter = 0
energy_file = energyRelaxMD.dat
print_conf_interval = 1e5
print_energy_every = 1e5
time_scale = linear
```

## MD Simulation 3 - High Max Backbone Force
<div style="background:rgba(255, 217, 102, 0.84);color:black;padding:12px;border-radius:0px;font-family:monospace;white-space:pre-wrap;overflow-wrap:break-word;">
Many a times, it could be useful to check the structure if it is fully relaxed. If relaxed only then proceed with this step, otherwise continue with the above step increasing the max_backbone_force to 20 then to 40, **keeping the restrained on** untill the structure is fully relaxed. This check is very easy to perform visually as there would be a very long bond stretching out or computationally it can be confirmed by running a production simulation with short step like 100. A sample input file would be as follows:

```
##############################
####  PROGRAM PARAMETERS  ####
##############################
interaction_type=DNA2
salt_concentration=1.0
sim_type = MD
backend = CUDA
backend_precision = mixed
#mismatch_repulsion = 1
#debug = 1
#seed = 42
CUDA_list = verlet
CUDA_sort_every = 0
use_edge = 1
edge_n_forces = 1

##############################
####    SIM PARAMETERS    ####
##############################
steps = 1e2
#max_backbone_force = 10.
ensemble = nvt
delta_translation = 0.02
delta_rotation = 0.04
use_average_seq = no
seq_dep_file = oxDNA2_sequence_dependent_parameters.txt
thermostat = john
T = 25C
dt = 0.005
verlet_skin = 0.6
maxclust = 63
diff_coeff = 2.5
newtonian_steps = 103
max_density_multiplier=5

##############################
####    INPUT             ####
##############################
topology = output.top
conf_file = last_conf.dat
#external_forces = 1
#external_forces_file = output_force.txt

##############################
####     OUTPUT           ####
##############################
lastconf_file = last_conf.dat
trajectory_file = trajectoryRelaxMD.dat
max_io = 5
refresh_vel = 1
log_file = log.dat
no_stdout_energy = 0
restart_step_counter = 0
energy_file = energyRelaxMD.dat
print_conf_interval = 1e5
print_energy_every = 1e5
time_scale = linear
````
If there is an error with bond the log file will contain error like a bond is unnaturally longer then 1.2.
</div>


With a fully relaxed structure comment the external forces section and increase the max_backbone_force to 60 or more and run for 1e7 steps. An input file would be something like.
```
##############################
####  PROGRAM PARAMETERS  ####
##############################
interaction_type=DNA2
salt_concentration=1.0
sim_type = MD
backend = CUDA
backend_precision = mixed
#mismatch_repulsion = 1
#debug = 1
#seed = 42
CUDA_list = verlet
CUDA_sort_every = 0
use_edge = 1
edge_n_forces = 1

##############################
####    SIM PARAMETERS    ####
##############################
steps = 1e7
max_backbone_force = 60.
ensemble = nvt
delta_translation = 0.02
delta_rotation = 0.04
use_average_seq = no
seq_dep_file = oxDNA2_sequence_dependent_parameters.txt
thermostat = john
T = 25C
dt = 0.005
verlet_skin = 0.6
maxclust = 63
diff_coeff = 2.5
newtonian_steps = 103
max_density_multiplier=5

##############################
####    INPUT             ####
##############################
topology = output.top
conf_file = last_conf.dat
#external_forces = 1
#external_forces_file = output_force.txt

##############################
####     OUTPUT           ####
##############################
lastconf_file = last_conf.dat
trajectory_file = trajectory.dat
max_io = 5
refresh_vel = 1
log_file = log.dat
no_stdout_energy = 0
restart_step_counter = 0
energy_file = energy.dat
print_conf_interval = 1e5
print_energy_every = 1e5
time_scale = linear
```

## MD Simulation 4 - Production

After everything is finished run the final production simulation with the following input file. It is recommended to run it for atleast 1e9 steps. One might also want to run multiple replicas to ensure statistical convergence or to explore the conformational space more thoroughly. dt is recommended = 0.3 to 0.5, could be kept at a lower value if needed, but not higher than 0.5. Also the saving frequency could be adjusted accordingly, generally 1e5 to 5e5 produces a good statistical sampling. Adjusting the verlet skip could help with performance and memory usage.

```
##############################
####  PROGRAM PARAMETERS  ####
##############################
interaction_type=DNA2
salt_concentration=1.0
sim_type = MD
backend = CUDA
backend_precision = mixed
#mismatch_repulsion = 1
#debug = 1
#seed = 42
CUDA_list = verlet
CUDA_sort_every = 0
use_edge = 1
edge_n_forces = 1

##############################
####    SIM PARAMETERS    ####
##############################
steps = 1e9
#max_backbone_force = 10.
ensemble = nvt
delta_translation = 0.02
delta_rotation = 0.04
use_average_seq = no
seq_dep_file = oxDNA2_sequence_dependent_parameters.txt
thermostat = john
T = 25C
dt = 0.003
verlet_skin = 0.6
maxclust = 63
diff_coeff = 2.5
newtonian_steps = 103
max_density_multiplier=5

##############################
####    INPUT             ####
##############################
topology = output.top
conf_file = last_conf.dat
#external_forces = 1
#external_forces_file = output_force.txt

##############################
####     OUTPUT           ####
##############################
lastconf_file = last_conf.dat
trajectory_file = trajectory.dat
max_io = 5
refresh_vel = 1
log_file = log.dat
no_stdout_energy = 0
restart_step_counter = 0
energy_file = energyRelaxMD.dat
print_conf_interval = 1e5
print_energy_every = 1e5
time_scale = linear
```

To run the simulation at the same time, one could save the above input files as inputMC, inputMDRelax, inputMDEqui, input. Then write a simple job script to submit all the simulations.

```
#!/bin/sh
#SBATCH -q private
#SBATCH -p general
#SBATCH -t 7-00:00
#SBATCH -c 2
#SBATCH -G 1
#SBATCH -o empty.out
#SBATCH -e empty.err
#SBATCH -J oxDNASimulation

module load cuda-12.1.1-gcc-12.1.0 gcc-12.1.0-gcc-11.2.0 cmake eigen-3.4.0-gcc-11.2.0

export CUDA_MPS_PIPE_DIRECTORY=/tmp/mps-pipe_$SLURM_TASK_PID
export CUDA_MPS_LOG_DIRECTORY=/tmp/mps-log_$SLURM_TASK_PID
mkdir -p $CUDA_MPS_PIPE_DIRECTORY
mkdir -p $CUDA_MPS_LOG_DIRECTORY
nvidia-cuda-mps-control -d

echo "Starting jobs"

oxDNA inputMC > outMC.log
oxDNA inputMDRelax > outMDRelax.log
oxDNA inputMDEqui > outMDEqui.log
oxDNA input > out.log

echo "Done"
exec screen -Dm -S slurm$SLURM_JOB_ID

```
<div style="background:rgba(255, 217, 102, 0.84);color:black;padding:12px;border-radius:0px;font-family:monospace;white-space:pre-wrap;overflow-wrap:break-word;">
To automate submission of jobs or to get better gpu job control use my <a href="https://github.com/Subhajit-Roy-Partho/sync">sync.sh</a>.
</div>