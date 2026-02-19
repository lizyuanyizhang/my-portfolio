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
