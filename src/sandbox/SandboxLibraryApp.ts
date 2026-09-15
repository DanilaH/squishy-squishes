import { SandboxApp, type SandboxLanguage } from './SandboxApp';
import { renderLibraryThumbnail } from './libraryThumbnail';
import type { SandboxDraft, SavedSquishy } from './types';

export interface SandboxLibraryCommitResult {
  readonly savedSquishy: SavedSquishy;
  readonly library: readonly SavedSquishy[];
}

export interface SandboxLibraryAppOptions {
  readonly language: SandboxLanguage;
  readonly muted: boolean;
  readonly initialLibrary: readonly SavedSquishy[];
  readonly libraryCapacity: number;
  readonly onAppendSquishy: (draft: SandboxDraft) => Promise<SandboxLibraryCommitResult>;
  readonly onReplaceSquishy: (targetId: string, draft: SandboxDraft) => Promise<SandboxLibraryCommitResult>;
  readonly onDeleteSquishy: (targetId: string) => Promise<readonly SavedSquishy[]>;
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
    replaceHint: 'Your shelf is full. Choose one squishy to replace. Nothing changes until you choose.',
    replaceAction: 'Replace',
    full: 'Shelf full — you can still make another.',
    sound: 'Sound on',
    muted: 'Sound off',
    saveFailed: 'Could not update the shelf. Try again.',
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
    replaceHint: 'Полка заполнена. Выбери сквиш для замены. Пока не выберешь — ничего не удалится.',
    replaceAction: 'Заменить',
    full: 'Полка заполнена — новый сквиш всё равно можно сделать.',
    sound: 'Звук вкл.',
    muted: 'Звук выкл.',
    saveFailed: 'Не получилось обновить полку. Попробуй ещё раз.',
  },
};

const RU_SHAPES: Readonly<Record<SavedSquishy['shapeId'], string>> = {
  'soft-square': 'Кубик',
  heart: 'Сердечко',
  mochi: 'Моти',
  peach: 'Персик',
  mushroom: 'Грибочек',
  paw: 'Лапка',
};

const EN_SHAPES: Readonly<Record<SavedSquishy['shapeId'], string>> = {
  'soft-square': 'Soft Cube',
  heart: 'Heart',
  mochi: 'Mochi',
  peach: 'Peach',
  mushroom: 'Mushroom',
  paw: 'Paw',
};

const RU_MATERIALS: Readonly<Record<SavedSquishy['materialId'], string>> = {
  soft: 'Мягкий',
  jelly: 'Желе',
  holo: 'Голографик',
};

const EN_MATERIALS: Readonly<Record<SavedSquishy['materialId'], string>> = {
  soft: 'Soft',
  jelly: 'Jelly',
  holo: 'Holo',
};

interface PendingReplacement {
  readonly draft: SandboxDraft;
  readonly resolve: (saved: SavedSquishy | null) => void;
}

export class SandboxLibraryApp {
  private readonly abortController = new AbortController();
  private readonly copy: LibraryCopy;
  private library: readonly SavedSquishy[];
  private muted: boolean;
  private currentMaker: SandboxApp | null = null;
  private pendingReplacement: PendingReplacement | null = null;
  private pendingDeleteId: string | null = null;
  private activityBlocked = false;
  private disposed = false;

  public constructor(
    private readonly root: HTMLDivElement,
    private readonly options: SandboxLibraryAppOptions,
  ) {
    this.copy = COPY[options.language];
    this.library = [...options.initialLibrary];
    this.muted = options.muted;
    this.root.addEventListener('click', this.handleClick, { signal: this.abortController.signal });
    this.renderLibrary();
  }

  public setActivityBlocked(blocked: boolean): void {
    this.activityBlocked = blocked;
    this.currentMaker?.setActivityBlocked(blocked);
    this.root.querySelector<HTMLElement>('[data-sandbox-library]')?.classList.toggle('is-blocked', blocked);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pendingReplacement?.resolve(null);
    this.pendingReplacement = null;
    this.currentMaker?.dispose();
    this.currentMaker = null;
    this.abortController.abort();
    this.root.replaceChildren();
  }

  private renderLibrary(): void {
    this.currentMaker?.dispose();
    this.currentMaker = null;
    this.pendingDeleteId = null;
    const count = this.library.length;
    const capacity = this.options.libraryCapacity;
    const full = count >= capacity;
    const cards = this.library.map((toy) => this.renderToyCard(toy)).join('');

    this.root.innerHTML = `
      <main class="sandbox-library-shell${this.activityBlocked ? ' is-blocked' : ''}" data-sandbox-library data-stage="library" data-library-count="${count}" data-library-capacity="${capacity}">
        <header class="sandbox-library-topbar">
          <strong>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-library-mute aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>
        <section class="sandbox-library-heading">
          <div>
            <span>${count} / ${capacity}</span>
            <h1>${this.copy.title}</h1>
          </div>
          <button class="sandbox-library-new" type="button" data-library-new>${this.copy.newSquishy}</button>
        </section>
        ${count === 0 ? `
          <section class="sandbox-library-empty">
            <div class="sandbox-library-empty__toy" aria-hidden="true">✦</div>
            <h2>${this.copy.emptyTitle}</h2>
            <p>${this.copy.emptyHint}</p>
            <button class="sandbox-library-new sandbox-library-new--hero" type="button" data-library-new>${this.copy.newSquishy}</button>
          </section>
        ` : `
          <section class="sandbox-library-grid" aria-label="${this.copy.title}">
            ${cards}
            ${!full ? `<button class="sandbox-library-add-card" type="button" data-library-new><span>＋</span><strong>${this.copy.newSquishy}</strong></button>` : ''}
          </section>
          ${full ? `<p class="sandbox-library-full-note">${this.copy.full}</p>` : ''}
        `}
      </main>
    `;
    this.renderVisibleThumbnails();
  }

  private renderToyCard(toy: SavedSquishy): string {
    const label = this.toyLabel(toy);
    return `
      <article class="sandbox-library-card" data-library-toy="${toy.id}">
        <button class="sandbox-library-card__play" type="button" data-library-play-id="${toy.id}" aria-label="${this.copy.squeeze}: ${label}">
          <canvas class="sandbox-library-card__canvas" data-library-thumbnail="${toy.id}" aria-hidden="true"></canvas>
          <span class="sandbox-library-card__cta">${this.copy.squeeze}</span>
        </button>
        <div class="sandbox-library-card__footer">
          <strong>${label}</strong>
          <button class="sandbox-library-delete" type="button" data-library-delete-id="${toy.id}" aria-label="${this.copy.delete}: ${label}">×</button>
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

  private startMaker(toy: SavedSquishy | null): void {
    this.currentMaker?.dispose();
    this.currentMaker = null;
    this.root.innerHTML = '<div class="sandbox-maker-host" data-sandbox-maker-host></div>';
    const host = this.root.querySelector<HTMLDivElement>('[data-sandbox-maker-host]');
    if (!host) throw new Error('Sandbox library failed to mount maker host.');
    this.currentMaker = new SandboxApp(host, {
      language: this.options.language,
      muted: this.muted,
      savedSquishy: toy,
      startSavedInSqueeze: toy !== null,
      onExitToLibrary: () => this.renderLibrary(),
      onSaveSquishy: (draft) => this.handleSaveRequest(draft),
      onMutedChange: (muted) => this.setMuted(muted),
    });
    this.currentMaker.setActivityBlocked(this.activityBlocked);
  }

  private async handleSaveRequest(draft: SandboxDraft): Promise<SavedSquishy | null> {
    if (this.library.length < this.options.libraryCapacity) {
      const result = await this.options.onAppendSquishy(draft);
      this.library = [...result.library];
      return result.savedSquishy;
    }

    if (this.pendingReplacement) return null;
    return new Promise<SavedSquishy | null>((resolve) => {
      this.pendingReplacement = { draft, resolve };
      this.renderReplaceOverlay();
    });
  }

  private renderReplaceOverlay(): void {
    this.root.querySelector('[data-library-replace-overlay]')?.remove();
    const overlay = document.createElement('section');
    overlay.className = 'sandbox-library-modal sandbox-library-modal--replace';
    overlay.dataset.libraryReplaceOverlay = '';
    overlay.innerHTML = `
      <div class="sandbox-library-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="library-replace-title">
        <span class="sandbox-library-modal__eyebrow">${this.library.length} / ${this.options.libraryCapacity}</span>
        <h2 id="library-replace-title">${this.copy.replaceTitle}</h2>
        <p>${this.copy.replaceHint}</p>
        <div class="sandbox-library-replace-grid">
          ${this.library.map((toy) => `
            <button class="sandbox-library-replace-card" type="button" data-library-replace-id="${toy.id}">
              <canvas data-library-thumbnail="${toy.id}" aria-hidden="true"></canvas>
              <strong>${this.toyLabel(toy)}</strong>
              <span>${this.copy.replaceAction}</span>
            </button>
          `).join('')}
        </div>
        <p class="sandbox-library-modal__error" data-library-modal-error aria-live="polite"></p>
        <button class="sandbox-library-modal__cancel" type="button" data-library-replace-cancel>${this.copy.cancel}</button>
      </div>
    `;
    this.root.append(overlay);
    this.renderVisibleThumbnails(overlay);
  }

  private renderDeleteOverlay(toy: SavedSquishy): void {
    this.root.querySelector('[data-library-delete-overlay]')?.remove();
    const overlay = document.createElement('section');
    overlay.className = 'sandbox-library-modal sandbox-library-modal--delete';
    overlay.dataset.libraryDeleteOverlay = '';
    overlay.innerHTML = `
      <div class="sandbox-library-modal__sheet sandbox-library-modal__sheet--compact" role="dialog" aria-modal="true" aria-labelledby="library-delete-title">
        <canvas class="sandbox-library-delete-preview" data-library-thumbnail="${toy.id}" aria-hidden="true"></canvas>
        <h2 id="library-delete-title">${this.copy.deleteTitle}</h2>
        <p>${this.copy.deleteHint}</p>
        <p class="sandbox-library-modal__error" data-library-modal-error aria-live="polite"></p>
        <div class="sandbox-library-modal__actions">
          <button class="sandbox-library-modal__cancel" type="button" data-library-delete-cancel>${this.copy.cancel}</button>
          <button class="sandbox-library-modal__danger" type="button" data-library-delete-confirm>${this.copy.deleteConfirm}</button>
        </div>
      </div>
    `;
    this.root.append(overlay);
    this.renderVisibleThumbnails(overlay);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disposed || this.activityBlocked) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
    if (!target) return;

    const replacementId = target.dataset.libraryReplaceId;
    if (replacementId) {
      void this.confirmReplacement(replacementId);
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
    if (target.hasAttribute('data-library-new')) {
      this.startMaker(null);
      return;
    }

    const playId = target.dataset.libraryPlayId;
    if (playId) {
      const toy = this.library.find((candidate) => candidate.id === playId);
      if (toy) this.startMaker(toy);
      return;
    }

    const deleteId = target.dataset.libraryDeleteId;
    if (deleteId) {
      const toy = this.library.find((candidate) => candidate.id === deleteId);
      if (!toy) return;
      this.pendingDeleteId = deleteId;
      this.renderDeleteOverlay(toy);
    }
  };

  private async confirmReplacement(targetId: string): Promise<void> {
    const pending = this.pendingReplacement;
    if (!pending) return;
    const overlay = this.root.querySelector<HTMLElement>('[data-library-replace-overlay]');
    overlay?.setAttribute('aria-busy', 'true');
    try {
      const result = await this.options.onReplaceSquishy(targetId, pending.draft);
      this.library = [...result.library];
      this.pendingReplacement = null;
      overlay?.remove();
      pending.resolve(result.savedSquishy);
    } catch (error: unknown) {
      console.error('[squishy:library-replace]', error);
      overlay?.removeAttribute('aria-busy');
      const message = overlay?.querySelector<HTMLElement>('[data-library-modal-error]');
      if (message) message.textContent = this.copy.saveFailed;
    }
  }

  private cancelReplacement(): void {
    const pending = this.pendingReplacement;
    if (!pending) return;
    this.pendingReplacement = null;
    this.root.querySelector('[data-library-replace-overlay]')?.remove();
    pending.resolve(null);
  }

  private async confirmDelete(): Promise<void> {
    const targetId = this.pendingDeleteId;
    if (!targetId) return;
    const overlay = this.root.querySelector<HTMLElement>('[data-library-delete-overlay]');
    overlay?.setAttribute('aria-busy', 'true');
    try {
      this.library = [...await this.options.onDeleteSquishy(targetId)];
      this.pendingDeleteId = null;
      this.renderLibrary();
    } catch (error: unknown) {
      console.error('[squishy:library-delete]', error);
      overlay?.removeAttribute('aria-busy');
      const message = overlay?.querySelector<HTMLElement>('[data-library-modal-error]');
      if (message) message.textContent = this.copy.saveFailed;
    }
  }

  private cancelDelete(): void {
    this.pendingDeleteId = null;
    this.root.querySelector('[data-library-delete-overlay]')?.remove();
  }

  private setMuted(muted: boolean): void {
    this.muted = muted;
    void this.options.onMutedChange(muted);
  }

  private toyLabel(toy: SavedSquishy): string {
    const shapes = this.options.language === 'ru' ? RU_SHAPES : EN_SHAPES;
    const materials = this.options.language === 'ru' ? RU_MATERIALS : EN_MATERIALS;
    return `${shapes[toy.shapeId]} · ${materials[toy.materialId]}`;
  }
}
