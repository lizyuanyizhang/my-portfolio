# 影像 Notion 同步配置指南

> 在 Notion 维护影像数据库，同步到本站「摄影」页面的「影像」Tab 展示。支持多语言（中/英/德）。

---

## 一、流程概览

```
Notion 影像数据库 → elog sync → content/elog-videos/*.md
                                    ↓
                        node scripts/notion-to-videos.cjs
                                    ↓
                        src/i18n/data.zh.json / data.en.json / data.de.json (videos 数组)
```

---

## 二、Notion 数据库结构

在 Notion 中创建 **Database - Full page**，命名为「影像」或「Videos」。

### 列结构建议

| 列名 | Notion 类型 | 说明 | 对应字段 |
|------|-------------|------|----------|
| **标题** | Title | 视频标题 | title |
| **视频链接** | URL | YouTube 或 B 站分享链接 | videoUrl |
| **描述** | Text | 视频描述 | description |
| **封面** | URL（或 Files） | 自定义封面图，可选 | cover |
| **时长** | Text | 如 "3:42" | duration |
| **标签** | Multi-select | 学习 / vlog / AI视频 | tags |
| **日期** | Date | 发布日期 | date |

### 标签选项（多选）

- **学习** → 英文: Learning，德文: Lernen
- **vlog** → 保持 vlog（通用）
- **AI视频** → 英文: AI Video，德文: KI-Video

---

## 三、分享给 Integration

1. 打开该影像数据库页面
2. 右上角 **⋯** → **添加连接** / **Add connections**
3. 选择你的 Integration（与随笔/摄影共用）

---

## 四、配置 .elog-videos.env

```bash
cp .elog-videos.env.example .elog-videos.env
```

在 `.elog-videos.env` 中填入：

```
NOTION_TOKEN=与.elog.env相同的Integration_Secret
NOTION_DATABASE_VIDEOS_ID=你的影像数据库ID（从浏览器地址栏复制32位ID）
```

---

## 五、执行同步

```bash
# 仅同步影像
npm run sync:notion:videos   # 从 Notion 拉取
npm run sync:videos         # 转为 data.zh/en/de.json

# 或全量同步（含随笔、摄影、影像、时间轴、简历）
npm run sync
```

---

## 六、多语言翻译

- **标题**、**描述** 会自动翻译为英文和德文（需配置 DEEPL_AUTH_KEY / BAIDU_APP_ID+SECRET / VOLC_ACCESSKEY+SECRET 之一）
- **标签** 按固定映射：学习→Learning→Lernen，vlog→vlog，AI视频→AI Video→KI-Video
- 翻译结果有增量缓存，未改动内容不会重复请求 API

---

## 七、GitHub Actions 配置

若使用自动同步，在 **Settings → Secrets and variables → Actions** 中添加：

- `NOTION_DATABASE_VIDEOS_ID`：你的影像数据库 ID

并确保 workflow 中已创建 `.elog-videos.env`（已包含在 `sync-notion.yml` 中）。

---

## 八、常见问题

### Q：Notion 列名和示例不一致

脚本支持多种列名映射，如：
- 视频链接：`视频链接`、`videoUrl`、`URL`、`url`
- 标签：`标签`、`tags`、`tag`

### Q：同步后 videos 为空

- 检查每行是否填写了「视频链接」（YouTube 或 B 站 URL）
- 确保已执行 `npm run sync:notion:videos` 生成 content/elog-videos/*.md

### Q：视频无法嵌入播放

- 支持 YouTube：`youtube.com/watch?v=xxx`、`youtu.be/xxx`
- 支持 B 站：`bilibili.com/video/BVxxxxxxxx`（需完整 BV 链接）
