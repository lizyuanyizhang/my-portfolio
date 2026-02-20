/**
 * 地理轨迹地图
 * 聚合 timeline、photos、personalInfo 中的地点，在高德地图上绘制轨迹与标记
 */
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { aggregateLocationPoints, getStaticCoords, type LocationPoint } from '../lib/geoTrailUtils';

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMap?: typeof AMap;
    initAMap?: () => void;
  }
}

interface LocationTrailMapProps {
  /** 聚合后的地点数据 */
  points: LocationPoint[];
  className?: string;
}

/** 加载高德地图脚本（不含 Geocoder，减少加载时间；静态坐标方案不依赖 Geocoder） */
let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadAmapScript(key: string, securityCode?: string): Promise<void> {
  if (scriptLoaded && window.AMap) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (securityCode) {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('高德地图脚本加载失败'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export const LocationTrailMap: React.FC<LocationTrailMapProps> = ({ points, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMap.Map | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const key = (import.meta.env.VITE_AMAP_KEY as string)?.trim();
  const securityCode = (import.meta.env.VITE_AMAP_SECURITY_CODE as string)?.trim() || undefined;

  useEffect(() => {
    if (!key) {
      setStatus('error');
      setErrorMsg('未配置高德 Key，请查看 AMAP_KEY_GUIDE.md');
      return;
    }
    if (points.length === 0) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    // 1. 先用静态坐标解析（不依赖 Geocoder，即时生效）
    const staticPath: [number, number][] = [];
    const staticIndices: number[] = [];
    const needsGeocoder: { index: number; point: LocationPoint }[] = [];
    points.forEach((pt, i) => {
      const coords = getStaticCoords(pt.location);
      if (coords) {
        staticPath.push(coords);
        staticIndices.push(i);
      } else {
        needsGeocoder.push({ index: i, point: pt });
      }
    });

    const renderMap = (path: [number, number][], indices: number[]) => {
      if (!containerRef.current || !window.AMap) return;
      if (path.length === 0) {
        setStatus('error');
        setErrorMsg('无法解析任何地址');
        return;
      }
      try {
        const map = new window.AMap!.Map(containerRef.current, {
          zoom: 4,
          center: path[0],
          viewMode: '2D',
        });
        mapInstanceRef.current = map;
        if (path.length >= 2) {
          const polyline = new window.AMap!.Polyline({ path, strokeColor: '#8b7355', strokeWeight: 2 });
          map.add(polyline);
        }
        path.forEach((pos, i) => {
          const ptIdx = indices[i] ?? i;
          const marker = new window.AMap!.Marker({
            position: pos,
            title: points[ptIdx]?.label || points[ptIdx]?.location,
          });
          map.add(marker);
        });
        map.setFitView();
        setStatus('ready');
      } catch (e) {
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : '地图初始化失败');
      }
    };

    const timeoutId = setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'error' : s));
      setErrorMsg((m) => (m ? m : '地图加载超时'));
    }, 12000);

    // 2. 若全部可静态解析，只加载地图脚本（无需 Geocoder），立即渲染
    if (needsGeocoder.length === 0) {
      loadAmapScript(key, securityCode)
        .then(() => {
          clearTimeout(timeoutId);
          renderMap(staticPath, staticIndices);
        })
        .catch((e) => {
          clearTimeout(timeoutId);
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : '加载失败');
        });
      return () => clearTimeout(timeoutId);
    }

    // 3. 否则需 Geocoder 解析剩余地址（动态加载插件）
    const loadWithGeocoder = (): Promise<void> => {
      if ((window.AMap as any)?.Geocoder) return Promise.resolve();
      return new Promise((resolve, reject) => {
        (window.AMap as any).plugin(['AMap.Geocoder'], () => resolve(), reject);
      });
    };
    loadAmapScript(key, securityCode)
      .then(() => loadWithGeocoder())
      .then(() => {
        if (!containerRef.current || !window.AMap) {
          clearTimeout(timeoutId);
          return;
        }
        const GeocoderClass = (window.AMap as any).Geocoder;
        if (!GeocoderClass) {
          clearTimeout(timeoutId);
          if (staticPath.length > 0) {
            renderMap(staticPath, staticIndices);
          } else {
            setStatus('error');
            setErrorMsg('Geocoder 加载失败');
          }
          return;
        }
        const geocoder = new GeocoderClass({ city: '全国' });
        const path = [...staticPath];
        const indices = [...staticIndices];

        const geocodeNext = (i: number) => {
          if (i >= needsGeocoder.length) {
            clearTimeout(timeoutId);
            renderMap(path, indices);
            return;
          }
          const { index: ptIdx, point: pt } = needsGeocoder[i];
          geocoder.getLocation(pt.location, (st: string, result: AMap.GeocoderResult) => {
            try {
              if (st === 'complete' && result?.geocodes?.length) {
                const loc = result.geocodes[0].location as { getLng?: () => number; getLat?: () => number; lng?: number; lat?: number };
                const lng = loc.getLng ? loc.getLng() : loc.lng ?? 0;
                const lat = loc.getLat ? loc.getLat() : loc.lat ?? 0;
                if (lng && lat) {
                  path.push([lng, lat]);
                  indices.push(ptIdx);
                }
              }
            } finally {
              geocodeNext(i + 1);
            }
          });
        };
        geocodeNext(0);
      })
      .catch((e) => {
        clearTimeout(timeoutId);
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : '加载失败');
      });

    return () => clearTimeout(timeoutId);
  }, [key, securityCode, points]);

  useEffect(() => {
    return () => {
      const map = mapInstanceRef.current;
      if (map) {
        try {
          map.destroy();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
      overlaysRef.current = [];
    };
  }, []);

  if (!key) {
    return (
      <div className={`rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-6 text-center ${className}`}>
        <MapPin className="mx-auto mb-2 text-muted" size={24} />
        <p className="text-xs text-muted">未配置高德 Key</p>
        <p className="text-[10px] text-accent mt-1">请查看项目根目录 AMAP_KEY_GUIDE.md</p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-ink/15 bg-ink/[0.02] p-6 text-center ${className}`}>
        <MapPin className="mx-auto mb-2 text-muted" size={24} />
        <p className="text-xs text-muted">暂无地理轨迹</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={`rounded-2xl border border-ink/10 bg-white/80 p-6 flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <Loader2 className="animate-spin text-accent mb-2" size={24} />
        <p className="text-xs text-muted">正在加载地图...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-6 text-center ${className}`}>
        <MapPin className="mx-auto mb-2 text-muted" size={24} />
        <p className="text-xs text-muted">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-ink/10 bg-white/80 overflow-hidden shadow-sm ${className}`}>
      <h4 className="text-[9px] uppercase tracking-widest font-bold text-muted px-4 pt-3 pb-2 font-mono">
        地理轨迹
      </h4>
      <div ref={containerRef} className="w-full h-[200px]" />
    </div>
  );
};
