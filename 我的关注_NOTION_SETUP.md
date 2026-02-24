# 我的关注 Notion 同步配置指南

> 展示**正在看的、在学习的别人的网页或内容**，用 Notion 维护后在「我的关注」页面展示。

---

## 一、流程概览

```
Notion「我的关注」数据库 → elog sync → content/elog-follow/*.md
                                        ↓
                        node scripts/notion-to-follow.cjs
                                        ↓
                        src/i18n/data.zh.json (followLinks 数组)
```

---

## 二、Notion 数据库结构

在 Notion 中创建 **Database - Full page**，命名为「我的关注」。

### 列结构

| 列名 | Notion 类型 | 必填 | 说明 |
|------|-------------|------|------|
| **名称** | Title | ✓ | 内容/网站/作者名称，如「Interconnected」 |
| **链接** | URL | ✓ | 目标链接 |
| **类型** | Select | 建议 | 博客 / Newsletter / 播客 / 视频 / 课程 / 其他 |
| **描述** | Text | 可选 | 简短说明，如「Matt 的博客，关于 AI 与人性」 |
| **图标** | Text | 可选 | emoji，如 📖 🎙️ |

### 类型选项（用于分组展示）

- **博客** → Blog
- **Newsletter** → Newsletter
- **播客** → Podcast
- **视频** → Video
- **课程** → Course / Kurs
- **其他** → Other / Sonstige

---

## 三、分享给 Integration

1. 打开该数据库页面
2. 右上角 **⋯** → **添加连接**
3. 选择你的 Integration（与随笔/摄影共用）

---

## 四、配置 .elog-follow.env

```bash
cp .elog-follow.env.example .elog-follow.env
```

填入（NOTION_TOKEN 从 .elog.env 复制实际值）：

```
NOTION_TOKEN=ntn_xxxx...
NOTION_DATABASE_FOLLOW_ID=你的数据库ID
```

或使用脚本自动从 .elog.env 复制 token：

```bash
NOTION_TOKEN=$(grep '^NOTION_TOKEN=' .elog.env | cut -d= -f2-)
echo "NOTION_TOKEN=$NOTION_TOKEN" > .elog-follow.env
echo "NOTION_DATABASE_FOLLOW_ID=你的数据库ID" >> .elog-follow.env
```

---

## 五、执行同步

```bash
npm run sync:notion:follow   # 从 Notion 拉取
npm run sync:follow          # 转为 data.zh/en/de.json

# 或全量同步
npm run sync
```

---

## 六、页面展示

- 路由：`/follow`
- 导航：在「留言」右侧显示「我的关注」
- 按类型分组展示：博客、Newsletter、播客、视频、课程、其他

---

## 七、示例条目

| 名称 | 链接 | 类型 | 描述 |
|------|------|------|------|
| Interconnected | https://interconnected.org | 博客 | Matt 的博客，关于 AI 与人性 |
| 1x1 播客 | https://... | 播客 | 产品与人生 |
| Hacker News | https://news.ycombinator.com | 其他 | 技术社区 |
