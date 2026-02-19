import React, { useState } from 'react';
import { motion } from 'motion/react';
import data from '../data.json';
import { LayoutGrid, Rows3 } from 'lucide-react';
import type { Photo } from '../types';

type LayoutMode = 'grid' | 'waterfall';

export const Photography: React.FC = () => {
  const photos = (data as { photos: Photo[] }).photos;
  const [layout, setLayout] = useState<LayoutMode>('grid');

  return (
    <div className="pt-24 pb-24 min-h-screen bg-paper">
      <div className="px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 头部：标题 + 副标题 左侧，布局切换 右侧 —— 参考摄影画廊极简布局 */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-ink mb-3">摄影</h1>
              <div className="h-px w-16 bg-accent/20 mb-4" />
              <p className="text-muted font-serif italic text-base max-w-md">
                用镜头捕捉的瞬间，留住值得回望的风景。
              </p>
            </div>
            {/* 布局切换：图标优先，低调不抢戏 */}
            <div className="flex rounded-lg border border-ink/10 p-0.5 shrink-0" aria-label="切换显示布局">
              <button
                onClick={() => setLayout('grid')}
                title="网格"
                className={`p-2.5 rounded-md transition-all ${
                  layout === 'grid' ? 'bg-ink text-paper' : 'text-muted hover:text-ink hover:bg-ink/5'
                }`}
              >
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setLayout('waterfall')}
                title="瀑布流"
                className={`p-2.5 rounded-md transition-all ${
                  layout === 'waterfall' ? 'bg-ink text-paper' : 'text-muted hover:text-ink hover:bg-ink/5'
                }`}
              >
                <Rows3 size={18} strokeWidth={1.5} />
              </button>
            </div>
          </header>

          {/* 相册展示 */}
          {photos.length === 0 ? (
            <p className="py-24 text-muted font-serif italic text-center">
              暂无作品。前往 img.scdn.io 上传图片，将链接添加到 data.json 的 photos 数组即可展示。
            </p>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} />
              ))}
            </div>
          ) : (
            <div className="photo-waterfall">
              {photos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} variant="waterfall" />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const PhotoCard: React.FC<{ photo: Photo; index: number; variant?: 'grid' | 'waterfall' }> = ({
  photo,
  index,
  variant = 'grid',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-default"
    >
      <div
        className={`overflow-hidden rounded-2xl bg-muted/10 border border-ink/5 ${
          variant === 'waterfall' ? '' : 'aspect-[3/4]'
        }`}
      >
        <img
          src={photo.url}
          alt={photo.caption}
          className={`w-full transition-transform duration-700 group-hover:scale-105 ${
            variant === 'waterfall' ? 'block' : 'h-full object-cover'
          }`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div className="mt-3 px-1">
        <p className="font-serif text-ink font-medium">{photo.caption}</p>
        {photo.location && (
          <p className="text-xs text-muted mt-0.5 uppercase tracking-wider">{photo.location}</p>
        )}
        {photo.date && (
          <p className="text-xs text-muted mt-0.5">{photo.date}</p>
        )}
      </div>
    </motion.div>
  );
};
