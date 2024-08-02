---
layout: post
title: Linux User Management
date: 2024-01-15 00:00:00
description: Linux User Management
tags: linux disk partitions
categories: sample-posts
giscus_comments: true
featured: true
---
 
### Groups
- `sudo groupadd -g 1002 mygroup` to create a new group with -g to specify group id. -r can also be used for low group id for system level processes.
```bash
sudo usermod -a -G www-data
sudo chgrp -R www-data /var/www
sudo chmod -R g+w /var/www
sudo find /var/www -type d -exec chmod 2775 {} \;
sudo find /var/www -type f -exec chmod ug+rw {} \;
```
- above to make sure a folder can only be accessed by a specific group.
- `sudo usermod -aG developers john` - to add a user to a group.
- `newgrp user` to refresh the updated group.
- `sudo useradd -m -d /home/subho -s /bin/bash -G standard,admin subho` to add user subho with home location /home/subho, default shell as bash and add to group standard,admin.
- `sudo passwd subho` to change or create password for user subho.