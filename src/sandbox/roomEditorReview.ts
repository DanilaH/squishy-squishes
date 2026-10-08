import { mountCatalogScrollHints } from './catalogScrollHints';
import type { SandboxLanguage } from './SandboxApp';
import { CATEGORY_SLOTS, ROOM_ITEMS, ROOM_SLOTS, roomItemUrl, roomItemReady, preloadRoomItems, type RoomCategory, type RoomSlot } from './roomCatalog';
import { ROOM_PALETTES } from './roomPalettes';
import { ROOM_ASSET_FRAMES } from './roomAssetFrames';
import { defaultRoomSettings, type RoomSettings } from '../platform/roomSettings';

export class RoomEditorReview {
  private disposeScrollHints: (() => void) | null = null;
  private settings: RoomSettings;
  private before: RoomSettings;
  private editing = false;
  private saving = false;
  private error = false;
  private tab: 'colors' | 'decor' = 'colors';
  private category: RoomCategory = 'furniture';
  private slot: RoomSlot = 'left';
  private events: AbortController | null = null;
  private shell: HTMLElement | null = null;

  public constructor(
    private readonly language: SandboxLanguage,
    private readonly blocked: () => boolean,
    initial: RoomSettings = defaultRoomSettings(),
    private readonly commit: (state: RoomSettings) => Promise<void> = async () => undefined,
  ) { this.settings = initial; this.before = initial; }
  private text(ru: string, en: string): string { return this.language === 'ru' ? ru : en; }
  private slotLabel(slot: RoomSlot): string {
    return ({ left: this.text('Слева', 'Left'), right: this.text('Справа', 'Right'), shelf: this.text('Полочка', 'Shelf'), wall: this.text('На стене', 'Wall'), rug: this.text('Коврик', 'Rug'), garland: this.text('Гирлянда', 'Garland'), detail: this.text('Рядом', 'Beside') })[slot];
  }
  public unmount(): void {
    this.disposeScrollHints?.(); this.disposeScrollHints = null;
    this.events?.abort(); this.events = null; this.shell = null;
    if (this.editing && !this.saving) this.settings = this.before;
    this.editing = false;
  }
  public mount(shell: HTMLElement): void {
    this.unmount(); this.shell = shell; this.events = new AbortController();
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'room-library-button room-edit-open';
    button.dataset.roomEditOpen = ''; button.textContent = this.text('Обустроить', 'Style room');
    shell.querySelector('.sandbox-library-heading__actions')?.append(button);
    const panel = document.createElement('aside');
    panel.className = 'room-editor'; panel.dataset.roomEditor = ''; panel.hidden = true;
    panel.setAttribute('aria-label', this.text('Обустройство комнаты', 'Style your room')); shell.append(panel);
    const bench = shell.querySelector('.library-showcase-workbench');
    const furniture = document.createElement('div'); furniture.className = 'room-furniture'; furniture.dataset.roomFurniture = ''; furniture.setAttribute('aria-hidden', 'true'); bench?.prepend(furniture);
    const anchors = document.createElement('div'); anchors.className = 'room-editor-slots'; anchors.dataset.roomSlots = ''; anchors.hidden = true; bench?.append(anchors);
    shell.addEventListener('click', this.click, { signal: this.events.signal });
    shell.addEventListener('change', event => {
      const select = event.target;
      if (!(select instanceof HTMLSelectElement) || !select.hasAttribute('data-room-category-select') || !this.editing || this.blocked() || this.saving) return;
      if (!(select.value in CATEGORY_SLOTS)) return;
      this.category = select.value as RoomCategory; this.slot = CATEGORY_SLOTS[this.category][0]!; this.render();
      shell.querySelector<HTMLSelectElement>('[data-room-category-select]')?.focus({preventScroll:true});
    }, { signal: this.events.signal });
    shell.addEventListener('keydown', event => { if (event.key === 'Escape' && this.editing && !this.blocked() && !this.saving) { event.preventDefault(); void this.close(false); } }, { signal: this.events.signal });
    this.apply();
  }
  private apply(): void {
    const shell = this.shell; if (!shell) return;
    const palette = ROOM_PALETTES[this.settings.palette]!;
    for (const [key, value] of Object.entries({ wall: palette.wall, floor: palette.floor, baseboard: palette.baseboard, pedestal: palette.pedestal, 'pedestal-top': palette.top, 'pedestal-rim': palette.rims })) shell.style.setProperty(`--room-${key}-color`, value);
    const furniture = shell.querySelector('[data-room-furniture]');
    if (furniture) furniture.innerHTML = ROOM_SLOTS.flatMap(slot => {
      const item = ROOM_ITEMS.find(candidate => candidate.id === this.settings.items[slot]);
      const frame = ROOM_ASSET_FRAMES[item?.id ?? ''] ?? { left: 0, top: 0, width: 512, height: 512, canvas: 512 };
      const frameStyle = `aspect-ratio:${frame.width}/${frame.height}`;
      const imageStyle = `width:${frame.canvas / frame.width * 100}%;height:${frame.canvas / frame.height * 100}%;left:${-frame.left / frame.width * 100}%;top:${-frame.top / frame.height * 100}%`;
      return item && roomItemReady(item.id) ? [`<div style="${frameStyle}" class="room-prop room-prop--${slot} room-prop--${item.id}" data-room-prop="${item.id}" data-room-prop-slot="${slot}"><img style="${imageStyle}" src="${roomItemUrl(item.id)}" alt="" draggable="false" width="512" height="512"></div>`] : [];
    }).join('');
  }
  private async close(save: boolean): Promise<void> {
    if (save) {
      this.saving = true; this.error = false; this.render();
      try { await this.commit(this.settings); }
      catch { this.saving = false; this.error = true; if (this.shell?.isConnected) this.render(); return; }
      this.saving = false;
    } else this.settings = this.before;
    this.editing = false; this.apply(); this.render();
    this.shell?.querySelector<HTMLButtonElement>('[data-room-edit-open]')?.focus({ preventScroll: true });
  }
  private render(): void {
    this.disposeScrollHints?.(); this.disposeScrollHints = null;
    const shell = this.shell, panel = shell?.querySelector<HTMLElement>('[data-room-editor]'), anchors = shell?.querySelector<HTMLElement>('[data-room-slots]');
    if (!shell || !panel || !anchors) return;
    shell.dataset.roomEditing = String(this.editing);
    const preview = shell.querySelector<HTMLButtonElement>('.library-showcase-preview'); if (preview) preview.disabled = this.editing;
    panel.hidden = !this.editing; panel.setAttribute('aria-busy', String(this.saving)); anchors.hidden = !this.editing || this.tab !== 'decor';
    if (!this.editing) return;
    const active = document.activeElement;
    const focusAttribute = active instanceof HTMLElement && panel.contains(active)
      ? ['data-room-editor-tab','data-room-theme','data-room-category','data-room-slot','data-room-item','data-room-category-select'].find(key => active.hasAttribute(key)) : undefined;
    const focusValue = focusAttribute ? active!.getAttribute(focusAttribute) ?? '' : '';
    const categories: [RoomCategory, string][] = [['furniture', this.text('Мебель', 'Furniture')], ['shelves', this.text('Полочки', 'Shelves')], ['posters', this.text('На стену', 'Wall decor')], ['rugs', this.text('Коврики', 'Rugs')], ['details', this.text('Мелочи', 'Details')]];
    const scrollTop = panel.dataset.editorTab === this.tab && panel.dataset.editorCategory === this.category && panel.dataset.editorSlot === this.slot ? panel.querySelector('.room-editor-content')?.scrollTop ?? 0 : 0;
    const categoryScroll = panel.querySelector('.room-editor-categories')?.scrollLeft ?? 0;
    panel.dataset.editorTab = this.tab; panel.dataset.editorCategory = this.category; panel.dataset.editorSlot = this.slot;
    const choices = ROOM_ITEMS.filter(item => item.category === this.category && item.slots.includes(this.slot));
    const decorNav = `<div class="room-editor-decor-nav"><select class="room-editor-category-select" data-room-category-select aria-label="${this.text('Категория предметов', 'Item category')}">${categories.map(([id,label]) => `<option value="${id}" ${id === this.category ? 'selected' : ''}>${label}</option>`).join('')}</select><div class="room-editor-categories">${categories.map(([id, label]) => `<button type="button" data-room-category="${id}" aria-pressed="${this.category === id}">${label}</button>`).join('')}</div><div class="room-editor-surfaces">${CATEGORY_SLOTS[this.category].map(id => `<button type="button" data-room-slot="${id}" aria-pressed="${this.slot === id}">${this.slotLabel(id)}</button>`).join('')}</div></div>`;
    panel.innerHTML = `<header><strong>${this.text('Твоя комната', 'Your room')}</strong><span>${this.text('Примеряй — результат виден сразу', 'Try it — see the change right away')}</span></header>
      <div class="room-editor-tabs" aria-label="${this.text('Разделы', 'Sections')}">${(['colors', 'decor'] as const).map(tab => `<button type="button" data-room-editor-tab="${tab}" aria-pressed="${tab === this.tab}">${tab === 'colors' ? this.text('Палитры', 'Palettes') : this.text('Обстановка', 'Decor')}</button>`).join('')}</div>
      ${this.tab === 'decor' ? decorNav : ''}
      <div class="room-editor-content">${this.tab === 'colors' ? `<p class="room-editor-palette-hint">${this.text('Одно сочетание для всей комнаты', 'One palette for the whole room')}</p><div class="room-editor-palettes">${ROOM_PALETTES.map((theme, index) => `<button type="button" data-room-theme="${index}" aria-pressed="${this.settings.palette === index}"><span class="room-editor-palette-preview" aria-hidden="true" style="--palette-gradient:linear-gradient(115deg, ${theme.wall}, ${theme.floor}, ${theme.top}, ${theme.rims}, ${theme.pedestal})">${this.settings.palette === index ? '✓' : ''}</span><strong>${theme[this.language]}</strong></button>`).join('')}</div>` :
        `<div class="room-editor-items"><button type="button" class="room-editor-item room-editor-item--none" data-room-item="" aria-pressed="${!this.settings.items[this.slot]}"><span aria-hidden="true">∅</span><strong>${this.text('Убрать', 'Remove')}</strong></button>${choices.map(item => `<button type="button" class="room-editor-item" ${roomItemReady(item.id) ? '' : 'disabled'} data-room-item="${item.id}" aria-pressed="${this.settings.items[this.slot] === item.id}">${roomItemReady(item.id) ? `<img src="${roomItemUrl(item.id)}" alt="" draggable="false" width="512" height="512">` : `<span aria-hidden="true">…</span>`}<strong>${item[this.language]}</strong></button>`).join('')}</div>`}</div>
      ${this.tab === 'decor' && ROOM_ITEMS.some(item => !roomItemReady(item.id)) ? `<button type="button" data-room-assets-retry>${this.text('Загрузить предметы ещё раз', 'Retry loading items')}</button>` : ''}
      ${this.error ? `<p class="room-editor-error" role="alert">${this.text('Не удалось сохранить. Попробуй ещё раз.', 'Could not save. Please try again.')}</p>` : ''}
      <footer><button type="button" data-room-edit-cancel>${this.text('Отмена', 'Cancel')}</button><button class="room-library-button--primary" type="button" data-room-edit-done>${this.saving ? this.text('Сохраняем…', 'Saving…') : this.text('Готово', 'Done')}</button></footer>`;
    this.disposeScrollHints = mountCatalogScrollHints(panel, this.events!.signal, '.room-editor-content');
    const content = panel.querySelector('.room-editor-content'); if (content) content.scrollTop = scrollTop;
    const row = panel.querySelector('.room-editor-categories'); if (row) row.scrollLeft = categoryScroll;
    if (this.saving) for (const control of panel.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select')) control.disabled = true;
    if (focusAttribute) panel.querySelector<HTMLElement>(`[${focusAttribute}="${CSS.escape(focusValue)}"]`)?.focus({preventScroll:true});
    anchors.innerHTML = CATEGORY_SLOTS[this.category].map(slot => `<button type="button" class="room-editor-slot room-editor-slot--${slot}" data-room-slot="${slot}" aria-pressed="${this.slot === slot}"><span aria-hidden="true">${this.settings.items[slot] ? '✓' : '+'}</span>${this.slotLabel(slot)}</button>`).join('');
  }
  private readonly click = (event: MouseEvent): void => {
    if (this.blocked() || this.saving) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null; if (!target) return;
    if (target.hasAttribute('data-room-edit-open')) { this.before = { ...this.settings, items: { ...this.settings.items } }; this.editing = true; this.error = false; this.render(); this.shell?.querySelector<HTMLButtonElement>('[data-room-editor-tab]')?.focus({ preventScroll: true }); return; }
    if (!this.editing) return;
    if (target.hasAttribute('data-room-assets-retry')) {
      this.saving = true; this.render();
      void preloadRoomItems().catch(() => undefined).finally(() => { this.saving = false; if (this.shell?.isConnected) { this.apply(); this.render(); } }); return;
    }
    if (target.hasAttribute('data-room-edit-cancel')) { void this.close(false); return; }
    if (target.hasAttribute('data-room-edit-done')) { void this.close(true); return; }
    const attribute = ['data-room-editor-tab', 'data-room-theme', 'data-room-category', 'data-room-slot', 'data-room-item'].find(key => target.hasAttribute(key)); if (!attribute) return;
    const value = target.getAttribute(attribute)!;
    if (attribute === 'data-room-editor-tab') this.tab = value as typeof this.tab;
    if (attribute === 'data-room-theme') { const palette = Number(value); if (!Number.isInteger(palette) || !ROOM_PALETTES[palette]) return; this.settings = { ...this.settings, palette }; this.apply(); }
    if (attribute === 'data-room-category') { this.category = value as RoomCategory; this.slot = CATEGORY_SLOTS[this.category][0]!; }
    if (attribute === 'data-room-slot') this.slot = value as RoomSlot;
    if (attribute === 'data-room-item') {
      if (value && !ROOM_ITEMS.some(item => item.id === value && item.slots.includes(this.slot))) return;
      const items = { ...this.settings.items }; if (value) items[this.slot] = value; else delete items[this.slot];
      this.settings = { ...this.settings, items }; this.apply();
    }
    this.render(); this.shell?.querySelector<HTMLButtonElement>(`[${attribute}="${value}"]`)?.focus({ preventScroll: true });
  };
}
