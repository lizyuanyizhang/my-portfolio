# 响应式设计评估与方案 / Responsive Design Evaluation & Plan

## 一、现状评估

### 1. 已做对的事
- Viewport 已设置 `width=device-width, initial-scale=1.0`
- 使用 Tailwind 断点 (sm/md/lg/xl)
- 摄影、视频等使用响应式 grid
- Timeline 在移动端有替代方案（折叠面板代替右侧边栏）

### 2. 主要问题（导致手机端混乱）

| 区域 | 问题 | 影响 |
|------|------|------|
| **Navbar** | 导航链接过多、LifeTimer + VisitorCount + LocationClock 挤在一行 | 手机端横向滚动、拥挤、难以点击 |
| **文字/随笔** | 分类 pills + 副标题同行；文章列表 metadata 小屏易挤 | 小屏阅读不舒适 |
| **文章正文** | 仅 `px-6`、无移动端字号优化、无安全区 | 刘海屏可能被遮挡；字号偏小 |
| **摄影** | 标题 + 布局切换同排，小屏易换行错乱 | 头部拥挤 |
| **Footer** | 微信二维码依赖 hover，手机无 hover | 无法扫码 |
| **Section** | 全局仅 `px-6`，无响应式间距 | 小屏左右留白不协调 |
| **触摸目标** | 部分按钮/链接可能小于 44px | 难以精准点击 |

---

## 二、实施方案

### A. Navbar 移动端优化
- **小屏 (<768px)**：折叠为汉堡菜单，点击展开下拉导航
- **保留**：LifeTimer、搜索快捷键
- **可选隐藏**：VisitorCount、LocationClock 在超小屏隐藏或移至菜单内

### B. 阅读体验优化
- **EssayDetail**：`px-4 sm:px-6`；正文字号 `text-base sm:text-lg`；行高 `leading-[1.75]`
- **安全区**：`env(safe-area-inset-top)` 用于固定导航
- **最小字号**：body 至少 16px，避免 iOS 自动缩放

### C. 摄影 / Essays 列表
- **Photography 头部**：小屏时垂直堆叠（布局切换在上、标题在下）
- **Essays 分类**：小屏时副标题换行；metadata 改为单行或两行

### D. Footer 微信二维码
- 移动端：点击展示二维码（替代 hover）
- 或：小屏下直接展示小图

### E. 全局
- `index.html`：视需要增加 `viewport-fit=cover` + CSS `padding-top: env(safe-area-inset-top)`
- Section：`px-4 sm:px-6 md:px-10`
- 触摸目标：按钮/链接最小 44×44px (用 `min-h-[44px] min-w-[44px]` 或 `py-3`)

---

## 三、实施优先级

1. **P0**：Navbar 移动端折叠（解决最明显的「混乱」）
2. **P0**：阅读正文移动端排版
3. **P1**：摄影/Essays 头部与列表
4. **P1**：Footer 微信扫码
5. **P2**：Section 全局间距、安全区
