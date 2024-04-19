---
layout: post
title: Speech to text conversion
date: 2024-02-12 00:00:00
description: Speech 
tags: ml
categories: sample-posts
giscus_comments: true
featured: true
---

## Usage
- Install miniconda and cuda locally or use it with gpu in kaggle or colab.
- Install ffmpeg.
- To install from github `pip install git+https://github.com/openai/whisper.git`
    - To update exising installation `pip install --upgrade --no-deps --force-reinstall git+https://github.com/openai/whisper.git`

- `whisper audio.ext --language English --model large -o OutputFolder`
- For english medium.en is better than medium, same for small.en , tiny.en

|  Size  | Parameters | English-only model | Multilingual model | Required VRAM | Relative speed |
|:------:|:----------:|:------------------:|:------------------:|:-------------:|:--------------:|
|  tiny  |    39 M    |     `tiny.en`      |       `tiny`       |     ~1 GB     |      ~32x      |
|  base  |    74 M    |     `base.en`      |       `base`       |     ~1 GB     |      ~16x      |
| small  |   244 M    |     `small.en`     |      `small`       |     ~2 GB     |      ~6x       |
| medium |   769 M    |    `medium.en`     |      `medium`      |     ~5 GB     |      ~2x       |
| large  |   1550 M   |        N/A         |      `large`       |    ~10 GB     |       1x       |

## References

- For code and all the details [Whisper Github](https://github.com/openai/whisper).
- [OpenAi Research](https://openai.com/research/whisper)