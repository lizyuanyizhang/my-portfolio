# 内容上传指南 / Content Upload Guide

> 本文档说明各菜单下内容如何添加与更新，步骤详细，可按需查阅。

---

## 目录

1. [首页](#一首页)
2. [简历](#二简历)
3. [文字](#三文字)
4. [摄影](#四摄影)
5. [应用](#五应用)
6. [时间轴](#六时间轴)
7. [留言](#七留言)
8. [影像](#八影像)

---

## 一、首页

**数据来源**：`src/data.json` → `personalInfo`

### 修改步骤

1. 打开 `src/data.json`
2. 找到 `personalInfo` 对象
3. 修改以下字段（示例）：

```json
{
  "personalInfo": {
    "name": "你的名字 ENGLISH",
    "title": "你的职业/标签",
    "bio": "简介（首页暂未展示，可保留）",
    "email": "your@email.com",
    "linkedin": "https://linkedin.com/in/your-profile",
    "xiaohongshu": "https://xhslink.com/xxx",
    "github": "https://github.com/your-username",
    "x": "https://x.com/your-handle",
    "podcast": "https://www.xiaoyuzhoufm.com/podcast/xxx",
    "jike": "https://okjk.co/xxx",
    "wechatQR": "/images/wechat_qr.png",
    "location": "城市, 国家",
    "language": "Mandarin/ English"
  }
}
```

### 特别说明

- **wechatQR**：需将微信二维码图片放在 `public/images/wechat_qr.png`，或修改为你的图片路径
- 首页文案「这是一场跨越百年的生命实验...」在 `src/pages/Home.tsx` 中，需改代码

---

## 二、简历

**数据来源**：`src/data.json` → `personalInfo` + `resume`

### 修改步骤

1. 打开 `src/data.json`
2. 修改 `resume` 对象：

```json
{
  "resume": {
    "summary": "个人总结，一两段话。",
    "experience": [
      {
        "role": "职位名称",
        "company": "公司名称",
        "period": "2021 - 至今",
        "details": ["工作内容点1", "工作内容点2"]
      }
    ],
    "education": [
      {
        "degree": "学位名称",
        "school": "学校名称",
        "period": "2014 - 2018"
      }
    ],
    "skills": {
      "development": ["React", "TypeScript", "Node.js"],
      "design": ["Figma", "UI/UX", "Motion"],
      "languages": ["中文", "英语"]
    }
  }
}
```

3. 简历头部信息（姓名、邮箱、位置等）来自 `personalInfo`，见「首页」一节

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| summary | ✓ | 个人总结 |
| experience | ✓ | 工作经历数组，按时间倒序 |
| education | ✓ | 教育背景数组 |
| skills | ✓ | 开发、设计、语言三类技能 |

---

## 三、文字

**数据来源**：`src/data.json` → `essays`

### 修改步骤

1. 打开 `src/data.json`
2. 在 `essays` 数组中添加或编辑对象：

```json
{
  "id": "3",
  "title": "文章标题",
  "excerpt": "摘要，显示在列表页，约 1–2 句。",
  "date": "2024-06-15",
  "category": "随笔",
  "content": "全文内容，支持换行。\n\n段落之间用两个换行符分隔。"
}
```

### 分类选项

可选：`随笔`、`书评`、`影评`、`旅行日记`、`技术思考`、`工作感悟`。不填则默认「随笔」。

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | ✓ | 唯一 ID，如 "1"、"2" |
| title | ✓ | 文章标题 |
| excerpt | ✓ | 列表页摘要 |
| date | ✓ | 发布日期 YYYY-MM-DD |
| category | | 分类，见上 |
| content | | 正文，点击「阅读全文」时显示 |

### 注意事项

- `id` 不能重复
- 修改后需重新构建/刷新页面才能看到更新

---

## 四、摄影

**数据来源**：`src/data.json` → `photos`

### 修改步骤

1. **准备图片**  
   - 将图片上传至图床（如 [imgbb](https://imgbb.com)、[Cloudinary](https://cloudinary.com)）或放入 `public/images/`  
   - 获得图片的 URL（如 `https://xxx.com/photo.jpg` 或 `/images/photo.jpg`）

2. 打开 `src/data.json`，在 `photos` 数组中添加：

```json
{
  "id": "4",
  "url": "https://你的图床地址/xxx.jpg",
  "caption": "照片描述/标题",
  "location": "拍摄地点",
  "date": "2024-05"
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | ✓ | 唯一 ID |
| url | ✓ | 图片完整 URL 或 `/images/xxx.jpg` |
| caption | ✓ | 图注/标题 |
| location | | 地点，用于「合集」模式按地点分组 |
| date | | 拍摄日期 |

### 本地图片

- 将图片放入 `public/images/photos/`
- `url` 填 `/images/photos/文件名.jpg`
- 注意：GitHub 仓库有大小限制，大图建议用图床

---

## 五、应用

**数据来源**：`src/data.json` → `projects`

### 修改步骤

1. 准备项目封面图（建议 16:9），放入 `public/images/projects/` 或使用外链
2. 打开 `src/data.json`，在 `projects` 数组中添加：

```json
{
  "id": "2",
  "title": "项目名称",
  "description": "简短描述，一两句话。",
  "image": "/images/projects/cover2.png",
  "tags": ["React", "AI"],
  "date": "2024",
  "link": "https://你的项目地址.vercel.app/",
  "builtWith": ["Cursor", "React", "Vite"]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | ✓ | 唯一 ID |
| title | ✓ | 项目名称 |
| description | ✓ | 描述 |
| image | | 封面图路径或 URL |
| tags | | 标签数组 |
| date | | 完成时间 |
| link | | 项目链接，点击卡片跳转 |
| builtWith | | 技术栈/工具 |

### 无链接项目

若暂无链接，`link` 可填 `"#"`，卡片将不可点击。

---

## 六、时间轴

**数据来源**：`src/data.json` → `timeline`

时间轴自动生成 1996–2096 年，你只需在 `timeline` 中**覆盖有内容的年份**。

### 修改步骤

1. 打开 `src/data.json`
2. 在 `timeline` 数组中添加或编辑年份对象：

```json
{
  "year": "2024",
  "location": "上海",
  "event": "这一年发生的事",
  "fulfillment": 85,
  "portfolio": {
    "photos": ["1", "2"],
    "essays": ["1"],
    "projects": ["1"]
  },
  "influences": [
    {
      "type": "book",
      "title": "《书名》",
      "time": "2024 春"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| year | ✓ | 年份，如 "2024" |
| location | ✓ | 地点 |
| event | ✓ | 事件/描述 |
| fulfillment | | 0–100，进度条数值 |
| portfolio | | 该年关联的作品 |
| influences | | 书影音影响 |

### portfolio 引用规则

- **photos**：填 `photos` 数组中某张照片的 `id` 或 `url`
- **essays**：填 `essays` 中某篇文章的 `id`
- **projects**：填 `projects` 中某个项目的 `id`

### influences 的 type

- `book`：书籍
- `movie`：电影
- `music`：音乐
- 其他：默认图标

### 未定义年份

未在 `timeline` 中写的年份会显示为「岁月的留白」，`fulfillment` 默认 50。

---

## 七、留言

**数据来源**：Supabase（voices 表、messages 表、voices 存储桶）

留言包含**语音留言**和**文字留言**，由访客在页面内直接录制/输入，无需你在 `data.json` 中手动添加。

### 首次配置（你只需做一次）

#### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)，登录
2. 新建项目，记下 **Project URL** 和 **anon key**

#### 2. 创建 Storage 桶

1. Storage → New bucket → 名称 `voices`
2. 勾选 Public
3. Policies 中执行（SQL Editor）：

```sql
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'voices');
CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voices');
CREATE POLICY "Public delete" ON storage.objects FOR DELETE USING (bucket_id = 'voices');
```

#### 3. 创建数据表

```sql
-- 语音
CREATE TABLE public.voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER
);
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read voices" ON public.voices FOR SELECT USING (true);
CREATE POLICY "Public insert voices" ON public.voices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete voices" ON public.voices FOR DELETE USING (true);

-- 文字
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete messages" ON public.messages FOR DELETE USING (true);
```

#### 4. 配置本地环境变量

在项目根目录创建 `.env.local`：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

#### 5. 部署时配置 GitHub Secrets

- 仓库 → Settings → Secrets and variables → Actions
- 添加 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`

### 访客如何使用

- **语音**：点击「开始录音」→ 录制 → 点击「结束录音」，自动上传
- **文字**：在输入框输入内容 → 点击「发表」

详细 Supabase 步骤见 `SUPABASE_SETUP.example.md`，删除问题见 `VOICE_DELETE_TROUBLESHOOTING.md`。

---

## 八、影像

**数据来源**：`src/data.json` → `videos`

视频通过 **YouTube** 或 **B 站** 嵌入，不直接上传到本项目。

### 修改步骤

#### 1. 上传视频到平台

- **YouTube**：youtube.com 上传，获得链接，如 `https://www.youtube.com/watch?v=视频ID`
- **B 站**：bilibili.com 上传，获得链接，如 `https://www.bilibili.com/video/BVxxxxxxxx`

#### 2. 编辑 data.json

打开 `src/data.json`，在 `videos` 数组中添加：

```json
{
  "id": "2",
  "title": "视频标题",
  "description": "简短描述",
  "cover": "https://自定义封面图URL（可选）",
  "videoUrl": "https://www.youtube.com/watch?v=xxx",
  "duration": "5:30",
  "tags": ["记录", "AI生成"],
  "date": "2025-01"
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | ✓ | 唯一 ID |
| title | ✓ | 视频标题 |
| description | ✓ | 描述 |
| cover | | 封面图 URL，不填则用平台缩略图 |
| videoUrl | ✓ | YouTube 或 B 站分享链接 |
| duration | | 时长，如 "3:42" |
| tags | | 标签数组 |
| date | | 发布日期 |

### 支持的链接格式

- YouTube：`youtube.com/watch?v=xxx`、`youtu.be/xxx`
- B 站：`bilibili.com/video/BVxxxxxxxx`（需完整 BV 链接）

### 注意事项

- `videoUrl` 必须是可直接嵌入的公开视频
- 修改后需重新构建/刷新页面

---

## 快速索引

| 菜单 | 数据位置 | 是否需要 Supabase |
|------|----------|-------------------|
| 首页 | personalInfo | 否 |
| 简历 | personalInfo + resume | 否 |
| 文字 | essays | 否 |
| 摄影 | photos | 否 |
| 应用 | projects | 否 |
| 时间轴 | timeline | 否 |
| 留言 | Supabase | ✓ 需配置 |
| 影像 | videos | 否 |

---

## 修改后如何生效

- **data.json**：本地 `npm run dev` 会热更新；部署需重新 `npm run build` 并推送
- **留言**：配置好 Supabase 后即时生效，无需重新构建

---

*文档更新于 2026-02*
