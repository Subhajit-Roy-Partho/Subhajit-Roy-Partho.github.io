---
layout: post
title: 
date: 2024-04-13 00:00:00
description: Simple Macbook fixes which are game changing
tags: windows
categories: sample-posts
giscus_comments: true
featured: true
---

### Change time server for windows

- Open run using `Win+R`
- regedit enter to open Register Editor
- Add string register for time server at `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\DateTime\Servers`.
- For sting register the header will be integer 1 2 3 ... and the value would be time server address.
- Most popular time server addresses:
    - us.pool.ntp.org
    - time.google.com
        - time1.google.com
        - time2.google.com
        - time3.google.com
        - time4.google.com
    - time-a-g.nist.gov
- The first entry (Defaults) have a integer value indicating the integer of the time server. For example if I want to set for example time.google.com as my default and if it is registered to integer 3. Then I will just change the value of the (Defaults) to 3.

## References
- https://www.thewindowsclub.com/change-time-server-windows-10