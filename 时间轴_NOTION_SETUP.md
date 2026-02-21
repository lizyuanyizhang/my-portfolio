# 时间轴 Notion 同步配置指南

> 在 Notion 维护时间轴数据库，同步到本站「时间轴」页面展示。无需 Elog，直接使用 Notion API。

---

## 一、流程概览

```
Notion 时间轴数据库 → node scripts/notion-to-timeline.cjs
                                    ↓
                        src/i18n/data.zh.json / data.en.json / data.de.json (timeline 数组)
```

---

## 二、Step 1：在 Notion 创建时间轴数据库

1. 新建 **Database - Full page**，命名为「时间轴」或「Timeline」
2. 列结构（列名支持中英文，任选其一）：

| 列名 | 类型 | 说明 |
|------|------|------|
| **年份** | Title 或 Number | 如 2024、「未来」 |
| **时间轴**（首列）| Title | 可直接写总结/标签，优先展示；Notion 默认列不可删除 |
| **总结** / **备注** | Text | 可选，与首列二选一 |
| **地点** | Text | 该年所在地 |
| **事件** | Text | 该年发生的事，首列为空时展示 |
| **充实度** | Number | 0–100，进度条数值 |
| **关联文章** | Multi-select | 填写 essays 的 id：`1`、`2` |
| **关联项目** | Multi-select | 填写 projects 的 id |
| **关联照片** | Multi-select | 填写 photos 的 id 或 url |
| **书影音** | Text | 每行一个：`类型\|标题\|时间`，如 `book\|禅与摩托车维修艺术\|2024 春` |

3. 在 Multi-select 列中，需提前添加选项（如 `1`、`2`），或直接输入后创建新选项
4. 书影音格式：每行 `类型|标题|时间`，类型为 `book`、`movie`、`music` 等

---

## 三、Step 2：分享给 Integration

1. 打开该时间轴数据库页面
2. 右上角 **⋯** → **添加连接** / **Add connections**
3. 选择你的 Integration（与文字/摄影共用）
4. 确认连接

---

## 四、Step 3：获取数据库 ID

从浏览器地址栏复制 32 位数据库 ID（`notion.so/` 与 `?` 之间的部分）。

---

## 五、Step 4：配置 .elog.env

在 `.elog.env` 中追加（复用同一 NOTION_TOKEN）：

```
NOTION_DATABASE_TIMELINE_ID=你的时间轴数据库ID
```

---

## 六、Step 5：执行同步

```bash
npm run sync:timeline   # 仅同步时间轴
# 或
npm run sync           # 同时执行随笔 + 摄影 + 时间轴
```

---

## 七、GitHub Actions

在 **Settings → Secrets and variables → Actions** 中新增：

- **Name**: `NOTION_DATABASE_TIMELINE_ID`
- **Value**: 你的时间轴数据库 ID

定时任务或手动运行「Sync from Notion」时会自动同步时间轴。

---

## 八、日常发布流程

1. 在 Notion 时间轴数据库中新建或编辑行
2. 本地执行 `npm run sync` 或 `npm run sync:timeline`
3. 提交并推送 `src/i18n/data.*.json`

---

## 九、常见问题

### Q：未配置时会怎样？

若未设置 `NOTION_DATABASE_TIMELINE_ID`，`sync:timeline` 会静默跳过，不影响其他同步。

### Q：关联文章/项目/照片怎么填？

填对应数据的 `id`。例如 essays 中 id 为 `1` 的文章，在「关联文章」列选 `1`。
