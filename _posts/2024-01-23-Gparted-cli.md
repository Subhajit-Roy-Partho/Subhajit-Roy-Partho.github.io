---
layout: post
title: Disk Management
date: 2024-01-23 00:00:00
description: Useful disk management commands
tags: linux disk partitions
categories: sample-posts
giscus_comments: true
featured: true
---

### Installation

- `sudo apt install parted` in debian

Useful parted cli commands:

- `print` - print the full configuration.
- `select DEVICE` - to change to a different device and edit it.
- `mklabel gpt` - to create a gpt label for the partition
- `mkpart primary btrfs 1MiB 100%` - to create a partition of type primary with format btrfs starting at 1MiB and ending at 100% or end of the disk.
- `` 
Useful other disk management commands:

- `lsblk` and `fdisk -l` shows disk configuration for all the disks.
- `sudo mkfs.btrfs -f /dev/sda1` to create the final btrfs partition for sda1 partition. This is not always needed if parted does it by default.

Validate settings:

- `df -h` to show all the mount location.

User management:

- `sudo useradd -m -d /home/subho -s /bin/bash -G standard,admin subho` to add user subho with home location /home/subho, default shell as bash and add to group standard,admin.
- `sudo passwd subho` to change or create password for user subho.

#### Permanent Mount

- To mount a drive during restart one need to make the mount entry to /etc/fstab
- Obtain the UUID from `lsblk -f` or `sudo blkid`
- `UUID=0f2b8e50-94c0-4385-abed-ce020da2555b /fast           btrfs   defaults        0       0` something of this format
- `systemctl daemon-reload` in debian to reload the fstab settings
- *To temporary mount use `sudo mount /dev/sdb1` and to unmount `sudo umount /mnt/loc`*

### Conclusion

parted cli is the most powerful partition tool available for terminal user. Meticious use could help save lot of time.

### References

- https://www.redhat.com/sysadmin/resize-lvm-simple
- https://kb.vander.host/disk-management/how-to-resize-expand-an-ubuntu-lvm-disk/
- https://fedoramagazine.org/choose-between-btrfs-and-lvm-ext4/
