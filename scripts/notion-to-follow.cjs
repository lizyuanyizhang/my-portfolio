#!/usr/bin/env node
/**
 * 将 Elog 同步的「我的关注」Markdown 转为 data.zh.json 的 followLinks 数组
 * 用于展示正在看的、在学习的别人的网页或内容
 * 前置：npm run sync:notion:follow
 * 用法：node scripts/notion-to-follow.cjs
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../content/elog-follow');

/** 类型多语言映射：zh → { en, de } */
const TYPE_MAP = {
  博客: { en: 'Blog', de: 'Blog' },
  Newsletter: { en: 'Newsletter', de: 'Newsletter' },
  播客: { en: 'Podcast', de: 'Podcast' },
  视频: { en: 'Video', de: 'Video' },
  课程: { en: 'Course', de: 'Kurs' },
  推特: { en: 'Twitter/X', de: 'Twitter/X' },
  其他: { en: 'Other', de: 'Sonstige' },
};

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontMatter: {}, body: content };
  const frontMatter = {};
  match[1].split('\n').forEach((line) => {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      let val = m[2]?.replace(/^["']|["']$/g, '').trim();
      frontMatter[key] = val;
    }
  });
  return { frontMatter, body: match[2] };
}

function mapTypeToLang(typeZh, targetLang) {
  return (TYPE_MAP[typeZh] && TYPE_MAP[typeZh][targetLang]) || typeZh;
}

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('未找到 content/elog-follow 目录。请先执行: npm run sync:notion:follow');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('content/elog-follow 为空，未更新 followLinks。');
    process.exit(0);
  }

  const links = [];

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontMatter } = parseFrontMatter(raw);

    const name =
      frontMatter['内容/网站名称'] ||
      frontMatter['名称'] ||
      frontMatter.title ||
      path.basename(file, '.md') ||
      '未命名';
    const url =
      frontMatter['链接地址'] ||
      frontMatter['链接'] ||
      frontMatter.link ||
      frontMatter.url ||
      frontMatter.URL ||
      '';

    if (!url || typeof url !== 'string') {
      console.warn(`跳过 ${file}：缺少链接（需在「链接地址」列填写完整 URL，如 https://x.com/JeffDean）`);
      continue;
    }

    let typeRaw = frontMatter['内容类型'] || frontMatter['类型'] || frontMatter.type || '其他';
    if (Array.isArray(typeRaw)) typeRaw = typeRaw[0] || '其他';
    const typeZh = String(typeRaw).trim() || '其他';

    links.push({
      id: '',
      name,
      url: url.trim(),
      type: typeZh,
      description:
        frontMatter['简短说明'] || frontMatter['描述'] || frontMatter.description || undefined,
      icon: frontMatter['图标'] || frontMatter.icon || undefined,
    });
  }

  links.forEach((l, i) => {
    l.id = String(i + 1);
  });

  const i18nDir = path.join(__dirname, '../src/i18n');
  const zhPath = path.join(i18nDir, 'data.zh.json');
  const enPath = path.join(i18nDir, 'data.en.json');
  const dePath = path.join(i18nDir, 'data.de.json');

  for (const [filename, fn] of [
    ['data.zh.json', (l) => l],
    ['data.en.json', (l) => ({ ...l, type: mapTypeToLang(l.type, 'en') })],
    ['data.de.json', (l) => ({ ...l, type: mapTypeToLang(l.type, 'de') })],
  ]) {
    const p = path.join(i18nDir, filename);
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    data.followLinks = links.map(fn);
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }

  console.log(`已更新 ${links.length} 个关注链接到 data.zh.json / data.en.json / data.de.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
