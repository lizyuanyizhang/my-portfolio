# 时间轴页面 · Neue Brutalist 设计方案

## 一、设计原则（基于调研）

**Neue Brutalist / 新粗野主义** 核心特征：
- 粗重边框（2-4px）、无阴影、高对比
- 简洁线条、几何形态、锐角
- 科技感与复古元素碰撞
- 黑白主色 + 单色强调（绿/蓝）

**参考 Greptile 截图**：
- 背景：浅米白 (#f5f5f0)，可加细网格纹理
- 主色：深森林绿 (#1a4d3e)、亮绿 (#2d6a4f)
- 文字：纯黑 (#1a1a1a)、灰色 (#666)
- 无阴影、扁平按钮、粗边框

---

## 二、保持不变

| 元素 | 当前样式 | 说明 |
|------|----------|------|
| 左侧时间线年份 | `text-[10px] font-mono` | 用户满意的部分，**绝不修改** |
| 功能逻辑 | 展开/收起、滚动联动、人格画像、地理轨迹 | 全部保留 |

---

## 三、配色方案

| 用途 | 色值 | Tailwind |
|------|------|----------|
| 页面背景 | #f8f8f4 | 微灰米白 |
| 主文字 | #1a1a1a | text-ink |
| 次要文字 | #666 | text-muted |
| 强调色 | #1a4d3e | 深绿（主） |
| 高亮色 | #2d6a4f | 亮绿（激活/按钮） |
| 边框 | #1a1a1a | 2-3px 粗黑 |

---

## 四、具体改造项

### 4.1 左侧边栏（年份列表）
- ✅ 年份字体/大小：**不改**
- 边框：`border-r border-ink/5` → `border-r-2 border-ink`
- 背景：保持浅色，去掉 `backdrop-blur`
- 激活指示：粗黑竖条替代圆角

### 4.2 年份行（折叠态）
- 移除：`rounded-lg`、`ring-1`、`shadow`
- 边框：`border-b-2 border-ink`
- 背景：激活时 `bg-ink/[0.04]`，hover 时 `bg-ink/[0.02]`
- 展开按钮：方形、2px 黑边框，去掉圆形

### 4.3 展开内容区
- Fulfillment 卡片：去阴影，2px 黑边框，直角
- 书影音卡片：同上
- 照片网格：直角、粗边框
- ProjectCard / EssayCard：在 Timeline 内用包装器加粗边框样式（或传 className）

### 4.4 YearReviewCard
- `shadow-sm` → 移除
- `rounded-2xl` → `rounded-none` 或 `rounded-sm`
- `border border-ink/10` → `border-2 border-ink`

### 4.5 PersonalityPortrait
- 粗边框、无阴影
- 词云配色：黑 + 深绿，保留复古感

### 4.6 LocationTrailMap 容器
- 粗边框、直角
- 地图加载失败时：黑底白字提示

### 4.7 右侧边栏
- `border-l` → `border-l-2 border-ink`
- 去掉 `backdrop-blur`，纯色背景

### 4.8 移动端概览折叠区
- 粗边框、直角

### 4.9 Footer
- `border-t` → `border-t-2 border-ink`

---

## 五、字体

- 保持现有：`font-serif`（Cormorant）、`font-mono`（IBM Plex Mono）
- 标题/标签：可适当用 `font-sans uppercase tracking-widest` 增强科技感

---

## 六、复古元素

- 背景：细网格纹理 ✓
- 标签：全大写、等宽、紧凑字距 ✓
- **网点动物背景** ✓（见下）

---

## 七、网点动物背景 · 逆向工程

**实现原理**（参考 Greptile 等页面的背景动物图）：

1. **图层结构**：在时间轴主容器内加一个 `position: fixed` 的 div，覆盖整屏，`z-index: 0`
2. **图片层**：内部 `position: absolute` 的 div，定位在 `right: 0; bottom: 0`，使用 `background-image` 加载 SVG/PNG
3. **视差**：背景层 fixed，内容层 relative + 滚动，滚动时背景相对静止，产生视差
4. **动效**：CSS `@keyframes` 实现轻微位移/缩放（如 12s 循环），实现「动的动物图像」

**文件位置**：`public/images/timeline-halftone-animal.svg`

**自定义**：可替换为任意网点风格 PNG/SVG（建议深灰 #2a2a2a 网点 + 透明底），保持 400×300 左右比例。
