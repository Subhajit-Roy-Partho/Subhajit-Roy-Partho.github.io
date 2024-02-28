---
layout: post
title: Useful bash commands and functions
date: 2024-02-12 00:00:00
description: Useful bashrc commands that I require to write every time I create a new system.
tags: linux bash
categories: sample-posts
giscus_comments: true
featured: true
---

## Alias

`alias md=mkdir`

## Settings bashrc

`shopt -s autocd`

## Important functions


```bash
server(){
    if [ $# -eq 0 ];then
        ssh -CX user@serverIP
    elif [ $1 = "port" ];then
        if [ -z "$4" ];then
            ssh -N -L $2:$3.serverIP:$2 user@serverIP
        else
            ssh -N -L $2:$3.serverIP:$4 user@serverIP
        fi
    elif [ $1 = "send" ];then
        rsync -rzvP $2 user@serverIP:$3
    elif [ $1 = "receive" ];then
        rsync -rzvP user@serverIP:$2 $3
    else
        ssh user@serverIP $1
    fi
}
```

- `server` will just log you in
- `server send yourLocation serverLocation` sends file to the server.
- `server receive serverLocation yourLocation` downloads the files from server.
- replace `server` with your server name, `user` to your user id, `serverIP` with the ip of the server.
- To execute commands just server "command". Few useful commands
- `server myjobs` - to see running jobs
- `server "cat file"` - see a file
- `server "tail file"` - last few lines of file, useful for log files.


```bash
asu(){
    if [ $# -eq 0 ];then
        echo "password\npush\n"|sudo openconnect -u user --server=sslvpn.asu.edu
    elif [ $# -eq 1 ];then
        echo "password\n$1\n"|sudo openconnect -u user --server=sslvpn.asu.edu
    else
        echo "$1\n$2\n"|sudo openconnect -u user --server=sslvpn.asu.edu
    fi
}
```

or 

```bash
    alias asu = 'echo "password\npush"|sudo openconnect -u user --server=sslvpn.asu.edu'
```

- first function only works with zsh, for bash use the 2nd one.
- to sign in to asu network using terminal and openconnect with push authentication.
- the above method is unsecure as the password is kept in the bashrc or zshrc file.