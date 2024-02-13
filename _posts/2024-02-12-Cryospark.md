---
layout: post
title: Cryosparc management
date: 2024-02-12 00:00:00
description: Installation and management of Cryosparc
tags: linux Cryo TEM
categories: sample-posts
giscus_comments: true
featured: true
---
### Installation

- Request a [license](http://cryosparc.com/download). It usually take them 2 business them to issue you a license.
- In .bashrc add `export LICENSE_ID="<license_id>"`.
- Download the files to desire location using 

```
curl -L https://get.cryosparc.com/download/master-latest/$LICENSE_ID -o cryosparc_master.tar.gz
curl -L https://get.cryosparc.com/download/worker-latest/$LICENSE_ID -o cryosparc_worker.tar.gz
```
For Single PC setup only cryospac master is required.

- Extract the tar files using `tar -xzvf cryosparc_master.tar.gz`.
- Setup a database location, usually for clusters scratch space is best for example `/scratch/cryo/cryoDB`.
- Go to the extracted folder then install using `./install.sh --license $LICENSE_ID --hostname hostname --dbpath /scratch/cryo/cryoDB --port 61000`.

The hostname can be obtained by typing `hostname`. In cluster system this will change depending upon the node allocation. In such situation the nodename needs to be updated in `config.sh`. Also adding `export CRYOSPARC_FORCE_HOSTNAME=true` to config.sh could also help.

- Start the cryosparc using `bin/cryosparcm start`. First time it will take some time to configure, from next time it would be fast.
- Create the user using `bin/cryosparcm createuser --email "email@email.com" --username "user1" --firstname "user" --lastname "1" --password "somepass"`
- Elevate user permission to admin using `cryosparcm updateuser --email "<email address>" --admin "true"`.
- Now cryosparc is ready for use at port 61000. To open a `ssh port use ssh -N -L 61000:cg001.sol.asu.edu:61000 user@sol.asu.edu` where cg001 is the id of the compute node in the cluster. If it is a personal computer this step can be ignored.
- Access the cryosparc in the browser at localhost:61000


### References

- https://guide.cryosparc.com/setup-configuration-and-management/how-to-download-install-and-configure/downloading-and-installing-cryosparc
- https://discuss.cryosparc.com/t/no-admin-account-upon-install-create-admin-account-via-cli/10530/2
