# Posts 功能方案评估 / Post Feature Plan

> 新增「随手记」菜单：类似推特的短内容发布，页面风格按截图逆向工程实现。

---

## 一、截图逆向工程 / Design Reverse Engineering

根据你提供的参考图，整理出的设计规范如下。

### 1. 背景 (Background)

| 属性 | 规格 | 实现方式 |
|------|------|----------|
| 主色 | 米白/浅灰 `#f5f5f0` ~ `#fafaf8` | CSS 变量 |
| 纹理 | 细小圆点矩阵，深灰 `#999` ~ `#666`，间距约 8–12px | `background-image: radial-gradient()` 或 SVG 点阵 |
| 质感 | 类似方格纸/数字笔记本 | 低对比度，不抢视线 |

**建议 CSS 实现（示意）：**

```css
/* 点阵背景 */
.posts-page {
  background-color: #f8f8f4;
  background-image: radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px);
  background-size: 12px 12px;
}
```

---

### 2. 字体 (Typography)

| 层级 | 规格 | 说明 |
|------|------|------|
| 字体族 | **等宽字体 (Monospace)** | IBM Plex Mono / Fira Code / JetBrains Mono |
| 正文字色 | 深灰 `#333` ~ `#444` | 非纯黑，降低刺眼感 |
| 标题 | 最大、加粗或半粗 | 如 `font-weight: 600` |
| 日期/地点 | 略小、常规字重 | 与正文同一族 |
| 正文 | 舒适阅读字号，行高约 1.7–1.8 | 段落留白充足 |

**与本站现有风格对比：**

- 当前：Cormorant Garamond（衬线）+ Inter（无衬线）
- Posts 页：改用 **IBM Plex Mono** 或 **JetBrains Mono**，独立于其他页面

---

### 3. 布局 (Layout)

| 属性 | 规格 |
|------|------|
| 内容宽度 | 窄列，约 `max-width: 42rem`（672px） |
| 对齐 | 标题、正文左对齐；地点右对齐（与日期同一行） |
| 垂直间距 | 标题与日期、日期与正文、段落之间留足空白 |
| 图片 | 底部两张并排，等高、同列宽内 |

**单条 Post 结构示意：**

```
┌─────────────────────────────────────────┐
│  [标题 Title]                      (加粗) │
│                                         │
│  2026-01-04               San Jose, CA  │  ← 日期左，地点右
│                                         │
│  正文段落 1...                           │
│                                         │
│  正文段落 2...                           │
│                                         │
│  Thinking about: xxx                    │
│  Reading: xxx                           │
│                                         │
│  [图1]        [图2]                     │  ← 并排
└─────────────────────────────────────────┘
```

---

### 4. 与「文字」模块的区别

| 维度 | 文字 (Essays) | Posts（随手记） |
|------|---------------|-----------------|
| 形式 | 长文章，分类、摘要、全文 | 短内容，一条一条 |
| 风格 | 衬线/无衬线，纸感背景 | 等宽字体，点阵背景 |
| 更新 | 改 data.json，需重新构建 | 希望随时更新（Supabase） |
| 定位 | 正式输出 | 日常想法、碎碎念 |

---

## 二、数据模型 / Data Model

### Post 单条结构

```ts
interface Post {
  id: string;
  title: string;           // 标题，如 "First entry"
  date: string;            // ISO 日期 "2026-01-04"
  location?: string;       // 地点 "San Jose, CA"
  content: string;         // 正文，\n\n 分段
  thinkingAbout?: string;  // "Thinking about:" 内容
  reading?: string;        // "Reading:" 内容
  images?: string[];      // 图片 URL 数组，底部并排展示
  created_at: string;      // 创建时间（Supabase 用）
}
```

---

## 三、内容来源方案对比

### 方案 A：data.json（静态）

| 优点 | 缺点 |
|------|------|
| 实现简单，无新依赖 | 每次发帖需改 JSON、提交、重新构建 |
| 与现有 Essays 一致 | 不适合「随时更新」 |
| 无需后端 | 部署有延迟 |

**结论**：更适合长文，不适合 Posts。

---

### 方案 B：Supabase（推荐）

| 优点 | 缺点 |
|------|------|
| 与留言功能同一套基础设施 | 需执行一次建表 SQL |
| 真正「随时更新」：发帖后即生效 | 图片需上传到 Storage 或外链 |
| 可做简单管理界面或 Supabase 后台编辑 | - |

**结论**：最适合 Posts 的更新节奏。

---

### 方案 C：Notion API

| 优点 | 缺点 |
|------|------|
| 在 Notion 里编辑，体验好 | 需 Notion 集成与 API Key |
| 可复用既有 Notion 内容 | 需处理权限、限流 |
| - | 项目有 Notion 配置，但非核心路径 |

**结论**：可作为后续增强，不优先。

---

## 四、推荐方案：Supabase + 点阵背景 + 等宽字体

### 实现要点

1. **Supabase 表 `posts`**

   ```sql
   CREATE TABLE public.posts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     date DATE NOT NULL,
     location TEXT,
     content TEXT NOT NULL,
     thinking_about TEXT,
     reading TEXT,
     images JSONB DEFAULT '[]',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **样式**
   - 点阵背景（CSS `radial-gradient`）
   - 引入 IBM Plex Mono 或 JetBrains Mono
   - 窄列居中，日期/地点布局按上图

3. **发帖方式（二选一或并存）**
   - 方式 1：Supabase Dashboard → Table Editor 直接插入
   - 方式 2：做一个简单发布表单页（需要鉴权或限制访问）

4. **路由**
   - 列表：`/posts`
   - 详情：`/posts/:id`（可选，也可全部在列表页展开）

---

## 五、实现范围与工作量估算

| 任务 | 说明 | 预估 |
|------|------|------|
| Supabase 建表 SQL | 创建 `posts` 表 + RLS | 0.5h |
| 新增 `Posts.tsx` 页面 | 列表 + 单条渲染 | 1h |
| 新增 `PostDetail.tsx`（可选） | 单条详情页 | 0.5h |
| 样式：点阵背景 | 独立 `.posts-page` 类 | 0.5h |
| 样式：等宽字体 | 引入字体、应用到 Posts 区域 | 0.5h |
|  Navbar + 路由 | 新增菜单入口与路由 | 0.25h |
| 图片上传（可选） | 使用 Supabase Storage 或外链 | 1h |
| 发布表单（可选） | 简单表单 + 鉴权方案 | 2h |

**基础版（无表单、无图片上传）**：约 3–4 小时  
**完整版（含表单与图片）**：约 6–7 小时  

---

## 六、与现有站点的协调

- Posts 页使用**独立样式**（点阵背景 + 等宽字体），其他页面保持现有风格。
- Navbar 新增「随手记」或「Posts」入口，放在「文字」与「摄影」之间较自然。
- 时间轴如需引用 Posts，可在 `timeline.portfolio` 中增加 `posts` 字段并做关联（后续迭代）。

---

## 七、总结

| 项目 | 结论 |
|------|------|
| 设计 | 点阵背景 + IBM Plex Mono，窄列、日期左/地点右、底部并排图片 |
| 数据 | Supabase `posts` 表 |
| 发帖 | 先用手动插入，后续可做表单 |
| 路由 | `/posts` 列表，`/posts/:id` 详情可选 |

如确认采用此方案，可从「建表 SQL + Posts 页面 + 基础样式」开始实现。
