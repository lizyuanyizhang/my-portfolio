# 欢迎来到这个数字世界 / Welcome to This Digital World

<div align="center">
  <p><strong>个人作品集 · 数字名片 · 留言板</strong></p>
  <p>Personal Portfolio · Digital Identity · Guestbook</p>
</div>

---

## 简介 / Introduction

**中文**：一个融合极简美学与现代技术的个人作品集站点，包含简历、文章、摄影、项目展示、时间轴以及语音与文字留言功能。

**English**: A personal portfolio site blending minimalist aesthetics with modern tech, featuring resume, essays, photography, project showcase, timeline, and voice + text guestbook.

---

## 技术栈 / Tech Stack

| | |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **Animation** | Motion (Framer Motion) |
| **Backend** | Supabase (voices & messages) |
| **Deploy** | GitHub Pages |

---

## 快速开始 / Quick Start

### 前置要求 / Prerequisites

- Node.js 18+
- npm 或 pnpm

### 1. 安装依赖 / Install

```bash
npm install
```

### 2. 配置环境变量 / Configure Environment

复制 `.env.example` 为 `.env.local`，并填写你的 Supabase 配置（用于留言功能）：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```
# Supabase（留言页语音与文字存储）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> 详细 Supabase 配置步骤见 [SUPABASE_SETUP.example.md](./SUPABASE_SETUP.example.md)

### 3. 本地运行 / Run Locally

```bash
npm run dev
```

访问 http://127.0.0.1:3000

### 4. 构建生产版本 / Build for Production

```bash
npm run build
```

---

## 项目结构 / Project Structure

```
├── src/
│   ├── pages/          # 页面组件 (Home, Resume, Essays, Photography, Apps, Timeline, Audio, Video)
│   ├── components/     # 公共组件 (Navbar, Footer, LifeTimer, etc.)
│   ├── lib/            # 工具与客户端 (Supabase)
│   ├── data.json       # 静态内容配置
│   └── types.ts        # 类型定义
├── .github/workflows/   # GitHub Actions 部署配置
└── vite.config.ts      # Vite 配置 (base: /my-portfolio/ for GitHub Pages)
```

---

## 页面与路由 / Pages & Routes

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/resume` | 简历 |
| `/essays` | 文章列表 |
| `/essays/:id` | 文章详情 |
| `/photography` | 摄影 |
| `/apps` | 应用/项目 |
| `/timeline` | 时间轴 |
| `/audio` | 留言（语音+文字） |
| `/video` | 影像 |

---

## 部署到 GitHub Pages / Deploy to GitHub Pages

### 1. 配置 GitHub Secrets

在仓库 **Settings** → **Secrets and variables** → **Actions** 中添加：

- `VITE_SUPABASE_URL` — 你的 Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` — 你的 Supabase anon key

### 2. 推送代码

推送到 `main` 分支后，GitHub Actions 会自动构建并部署：

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

### 3. 访问站点

部署完成后，访问：`https://<your-username>.github.io/my-portfolio/`

> 若仓库名为 `my-portfolio`，路径为根路径；否则需在 `vite.config.ts` 中调整 `base`。

---

## 更多文档 / More Docs

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) — 技术总结、优劣势分析、改进建议
- [SUPABASE_SETUP.example.md](./SUPABASE_SETUP.example.md) — Supabase 配置指南
- [VOICE_DELETE_TROUBLESHOOTING.md](./VOICE_DELETE_TROUBLESHOOTING.md) — 语音留言删除问题排查

---

## License

Private / 私有项目
