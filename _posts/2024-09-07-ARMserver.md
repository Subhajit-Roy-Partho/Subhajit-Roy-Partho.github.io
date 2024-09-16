---
layout: post
title: ARM Linux Server
date: 2024-09-07 00:00:00
description: ARM Linux Server
tags: coding
categories: sample-posts
giscus_comments: true
featured: true
---

### Important Notes
- Welcome message is in file `/etc/motd`, and ASCII art looks great in there.
- OS choices
    1. Debian
    2. Fedora
    3. Arch
    4. Ubuntu (May even damage firmware)

### Useful Software

##### Desktop Environments

- Xfce is one of the best and easy to configure desktop environment.
- To install it `sudo apt install xfce4`
- to start it `startxfce4` from tty terminal.

### Fixes

##### SLURM GPU segregation fix

Slurm uses nvml to detect the number of gpus, segregate them during running, and this api was not working for my case.

- Find the library location `sudo find / -name "libnvidia-ml.so"` , for my case this was `/usr/local/cuda-12.2/targets/sbsa-linux/lib/stubs/libnvidia-ml.so`
- Copy this to `/usr/lib`
- Add header location to `/etc/profile` , for my case it was 
```bash
export C_INCLUDE_PATH="/usr/local/cuda-12.2/targets/sbsa-linux/include:$C_INCLUDE_PATH"
export CPLUS_INCLUDE_PATH="/usr/local/cuda-12.2/targets/sbsa-linux/include:$CPLUS_INCLUDE_PATH"
```

- By default `/usr/lib` should be in ldconfig still one can add that in `/etc/ld.so.conf.d . sudo ldconfig`
- Also here is a c code to check nvml, use `gcc nvml.c -lnvidia-ml; ./a.out`. If it outputs the correct number of gpu, I guess everything should be configured.

```c
#include <stdio.h>
#include <nvml.h>

int main() {
    nvmlReturn_t result;
    unsigned int device_count = 0;

    // Initialize NVML library
    result = nvmlInit();

    if (NVML_SUCCESS != result) {
        printf("Failed to initialize NVML: %s\n", nvmlErrorString(result));
        return 1;
    }

    // Get the number of GPUs
    result = nvmlDeviceGetCount(&device_count);

    if (NVML_SUCCESS != result) {
        printf("Failed to get device count: %s\n", nvmlErrorString(result));
        nvmlShutdown();
        return 1;
    }
    printf("Number of GPUs detected: %u\n", device_count);

    // Clean up NVML library
    result = nvmlShutdown();

    if (NVML_SUCCESS != result) {
        printf("Failed to shutdown NVML: %s\n", nvmlErrorString(result));
        return 1;

    }
    return 0;
}
```