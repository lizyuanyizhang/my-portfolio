/**
 * 从站点数据提取年度关键词（不接入大模型）
 * 来源：essays、projects、photos、timeline、year_review
 */
export interface KeywordItem {
  text: string;
  value: number;
}

/** 简单中文分词：按常见分隔符和长度切分 */
function splitWords(str: string): string[] {
  if (!str || typeof str !== 'string') return [];
  const s = str.trim();
  if (!s) return [];
  const sep = /[\s,，、；;：:·]+/;
  const parts = s.split(sep).filter((p) => p.length >= 2 && p.length <= 8);
  if (parts.length > 0) return parts;
  if (s.length <= 6) return [s];
  if (s.length <= 12) return [s.slice(0, 6), s.slice(6)].filter(Boolean);
  return [s.slice(0, 8)];
}

export function extractKeywordsForYear(
  data: {
    essays?: { id: string; title?: string; category?: string; date?: string }[];
    projects?: { id: string; title?: string; tags?: string[]; date?: string }[];
    photos?: { id: string; caption?: string; location?: string; date?: string }[];
    timeline?: { year: string; event?: string; location?: string }[];
  },
  yearReview?: { annual_word?: string | null; summary_done?: string | null; summary_success?: string | null } | null,
  year: string
): KeywordItem[] {
  const count = new Map<string, number>();

  const add = (word: string, weight: number) => {
    if (!word || word.length < 2) return;
    const w = word.trim();
    if (w.length < 2 || w.length > 12) return;
    count.set(w, (count.get(w) ?? 0) + weight);
  };

  const filterYear = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const y = String(dateStr).slice(0, 4);
    return y === year;
  };

  (data.essays ?? []).filter((e) => filterYear(e.date)).forEach((e) => {
    if (e.category) add(e.category, 2);
    splitWords(e.title ?? '').forEach((w) => add(w, 1.5));
  });

  (data.projects ?? []).filter((p) => filterYear(p.date)).forEach((p) => {
    (p.tags ?? []).forEach((t) => add(t, 2));
    splitWords(p.title ?? '').forEach((w) => add(w, 1));
  });

  (data.photos ?? []).filter((p) => filterYear(p.date)).forEach((p) => {
    if (p.location) add(p.location, 1.5);
    splitWords(p.caption ?? '').forEach((w) => add(w, 1));
  });

  (data.timeline ?? []).filter((t) => t.year === year).forEach((t) => {
    if (t.location && t.location !== '未知' && t.location !== '星辰大海') add(t.location, 2);
    splitWords(t.event ?? '').forEach((w) => add(w, 1));
  });

  if (yearReview?.annual_word) add(yearReview.annual_word, 5);
  [yearReview?.summary_done, yearReview?.summary_success].forEach((txt) => {
    splitWords(txt ?? '').forEach((w) => add(w, 1.2));
  });

  return Array.from(count.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 24);
}
