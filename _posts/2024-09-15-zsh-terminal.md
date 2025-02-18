---
layout: post
title: ZSH terminal
date: 2024-09-15 00:00:00
description: Ram up the terminal.
tags: coding
categories: sample-posts
giscus_comments: true
featured: true
---

- Install oh my zsh `sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`.
- Change theme to avit in ~/.zshrc
- Plugins:
    - zsh-syntax-highlighting `git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting`
    - zsh-autosuggestions `git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions`
    - add the puligins to

    ```bash
    plugins=(git
    zsh-syntax-highlighting
    zsh-autosuggestions
    )
    
    ```