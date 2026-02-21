#!/usr/bin/env node
/**
 * 将 Elog 同步的 Markdown 转为 data.zh.json / data.en.json / data.de.json 的 essays 数组
 * 支持三种翻译：DeepL、百度、火山引擎。优先级：TRANSLATION_PROVIDER 指定 > DeepL > 百度 > 火山
 * 环境变量：DEEPL_AUTH_KEY | BAIDU_APP_ID+BAIDU_SECRET_KEY | VOLC_ACCESSKEY+VOLC_SECRETKEY
 * 增量翻译：仅翻译新增或内容有变的文章，未改动的复用缓存
 * 前置：先执行 npx elog sync -e .elog.env
 * 用法：node scripts/notion-to-essays.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.elog.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSTS_DIR = path.join(__dirname, '../content/elog-posts');
const CACHE_PATH = path.join(__dirname, '.essay-translation-cache.json');

/** 根据中文内容生成哈希，用于判断是否需重新翻译 */
function contentHash(essay) {
  const str = [essay.title, essay.excerpt, essay.content, essay.date].join('\0');
  return crypto.createHash('md5').update(str).digest('hex');
}

/** 加载翻译缓存 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

/** 保存翻译缓存 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf-8');
}

function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .trim();
}

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontMatter: {}, body: content };
  const frontMatter = {};
  match[1].split('\n').forEach((line) => {
    /* 支持中文等属性名（如 Notion 的「选择」） */
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      frontMatter[key] = m[2]?.replace(/^["']|["']$/g, '').trim();
    }
  });
  return { frontMatter, body: match[2] };
}

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** 选择翻译提供商：deepl | baidu | volc，未指定时按优先级自动选择 */
function getTranslationProvider() {
  const forced = process.env.TRANSLATION_PROVIDER?.toLowerCase();
  if (forced === 'deepl' && process.env.DEEPL_AUTH_KEY) return 'deepl';
  if (forced === 'baidu' && process.env.BAIDU_APP_ID && process.env.BAIDU_SECRET_KEY) return 'baidu';
  if (forced === 'volc' && process.env.VOLC_ACCESSKEY && process.env.VOLC_SECRETKEY) return 'volc';
  if (process.env.DEEPL_AUTH_KEY) return 'deepl';
  if (process.env.BAIDU_APP_ID && process.env.BAIDU_SECRET_KEY) return 'baidu';
  if (process.env.VOLC_ACCESSKEY && process.env.VOLC_SECRETKEY) return 'volc';
  return null;
}

/** 通用翻译入口：根据 provider 调用对应 API */
async function translateText(text, targetLang) {
  const provider = getTranslationProvider();
  if (!provider || !text || typeof text !== 'string') return text;
  if (provider === 'deepl') return translateWithDeepL(text, targetLang);
  if (provider === 'baidu') return translateWithBaidu(text, targetLang);
  if (provider === 'volc') return translateWithVolc(text, targetLang);
  return text;
}

/** DeepL API：中文→目标语言 */
const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
async function translateWithDeepL(text, targetLang) {
  const apiKey = process.env.DEEPL_AUTH_KEY;
  if (!apiKey) return text;
  const target = targetLang === 'en' ? 'EN' : 'DE';
  try {
    const res = await fetch(DEEPL_FREE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ text, source_lang: 'ZH', target_lang: target }).toString(),
    });
    if (!res.ok) throw new Error(`DeepL ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const out = json?.translations?.[0]?.text;
    return (out && out.trim()) || text;
  } catch (err) {
    console.warn('DeepL 翻译失败:', err?.message || err);
    return text;
  }
}

/** 百度翻译 API：中文→目标语言，sign = md5(appid+q+salt+密钥) */
const BAIDU_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
async function translateWithBaidu(text, targetLang) {
  const appId = process.env.BAIDU_APP_ID;
  const secret = process.env.BAIDU_SECRET_KEY;
  if (!appId || !secret) return text;
  const to = targetLang === 'en' ? 'en' : 'de';
  const salt = String(Date.now());
  const sign = crypto.createHash('md5').update(appId + text + salt + secret).digest('hex');
  try {
    const params = new URLSearchParams({ q: text, from: 'zh', to, appid: appId, salt, sign });
    const res = await fetch(BAIDU_URL + '?' + params.toString());
    const json = await res.json();
    if (json.error_code) throw new Error(`百度 ${json.error_code}: ${json.error_msg}`);
    const out = json?.trans_result?.[0]?.dst;
    return (out && out.trim()) || text;
  } catch (err) {
    console.warn('百度翻译失败:', err?.message || err);
    return text;
  }
}

/** 火山引擎翻译 API：SourceLanguage=zh, TargetLanguage=en|de */
async function translateWithVolc(text, targetLang) {
  const ak = process.env.VOLC_ACCESSKEY;
  const sk = process.env.VOLC_SECRETKEY;
  if (!ak || !sk) return text;
  const target = targetLang === 'en' ? 'en' : 'de';
  try {
    let VolcSigner;
    try {
      VolcSigner = require('@volcengine/openapi').Signer;
    } catch (e) {
      console.warn('火山翻译需安装: npm install @volcengine/openapi');
      return text;
    }
    const bodyStr = JSON.stringify({
      SourceLanguage: 'zh',
      TargetLanguage: target,
      TextList: [text],
    });
    const host = 'translate.volcengineapi.com';
    const req = {
      method: 'POST',
      pathname: '/',
      region: 'cn-north-1',
      params: { Action: 'TranslateText', Version: '2020-06-01' },
      headers: { 'Content-Type': 'application/json', Host: host },
      body: bodyStr,
    };
    const signer = new VolcSigner(req, 'translate');
    signer.addAuthorization({ accessKeyId: ak, secretKey: sk, sessionToken: '' });
    const qs = new URLSearchParams(req.params).toString();
    const res = await fetch(`https://${host}/?${qs}`, {
      method: 'POST',
      headers: req.headers,
      body: bodyStr,
    });
    const json = await res.json();
    const err = json?.ResponseMetadata?.Error;
    if (err) throw new Error(`火山 ${err.Code}: ${err.Message}`);
    const out = json?.TranslationList?.[0]?.Translation;
    return (out && out.trim()) || text;
  } catch (err) {
    console.warn('火山翻译失败:', err?.message || err);
    return text;
  }
}

/** 批量翻译一篇 essay 到英文和德文 */
async function translateEssay(essay) {
  const trans = (txt, lang) => translateText(txt, lang);
  const [titleEn, excerptEn, contentEn] = await Promise.all([
    trans(essay.title, 'en'),
    trans(essay.excerpt, 'en'),
    trans(essay.content, 'en'),
  ]);
  const [titleDe, excerptDe, contentDe] = await Promise.all([
    trans(essay.title, 'de'),
    trans(essay.excerpt, 'de'),
    trans(essay.content, 'de'),
  ]);
  return {
    zh: essay,
    en: { ...essay, title: titleEn, excerpt: excerptEn, content: contentEn },
    de: { ...essay, title: titleDe, excerpt: excerptDe, content: contentDe },
  };
}

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('未找到 content/elog-posts 目录。请先执行: npm run sync:notion');
    console.error('若 sync:notion 显示「文档缺失title属性」，请在 Notion 数据库中确保第一列是「标题」类型且每行有内容。');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('content/elog-posts 为空，未更新 essays。请检查 Notion 数据库：');
    console.warn('- 第一列需为「标题」类型');
    console.warn('- 每行需填写标题和正文');
    process.exit(0);
  }
  const essays = [];

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontMatter, body } = parseFrontMatter(raw);

    const title = frontMatter.title || path.basename(file, '.md');
    const date = formatDate(frontMatter.date || frontMatter.updated);
    /* Notion 分类：优先 选择/分类/categories/tags；否则从所有属性中查找类分类值（Notion API 用 UUID 作 key） */
    const knownKeys = ['title', 'date', 'updated', 'description', 'urlname', 'cover'];
    const knownCategories = ['旅行感受', '技术思考', '工作思考', '影评', '书评', '随笔'];
    let categoryRaw =
      frontMatter['选择'] ?? frontMatter['分类'] ?? frontMatter.categories ?? frontMatter.tags;
    if (!categoryRaw) {
      const looksLikeDate = (str) => /^\d{4}-\d{2}-\d{2}/.test(String(str));
      for (const key of Object.keys(frontMatter)) {
        if (knownKeys.includes(key)) continue;
        const v = frontMatter[key];
        const s = Array.isArray(v) ? v[0] : (typeof v === 'string' ? v : '');
        if (s && !looksLikeDate(s) && (knownCategories.includes(s) || (s.length >= 2 && s.length <= 20))) {
          categoryRaw = s;
          break;
        }
      }
    }
    const cat = Array.isArray(categoryRaw) ? (categoryRaw[0] || '随笔') : (typeof categoryRaw === 'string' ? categoryRaw : '随笔') || '随笔';
    const desc = frontMatter.description || '';

    const plainBody = stripMarkdown(body);
    const excerpt = desc || plainBody.slice(0, 120).replace(/\n/g, ' ') + (plainBody.length > 120 ? '...' : '');
    const content = plainBody;

    essays.push({
      id: '', // 稍后按排序后重填
      title,
      excerpt,
      date: date || new Date().toISOString().slice(0, 10),
      category: cat || '随笔',
      content,
    });
  }

  essays.sort((a, b) => (b.date > a.date ? 1 : -1));
  essays.forEach((e, i) => { e.id = String(i + 1); });

  let essaysZh = essays;
  let essaysEn = essays;
  let essaysDe = essays;

  const provider = getTranslationProvider();
  if (provider) {
    const cache = loadCache();
    let hitCount = 0;
    let missCount = 0;
    const names = { deepl: 'DeepL', baidu: '百度', volc: '火山' };
    console.log(`正在使用 ${names[provider]} 增量翻译...`);
    const translated = [];
    for (let i = 0; i < essays.length; i++) {
      const essay = essays[i];
      const hash = contentHash(essay);
      const cached = cache[hash];
      if (cached && cached.en && cached.de) {
        translated.push({
          zh: essay,
          en: { ...essay, title: cached.en.title, excerpt: cached.en.excerpt, content: cached.en.content },
          de: { ...essay, title: cached.de.title, excerpt: cached.de.excerpt, content: cached.de.content },
        });
        hitCount++;
        process.stdout.write(`  [${i + 1}/${essays.length}] ${essay.title} (缓存命中)\n`);
      } else {
        const t = await translateEssay(essay);
        translated.push(t);
        const enOk = t.en.title !== essay.title || t.en.content !== essay.content;
        const deOk = t.de.title !== essay.title || t.de.content !== essay.content;
        if (enOk && deOk) {
          cache[hash] = {
            en: { title: t.en.title, excerpt: t.en.excerpt, content: t.en.content },
            de: { title: t.de.title, excerpt: t.de.excerpt, content: t.de.content },
          };
        }
        missCount++;
        process.stdout.write(`  [${i + 1}/${essays.length}] ${essay.title} (已翻译)\n`);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    saveCache(cache);
    essaysZh = translated.map((t) => t.zh);
    essaysEn = translated.map((t) => t.en);
    essaysDe = translated.map((t) => t.de);
    console.log(`翻译完成。缓存命中 ${hitCount} 篇，新翻译 ${missCount} 篇。`);
  } else {
    console.log('未配置翻译密钥，英文/德文将显示中文内容。请配置 DEEPL_AUTH_KEY / BAIDU_APP_ID+BAIDU_SECRET_KEY / VOLC_ACCESSKEY+VOLC_SECRETKEY 之一。');
    essaysEn = [...essays];
    essaysDe = [...essays];
  }

  const i18nDir = path.join(__dirname, '../src/i18n');
  const zhPath = path.join(i18nDir, 'data.zh.json');
  const enPath = path.join(i18nDir, 'data.en.json');
  const dePath = path.join(i18nDir, 'data.de.json');
  for (const [p, arr] of [[zhPath, essaysZh], [enPath, essaysEn], [dePath, essaysDe]]) {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    data.essays = arr;
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  console.log(`已更新 ${essays.length} 篇随笔到 data.zh.json / data.en.json / data.de.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
