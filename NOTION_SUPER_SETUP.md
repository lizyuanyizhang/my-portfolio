# Notion + Super.so 文字站配置指南

> 在 Notion 里写文章、排版，用 Super.so 一键发布成站，再把本站「文字」入口链过去。

---

## 一、整体流程 / Workflow

1. **Notion**：创建「文字」页面，开启「Share to web」
2. **Super.so**：新建站点，绑定该 Notion 页面
3. **本站**：在 `personalInfo.essaysExternalUrl` 填入 Super 站点 URL

---

## 二、Step 1：在 Notion 创建「文字」页面

1. 登录 [Notion](https://notion.so)
2. 新建一个页面，命名为「文字」或「Essays」（任意名字）
3. 像写文档一样写文章：可插入标题、段落、图片、代码块、表格等
4. **开启分享**：
   - 点击右上角 **Share**
   - 勾选 **Share to web**
   - 复制生成的 **Share link**（形如 `https://xxx.notion.site/...`）

---

## 三、Step 2：在 Super.so 建站

1. 注册 [Super.so](https://super.so)
2. 点击 **Create new site**
3. 选择 **Connect Notion page**
4. 把上一步的 Notion Share link 粘贴进去
5. 选择模板（可选）、自定义域名等
6. 完成后会得到一个 **Super 站点 URL**，形如：
   - `https://你的站点名.super.site`
   - 或自定义域名，如 `https://essays.yourname.com`

**记住这个 URL**，下一步要填入项目配置。

---

## 四、Step 3：在本项目中配置链接

在三个语言文件中，为 `personalInfo.essaysExternalUrl` 填入你的 Super 站点 URL：

| 文件 | 说明 |
|------|------|
| `src/i18n/data.zh.json` | 中文 |
| `src/i18n/data.en.json` | 英文 |
| `src/i18n/data.de.json` | 德文 |

找到 `personalInfo` 中的 `essaysExternalUrl`，把空字符串改成你的 Super 站 URL：

```json
"personalInfo": {
  "name": "张苑逸 LIZ ZHANG",
  ...
  "essaysExternalUrl": "https://你的站点.super.site"
}
```

**三个文件都要改**，URL 通常相同。

---

## 五、效果说明

- **`essaysExternalUrl` 为空**：导航栏「文字」指向站内 `/essays` 页面
- **`essaysExternalUrl` 有值**：导航栏「文字」点击后在新标签页打开 Super 站

---

## 六、常见问题

### Q：能同时用站内 essays 和 Notion 站吗？

可以。留空 `essaysExternalUrl` 时用站内；填入后则跳转外链，站内 `/essays` 路由依然存在，只是导航不指向它。

### Q：Super.so 免费吗？

免费版可建站，有 `xxx.super.site` 子域名。自定义域名需付费。

### Q：Notion 里改了内容，多久生效？

Super.so 会定期同步 Notion 变更，通常几分钟内更新。

---

## 七、参考资料

- [Super.so 官网](https://super.so)
- [Notion Share to web](https://www.notion.so/help/sharing-and-permissions)
