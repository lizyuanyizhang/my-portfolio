# 摄影菜单 Notion 同步方案分析

> 在摄影模块复用类似「文字」的 Notion 上传逻辑，实现可视化维护照片。

---

## 一、现状对比

| 模块 | 数据来源 | 结构 | 当前维护方式 |
|------|----------|------|--------------|
| **文字** | `data.zh.json` → essays | id, title, excerpt, date, category, content | Notion 数据库 + Elog sync + 脚本 |
| **摄影** | `data.zh.json` → photos | id, url, caption, location, date | 手动改 JSON |

**Photo 结构**：`{ id, url, caption, location?, date? }`  
- `url`：图片地址（必需）  
- `caption`：描述  
- `location`：拍摄地点  
- `date`：日期

---

## 二、方案对比

| 方案 | 实现复杂度 | 维护成本 | 推荐度 |
|------|------------|----------|--------|
| **A. 双数据库 + 双 Elog** | 中 | 低 | ⭐⭐⭐⭐⭐ |
| **B. 单库 + 类型列** | 中高 | 中 | ⭐⭐⭐ |
| **C. Notion API 直连** | 高 | 低 | ⭐⭐ |

---

## 三、方案 A：双数据库 + 双 Elog（推荐）

### 思路

- 新建 Notion「摄影」数据库，单独同步
- 复用 Elog 流程，新增摄影专用配置和转换脚本

### Notion 摄影数据库结构

| 列名 | 类型 | 说明 |
|------|------|------|
| **标题** | Title | 照片描述 → caption |
| **图片** | Files & media | 上传图片，Elog 会下载到本地 |
| **地点** | Select / Text | → location |
| **日期** | Date | → date |

### 实现步骤

1. **新建 elog-photos.config.cjs**：指向摄影数据库，输出到 `content/elog-photos`
2. **新建 .elog-photos.env**：`NOTION_DATABASE_PHOTOS_ID`
3. **新建 scripts/notion-to-photos.cjs**：解析 `content/elog-photos/*.md`，提取图片 URL、caption、location、date，写入 `data.zh.json` 的 photos
4. **扩展 npm scripts**：`sync:notion:photos`、`sync:photos`，总 `sync` 同时跑 essays + photos

### 优点

- 与文字模块解耦，结构清晰  
- 和现有 Elog 流程一致，易维护  
- 图片可落本地或图床，灵活  

### 注意点

- Elog 会下载 Notion 图片到 `public/images/elog`，脚本需解析出最终图片路径（如 `/images/elog/xxx.png`）

---

## 四、方案 B：单库 + 类型列

### 思路

- 一个 Notion 数据库，加「类型」列：`随笔` | `摄影`
- 一次 Elog sync 拉全量
- 转换脚本按类型分流：随笔 → essays，摄影 → photos

### 挑战

- 单行结构需同时兼容：随笔（长正文）和摄影（图片 + 元数据）
- 摄影行若正文很少，Elog 可能仍会生成 md，需在脚本中正确识别并解析

### 适用

- 想在一个库里统一管理所有内容时

---

## 五、方案 C：Notion API 直连

### 思路

- 不用 Elog，直接调用 Notion API 读取摄影数据库
- 自写脚本转成 photos JSON

### 优点

- 控制力更强，可精确映射字段  

### 缺点

- 需维护 Notion 客户端和调用逻辑  
- 图片处理（下载、图床）需自行实现  

---

## 六、推荐结论

**优先选用方案 A**：  
- 和文字模块保持同一套「Notion → Elog → 脚本 → JSON」链路  
- 摄影数据结构简单，实现成本可控  
- 日后扩展（如多图、标签）也方便  

**已实现**：见 [摄影_NOTION_ELOG_SETUP.md](./摄影_NOTION_ELOG_SETUP.md)。
