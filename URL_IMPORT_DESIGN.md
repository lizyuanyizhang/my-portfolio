# 文字菜单：URL 导入方案设计

> 用户提供知乎、公众号、X 等平台的文章 URL，程序解析后展示在站点上。

---

## 🟢 小白首选：Jina Reader 方案（推荐）

### 为什么最适合编程小白

| 优势 | 说明 |
|------|------|
| **零依赖解析** | 不需要自己写 Mercury/Readability，Jina 直接返回清洗后的 Markdown/文本 |
| **免费无配额顾虑** | 官方宣称生产可用、稳定，无需 API Key |
| **调用极简** | 只需 `fetch('https://r.jina.ai/' + 用户URL)` 即可，一行核心逻辑 |
| **上线成功率高** | 服务成熟（GitHub 9.8k+ star），技术栈简单，出错点少 |

### 使用方式

```
用户输入: https://zhuanlan.zhihu.com/p/123456
请求地址: https://r.jina.ai/https://zhuanlan.zhihu.com/p/123456
返回: 已清洗的 Markdown 文本（标题、正文、图片描述等）
```

### 需要做的事（最少）

1. **Edge Function 代理**（约 30 行）：转发请求到 `r.jina.ai`，避免浏览器 CORS
2. **前端**：输入框 + 按钮，调用 Edge Function，拿到内容后写入 essays 或展示

### 限制说明

- **需登录的内容**：知乎/公众号部分文章需登录才能看全文，Jina 无法突破
- **公开文章**：知乎专栏、公众号转发链接、博客等公开页，一般可正常解析

**结论**：在「免开发、高成功率」前提下，Jina Reader 是最适合小白的方案。

---

## 一、现有实践调研

### 1. 成熟方案

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| **Mercury Parser** | Postlight 开源，将任意文章 URL 转为结构化内容（标题、正文、作者、日期） | 通用博客、新闻、知乎文章等 |
| **Mozilla Readability** | 提取正文，去除广告和侧栏 | Node 环境 |
| **第三方 API** | 如 Diffbot、ScrapingBee 等付费服务 | 对稳定性要求高 |

### 2. 各平台特点

| 平台 | 直接 fetch | 官方 API | 常见做法 |
|------|------------|----------|----------|
| **知乎** | ❌ CORS 限制 | ✓ OAuth API v4，需申请 | 服务端代理 + HTML 解析 或 官方 API |
| **微信公众号** | ❌ CORS + 登录墙 | ❌ 无公开 API | 第三方工具（wxdown、mptext 等）或抓包获取 cookie |
| **X (Twitter)** | ❌ CORS | ✓ 需 API Key | 官方 API 或服务端代理 |

### 3. 核心结论

- **前端无法直接 fetch**：知乎、公众号、X 均未对任意域名开放 CORS，浏览器会拦截跨域请求。
- **必须走服务端**：用 Supabase Edge Function 或自有后端作为代理，由服务端请求目标 URL，再解析 HTML。
- **正文提取**：Mercury Parser 或 Readability 可将 HTML 转为「标题 + 正文 + 元数据」。

---

## 二、推荐架构

```
用户输入 URL → Edge Function 代理请求 → Mercury/Readability 解析 → 返回 { title, content, date, ... } → 写入 essays 或新表 → 前端展示
```

### 技术选型

| 环节 | 选型 | 理由 |
|------|------|------|
| 代理层 | Supabase Edge Function | 项目已有，Deno 环境，支持 fetch |
| 解析库 | Mercury Parser（@postlight/mercury） | 支持 URL 直解析，返回结构化内容，中文友好 |
| 存储 | 现有 essays（data.json）或 Supabase 表 | 取决于是否需要动态数据 |

---

## 三、实现难度评估

| 模块 | 难度 | 工作量 | 说明 |
|------|------|--------|------|
| Edge Function：fetch URL | 低 | 0.5h | 标准 fetch，注意 User-Agent |
| 集成 Mercury Parser | 低 | 1h | npm 包，Deno 需用 esm.sh 等方式引入 |
| 知乎 / 公众号 / X 适配 | **中高** | 2–4h | 各平台反爬、登录墙、结构不同 |
| 前端：URL 输入 + 导入 | 低 | 1h | 表单 + 调用 Edge Function |
| 数据落库与展示 | 低 | 0.5h | 沿用现有 essays 结构 |

**整体**：中等，约 1–2 天可完成 MVP。

---

## 四、潜在问题与应对

### 1. 知乎

| 问题 | 应对 |
|------|------|
| 反爬、请求受限 | 设置真实 User-Agent、Referer，控制请求频率 |
| 部分内容需登录 | 无法解析时提示「该文章需登录后访问」 |
| 2025 年接口加密 | 使用 HTML 页面解析，不依赖内部 API |

### 2. 微信公众号

| 问题 | 应对 |
|------|------|
| 无公开 API，多需 cookie | 使用第三方服务（如 wxdown.online API）或接受「不支持公众号」 |
| 文章页为 mp.weixin.qq.com | 若可访问 HTML，Mercury 可尝试解析；很多需登录 |

**建议**：MVP 先支持知乎 + 通用博客，公众号作为后续扩展。

### 3. X (Twitter)

| 问题 | 应对 |
|------|------|
| 多为短文，非长文 | 解析出的 content 可能很短，可当作「短评/摘录」展示 |
| API 需 Key | 用 HTML 解析可免 API；若用 API 需单独申请 |

### 4. 通用

| 问题 | 应对 |
|------|------|
| 图片 URL 失效 | 可选：下载图片到 Supabase Storage 或图床 |
| JS 渲染页面 | 知乎/X 部分页面为 SSR，可直接解析；若遇 SPA，需 Puppeteer（更重） |
| 版权与 ToS | 仅自用、标明来源；避免批量爬取 |

---

## 五、方案 A：最小可行（推荐起步）

### 范围

- 支持：知乎文章、通用博客/新闻（如 Medium、少数派等）
- 暂不支持：公众号（需额外方案）、X 长文（可后续加）

### 流程

1. **站长**：在文字页或后台输入文章 URL。
2. **前端**：调用 `parse-article-url` Edge Function，传入 `{ url }`。
3. **Edge Function**：
   - fetch(url)，带合理 Headers；
   - 用 Mercury Parser 解析 HTML；
   - 返回 `{ title, content, excerpt, date, source }`。
4. **前端**：将返回结果写入 `essays`（或新表），刷新列表。

### 数据流

- 若 essays 仍用 JSON：解析结果需转为 data.json 格式，或先存 Supabase，再由构建时同步到 JSON。
- 若改用 Supabase 存储：可直接 insert 到 `essays` 表，前端从 API 读。

---

## 六、方案 B：扩展版（含公众号）

### 额外工作

- 接入第三方「公众号文章解析」服务（如 wxdown、mptext 等的 API），或自建抓包 + 解析；
- 为不同平台写不同解析逻辑（知乎 / 公众号 / X / 通用）。

### 适用场景

- 公众号文章是主要内容来源；
- 可接受付费或自建服务的复杂度。

---

## 七、建议实施步骤

1. **Phase 1**：实现「通用 URL 解析」  
   - Edge Function + Mercury Parser；  
   - 支持知乎 + 常见博客。

2. **Phase 2**：前端导入入口  
   - 站长输入 URL，点击「导入」；  
   - 预览解析结果，确认后写入 essays。

3. **Phase 3**：按需扩展  
   - 公众号：评估第三方 API 或专门爬虫；  
   - X：视内容形式决定是否单独处理。

---

## 八、Mercury Parser 示例

```javascript
// Deno / Edge Function 中
import Mercury from 'https://esm.sh/@postlight/mercury-parser';

const result = await Mercury.parse(url);
// result: { title, content, author, date_published, excerpt, lead_image_url, ... }
```

---

## 九、方案对比总结

| 方案 | 小白友好度 | 上线成功率 | 需要开发 | 推荐场景 |
|------|------------|------------|----------|----------|
| **Jina Reader 代理** | ⭐⭐⭐⭐⭐ | 高 | Edge Function 约 30 行 | 首选，公开文章 |
| Mercury + 自解析 | ⭐⭐⭐ | 中高 | Edge Function + 解析逻辑 | 需要更细粒度控制 |
| 第三方付费 API | ⭐⭐ | 高 | 接入与配置 | 预算充足、要求稳定 |
| 纯 iframe 嵌入 | ⭐⭐⭐⭐ | 低 | 几乎零 | 知乎/公众号常禁止 iframe，不推荐 |

---

## 十、结论

| 项目 | 结论 |
|------|------|
| **技术可行性** | ✓ 可行 |
| **小白首选** | **Jina Reader 代理**：一行 fetch，无解析逻辑，免费稳定 |
| **主要风险** | 需登录的知乎/公众号文章无法解析；可先支持公开内容 |
| **预估工期** | Jina 方案 MVP 约 2–4 小时 |

### 实施建议

1. **第一步**：用 Jina Reader 做 Edge Function 代理（约 30 行）
2. **第二步**：前端增加「输入 URL → 预览 → 导入」流程
3. **若 Jina 对某平台效果不好**：再考虑 Mercury 等自解析方案

如需要，可先从 Jina Reader 代理的 Edge Function 开始实现。
