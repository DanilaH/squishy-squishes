import type { StringShape } from './types';
import { en } from './en';

export const ru = {
  brand: {
    name: 'Лаборатория сквишей',
    line: 'Производственная линия · 01',
  },
  collection: {
    made: 'Сделано',
  },
  aria: {
    workbench: 'Рабочий стол сквиша',
    squishy: 'Интерактивный сквиш',
    craftSurface: 'Область взаимодействия с крафтом',
    moldTarget: 'Нажать на точку формовки',
    recipeOptions: 'Параметры рецепта',
    shapeGroup: 'Форма сквиша',
    colorGroup: 'Цвет сквиша',
    fillingGroup: 'Наполнение сквиша',
    debugControls: 'Отладочные элементы',
  },
  recipe: {
    shape: 'Форма',
    color: 'Цвет',
    texture: 'Текстура',
    make: 'Сделать сквиш',
  },
  stage: {
    kicker: 'КРАФТ 01',
    selectTitle: 'Выбери рецепт',
    selectHint: 'Выбери форму, цвет и текстуру, затем сделай сквиш.',
    pourTitle: 'Распредели основу',
    pourHint: 'Проводи по сквишу, пока поверхность не будет покрыта.',
    addTitle: 'Насыпь пенопластовые шарики',
    addHint: 'Зажми и тряси из стороны в сторону, чтобы равномерно распределить их.',
    mixTitle: 'Растяни и смешай',
    mixHint: 'Тяни сквиш в разные стороны. Если держать на месте, смешивание не идёт.',
    moldTitle: 'Сформируй его',
    moldHint: 'Нажимай на сквиш. Попадание в точку даёт критический нажим.',
    revealTitle: 'Достаём из формы…',
    testHint: 'Готово. Пожмякай сквиш, затем забери его.',
    collectedTitle: 'Добавлено в коллекцию',
    collectedHint: 'Можно сделать следующий.',
    covered: 'Покрыто.',
    scattered: 'Распределено равномерно.',
    shapeLocked: 'Форма закреплена',
    newMaterial: 'НОВЫЙ МАТЕРИАЛ',
  },
  actions: {
    collect: 'Забрать',
    mute: 'Выключить звук',
    unmute: 'Включить звук',
    metrics: 'Метрики',
    mesh: 'Сетка',
  },
  fatal: {
    title: 'Не удалось запустить Squishy Lab',
    retry: 'Перезагрузи страницу и попробуй ещё раз.',
  },
} satisfies StringShape<typeof en>;
