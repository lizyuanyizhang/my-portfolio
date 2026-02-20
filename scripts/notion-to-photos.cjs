#!/usr/bin/env node
/**
 * 将 Elog 同步的摄影 Markdown 转为 data.zh.json 的 photos 数组
 * 前置：npm run sync:notion:photos
 * 用法：node scripts/notion-to-photos.cjs
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../content/elog-photos');

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

function main() {
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

  for (const file of files) {
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

main();
