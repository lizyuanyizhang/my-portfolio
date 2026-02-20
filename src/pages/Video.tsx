import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Play, X } from 'lucide-react';
import type { Video as VideoType } from '../types';
import { parseVideoUrl } from '../lib/videoEmbed';

export const Video: React.FC = () => {
  const { data } = useLanguage();
  const videos = ((data as { videos?: VideoType[] }).videos ?? []) as VideoType[];
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);

  return (
    <div className="pt-24 pb-24 px-6 md:px-10 min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10">
            <p className="text-muted font-serif italic text-base">
              记录生活碎片、AI 生成的视觉实验，用影像留住当下的感受。
            </p>
          </div>

          {/* 与应用页一致的紧凑网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {videos.length === 0 ? (
              <p className="col-span-full py-24 text-muted font-serif italic text-center">
                在 data.json 的 videos 数组中添加视频即可展示。支持 YouTube、B 站链接。
              </p>
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
                      <p className="text-[11px] text-muted leading-snug line-clamp-2 mb-2">
                        {video.description}
                      </p>
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
                      <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-left">
                        {CardContent}
                      </a>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* 播放弹窗 */}
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
    </div>
  );
};
