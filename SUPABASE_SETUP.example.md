# Supabase 语音存储配置指南

> ⚠️ **安全提示**：请复制此文件为 `SUPABASE_SETUP.md` 作为你的本地配置笔记。
> `SUPABASE_SETUP.md` 已加入 .gitignore，不会被提交到 GitHub，你可在其中填写项目相关信息。
> 凭据请始终放在 `.env.local` 中，切勿写入任何会提交到 git 的文件。

声音页使用 Supabase 存储语音录制。按以下步骤完成配置。

---

## 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)，注册/登录
2. 点击 **New Project**，填写名称和密码
3. 创建完成后，进入项目 **Settings** → **API**，复制：
   - `Project URL` → 用作 `VITE_SUPABASE_URL`
   - `anon public` key → 用作 `VITE_SUPABASE_ANON_KEY`

---

## 2. 创建存储桶 (Storage Bucket)

1. 进入 **Storage** → **New bucket**
2. 名称填 `voices`
3. 勾选 **Public bucket**（录音需公开访问以便播放）
4. 创建后在 `voices` 桶的 **Policies** 中添加：

| 策略 | 说明 |
|------|------|
| **Allow public read** | 任何人可读取（播放录音） |
| **Allow public upload** | 任何人可上传（录音后保存） |

在 SQL Editor 中执行：

```sql
-- 允许公开读取
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'voices');

-- 允许公开上传
CREATE POLICY "Public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voices');

-- 允许公开删除（用于声音页删除录音）
CREATE POLICY "Public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'voices');
```

---

## 3. 创建数据表 (voices)

在 **SQL Editor** 中执行：

```sql
CREATE TABLE public.voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  caption TEXT
);

-- 允许匿名读取（访客可看列表）
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read voices"
ON public.voices FOR SELECT
USING (true);

-- 允许匿名插入（录音时写入）
CREATE POLICY "Public insert voices"
ON public.voices FOR INSERT
WITH CHECK (true);

-- 允许匿名删除（删除录音记录）
CREATE POLICY "Public delete voices"
ON public.voices FOR DELETE
USING (true);
```

---

## 4. 配置本地环境变量

在项目根目录创建 `.env.local`（已加入 .gitignore，不会提交）：

```
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

---

## 5. 配置 GitHub Pages 部署（可选）

若使用 GitHub Actions 部署，在仓库 **Settings** → **Secrets and variables** → **Actions** 中添加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

这样线上版本才能正常录音和播放。

---

## 6. 创建文字留言表 (messages，可选)

若使用「文字留言」功能，在 SQL Editor 中执行：

```sql
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read messages"
ON public.messages FOR SELECT USING (true);

CREATE POLICY "Public insert messages"
ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete messages"
ON public.messages FOR DELETE USING (true);
```

---

## 7. 验证

运行 `npm run dev`，打开 `/audio` 页面：

- 若配置正确，应看到录音按钮
- 按住录音，松开后上传，列表会刷新

---

## 注意事项

- **隐私**：当前策略为公开上传，任何人访问页面都可录音。若需限制，可后续接入 Supabase Auth 或后端校验。
- **存储额度**：Supabase 免费版提供约 1GB 存储，对每月一条语音足够使用。
