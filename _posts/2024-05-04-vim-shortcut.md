---
layout: post
title: Useful vim commands and shortcuts
date: 2024-05-04 00:00:00
description: Useful vim commands and shortcuts
tags: linux bash
categories: sample-posts
giscus_comments: true
featured: true
---

## Useful vim Commands

#### Search and Replace

- `:s/search/replace/` for current line and first occurrence.
- `:s/search/replace/g` for current line and all occurrence.
- `:%s/search/replace/g` for all occurance.
- `:3,10s/search/replace/g` for a range of line 3 to 10
- `:.,+4s/search/replace/g` from current line to next 4 lines
- `:.,$s/search/replace/` from current line to end of the file.
- end `gc` to confirm each substitution.
- end `gi` to ignore case sensitivity.

#### Comment multiple lines

#### Fold lines

`:set foldmethod=indent` folds all the lines by indentation

## Neo Vim for C++
- Install Mason.nvim
  - Add `M.plugins = "custom.plugins"` to chadrc.lua under ~/.config/nvim/lua/custom
  - Create a new file here using a key in file tree plugins.lua, edit the following
  ```bash
  local plugins = {
    {
      "williamboman/mason.nvim",
      opts = {
        ensure_installed = {
          "clangd"
        }
      }
    }
  }
return plugins
  ```
  - Close and reopen nvim and run `MasonInstallAll
  - Now add custom lspconfig to mason and final result would look like
  ```bash
  local plugins = {
    {
      "neovim/nvim-lspconfig",
      config = function ()
        require "plugins.configs.lspconfig"
        require "custom.configs.lspconfig"
      end
    },
    {
      "williamboman/mason.nvim",
      opts = {
        ensure_installed = {
          "clangd"
        }
      }
    }
  }
  return plugins

  ```

  - create the lspconfig.lua inside custom/configs
  - The files looks as given below
    ```bash
    local base = require("plugins.configs.lspconfig")
    local on_attach = base.on_attach
    local capabilities = base.capabilities
    
    local lspconfig = require("lspconfig")
    
    lspconfig.clangd.setup{
      on_attach = function (client,bufnr)
        client.server_capabilities.signatureHelpProvider=false
        on_attach(client,bufnr)
      end,
      capabilities=capabilities,
    }
    ```

    - exit and enter and do `TSInstall cpp`
   

    Final result

    - custom/configs/null-ls.lua
    ```bash
    local null_ls = require("null_ls")

    local opts = {
      sources = {
        null_ls.builtins.formatting.clang_format,
      }
    }
    
    return opts
    ```
    

