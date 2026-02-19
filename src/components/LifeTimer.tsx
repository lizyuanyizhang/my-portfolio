import React, { useState, useEffect } from 'react';
import { intervalToDuration, formatDuration } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const LifeTimer: React.FC = () => {
  const birthDate = new Date(1997, 2, 4, 19, 6); // Note: Month is 0-indexed, so 2 is March
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const duration = intervalToDuration({
    start: birthDate,
    end: now,
  });

  return (
    <div className="flex items-center gap-1 font-mono text-[10px] md:text-xs text-muted whitespace-nowrap overflow-hidden">
      <span className="font-serif text-ink font-semibold mr-1">张苑逸已经在地球生活了</span>
      <span className="text-accent font-bold">{duration.years}</span>年
      <span className="text-accent font-bold">{duration.months}</span>月
      <span className="text-accent font-bold">{duration.days}</span>天
      <span className="text-accent font-bold">{duration.hours}</span>时
      <span className="text-accent font-bold">{duration.minutes}</span>分
      <span className="text-accent font-bold">{duration.seconds}</span>秒
    </div>
  );
};
