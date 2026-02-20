#!/usr/bin/env node
/**
 * 将 Elog 同步的摄影 Markdown 转为 data.zh.json 的 photos 数组
 * 前置：npm run sync:notion:photos
 * 用法：node scripts/notion-to-photos.cjs
 *
 * Notion 图片使用 S3 临时链接（约 1 小时过期），本脚本会将图片下载到
 * public/images/elog/ 并写入本地路径，保证长期可用。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const POSTS_DIR = path.join(__dirname, '../content/elog-photos');
const IMG_OUT_DIR = path.join(__dirname, '../public/images/elog');

/** 是否 Notion S3 临时链接（需下载到本地） */
function isNotionTempUrl(url) {
  return (
    typeof url === 'string' &&
    (url.includes('prod-files-secure.s3.us-west-2.amazonaws.com') ||
      url.includes('X-Amz-Expires'))
  );
}

/** 下载图片到 public/images/elog，返回本地路径 /images/elog/xxx */
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

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontMatter: {}, body: content };
  const frontMatter = {};
  match[1].split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim().replace(/^["']|["']$/g, '');
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    frontMatter[key] = val;
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

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('未找到 content/elog-photos 目录。请先执行: npm run sync:notion:photos');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('content/elog-photos 为空，未更新 photos。');
    process.exit(0);
  }

  const photos = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontMatter, body } = parseFrontMatter(raw);

    const caption =
      frontMatter.介绍 ||
      frontMatter.title ||
      frontMatter.description ||
      frontMatter.描述 ||
      path.basename(file, '.md') ||
      '未命名';
    const date = formatDate(
      frontMatter.日期 || frontMatter.date || frontMatter.updated
    );
    const location =
      frontMatter.拍摄地点 || frontMatter.地点 || frontMatter.location || '';

    let url =
      frontMatter.文件和媒体 ||
      frontMatter.图片 ||
      frontMatter.image ||
      frontMatter.cover ||
      frontMatter.files ||
      extractFirstImageUrl(body);

    if (!url) {
      const imgVal = Object.values(frontMatter).find(
        (v) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('/images/'))
      );
      if (imgVal) url = imgVal;
    }

    if (!url) {
      console.warn(`跳过 ${file}：缺少图片（需在 Notion 的「图片」列上传或页面内插入图片）`);
      continue;
    }

    if (url.startsWith('/') && !url.startsWith('/images/')) {
      url = '/images/elog' + url;
    } else if (isNotionTempUrl(url)) {
      /* 用 Notion 文档 ID 作文件名，保证同一张图每次同步用同一文件，不重复下载 */
      const docId = (frontMatter.urlname || frontMatter.id || file).replace(/[^a-zA-Z0-9-]/g, '');
      const baseName = `photo-${docId || i + 1}`;
      try {
        url = await downloadToLocal(url, baseName);
        console.log(`已下载图片: ${caption || file}`);
      } catch (e) {
        const hint = e.message === 'HTTP 403' ? '（链接已过期，请先执行 npm run sync:notion:photos 获取新链接）' : '';
        console.warn(`下载图片失败 ${file}，跳过:`, e.message, hint);
        continue;
      }
    }

    photos.push({
      id: '',
      url,
      caption,
      location: location || undefined,
      date: date || undefined,
    });
  }

  photos.sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
  photos.forEach((p, i) => {
    p.id = String(i + 1);
  });

  const dataPath = path.join(__dirname, '../src/i18n/data.zh.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  data.photos = photos;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`已更新 ${photos.length} 张照片到 src/i18n/data.zh.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
