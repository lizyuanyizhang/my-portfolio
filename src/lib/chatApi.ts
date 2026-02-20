/**
 * 迷你 AI 对话 API
 * 调用后端代理（Supabase Edge Function），使用个人数据构建 system prompt
 */

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** 从 data 构建「张苑逸」人设的 system prompt */
export function buildSystemPrompt(data: {
  personalInfo?: { name?: string; title?: string; bio?: string; location?: string; interests?: string[] };
  resume?: { summary?: string; experience?: { role?: string; company?: string; details?: string[] }[]; interests?: string[] };
  timeline?: { year?: string; event?: string; location?: string }[];
}) {
  const p = data.personalInfo || {};
  const r = data.resume as { summary?: string; experience?: { role?: string; company?: string; details?: string[] }[] } | undefined;
  const t = (data.timeline || []) as { year?: string; event?: string; location?: string }[];
  const exp = (r?.experience || []).map((e) => `${e.role} @ ${e.company}`).join('；');
  const events = t.slice(0, 5).map((e) => `${e.year} ${e.location}: ${e.event}`).join('\n');

  return `你是张苑逸（Liz Zhang），一个真实的人，正在和来访者聊天。请用第一人称、自然、亲切的口吻回复，不超过 150 字。

关于你的信息：
- 身份：${p.title || 'headhunter / 未来摄影师 / 写作者 / vibe coder'}
- 简介：${p.bio || '探索科技与人文的交汇点'}
- 所在地：${p.location || '上海'}
- 经历：${r?.summary || ''} ${exp ? `曾任：${exp}` : ''}
- 最近动态：${events || '探索 Vibe Coding、创造有温度的数字体验'}

回复要求：简短、真诚、像个老朋友，可中英混用，不要官方腔。`;
}

const CHAT_FN = 'chat';

/** 调用聊天接口（Supabase Edge Function 或 VITE_CHAT_API_URL） */
export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  options?: { supabase: { functions: { invoke: (name: string, opts: { body: object }) => Promise<{ data?: unknown; error?: unknown }> } } | null; model?: 'deepseek' | 'qwen' }
): Promise<string> {
  const body = {
    messages,
    systemPrompt,
    model: options?.model || 'deepseek',
  };

  if (options?.supabase?.functions) {
    const { data, error } = await options.supabase.functions.invoke(CHAT_FN, { body });
    if (error) throw new Error(String(error));
    const res = data as { content?: string; error?: string };
    if (res?.error) throw new Error(res.error);
    return res?.content ?? '';
  }

  const apiUrl = (import.meta.env.VITE_CHAT_API_URL as string)?.trim();
  if (!apiUrl) throw new Error('聊天功能未配置：请部署 Supabase Edge Function 或设置 VITE_CHAT_API_URL');

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { content?: string; error?: string };
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json?.content ?? '';
}
