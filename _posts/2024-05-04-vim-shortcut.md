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

## Installation 