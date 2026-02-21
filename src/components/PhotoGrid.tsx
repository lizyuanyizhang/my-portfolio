import React from 'react';
import { motion } from 'motion/react';
import { Photo } from '../types';
import { assetUrl } from '../lib/assetUrl';

export const PhotoGrid: React.FC<{ photos: Photo[] }> = ({ photos }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted/10"
        >
          <img 
            src={assetUrl(photo.url)} 
            alt={photo.caption}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 text-paper">
            <p className="text-lg font-serif mb-1">{photo.caption}</p>
            <p className="text-xs uppercase tracking-widest opacity-70">{photo.location}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
