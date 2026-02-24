import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { assetUrl } from '../lib/assetUrl';
import { useLanguage } from '../context/LanguageContext';
import { LayoutGrid, FolderOpen, Image, Video, Play, X } from 'lucide-react';
import { parseVideoUrl } from '../lib/videoEmbed';
import type { Photo, Video as VideoType } from '../types';

type LayoutMode = 'grid' | 'collection';
type TabMode = 'photos' | 'videos';

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
  const d = data as {
    photos: Photo[];
    videos?: VideoType[];
    ui?: {
      photography?: {
        tabPhotos?: string;
        tabVideos?: string;
        subtitlePhotos?: string;
        subtitleVideos?: string;
        noPhotos?: string;
        noVideos?: string;
      };
    };
  };
  const photos = d.photos ?? [];
  const videos = (d.videos ?? []) as VideoType[];
  const [tab, setTab] = useState<TabMode>('photos');
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);
  const collections = useMemo(() => groupByLocation(photos), [photos]);

  const ui = d.ui?.photography ?? {};
  const tabPhotos = ui.tabPhotos ?? '照片';
  const tabVideos = ui.tabVideos ?? '影像';
  const subtitlePhotos = ui.subtitlePhotos ?? '我拍的一些照片集合，记录驻足过的瞬间。';
  const subtitleVideos = ui.subtitleVideos ?? '记录生活碎片、AI 生成的视觉实验，用影像留住当下的感受。';
  const noPhotos = ui.noPhotos ?? '暂无作品。在 Notion 摄影数据库中上传照片并同步即可展示。';
  const noVideos = ui.noVideos ?? '暂无影像。在 Notion 影像数据库中添加视频链接并同步即可展示。';

  return (
    <div className="pt-24 md:pt-28 pb-24 min-h-screen bg-paper">
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 照片/影像 居中于顶部；网格/合集保持原位；默认显示照片 */}
          <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-8 w-full">
            {/* 左：网格/合集，保持当前位置 */}
            <div className="flex items-center justify-start">
              {tab === 'photos' && (
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => setLayout('grid')}
                    title="网格"
                    className={`px-2.5 py-1.5 rounded-md flex items-center justify-center font-mono text-xs transition-all ${
                      layout === 'grid' ? 'bg-ink/15 text-ink' : 'bg-ink/5 text-[#444] hover:bg-ink/10 hover:text-ink'
                    }`}
                  >
                    <LayoutGrid size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setLayout('collection')}
                    title="合集"
                    className={`px-2.5 py-1.5 rounded-md flex items-center justify-center font-mono text-xs transition-all ${
                      layout === 'collection' ? 'bg-ink/15 text-ink' : 'bg-ink/5 text-[#444] hover:bg-ink/10 hover:text-ink'
                    }`}
                  >
                    <FolderOpen size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
            {/* 中：照片 | 影像 居中 */}
            <div className="flex justify-center">
              <div className="flex rounded-full bg-ink/5 p-0.5 w-fit" role="tablist" aria-label="切换照片与影像">
                <button
                  role="tab"
                  aria-selected={tab === 'photos'}
                  onClick={() => setTab('photos')}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full font-mono text-sm transition-all flex items-center gap-2 ${
                    tab === 'photos'
                      ? 'bg-ink text-[#f8f8f4] shadow-sm ring-2 ring-ink/20'
                      : 'text-[#444] hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  <Image size={16} strokeWidth={1.5} />
                  {tabPhotos}
                </button>
                <button
                  role="tab"
                  aria-selected={tab === 'videos'}
                  onClick={() => setTab('videos')}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full font-mono text-sm transition-all flex items-center gap-2 ${
                    tab === 'videos'
                      ? 'bg-ink text-[#f8f8f4] shadow-sm ring-2 ring-ink/20'
                      : 'text-[#444] hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  <Video size={16} strokeWidth={1.5} />
                  {tabVideos}
                </button>
              </div>
            </div>
            {/* 右：副标题 */}
            <div className="flex items-center justify-end">
              <p className="font-mono text-[10px] md:text-xs text-[#444]">
                摄影 · {tab === 'photos' ? subtitlePhotos : subtitleVideos}
              </p>
            </div>
          </header>

          {/* 照片 Tab 内容 */}
          <AnimatePresence mode="wait">
            {tab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {photos.length === 0 ? (
                  <p className="py-24 text-muted font-serif italic text-center">{noPhotos}</p>
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
                        <h2 className="text-lg font-serif text-ink mb-4 pb-2 border-b border-ink/10">{location}</h2>
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
            )}
          </AnimatePresence>

          {/* 影像 Tab 内容 */}
          <AnimatePresence mode="wait">
            {tab === 'videos' && (
              <motion.div
                key="videos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
              >
                {videos.length === 0 ? (
                  <p className="col-span-full py-24 text-muted font-serif italic text-center">{noVideos}</p>
                ) : (
                  videos.map((video, index) => {
                    const embed = parseVideoUrl(video.videoUrl);
                    const thumbnail =
                      video.cover ||
                      embed.thumbnailUrl ||
                      'https://img.cdn1.vip/i/6997080b2d655_1771505675.webp';
                    const canPlay = !!embed.source;

                    const CardContent = (
                      <>
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play size={20} className="text-ink ml-0.5" fill="currentColor" stroke="none" />
                            </div>
                          </div>
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium">
                              {video.duration}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-serif text-ink group-hover:text-accent transition-colors line-clamp-1 mb-1">
                            {video.title}
                          </h3>
                          <p className="text-[11px] text-muted leading-snug line-clamp-2 mb-2">{video.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {video.tags?.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-ink/5 rounded text-muted"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {video.date && <span className="text-[10px] text-muted">{video.date}</span>}
                        </div>
                      </>
                    );

                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="group block rounded-xl overflow-hidden border border-ink/5 bg-white shadow-sm hover:shadow-lg hover:border-accent/20 transition-all duration-300"
                      >
                        {canPlay ? (
                          <button
                            type="button"
                            onClick={() => setPlayingVideo(video)}
                            className="w-full text-left cursor-pointer"
                          >
                            {CardContent}
                          </button>
                        ) : (
                          <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-left"
                          >
                            {CardContent}
                          </a>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 影像播放弹窗 */}
      <AnimatePresence>
        {playingVideo && (() => {
          const embed = parseVideoUrl(playingVideo.videoUrl);
          if (!embed.source) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setPlayingVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="aspect-video bg-black">
                  <iframe
                    src={embed.embedUrl}
                    title={playingVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 border-t border-ink/5">
                  <h3 className="font-serif text-ink font-medium mb-1">{playingVideo.title}</h3>
                  <p className="text-sm text-muted">{playingVideo.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  aria-label="关闭"
                >
                  <X size={20} />
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

const PhotoCard: React.FC<{ photo: Photo; index: number; hideLocation?: boolean }> = ({
  photo,
  index,
  hideLocation,
}) => {
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
