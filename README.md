# In-trip Decision / 接下来去哪？

一个旅行途中的即时决策 H5 原型。它不生成完整旅行攻略，而是在计划或个人状态发生变化时，给出少量适合当下的 Next Move。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址。生产构建使用 `npm run build`。

## 在线体验

[https://cecilia-huu.github.io/in-trip-decision/](https://cecilia-huu.github.io/in-trip-decision/)

推送到 `main` 分支后，GitHub Actions 会自动构建并发布 GitHub Pages。

## 核心结构

- `app/page.tsx`：四屏流程与全部交互状态
- `app/mock-data.ts`：场景、问题、推荐和反馈文案
- `app/globals.css`：移动端优先视觉系统与轻量动效
- `index.html`：页面与分享卡片元信息
- `public/og-general.png`：通用产品分享封面
