export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  date?: string;
  tags?: string[];
  /** 使用的技术栈 / 工具，如 "Cursor · React · Vercel" */
  builtWith?: string[];
}

export interface Essay {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
  content?: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  location?: string;
  date?: string;
}

/** 视频作品（YouTube / Bilibili 嵌入） */
export interface Video {
  id: string;
  title: string;
  description: string;
  /** 封面图 URL，可选；不填则用平台默认缩略图 */
  cover?: string;
  /** 视频链接：YouTube 或 Bilibili 的分享链接 */
  videoUrl: string;
  /** 时长，如 "3:42" */
  duration?: string;
  tags?: string[];
  date?: string;
}

export interface Business {
  title: string;
  description: string;
  icon: string;
}

/** 语音录制记录（Supabase voices 表） */
export interface Voice {
  id: string;
  created_at: string;
  storage_path: string;
  duration_seconds?: number;
  caption?: string;
  /** 公开可访问的音频 URL，由 Storage 生成 */
  url?: string;
}

/** 文字留言（Supabase messages 表） */
export interface TextMessage {
  id: string;
  content: string;
  created_at: string;
}

/** 人格画像：每月生成的人格特质词云 */
export interface PersonalityPortrait {
  id: string;
  period: string;  // "2026-02"
  words: { text: string; weight: number }[];
  created_at: string;
}

/** Year in Review 周期总结 */
export interface YearReview {
  id: string;
  period_type: 'week' | 'month' | 'quarter' | 'half_year' | 'year';
  period_value: string;
  year: string;
  annual_word: string | null;
  metrics: Record<string, number>;
  highlights: { type: string; title: string; date?: string }[];
  summary_done: string | null;
  summary_success: string | null;
  summary_fail: string | null;
  summary_learned: string | null;
  encouragement: string | null;
  created_at: string;
}
