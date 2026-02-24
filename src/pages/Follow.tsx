import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ExternalLink, BookOpen, Mail, Mic, Video, GraduationCap, Link2 } from 'lucide-react';
import type { FollowLink } from '../types';

/** 根据类型选图标 */
function getTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('博客') || t.includes('blog')) return BookOpen;
  if (t.includes('newsletter')) return Mail;
  if (t.includes('播客') || t.includes('podcast')) return Mic;
  if (t.includes('视频') || t.includes('video')) return Video;
  if (t.includes('课程') || t.includes('course') || t.includes('kurs')) return GraduationCap;
  return Link2;
}

/** 按类型分组 */
function groupByType(links: FollowLink[]): [string, FollowLink[]][] {
  const map = new Map<string, FollowLink[]>();
  for (const l of links) {
    const key = l.type?.trim() || '其他';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  const order = ['博客', 'Newsletter', '播客', '视频', '课程', '其他'];
  const rest = Array.from(map.keys()).filter((k) => !order.includes(k));
  const keys = [...order.filter((k) => map.has(k)), ...rest.sort()];
  return keys.map((k) => [k, map.get(k)!]);
}

export const Follow: React.FC = () => {
  const { data } = useLanguage();
  const d = data as {
    followLinks?: FollowLink[];
    ui?: {
      follow?: {
        title?: string;
        subtitle?: string;
        noLinks?: string;
      };
    };
  };
  const links = (d.followLinks ?? []) as FollowLink[];
  const groups = useMemo(() => groupByType(links), [links]);

  const ui = d.ui?.follow ?? {};
  const title = ui.title ?? '我的关注';
  const subtitle = ui.subtitle ?? '正在看的、在学习的别人的网页或内容，分享给我的访客。';
  const noLinks = ui.noLinks ?? '暂无内容。在 Notion「我的关注」数据库中添加链接并同步即可展示。';

  return (
    <div className="pt-24 pb-24 px-6 md:px-10 min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10">
            <h1 className="text-xl md:text-2xl font-serif text-ink mb-2">{title}</h1>
            <p className="text-muted font-serif italic text-sm md:text-base">{subtitle}</p>
          </header>

          {links.length === 0 ? (
            <p className="py-24 text-muted font-serif italic text-center">{noLinks}</p>
          ) : (
            <div className="space-y-10">
              {groups.map(([type, items]) => {
                const Icon = getTypeIcon(type);
                return (
                  <section key={type}>
                    <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Icon size={14} strokeWidth={1.5} />
                      {type}
                    </h2>
                    <ul className="space-y-2">
                      {items.map((link, index) => (
                        <motion.li
                          key={link.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <a
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border border-ink/5 bg-white hover:border-accent/30 hover:shadow-md transition-all duration-200 group"
                          >
                            {link.icon && (
                              <span className="text-lg shrink-0" aria-hidden>
                                {link.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-serif text-ink font-medium group-hover:text-accent transition-colors block truncate">
                                {link.name}
                              </span>
                              {link.description && (
                                <span className="text-[12px] text-muted line-clamp-1 mt-0.5 block">
                                  {link.description}
                                </span>
                              )}
                            </div>
                            <ExternalLink
                              size={14}
                              className="shrink-0 text-muted group-hover:text-accent transition-colors"
                            />
                          </a>
                        </motion.li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
