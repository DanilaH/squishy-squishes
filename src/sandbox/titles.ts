export interface SquishyTitleTier {
  readonly threshold: number;
  readonly en: string;
  readonly ru: string;
}

export const SQUISHY_TITLE_TIERS: readonly SquishyTitleTier[] = [
  { threshold: 0, en: 'Rookie', ru: 'Новичок' },
  { threshold: 2, en: 'Young Squisher', ru: 'Молодой сквишер' },
  { threshold: 5, en: 'Squisher', ru: 'Жмякатель' },
  { threshold: 8, en: 'Squishy Stylist', ru: 'Сквиш-стилист' },
  { threshold: 12, en: 'Cool Squisher', ru: 'Крутой сквишер' },
  { threshold: 16, en: 'Squish Mogul', ru: 'Сквишер-могер' },
  { threshold: 20, en: 'Squish Master', ru: 'Мастер жмяка' },
  { threshold: 24, en: 'Supreme Squisher', ru: 'Верховный сквишер' },
] as const;

export type TitleLanguage = 'en' | 'ru';

export const getSquishyTitleTier = (completedIdeaCount: number): SquishyTitleTier => {
  const normalized = Math.max(0, Math.floor(completedIdeaCount));
  let tier = SQUISHY_TITLE_TIERS[0]!;
  for (const candidate of SQUISHY_TITLE_TIERS) {
    if (candidate.threshold > normalized) break;
    tier = candidate;
  }
  return tier;
};

export const getSquishyTitle = (completedIdeaCount: number, language: TitleLanguage): string => {
  const tier = getSquishyTitleTier(completedIdeaCount);
  return language === 'ru' ? tier.ru : tier.en;
};
