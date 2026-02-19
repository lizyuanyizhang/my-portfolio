# 语音留言无法删除 - 详细解决步骤

> **Voice message delete troubleshooting / 语音删除故障排查**

---

## 问题原因概述

删除一条语音留言需要两步：
1. **删除数据库记录**（`voices` 表）— 决定列表中是否还显示这条录音
2. **删除存储文件**（`voices` 桶）— 决定音频文件是否还存在

如果无法删除，99% 是 **Supabase 的 RLS 策略（Row Level Security）没有正确配置**，导致匿名用户没有 `DELETE` 权限。

---

## 解决步骤（按顺序执行）

### 步骤 1：打开 Supabase 控制台

1. 登录 [supabase.com](https://supabase.com)
2. 进入你的项目
3. 左侧菜单打开 **SQL Editor**

---

### 步骤 2：检查并添加 `voices` 表的删除策略

在 SQL Editor 中依次执行以下命令。

#### 2.1 查看当前策略

```sql
-- 查看 voices 表已有的策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'voices';
```

如果没有名为 `Public delete voices` 或类似的 `DELETE` 策略，说明缺少删除权限。

#### 2.2 添加删除策略（如缺失则执行）

```sql
-- 如果已存在同名策略，先删除再创建，避免冲突
DROP POLICY IF EXISTS "Public delete voices" ON public.voices;

-- 允许任何人删除 voices 表记录
CREATE POLICY "Public delete voices"
ON public.voices FOR DELETE
USING (true);
```

执行后应显示 `Success. No rows returned`。

---

### 步骤 3：检查并添加 Storage 的删除策略

语音文件存储在 `voices` 桶，也需要删除权限。

#### 3.1 添加 storage.objects 的删除策略

```sql
-- 如果已存在同名策略，先删除再创建
DROP POLICY IF EXISTS "Public delete" ON storage.objects;

-- 允许删除 voices 桶中的文件
CREATE POLICY "Public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'voices');
```

---

### 步骤 4：验证策略是否生效

在 SQL Editor 中执行：

```sql
-- 测试：查看 voices 表中有多少条记录（替换为你自己的表）
SELECT id, storage_path, created_at FROM public.voices LIMIT 5;
```

记录一条的 `id`，然后手动测试删除（用 anon key 或在应用里点删除）：

```sql
-- 不要直接执行！这只是示例，说明 DELETE 现在应该能工作
-- DELETE FROM public.voices WHERE id = '你的某条记录的id';
```

如果步骤 2 和 3 的策略都正确创建，应用内的删除按钮应该可以正常工作。

---

### 步骤 5：在浏览器中验证

1. 运行 `npm run dev`，打开留言页
2. 点击某条语音的 **垃圾桶图标**
3. 确认删除

**预期结果**：
- 若配置正确：弹出「确定要删除这条录音吗？」→ 点确定 → 该条从列表消失
- 若仍有问题：会出现红色错误提示「删除失败：...」，或弹窗提示检查策略

---

### 步骤 6：如仍失败，打开控制台查看具体错误

1. 在留言页按 `F12`（或 `Cmd+Option+I`）打开开发者工具
2. 切到 **Console** 标签
3. 再次点击删除

查看是否有红色错误信息，例如：
- `new row violates row-level security policy for table "voices"` → voices 表策略问题
- `policy violation` / `permission denied` → 权限策略问题

把完整错误信息记下来，便于进一步排查。

---

## 完整策略一览（可直接复制执行）

如果希望一次性确保所有策略正确，可在 SQL Editor 中执行以下整段：

```sql
-- ========== voices 表 ==========
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read voices" ON public.voices;
CREATE POLICY "Public read voices" ON public.voices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert voices" ON public.voices;
CREATE POLICY "Public insert voices" ON public.voices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete voices" ON public.voices;
CREATE POLICY "Public delete voices" ON public.voices FOR DELETE USING (true);

-- ========== storage.objects (voices 桶) ==========
DROP POLICY IF EXISTS "Public read" ON storage.objects;
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'voices');

DROP POLICY IF EXISTS "Public upload" ON storage.objects;
CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voices');

DROP POLICY IF EXISTS "Public delete" ON storage.objects;
CREATE POLICY "Public delete" ON storage.objects FOR DELETE USING (bucket_id = 'voices');
```

执行后刷新应用，再次尝试删除。

---

## 常见问题

### Q: 执行 SQL 报错「policy already exists」
**A**：先用 `DROP POLICY IF EXISTS "策略名" ON 表名;` 删除旧策略，再执行 `CREATE POLICY`。

### Q: 删除后列表刷新又出现了
**A**：说明数据库的 DELETE 可能成功了，但 `fetchVoices` 在获取数据时有问题；或者实际是 **Storage 删除失败**，而前端仍通过旧的 URL 播放。重点检查：① voices 表 DELETE 策略 ② Storage DELETE 策略。

### Q: 我只想删数据库记录，不删文件可以吗？
**A**：可以。当前逻辑是：先删表记录（失败会抛错），再异步删存储文件。如果表策略正确、存储策略错误，列表会更新，但文件会留在 Storage 里成为孤儿文件。

---

## 总结

| 检查项 | 位置 | 策略名示例 |
|--------|------|------------|
| voices 表可删除 | Table Editor → voices → RLS | `Public delete voices` |
| voices 桶可删除 | Storage → voices → Policies | `Public delete` |

完成上述配置后，语音留言删除功能应可正常使用。
