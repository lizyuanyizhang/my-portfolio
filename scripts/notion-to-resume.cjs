#!/usr/bin/env node
/**
 * 从 Notion 简历数据库同步到 data.zh.json / data.en.json / data.de.json 的 resume 对象
 * 使用 Notion API 直连（无需 Elog）
 * 需在 .elog.env 中配置 NOTION_TOKEN、NOTION_DATABASE_RESUME_ID
 *
 * Notion 数据库建议列：
 * - 类型 (Select): 总结 | 工作经历 | 教育背景 | 技能-开发 | 技能-设计 | 技能-语言
 * - 内容 (rich_text)：总结时使用
 * - 职位/学位 (title)：工作经历用职位，教育用学位
 * - 公司 (rich_text)
 * - 学校 (rich_text)
 * - 时间段 (rich_text)
 * - 工作内容 (rich_text)：多行，每行一条 detail
 * - 技能项 (rich_text)：技能时使用，一行一个技能
 *
 * 用法：node scripts/notion-to-resume.cjs
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
const DB_ID = extractDbId(process.env.NOTION_DATABASE_RESUME_ID);

/** 从 Notion 属性提取纯文本 */
function getPlainText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') {
    return (prop.title || []).map((t) => t.plain_text).join('');
  }
  if (prop.type === 'rich_text') {
    return (prop.rich_text || []).map((t) => t.plain_text).join('');
  }
  /** Date 类型返回 { start, end }，直接 stringify 会变成 [object Object]，需格式化 */
  if (prop.type === 'date') {
    const d = prop.date;
    if (!d) return '';
    const start = d.start ? String(d.start).slice(0, 10) : '';
    const end = d.end ? String(d.end).slice(0, 10) : '';
    if (start && end && start !== end) return `${start} → ${end}`;
    return start || end || '';
  }
  const val = prop[prop.type];
  if (val && typeof val === 'object') return '';
  return String(val || '').trim();
}

/** 从 Notion Select 提取名称 */
function getSelectName(prop) {
  if (!prop || prop.type !== 'select') return '';
  const sel = prop.select;
  return (sel && sel.name) ? sel.name.trim() : '';
}

/**
 * 根据 schema 建立列名到属性 ID 的映射
 */
function buildNameToIdMap(schema) {
  const map = {};
  if (!schema || typeof schema !== 'object') return map;
  const matchRules = [
    { keys: ['类型', 'type', 'section'], outKeys: ['type', '类型'] },
    { keys: ['内容', 'content', 'summary', '总结'], outKeys: ['content', '内容'] },
    { keys: ['职位', 'role', 'title', '标题', 'name', '名称'], outKeys: ['role', '职位'] },
    { keys: ['公司', 'company'], outKeys: ['company', '公司'] },
    { keys: ['学校', 'school'], outKeys: ['school', '学校'] },
    { keys: ['学位', 'degree'], outKeys: ['degree', '学位'] },
    { keys: ['专业', 'major'], outKeys: ['major', '专业'] },
    { keys: ['时间段', 'period', '时间', '在职时间'], outKeys: ['period', '时间段'] },
    { keys: ['工作内容', 'details', '内容'], outKeys: ['details', '工作内容'] },
    { keys: ['技能项', 'skill', '技能'], outKeys: ['skill', '技能项'] },
    { keys: ['分类', 'category', '技能分类'], outKeys: ['category', '分类'] },
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

/** 从页面提取一条简历相关数据 */
function pageToResumeItem(page, nameToId) {
  const props = page.properties || {};
  const get = (keys) => {
    for (const k of keys) {
      const id = nameToId[k];
      if (id && props[id]) return props[id];
    }
    return null;
  };

  const typeRaw = getSelectName(get(['type', '类型']));
  const typeLower = typeRaw.toLowerCase();
  let type = 'other';
  if (typeLower.includes('总结') || typeLower === 'summary') type = 'summary';
  else if (typeLower.includes('经历') || typeLower.includes('经验') || typeLower === 'experience') type = 'experience';
  else if (typeLower.includes('教育') || typeLower === 'education') type = 'education';
  else if (typeLower.includes('技能') && (typeLower.includes('开发') || typeLower.includes('development'))) type = 'skill_dev';
  else if (typeLower.includes('技能') && (typeLower.includes('设计') || typeLower.includes('design'))) type = 'skill_design';
  else if (typeLower.includes('技能') && (typeLower.includes('语言') || typeLower.includes('language'))) type = 'skill_lang';

  const content = getPlainText(get(['content', '内容']));
  const roleText = getPlainText(get(['role', '职位']) || get(['title', '标题', 'name', '名称']));
  const degreeText = getPlainText(get(['degree', '学位']));
  const roleOrDegree = roleText || degreeText;
  const company = getPlainText(get(['company', '公司']));
  const school = getPlainText(get(['school', '学校']));
  const major = getPlainText(get(['major', '专业']));
  const period = getPlainText(get(['period', '时间段']));
  const detailsText = getPlainText(get(['details', '工作内容']));
  const skill = getPlainText(get(['skill', '技能项']));

  const details = detailsText
    ? detailsText.split(/\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  const categoryRaw = getSelectName(get(['category', '分类', '技能分类']));
  const catLower = categoryRaw.toLowerCase();

  if (type === 'other' && (typeLower.includes('技能') || catLower)) {
    if (catLower.includes('开发') || catLower === 'development') type = 'skill_dev';
    else if (catLower.includes('设计') || catLower === 'design') type = 'skill_design';
    else if (catLower.includes('语言') || catLower === 'language' || catLower === 'languages') type = 'skill_lang';
  }

  return { type, content, roleOrDegree, degreeText, roleText, company, school, period, details, skill };
}

async function main() {
  if (!NOTION_TOKEN || !DB_ID) {
    console.warn('未配置 NOTION_DATABASE_RESUME_ID，跳过简历同步。');
    console.warn('在 .elog.env 中添加：NOTION_DATABASE_RESUME_ID=你的简历数据库ID');
    process.exit(0);
  }

  const notion = new Client({ auth: NOTION_TOKEN });
  const resume = {
    summary: '',
    experience: [],
    education: [],
    skills: { development: [], design: [], languages: [] },
  };
  let hasResults = false;

  try {
    const db = await notion.databases.retrieve({ database_id: DB_ID });
    const dataSourceId = (db.data_sources && db.data_sources[0] && db.data_sources[0].id) || DB_ID;
    let schemaSource = db.properties || (db.data_sources?.[0]?.schema || db.data_sources?.[0]?.properties);
    if (!schemaSource || Object.keys(schemaSource).length === 0) {
      const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
      schemaSource = ds.properties || ds.schema || {};
    }
    const nameToId = buildNameToIdMap(schemaSource);

    let hasMore = true;
    let cursor = undefined;
    const allItems = [];

    while (hasMore) {
      const resp = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
      });
      const results = resp.results || resp.data || [];
      for (const page of results) {
        const item = pageToResumeItem(page, nameToId);
        allItems.push(item);
        hasResults = true;
      }
      hasMore = !!(resp.has_more || resp.hasMore);
      cursor = resp.next_cursor || resp.nextCursor;
    }

    for (const item of allItems) {
      if (item.type === 'summary') {
        resume.summary = item.content || item.roleOrDegree || '';
      } else if (item.type === 'experience') {
        if (item.roleOrDegree || item.company) {
          resume.experience.push({
            role: item.roleOrDegree || '职位',
            company: item.company || '',
            period: typeof item.period === 'string' ? item.period : '',
            details: Array.isArray(item.details) ? item.details : [],
          });
        }
      } else if (item.type === 'education') {
        if (item.degreeText || item.roleOrDegree || item.school) {
          resume.education.push({
            degree: item.degreeText || item.roleOrDegree || '学位',
            school: item.school || '',
            major: typeof item.major === 'string' ? item.major : '',
            period: typeof item.period === 'string' ? item.period : '',
          });
        }
      } else if (item.type === 'skill_dev' && item.skill) {
        resume.skills.development.push(item.skill);
      } else if (item.type === 'skill_design' && item.skill) {
        resume.skills.design.push(item.skill);
      } else if (item.type === 'skill_lang' && item.skill) {
        resume.skills.languages.push(item.skill);
      } else if (item.type === 'other' && item.skill && item.roleOrDegree) {
        const r = item.roleOrDegree.toLowerCase();
        if (r.includes('开发') || r.includes('development')) resume.skills.development.push(item.skill);
        else if (r.includes('设计') || r.includes('design')) resume.skills.design.push(item.skill);
        else if (r.includes('语言') || r.includes('language')) resume.skills.languages.push(item.skill);
      }
    }

    if (!resume.summary && resume.experience.length === 0 && resume.education.length === 0 &&
        resume.skills.development.length === 0 && resume.skills.design.length === 0 && resume.skills.languages.length === 0) {
      console.warn('简历数据库为空或无可解析条目，未更新 resume。');
      process.exit(0);
    }

    /* 不再注入占位内容，仅保留 Notion 真实数据 */
  } catch (err) {
    if (err.code === 'object_not_found') {
      console.error('未找到简历数据库，请确认 NOTION_DATABASE_RESUME_ID 正确，且已连接 Integration');
    } else {
      console.error('Notion API 错误:', err.message);
    }
    process.exit(1);
  }

  const i18nDir = path.join(__dirname, '../src/i18n');
  for (const lang of ['zh', 'en', 'de']) {
    const dataPath = path.join(i18nDir, `data.${lang}.json`);
    if (!fs.existsSync(dataPath)) continue;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    data.resume = resume;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  console.log(
    `已更新 resume 到 data.zh.json / data.en.json / data.de.json ` +
    `(summary, ${resume.experience.length} 经历, ${resume.education.length} 教育, 技能开发/设计/语言)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
