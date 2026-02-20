# 摄影 Notion + Elog 同步配置指南

> 在 Notion 维护摄影数据库，同步到本站「摄影」页面展示。

---

## 一、流程概览

```
Notion 摄影数据库 → elog sync → content/elog-photos/*.md
                                    ↓
                        node scripts/notion-to-photos.cjs
                                    ↓
                        src/i18n/data.zh.json (photos 数组)
```

---

## 二、Step 1：在 Notion 创建摄影数据库

1. 新建 **Database - Full page**，命名为「摄影」或「Photos」
2. 列结构：

| 列名 | 类型 | 说明 |
|------|------|------|
| **标题** | Title | 行标识，必填 |
| **文件和媒体** | Files & media | 上传照片（支持拖拽）→ url |
| **拍摄地点** | Select 或 Text | → location |
| **日期** | Date | → date |
| **介绍** | Text | 照片描述 → caption（可选） |

3. 新建行，填写标题、上传图片、选地点和日期
4. 若「图片」列未用，也可在行内子页面拖入图片（Elog 会提取并下载）

---

## 三、Step 2：分享给 Integration

1. 打开该摄影数据库页面
2. 右上角 **⋯** → **添加连接** / **Add connections**
3. 选择你的 Integration（如 mydigitalworld）
4. 确认连接

---

## 四、Step 3：获取数据库 ID

从浏览器地址栏复制 32 位数据库 ID（`notion.so/` 与 `?` 之间的部分）。

---

## 五、Step 4：配置 .elog-photos.env

```bash
cp .elog-photos.env.example .elog-photos.env
```

在 `.elog-photos.env` 中填入：

```
NOTION_TOKEN=与.elog.env相同的Integration_Secret
NOTION_DATABASE_PHOTOS_ID=你的摄影数据库ID
```

---

## 六、Step 5：执行同步

```bash
npm run sync:notion:photos   # 从 Notion 拉取
npm run sync:photos          # 转为 data.zh.json
# 或
npm run sync                 # 同时执行随笔 + 摄影
```

---

## 七、日常发布流程

1. 在 Notion 摄影数据库中新建或编辑行
2. 确保每行有：标题、图片（列内上传或页面内插入）
3. 本地执行 `npm run sync`
4. 提交并推送

---

## 八、常见问题

### Q：sync:photos 跳过某条，提示「缺少图片」

- 在「图片」列上传文件，或在行内子页面插入图片
- 确保图片已成功上传（非占位或断链）

### Q：图片不显示 / 灰框 / 链接失效

- **原因**：Notion 图片为 S3 临时链接（约 1 小时过期），直接写入会失效。
- **方案**：`notion-to-photos.cjs` 会自动将 Notion 图片下载到 `public/images/elog/`，并使用本地路径 `/images/elog/xxx` 写入 data.zh.json。
- **操作**：执行完整同步 `npm run sync`（包含 sync:notion:photos 获取新链接 + sync:photos 下载并写入），图片会持久化。

### Q：之前同步的照片变少或消失

- 每次 `sync:photos` 会用 Notion 摄影数据库**完全替换** data.zh.json 的 photos 数组。
- 若 Notion 中删除了条目，或数据库只剩部分照片，同步后数量会减少。
- 若图片显示灰框，说明 URL 已过期，需重新执行 `npm run sync` 获取新链接并下载。

---

## 九、脚本说明

| 命令 | 作用 |
|------|------|
| `npm run sync:notion:photos` | 仅拉取摄影数据库 |
| `npm run sync:photos` | 仅将 elog-photos 转为 photos JSON |
| `npm run sync` | 随笔 + 摄影 全量同步 |
