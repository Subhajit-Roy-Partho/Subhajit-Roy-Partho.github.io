---
layout: post
title: Mouse and Keyboard share
date: 2024-09-07 00:00:00
description: A short description on how to share mouse and keyboard using Barrier open source software.
tags: coding
categories: sample-posts
giscus_comments: true
featured: true
---

- Install it using package manager or build it from the github repo.
- Generate the self signed SSL key at `.local/share/barrier/SSL` this should be either in `/home/$USER` or `/home/$USER/snap/barrier-*/2`.

```bash
cd "SSL path"
mkdir -p Fingerprints
openssl req -x509 -nodes -days 365 -subj /CN=barrier -newkey rsa:4096 -keyout Barrier.pem -out Barrier.pem
openssl x509 -fingerprint -sha256 -noout -in Barrier.pem > Fingerprints/Local.txt
sed -e "s/.*=/v2:sha256:/" -i Fingerprints/Local.txt
```
- Set the server config by draging in new pc to left or right.
- Start the server.
- Start the client with the server IP. If everything is right client would flash server SSL and in next message would prompt configuration is ready.