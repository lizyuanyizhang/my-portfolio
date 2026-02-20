# 迷你 AI 对话配置指南 / Chat AI Setup Guide

> 「和张苑逸聊几句」—— 接入 DeepSeek 与通义千问，用个人化 prompt 实现「张苑逸」人设聊天

---

## 你需要完成的步骤

### 第一步：申请 API Key

#### 1. DeepSeek（推荐，性价比高）

1. 打开 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册 / 登录
3. 进入 **API Keys** 页面
4. 点击 **Create API Key**，复制生成的 key（形如 `sk-xxx`）

#### 2. 通义千问（Qwen）

1. 打开 [dashscope.aliyun.com](https://dashscope.aliyun.com)
2. 使用阿里云账号登录
3. 进入 **API-KEY 管理**
4. 创建 API Key，复制保存

---

### 第二步：Supabase 配置 Secrets

API Key 不能暴露在前端，必须存储在 Supabase Edge Function 的 Secrets 中。

1. 打开 [supabase.com](https://supabase.com)，进入你的项目
2. 左侧菜单 **Project Settings** → **Edge Functions**
3. 找到 **Secrets** 区域
4. 添加（至少配置一个即可使用）：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek API Key
   - `DASHSCOPE_API_KEY` = 你的通义千问 API Key

---

### 第三步：安装 Supabase CLI 并部署 Edge Function

#### 3.1 安装 Supabase CLI（三选一）

**方式 A：npm 全局安装**（需要 Node.js 20+）

```bash
npm install -g supabase
```

安装后检查：`supabase --version`。若提示 `command not found`，多半是 npm 全局 bin 未加入 PATH，可改用方式 B 或 C。

---

**方式 B：项目内安装 + npx 调用**（推荐，不依赖全局 PATH）

```bash
cd /path/to/your-project   # 替换为你的项目根目录
npm install supabase --save-dev
```

之后所有 `supabase` 命令改为 `npx supabase`，例如：`npx supabase login`。

---

**方式 C：Homebrew 安装**（macOS 用户）

```bash
brew install supabase/tap/supabase
```

安装后检查：`supabase --version`。

---

#### 3.2 获取项目 Reference ID（project-ref）

1. 打开 [supabase.com/dashboard](https://supabase.com/dashboard)，进入你的项目
2. 左侧 **Project Settings** → **General**
3. 找到 **Reference ID**，复制（形如 `abcdefghijklmnop`）

---

#### 3.3 登录并关联项目

在项目根目录（`欢迎来到这个数字世界`）执行：

```bash
# 登录（会打开浏览器，用 Supabase 账号授权）
npx supabase login
# 若已全局安装，则用：supabase login

# 关联远程项目（把 你的项目ID 替换为上面的 Reference ID）
npx supabase link --project-ref 你的项目ID
# 例如：npx supabase link --project-ref abcdefghijklmnop
```

关联时会要求输入数据库密码（创建项目时设的），若忘记可去 **Project Settings → Database** 重置。

---

#### 3.4 部署 chat 函数

```bash
npx supabase functions deploy chat --no-verify-jwt
# 若已全局安装：supabase functions deploy chat --no-verify-jwt
```

部署成功后，函数地址为：`https://你的项目ID.supabase.co/functions/v1/chat`。

> **说明**：`--no-verify-jwt` 允许匿名用户调用（前端无登录时也能用）。若希望仅登录用户可用，可去掉此参数。

---

### 第四步：确认前端环境变量

聊天功能复用 Supabase 配置，在 `.env.local` 中确认已有：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

与留言、访客量等功能共用，通常无需修改。

---

### 第五步：本地验证

1. 执行 `npm run dev`
2. 打开 `http://127.0.0.1:3000`
3. 左下角点击「消息气泡」图标，展开聊天面板
4. 输入「你好」发送，应收到张苑逸人设的回复

若提示「聊天功能未配置」：检查 Supabase URL/Anon Key 是否正确，以及 Edge Function 是否部署成功。

---

## 故障排除：FunctionsFetchError

若出现 **"FunctionsFetchError: Failed to send a request to the Edge Function"**，按下面顺序排查。

### 1. 确认环境变量指向正确项目

你的 Project ID 是 `cypfvwniqcbbygfweuvl`，URL 应为：

```
VITE_SUPABASE_URL=https://cypfvwniqcbbygfweuvl.supabase.co
```

- **本地**：检查 `.env.local`，确认无拼写错误、无多余空格
- **已部署（GitHub Pages）**：确认 GitHub → Settings → Secrets 中的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 与项目一致；修改 Secrets 后需重新部署（重新 push 或手动触发 workflow）

### 2. 关于 Supabase 的「限制请求来源」

Supabase 已在 2024–2025 年**移除了** Dashboard 中的 “Restrict API requests” / “Allowed Origins” 配置。该功能不再提供，因此你在界面上找不到它是正常的。Edge Function 的跨域访问需在函数代码中通过 CORS headers 处理（本项目已包含完整 CORS 配置）。

### 3. 用浏览器查看请求详情

1. 按 F12 打开开发者工具 → **Network（网络）** 面板
2. 再次发送聊天消息
3. 找到对 `chat` 的请求，查看：
   - **Status**：若为 CORS 错误会显示 failed / blocked
   - **Response**：若有返回，可看到具体错误信息

### 4. 本地测试

在项目根目录执行 `npm run dev`，在 `http://127.0.0.1:3000` 测试。  
若本地正常而线上失败，多半是部署环境变量或 API 来源限制问题。

---

## 可选：使用自定义后端

若不想用 Supabase Edge Function，可用自己的后端代理：

1. 后端提供 POST 接口，接收：
   ```json
   { "messages": [...], "systemPrompt": "...", "model": "deepseek" | "qwen" }
   ```
2. 响应：
   ```json
   { "content": "回复内容" }
   ```
   或错误：`{ "error": "错误信息" }`

3. 在 `.env.local` 中添加：
   ```
   VITE_CHAT_API_URL=https://你的后端地址/chat
   ```

此时将不再使用 Supabase 的 `chat` Edge Function，直接请求该 URL。

---

## 模型选择

前端（`ChatWidget`）目前默认使用 DeepSeek。若要切换为通义千问，可在 `chatApi.ts` 的 `sendChatMessage` 调用处传入 `model: 'qwen'`，或在组件中增加模型切换 UI。
