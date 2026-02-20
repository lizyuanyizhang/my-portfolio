/**
 * 多语言数据：zh / en / de
 * 一键翻译：切换语言即切换整套页面内容
 */
import zh from './data.zh.json';
import en from './data.en.json';
import de from './data.de.json';

export type Lang = 'zh' | 'en' | 'de';

export const dataByLang = { zh, en, de } as const;

export const getData = (lang: Lang) => dataByLang[lang];
