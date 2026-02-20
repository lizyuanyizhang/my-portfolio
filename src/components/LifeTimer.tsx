import React, { useState, useEffect } from 'react';
import { intervalToDuration } from 'date-fns';
import { useEasterEgg } from '../context/EasterEggContext';
import { useLanguage } from '../context/LanguageContext';

export const LifeTimer: React.FC = () => {
  const birthDate = new Date(1997, 2, 4, 19, 6); // Month 0-indexed, 2 = March
  const [now, setNow] = useState(new Date());
  const easterEgg = useEasterEgg();
  const { data } = useLanguage();
  const ui = data.ui as { lifeTimerName?: string; lifeTimerSuffix?: string; lifeTimerUnits?: string[] } | undefined;
  const name = ui?.lifeTimerName ?? '张苑逸';
  const suffix = ui?.lifeTimerSuffix ?? '已经在地球生活了';
  const units = ui?.lifeTimerUnits ?? ['年','月','天','时','分','秒'];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const duration = intervalToDuration({ start: birthDate, end: now });

  return (
    <div
      className="flex items-center gap-1 font-mono text-[10px] md:text-xs text-muted whitespace-nowrap overflow-hidden cursor-pointer"
      onClick={(e) => {
        easterEgg?.incrementLogoClicks(e, (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          easterEgg.setCharacterVisible(true);
        });
      }}
    >
      <span
        className="font-serif text-ink font-semibold mr-1"
        onClick={(e) => {
          e.stopPropagation();
          easterEgg?.incrementNameClicks(e, (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            easterEgg.showKeywordToast('被你发现了！✨');
          });
        }}
      >
        {name}
      </span>
      {' '}{suffix}{' '}
      <span className="text-accent font-bold">{duration.years}</span>{units[0]}
      <span className="text-accent font-bold">{duration.months}</span>{units[1]}
      <span className="text-accent font-bold">{duration.days}</span>{units[2]}
      <span className="text-accent font-bold">{duration.hours}</span>{units[3]}
      <span className="text-accent font-bold">{duration.minutes}</span>{units[4]}
      <span className="text-accent font-bold">{duration.seconds}</span>{units[5]}
    </div>
  );
};
