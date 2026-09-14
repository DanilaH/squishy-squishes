import { en } from './en';
import { ru } from './ru';
import type { StringShape } from './types';

export type Language = 'en' | 'ru';
export type GameCopy = StringShape<typeof en>;

export const normalizeLanguage = (language: string | undefined): Language => {
  if (!language) return 'en';
  return language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

export const getGameCopy = (language: Language): GameCopy => language === 'ru' ? ru : en;
