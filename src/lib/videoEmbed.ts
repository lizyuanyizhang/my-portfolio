/**
 * 解析 YouTube / Bilibili 链接，返回 iframe embed 所需信息
 */

export type VideoSource = 'youtube' | 'bilibili' | null;

export interface EmbedInfo {
  source: VideoSource;
  embedUrl: string;
  /** 用于 YouTube 缩略图：https://img.youtube.com/vi/{videoId}/mqdefault.jpg */
  thumbnailUrl?: string;
}

/**
 * 从 YouTube 链接提取 videoId
 * 支持：youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/embed/xxx
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * 从 Bilibili 链接提取 bvid
 * 支持：bilibili.com/video/BVxxx（推荐使用完整链接）
 */
function getBilibiliBvid(url: string): string | null {
  const m = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export function parseVideoUrl(videoUrl: string): EmbedInfo {
  const u = videoUrl.trim();
  const ytId = getYouTubeVideoId(u);
  if (ytId) {
    return {
      source: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
    };
  }
  const bvId = getBilibiliBvid(u);
  if (bvId) {
    const bvid = bvId.startsWith('BV') ? bvId : `BV${bvId}`;
    return {
      source: 'bilibili',
      embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1`,
      thumbnailUrl: `https://i0.hdslb.com/bfs/archive/thumbnails/${bvid}.jpg`,
    };
  }
  return { source: null, embedUrl: '' };
}
