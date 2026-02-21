#!/usr/bin/env node
/**
 * 从 Notion 时间轴数据库同步到 data.zh.json / data.en.json / data.de.json 的 timeline 数组
 * 使用 Notion API 直连（无需 Elog）
 * 需在 .elog.env 中配置 NOTION_TOKEN、NOTION_DATABASE_TIMELINE_ID
 *
 * Notion 数据库建议列：年份、地点、事件、充实度、关联文章、关联项目、关联照片、书影音
 * 用法：node scripts/notion-to-timeline.cjs
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.elog.env') });
const fs = require('fs');
const { Client } = require('@notionhq/client');

const NOTION_TOKEN = process.env.NOTION_TOKEN?.trim();
/** 从 URL 或纯 ID 中提取 32 位数据库 ID */
function extractDbId(val) {
  const s = (val || '').trim();
  const m = s.match(/([a-f0-9]{32})/i);
  return m ? m[1] : s.replace(/^https?:\/\/[^/]+\/|[\?#].*$/g, '').replace(/-/g, '');
}
const DB_ID = extractDbId(process.env.NOTION_DATABASE_TIMELINE_ID);

/** 从 Notion 属性提取纯文本 */
function getPlainText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') {
    return (prop.title || []).map((t) => t.plain_text).join('');
  }
  if (prop.type === 'rich_text') {
    return (prop.rich_text || []).map((t) => t.plain_text).join('');
  }
  return String(prop[prop.type] || '').trim();
}

/** 从 Notion 属性提取数字 */
function getNumber(prop) {
  if (!prop || prop.type !== 'number') return undefined;
  const n = prop.number;
  return typeof n === 'number' ? Math.round(n) : undefined;
}

/** 从 Notion 属性提取 multi_select 的名称数组（用于关联文章/项目/照片，填 id 如 "1"、"2"）*/
function getMultiSelect(prop) {
  if (!prop) return [];
  if (prop.type === 'multi_select') {
    const arr = prop.multi_select;
    return Array.isArray(arr) ? arr.map((x) => (x && x.name) || '').filter(Boolean) : [];
  }
  if (prop.type === 'relation') {
    return [];
  }
  return [];
}

/**
 * 解析书影音文本，格式示例（每行一个）：
 * book|禅与摩托车维修艺术|2024 春
 * movie|电影名|2024 夏
 */
function parseInfluences(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const result = [];
  for (const line of lines) {
    const parts = line.split('|').map((s) => s.trim());
    if (parts.length >= 2) {
      result.push({
        type: (parts[0] || 'book').toLowerCase(),
        title: parts[1] || '',
        time: parts[2] || '',
      });
    }
  }
  return result;
}

/** 根据 schema 建立列名到属性 ID 的映射（支持中英文列名） */
function buildNameToIdMap(schema) {
  const map = {};
  if (!schema || typeof schema !== 'object') return map;
  const matchRules = [
    { keys: ['年份', 'year'], outKeys: ['year', '年份'] },
    { keys: ['时间轴', 'title', '标题', '名称'], outKeys: ['title', '时间轴', 'label'] },
    { keys: ['总结', '备注', 'summary', 'label'], outKeys: ['summary', '总结', '备注'] },
    { keys: ['地点', 'location'], outKeys: ['location', '地点'] },
    { keys: ['事件', 'event', '描述'], outKeys: ['event', '事件'] },
    { keys: ['充实度', 'fulfillment'], outKeys: ['fulfillment', '充实度'] },
    { keys: ['关联文章', 'essays', '文章'], outKeys: ['essays', '关联文章'] },
    { keys: ['关联项目', 'projects', '项目'], outKeys: ['projects', '关联项目'] },
    { keys: ['关联照片', 'photos', '照片'], outKeys: ['photos', '关联照片'] },
    { keys: ['书影音', 'influences', '影响'], outKeys: ['influences', '书影音'] },
  ];
  for (const [id, prop] of Object.entries(schema)) {
    const name = (prop?.name || '').trim();
    const nameLower = name.toLowerCase();
    map[name] = id;
    map[nameLower] = id;
    for (const { keys, outKeys } of matchRules) {
      if (keys.some((k) => name.includes(k) || nameLower === k.toLowerCase())) {
        for (const k of outKeys) map[k] = id;
      }
    }
  }
  return map;
}

/** 从页面提取一条 timeline 记录 */
function pageToTimelineItem(page, nameToId) {
  const props = page.properties || {};
  const get = (keys) => {
    for (const k of keys) {
      const id = nameToId[k];
      if (id && props[id]) return props[id];
    }
    return null;
  };
  let yearRaw = getPlainText(get(['year', '年份']));
  const yearNum = getNumber(get(['year', '年份']));
  if (!yearRaw && yearNum !== undefined) yearRaw = String(yearNum);
  yearRaw = (yearRaw || '').replace(/,/g, '').trim();
  const year = yearRaw ? String(yearRaw === '未来' ? '未来' : (Math.floor(Number(yearRaw)) || yearRaw)) : '';
  const location = getPlainText(get(['location', '地点']));
  const event = getPlainText(get(['event', '事件']));
  const labelOrSummary = getPlainText(get(['summary', '总结', '备注'])) || getPlainText(get(['title', '时间轴', 'label']));
  const fulfillment = getNumber(get(['fulfillment', '充实度'])) ?? 50;
  const essays = getMultiSelect(get(['essays', '关联文章']));
  const projects = getMultiSelect(get(['projects', '关联项目']));
  const photos = getMultiSelect(get(['photos', '关联照片']));
  const influencesText = getPlainText(get(['influences', '书影音', '影响']));
  const influences = parseInfluences(influencesText);

  const displayEvent = labelOrSummary || event || '岁月的留白';
  return {
    year: year || '未知',
    location: location || '未知',
    event: displayEvent,
    fulfillment,
    portfolio: { photos, essays, projects },
    influences,
  };
}

async function main() {
  if (!NOTION_TOKEN || !DB_ID) {
    console.warn('未配置 NOTION_DATABASE_TIMELINE_ID，跳过时间轴同步。');
    console.warn('在 .elog.env 中添加：NOTION_DATABASE_TIMELINE_ID=你的时间轴数据库ID');
    process.exit(0);
  }

  const notion = new Client({ auth: NOTION_TOKEN });
  let hasResults = false;
  const timeline = [];

  try {
    const db = await notion.databases.retrieve({ database_id: DB_ID });
    const dataSourceId = (db.data_sources && db.data_sources[0] && db.data_sources[0].id) || DB_ID;
    let schemaSource = db.properties || (db.data_sources && db.data_sources[0] && (db.data_sources[0].schema || db.data_sources[0].properties));
    if (!schemaSource || Object.keys(schemaSource).length === 0) {
      const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
      schemaSource = ds.properties || ds.schema || {};
    }
    const nameToId = buildNameToIdMap(schemaSource);
    let hasMore = true;
    let cursor = undefined;
    while (hasMore) {
      const resp = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
      });
      const results = resp.results || resp.data || [];
      for (const page of results) {
        const item = pageToTimelineItem(page, nameToId);
        if (item.year && item.year !== '未知') {
          timeline.push(item);
          hasResults = true;
        } else if (item.event !== '岁月的留白' || item.location !== '未知') {
          const fallbackYear = item.year || new Date().getFullYear().toString();
          timeline.push({ ...item, year: fallbackYear });
          hasResults = true;
        }
      }
      hasMore = !!(resp.has_more || resp.hasMore);
      cursor = resp.next_cursor || resp.nextCursor;
    }
  } catch (err) {
    if (err.code === 'object_not_found') {
      console.error('未找到时间轴数据库，请确认 NOTION_DATABASE_TIMELINE_ID 正确，且已连接 Integration');
    } else {
      console.error('Notion API 错误:', err.message);
    }
    process.exit(1);
  }

  timeline.sort((a, b) => {
    const ya = a.year === '未来' ? 9999 : parseInt(a.year, 10) || 0;
    const yb = b.year === '未来' ? 9999 : parseInt(b.year, 10) || 0;
    return ya - yb;
  });

  if (!hasResults) {
    console.warn('时间轴数据库为空或无可解析条目，未更新 timeline。');
    process.exit(0);
  }

  const i18nDir = path.join(__dirname, '../src/i18n');
  for (const lang of ['zh', 'en', 'de']) {
    const dataPath = path.join(i18nDir, `data.${lang}.json`);
    if (!fs.existsSync(dataPath)) continue;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    data.timeline = timeline;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  console.log(`已更新 ${timeline.length} 条时间轴到 data.zh.json / data.en.json / data.de.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
