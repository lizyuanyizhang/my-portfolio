# 一键翻译功能方案 / One-Click Translation Plan

## 一、技术难度分析

| 方案 | 难度 | 成本 | 质量 | 实时性 |
|------|------|------|------|--------|
| **A. 预翻译 (i18n)** | ⭐⭐ | 零 | 高（可人工校对） | 即时 |
| **B. LibreTranslate API** | ⭐⭐⭐ | 免费/有限额 | 中高 | 1–3 秒/页 |
| **C. Google Cloud Translation** | ⭐⭐⭐ | 按量计费 | 高 | 快 |
| **D. MyMemory API** | ⭐⭐ | 免费 1000 词/日 | 中 | 较快 |

## 二、推荐方案：预翻译 + React Context

**选用理由**：
- 项目内容以 `data.json` 为主，天然适合多语言 JSON 结构
- 零 API 成本、无 CORS、无配额限制
- 切换即时，符合「一键」体验
- 可人工润色，翻译质量可控
- 业界常用（Next.js i18n、react-i18next 等均采用此思路）

## 三、实现架构

```
LanguageContext (zh | en | de)
       ↓
  data.zh / data.en / data.de
       ↓
  各页面从 context 读取对应语言数据
       ↓
  右下角悬浮按钮：EN | DE | 中
```

## 四、已实现

- `src/context/LanguageContext.tsx`：语言状态，localStorage 持久化
- `src/i18n/data.zh.json` / `data.en.json` / `data.de.json`：三套完整翻译数据
- `src/components/TranslationButton.tsx`：右下角悬浮按钮（点击展开 中 / EN / DE）
- 各页面：从 `useLanguage()` 获取 `data`，随语言切换自动更新
