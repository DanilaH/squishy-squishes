import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);
const replace = (content, from, to, label) => {
  if (!content.includes(from)) throw new Error(`Missing patch anchor: ${label}`);
  return content.replace(from, to);
};

// SandboxApp: Idea mode may preselect a shape, but it never disables alternatives.
{
  const path = 'src/sandbox/SandboxApp.ts';
  let content = read(path);
  content = replace(
    content,
    "  readonly savedSquishy: SavedSquishy | null;\n  readonly startSavedInSqueeze?: boolean;",
    "  readonly savedSquishy: SavedSquishy | null;\n  readonly initialShapeId?: ShapeId;\n  readonly startSavedInSqueeze?: boolean;",
    'SandboxApp option',
  );
  content = replace(
    content,
    "    this.savedSquishy = options.savedSquishy;\n    this.muted = options.muted;\n    this.stage = this.savedSquishy ? (options.startSavedInSqueeze ? 'squeeze' : 'home') : 'shape';",
    "    this.savedSquishy = options.savedSquishy;\n    if (!this.savedSquishy && options.initialShapeId) {\n      this.draft = { ...this.draft, shapeId: options.initialShapeId };\n    }\n    this.muted = options.muted;\n    this.stage = this.savedSquishy ? (options.startSavedInSqueeze ? 'squeeze' : 'home') : 'shape';",
    'SandboxApp initial shape',
  );
  content = replace(
    content,
    "aria-pressed=\"${shape.id === 'soft-square'}\"",
    "aria-pressed=\"${shape.id === this.draft.shapeId}\"",
    'SandboxApp shape pressed state',
  );
  content = replace(
    content,
    "data-stage=\"${this.stage}\" data-shape=\"soft-square\" data-material=\"soft\"",
    "data-stage=\"${this.stage}\" data-shape=\"${this.draft.shapeId}\" data-material=\"soft\"",
    'SandboxApp initial shape dataset',
  );
  write(path, content);
}

// Library: secondary Ideas surface + optional Idea context around the same maker.
{
  const path = 'src/sandbox/SandboxLibraryApp.ts';
  let content = read(path);
  content = replace(
    content,
    "import { SandboxApp, type SandboxLanguage } from './SandboxApp';\nimport { renderLibraryThumbnail } from './libraryThumbnail';\nimport type { SandboxDraft, SavedSquishy } from './types';",
    "import { SandboxApp, type SandboxLanguage } from './SandboxApp';\nimport {\n  SQUISHY_IDEAS,\n  getIdeaLabel,\n  getIdeaMaterialLabel,\n  getIdeaMixinLabel,\n  getIdeaShapeLabel,\n  type SquishyIdea,\n} from './ideas';\nimport { renderLibraryThumbnail } from './libraryThumbnail';\nimport { getSquishyTitle } from './titles';\nimport type { SandboxDraft, SavedSquishy } from './types';",
    'Library imports',
  );
  content = replace(
    content,
    "export interface SandboxLibraryCommitResult {\n  readonly savedSquishy: SavedSquishy;\n  readonly library: readonly SavedSquishy[];\n}",
    "export interface SandboxLibraryCommitResult {\n  readonly savedSquishy: SavedSquishy;\n  readonly library: readonly SavedSquishy[];\n  readonly completedRecipeIds: readonly string[];\n}",
    'Library commit result',
  );
  content = replace(
    content,
    "  readonly initialLibrary: readonly SavedSquishy[];\n  readonly libraryCapacity: number;\n  readonly onAppendSquishy: (draft: SandboxDraft) => Promise<SandboxLibraryCommitResult>;\n  readonly onReplaceSquishy: (targetId: string, draft: SandboxDraft) => Promise<SandboxLibraryCommitResult>;",
    "  readonly initialLibrary: readonly SavedSquishy[];\n  readonly initialCompletedRecipeIds: readonly string[];\n  readonly libraryCapacity: number;\n  readonly onAppendSquishy: (draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;\n  readonly onReplaceSquishy: (targetId: string, draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;",
    'Library options',
  );
  content = replace(
    content,
    "  readonly saveFailed: string;\n}",
    "  readonly saveFailed: string;\n  readonly ideas: string;\n  readonly ideasTitle: string;\n  readonly ideasHint: string;\n  readonly backToLibrary: string;\n  readonly completed: string;\n  readonly goal: string;\n  readonly ideaComplete: string;\n}\n",
    'Library copy interface',
  );
  content = replace(
    content,
    "    saveFailed: 'Could not update the shelf. Try again.',\n  },",
    "    saveFailed: 'Could not update the shelf. Try again.',\n    ideas: 'IDEAS',\n    ideasTitle: 'SQUISHY IDEAS',\n    ideasHint: 'Pick a target if you want a little inspiration. You can still make it your way.',\n    backToLibrary: 'BACK TO LIBRARY',\n    completed: 'DONE',\n    goal: 'IDEA',\n    ideaComplete: 'IDEA COMPLETE',\n  },",
    'English Ideas copy',
  );
  content = replace(
    content,
    "    saveFailed: 'Не получилось обновить полку. Попробуй ещё раз.',\n  },",
    "    saveFailed: 'Не получилось обновить полку. Попробуй ещё раз.',\n    ideas: 'ИДЕИ',\n    ideasTitle: 'ИДЕИ ДЛЯ СКВИШЕЙ',\n    ideasHint: 'Выбери цель для вдохновения. Делать по-своему всё равно можно.',\n    backToLibrary: 'НАЗАД К ПОЛКЕ',\n    completed: 'ГОТОВО',\n    goal: 'ИДЕЯ',\n    ideaComplete: 'ИДЕЯ ГОТОВА',\n  },",
    'Russian Ideas copy',
  );
  content = replace(
    content,
    "interface PendingReplacement {\n  readonly draft: SandboxDraft;\n  readonly resolve: (saved: SavedSquishy | null) => void;\n}",
    "interface PendingReplacement {\n  readonly draft: SandboxDraft;\n  readonly ideaId: string | null;\n  readonly resolve: (saved: SavedSquishy | null) => void;\n}",
    'Pending replacement Idea context',
  );
  content = replace(
    content,
    "  private library: readonly SavedSquishy[];\n  private muted: boolean;\n  private currentMaker: SandboxApp | null = null;",
    "  private library: readonly SavedSquishy[];\n  private completedRecipeIds: readonly string[];\n  private muted: boolean;\n  private activeIdea: SquishyIdea | null = null;\n  private currentMaker: SandboxApp | null = null;",
    'Library state',
  );
  content = replace(
    content,
    "    this.copy = COPY[options.language];\n    this.library = [...options.initialLibrary];\n    this.muted = options.muted;",
    "    this.copy = COPY[options.language];\n    this.library = [...options.initialLibrary];\n    this.completedRecipeIds = [...options.initialCompletedRecipeIds];\n    this.muted = options.muted;",
    'Library constructor state',
  );
  content = replace(
    content,
    "    this.root.querySelector<HTMLElement>('[data-sandbox-library]')?.classList.toggle('is-blocked', blocked);",
    "    this.root.querySelector<HTMLElement>('[data-sandbox-library], [data-sandbox-ideas]')?.classList.toggle('is-blocked', blocked);",
    'Library block surface',
  );
  content = replace(
    content,
    "    this.currentMaker = null;\n    this.pendingDeleteId = null;\n    const count = this.library.length;",
    "    this.currentMaker = null;\n    this.activeIdea = null;\n    this.pendingDeleteId = null;\n    const count = this.library.length;",
    'Library reset active Idea',
  );
  content = replace(
    content,
    "          <div>\n            <span>${count} / ${capacity}</span>\n            <h1>${this.copy.title}</h1>\n          </div>\n          <button class=\"sandbox-library-new\" type=\"button\" data-library-new>${this.copy.newSquishy}</button>",
    "          <div>\n            <span class=\"sandbox-library-status\">${getSquishyTitle(this.completedRecipeIds.length, this.options.language)} · ${count} / ${capacity}</span>\n            <h1>${this.copy.title}</h1>\n          </div>\n          <div class=\"sandbox-library-heading__actions\">\n            <button class=\"sandbox-library-ideas\" type=\"button\" data-library-ideas>${this.copy.ideas}</button>\n            <button class=\"sandbox-library-new\" type=\"button\" data-library-new>${this.copy.newSquishy}</button>\n          </div>",
    'Library heading Ideas action',
  );

  const insertBeforeToyCard = `  private renderToyCard(toy: SavedSquishy): string {`;
  const ideasMethods = `  private renderIdeas(): void {\n    this.currentMaker?.dispose();\n    this.currentMaker = null;\n    this.activeIdea = null;\n    this.pendingDeleteId = null;\n    const completed = new Set(this.completedRecipeIds);\n    const title = getSquishyTitle(this.completedRecipeIds.length, this.options.language);\n    const cards = SQUISHY_IDEAS.map((idea) => {\n      const done = completed.has(idea.id);\n      const mixin = getIdeaMixinLabel(idea, this.options.language);\n      return \`\n        <button class=\"sandbox-idea-card\${done ? ' is-complete' : ''}\" type=\"button\" data-idea-id=\"\${escapeAttribute(idea.id)}\" aria-pressed=\"\${done}\">\n          <span class=\"sandbox-idea-card__top\">\n            <span class=\"sandbox-idea-card__shape\">\${getIdeaShapeLabel(idea, this.options.language)}</span>\n            \${done ? \`<strong>✓ \${this.copy.completed}</strong>\` : ''}\n          </span>\n          <span class=\"sandbox-idea-card__name\">\${getIdeaLabel(idea, this.options.language)}</span>\n          <span class=\"sandbox-idea-card__cues\">\n            <i style=\"--idea-color:#\${idea.paintColor.toString(16).padStart(6, '0')}\"></i>\n            <span>\${getIdeaMaterialLabel(idea, this.options.language)}</span>\n            \${mixin ? \`<span>· \${mixin}</span>\` : ''}\n          </span>\n        </button>\n      \`;\n    }).join('');\n\n    this.root.innerHTML = \`\n      <main class=\"sandbox-library-shell sandbox-ideas-shell\${this.activityBlocked ? ' is-blocked' : ''}\" data-sandbox-ideas data-stage=\"ideas\" data-ideas-count=\"\${SQUISHY_IDEAS.length}\" data-completed-count=\"\${this.completedRecipeIds.length}\">\n        <header class=\"sandbox-library-topbar\">\n          <strong>\${this.copy.studio}</strong>\n          <button class=\"sandbox-sound\" type=\"button\" data-library-mute aria-pressed=\"\${this.muted}\">\${this.muted ? this.copy.muted : this.copy.sound}</button>\n        </header>\n        <section class=\"sandbox-ideas-heading\">\n          <button class=\"sandbox-library-ideas sandbox-library-ideas--back\" type=\"button\" data-ideas-back>← \${this.copy.backToLibrary}</button>\n          <span>\${title} · \${this.completedRecipeIds.length} / \${SQUISHY_IDEAS.length}</span>\n          <h1>\${this.copy.ideasTitle}</h1>\n          <p>\${this.copy.ideasHint}</p>\n        </section>\n        <section class=\"sandbox-ideas-grid\" aria-label=\"\${this.copy.ideasTitle}\">\${cards}</section>\n      </main>\n    \`;\n  }\n\n  private renderIdeaGuideMarkup(idea: SquishyIdea): string {\n    const mixin = getIdeaMixinLabel(idea, this.options.language);\n    return \`\n      <aside class=\"sandbox-idea-guide\" data-idea-guide data-idea-active=\"\${escapeAttribute(idea.id)}\">\n        <strong>\${this.copy.goal}: \${getIdeaLabel(idea, this.options.language)}</strong>\n        <span><i style=\"--idea-color:#\${idea.paintColor.toString(16).padStart(6, '0')}\"></i>\${getIdeaShapeLabel(idea, this.options.language)} · \${getIdeaMaterialLabel(idea, this.options.language)}\${mixin ? \` · \${mixin}\` : ''}</span>\n      </aside>\n    \`;\n  }\n\n  private renderIdeaCompletion(ideaId: string, previousCompleted: readonly string[]): void {\n    if (previousCompleted.includes(ideaId) || !this.completedRecipeIds.includes(ideaId)) return;\n    const idea = SQUISHY_IDEAS.find((candidate) => candidate.id === ideaId);\n    if (!idea) return;\n    this.root.querySelector('[data-idea-complete]')?.remove();\n    const notice = document.createElement('aside');\n    notice.className = 'sandbox-idea-complete';\n    notice.dataset.ideaComplete = '';\n    notice.innerHTML = \`<strong>✓ \${this.copy.ideaComplete}</strong><span>\${getIdeaLabel(idea, this.options.language)} · \${getSquishyTitle(this.completedRecipeIds.length, this.options.language)}</span>\`;\n    this.root.append(notice);\n  }\n\n`;
  content = replace(content, insertBeforeToyCard, ideasMethods + insertBeforeToyCard, 'Ideas methods');

  content = replace(
    content,
    "  private startMaker(toy: SavedSquishy | null): void {\n    this.currentMaker?.dispose();\n    this.currentMaker = null;\n    this.root.innerHTML = '<div class=\"sandbox-maker-host\" data-sandbox-maker-host></div>';",
    "  private startMaker(toy: SavedSquishy | null, idea: SquishyIdea | null = null): void {\n    this.currentMaker?.dispose();\n    this.currentMaker = null;\n    this.activeIdea = toy ? null : idea;\n    this.root.innerHTML = `<div class=\"sandbox-maker-host\" data-sandbox-maker-host></div>${idea ? this.renderIdeaGuideMarkup(idea) : ''}`;",
    'Maker Idea context',
  );
  content = replace(
    content,
    "      savedSquishy: toy,\n      startSavedInSqueeze: toy !== null,\n      onExitToLibrary: () => this.renderLibrary(),",
    "      savedSquishy: toy,\n      initialShapeId: toy ? undefined : idea?.shapeId,\n      startSavedInSqueeze: toy !== null,\n      onExitToLibrary: () => this.renderLibrary(),",
    'Maker initial Idea shape',
  );
  content = replace(
    content,
    "  private async handleSaveRequest(draft: SandboxDraft): Promise<SavedSquishy | null> {\n    if (this.library.length < this.options.libraryCapacity) {\n      const result = await this.options.onAppendSquishy(draft);\n      this.library = [...result.library];\n      return result.savedSquishy;\n    }\n\n    if (this.pendingReplacement) return null;\n    return new Promise<SavedSquishy | null>((resolve) => {\n      this.pendingReplacement = { draft, resolve };",
    "  private async handleSaveRequest(draft: SandboxDraft): Promise<SavedSquishy | null> {\n    const ideaId = this.activeIdea?.id ?? null;\n    if (this.library.length < this.options.libraryCapacity) {\n      const previousCompleted = this.completedRecipeIds;\n      const result = await this.options.onAppendSquishy(draft, ideaId);\n      this.library = [...result.library];\n      this.completedRecipeIds = [...result.completedRecipeIds];\n      if (ideaId) this.renderIdeaCompletion(ideaId, previousCompleted);\n      return result.savedSquishy;\n    }\n\n    if (this.pendingReplacement) return null;\n    return new Promise<SavedSquishy | null>((resolve) => {\n      this.pendingReplacement = { draft, ideaId, resolve };",
    'Save request Idea completion',
  );
  content = replace(
    content,
    "    if (target.hasAttribute('data-library-new')) {\n      this.startMaker(null);\n      return;\n    }\n\n    const playId = target.dataset.libraryPlayId;",
    "    if (target.hasAttribute('data-library-ideas')) {\n      this.renderIdeas();\n      return;\n    }\n    if (target.hasAttribute('data-ideas-back')) {\n      this.renderLibrary();\n      return;\n    }\n    const ideaId = target.dataset.ideaId;\n    if (ideaId) {\n      const idea = SQUISHY_IDEAS.find((candidate) => candidate.id === ideaId);\n      if (idea) this.startMaker(null, idea);\n      return;\n    }\n    if (target.hasAttribute('data-library-new')) {\n      this.startMaker(null);\n      return;\n    }\n\n    const playId = target.dataset.libraryPlayId;",
    'Ideas click handling',
  );
  content = replace(
    content,
    "    try {\n      const result = await this.options.onReplaceSquishy(targetId, pending.draft);\n      this.library = [...result.library];\n      this.pendingReplacement = null;\n      overlay?.remove();\n      pending.resolve(result.savedSquishy);",
    "    try {\n      const previousCompleted = this.completedRecipeIds;\n      const result = await this.options.onReplaceSquishy(targetId, pending.draft, pending.ideaId);\n      this.library = [...result.library];\n      this.completedRecipeIds = [...result.completedRecipeIds];\n      this.pendingReplacement = null;\n      overlay?.remove();\n      if (pending.ideaId) this.renderIdeaCompletion(pending.ideaId, previousCompleted);\n      pending.resolve(result.savedSquishy);",
    'Replacement Idea completion',
  );
  write(path, content);
}

// Bootstrap owns transactional completion persistence.
{
  const path = 'src/app/bootstrap.ts';
  let content = read(path);
  content = replace(
    content,
    "import { createDefaultSettings, createSettingsRepository } from '../platform/settings';\nimport { SandboxLibraryApp } from '../sandbox/SandboxLibraryApp';",
    "import { createDefaultSettings, createSettingsRepository } from '../platform/settings';\nimport { completeRecipeIdea } from '../platform/saveV3Ideas';\nimport { SandboxLibraryApp } from '../sandbox/SandboxLibraryApp';\nimport { getSquishyIdea, matchSquishyIdea } from '../sandbox/ideas';",
    'Bootstrap Idea imports',
  );
  content = replace(
    content,
    "  const language: SandboxLanguage = runtime.language === 'ru' ? 'ru' : 'en';\n  const app = new SandboxLibraryApp(root, {",
    "  const completeMatchingIdea = (state: typeof saveState, draft: Parameters<typeof createSavedSquishy>[0], ideaId: string | null): typeof saveState => {\n    if (!ideaId) return state;\n    const idea = getSquishyIdea(ideaId);\n    if (!idea || !matchSquishyIdea(draft, idea).complete) return state;\n    return completeRecipeIdea(state, ideaId);\n  };\n\n  const language: SandboxLanguage = runtime.language === 'ru' ? 'ru' : 'en';\n  const app = new SandboxLibraryApp(root, {",
    'Bootstrap matching helper',
  );
  content = replace(
    content,
    "    initialLibrary: saveState.library,\n    libraryCapacity: saveState.libraryCapacity,\n    onAppendSquishy: async (draft) => {\n      const savedSquishy = createSavedSquishy(draft);\n      const nextState = appendSavedSquishy(saveState, savedSquishy);\n      await persistSave(nextState);\n      return { savedSquishy, library: nextState.library };\n    },\n    onReplaceSquishy: async (targetId, draft) => {\n      const savedSquishy = createSavedSquishy(draft);\n      const nextState = replaceSavedSquishy(saveState, targetId, savedSquishy);\n      await persistSave(nextState);\n      return { savedSquishy, library: nextState.library };",
    "    initialLibrary: saveState.library,\n    initialCompletedRecipeIds: saveState.completedRecipeIds,\n    libraryCapacity: saveState.libraryCapacity,\n    onAppendSquishy: async (draft, ideaId) => {\n      const savedSquishy = createSavedSquishy(draft);\n      let nextState = appendSavedSquishy(saveState, savedSquishy);\n      nextState = completeMatchingIdea(nextState, draft, ideaId);\n      await persistSave(nextState);\n      return { savedSquishy, library: nextState.library, completedRecipeIds: nextState.completedRecipeIds };\n    },\n    onReplaceSquishy: async (targetId, draft, ideaId) => {\n      const savedSquishy = createSavedSquishy(draft);\n      let nextState = replaceSavedSquishy(saveState, targetId, savedSquishy);\n      nextState = completeMatchingIdea(nextState, draft, ideaId);\n      await persistSave(nextState);\n      return { savedSquishy, library: nextState.library, completedRecipeIds: nextState.completedRecipeIds };",
    'Bootstrap commit callbacks',
  );
  write(path, content);
}

// Load the dedicated S4 presentation layer.
{
  const path = 'src/main.ts';
  let content = read(path);
  content = replace(
    content,
    "import './sandbox-library.css';\nimport { bootstrapSquishyApp }",
    "import './sandbox-library.css';\nimport './sandbox-ideas.css';\nimport { bootstrapSquishyApp }",
    'Ideas CSS import',
  );
  write(path, content);
}

// Advance the canonical roadmap now that S3 is shipped and S4 is active.
{
  const path = 'docs/IMPLEMENTATION_ROADMAP.md';
  let content = read(path);
  content = replace(
    content,
    "**Status:** SANDBOX PIVOT ACTIVE / S2 PERSONAL LIBRARY ENGINEERING PASSED\n**Current development gate:** S3 — Decor MVP",
    "**Status:** SANDBOX PIVOT ACTIVE / S3 DECOR ENGINEERING PASSED\n**Current development gate:** S4 — Ideas / Recipes + Humorous Titles",
    'Roadmap current gate',
  );
  content = replace(
    content,
    "## S3 — Decor MVP\n\nAdd reusable identity after library persistence is stable:\n\n- eyes;\n- mouths;\n- blush;\n- flowers;\n- hearts/stars/stickers;\n- simple anchored accessories such as ears, bows, horns and crown.\n\nReuse stable appearance/deformation principles where appropriate. Do not begin with draggable ears or custom accessory physics.\n\n---\n\n## S4 — Ideas / Recipes + Humorous Titles",
    "## S3 — Decor MVP — PASS / ENGINEERING COMPLETE\n\nS3 added reusable authored identity while preserving one generic squishy renderer and SaveState V3:\n\n- eyes, mouths and blush rendered into the existing appearance texture;\n- up to 12 surface stickers;\n- one exclusive head accessory slot;\n- generic read-only UV → deformed-mesh projection for attached accessories;\n- Library thumbnails reconstruct surface decor + accessory without per-card WebGL;\n- compact Decor persistence remains inside the V3 envelope;\n- permanent Browser QA covers persistence, all six shapes, payload budget, responsive containment and accessory attachment during real squeeze;\n- production visual acceptance passed before PR #24;\n- final S3 commit on `main`: `87855d4c0483e9b0ccdc38130d0fde88a0ee3eeb`.\n\nPhysical-device/manual touch acceptance remains an external release gate.\n\n---\n\n## S4 — Ideas / Recipes + Humorous Titles",
    'Roadmap S3 completion',
  );
  write(path, content);
}

console.log('Sandbox S4 patch applied.');
