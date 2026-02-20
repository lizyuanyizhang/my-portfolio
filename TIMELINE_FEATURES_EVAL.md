# 时间轴增强功能评估：关键词云 + 地理轨迹地图

> 对「年度关键词云」与「地理轨迹动态地图」的成熟度、API、大模型依赖及实现方案评估，供决策参考。

---

## 一、年度关键词云

### 1.1 功能描述

从年度总结、文章、项目、摄影等板块提取关键词，在空白区以词云/标签云形式展示，字体大小或颜色表示权重。

### 1.2 成熟度与 API

| 项目 | 说明 |
|------|------|
| **前端库** | 成熟。`react-wordcloud`（基于 d3-cloud，19K+/周下载）、`react-tagcloud` 等，开源 MIT |
| **外部 API** | **无需**。纯前端即可，从已有 JSON 数据提取 |
| **数据来源** | `essays` 标题/分类/标签、`projects` 的 tags、`photos` 的 caption、Year Review 的 annual_word / summary_* |

### 1.3 是否接入大模型

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **A. 不接入** | 从 `essays`、`projects`、`photos` 的 title/tags/category 等直接统计词频 | 无成本、无延迟、实现简单 | 粒度粗，缺乏语义提炼 |
| **B. 接入** | 将 Year Review 的 summary_done/success/fail/learned 发给 DeepSeek，返回「10–20 个关键词 + 权重」 | 语义更准、更有「年度感」 | 每次生成需调用，有 token 成本 |
| **C. 混合** | 先用结构化数据生成基础词云，有 Year Review 时再叠加 AI 提炼的关键词 | 平衡成本与效果 | 实现略复杂 |

**建议**：优先方案 A，数据足够时效果尚可；若追求「年度复盘感」，可选 B 或 C。

### 1.4 实现方案概要

1. 从 `useLanguage().data` 取 essays、projects、photos、timeline
2. 按选中年份过滤
3. 提取：文章 title/category、项目 tags、照片 caption 等，做简单分词或直接按词统计
4. 传入 `react-wordcloud`，配置颜色、旋转、最大/最小字号
5. 若有 Year Review，可额外加入 `annual_word` 并提高权重

---

## 二、地理轨迹动态地图

### 2.1 功能描述

从站点数据中抽取「地点 + 时间」，在高德等地图上以轨迹线、标记点展示，支持路线回放或按时间连线。

### 2.2 可抓取的数据（你站点已有）

| 来源 | 字段 | 示例 |
|------|------|------|
| **timeline** | `location` | "中国泸州"、"上海"、"星辰大海" |
| **photos** | `location`, `date` | "苏州"、"京都"、"伦敦" |
| **resume** | `experience[].company` | 可推断城市（若补充） |
| **personalInfo** | `location` | "上海, 中国" |

**无需爬虫**，直接读 JSON 即可形成 `(地点, 时间)` 列表。

### 2.3 成熟 API：高德地图

| 能力 | 说明 |
|------|------|
| **JS API 2.0** | 官网示例、文档完整，支持 Polyline 轨迹、Marker 标记、`moveAlong` 动态回放 |
| **地理编码** | 地址 → 经纬度，如 "上海" → [121.47, 31.23] |
| **个人开发者** | 月 15 万次配额（多平台共享），日常展示足够 |
| **收费** | 超额后约 30 元/万次 |

文档示例：
- 轨迹绘制：<https://lbs.amap.com/api/javascript-api/example/overlayers/polyline-draw-and-edit>
- 地理编码：<https://lbs.amap.com/api/webservice/guide/api/georegeo>

### 2.4 是否接入大模型

| 用途 | 建议 |
|------|------|
| **地点抽取** | 不需要。timeline.location、photos.location 已结构化 |
| **非结构化文本** | 若未来从 essay content 等抽取地点，可考虑 LLM，当前可不做 |
| **轨迹故事化** | 可选：用 LLM 根据轨迹生成「这一年去了哪」的短描述，属锦上添花 |

**建议**：MVP 不接入大模型，以现有字段为主。

### 2.5 实现方案概要

#### 步骤 1：数据聚合

```ts
// 从 data 聚合 (location, date, source)
const points = [
  ...timeline.filter(t => t.location && t.location !== '星辰大海').map(t => ({ loc: t.location, date: t.year, type: 'timeline' })),
  ...photos.map(p => ({ loc: p.location, date: p.date, type: 'photo' })),
];
```

#### 步骤 2：地理编码

- 调用高德地理编码接口，将 "上海"、"京都" 等转为 `[lng, lat]`
- "星辰大海" 等无法解析的跳过或映射为默认点（如不显示）

#### 步骤 3：地图展示

- 引入高德 JS API，创建地图容器
- 用 `AMap.Polyline` 按时间顺序连线
- 用 `AMap.Marker` 标注关键点，点击显示时间、事件、照片缩略图
- 可选：`moveAlong` 做轨迹动画回放

#### 步骤 4：与时间轴联动

- 选中某年时，仅展示该年的轨迹点
- 或做「全部年份」与「单年」切换

### 2.6 前置条件

1. 高德开放平台注册、创建应用、获取 Web 端 Key
2. 在 HTML 中引入 `https://webapi.amap.com/maps?v=2.0&key=你的key`
3. 将 Key 放入 env（如 `VITE_AMAP_KEY`），避免提交到仓库

---

## 三、综合对比

| 维度 | 关键词云 | 地理轨迹地图 |
|------|----------|--------------|
| **实现难度** | 低 | 中 |
| **外部依赖** | 无 | 高德地图（需申请 Key） |
| **数据充分性** | 已足够 | 已足够（timeline + photos） |
| **大模型必要性** | 可选 | 基本不需要 |
| **用户感知** | 直观、易理解 | 视觉强、叙事感好 |
| **维护成本** | 低 | 中（API 配额、Key 安全） |

---

## 四、建议优先级

1. **关键词云**：实现快、无外部依赖，优先落地。
2. **地理轨迹地图**：效果突出，需高德 Key，可作为第二阶段功能。
3. **大模型**：两个功能都可先不接入；若希望词云更有「年度总结感」，再考虑在 Year Review 流程中增加关键词提取步骤。

---

## 五、下一步

若采纳该方案，可按以下顺序推进：

1. **P0**：实现关键词云（不接 LLM）
2. **P1**：申请高德 Key，实现基础地理编码 + 静态轨迹
3. **P2**：轨迹动画、与年份联动、气泡信息
4. **P3**（可选）：词云接入 AI 提炼、或从 essay 中抽取地点
