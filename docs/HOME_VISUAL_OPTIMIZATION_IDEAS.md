# 首页视觉优化建议 / Home Page Visual Optimization Ideas

> 在保留现有调性基础上，增加视觉趣味，与 Timeline 的 Neue Brutalist 风格形成呼应。

---

## 一、当前首页概况

- **布局**：居中、max-w-2xl，姓名 → 职位 → 分隔线 → 生命实验文案 → 联系区
- **配色**：bg-paper (#fdfcf9)、橄榄灰 accent (#5A5A40)、柔和过渡
- **动效**：入场淡入 + 联系区延迟、CursorGlow 仅首页
- **问题**：信息清晰但略显「平」，缺少记忆点和趣味

---

## 二、优化方向（按优先级）

### 🔹 1. 分隔线趣味化（低成本、高识别度）

**现状**：`h-px w-24 bg-accent/30`，细线，存在感弱

**建议**：
- **方案 A**：阶梯式像素线（与像素风参考呼应）
  - 3–4 个小方块错位排列，模拟「台阶」或「像素断开」
- **方案 B**：粗野主义粗线
  - `h-1 w-16 bg-ink` 或 `border-b-2 border-ink w-20`，与 Timeline 粗边框一致
- **方案 C**：虚线 + 轻微动画
  - `border-bottom: 2px dashed`，配合 `animation: dash 1s linear infinite` 做出「流动」感

---

### 🔹 2. 联系链接的 Hover 强化（微交互）

**现状**：`hover:text-accent` + `group-hover:scale-110` 图标，反馈较柔和

**建议**：引入粗野式 Hover
- 每个链接包一层「伪按钮」：hover 时出现 2px 黑边 + 4–6px 右下硬阴影（45° 伪 3D）
- 或：hover 时整行轻微右移 2–4px，模拟「被推开」

参考：`docs/NEO_BRUTALISM_REFERENCES.md` 中的 45° 硬阴影、贴纸式层级

---

### 🔹 3. 背景层次（subtle，不抢戏）

**现状**：纯色 `bg-paper`

**建议**：
- **选项 A**：细点阵（与文字页 `essays-page` 类似）
  - `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)` + 12px grid
- **选项 B**：极淡网格线（与 Timeline 呼应）
  - 1px 浅灰线，20px 间距，opacity 约 0.03
- **选项 C**：保留纯色，在角落加一个极小几何图形（圆/方），opacity 0.05，作为视觉锚点

---

### 🔹 4. 「生命实验」文案强调

**现状**：普通段落，`text-lg md:text-xl text-ink/70`

**建议**：
- 加一层淡色容器：`bg-ink/[0.02]` + `border-l-2 border-accent pl-4`，做成类似引用块
- 或：首字下沉 / 首行加粗，增强「宣言感」

---

### 🔹 5. 联系区 staggered 入场

**现状**：整体一次性淡入

**建议**：
- 每个链接用 `motion.li` 或 `motion.a`，`initial={{ opacity: 0, y: 8 }}`，`animate` 时加 `delay: 0.05 * i`
- 形成「依次出现」的节奏感

---

### 🔹 6. 首页专属小彩蛋

**现状**：有 EasterEggCharacter、CursorGlow

**建议**：
- 点击姓名或「生命实验」文案时，触发一句随机短句 / 或切换一段隐藏文案
- 或在特定组合键（如连击姓名 3 次）时，显示一个小动画（如像素风小角色挥手）

---

### 🔹 7. 与 Timeline 风格统一（可选）

若希望全站气质更一致：
- 首页引入 1–2 个粗野元素：例如「联系我」标题下加 `border-b-2 border-ink`，或联系链接用 `border-2 border-ink` 的块状按钮
- 背景可尝试 Timeline 的 `#f8f8f4`，让首页与 Timeline 过渡更顺滑

---

## 三、快速可做（建议优先）

| 项目 | 工作量 | 效果 |
|------|--------|------|
| 分隔线改为阶梯 / 粗线 | 低 | 高 |
| 联系链接 hover 加粗边 + 硬阴影 | 中 | 高 |
| 联系区 staggered 动画 | 低 | 中 |
| 背景细点阵 | 低 | 中 |
| 生命实验引用块样式 | 低 | 中 |

---

## 四、不建议做（保持克制）

- **大面积改色**：现有橄榄灰 + 米白已统一，不宜大改
- **过多动画**：CursorGlow 已有存在感，再叠加易分散注意力
- **首页加生命计时器**：Navbar 已有，无需重复

---

## 五、实现顺序建议

1. 分隔线 + 生命实验引用块（5 分钟级改动）
2. 联系链接 Hover 强化（15 分钟）
3. Staggered 入场 + 背景点阵（10 分钟）

完成以上后，再视效果决定是否做彩蛋或更深度的粗野化。
