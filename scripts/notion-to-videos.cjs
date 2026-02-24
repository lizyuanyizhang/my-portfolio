#!/usr/bin/env node
/**
 * 将 Elog 同步的影像 Markdown 转为 data.zh.json / data.en.json / data.de.json 的 videos 数组
 * 支持翻译：DeepL、百度、火山（与随笔共用）
 * 标签映射：学习→Learning→Lernen, vlog→vlog→vlog, AI视频→AI Video→KI-Video
 * 前置：npm run sync:notion:videos
 * 用法：node scripts/notion-to-videos.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.elog.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSTS_DIR = path.join(__dirname, '../content/elog-videos');
const CACHE_PATH = path.join(__dirname, '.video-translation-cache.json');

/** 标签多语言映射：zh → { en, de } */
const TAG_MAP = {
  学习: { en: 'Learning', de: 'Lernen' },
  vlog: { en: 'vlog', de: 'vlog' },
  AI视频: { en: 'AI Video', de: 'KI-Video' },
};

/** 根据中文内容生成哈希，用于判断是否需重新翻译 */
function contentHash(video) {
  const str = [video.title, video.description].join('\0');
  return crypto.createHash('md5').update(str).digest('hex');
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf-8');
}

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontMatter: {}, body: content };
  const frontMatter = {};
  match[1].split('\n').forEach((line) => {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      let val = m[2]?.replace(/^["']|["']$/g, '').trim();
      if (val && (val.startsWith('[') || val.includes(','))) {
        try {
          val = val.includes('[') ? JSON.parse(val) : val.split(',').map((s) => s.trim()).filter(Boolean);
        } catch (_) {}
      }
      frontMatter[key] = val;
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

/** 解析标签：支持 "学习, vlog" 或 ["学习","vlog"]，返回 zh 数组 */
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((s) => s && typeof s === 'string');
  const s = String(raw);
  if (s.includes(',')) return s.split(',').map((t) => t.trim()).filter(Boolean);
  return s ? [s] : [];
}

/** 将 zh 标签映射到目标语言 */
function mapTagsToLang(tagsZh, targetLang) {
  return tagsZh.map((t) => (TAG_MAP[t] && TAG_MAP[t][targetLang]) || t);
}

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

async function translateText(text, targetLang) {
  const provider = getTranslationProvider();
  if (!provider || !text || typeof text !== 'string') return text;
  if (provider === 'deepl') return translateWithDeepL(text, targetLang);
  if (provider === 'baidu') return translateWithBaidu(text, targetLang);
  if (provider === 'volc') return translateWithVolc(text, targetLang);
  return text;
}

const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
async function translateWithDeepL(text, targetLang) {
  const apiKey = process.env.DEEPL_AUTH_KEY;
  if (!apiKey) return text;
  const target = targetLang === 'en' ? 'EN' : 'DE';
  try {
    const res = await fetch(DEEPL_FREE_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ text, source_lang: 'ZH', target_lang: target }).toString(),
    });
    if (!res.ok) throw new Error(`DeepL ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return (json?.translations?.[0]?.text?.trim()) || text;
  } catch (err) {
    console.warn('DeepL 翻译失败:', err?.message || err);
    return text;
  }
}

const BAIDU_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
async function translateWithBaidu(text, targetLang) {
  const appId = (process.env.BAIDU_APP_ID || '').trim();
  const secret = (process.env.BAIDU_SECRET_KEY || '').trim();
  if (!appId || !secret) return text;
  const to = targetLang === 'en' ? 'en' : 'de';
  const salt = String(Date.now());
  const sign = crypto.createHash('md5').update(appId + text + salt + secret).digest('hex');
  try {
    const params = new URLSearchParams({ q: text, from: 'zh', to, appid: appId, salt, sign });
    const res = await fetch(BAIDU_URL + '?' + params.toString());
    const json = await res.json();
    if (json.error_code) throw new Error(`百度 ${json.error_code}: ${json.error_msg}`);
    return (json?.trans_result?.[0]?.dst?.trim()) || text;
  } catch (err) {
    console.warn('百度翻译失败:', err?.message || err);
    return text;
  }
}

async function translateWithVolc(text, targetLang) {
  const ak = process.env.VOLC_ACCESSKEY;
  const sk = process.env.VOLC_SECRETKEY;
  if (!ak || !sk) return text;
  const target = targetLang === 'en' ? 'en' : 'de';
  try {
    const VolcSigner = require('@volcengine/openapi').Signer;
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
    if (json?.ResponseMetadata?.Error) throw new Error(json.ResponseMetadata.Error.Message);
    return (json?.TranslationList?.[0]?.Translation?.trim()) || text;
  } catch (err) {
    console.warn('火山翻译失败:', err?.message || err);
    return text;
  }
}

async function translateVideo(video) {
  const [titleEn, descEn] = await Promise.all([
    translateText(video.title, 'en'),
    translateText(video.description || '', 'en'),
  ]);
  const [titleDe, descDe] = await Promise.all([
    translateText(video.title, 'de'),
    translateText(video.description || '', 'de'),
  ]);
  return {
    zh: video,
    en: {
      ...video,
      title: titleEn,
      description: descEn,
      tags: mapTagsToLang(video.tags || [], 'en'),
    },
    de: {
      ...video,
      title: titleDe,
      description: descDe,
      tags: mapTagsToLang(video.tags || [], 'de'),
    },
  };
}

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('未找到 content/elog-videos 目录。请先执行: npm run sync:notion:videos');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('content/elog-videos 为空，未更新 videos。');
    process.exit(0);
  }

  const videos = [];

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontMatter } = parseFrontMatter(raw);

    const title =
      frontMatter['标题'] ||
      frontMatter.title ||
      path.basename(file, '.md') ||
      '未命名';
    const videoUrl =
      frontMatter['视频链接'] ||
      frontMatter.videoUrl ||
      frontMatter.URL ||
      frontMatter.url ||
      '';

    if (!videoUrl || typeof videoUrl !== 'string') {
      console.warn(`跳过 ${file}：缺少视频链接（需在 Notion 的「视频链接」列填写 YouTube/B 站 URL）`);
      continue;
    }

    const tagsRaw =
      frontMatter['标签'] ||
      frontMatter.tags ||
      frontMatter.tag ||
      '';
    const tagsZh = parseTags(tagsRaw);

    videos.push({
      id: '',
      title,
      description: frontMatter['描述'] || frontMatter.description || '',
      cover: frontMatter['封面'] || frontMatter.cover || undefined,
      videoUrl: videoUrl.trim(),
      duration: frontMatter['时长'] || frontMatter.duration || undefined,
      tags: tagsZh.length ? tagsZh : undefined,
      date: formatDate(frontMatter['日期'] || frontMatter.date || frontMatter.updated),
    });
  }

  videos.sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
  videos.forEach((v, i) => {
    v.id = String(i + 1);
  });

  let videosZh = videos;
  let videosEn = videos;
  let videosDe = videos;

  const provider = getTranslationProvider();
  if (provider) {
    const cache = loadCache();
    let hitCount = 0;
    let missCount = 0;
    const names = { deepl: 'DeepL', baidu: '百度', volc: '火山' };
    console.log(`正在使用 ${names[provider]} 增量翻译影像...`);
    const translated = [];
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const hash = contentHash(video);
      const cached = cache[hash];
      if (cached && cached.en && cached.de) {
        translated.push({
          zh: video,
          en: {
            ...video,
            title: cached.en.title,
            description: cached.en.description,
            tags: mapTagsToLang(video.tags || [], 'en'),
          },
          de: {
            ...video,
            title: cached.de.title,
            description: cached.de.description,
            tags: mapTagsToLang(video.tags || [], 'de'),
          },
        });
        hitCount++;
        process.stdout.write(`  [${i + 1}/${videos.length}] ${video.title} (缓存命中)\n`);
      } else {
        const t = await translateVideo(video);
        translated.push(t);
        if (
          (t.en.title !== video.title || t.en.description !== video.description) &&
          (t.de.title !== video.title || t.de.description !== video.description)
        ) {
          cache[hash] = {
            en: { title: t.en.title, description: t.en.description },
            de: { title: t.de.title, description: t.de.description },
          };
        }
        missCount++;
        process.stdout.write(`  [${i + 1}/${videos.length}] ${video.title} (已翻译)\n`);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    saveCache(cache);
    videosZh = translated.map((t) => t.zh);
    videosEn = translated.map((t) => t.en);
    videosDe = translated.map((t) => t.de);
    console.log(`翻译完成。缓存命中 ${hitCount} 个，新翻译 ${missCount} 个。`);
  } else {
    console.log('未配置翻译密钥，英文/德文将显示中文内容。');
    videosEn = videos.map((v) => ({
      ...v,
      tags: mapTagsToLang(v.tags || [], 'en'),
    }));
    videosDe = videos.map((v) => ({
      ...v,
      tags: mapTagsToLang(v.tags || [], 'de'),
    }));
  }

  const i18nDir = path.join(__dirname, '../src/i18n');
  for (const [filename, arr] of [
    ['data.zh.json', videosZh],
    ['data.en.json', videosEn],
    ['data.de.json', videosDe],
  ]) {
    const p = path.join(i18nDir, filename);
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    data.videos = arr;
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  console.log(`已更新 ${videos.length} 个影像到 data.zh.json / data.en.json / data.de.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
