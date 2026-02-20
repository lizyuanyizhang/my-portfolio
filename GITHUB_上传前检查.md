# GitHub 上传前安全隐私检查清单

> 在 `git push` 前对照此清单，避免泄露密钥、路径或个人敏感信息。

---

## ✅ 已确认安全

| 项目 | 说明 |
|------|------|
| **.env.local** | 已被 `.gitignore` 排除，不会提交。内含 Supabase Key、高德 Key、Year Review 密钥等，务必保持不提交 |
| **.env.example** | 仅含占位符（如 `your-anon-key`），无真实密钥，可安全提交 |
| **supabase/functions/** | API Key 通过 `Deno.env.get()` 读取，无硬编码 |
| **CHAT_AI_SETUP.md** | 已修复：原含本地路径 `/Users/yuanyizhang/...`，已改为通用占位符 |

---

## ⚠️ 需你确认的内容

### 1. data.zh/en/de.json 中的个人信息

这些文件会随代码一起提交，通常**个人主页项目**会故意展示：
- 姓名、邮箱、GitHub、社交链接
- `essaysExternalUrl`（你的 Super 站）

**若你打算：**
- **公开仓库**：以上信息会永久保留在 GitHub 历史中，邮箱可能被爬虫抓取
- **私有仓库**：仅你有权查看，风险较小
- **不想暴露邮箱**：可将 `email` 改为占位符，用 env 变量或联系表单替代

### 2. 文档中的个人示例

- **文字上线操作指南.md**：多处引用 `yuanyizhang.super.site` 作为示例  
  → 可改为「你的站点.super.site」使其更通用，或保留（仅为示例 URL，不算敏感）
- **AMAP_KEY_GUIDE.md**：示例域名为 `yuanyizhang.com`  
  → 可改为 `yourdomain.com` 或 `example.com`

---

## 📋 上传前快速检查命令

```bash
# 确认 .env.local 未被追踪
git status | grep "\.env"
# 应无 .env.local 输出；若出现则说明被追踪，需从 git 移除

# 搜索可能的密钥格式（JWT、API Key 等）
grep -r "eyJ" --include="*.json" --include="*.ts" --include="*.tsx" . 2>/dev/null || true
grep -r "sk-" --include="*.json" --include="*.ts" . 2>/dev/null || true
# 均不应有匹配
```

---

## 📁 .gitignore 已排除项

- `node_modules/`
- `build/`、`dist/`
- `.env*`（除 `.env.example`）
- `SUPABASE_SETUP.md`（若存在，可能含项目配置）

---

## 总结

| 类型 | 状态 |
|------|------|
| 密钥 / API Key | ✅ 均在 .env.local，已排除 |
| 本地路径 | ✅ 已从 CHAT_AI_SETUP 中移除 |
| 个人信息（邮箱、链接） | ⚠️ 按需确认是否适合公开 |
| 文档示例 | ⚠️ 可选：将个人域名/站点改为占位符 |

**结论**：在确认个人信息的公开意愿后，可以安全 push 到 GitHub。
