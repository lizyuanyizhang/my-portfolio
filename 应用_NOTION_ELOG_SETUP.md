# 应用 Notion + Elog 同步配置指南

> 在 Notion 维护应用数据库，同步到本站「应用」页面展示，支持中英德三语（自动翻译）。

---

## 一、流程概览

```
Notion 应用数据库 → elog sync → content/elog-projects/*.md
                                    ↓
                        node scripts/notion-to-projects.cjs
                                    ↓
            data.zh.json / data.en.json / data.de.json (projects 数组)
```

---

## 二、Step 1：在 Notion 创建应用数据库

1. 新建 **Database - Full page**，命名为「应用」或「Projects」
2. 列结构：

| 列名 | 类型 | 说明 |
|------|------|------|
| **标题** | Title | 项目名称，必填 |
| **描述** | Text | 简短描述，一两句话 |
| **封面** | Files & media | 项目封面图（建议 16:9） |
| **链接** | URL | 项目地址，如 https://xxx.vercel.app/ |
| **日期** / **创建日期** | Date | 完成时间 |
| **标签** | Multi-select | 如 React、AI、新春贺卡 |
| **技术栈** | Text | 如 `Cursor, React, Vite` 或 `Cursor · React · Vite`（逗号/顿号/中点均可） |

3. 新建行，填写标题、描述、上传封面、填写链接等
4. 若「封面」列未用，可在行内子页面插入图片（Elog 会提取并下载）

**列名支持**：`标题/title`、`描述/description`、`封面/图片/文件和媒体`、`链接/link/项目地址`、`日期/创建日期/date`、`标签/tags`、`技术栈/builtWith/tools`

---

## 三、Step 2：分享给 Integration

1. 打开该应用数据库页面
2. 右上角 **⋯** → **添加连接** / **Add connections**
3. 选择你的 Integration（与文字/摄影相同）
4. 确认连接

---

## 四、Step 3：获取数据库 ID

从浏览器地址栏复制 32 位数据库 ID（`notion.so/` 与 `?` 之间的部分）。

---

## 五、Step 4：配置 .elog-projects.env

在 `.elog-projects.env` 中填入：

```
NOTION_TOKEN=与.elog.env相同的Integration_Secret
NOTION_DATABASE_PROJECTS_ID=你的应用数据库ID
```

---

## 六、Step 5：执行同步

```bash
npm run sync:notion:projects   # 从 Notion 拉取
npm run sync:projects         # 转为 data.zh.json / en / de
# 或
npm run sync                 # 全量同步（包含应用）
```

---

## 七、多语言与翻译

- **中文**：在 Notion 中用中文填写标题、描述、标签
- **英文 / 德文**：自动翻译（与影像共用 DeepL / 百度 / 火山）
- **技术栈**：如 Cursor、React、Vite 等，多数不翻译，直接展示
- **标签映射**：常见中文标签会映射到 en/de（见 `notion-to-projects.cjs` 中 TAG_MAP）

若未配置翻译密钥，英文和德文页面将显示中文内容。

---

## 八、日常发布流程

1. 在 Notion 应用数据库中新建或编辑行
2. 确保每行有：标题、描述；封面和链接可选
3. 本地执行 `npm run sync`
4. 提交并推送

---

## 九、常见问题

### Q：sync:projects 跳过某条，提示「禁止将 Notion 临时链接写入」

- 封面图为 Notion S3 临时链接，脚本会尝试下载到 `public/images/elog/`
- 若下载失败（链接过期），需先执行 `npm run sync:notion:projects` 获取新链接，再执行 `npm run sync:projects`

### Q：无链接的项目如何展示？

- 在 Notion 中「链接」列留空即可
- 同步后该项目的 `link` 为 `undefined`，卡片不可点击

### Q：GitHub Actions 同步失败，提示 NOTION_DATABASE_PROJECTS_ID 未配置

- 在仓库 Settings → Secrets and variables → Actions 中新增 `NOTION_DATABASE_PROJECTS_ID`
- 若暂不使用应用 Notion 同步，可留空，workflow 会跳过（不影响其他模块）

---

## 十、脚本说明

| 命令 | 作用 |
|------|------|
| `npm run sync:notion:projects` | 仅拉取应用数据库 |
| `npm run sync:projects` | 仅将 elog-projects 转为 projects JSON（含翻译） |
| `npm run sync` | 全量同步（含应用） |
