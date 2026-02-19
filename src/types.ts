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
