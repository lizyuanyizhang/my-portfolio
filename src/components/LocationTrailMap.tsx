/**
 * 地理轨迹地图
 * 聚合 timeline、photos、personalInfo 中的地点，在高德地图上绘制轨迹与标记
 * 使用 @amap/amap-jsapi-loader 官方 Loader 加载，确保安全密钥与初始化正确
 */
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { aggregateLocationPoints, getStaticCoords, type LocationPoint } from '../lib/geoTrailUtils';

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMap?: typeof AMap;
  }
}

interface LocationTrailMapProps {
  /** 聚合后的地点数据 */
  points: LocationPoint[];
  className?: string;
}

/** 加载高德地图（官方 Loader，支持安全密钥） */
let loadPromise: Promise<typeof AMap> | null = null;

function loadAmap(key: string, securityCode?: string, plugins: string[] = []): Promise<typeof AMap> {
  if (loadPromise) return loadPromise;
  if (typeof window === 'undefined') return Promise.reject(new Error('非浏览器环境'));
  const useSecurity = securityCode && import.meta.env.VITE_AMAP_SKIP_SECURITY !== '1';
  if (useSecurity) {
    (window as any)._AMapSecurityConfig = { securityJsCode: securityCode };
  } else {
    delete (window as any)._AMapSecurityConfig;
  }
  loadPromise = AMapLoader.load({
    key,
    version: '2.0',
    plugins: plugins.length ? plugins : undefined,
  }).catch((e) => {
    loadPromise = null;
    throw e;
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

    const renderMap = (AMap: typeof window.AMap, path: [number, number][], indices: number[]) => {
      if (!containerRef.current || !AMap) return;
      if (path.length === 0) {
        setStatus('error');
        setErrorMsg('无法解析任何地址');
        return;
      }
      try {
        const map = new AMap.Map(containerRef.current, {
          zoom: 4,
          center: path[0],
          viewMode: '2D',
        });
        mapInstanceRef.current = map;
        if (path.length >= 2) {
          const polyline = new AMap.Polyline({ path, strokeColor: '#8b7355', strokeWeight: 2 });
          map.add(polyline);
        }
        path.forEach((pos, i) => {
          const ptIdx = indices[i] ?? i;
          const marker = new AMap.Marker({
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

    let cancelled = false;
    const safeRender = (AMap: typeof window.AMap, path: [number, number][], indices: number[]) => {
      if (cancelled || !containerRef.current) return;
      clearTimeout(timeoutId);
      renderMap(AMap, path, indices);
    };

    // 2. 若全部可静态解析，只加载地图（无需 Geocoder），立即渲染
    if (needsGeocoder.length === 0) {
      loadAmap(key, securityCode)
        .then((AMap) => {
          safeRender(AMap, staticPath, staticIndices);
        })
        .catch((e) => {
          if (cancelled) return;
          clearTimeout(timeoutId);
          setStatus('error');
          const msg = e?.message || e?.info || String(e);
          setErrorMsg(msg || '加载失败');
        });
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }

    // 3. 否则需 Geocoder 解析剩余地址（加载时带上插件）
    loadAmap(key, securityCode, ['AMap.Geocoder'])
      .then((AMap) => {
        if (cancelled || !containerRef.current) {
          clearTimeout(timeoutId);
          return;
        }
        const GeocoderClass = (AMap as any).Geocoder;
        if (!GeocoderClass) {
          if (staticPath.length > 0) {
            safeRender(AMap, staticPath, staticIndices);
          } else if (!cancelled) {
            clearTimeout(timeoutId);
            setStatus('error');
            setErrorMsg('Geocoder 加载失败');
          }
          return;
        }
        const geocoder = new GeocoderClass({ city: '全国' });
        const path = [...staticPath];
        const indices = [...staticIndices];

        const geocodeNext = (i: number) => {
          if (cancelled) return;
          if (i >= needsGeocoder.length) {
            safeRender(AMap, path, indices);
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
        if (cancelled) return;
        clearTimeout(timeoutId);
        setStatus('error');
        const msg = e?.message || e?.info || String(e);
        setErrorMsg(msg || '加载失败');
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
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
        <p className="text-[10px] text-accent mt-2">检查 Key / 安全密钥 / 白名单，详见 AMAP_KEY_GUIDE.md</p>
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
