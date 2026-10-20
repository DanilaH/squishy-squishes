import type { StickerId } from './decor';
export const STICKER_LABELS: Readonly<Record<'en' | 'ru', Readonly<Record<StickerId, string>>>> = {
  en: { heart: 'Heart', star: 'Star', flower: 'Flower', sparkle: 'Sparkle', candy:'Candy', donut:'Donut', strawberry:'Strawberry', lightning:'Lightning', flame:'Flame', skull:'Skull', planet:'Planet', eye:'Eye', ghost:'Ghost', bone:'Bone' },
  ru: { heart: 'Сердце', star: 'Звезда', flower: 'Цветок', sparkle: 'Искра', candy:'Конфета', donut:'Пончик', strawberry:'Клубника', lightning:'Молния', flame:'Пламя', skull:'Череп', planet:'Планета', eye:'Глаз', ghost:'Призрак', bone:'Косточка' },
};
