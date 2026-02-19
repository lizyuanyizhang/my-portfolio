import React, { useState } from 'react';
import { motion } from 'motion/react';
import data from '../data.json';
import { LayoutGrid, LayoutList, ExternalLink } from 'lucide-react';
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
          <h1 className="text-5xl md:text-6xl font-serif text-ink mb-8">摄影</h1>
          <div className="h-px w-24 bg-accent/30 mb-6" />
          <p className="text-muted font-serif italic text-lg mb-8">
            用镜头记录下的瞬间
          </p>

          {/* 布局切换 & 上传提示 */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <div className="flex rounded-full border border-ink/10 p-1">
              <button
                onClick={() => setLayout('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  layout === 'grid' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <LayoutGrid size={16} /> 网格
              </button>
              <button
                onClick={() => setLayout('waterfall')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  layout === 'waterfall' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <LayoutList size={16} /> 瀑布流
              </button>
            </div>
            <a
              href="https://img.scdn.io"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors"
            >
              <ExternalLink size={12} /> 使用 img.scdn.io 拖拽上传图片，复制链接至 data.json
            </a>
          </div>

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
