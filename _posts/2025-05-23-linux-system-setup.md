---
layout: post
title: Linux system setup
date: 2025-05-23 00:00:00
description: Code to setup complete linux system from scratch.
tags: compilation tensorflow ml fun
categories: sample-posts
giscus_comments: true
featured: true
---

## Basic Installations

<div class="tabs-container">
  <div class="tab-buttons">
    <button class="tab-button active" onclick="openTab(event, 'arch')">Arch Linux</button>
    <button class="tab-button" onclick="openTab(event, 'debian')">Debian/Ubuntu</button>
    <button class="tab-button" onclick="openTab(event, 'fedora')">Fedora</button>
  </div>

  <div id="arch" class="tab-content" style="display:block;">
    <h3>Arch Linux</h3>
    <pre><code class="language-bash">
    sudo pacman -Syu gcc make cmake python3 python-pip git wget nvim zsh cloudflared openssh rsync rclone
    sudo chsh -s $(which zsh) $(whoami)

# Then, ensure visudo has:
# %wheel ALL=(ALL:ALL) ALL
    </code></pre>
  </div>

  <div id="debian" class="tab-content">
    <h3>Debian / Ubuntu</h3>
    <pre><code class="language-bash">
# To add 'myuser' to the 'sudo' group
sudo usermod -aG sudo myuser
    </code></pre>
  </div>

  <div id="fedora" class="tab-content">
    <h3>Fedora / RHEL / CentOS</h3>
    <pre><code class="language-bash">
# To add 'myuser' to the 'wheel' group
sudo usermod -aG wheel myuser

# Typically, wheel group is already configured in /etc/sudoers
    </code></pre>
  </div>
</div>

<style>
  .tabs-container {
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden; /* To contain floated elements or for border-radius */
    margin-bottom: 20px;
  }
  .tab-buttons {
    background-color: #f1f1f1;
    overflow: hidden; /* Clear floats */
    border-bottom: 1px solid #ccc;
  }
  .tab-button {
    background-color: inherit;
    float: left;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 10px 15px;
    transition: 0.3s;
    font-size: 1em;
  }
  .tab-button:hover {
    background-color: #ddd;
  }
  .tab-button.active {
    background-color: #ccc;
    border-bottom: 2px solid #007bff; /* Or your preferred active color */
  }
  .tab-content {
    display: none;
    padding: 15px;
    border-top: none;
  }
  .tab-content h3 {
    margin-top: 0;
  }
  /* Style for code blocks within tabs if needed */
  .tab-content pre {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto; /* For horizontal scrolling of long code lines */
  }
  .tab-content code {
    font-family: Consolas, "Courier New", monospace;
  }
</style>

<script>
  function openTab(evt, osName) {
    var i, tabcontent, tabbuttons;
    // Get all elements with class="tab-content" and hide them
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tab-button" and remove the class "active"
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
      tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(osName).style.display = "block";
    evt.currentTarget.className += " active";
  }

  // Optional: Open the first tab by default if no other logic handles it
  // document.addEventListener('DOMContentLoaded', function() {
  //   if (document.querySelector('.tab-button')) {
  //      document.querySelector('.tab-button').click();
  //   }
  // });
</script>

## oh-my-zsh installation
```bash
## Install oh-my-zsh
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"

## Install plugins
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-history-substring-search ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-history-substring-search

## Replace the default plugins with the following
sed -i.bak '/^plugins=.*/c\
plugins=(\
  git\
  zsh-syntax-highlighting\
  zsh-autosuggestions\
  zsh-history-substring-search\
)' ~/.zshrc
```

## Generate SSH keys
```bash
ssh-keygen -t ed25519 -C "pc"
cat ~/.ssh/id_ed25519.pub
```

## Add servers
```bash
mkdir -p ~/.ssh
echo "Host gila
        Hostname gila.navraj.me
        User gila
        Port 22
        ProxyCommand cloudflared access ssh --hostname %h
Host sol
        Hostname sol.asu.edu
        User sroy85
        Port 22
        ProxyJump gila" >> ~/.ssh/config
    
```

## Add zshrc functions
```bash
mo() {
  # Check if an argument was provided
  if [ -z "$1" ]; then
    echo "Usage: mo <directory_name>"
    return 1 # Indicate an error
  fi

  # Attempt to create the directory.
  # -p: no error if existing, make parent directories as needed
  # --: ensures that $1 isn't misinterpreted as an option if it starts with '-'
  if mkdir -p -- "$1"; then
    # If mkdir was successful, try to cd into it
    if cd -- "$1"; then
      return 0 # Success
    else
      echo "Error: Successfully created directory '$1', but could not cd into it." >&2
      return 1 # Indicate an error
    fi
  else
    # mkdir failed. mkdir itself usually prints an error.
    # We can add a generic one too.
    echo "Error: Could not create directory '$1'." >&2
    return 1 # Indicate an error
  fi
}
```
