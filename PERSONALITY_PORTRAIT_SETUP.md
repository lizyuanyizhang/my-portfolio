# 人格画像配置指南

人格画像会根据你的文字、图片、时间轴、年度总结等内容，每月生成一次人格特质词云，审美参考深红褐 + 黑色双色紧密排列。

---

## 一、Supabase 配置

### 1. 执行 SQL 建表

在 [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor 中执行 `supabase_personality_portraits.sql` 全部内容。

### 2. 部署 Edge Function

```bash
supabase functions deploy generate-personality-portrait
```

### 3. 配置密钥

在 Supabase → Project Settings → Edge Functions → Secrets 中确保已配置：

- `DEEPSEEK_API_KEY`（与 Year in Review 共用）
- `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（通常已自动注入）

---

## 二、使用方式

1. **首次使用**：进入 Timeline 页面，右侧栏会显示「人格画像」占位。
2. **站长生成**：点击「站长入口」解锁后，点击「生成本月人格画像」。
3. **每月一次**：建议每月初生成一次，AI 会基于你当前的全部内容提取人格特质。
4. **重新生成**：同一个月可再次点击生成，会覆盖当月画像。

---

## 三、数据来源

AI 会分析以下内容：

- 文章 / 随笔（标题、摘要、正文）
- 项目（标题、描述、标签）
- 照片（描述、地点）
- 时间轴事件
- 年度总结
- 个人简介

---

## 四、审美说明

- **双色**：深红褐 (#722F37) + 黑色
- **字号**：按权重动态变化，核心特质更大
- **布局**：紧密排列，略作旋转，形成有机形态
