/**
 * Year in Review API
 * 生成与获取周期总结
 */
import type { YearReview } from '../types';

/** 获取某年留言数量（用于聚合） */
export async function fetchVoicesMessagesCount(
  supabase: { from: (t: string) => unknown } | null,
  year: number
): Promise<{ voices: number; messages: number }> {
  if (!supabase) return { voices: 0, messages: 0 };
  const start = `${year}-01-01`;
  const end = `${year}-12-31T23:59:59`;
  try {
    const [vr, mr] = await Promise.all([
      (supabase.from('voices') as any).select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      (supabase.from('messages') as any).select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    ]);
    return {
      voices: vr?.count ?? 0,
      messages: mr?.count ?? 0,
    };
  } catch {
    return { voices: 0, messages: 0 };
  }
}

/** 按周期过滤数据的日期范围 */
function getPeriodRange(
  type: 'week' | 'month' | 'quarter' | 'half_year' | 'year',
  value: string
): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (type === 'year') {
    const y = parseInt(value, 10);
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
  } else if (type === 'half_year') {
    const [y, h] = value.includes('H') ? value.split('H').map(Number) : [now.getFullYear(), 1];
    start = new Date(y, (h - 1) * 6, 1);
    end = new Date(y, h * 6, 0);
  } else if (type === 'quarter') {
    const [y, q] = value.includes('Q') ? value.split('Q').map(Number) : [now.getFullYear(), 1];
    start = new Date(y, (q - 1) * 3, 1);
    end = new Date(y, q * 3, 0);
  } else if (type === 'month') {
    const [y, m] = value.split('-').map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 0);
  } else {
    end = new Date(now);
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  }
  return { start, end };
}

function parseDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function inRange(d: Date | null, start: Date, end: Date): boolean {
  if (!d) return false;
  return d >= start && d <= end;
}

/** 按周期聚合数据（用于 year 类型：需配合 fetchVoicesMessagesCount 获取留言数） */
export function aggregateDataForYear(
  data: {
    essays?: { id: string; title: string; date?: string; category?: string }[];
    projects?: { id: string; title: string; date?: string; tags?: string[] }[];
    photos?: { id: string; caption: string; date?: string; location?: string }[];
    videos?: { id: string; title: string; date?: string }[];
  },
  year: number,
  voicesCount: number,
  messagesCount: number
) {
  const { start, end } = getPeriodRange('year', String(year));
  const filterDate = (dateStr: string | undefined) => inRange(parseDate(dateStr), start, end);

  return {
    essays: (data.essays ?? []).filter((e) => filterDate(e.date)),
    projects: (data.projects ?? []).filter((p) => filterDate(p.date)),
    photos: (data.photos ?? []).filter((p) => filterDate(p.date)),
    videos: (data.videos ?? []).filter((v) => filterDate(v.date)),
    voices_count: voicesCount,
    messages_count: messagesCount,
  };
}

/** 调用 Edge Function 生成总结 */
export async function generateYearReview(
  periodType: 'week' | 'month' | 'quarter' | 'half_year' | 'year',
  periodValue: string,
  aggregatedData: Record<string, unknown>,
  supabase: { functions: { invoke: (n: string, o: { body: object }) => Promise<{ data?: unknown; error?: unknown }> } }
): Promise<YearReview> {
  const { data, error } = await supabase.functions.invoke('generate-year-review', {
    body: { periodType, periodValue, aggregatedData },
  });
  if (error) throw new Error(String(error));
  const res = data as { review?: YearReview; error?: string };
  if (res?.error) throw new Error(res.error);
  if (!res?.review) throw new Error('生成失败');
  return res.review;
}
