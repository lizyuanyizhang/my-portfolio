/**
 * 人格画像 API：获取与生成每月人格特质词云
 */
import type { PersonalityPortrait } from '../types';

/** 按月份聚合内容（用于生成人格画像） */
export function aggregateContentForPeriod(
  data: {
    essays?: { title?: string; excerpt?: string; content?: string; category?: string }[];
    projects?: { title?: string; description?: string; tags?: string[] }[];
    photos?: { caption?: string; location?: string }[];
    timeline?: { year?: string; event?: string; location?: string }[];
    personalInfo?: { bio?: string };
  },
  yearReviews?: { annual_word?: string | null; summary_done?: string | null; summary_success?: string | null }[]
) {
  return {
    essays: (data.essays ?? []).map((e) => ({
      title: e.title ?? '',
      excerpt: e.excerpt,
      content: e.content,
      category: e.category,
    })),
    projects: (data.projects ?? []).map((p) => ({
      title: p.title ?? '',
      description: p.description,
      tags: p.tags,
    })),
    photos: (data.photos ?? []).map((p) => ({
      caption: p.caption ?? '',
      location: p.location,
    })),
    timeline: (data.timeline ?? []).map((t) => ({
      year: t.year ?? '',
      event: t.event ?? '',
      location: t.location,
    })),
    yearReviews: (yearReviews ?? []).map((r) => ({
      annual_word: r.annual_word,
      summary_done: r.summary_done,
      summary_success: r.summary_success,
    })),
    personalInfo: data.personalInfo ? { bio: data.personalInfo.bio } : undefined,
  };
}

/** 调用 Edge Function 生成人格画像 */
export async function generatePersonalityPortrait(
  period: string,
  aggregatedContent: Record<string, unknown>,
  supabase: { functions: { invoke: (n: string, o: { body: object }) => Promise<{ data?: unknown; error?: unknown }> } }
): Promise<PersonalityPortrait> {
  const { data, error } = await supabase.functions.invoke('generate-personality-portrait', {
    body: { period, aggregatedContent },
  });
  if (error) throw new Error(String(error));
  const res = data as { portrait?: PersonalityPortrait; error?: string };
  if (res?.error) throw new Error(res.error);
  if (!res?.portrait) throw new Error('生成失败');
  return res.portrait;
}
