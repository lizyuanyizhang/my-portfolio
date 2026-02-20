# Notion + Elog 站内文章同步指南

> 在 Notion 写作，同步到本站「文字」页面展示，无需跳转外部站点。
>
> **摄影同步**：见 [摄影_NOTION_ELOG_SETUP.md](./摄影_NOTION_ELOG_SETUP.md)。

---

## 一、流程概览

```
Notion 随笔数据库 → elog sync → content/elog-posts/*.md
                                    ↓
                        node scripts/notion-to-essays.cjs
                                    ↓
                        src/i18n/data.zh.json (essays 数组)
                                    ↓
                        npm run build → 部署
```

---

## 二、Step 1：在 Notion 创建随笔数据库

1. 打开 [Notion](https://notion.so)，新建一个 **Database - Full page**
2. 命名为「随笔」或「Essays」
3. 建议列：
   - **标题** (title) - 默认有
   - **日期** (date) - Date 类型
   - **选择** - Select 类型，选项须与站点菜单一致：旅行感受、技术思考、工作思考、影评、书评、随笔（顺序可自定义）
   - **描述** (description) - 用作摘要，可选
4. 在数据库中新建页面，像文档一样写正文
5. **重要**：把该数据库分享给 Integration（下一步创建）

---

## 三、Step 2：创建 Notion Integration 并获取 Token

1. 打开 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击 **New integration**
3. 填写名称（如 `Elog 同步`），选择工作区
4. 创建后，在 **Secrets** 中复制 **Internal Integration Secret**（即 `NOTION_TOKEN`）

---

## 四、Step 3：获取数据库 ID

1. 在 Notion 中打开你的随笔数据库
2. 浏览器地址栏 URL 形如：`https://www.notion.so/xxx/v?xxx`
3. 或：`https://www.notion.so/数据库页面名-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=xxx`
4. 中间那串 32 位字符（不含 `-`）就是 **Database ID**
5. 若 URL 较短，可点击数据库右上角 **...** → **Copy link**，从链接中截取 ID

---

## 五、Step 4：连接数据库与 Integration

1. 打开你的随笔数据库页面
2. 点击右上角 **...** → **Add connections** / **连接**
3. 选择刚创建的 Integration
4. 确认后，该数据库才能被 Elog 读取

---

## 六、Step 5：配置 Elog

1. 复制 `.elog.env.example` 为 `.elog.env`
2. 填入：

```
NOTION_TOKEN=刚才复制的 Integration Secret
NOTION_DATABASE_ID=你的数据库 ID
```

3. `.elog.env` 已在 .gitignore 中，不会提交

---

## 七、Step 6：安装依赖并同步

```bash
npm install
npm run sync
```

`npm run sync` 会依次执行：
1. `elog sync -e .elog.env -c elog.config.cjs`：从 Notion 拉取文章到 `content/elog-posts/`
2. `node scripts/notion-to-essays.cjs`：将 Markdown 转为 `data.zh.json` 的 essays

---

## 八、日常发布流程

1. 在 Notion 随笔数据库中新建或编辑文章
2. 本地执行：`npm run sync`
3. 提交并推送：`git add . && git commit -m "sync essays" && git push`
4. GitHub Actions 自动部署

---

## 九、常见问题

### Q：elog sync 报错 401 / 403

- 检查 `NOTION_TOKEN` 是否正确
- 确认数据库已通过 **Add connections** 连接该 Integration

### Q：elog sync 拉不到文章

- 确认 `NOTION_DATABASE_ID` 无误（32 位字符）
- 数据库内需至少有 1 篇已发布页面

### Q：sync:essays 报「未找到 content/elog-posts」

- 先执行 `npm run sync:notion` 完成 Elog 同步
- 再执行 `npm run sync:essays`

### Q：提示「文档缺失 title 属性」或「文档下载超时或无内容」

- **标题**：Notion 数据库的**第一列**必须是「标题」(Title) 类型，且每行都要有内容
- **正文**：点击每行进入子页面，在页面中写正文；空页面会被跳过
- 可新建一个「Table - Full page」数据库，默认第一列即为标题类型

### Q：菜单栏分类与 Notion「选择」列不一致

Notion API 返回属性时使用 UUID 作为 key，不是列名。因此 `elog.config.cjs` 中需设置 `include: []`（空数组）以导出全部属性。`notion-to-essays.cjs` 会自动从导出的 front matter 中识别分类值（如 随笔、技术思考、书评 等）。菜单栏会从 essays 中动态提取分类。

### Q：想只同步部分文章（如 status=已发布）

在 `elog.config.cjs` 的 `notion` 中取消注释并配置 filter：

```js
filter: { property: 'status', select: { equals: '已发布' } }
```

需在 Notion 数据库中增加 `status` 属性（Select 类型）。

---

## 十、脚本说明

| 命令 | 作用 |
|------|------|
| `npm run sync:notion` | 仅执行 Elog 同步 |
| `npm run sync:essays` | 仅将 elog-posts 转为 essays JSON |
| `npm run sync:notion:photos` | 仅拉取摄影数据库 |
| `npm run sync:photos` | 仅将 elog-photos 转为 photos JSON |
| `npm run sync` | 执行随笔 + 摄影全量同步 |
