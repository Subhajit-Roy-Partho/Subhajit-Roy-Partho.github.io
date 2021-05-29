---
layout: default
title: Ubuntu daily Hacks
parent: My daily fixes
nav_order: 10
has_children: true
has_toc: false
---

#### Grub Last Choice

To make the grub remember its last choice make the following changes in the **/etc/default/grub**.In case this variables are not in the file just add them. This is very useful in case of dual boot, like for windows when updated it will select windows on the next boot instead of the linux sustem.

```bash
GRUB_DEFAULT=saved 
GRUB_SAVEDEFAULT=true 
```

Now update the grub for the changes to take place.

```bash
sudo update-grub
```