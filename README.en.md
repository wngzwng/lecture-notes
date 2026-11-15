# lecture-notes

A personal Chinese lecture-notes reading site generated with [lecture-to-notes](https://github.com/ysyecust/lecture-to-notes). Read the reflowable web article or the original PDF on GitHub Pages.

[![Course library](https://img.shields.io/github/actions/workflow/status/wngzwng/lecture-notes/pages.yml?label=site)](https://github.com/wngzwng/lecture-notes/actions/workflows/pages.yml)
[![License GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

[**Read online →**](https://wngzwng.github.io/lecture-notes/) · [中文](README.md)

This catalog contains personal notes, GAMES001 Mathematics in Computer Graphics, and MIT Missing Semester 2026 (currently 3 courses and collections, 27 lectures, and 816 lecture pages).

- Course: 个人笔记
- Course: GAMES001 图形学中的数学 (16 lectures, [Bilibili BV1MF4m1V7e3](https://www.bilibili.com/video/BV1MF4m1V7e3/))
- Course: MIT Missing Semester 2026 (9 lectures, [YouTube playlist](https://www.youtube.com/playlist?list=PLyzOVJj3bHQunmnnTXrNbZnBaCA-ieK4L))
- Lecture: [The Rubik's cube is secretly linear algebra](https://wngzwng.github.io/lecture-notes/reader.html?id=my-notes-the-rubik-s-cube-is-secretly-linear-algebra-167bbe2c) ([YouTube source](https://www.youtube.com/watch?v=kRrK4VJBf2s))

## Local preview

Requires Python 3, pandoc, qpdf, python3-bs4, ImageMagick, and Node.js.

```bash
npm ci
PYTHONPATH=. python3 -m scripts.build_site --root . --output _site --generated-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python3 -m http.server 8080 --directory _site
```

Open <http://127.0.0.1:8080/>.

## Deployment

A push to `main` runs `.github/workflows/pages.yml` on a GitHub-hosted Ubuntu runner, builds `_site`, and deploys it to GitHub Pages at <https://wngzwng.github.io/lecture-notes/>. In the repository settings, set the Pages source to **GitHub Actions** (do not publish the `docs/` folder from a branch).

## License and credit

This repository is released under [GPL-3.0](LICENSE). The site framework, build scripts, and reader come from [ysyecust/lecture-to-notes](https://github.com/ysyecust/lecture-to-notes). Lecture copyright remains with the original authors; materials here are for study and research only.
