import React, { createContext, useContext, useState, useCallback } from 'react';
import { getData, type Lang } from '../i18n/data';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  data: ReturnType<typeof getData>;
}

const STORAGE_KEY = 'site-lang';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'zh';
    const s = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return s === 'en' || s === 'de' ? s : 'zh';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const data = getData(lang);

  const value: LanguageContextValue = { lang, setLang, data };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
