/**
 * 将以 / 开头的资源路径转为带 base 的完整 URL
 * GitHub Pages 部署在 /my-portfolio/ 时，/images/xxx 会 404，需加上 base
 */
export function assetUrl(path: string): string {
  if (!path || typeof path !== 'string') return path;
  if (!path.startsWith('/')) return path;
  const base = import.meta.env.BASE_URL;
  return `${base}${path.slice(1)}`;
}
