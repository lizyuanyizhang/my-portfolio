#!/usr/bin/env node
/**
 * 将 Elog 同步的应用 Markdown 转为 data.zh.json / data.en.json / data.de.json 的 projects 数组
 * 支持翻译：DeepL、百度、火山（与随笔/影像共用）
 * Notion 临时图片链接会下载到 public/images/elog/
 * 前置：npm run sync:notion:projects
 * 用法：node scripts/notion-to-projects.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.elog.env') });
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const POSTS_DIR = path.join(__dirname, '../content/elog-projects');
const IMG_OUT_DIR = path.join(__dirname, '../public/images/elog');
const CACHE_PATH = path.join(__dirname, '.project-translation-cache.json');

/** 标签多语言映射：zh → { en, de } */
const TAG_MAP = {
  新春贺卡: { en: 'New Year', de: 'Neujahr' },
  AI: { en: 'AI', de: 'KI' },
  React: { en: 'React', de: 'React' },
  Vite: { en: 'Vite', de: 'Vite' },
  Cursor: { en: 'Cursor', de: 'Cursor' },
};

function isNotionTempUrl(url) {
  return (
    typeof url === 'string' &&
    (url.includes('prod-files-secure.s3.us-west-2.amazonaws.com') ||
      url.includes('X-Amz-Expires'))
  );
}

function downloadToLocal(url, fileName) {
  if (!fs.existsSync(IMG_OUT_DIR)) {
    fs.mkdirSync(IMG_OUT_DIR, { recursive: true });
  }
  let ext = '.png';
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.(png|jpg|jpeg|gif|webp)(?:\?|$)/i);
    if (m) ext = '.' + m[1].toLowerCase();
  } catch (_) {}
  const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) + ext;
  const outPath = path.join(IMG_OUT_DIR, safeName);
  if (fs.existsSync(outPath)) {
    return '/images/elog/' + safeName;
  }
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { followRedirect: true }, (res) => {
      const code = res.statusCode;
      if (code >= 300 && code < 400 && res.headers.location) {
        downloadToLocal(res.headers.location, fileName).then(resolve).catch(reject);
        return;
      }
      if (code !== 200) {
        reject(new Error(`HTTP ${code}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          fs.writeFileSync(outPath, Buffer.concat(chunks));
          resolve('/images/elog/' + safeName);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function contentHash(proj) {
  const str = [proj.title, proj.description].join('\0');
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
          val = val.includes('[')
            ? JSON.parse(val)
            : val.split(',').map((s) => s.trim()).filter(Boolean);
        } catch (_) {}
      }
      frontMatter[key] = val;
    }
  });
  return { frontMatter, body: match[2] };
}

function extractFirstImageUrl(body) {
  const m = body.match(/!\[.*?\]\((https?:\/\/[^)]+|\/[^)]+)\)/);
  return m ? m[1] : null;
}

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** 解析标签/技术栈：支持 Multi-select 数组、逗号、顿号、中点分隔 */
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((s) => s && typeof s === 'string');
  const s = String(raw).trim();
  if (!s) return [];
  /* 支持多种分隔符：逗号、顿号、中点（Cursor · React · Vite） */
  const parts = s.split(/[,、·]/).map((t) => t.trim()).filter(Boolean);
  return parts.length ? parts : [s];
}

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

async function translateProject(proj) {
  const [titleEn, descEn] = await Promise.all([
    translateText(proj.title, 'en'),
    translateText(proj.description || '', 'en'),
  ]);
  const [titleDe, descDe] = await Promise.all([
    translateText(proj.title, 'de'),
    translateText(proj.description || '', 'de'),
  ]);
  return {
    zh: proj,
    en: {
      ...proj,
      title: titleEn,
      description: descEn,
      tags: mapTagsToLang(proj.tags || [], 'en'),
      builtWith: mapTagsToLang(proj.builtWith || [], 'en'),
    },
    de: {
      ...proj,
      title: titleDe,
      description: descDe,
      tags: mapTagsToLang(proj.tags || [], 'de'),
      builtWith: mapTagsToLang(proj.builtWith || [], 'de'),
    },
  };
}

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('未找到 content/elog-projects 目录。请先执行: npm run sync:notion:projects');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('content/elog-projects 为空，未更新 projects。');
    process.exit(0);
  }

  const projects = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontMatter, body } = parseFrontMatter(raw);

    const title =
      frontMatter['标题'] ||
      frontMatter.title ||
      path.basename(file, '.md') ||
      '未命名';
    const description =
      frontMatter['描述'] || frontMatter.description || frontMatter.介绍 || '';

    let image =
      frontMatter['封面'] ||
      frontMatter['文件和媒体'] ||
      frontMatter['图片'] ||
      frontMatter.image ||
      frontMatter.cover ||
      extractFirstImageUrl(body);
    if (!image && typeof frontMatter.files === 'string') image = frontMatter.files;
    if (!image) {
      const imgVal = Object.values(frontMatter).find(
        (v) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('/images/'))
      );
      if (imgVal) image = imgVal;
    }

    if (image && image.startsWith('/') && !image.startsWith('/images/')) {
      image = '/images/elog' + image;
    }

    if (image && isNotionTempUrl(image)) {
      const docId = (frontMatter.urlname || frontMatter.id || file).replace(
        /[^a-zA-Z0-9-]/g,
        ''
      );
      const baseName = `project-${docId || i + 1}`;
      try {
        image = await downloadToLocal(image, baseName);
        console.log(`已下载封面: ${title || file}`);
      } catch (e) {
        const hint =
          e.message === 'HTTP 403'
            ? '（链接已过期，请先执行 npm run sync:notion:projects 获取新链接）'
            : '';
        console.warn(`下载封面失败 ${file}，跳过:`, e.message, hint);
        continue;
      }
    }
    if (image && isNotionTempUrl(image)) {
      console.warn(`跳过 ${file}：禁止将 Notion 临时链接写入 data（避免 Secret 泄露）`);
      continue;
    }

    const link =
      frontMatter['链接'] ||
      frontMatter.link ||
      frontMatter.url ||
      frontMatter.项目地址 ||
      '';
    const tagsRaw =
      frontMatter['标签'] || frontMatter.tags || frontMatter.tag || '';
    const builtWithRaw =
      frontMatter['技术栈'] ||
      frontMatter.builtWith ||
      frontMatter.tools ||
      '';

    projects.push({
      id: '',
      title,
      description: description || undefined,
      image: image || undefined,
      link: link ? String(link).trim() : undefined,
      date: formatDate(
        frontMatter['日期'] ||
          frontMatter['创建日期'] ||
          frontMatter.date ||
          frontMatter.updated ||
          frontMatter.created_time
      ),
      tags: parseTags(tagsRaw).length ? parseTags(tagsRaw) : undefined,
      builtWith: parseTags(builtWithRaw).length ? parseTags(builtWithRaw) : undefined,
    });
  }

  projects.sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
  projects.forEach((p, idx) => {
    p.id = String(idx + 1);
  });

  let projectsZh = projects;
  let projectsEn = projects;
  let projectsDe = projects;

  const provider = getTranslationProvider();
  if (provider) {
    const cache = loadCache();
    let hitCount = 0;
    let missCount = 0;
    const names = { deepl: 'DeepL', baidu: '百度', volc: '火山' };
    console.log(`正在使用 ${names[provider]} 增量翻译应用...`);
    const translated = [];
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      const hash = contentHash(proj);
      const cached = cache[hash];
      if (cached && cached.en && cached.de) {
        translated.push({
          zh: proj,
          en: {
            ...proj,
            title: cached.en.title,
            description: cached.en.description,
            tags: mapTagsToLang(proj.tags || [], 'en'),
            builtWith: mapTagsToLang(proj.builtWith || [], 'en'),
          },
          de: {
            ...proj,
            title: cached.de.title,
            description: cached.de.description,
            tags: mapTagsToLang(proj.tags || [], 'de'),
            builtWith: mapTagsToLang(proj.builtWith || [], 'de'),
          },
        });
        hitCount++;
        process.stdout.write(`  [${i + 1}/${projects.length}] ${proj.title} (缓存命中)\n`);
      } else {
        const t = await translateProject(proj);
        translated.push(t);
        if (
          (t.en.title !== proj.title || t.en.description !== proj.description) &&
          (t.de.title !== proj.title || t.de.description !== proj.description)
        ) {
          cache[hash] = {
            en: { title: t.en.title, description: t.en.description },
            de: { title: t.de.title, description: t.de.description },
          };
        }
        missCount++;
        process.stdout.write(`  [${i + 1}/${projects.length}] ${proj.title} (已翻译)\n`);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    saveCache(cache);
    projectsZh = translated.map((t) => t.zh);
    projectsEn = translated.map((t) => t.en);
    projectsDe = translated.map((t) => t.de);
    console.log(`翻译完成。缓存命中 ${hitCount} 个，新翻译 ${missCount} 个。`);
  } else {
    console.log('未配置翻译密钥，英文/德文将显示中文内容。');
    projectsEn = projects.map((p) => ({
      ...p,
      tags: mapTagsToLang(p.tags || [], 'en'),
      builtWith: mapTagsToLang(p.builtWith || [], 'en'),
    }));
    projectsDe = projects.map((p) => ({
      ...p,
      tags: mapTagsToLang(p.tags || [], 'de'),
      builtWith: mapTagsToLang(p.builtWith || [], 'de'),
    }));
  }

  const i18nDir = path.join(__dirname, '../src/i18n');
  for (const [filename, arr] of [
    ['data.zh.json', projectsZh],
    ['data.en.json', projectsEn],
    ['data.de.json', projectsDe],
  ]) {
    const p = path.join(i18nDir, filename);
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    data.projects = arr;
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  console.log(
    `已更新 ${projects.length} 个应用到 data.zh.json / data.en.json / data.de.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
