/**
 * 地理轨迹工具：从 timeline、photos、personalInfo 聚合位置数据
 * 用于在地图上绘制人生轨迹
 */

/** 常见城市/地点的静态经纬度（不依赖高德 Geocoder，避免加载失败） */
const STATIC_COORDS: Record<string, [number, number]> = {
  '泸州': [105.44, 28.87],
  '中国泸州': [105.44, 28.87],
  '上海': [121.47, 31.23],
  '中国上海': [121.47, 31.23],
  '上海, 中国': [121.47, 31.23],
  '苏州': [120.60, 31.30],
  '中国苏州': [120.60, 31.30],
  '京都': [135.77, 35.01],
  '日本京都': [135.77, 35.01],
  '伦敦': [-0.13, 51.51],
  '英国伦敦': [-0.13, 51.51],
  '巴黎': [2.35, 48.86],
  '纽约': [-74.01, 40.71],
  '东京': [139.69, 35.69],
  '北京': [116.41, 39.90],
  '深圳': [114.06, 22.55],
  '杭州': [120.16, 30.25],
  '成都': [104.07, 30.67],
  '广州': [113.26, 23.13],
};

/** 根据地址文本尝试从静态表获取经纬度，支持模糊匹配 */
export function getStaticCoords(location: string): [number, number] | null {
  const key = location.trim();
  if (STATIC_COORDS[key]) return STATIC_COORDS[key];
  for (const [name, coords] of Object.entries(STATIC_COORDS)) {
    if (key.includes(name) || name.includes(key)) return coords;
  }
  return null;
}

export interface LocationPoint {
  /** 原始地址文本，如 "上海"、"京都" */
  location: string;
  /** 年份，用于排序 */
  year?: string;
  /** 更精确的日期，用于排序 */
  date?: string;
  /** 展示标签，如 "1996 · 中国泸州" */
  label?: string;
  /** 数据来源：timeline / photo / personal */
  source: 'timeline' | 'photo' | 'personal';
}

/** 过滤掉无法地理编码的「抽象地点」 */
const SKIP_LOCATIONS = new Set([
  '星辰大海',
  '未知',
  '未来',
  '',
]);

/**
 * 标准化地址：增加「中国」等后缀提高地理编码成功率
 * 例如 "泸州" -> "中国泸州", "上海" -> "中国上海"（若已是 "上海" 也可）
 */
function normalizeLocation(loc: string): string {
  const trimmed = loc?.trim() || '';
  if (!trimmed || SKIP_LOCATIONS.has(trimmed)) return '';
  // 已有国家/地区的不再追加
  if (/中国|日本|英国|美国|法国|德国|韩国|意大利/i.test(trimmed)) return trimmed;
  // 常见国外城市
  if (/京都|伦敦|巴黎|纽约|东京|首尔/i.test(trimmed)) return trimmed;
  // 国内城市补「中国」
  return `中国${trimmed}`;
}

/**
 * 从多语言数据中聚合所有带位置信息的点位，按时间排序
 */
export function aggregateLocationPoints(data: {
  timeline?: { year?: string; location?: string }[];
  photos?: { location?: string; date?: string; caption?: string }[];
  personalInfo?: { location?: string };
}): LocationPoint[] {
  const points: LocationPoint[] = [];
  const seen = new Set<string>();

  const addPoint = (loc: string, year?: string, date?: string, label?: string, source: LocationPoint['source'] = 'timeline') => {
    const normalized = normalizeLocation(loc);
    if (!normalized) return;
    const key = `${normalized}-${year || ''}-${date || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push({
      location: normalized,
      year,
      date,
      label: label || (year ? `${year} · ${loc}` : loc),
      source,
    });
  };

  // 1. Timeline 事件
  (data.timeline || []).forEach((t) => {
    if (t.location) addPoint(t.location, t.year, undefined, `${t.year} · ${t.location}`, 'timeline');
  });

  // 2. 照片
  (data.photos || []).forEach((p) => {
    if (p.location) {
      const year = p.date ? p.date.slice(0, 4) : undefined;
      addPoint(p.location, year, p.date, p.caption ? `${p.location} · ${p.caption}` : `${p.location}`, 'photo');
    }
  });

  // 3. 个人所在地（作为当前/最新点位）
  if (data.personalInfo?.location) {
    const loc = data.personalInfo.location;
    addPoint(loc, new Date().getFullYear().toString(), undefined, `当前 · ${loc}`, 'personal');
  }

  // 按年份 + 日期排序
  points.sort((a, b) => {
    const ya = a.year || '0000';
    const yb = b.year || '0000';
    if (ya !== yb) return ya.localeCompare(yb);
    return (a.date || '').localeCompare(b.date || '');
  });

  return points;
}
