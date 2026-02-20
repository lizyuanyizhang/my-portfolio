# 访客量功能配置指南 / Visitor Count Setup Guide

> 方案 D：Supabase + Fingerprint 近似唯一访客（UV），24 小时内同一设备只计一次。

---

## 你需要完成的步骤

### 第一步：在 Supabase 执行 SQL

1. 打开 [supabase.com](https://supabase.com)，登录后进入你已有的项目（留言功能使用的同一个项目）
2. 左侧菜单点击 **SQL Editor**
3. 点击 **New query** 新建查询
4. 打开本地项目中的 `supabase_visitor_count.sql` 文件，复制**全部内容**（从第一行到最后一行的 SQL）
5. 粘贴到 SQL Editor 的编辑框中
6. 点击右下角 **Run** 或按 `Cmd+Enter`（Mac）/ `Ctrl+Enter`（Windows）执行
7. 确认底部提示 `Success. No rows returned` 或类似成功信息，无报错

**若 `ALTER PUBLICATION supabase_realtime ADD TABLE public.site_stats` 报错：**  
可忽略该错误，改为在 **Database → Replication** 中手动勾选 `site_stats` 表。若没有该选项，部分项目会自动复制新表，可先忽略，测试功能是否正常。

---

### 第二步：确认 Realtime 已开启（可选检查）

1. 在 Supabase 项目中，进入 **Database** → **Replication**
2. 找到 `supabase_realtime` 的 publication
3. 确认 `site_stats` 在勾选列表中；若无，点击 **Edit** 添加 `site_stats`
4. 若列表中没有此表，可跳过——部分项目默认会复制所有表

---

### 第三步：确认环境变量

访客量复用留言功能的 Supabase 配置，无需新增变量。

在项目根目录的 `.env.local` 中确认已有：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

若已有留言功能，这两项应已配置。

---

### 第四步：部署时配置（GitHub Actions）

若使用 GitHub Actions 部署到 GitHub Pages：

1. 打开仓库 **Settings** → **Secrets and variables** → **Actions**
2. 确认已有：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 与留言功能共用，通常无需修改

---

### 第五步：本地验证

1. 在项目根目录执行：`npm run dev`
2. 打开 `http://127.0.0.1:3000`
3. 在导航栏「张苑逸已经在地球生活了...」下方，应看到类似：
   ```
   已经有 X 个人来过这里
   ```
4. 刷新页面，数字在 24 小时内应保持不变（同一设备视为同一访客）
5. 用手机或无痕模式打开同一地址，数字应 +1

---

### 第六步：手动初始化计数（可选）

若希望从某个数字开始，而不是 0：

1. 进入 Supabase **SQL Editor**
2. 执行：
   ```sql
   UPDATE public.site_stats SET visitor_count = 你想设置的数字 WHERE id = 1;
   ```

---

## 常见问题

**Q：数字一直是 0、"--" 或「暂无数据」？**  
A：依次检查：① `.env.local` 中 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 是否正确；② Supabase SQL 是否完整执行且无报错；③ 打开浏览器控制台（F12）查看是否有网络或脚本报错。

**Q：刷新一次数字就 +1？**  
A：24h 去重可能未生效。检查 Supabase 表 `visitor_fingerprints` 是否有记录，以及 `increment_visitor_if_new` 函数是否创建成功。可重新执行 `supabase_visitor_count.sql`。

**Q：多人同时访问时数字会实时变吗？**  
A：会。使用 Supabase Realtime 订阅，有新访客时所有打开页面的人都会看到数字更新。若不变，请确认 `site_stats` 已加入 Realtime（Database → Replication）。

**Q：本地正常，部署后显示「暂无数据」？**  
A：确认 GitHub Secrets 中已配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，且与本地 `.env.local` 值一致。

---

*配置完成后即可使用，无需每次重新配置。*
