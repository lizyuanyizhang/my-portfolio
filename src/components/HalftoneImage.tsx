/**
 * 网点效果图片 · 将原图转为 halftone 网点风格（参考蜥蜴样片）
 * 使用 Canvas 采样亮度，按网格绘制圆点，暗部点大、亮部点小
 */
import React, { useEffect, useRef, useState } from 'react';

interface HalftoneImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** 网格密度（每行/列点数），越大越细腻 */
  gridSize?: number;
  /** 最大圆点半径（占格子比例 0~0.5） */
  maxDotRatio?: number;
}

/** 亮度公式 (ITU-R BT.709) */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const HalftoneImage: React.FC<HalftoneImageProps> = ({
  src,
  alt = '',
  className = '',
  gridSize = 120,
  maxDotRatio = 0.48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const maxW = 600;
      const maxH = 800;
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        const scale = Math.min(maxW / w, maxH / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      setDim({ w, h });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. 绘制原图并转为灰度
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 2. 清空，用浅色底
      ctx.fillStyle = '#f8f8f4';
      ctx.fillRect(0, 0, w, h);

      // 3. 按网格采样亮度，绘制网点
      const cellW = w / gridSize;
      const cellH = h / gridSize;
      const maxR = Math.min(cellW, cellH) * 0.5 * maxDotRatio;

      ctx.fillStyle = '#2a2a2a';

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x0 = (col + 0.5) * cellW;
          const y0 = (row + 0.5) * cellH;
          const px = Math.floor(x0);
          const py = Math.floor(y0);
          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          const i = (py * w + px) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = luminance(r, g, b); // 0~255
          const darkness = 1 - lum / 255; // 0=白 1=黑
          const radius = maxR * Math.sqrt(darkness); // 暗部大点

          if (radius > 0.5) {
            ctx.beginPath();
            ctx.arc(x0, y0, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

    };

    img.onerror = () => {};
    img.src = src;
  }, [src, gridSize, maxDotRatio]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: dim.w ? '100%' : undefined,
        height: dim.w ? 'auto' : undefined,
        maxWidth: '100%',
      }}
      aria-hidden={!alt}
    />
  );
};
