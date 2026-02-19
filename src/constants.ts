import { Project, Essay, Photo, Business } from './types';

export const PERSONAL_INFO = {
  name: "你的名字",
  title: "创意开发者 / 摄影师 / 终身学习者",
  bio: "探索科技与艺术的交汇点。我热衷于通过代码构建有温度的数字体验，通过镜头捕捉生活中的宁静瞬间。",
  email: "your-email@example.com",
  linkedin: "https://linkedin.com/in/your-profile",
  xiaohongshu: "https://www.xiaohongshu.com/user/profile/your-id",
};

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "Vibe Coding Project A",
    description: "一个探索生成式艺术与交互设计的实验项目。通过代码捕捉情绪的流动。",
    image: "https://picsum.photos/seed/vibe1/800/600",
    tags: ["React", "Three.js", "Generative"],
    date: "2024"
  },
  {
    id: "2",
    title: "Minimalist Tool B",
    description: "为创作者设计的极简效率工具。去除杂音，回归本质。",
    image: "https://picsum.photos/seed/vibe2/800/600",
    tags: ["TypeScript", "Tailwind"],
    date: "2023"
  }
];

export const ESSAYS: Essay[] = [
  {
    id: "1",
    title: "关于数字时代的宁静",
    excerpt: "在这个信息爆炸的时代，我们如何寻找属于自己的精神角落？探讨极简主义在数字生活中的应用。",
    date: "2024-01-15"
  },
  {
    id: "2",
    title: "镜头背后的叙事",
    excerpt: "每一张照片都是一段未完待续的故事。分享我这些年在街头摄影中的感悟与技巧。",
    date: "2023-11-20"
  }
];

export const PHOTOS: Photo[] = [
  { id: "1", url: "https://picsum.photos/seed/photo1/1200/800", caption: "晨光下的街道", location: "上海" },
  { id: "2", url: "https://picsum.photos/seed/photo2/800/1200", caption: "雨后的静谧", location: "京都" },
  { id: "3", url: "https://picsum.photos/seed/photo3/800/800", caption: "光影的几何", location: "伦敦" },
  { id: "4", url: "https://picsum.photos/seed/photo4/1200/800", caption: "远山的呼唤", location: "川西" },
];

export const BUSINESSES: Business[] = [
  {
    title: "品牌视觉设计",
    description: "为初创企业提供从标志到整体视觉系统的定制化设计服务。",
    icon: "Palette"
  },
  {
    title: "全栈应用开发",
    description: "构建高性能、响应式的现代化 Web 应用，专注于用户体验与交互。",
    icon: "Code"
  },
  {
    title: "创意咨询",
    description: "结合技术背景与审美洞察，为产品提供创意方向与策略建议。",
    icon: "Lightbulb"
  }
];

export const AESTHETICS = [
  "极简主义 (Minimalism)",
  "侘寂美学 (Wabi-sabi)",
  "包豪斯风格 (Bauhaus)",
  "自然主义 (Naturalism)"
];

export const INTERESTS = [
  "胶片摄影",
  "黑胶唱片收藏",
  "徒步旅行",
  "古籍修复",
  "独立游戏开发"
];
