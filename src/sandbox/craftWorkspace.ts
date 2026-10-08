/** Compose the existing authoring tools into one freely navigable workspace. */
export function mountCraftWorkspace(root: HTMLElement, ru: boolean): void {
  const get = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Craft workspace missing ${selector}`);
    return node;
  };
  get('[data-sandbox-app]').dataset.craftWorkspace = 'true';
  const nav = document.createElement('nav');
  nav.className = 'craft-sections'; nav.setAttribute('aria-label', ru ? 'Разделы мастерской' : 'Workshop sections');
  nav.innerHTML = [['shape', ru ? 'Основа' : 'Base'], ['paint', ru ? 'Раскраска' : 'Paint'],
    ['mixins', ru ? 'Наполнители' : 'Fillings'], ['decor', ru ? 'Украшения' : 'Decor']]
    .map(([section, label]) => `<button type="button" data-craft-section="${section}" aria-pressed="false">${label}</button>`).join('');
  get('.sandbox-copy').append(nav);

  const base = get('[data-panel="shape"]');
  const tabs = document.createElement('div'); tabs.className = 'craft-base-tabs';
  tabs.innerHTML = [['shape', ru ? 'Форма' : 'Shape'], ['material', ru ? 'Материал' : 'Material'], ['light', ru ? 'Свет' : 'Light']]
    .map(([id, label]) => `<button type="button" data-base-tab="${id}" aria-pressed="${id === 'shape'}">${label}</button>`).join('');
  base.prepend(tabs);
  get('.free-shape-catalog').dataset.basePanel = 'shape';
  for (const id of ['material', 'light']) {
    const panel = get(`[data-finish-panel="${id}"]`);
    panel.dataset.basePanel = id; panel.hidden = true; base.append(panel);
  }
  const footer = document.createElement('div'); footer.className = 'craft-actions';
  footer.innerHTML = `<div class="free-history-bar"><button type="button" data-action="draft-undo" aria-label="${ru ? 'Отменить' : 'Undo'}">↶</button><button type="button" data-action="draft-redo" aria-label="${ru ? 'Вернуть' : 'Redo'}">↷</button></div><button type="button" data-action="try-on">${ru ? 'Потрогать' : 'Try it'}</button>`;
  const save = get<HTMLButtonElement>('[data-action="save"]'); save.textContent = ru ? 'Сохранить' : 'Save'; footer.append(save);
  get('[data-panel="finish"] [data-action="try-on"]').remove();
  get('.sandbox-controls').append(footer);
  // Primary actions have one shared owner; the old sequential navigation is retired.
  for (const row of root.querySelectorAll<HTMLElement>('.free-craft-footer, .sandbox-tool-row--actions, .sandbox-finish-actions')) {
    if (row.closest('[data-panel="paint"]')) {
      const clear = row.querySelector('[data-action="paint-clear"]');
      if (clear) get('.sandbox-tools-dialog').insertBefore(clear, get('[data-action="tools-close"]'));
    }
    if (row.closest('[data-panel="mixins"]')) {
      const eraser = row.querySelector('[data-action="mixin-erase"]');
      if (eraser) get('.free-mixin-catalog').prepend(eraser);
    }
    if (row.closest('[data-decor-panel="stickers"]')) continue;
    row.hidden = true;
  }
  const tools = get('.sandbox-paint-tools');
  const mixinTools = document.createElement('div'); mixinTools.className = 'craft-mixin-tools';
  mixinTools.append(get('[data-action="mixin-erase"]'));
  const mixinSettings = document.createElement('button'); mixinSettings.type = 'button';
  mixinSettings.dataset.action = 'mixin-settings'; mixinSettings.setAttribute('aria-expanded', 'false');
  mixinSettings.textContent = ru ? 'Настройки' : 'Settings';
  mixinTools.append(mixinSettings, get('[data-action="mixin-clear"]'));
  get('[data-panel="mixins"]').append(mixinTools);
  get('.free-mixin-settings').hidden = true;
  const sizes = document.createElement('div'); sizes.className = 'craft-brush-sizes';
  sizes.setAttribute('aria-label', ru ? 'Размер кисти' : 'Brush size');
  for (const size of root.querySelectorAll('[data-brush-size]')) sizes.append(size);
  get('.sandbox-tools-dialog').insertBefore(sizes, get('.sandbox-theme-choices'));
  const settings = document.createElement('button'); settings.type = 'button'; settings.dataset.action = 'paint-settings';
  settings.textContent = ru ? 'Настройки' : 'Settings'; tools.append(settings);
  settings.setAttribute('aria-haspopup', 'dialog'); settings.setAttribute('aria-expanded', 'false');
}
