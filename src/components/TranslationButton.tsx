import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Lang } from '../i18n/data';

const LABELS: Record<Lang, string> = { zh: '中', en: 'EN', de: 'DE' };

export const TranslationButton: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="fixed bottom-6 right-6 z-[9990] flex rounded-full bg-paper/95 backdrop-blur-md border border-ink/10 shadow-lg overflow-hidden"
      aria-label="选择语言 / Choose language"
    >
      {(['zh', 'en', 'de'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            lang === l ? 'bg-accent text-paper' : 'text-muted hover:text-ink hover:bg-ink/5'
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
};
