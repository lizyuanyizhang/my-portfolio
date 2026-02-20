# 年度总结 / Year in Review — 方案设计

> 用 AI 自动聚合首页、简历、文字、摄影、应用、留言、影像等内容，在时间轴呈现「数据量化 + 哲学/创业者式鼓励」的个人数据看板。参考 Tw93「持续迭代」年度词风格、Spotify Wrapped 数据可视化、IndieWeb Year in Review 最佳实践。

---

## 一、目标与定位

### 1.1 核心价值

- **数据量化**：写了几篇文章、发了多少照片、做了哪些项目、收到多少留言……
- **反思维度**：做了什么、成功了什么、失败了什么、学到了什么
- **情感连接**：以顶级 Alpha / 哲学家 / 创业者的口吻，给自己一份真诚的鼓励与复盘
- **周期性回顾**：周 / 月 / 季 / 半年 / 年，形成个人数据看板

### 1.2 参考风格

| 来源 | 特点 |
|------|------|
| **Tw93** | 年度词（如「持续迭代」）、生活迭代亮点、应对时间加速的策略 |
| **Spotify Wrapped** | Top 5、总时长、趋势、可分享的卡片式展示 |
| **IndieWeb** | 聚焦 Top 5 创作、保持个人化、连接社区 |
| **ChatGPT Year in Review** | AI 生成、主题归纳、个性 archetype |

---

## 二、数据来源与聚合

### 2.1 各板块可聚合数据

| 板块 | 数据项 | 来源 |
|------|--------|------|
| **首页** | 时间轴事件、fulfillment、influences | `timeline` (i18n) |
| **简历** | 经历更新、技能、教育 | `resume` (i18n) |
| **文字** | 文章数、分类分布、标题列表 | `essays` (i18n) |
| **摄影** | 照片数、地点分布、标题 | `photos` (i18n) |
| **应用** | 项目数、技术栈、链接 | `projects` (i18n) |
| **留言** | 语音条数、文字留言数 | `voices` / `messages` (Supabase) |
| **影像** | 视频数、时长、标题 | `videos` (i18n) |

### 2.2 周期与时间过滤

- **周**：过去 7 天
- **月**：过去 30 天 / 自然月
- **季**：Q1–Q4
- **半年**：H1 / H2
- **年**：自然年 1.1–12.31

按 `date` / `created_at` 过滤，汇总数量与列表。

---

## 三、总结维度（AI Prompt 结构化输出）

### 3.1 数据量化（Structured Data）

```json
{
  "metrics": {
    "essays_written": 2,
    "photos_added": 3,
    "projects_shipped": 1,
    "videos_published": 1,
    "voice_messages_received": 5,
    "text_messages_received": 12
  },
  "highlights": [
    { "type": "essay", "title": "关于数字时代的宁静", "date": "2024-01-15" },
    { "type": "project", "title": "新年祝福卡片生成器", "date": "2024" }
  ]
}
```

### 3.2 定性总结（AI 生成）

- **做了什么**：一句概括 + 3–5 条 bullet
- **成功了什么**：具体成就
- **失败了什么 / 未完成**：坦诚复盘
- **学到了什么**：1–2 条 takeaway
- **年度词**（仅年度）：1 个词或短语，如 Tw93 的「持续迭代」
- **鼓励语**：哲学家 / 创业者口吻，50–100 字

---

## 四、技术架构

### 4.1 数据流

```
[ 前端 ] 收集 i18n + Supabase 数据
    ↓ 按周期过滤
[ 请求 ] POST /functions/v1/generate-year-review
    body: { periodType, periodValue, aggregatedData }
    ↓
[ Edge Function ] 构建 prompt → 调用 DeepSeek/Qwen
    ↓ 解析 JSON + 文本
[ Supabase ] 写入 year_reviews 表
    ↓
[ 时间轴 ] 按 year 展示 YearReviewCard
```

### 4.2 存储结构

**表：`year_reviews`**

| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| period_type | text | 'week' \| 'month' \| 'quarter' \| 'half_year' \| 'year' |
| period_value | text | 如 '2024', '2024-Q1', '2024-02' |
| year | text | 所属年份，用于时间轴关联 |
| annual_word | text | 年度词（仅 year 类型） |
| metrics | jsonb | 数据量化 |
| highlights | jsonb | 精选条目 |
| summary_done | text | 做了什么 |
| summary_success | text | 成功了什么 |
| summary_fail | text | 失败了什么 |
| summary_learned | text | 学到了什么 |
| encouragement | text | 鼓励语 |
| created_at | timestamptz | 生成时间 |

### 4.3 触发方式

1. **手动**：时间轴某年展开后，点击「生成本期总结」
2. **定时**（可选）：Supabase Cron 或外部 cron 每周/月触发
3. **内容变更**：新文章发布后提示「要不要更新总结？」（进阶）

---

## 五、UI/UX 设计

### 5.1 时间轴中的展示

在某年（如 2024）展开时：

1. 若有已生成的总结 → 显示 **YearReviewCard**
   - 年度词（大字）
   - 数据看板（指标卡片）
   - 做了什么 / 成功 / 失败 / 学到
   - 鼓励语

2. 若无 → 显示「生成本期总结」按钮，点击后调用 AI 并保存

### 5.2 年度总结页（可选）

- 路由：`/year/2024`、`/year/2025`
- 类似 Tw93 的 `my-2024.html`，整页展示：时间轴 + 照片 + 文字回顾
- 可分享链接

---

## 六、AI Prompt 设计要点

```
你是张苑逸的年度复盘助手，兼具数据思维与哲学家/创业者的视角。

输入：周期类型、周期值、聚合后的数据（文章、项目、照片、视频、留言等数量及列表）

输出（JSON + 短文本）：
1. metrics：数量统计
2. highlights：Top 5 精选
3. summary_done：做了什么（3-5 条）
4. summary_success：成功了什么
5. summary_fail：失败了什么（坦诚，不粉饰）
6. summary_learned：学到了什么
7. annual_word：（仅年度）一个词概括这一年
8. encouragement：50-100 字，像顶级创业者或哲学家那样鼓励她
```

---

## 七、实施阶段

| 阶段 | 内容 |
|-----|------|
| **P0** | Supabase 表、Edge Function、前端调用与基础展示 ✅ |
| **P1** | 时间轴集成 YearReviewCard、生成按钮 ✅ |
| **P2** | 年度总结独立页 `/year/:year` |
| **P3** | 定时触发、多周期切换、分享能力 |

---

## 八、配置步骤

### 1. 执行 SQL 建表

在 Supabase Dashboard → SQL Editor 中执行 `supabase_year_reviews.sql`。

### 2. 部署 Edge Function

```bash
npx supabase functions deploy generate-year-review --no-verify-jwt
```

需已配置 `DEEPSEEK_API_KEY`（与 chat 共用）。

### 3. 站长模式（可选）

普通访客只能看到已有总结，无法点击「生成」。站长需解锁：

- **方式 A**：地址栏加 `?owner=1`（若未配置密钥，默认 1 即可）
- **方式 B**：点击「站长入口」→ 输入密钥

在 `.env.local` 中设置 `VITE_YEAR_REVIEW_OWNER_KEY=你的密钥`，生产环境建议用强密钥。

### 4. 使用

1. 打开时间轴页面
2. 站长访问 `?owner=你的密钥` 或点击「站长入口」输入密钥
3. 展开某年（如 2024）→ 点击「生成 2024 年度总结」
4. 等待 AI 生成并展示
