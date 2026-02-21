import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { assetUrl } from '../lib/assetUrl';
import { useLanguage } from '../context/LanguageContext';
import { LayoutGrid, FolderOpen } from 'lucide-react';
import type { Photo } from '../types';

type LayoutMode = 'grid' | 'collection';

/** 按地点将照片分组，无地点的归入「其他」 */
function groupByLocation(photos: Photo[]): [string, Photo[]][] {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = p.location?.trim() || '其他';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) => (a === '其他' ? 1 : b === '其他' ? -1 : a.localeCompare(b)));
}

export const Photography: React.FC = () => {
  const { data } = useLanguage();
  const photos = (data as { photos: Photo[] }).photos;
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const collections = useMemo(() => groupByLocation(photos), [photos]);

  return (
    <div className="pt-24 md:pt-28 pb-24 min-h-screen bg-paper">
      <div className="px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 与文字页菜单一致的排版：左控制 / 右副标题，font-mono 对齐 */}
          <header className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-8 w-full">
            <div className="flex flex-wrap gap-2 justify-start items-center" aria-label="切换显示布局">
              <button
                onClick={() => setLayout('grid')}
                title="网格"
                className={`px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-full font-mono transition-all ${
                  layout === 'grid' ? 'bg-ink text-[#f8f8f4]' : 'bg-ink/5 text-[#444] hover:bg-ink/10 hover:text-ink'
                }`}
              >
                <LayoutGrid size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setLayout('collection')}
                title="合集"
                className={`px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-full font-mono transition-all ${
                  layout === 'collection' ? 'bg-ink text-[#f8f8f4]' : 'bg-ink/5 text-[#444] hover:bg-ink/10 hover:text-ink'
                }`}
              >
                <FolderOpen size={16} strokeWidth={1.5} />
              </button>
            </div>
            <p className="font-mono text-[10px] md:text-xs text-[#444] shrink-0">
              摄影 · 我拍的一些照片集合，记录驻足过的瞬间。
            </p>
          </header>

          {/* 相册展示 */}
          {photos.length === 0 ? (
            <p className="py-24 text-muted font-serif italic text-center">
              暂无作品。前往 img.scdn.io 上传图片，将链接添加到 data.json 的 photos 数组即可展示。
            </p>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {photos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {collections.map(([location, items]) => (
                <section key={location}>
                  <h2 className="text-lg font-serif text-ink mb-4 pb-2 border-b border-ink/10">
                    {location}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {items.map((photo, index) => (
                      <PhotoCard key={photo.id} photo={photo} index={index} hideLocation />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const PhotoCard: React.FC<{ photo: Photo; index: number; hideLocation?: boolean }> = ({ photo, index, hideLocation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-default"
    >
      <div className="overflow-hidden rounded-xl bg-muted/10 border border-ink/5 aspect-square">
        <img
          src={assetUrl(photo.url)}
          alt={photo.caption}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="font-serif text-ink font-medium text-xs leading-tight line-clamp-2">{photo.caption}</p>
        {(hideLocation ? photo.date : (photo.location || photo.date)) && (
          <p className="text-[10px] text-muted mt-0.5 truncate">
            {hideLocation ? photo.date : [photo.location, photo.date].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </motion.div>
  );
};
