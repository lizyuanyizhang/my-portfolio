/**
 * 地理位置 + 当地时间实时显示
 * 基于系统时区推断城市，不弹定位授权
 * 审美参考：浅灰背景、深灰文字、极简
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Lang } from '../i18n/data';

/** 常见时区城市名的多语言映射 */
const CITY_LOCALE: Record<string, Record<Lang, string>> = {
  Shanghai: { zh: '上海', en: 'Shanghai', de: 'Shanghai' },
  Beijing: { zh: '北京', en: 'Beijing', de: 'Peking' },
  Hong_Kong: { zh: '香港', en: 'Hong Kong', de: 'Hongkong' },
  Tokyo: { zh: '东京', en: 'Tokyo', de: 'Tokio' },
  Seoul: { zh: '首尔', en: 'Seoul', de: 'Seoul' },
  Singapore: { zh: '新加坡', en: 'Singapore', de: 'Singapur' },
  London: { zh: '伦敦', en: 'London', de: 'London' },
  Paris: { zh: '巴黎', en: 'Paris', de: 'Paris' },
  Berlin: { zh: '柏林', en: 'Berlin', de: 'Berlin' },
  Munich: { zh: '慕尼黑', en: 'Munich', de: 'München' },
  Frankfurt: { zh: '法兰克福', en: 'Frankfurt', de: 'Frankfurt' },
  Amsterdam: { zh: '阿姆斯特丹', en: 'Amsterdam', de: 'Amsterdam' },
  New_York: { zh: '纽约', en: 'New York', de: 'New York' },
  Los_Angeles: { zh: '洛杉矶', en: 'Los Angeles', de: 'Los Angeles' },
  San_Francisco: { zh: '旧金山', en: 'San Francisco', de: 'San Francisco' },
  Chicago: { zh: '芝加哥', en: 'Chicago', de: 'Chicago' },
  Sydney: { zh: '悉尼', en: 'Sydney', de: 'Sydney' },
  Melbourne: { zh: '墨尔本', en: 'Melbourne', de: 'Melbourne' },
  Toronto: { zh: '多伦多', en: 'Toronto', de: 'Toronto' },
  Vancouver: { zh: '温哥华', en: 'Vancouver', de: 'Vancouver' },
};

function getCityFromTimezone(timezone: string): string {
  const parts = timezone.split('/');
  return (parts[parts.length - 1] ?? '').replace(/_/g, ' ');
}

function getLocalizedCity(rawCity: string, lang: Lang): string {
  const key = rawCity.replace(/ /g, '_');
  const mapped = CITY_LOCALE[key];
  if (mapped) return mapped[lang];
  return rawCity;
}

function formatTime(timezone: string): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const LocationClock: React.FC = () => {
  const { lang } = useLanguage();
  const [timezone, setTimezone] = useState<string>('');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    setTime(formatTime(tz));

    const timer = setInterval(() => {
      setTime(formatTime(tz));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timezone) return null;

  const rawCity = getCityFromTimezone(timezone);
  const city = getLocalizedCity(rawCity, lang);

  return (
    <span
      className="font-mono text-xs font-medium text-ink/80 shrink-0 tabular-nums"
      aria-label={`${city} ${time}`}
    >
      {city} {time}
    </span>
  );
};
