#!/usr/bin/env node
/**
 * 将 Elog 同步的 Markdown 转为 data.zh.json 的 essays 数组
 * 前置：先执行 npx elog sync -e .elog.env
 * 用法：node scripts/notion-to-essays.cjs
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../content/elog-posts');

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
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) frontMatter[m[1]] = m[2]?.replace(/^["']|["']$/g, '').trim();
  });
  return { frontMatter, body: match[2] };
}

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function main() {
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
    const category = frontMatter.categories || frontMatter.tags || '随笔';
    const cat = Array.isArray(category) ? category[0] : category;
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

  const dataPath = path.join(__dirname, '../src/i18n/data.zh.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  data.essays = essays;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`已更新 ${essays.length} 篇随笔到 src/i18n/data.zh.json`);
}

main();
