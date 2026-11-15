# lecture-notes

个人中文讲义阅读站，由 [lecture-to-notes](https://github.com/ysyecust/lecture-to-notes) 生成，在 GitHub Pages 上阅读网页正文或原版 PDF。

[![Course library](https://img.shields.io/github/actions/workflow/status/wngzwng/lecture-notes/pages.yml?label=site)](https://github.com/wngzwng/lecture-notes/actions/workflows/pages.yml)
[![License GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

[**在线阅读 →**](https://wngzwng.github.io/lecture-notes/) · [English](README.en.md)

当前目录收录个人笔记与 GAMES001 图形学中的数学（当前共 2 门课程与专题、18 讲、561 页正课讲义）。

- 课程：个人笔记
- 课程：GAMES001 图形学中的数学（16 讲，[哔哩哔哩 BV1MF4m1V7e3](https://www.bilibili.com/video/BV1MF4m1V7e3/)）
- 讲义：[The Rubik's cube is secretly linear algebra](https://wngzwng.github.io/lecture-notes/reader.html?id=my-notes-the-rubik-s-cube-is-secretly-linear-algebra-167bbe2c)（[YouTube 来源](https://www.youtube.com/watch?v=kRrK4VJBf2s)）

## 本地预览

需要 Python 3、pandoc、qpdf、python3-bs4、ImageMagick 与 Node.js。

```bash
npm ci
PYTHONPATH=. python3 -m scripts.build_site --root . --output _site --generated-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python3 -m http.server 8080 --directory _site
```

浏览器打开 <http://127.0.0.1:8080/>。

## 部署

推送到 `main` 后，`.github/workflows/pages.yml` 会在 GitHub-hosted Ubuntu runner 上构建 `_site`，并部署到 GitHub Pages。公开地址为 <https://wngzwng.github.io/lecture-notes/>。仓库设置里需将 Pages 的构建来源设为 **GitHub Actions**（不要选择从 `docs/` 分支直接发布）。

向 `content/courses/` 发布新讲义后，使用：

```bash
PYTHONPATH=. python3 -m scripts.publish_lecture --root . \
  --workdir /path/to/notes \
  --course content/courses/my-notes/course.json \
  --file lecture_slug.pdf \
  --slug lecture_slug \
  --title "Lecture title"
```

## 许可与致谢

本仓库以 [GPL-3.0](LICENSE) 发布。站点框架、构建脚本和阅读器来自 [ysyecust/lecture-to-notes](https://github.com/ysyecust/lecture-to-notes)。讲义版权归原作者，本站材料仅用于学习与研究。
