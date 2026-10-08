import '../app/styles/screen-polish.css';
import { libraryCraftProps } from '../experiments/phaser/libraryCraftProps';
import { libraryCraftCameraScale } from './libraryCraftFit';
import { mountLibraryPersonality } from './libraryPersonality';
import type { RoomEditorReview } from './roomEditorReview';
import { cardPagerMarkup, showCardPage } from './cardPages';
import { getShape } from '../game/shapes';
import { SandboxApp, type SandboxAppOptions, type SandboxLanguage } from './SandboxApp';
import {
  SQUISHY_IDEAS,
  getIdeaLabel,
  getIdeaMaterialLabel,
  getIdeaMixinLabel,
  getIdeaShapeLabel,
  type SquishyIdea,
} from './ideas';
import { renderLibraryThumbnail, releasePagesLibraryMaterialLighting } from './libraryThumbnail';
import { captureModalReturnFocus, focusModal, restoreModalFocus, trapModalTab } from './modalFocus';
import { getSquishyTitle } from './titles';
import { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';
import { createBodyFillStroke, createMixInPlacement } from './appearance';
import { mountCatalogScrollHints } from './catalogScrollHints';

export interface SandboxLibraryCommitResult {
  readonly savedSquishy: SavedSquishy;
  readonly library: readonly SavedSquishy[];
  readonly completedRecipeIds: readonly string[];
}

export interface SandboxLibraryAppOptions {
  /** Owner review of the room foundation; published Library stays unchanged. */
  readonly roomReview?: boolean;
  readonly createRoomEditor?: (blocked: () => boolean) => RoomEditorReview;
  readonly language: SandboxLanguage;
  readonly muted: boolean;
  readonly initialLibrary: readonly SavedSquishy[];
  readonly initialCompletedRecipeIds: readonly string[];
  readonly libraryCapacity: number;
  readonly shelfExpansionTargetCapacity: number;
  readonly onUnlockShelfExpansion: () => Promise<{ readonly granted: boolean; readonly libraryCapacity: number; readonly status: 'closed' | 'error' }>;
  readonly onAppendSquishy: (draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;
  readonly onReplaceSquishy: (targetId: string, draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;
  readonly onUpdateSquishy: (targetId: string, draft: SandboxDraft) => Promise<SandboxLibraryCommitResult>;
  readonly onDeleteSquishy: (targetId: string) => Promise<readonly SavedSquishy[]>;
  /** Candidate-only renderer port. Ordinary library bootstrap leaves it absent. */
  readonly makerRendererOptions?: Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>;
  /** Optional lazy renderer seam: keeps Phaser out of the first Library paint. */
  readonly loadMakerRendererOptions?: () => Promise<Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>>;
  readonly onMutedChange: (muted: boolean) => void | Promise<void>;
}

interface LibraryCopy {
  readonly studio: string;
  readonly title: string;
  readonly emptyTitle: string;
  readonly emptyHint: string;
  readonly newSquishy: string;
  readonly squeeze: string;
  readonly delete: string;
  readonly deleteTitle: string;
  readonly deleteHint: string;
  readonly deleteConfirm: string;
  readonly cancel: string;
  readonly replaceTitle: string;
  readonly replaceHint: string;
  readonly replaceAction: string;
  readonly full: string;
  readonly sound: string;
  readonly muted: string;
  readonly saveFailed: string;
  readonly ideas: string;
  readonly ideasTitle: string;
  readonly ideasHint: string;
  readonly backToLibrary: string;
  readonly completed: string;
  readonly goal: string;
  readonly ideaComplete: string;
  readonly rewardEyebrow: string;
  readonly rewardTitle: string;
  readonly rewardHint: string;
  readonly rewardAction: string;
  readonly rewardExpanded: string;
  readonly rewardUnavailable: string;
  readonly studioLoading: string;
  readonly studioUnavailable: string;
}


const COPY: Readonly<Record<SandboxLanguage, LibraryCopy>> = {
  en: {
    studio: 'SQUISHY STUDIO',
    title: 'MY SQUISHIES',
    emptyTitle: 'YOUR SHELF IS WAITING',
    emptyHint: 'Make your first squishy and it will live here.',
    newSquishy: 'NEW SQUISHY',
    squeeze: 'Squeeze',
    delete: 'Delete',
    deleteTitle: 'LET THIS ONE GO?',
    deleteHint: 'This removes only this saved squishy.',
    deleteConfirm: 'DELETE',
    cancel: 'KEEP IT',
    replaceTitle: 'WHERE SHOULD THE NEW ONE LIVE?',
    replaceHint: 'Your shelf is full. Choose an old squishy, then confirm the replacement. The old one will be removed.',
    replaceAction: 'Select',
    full: 'Shelf full — you can still make another.',
    sound: 'Sound on',
    muted: 'Sound off',
    saveFailed: 'Could not update the shelf. Try again.',
    ideas: 'IDEAS',
    ideasTitle: 'SQUISHY IDEAS',
    ideasHint: 'Pick a target if you want a little inspiration. You can still make it your way.',
    backToLibrary: 'BACK TO LIBRARY',
    completed: 'DONE',
    goal: 'IDEA',
    ideaComplete: 'IDEA COMPLETE',
    rewardEyebrow: 'OPTIONAL UPGRADE',
    rewardTitle: 'MAKE ROOM FOR TWO MORE',
    rewardHint: 'Watch one ad to keep 10 squishies on this shelf forever.',
    rewardAction: 'WATCH AD · +2 SLOTS',
    rewardExpanded: 'Shelf expanded · 10 slots',
    rewardUnavailable: 'No shelf change. Try again when you want.',
    studioLoading: 'Opening the studio…',
    studioUnavailable: 'The studio could not start. Try again or use another browser.',
  },
  ru: {
    studio: 'СКВИШ-СТУДИЯ',
    title: 'МОИ СКВИШИ',
    emptyTitle: 'ПОЛКА ЖДЁТ',
    emptyHint: 'Сделай первый сквиш — он поселится здесь.',
    newSquishy: 'НОВЫЙ СКВИШ',
    squeeze: 'Пожмякать',
    delete: 'Удалить',
    deleteTitle: 'УБРАТЬ ЭТОТ СКВИШ?',
    deleteHint: 'Удалится только этот сохранённый сквиш.',
    deleteConfirm: 'УДАЛИТЬ',
    cancel: 'ОСТАВИТЬ',
    replaceTitle: 'КУДА ПОСЕЛИТЬ НОВЫЙ?',
    replaceHint: 'Полка заполнена. Выбери старый сквиш и подтверди замену. Старый экземпляр будет удалён.',
    replaceAction: 'Выбрать',
    full: 'Полка заполнена — новый сквиш всё равно можно сделать.',
    sound: 'Звук вкл.',
    muted: 'Звук выкл.',
    saveFailed: 'Не получилось обновить полку. Попробуй ещё раз.',
    ideas: 'ИДЕИ',
    ideasTitle: 'ИДЕИ ДЛЯ СКВИШЕЙ',
    ideasHint: 'Выбери цель для вдохновения. Делать по-своему всё равно можно.',
    backToLibrary: 'НАЗАД К ПОЛКЕ',
    completed: 'ГОТОВО',
    goal: 'ИДЕЯ',
    ideaComplete: 'ИДЕЯ ГОТОВА',
    rewardEyebrow: 'НЕОБЯЗАТЕЛЬНО',
    rewardTitle: 'ЕЩЁ ДВА МЕСТА НА ПОЛКЕ',
    rewardHint: 'Посмотри одну рекламу — и навсегда храни здесь до 10 сквишей.',
    rewardAction: 'РЕКЛАМА · +2 МЕСТА',
    rewardExpanded: 'Полка расширена · 10 мест',
    rewardUnavailable: 'Полка не изменилась. Можно попробовать позже.',
    studioLoading: 'Открываем студию…',
    studioUnavailable: 'Не удалось открыть студию. Попробуй ещё раз или открой игру в другом браузере.',
  },
};

const escapeAttribute = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const RU_SHAPES: Readonly<Record<SavedSquishy['shapeId'], string>> = {
  'soft-square': 'Кубик',
  heart: 'Сердечко',
  mochi: 'Моти',
  peach: 'Персик',
  mushroom: 'Грибочек',
  paw: 'Лапка',
  dumpling: 'Дамплинг',
  strawberry: 'Клубничка',
  donut: 'Пончик',
  bun: 'Булочка', 'ice-cream': 'Мороженое', cupcake: 'Кексик', watermelon: 'Арбузик', 'mochi-cat': 'Котик-моти', 'mochi-bunny': 'Зайчик-моти',
};

const EN_SHAPES: Readonly<Record<SavedSquishy['shapeId'], string>> = {
  'soft-square': 'Soft Cube',
  heart: 'Heart',
  mochi: 'Mochi',
  peach: 'Peach',
  mushroom: 'Mushroom',
  paw: 'Paw',
  dumpling: 'Dumpling',
  strawberry: 'Strawberry',
  donut: 'Donut',
  bun: 'Puffy Bun', 'ice-cream': 'Ice Cream', cupcake: 'Cupcake', watermelon: 'Watermelon', 'mochi-cat': 'Mochi Cat', 'mochi-bunny': 'Mochi Bunny',
};

const RU_MATERIALS: Readonly<Record<SavedSquishy['materialId'], string>> = {
  soft: 'Мягкий',
  jelly: 'Желе',
  holo: 'Голографик',
  marshmallow: 'Маршмеллоу',
  pearl: 'Перламутр',
  chrome: 'Металлик',
};

const EN_MATERIALS: Readonly<Record<SavedSquishy['materialId'], string>> = {
  soft: 'Soft',
  jelly: 'Jelly',
  holo: 'Holo',
  marshmallow: 'Marshmallow',
  pearl: 'Pearl',
  chrome: 'Metallic',
};

interface PendingReplacement {
  readonly draft: SandboxDraft;
  readonly ideaId: string | null;
  selectedId?: string;
  readonly resolve: (saved: SavedSquishy | null) => void;
}

export class SandboxLibraryApp {
  private readonly abortController = new AbortController();
  private readonly copy: LibraryCopy;
  private library: readonly SavedSquishy[];
  private completedRecipeIds: readonly string[];
  private libraryCapacity: number;
  private muted: boolean;
  private rewardInFlight = false;
  private rewardMessage: string | null = null;
  private activeIdea: SquishyIdea | null = null;
  private currentMaker: SandboxApp | null = null;
  private selectedToyId: string | null = null;
  private roomView: 'room' | 'collection' | 'squeeze' = 'room';
  private roomReturnView: 'room' | 'collection' = 'room';
  private collectionScrollTop = 0;
  private collectionManaging = false;
  private presentationObserver: MutationObserver | null = null;
  private pendingReplacement: PendingReplacement | null = null;
  private pendingDeleteId: string | null = null;
  private disposeScrollHints: (() => void) | null = null;
  private modalReturnFocus: HTMLElement | null = null;
  private loadedMakerRendererOptions: Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'> | null = null;
  private makerRendererLoad: Promise<Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>> | null = null;
  private makerStartToken = 0;
  private activityBlocked = false;
  private disposed = false;
  private readonly personality: ReturnType<typeof mountLibraryPersonality>;
  private readonly roomEditor: RoomEditorReview | null;

  public constructor(
    private readonly root: HTMLDivElement,
    private readonly options: SandboxLibraryAppOptions,
  ) {
    this.copy = COPY[options.language];
    this.library = [...options.initialLibrary];
    this.completedRecipeIds = [...options.initialCompletedRecipeIds];
    this.libraryCapacity = options.libraryCapacity;
    this.muted = options.muted;
    this.roomEditor = options.roomReview ? options.createRoomEditor?.(() => this.activityBlocked) ?? null : null;
    this.root.addEventListener('click', this.handleClick, { signal: this.abortController.signal });
    this.root.addEventListener('keydown', this.handleKeyDown, { signal: this.abortController.signal });
    window.addEventListener('resize', () => this.updateIdeaPages(), { signal: this.abortController.signal });
    this.personality = mountLibraryPersonality(root, id => this.library.find(toy => toy.id === id), () => this.activityBlocked);
    this.renderLibrary();
  }

  public setActivityBlocked(blocked: boolean): void {
    if (this.disposed) return;
    this.activityBlocked = blocked;
    if (!this.currentMaker) this.personality.schedule();
    this.currentMaker?.setActivityBlocked(blocked || Boolean(this.root.querySelector('[data-library-delete-overlay], [data-library-replace-overlay]')));
    this.root.querySelector<HTMLElement>('[data-sandbox-library], [data-sandbox-ideas]')?.classList.toggle('is-blocked', blocked);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.personality.dispose();
    this.disposeScrollHints?.(); this.disposeScrollHints = null;
    this.roomEditor?.unmount();
    this.cancelPendingMakerStart();
    this.pendingReplacement?.resolve(null);
    this.pendingReplacement = null;
    this.presentationObserver?.disconnect();
    this.presentationObserver = null;
    this.currentMaker?.dispose();
    this.currentMaker = null;
    releasePagesLibraryMaterialLighting();
    this.abortController.abort();
    this.root.replaceChildren();
  }

  private renderLibrary(): void {
    this.disposeScrollHints?.(); this.disposeScrollHints = null;
    this.roomEditor?.unmount();
    this.personality.stop();
    this.cancelPendingMakerStart();
    this.presentationObserver?.disconnect();
    this.presentationObserver = null;
    this.currentMaker?.dispose();
    this.currentMaker = null;
    this.activeIdea = null;
    this.pendingDeleteId = null;
    const count = this.library.length;
    const capacity = this.libraryCapacity;
    const full = count >= capacity;
    const canExpandShelf = capacity < this.options.shelfExpansionTargetCapacity;
    const selected = this.library.find(toy => toy.id === this.selectedToyId) ?? this.library.at(-1);
    this.selectedToyId = selected?.id ?? null;
    if (this.options.roomReview) {
      this.renderRoomLibrary(selected);
      return;
    }
    const cards = this.library.map((toy) => this.renderToyCard(toy)).join('');
    const ru = this.options.language === 'ru';
    const slots = Array.from({ length: Math.max(0, capacity - count) }, (_, index) => `<button class="library-showcase-slot" type="button" data-library-new aria-label="${this.copy.newSquishy} · ${count + index + 1}"><span aria-hidden="true">+</span><small>${ru ? 'Свободное место' : 'Room for a new one'}</small></button>`).join('');

    this.root.innerHTML = `
      <main class="sandbox-library-shell${this.activityBlocked ? ' is-blocked' : ''}" data-sandbox-library data-stage="library" data-library-count="${count}" data-library-capacity="${capacity}" data-room-managing="${this.collectionManaging}">
        <header class="sandbox-library-topbar">
          <strong>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-library-mute aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>
        <section class="sandbox-library-heading">
          <div>
            <span class="sandbox-library-status">${getSquishyTitle(this.completedRecipeIds.length, this.options.language)} · ${count} / ${capacity}</span>
            <h1>${this.copy.title}</h1>
          </div>
          <div class="sandbox-library-heading__actions">
            <button class="sandbox-library-ideas" type="button" data-library-ideas>${this.copy.ideas}</button>
            <button class="sandbox-library-new" type="button" data-library-new>${this.copy.newSquishy}</button>
          </div>
        </section>
        <section class="library-showcase" data-library-hall-stage>
          <section class="library-showcase-collection" aria-label="${this.copy.title}">
            <div class="library-showcase-collection__heading"><strong>${ru ? 'Твоя коллекция' : 'Your collection'}</strong><button class="room-library-button" type="button" data-room-manage aria-pressed="${this.collectionManaging}">${this.collectionManaging ? (ru ? 'Готово' : 'Done') : (ru ? 'Управлять' : 'Manage')}</button></div>
            <div class="sandbox-library-grid" tabindex="0" aria-label="${ru ? 'Полка сквишей' : 'Squishy shelf'}">${cards}${slots}</div><div class="library-showcase-materials" aria-hidden="true">${libraryCraftProps('supplies')}</div>
          </section>
          <section class="library-showcase-workbench" aria-label="${ru ? 'Стол для мятия' : 'Squeeze table'}">
            <div class="library-showcase-toy" data-library-display-host>
              ${selected ? `<button type="button" class="library-showcase-preview" data-library-select-id="${escapeAttribute(selected.id)}" aria-label="${this.copy.squeeze}: ${this.toyLabel(selected)}"><canvas data-library-display aria-hidden="true"></canvas></button>` : `<div class="library-showcase-welcome"><span aria-hidden="true">✦</span><h2>${this.copy.emptyTitle}</h2><p>${this.copy.emptyHint}</p></div>`}
            </div>
            <div class="library-showcase-table" aria-hidden="true"><span></span></div>
            <div class="library-showcase-selected" data-library-selection aria-live="polite">
              ${selected ? `<strong>${this.toyLabel(selected)}</strong><span>${ru ? 'Нажми на сквиш, чтобы помять' : 'Tap your squishy to squeeze'}</span>` : `<button class="sandbox-library-new" type="button" data-library-new>${this.copy.newSquishy}</button>`}
            </div>
            <div class="library-showcase-supplies" aria-hidden="true">${libraryCraftProps('lamp')}</div>
          </section>
        </section>
          ${full ? `
            <section class="sandbox-library-full-zone">
              <p class="sandbox-library-full-note">${this.copy.full}</p>
              ${canExpandShelf ? `
                <aside class="sandbox-library-reward" data-library-reward-offer>
                  <div class="sandbox-library-reward__copy">
                    <span>${this.copy.rewardEyebrow}</span>
                    <strong>${this.copy.rewardTitle}</strong>
                    <p>${this.copy.rewardHint}</p>
                  </div>
                  <button type="button" data-library-expand-reward ${this.rewardInFlight ? 'disabled' : ''}>${this.copy.rewardAction}</button>
                </aside>
              ` : ''}
            </section>
          ` : ''}
          ${this.rewardMessage ? `<p class="sandbox-library-reward-message" data-library-reward-message aria-live="polite">${this.rewardMessage}</p>` : ''}
        <p class="sandbox-library-reward-message" data-library-maker-error aria-live="polite" hidden></p>
      </main>
    `;
    this.renderVisibleThumbnails();
    this.disposeScrollHints = mountCatalogScrollHints(this.root, this.abortController.signal, '.sandbox-library-grid');
    const catalog = this.root.querySelector<HTMLElement>('.sandbox-library-grid');
    if (catalog) catalog.scrollTop = this.collectionScrollTop;
    const display = this.root.querySelector<HTMLCanvasElement>('[data-library-display]');
    if (display && selected) renderLibraryThumbnail(display, selected, 512);
    this.personality.schedule();
  }

  /** Same saved toys and same maker, with separate exhibit/catalog views. */
  private renderRoomLibrary(selected: SavedSquishy | undefined): void {
    const ru = this.options.language === 'ru';
    const count = this.library.length;
    const position = this.library.findIndex(toy => toy.id === selected?.id);
    const collection = this.roomView === 'collection';
    const reward = count >= this.libraryCapacity && this.libraryCapacity < this.options.shelfExpansionTargetCapacity ? `<button class="room-library-button" type="button" data-library-expand-reward ${this.rewardInFlight ? 'disabled' : ''}>${ru ? 'Реклама · +2 места' : 'Ad · +2 slots'}</button>` : '<span aria-hidden="true"></span>';
    const footer = collection
      ? `<span></span>${reward}`
      : `<button class="room-library-button" type="button" data-library-ideas>${this.copy.ideas}</button><button class="room-library-button room-library-button--primary" type="button" data-room-collection>${ru ? 'Вся коллекция' : 'All squishies'}</button>${reward}`;
    const slots = Array.from({ length: Math.max(0, this.libraryCapacity - count) }, (_, index) => `<button class="library-showcase-slot" type="button" data-library-new aria-label="${this.copy.newSquishy} · ${count + index + 1}"><span aria-hidden="true">+</span><small>${ru ? 'Свободное место' : 'New squishy'}</small></button>`).join('');
    this.root.innerHTML = `
      <main class="sandbox-library-shell is-library-hall room-library${this.activityBlocked ? ' is-blocked' : ''}" data-sandbox-library data-stage="library" data-room-view="${this.roomView}" data-room-managing="${this.collectionManaging}" data-library-count="${count}" data-library-capacity="${this.libraryCapacity}">
        <header class="sandbox-library-topbar"><strong>${this.copy.studio}</strong><button class="sandbox-sound" type="button" data-library-mute aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button></header>
        <section class="sandbox-library-heading"><div><span class="sandbox-library-status">${count} / ${this.libraryCapacity}</span><h1>${collection ? (ru ? 'КОЛЛЕКЦИЯ' : 'COLLECTION') : this.copy.title}</h1></div><div class="sandbox-library-heading__actions"><button class="sandbox-library-new" type="button" data-library-new>${this.copy.newSquishy}</button></div></section>
        <section class="library-showcase room-library-stage" data-library-hall-stage>
          <section class="library-showcase-collection" aria-label="${this.copy.title}">
            <div class="library-showcase-collection__heading"><button class="room-library-button" type="button" data-room-back>${ru ? '← Комната' : '← Room'}</button><button class="room-library-button" type="button" data-room-manage aria-pressed="${this.collectionManaging}">${this.collectionManaging ? (ru ? 'Готово' : 'Done') : (ru ? 'Управлять' : 'Manage')}</button></div>
            <div class="sandbox-library-grid" tabindex="0" aria-label="${ru ? 'Коллекция сквишей' : 'Squishy collection'}">${this.library.map(toy => this.renderToyCard(toy)).join('')}${slots}</div>
          </section>
          <section class="library-showcase-workbench" aria-label="${ru ? 'Постамент сквиша' : 'Squishy pedestal'}">
            <div class="library-showcase-toy" data-library-display-host>${selected ? `<button type="button" class="library-showcase-preview" data-library-select-id="${escapeAttribute(selected.id)}" aria-label="${this.copy.squeeze}: ${this.toyLabel(selected)}"><canvas data-library-display aria-hidden="true"></canvas></button>` : `<div class="library-showcase-welcome"><h2>${this.copy.emptyTitle}</h2><p>${this.copy.emptyHint}</p></div>`}</div>
            <div class="library-showcase-table" aria-hidden="true">
              <svg class="room-pedestal-clips" width="0" height="0"><defs>
                <!-- Trace source seams in the 460×262 art frame; all layers scale together. -->
                <clipPath id="room-pedestal-rims" clipPathUnits="objectBoundingBox"><path transform="scale(0.002173913043478261 0.003816793893129771)" clip-rule="evenodd" d="M0 0H460V262H0Z M15 0H445V58L443 64L438 74L420 83L390 90L360 94L320 98L280 101L230 102L180 101L140 99L100 95L70 91L40 84L22 76L18 72L15 58Z M17 109L22 109L40 114L70 120L100 124L140 128L180 130L230 131L280 130L320 127L360 124L390 119L420 113L438 108L441 109V180L440 185L439 190L436 195L429 200L420 204L390 212L360 217L320 221L280 223L230 224L180 223L140 221L100 217L70 212L40 204L29 200L23 195L19 190L18 185L17 179Z" /></clipPath>
                <clipPath id="room-pedestal-top" clipPathUnits="objectBoundingBox"><path transform="scale(0.002173913043478261 0.003816793893129771)" d="M15 0H445V58L443 64L438 74L420 83L390 90L360 94L320 98L280 101L230 102L180 101L140 99L100 95L70 91L40 84L22 76L18 72L15 58Z" /></clipPath>
                <clipPath id="room-pedestal-wall" clipPathUnits="objectBoundingBox"><path transform="scale(0.002173913043478261 0.003816793893129771)" d="M17 109L22 109L40 114L70 120L100 124L140 128L180 130L230 131L280 130L320 127L360 124L390 119L420 113L438 108L441 109V180L440 185L439 190L436 195L429 200L420 204L390 212L360 217L320 221L280 223L230 224L180 223L140 221L100 217L70 212L40 204L29 200L23 195L19 190L18 185L17 179Z" /></clipPath>
              </defs></svg>
              <span class="room-pedestal-rims"></span><span class="room-pedestal-wall"></span><span class="room-pedestal-top"></span>
            </div>
            <div class="library-showcase-selected" data-library-selection aria-live="polite">${selected ? `<strong>${this.toyLabel(selected)}</strong><span>${ru ? 'Нажми, чтобы помять' : 'Tap to squeeze'}</span>` : ''}</div>
            <nav class="room-library-arrows" aria-label="${ru ? 'Выбрать сквиша' : 'Choose squishy'}"><button class="room-library-button" type="button" data-room-step="-1" aria-label="${ru ? 'Предыдущий сквиш' : 'Previous squishy'}" ${count < 2 ? 'disabled' : ''}>‹</button><output>${count ? position + 1 : 0} / ${count}</output><button class="room-library-button" type="button" data-room-step="1" aria-label="${ru ? 'Следующий сквиш' : 'Next squishy'}" ${count < 2 ? 'disabled' : ''}>›</button></nav>
          </section>
        </section>
        <footer class="room-library-footer${collection ? ' room-library-footer--collection' : ''}">${footer}</footer>
        <p class="sandbox-library-reward-message" data-library-maker-error aria-live="polite" hidden></p>${this.rewardMessage ? `<p class="sandbox-library-reward-message" data-library-reward-message aria-live="polite">${this.rewardMessage}</p>` : ''}
      </main>`;
    this.renderVisibleThumbnails();
    this.disposeScrollHints = mountCatalogScrollHints(this.root, this.abortController.signal, '.sandbox-library-grid');
    const catalog = this.root.querySelector<HTMLElement>('.sandbox-library-grid');
    if (catalog) catalog.scrollTop = this.collectionScrollTop;
    const display = this.root.querySelector<HTMLCanvasElement>('[data-library-display]');
    if (display && selected) renderLibraryThumbnail(display, selected, 512);
    this.personality.schedule();
    const shell = this.root.querySelector<HTMLElement>('.room-library');
    if (shell) this.roomEditor?.mount(shell);
  }

  private rememberCollectionScroll(): void {
    if (!this.options.roomReview || this.roomView === 'collection') this.collectionScrollTop = this.root.querySelector<HTMLElement>('.sandbox-library-grid')?.scrollTop ?? this.collectionScrollTop;
  }

  private returnFromRoomSqueeze(): void {
    if (!this.options.roomReview) {
      this.renderLibrary();
      this.root.querySelector<HTMLButtonElement>(`[data-library-play-id="${CSS.escape(this.selectedToyId ?? '')}"]`)?.focus({ preventScroll: true });
      return;
    }
    this.roomView = this.roomReturnView;
    this.renderLibrary();
    const selector = this.roomView === 'collection' ? `[data-library-play-id="${CSS.escape(this.selectedToyId ?? '')}"]` : '[data-library-select-id]';
    this.root.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  }

  private renderIdeas(): void {
    this.disposeScrollHints?.(); this.disposeScrollHints = null;
    this.roomEditor?.unmount();
    this.personality.stop();
    this.cancelPendingMakerStart();
    this.presentationObserver?.disconnect();
    this.presentationObserver = null;
    this.currentMaker?.dispose();
    this.currentMaker = null;
    releasePagesLibraryMaterialLighting();
    this.activeIdea = null;
    this.pendingDeleteId = null;
    const completed = new Set(this.completedRecipeIds);
    const title = getSquishyTitle(this.completedRecipeIds.length, this.options.language);
    const cards = SQUISHY_IDEAS.map((idea) => {
      const done = completed.has(idea.id);
      const mixin = getIdeaMixinLabel(idea, this.options.language);
      return `
        <button class="sandbox-idea-card${done ? ' is-complete' : ''}" type="button" data-card-page-item data-idea-id="${escapeAttribute(idea.id)}" style="--idea-color:#${idea.paintColor.toString(16).padStart(6, '0')}">
          <span class="sandbox-idea-card__top">
            <span class="sandbox-idea-card__shape">${getIdeaShapeLabel(idea, this.options.language)}</span>
            ${done ? `<strong>✓ ${this.copy.completed}</strong>` : ''}
          </span>
          <span class="sandbox-idea-card__hero">
            <canvas class="sandbox-idea-card__preview" data-idea-preview="${escapeAttribute(idea.id)}" aria-hidden="true"></canvas>
            <span class="sandbox-idea-card__copy">
              <span class="sandbox-idea-card__name">${getIdeaLabel(idea, this.options.language)}</span>
              <span class="sandbox-idea-card__cues">
                <span>${getIdeaMaterialLabel(idea, this.options.language)}</span>
                ${mixin ? `<span>· ${mixin}</span>` : ''}
              </span>
            </span>
          </span>
          <span class="sandbox-idea-card__action">${this.options.language === 'ru' ? 'Создать по идее →' : 'Create from idea →'}</span>
        </button>
      `;
    }).join('');

    this.root.innerHTML = `
      <main class="sandbox-library-shell sandbox-ideas-shell${this.activityBlocked ? ' is-blocked' : ''}" data-sandbox-ideas data-card-pages data-stage="ideas" data-ideas-count="${SQUISHY_IDEAS.length}" data-completed-count="${this.completedRecipeIds.length}">
        <header class="sandbox-library-topbar">
          <strong>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-library-mute aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>
        <section class="sandbox-ideas-heading">
          <button class="sandbox-library-ideas sandbox-library-ideas--back" type="button" data-ideas-back>← ${this.copy.backToLibrary}</button>
          <span>${title} · ${this.completedRecipeIds.length} / ${SQUISHY_IDEAS.length}</span>
          <h1>${this.copy.ideasTitle}</h1>
          <p>${this.copy.ideasHint}</p>
        </section>
        <section class="sandbox-ideas-grid" aria-label="${this.copy.ideasTitle}">${cards}</section>
        ${cardPagerMarkup(this.options.language)}
        <p class="sandbox-library-reward-message" data-library-maker-error aria-live="polite" hidden></p>
      </main>
    `;
    this.updateIdeaPages();
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('[data-idea-preview]')) {
      const idea = SQUISHY_IDEAS.find(item => item.id === canvas.dataset.ideaPreview);
      if (idea) renderLibraryThumbnail(canvas, this.ideaPreview(idea), 256);
    }
  }

  private updateIdeaPages(): void {
    const shell = this.root.querySelector<HTMLElement>('[data-sandbox-ideas]');
    if (!shell) return;
    const first = Number(shell.dataset.cardPage ?? 0) * Number(shell.dataset.cardsPerPage ?? 4);
    const perPage = innerWidth >= 901 && innerHeight >= 640 ? 12 : 4;
    shell.dataset.cardsPerPage = String(perPage);
    showCardPage(shell, Math.floor(first / perPage));
  }

  private ideaPreview(idea: SquishyIdea): SavedSquishy {
    return { ...createSandboxDraft(), id: idea.id, createdAt: 0,
      shapeId: idea.shapeId, materialId: idea.materialId,
      appearance: { v: 1, strokes: [createBodyFillStroke(idea.paintColor)],
        mixins: idea.requiredMixin ? [.3,.5,.7].flatMap(u => [.35,.65].map(v => createMixInPlacement(idea.requiredMixin!, {u,v}, 22, u))) : [] } };
  }

  private renderIdeaGuideMarkup(idea: SquishyIdea): string {
    const ru = this.options.language === 'ru', mixin = getIdeaMixinLabel(idea, this.options.language);
    return `<details class="sandbox-idea-guide" data-sandbox-brand data-idea-guide data-idea-active="${escapeAttribute(idea.id)}">
      <summary>${ru ? 'Идея' : 'Idea'}</summary>
      <div><strong>${getIdeaLabel(idea, this.options.language)}</strong>
      <span><i style="--idea-color:#${idea.paintColor.toString(16).padStart(6, '0')}"></i>${getIdeaShapeLabel(idea, this.options.language)} · ${getIdeaMaterialLabel(idea, this.options.language)}${mixin ? ` · ${mixin}` : ''}</span>
      <small>${ru ? 'Подсказка для вдохновения. Можно делать по-своему.' : 'Inspiration only. You can make it your way.'}</small></div></details>`;
  }

  private renderIdeaCompletion(ideaId: string, previousCompleted: readonly string[]): void {
    if (previousCompleted.includes(ideaId) || !this.completedRecipeIds.includes(ideaId)) return;
    const idea = SQUISHY_IDEAS.find((candidate) => candidate.id === ideaId);
    if (!idea) return;
    this.root.querySelector('[data-idea-complete]')?.remove();
    const guide = this.root.querySelector('[data-idea-guide]');
    const brand = document.createElement('strong'); brand.dataset.sandboxBrand = ''; brand.textContent = this.copy.studio;
    guide?.replaceWith(brand);
    const notice = document.createElement('aside');
    notice.className = 'sandbox-idea-complete';
    notice.dataset.ideaComplete = '';
    notice.innerHTML = `<strong>✓ ${this.copy.ideaComplete}</strong><span>${getIdeaLabel(idea, this.options.language)} · ${getSquishyTitle(this.completedRecipeIds.length, this.options.language)}</span>`;
    this.root.append(notice);
  }

  private renderToyCard(toy: SavedSquishy): string {
    const label = this.toyLabel(toy);
    return `
      <article class="sandbox-library-card${toy.id === this.selectedToyId ? ' is-selected' : ''}" data-library-toy="${escapeAttribute(toy.id)}">
        <button class="sandbox-library-card__play" type="button" data-library-play-id="${escapeAttribute(toy.id)}" aria-label="${this.copy.squeeze}: ${label}" aria-pressed="${toy.id === this.selectedToyId}">
          <canvas class="sandbox-library-card__canvas" data-library-thumbnail="${escapeAttribute(toy.id)}" aria-hidden="true"></canvas>
          <span class="sandbox-library-card__cta">${this.copy.squeeze}</span>
        </button>
        <div class="sandbox-library-card__footer">
          <strong>${label}</strong>
          <button class="sandbox-library-delete" type="button" data-library-delete-id="${escapeAttribute(toy.id)}" aria-label="${this.copy.delete}: ${label}">×</button>
        </div>
      </article>
    `;
  }

  private renderVisibleThumbnails(scope: ParentNode = this.root): void {
    for (const canvas of scope.querySelectorAll<HTMLCanvasElement>('[data-library-thumbnail]')) {
      const id = canvas.dataset.libraryThumbnail;
      const toy = this.library.find((candidate) => candidate.id === id);
      if (toy) renderLibraryThumbnail(canvas, toy);
    }
  }

  /** May be called during idle time by preview/draft entrypoints to hide first-craft latency. */
  public preloadMakerRenderer(): Promise<void> {
    if (!this.options.loadMakerRendererOptions || this.loadedMakerRendererOptions || this.options.makerRendererOptions) {
      return Promise.resolve();
    }
    if (!this.makerRendererLoad) {
      this.makerRendererLoad = this.options.loadMakerRendererOptions().then((rendererOptions) => {
        this.loadedMakerRendererOptions = rendererOptions;
        return rendererOptions;
      }).finally(() => {
        this.makerRendererLoad = null;
      });
    }
    return this.makerRendererLoad.then(() => undefined);
  }

  private async resolveMakerRendererOptions(): Promise<Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'> | undefined> {
    if (this.options.makerRendererOptions) return this.options.makerRendererOptions;
    if (this.loadedMakerRendererOptions) return this.loadedMakerRendererOptions;
    if (!this.options.loadMakerRendererOptions) return undefined;
    await this.preloadMakerRenderer();
    return this.loadedMakerRendererOptions ?? undefined;
  }

  /** One existing Phaser maker on demand, seated inside the Library table. */
  private async selectLibraryToy(toy: SavedSquishy): Promise<void> {
    const shell = this.root.querySelector<HTMLElement>('[data-sandbox-library]');
    const display = shell?.querySelector<HTMLDivElement>('[data-library-display-host]');
    if (!shell || !display || this.disposed) return;
    if (this.selectedToyId === toy.id && display.querySelector('[data-sandbox-app]')) return;
    this.rememberCollectionScroll();
    shell.dataset.libraryView = 'squeeze';
    if (this.options.roomReview) {
      this.roomReturnView = this.roomView === 'collection' ? 'collection' : 'room';
      this.roomView = 'squeeze';
      shell.dataset.roomView = 'squeeze';
    }
    this.personality.stop();
    const token = ++this.makerStartToken;
    shell.setAttribute('aria-busy', 'true');
    const message = shell.querySelector<HTMLElement>('[data-library-maker-error]');
    if (message) { message.hidden = false; message.textContent = this.copy.studioLoading; }
    try {
      const renderer = await this.resolveMakerRendererOptions();
      if (this.disposed || token !== this.makerStartToken || !shell.isConnected) return;
      this.presentationObserver?.disconnect();
      this.currentMaker?.dispose();
      this.currentMaker = null;
      releasePagesLibraryMaterialLighting();
      this.selectedToyId = toy.id;
      const host = document.createElement('div');
      host.dataset.libraryLive = '';
      host.style.setProperty('--library-craft-scale', String(libraryCraftCameraScale(getShape(toy.shapeId), toy.decor)));
      const preview = this.options.roomReview ? display.querySelector<HTMLButtonElement>('[data-library-select-id]') : null;
      if (preview) {
        // Keep the exhibited toy until the live renderer has painted its first
        // frame. A transparent booting canvas must not flash an empty room.
        preview.disabled = true;
        host.style.visibility = 'hidden';
        display.append(host);
      } else display.replaceChildren(host);
      this.currentMaker = new SandboxApp(host, {
        ...renderer,
        language: this.options.language, muted: this.muted,
        savedSquishy: toy, startSavedInSqueeze: true,
        onExitToLibrary: () => this.returnFromRoomSqueeze(),
        onResetCraftContext: () => this.resetCraftContext(),
        onSaveSquishy: (draft, editingId) => this.handleSaveRequest(draft, editingId),
        onMutedChange: muted => this.setMuted(muted),
      });
      const back = host.querySelector<HTMLButtonElement>('[data-action="home"]');
      if (back) back.textContent = this.options.language === 'ru'
        ? (this.options.roomReview && this.roomReturnView === 'room' ? 'В комнату' : 'К коллекции')
        : (this.options.roomReview && this.roomReturnView === 'room' ? 'Back to room' : 'Back to collection');
      const heading = shell.querySelector('h1');
      if (heading) heading.textContent = this.options.language === 'ru' ? 'МНЁМ СКВИШ' : 'SQUEEZE';
      this.currentMaker.setActivityBlocked(this.activityBlocked);
      for (const card of shell.querySelectorAll<HTMLElement>('[data-library-toy]')) {
        const selected = card.dataset.libraryToy === toy.id;
        card.classList.toggle('is-selected', selected);
        card.querySelector('button')?.setAttribute('aria-pressed', String(selected));
      }
      const selection = shell.querySelector<HTMLElement>('[data-library-selection]');
      if (selection) selection.innerHTML = `<strong>${this.toyLabel(toy)}</strong><span>${this.options.language === 'ru' ? 'Тяни, нажимай и мни — сквиш уже на столе' : 'Pull, press and squeeze — your squishy is on the table'}</span>`;
      // Editing/new craft keep the same instance and durable callbacks, but use
      // the existing full Studio. Only Squeeze belongs inside the Library table.
      this.presentationObserver = new MutationObserver(() => {
        const stage = host.querySelector<HTMLElement>('[data-sandbox-app]')?.dataset.stage;
        if (!host.isConnected) return;
        if (stage === 'squeeze') {
          if (preview?.isConnected && host.querySelector('[data-phaser-ready=true]')) requestAnimationFrame(() => {
            if (!host.isConnected || host.querySelector<HTMLElement>('[data-sandbox-app]')?.dataset.stage !== 'squeeze') return;
            preview.remove(); host.style.visibility = '';
          });
          return;
        }
        this.presentationObserver?.disconnect();
        this.presentationObserver = null;
        this.cancelPendingMakerStart();
        host.removeAttribute('data-library-live');
        host.className = 'sandbox-maker-host';
        host.dataset.sandboxMakerHost = '';
        this.root.replaceChildren(host);
        host.querySelector<HTMLElement>('[data-sandbox-app]')?.setAttribute('data-stage', stage ?? 'shape');
      });
      this.presentationObserver.observe(host, { subtree: true, attributes: true, attributeFilter: ['data-stage', 'data-phaser-ready'] });
    } catch (error: unknown) {
      if (this.disposed || token !== this.makerStartToken) return;
      console.error('[squishy:library-selection]', error);
      this.returnFromRoomSqueeze();
      const recovery = this.root.querySelector<HTMLElement>('[data-library-maker-error]');
      if (recovery) { recovery.hidden = false; recovery.textContent = this.copy.studioUnavailable; recovery.classList.add('is-error'); }
    } finally {
      if (shell.isConnected && token === this.makerStartToken) {
        shell.removeAttribute('aria-busy');
        if (message && message.textContent === this.copy.studioLoading) message.hidden = true;
      }
    }
  }

  private async startMaker(toy: SavedSquishy | null, idea: SquishyIdea | null = null): Promise<void> {
    if (this.disposed) return;
    if (this.options.roomReview && this.roomView !== 'squeeze') {
      this.rememberCollectionScroll();
      this.roomReturnView = this.roomView;
    }
    this.personality.stop();
    this.presentationObserver?.disconnect();
    this.presentationObserver = null;
    const startToken = ++this.makerStartToken;
    const currentShell = this.root.querySelector<HTMLElement>('[data-sandbox-library], [data-sandbox-ideas]');
    const origin: 'library' | 'ideas' = currentShell?.hasAttribute('data-sandbox-ideas') ? 'ideas' : 'library';
    currentShell?.setAttribute('aria-busy', 'true');
    const loadingMessage = currentShell?.querySelector<HTMLElement>('[data-library-maker-error]');
    if (loadingMessage) {
      loadingMessage.textContent = this.copy.studioLoading;
      loadingMessage.hidden = false;
      loadingMessage.classList.remove('is-error');
    }
    try {
      const makerRendererOptions = await this.resolveMakerRendererOptions();
      if (this.disposed || startToken !== this.makerStartToken || !currentShell?.isConnected) return;
      this.currentMaker?.dispose();
      this.currentMaker = null;
      releasePagesLibraryMaterialLighting();
      this.activeIdea = toy ? null : idea;
      this.rewardMessage = null;
      this.disposeScrollHints?.(); this.disposeScrollHints = null;
      this.roomEditor?.unmount();
      this.root.innerHTML = `<div class="sandbox-maker-host" data-sandbox-maker-host></div>${idea ? this.renderIdeaGuideMarkup(idea) : ''}`;
      const host = this.root.querySelector<HTMLDivElement>('[data-sandbox-maker-host]');
      if (!host) throw new Error('Sandbox library failed to mount maker host.');
      this.currentMaker = new SandboxApp(host, {
        ...makerRendererOptions,
        language: this.options.language,
        muted: this.muted,
        savedSquishy: toy,
        ...(toy === null && idea ? { initialShapeId: idea.shapeId } : {}),
        startSavedInSqueeze: toy !== null,
        onExitToLibrary: () => this.returnFromRoomSqueeze(),
        onResetCraftContext: () => this.resetCraftContext(),
        onSaveSquishy: (draft, editingId) => this.handleSaveRequest(draft, editingId),
        onMutedChange: (muted) => this.setMuted(muted),
      });
      const back = host.querySelector<HTMLButtonElement>('[data-action="home"]');
      if (back) back.textContent = this.options.language === 'ru'
        ? (this.options.roomReview && this.roomReturnView === 'room' ? 'В комнату' : 'К коллекции')
        : (this.options.roomReview && this.roomReturnView === 'room' ? 'Back to room' : 'Back to collection');
      if (idea) {
        const guide = this.root.querySelector('[data-idea-guide]');
        const brand = host.querySelector('[data-sandbox-brand]');
        if (guide && brand) brand.replaceWith(guide);
      }
      this.currentMaker.setActivityBlocked(this.activityBlocked);
    } catch (error: unknown) {
      if (startToken !== this.makerStartToken) return;
      console.error('[squishy:maker-start]', error);

      // Loader failures leave the origin shell in place; constructor/renderer
      // failures can happen after it was replaced with the maker host. Restore
      // the exact originating screen before surfacing the retryable error.
      if (!currentShell?.isConnected) {
        if (origin === 'ideas') this.renderIdeas();
        else this.renderLibrary();
      }
      this.personality.schedule();
      const recoveryShell = this.root.querySelector<HTMLElement>('[data-sandbox-library], [data-sandbox-ideas]');
      recoveryShell?.removeAttribute('aria-busy');
      const message = recoveryShell?.querySelector<HTMLElement>('[data-library-maker-error]');
      if (message) {
        message.textContent = this.copy.studioUnavailable;
        message.hidden = false;
        message.classList.add('is-error');
      }
    }
  }

  private cancelPendingMakerStart(): void {
    this.makerStartToken += 1;
    const shell = this.root.querySelector<HTMLElement>('[data-sandbox-library], [data-sandbox-ideas]');
    shell?.removeAttribute('aria-busy');
    const message = shell?.querySelector<HTMLElement>('[data-library-maker-error]');
    if (message && message.textContent === this.copy.studioLoading) {
      message.textContent = '';
      message.hidden = true;
      message.classList.remove('is-error');
    }
  }

  private resetCraftContext(): void {
    this.activeIdea = null;
    this.root.querySelector('[data-idea-complete]')?.remove();
    const guide = this.root.querySelector('[data-idea-guide]');
    if (guide) {
      const brand = document.createElement('strong');
      brand.dataset.sandboxBrand = ''; brand.textContent = this.copy.studio;
      guide.replaceWith(brand);
    }
  }

  private async handleSaveRequest(draft: SandboxDraft, editingId: string | null): Promise<SavedSquishy | null> {
    if (editingId) {
      const result = await this.options.onUpdateSquishy(editingId, draft);
      if (this.disposed) return null;
      this.library = [...result.library];
      this.selectedToyId = result.savedSquishy.id;
      this.completedRecipeIds = [...result.completedRecipeIds];
      return result.savedSquishy;
    }
    const ideaId = this.activeIdea?.id ?? null;
    if (this.library.length < this.libraryCapacity) {
      const previousCompleted = this.completedRecipeIds;
      const result = await this.options.onAppendSquishy(draft, ideaId);
      if (this.disposed) return null;
      this.library = [...result.library];
      this.selectedToyId = result.savedSquishy.id;
      this.completedRecipeIds = [...result.completedRecipeIds];
      if (ideaId) this.renderIdeaCompletion(ideaId, previousCompleted);
      return result.savedSquishy;
    }

    if (this.pendingReplacement) return null;
    return new Promise<SavedSquishy | null>((resolve) => {
      this.pendingReplacement = { draft, ideaId, resolve };
      this.renderReplaceOverlay();
    });
  }

  private renderReplaceOverlay(): void {
    this.root.querySelector('[data-library-replace-overlay]')?.remove();
    const overlay = document.createElement('section');
    overlay.className = 'sandbox-library-modal sandbox-library-modal--replace';
    overlay.dataset.libraryReplaceOverlay = '';
    overlay.innerHTML = `
      <div class="sandbox-library-modal__sheet" data-card-pages role="dialog" aria-modal="true" aria-labelledby="library-replace-title">
        <span class="sandbox-library-modal__eyebrow">${this.library.length} / ${this.libraryCapacity}</span>
        <h2 id="library-replace-title">${this.copy.replaceTitle}</h2>
        <p>${this.copy.replaceHint}</p>
        <div class="replacement-new"><canvas data-replacement-new aria-hidden="true"></canvas><strong>${this.options.language === 'ru' ? 'Сохраняем новый сквиш' : 'Saving your new squishy'}</strong></div>
        <div class="sandbox-library-replace-grid">
          ${this.library.map((toy) => `
            <button class="sandbox-library-replace-card" type="button" data-card-page-item data-library-replace-id="${escapeAttribute(toy.id)}" aria-pressed="false">
              <canvas data-library-thumbnail="${escapeAttribute(toy.id)}" aria-hidden="true"></canvas>
              <strong>${this.toyLabel(toy)}</strong>
              <span>${this.copy.replaceAction}</span>
            </button>
          `).join('')}
        </div>
        ${cardPagerMarkup(this.options.language)}
        <p class="sandbox-library-modal__error" data-library-modal-error aria-live="polite"></p>
        <p data-replacement-selected aria-live="polite">${this.options.language === 'ru' ? 'Выбери, какой сквиш заменить' : 'Choose which squishy to replace'}</p>
        <div class="replacement-actions"><button class="sandbox-library-modal__cancel" type="button" data-library-replace-cancel>${this.options.language === 'ru' ? 'К созданию' : 'Back to creating'}</button>
        <button class="sandbox-library-modal__danger" type="button" data-library-replace-confirm disabled>${this.options.language === 'ru' ? 'Заменить и сохранить' : 'Replace & save'}</button></div>
      </div>
    `;
    showCardPage(overlay.querySelector<HTMLElement>('[data-card-pages]')!);
    this.openModal(overlay);
    this.renderVisibleThumbnails(overlay);
    const preview = overlay.querySelector<HTMLCanvasElement>('[data-replacement-new]');
    if (preview && this.pendingReplacement) renderLibraryThumbnail(preview, { ...this.pendingReplacement.draft, id: 'pending', createdAt: 0 }, 256);
  }

  private renderDeleteOverlay(toy: SavedSquishy): void {
    this.root.querySelector('[data-library-delete-overlay]')?.remove();
    const overlay = document.createElement('section');
    overlay.className = 'sandbox-library-modal sandbox-library-modal--delete';
    overlay.dataset.libraryDeleteOverlay = '';
    overlay.innerHTML = `
      <div class="sandbox-library-modal__sheet sandbox-library-modal__sheet--compact" role="dialog" aria-modal="true" aria-labelledby="library-delete-title">
        <canvas class="sandbox-library-delete-preview" data-library-thumbnail="${escapeAttribute(toy.id)}" aria-hidden="true"></canvas>
        <h2 id="library-delete-title">${this.copy.deleteTitle}</h2>
        <p>${this.copy.deleteHint}</p>
        <p class="sandbox-library-modal__error" data-library-modal-error aria-live="polite"></p>
        <div class="sandbox-library-modal__actions">
          <button class="sandbox-library-modal__cancel" type="button" data-library-delete-cancel>${this.copy.cancel}</button>
          <button class="sandbox-library-modal__danger" type="button" data-library-delete-confirm>${this.copy.deleteConfirm}</button>
        </div>
      </div>
    `;
    this.openModal(overlay);
    this.renderVisibleThumbnails(overlay);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const guide = this.root.querySelector<HTMLDetailsElement>('[data-idea-guide][open]');
    if (event.key === 'Escape' && guide && !this.root.querySelector('[data-library-replace-overlay], [data-library-delete-overlay], [data-exit-overlay]:not([hidden]), [data-tools-overlay]:not([hidden])')) {
      guide.open = false; guide.querySelector<HTMLElement>('summary')?.focus(); event.preventDefault(); return;
    }
    const replace = this.root.querySelector<HTMLElement>('[data-library-replace-overlay]');
    const deleteOverlay = this.root.querySelector<HTMLElement>('[data-library-delete-overlay]');
    const overlay = replace ?? deleteOverlay;
    const dialog = overlay?.querySelector<HTMLElement>('[role="dialog"]') ?? null;
    if (!overlay || !dialog) return;

    if (this.activityBlocked || overlay.getAttribute('aria-busy') === 'true') {
      // Platform lifecycle blocks (ads/pagehide) must freeze modal mutations as
      // well as pointer input, while still keeping keyboard focus inside it.
      if (event.key === 'Escape') event.preventDefault();
      else trapModalTab(event, dialog);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      if (replace) this.cancelReplacement();
      else this.cancelDelete();
      return;
    }
    trapModalTab(event, dialog);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disposed || this.activityBlocked) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
    if (!target) return;
    if (this.options.roomReview) {
      if (target.hasAttribute('data-room-step')) {
        if (!this.library.length || target.hasAttribute('disabled')) return;
        const index = this.library.findIndex(toy => toy.id === this.selectedToyId);
        this.selectedToyId = this.library[(index + Number(target.dataset.roomStep) + this.library.length) % this.library.length]!.id;
        this.renderLibrary();
        this.root.querySelector<HTMLButtonElement>(`[data-room-step="${target.dataset.roomStep}"]`)?.focus();
        return;
      }
      if (target.hasAttribute('data-room-collection') || target.hasAttribute('data-room-back')) {
        this.rememberCollectionScroll();
        this.roomView = target.hasAttribute('data-room-collection') ? 'collection' : 'room';
        this.renderLibrary();
        this.root.querySelector<HTMLButtonElement>(this.roomView === 'collection' ? '[data-room-back]' : '[data-room-collection]')?.focus();
        return;
      }
    }

    if (target.hasAttribute('data-room-manage')) {
      this.rememberCollectionScroll();
      this.collectionManaging = !this.collectionManaging;
      this.renderLibrary();
      this.root.querySelector<HTMLButtonElement>('[data-room-manage]')?.focus();
      return;
    }

    const replacementId = target.dataset.libraryReplaceId;
    if (replacementId) {
      if (!this.pendingReplacement) return;
      this.pendingReplacement.selectedId = replacementId;
      const overlay = this.root.querySelector('[data-library-replace-overlay]');
      for (const card of overlay?.querySelectorAll<HTMLElement>('[data-library-replace-id]') ?? []) card.setAttribute('aria-pressed', String(card.dataset.libraryReplaceId === replacementId));
      const confirm = overlay?.querySelector<HTMLButtonElement>('[data-library-replace-confirm]');
      if (confirm) confirm.disabled = false;
      const chosen = this.library.find(toy => toy.id === replacementId);
      const label = overlay?.querySelector('[data-replacement-selected]');
      if (label && chosen) label.textContent = `${this.options.language === 'ru' ? 'Будет заменён' : 'Will be replaced'}: ${this.toyLabel(chosen)}`;
      return;
    }
    if (target.hasAttribute('data-library-replace-confirm')) {
      if (this.pendingReplacement?.selectedId) void this.confirmReplacement(this.pendingReplacement.selectedId);
      return;
    }
    if (target.hasAttribute('data-library-replace-cancel')) {
      this.cancelReplacement();
      return;
    }
    if (target.hasAttribute('data-library-delete-confirm')) {
      void this.confirmDelete();
      return;
    }
    if (target.hasAttribute('data-library-delete-cancel')) {
      this.cancelDelete();
      return;
    }
    if (target.hasAttribute('data-library-mute')) {
      this.setMuted(!this.muted);
      target.setAttribute('aria-pressed', String(this.muted));
      target.textContent = this.muted ? this.copy.muted : this.copy.sound;
      return;
    }
    if (target.hasAttribute('data-library-expand-reward')) {
      this.cancelPendingMakerStart();
      void this.unlockShelfExpansion();
      return;
    }
    if (target.hasAttribute('data-card-page-step')) {
      const scope = target.closest<HTMLElement>('[data-card-pages]');
      if (scope) showCardPage(scope, Number(scope.dataset.cardPage ?? 0) + Number(target.dataset.cardPageStep));
      return;
    }
    if (target.hasAttribute('data-library-ideas')) {
      this.rewardMessage = null;
      this.renderIdeas();
      return;
    }
    if (target.hasAttribute('data-ideas-back')) {
      this.renderLibrary();
      return;
    }
    const ideaId = target.dataset.ideaId;
    if (ideaId) {
      const idea = SQUISHY_IDEAS.find((candidate) => candidate.id === ideaId);
      if (idea) void this.startMaker(null, idea);
      return;
    }
    if (target.hasAttribute('data-library-new')) {
      void this.startMaker(null);
      return;
    }

    const playId = target.dataset.libraryPlayId ?? target.dataset.librarySelectId;
    if (playId) {
      const toy = this.library.find((candidate) => candidate.id === playId);
      if (toy) void this.selectLibraryToy(toy);
      return;
    }

    const deleteId = target.dataset.libraryDeleteId;
    if (deleteId) {
      const toy = this.library.find((candidate) => candidate.id === deleteId);
      if (!toy) return;
      this.cancelPendingMakerStart();
      this.pendingDeleteId = deleteId;
      this.renderDeleteOverlay(toy);
    }
  };

  private async confirmReplacement(targetId: string): Promise<void> {
    const pending = this.pendingReplacement;
    if (!pending) return;
    const overlay = this.root.querySelector<HTMLElement>('[data-library-replace-overlay]');
    if (!overlay || overlay.getAttribute('aria-busy') === 'true') return;
    this.setModalBusy(overlay, true);
    try {
      const previousCompleted = this.completedRecipeIds;
      const result = await this.options.onReplaceSquishy(targetId, pending.draft, pending.ideaId);
      if (this.disposed || this.pendingReplacement !== pending || !overlay.isConnected) return;
      this.library = [...result.library];
      this.selectedToyId = result.savedSquishy.id;
      this.completedRecipeIds = [...result.completedRecipeIds];
      this.pendingReplacement = null;
      this.closeModal(false);
      if (pending.ideaId) this.renderIdeaCompletion(pending.ideaId, previousCompleted);
      pending.resolve(result.savedSquishy);
    } catch (error: unknown) {
      if (this.disposed || this.pendingReplacement !== pending || !overlay.isConnected) return;
      console.error('[squishy:library-replace]', error);
      this.setModalBusy(overlay, false);
      const message = overlay.querySelector<HTMLElement>('[data-library-modal-error]');
      if (message) message.textContent = this.copy.saveFailed;
    }
  }

  private cancelReplacement(): void {
    const pending = this.pendingReplacement;
    if (!pending) return;
    this.pendingReplacement = null;
    this.closeModal(true);
    pending.resolve(null);
  }

  private async confirmDelete(): Promise<void> {
    const targetId = this.pendingDeleteId;
    if (!targetId) return;
    const overlay = this.root.querySelector<HTMLElement>('[data-library-delete-overlay]');
    if (!overlay || overlay.getAttribute('aria-busy') === 'true') return;
    this.setModalBusy(overlay, true);
    try {
      const library = await this.options.onDeleteSquishy(targetId);
      if (this.disposed || this.pendingDeleteId !== targetId || !overlay.isConnected) return;
      this.library = [...library];
      this.pendingDeleteId = null;
      this.closeModal(false);
      this.renderLibrary();
    } catch (error: unknown) {
      if (this.disposed || this.pendingDeleteId !== targetId || !overlay.isConnected) return;
      console.error('[squishy:library-delete]', error);
      this.setModalBusy(overlay, false);
      const message = overlay.querySelector<HTMLElement>('[data-library-modal-error]');
      if (message) message.textContent = this.copy.saveFailed;
    }
  }

  private cancelDelete(): void {
    this.pendingDeleteId = null;
    this.closeModal(true);
  }

  private openModal(overlay: HTMLElement): void {
    this.closeModal(false);
    this.modalReturnFocus = captureModalReturnFocus();
    this.personality.stop();
    this.currentMaker?.setActivityBlocked(true);
    this.root.append(overlay);
    const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]');
    if (dialog) focusModal(dialog);
  }

  private closeModal(restore: boolean): void {
    this.root.querySelector('[data-library-replace-overlay], [data-library-delete-overlay]')?.remove();
    const returnFocus = this.modalReturnFocus;
    this.modalReturnFocus = null;
    this.currentMaker?.setActivityBlocked(this.activityBlocked);
    if (!this.currentMaker) this.personality.schedule();
    if (restore) restoreModalFocus(returnFocus);
  }

  private setModalBusy(overlay: HTMLElement, busy: boolean): void {
    if (busy) overlay.setAttribute('aria-busy', 'true');
    else overlay.removeAttribute('aria-busy');
    for (const button of overlay.querySelectorAll<HTMLButtonElement>('button')) {
      if (busy) { button.dataset.modalWasDisabled = String(button.disabled); button.disabled = true; }
      else { button.disabled = button.dataset.modalWasDisabled === 'true'; delete button.dataset.modalWasDisabled; }
    }

    const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    if (busy) {
      dialog.tabIndex = -1;
      dialog.focus();
    } else {
      dialog.removeAttribute('tabindex');
      focusModal(dialog);
    }
  }

  private async unlockShelfExpansion(): Promise<void> {
    if (this.rewardInFlight || this.libraryCapacity >= this.options.shelfExpansionTargetCapacity) return;
    this.rewardInFlight = true;
    this.rewardMessage = null;
    const offer = this.root.querySelector<HTMLElement>('[data-library-reward-offer]');
    offer?.setAttribute('aria-busy', 'true');
    const button = this.root.querySelector<HTMLButtonElement>('[data-library-expand-reward]');
    if (button) button.disabled = true;

    try {
      const result = await this.options.onUnlockShelfExpansion();
      if (this.disposed) return;
      if (result.granted) {
        this.libraryCapacity = Math.max(this.libraryCapacity, result.libraryCapacity);
        this.rewardMessage = this.copy.rewardExpanded;
      } else {
        this.rewardMessage = this.copy.rewardUnavailable;
      }
    } catch (error: unknown) {
      console.error('[squishy:shelf-reward]', error);
      this.rewardMessage = this.copy.rewardUnavailable;
    } finally {
      this.rewardInFlight = false;
      if (!this.disposed) this.renderLibrary();
    }
  }

  private setMuted(muted: boolean): void {
    this.muted = muted;
    this.currentMaker?.setMuted(muted);
    const button = this.root.querySelector<HTMLButtonElement>('[data-library-mute]');
    if (button) { button.setAttribute('aria-pressed', String(muted)); button.textContent = muted ? this.copy.muted : this.copy.sound; }
    void this.options.onMutedChange(muted);
  }

  private toyLabel(toy: SavedSquishy): string {
    const shapes = this.options.language === 'ru' ? RU_SHAPES : EN_SHAPES;
    const materials = this.options.language === 'ru' ? RU_MATERIALS : EN_MATERIALS;
    return `${shapes[toy.shapeId]} · ${materials[toy.materialId]}`;
  }
}
