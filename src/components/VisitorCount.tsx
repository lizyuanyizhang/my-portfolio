import React, { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

/**
 * 访客量组件：展示总访客数，24h 内同一设备只计一次（近似 UV）
 * 使用 Supabase Realtime 实现多人同时观看时数字实时更新
 * 字体样式与 LifeTimer 中「张苑逸已经在地球生活了」对齐：font-serif text-ink font-semibold
 */
export const VisitorCount: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const { data } = useLanguage();
  const ui = data.ui as { visitor?: string; noData?: string } | undefined;
  const visitorTpl = ui?.visitor ?? '已经有 {count} 个人来过这里';
  const noDataText = ui?.noData ?? '暂无数据';

  // 1. 获取指纹，上报并获取当前总数
  useEffect(() => {
    if (!supabase) {
      setCount(null);
      setReady(true);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // 异步加载 fingerprint 库，避免阻塞主线程
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const fingerprintHash = result.visitorId;

        if (cancelled) return;

        // 调用 Supabase RPC：若 24h 内未访问则 +1，否则返回当前值
        const { data, error } = await supabase.rpc('increment_visitor_if_new', {
          p_fingerprint_hash: fingerprintHash,
        });

        if (cancelled) return;

        if (error) {
          console.warn('[VisitorCount] RPC error:', error.message);
          // 降级：直接读取当前值
          const { data: fallback } = await supabase
            .from('site_stats')
            .select('visitor_count')
            .eq('id', 1)
            .single();
          setCount(fallback?.visitor_count ?? null);
        } else {
          setCount(typeof data === 'number' ? data : null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[VisitorCount] Error:', e);
          setCount(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. 订阅 site_stats 变化，实现实时更新
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('site_stats_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_stats',
          filter: 'id=eq.1',
        },
        (payload) => {
          const newCount = (payload.new as { visitor_count?: number })?.visitor_count;
          if (typeof newCount === 'number') setCount(newCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 样式与 LifeTimer「张苑逸已经在地球生活了」对齐
  const baseClass =
    'font-serif text-ink font-semibold text-[10px] md:text-xs leading-tight';

  if (!ready && count === null) {
    return (
      <p className={`${baseClass} text-muted`} aria-hidden="true">
        --
      </p>
    );
  }

  if (count === null) {
    return (
      <p className={`${baseClass} text-muted`} aria-hidden="true">
        {noDataText}
      </p>
    );
  }

  const text = visitorTpl.replace('{count}', String(count));
  const countIdx = visitorTpl.indexOf('{count}');
  const before = visitorTpl.slice(0, countIdx);
  const after = visitorTpl.slice(countIdx + 7);

  return (
    <p className={baseClass} aria-label={text}>
      {before}<span className="text-accent font-bold">{count}</span>{after}
    </p>
  );
};
