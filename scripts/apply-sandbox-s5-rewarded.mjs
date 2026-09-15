import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`${label}: anchor not found`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`${label}: anchor is ambiguous`);
  return source.replace(before, after);
};

const libraryPath = 'src/sandbox/SandboxLibraryApp.ts';
let library = readFileSync(libraryPath, 'utf8');

library = replaceOnce(
  library,
  `  readonly libraryCapacity: number;\n  readonly onAppendSquishy: (draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;\n`,
  `  readonly libraryCapacity: number;\n  readonly shelfExpansionTargetCapacity: number;\n  readonly onUnlockShelfExpansion: () => Promise<{ readonly granted: boolean; readonly libraryCapacity: number; readonly status: 'closed' | 'error' }>;\n  readonly onAppendSquishy: (draft: SandboxDraft, ideaId: string | null) => Promise<SandboxLibraryCommitResult>;\n`,
  'library options reward contract',
);

library = replaceOnce(
  library,
  `  readonly ideaComplete: string;\n}\n`,
  `  readonly ideaComplete: string;\n  readonly rewardEyebrow: string;\n  readonly rewardTitle: string;\n  readonly rewardHint: string;\n  readonly rewardAction: string;\n  readonly rewardExpanded: string;\n  readonly rewardUnavailable: string;\n}\n`,
  'library copy reward fields',
);

library = replaceOnce(
  library,
  `    ideaComplete: 'IDEA COMPLETE',\n  },\n`,
  `    ideaComplete: 'IDEA COMPLETE',\n    rewardEyebrow: 'OPTIONAL UPGRADE',\n    rewardTitle: 'MAKE ROOM FOR TWO MORE',\n    rewardHint: 'Watch one ad to keep 10 squishies on this shelf forever.',\n    rewardAction: 'WATCH AD · +2 SLOTS',\n    rewardExpanded: 'Shelf expanded · 10 slots',\n    rewardUnavailable: 'No shelf change. Try again when you want.',\n  },\n`,
  'english reward copy',
);

library = replaceOnce(
  library,
  `    ideaComplete: 'ИДЕЯ ГОТОВА',\n  },\n`,
  `    ideaComplete: 'ИДЕЯ ГОТОВА',\n    rewardEyebrow: 'НЕОБЯЗАТЕЛЬНО',\n    rewardTitle: 'ЕЩЁ ДВА МЕСТА НА ПОЛКЕ',\n    rewardHint: 'Посмотри одну рекламу — и навсегда храни здесь до 10 сквишей.',\n    rewardAction: 'РЕКЛАМА · +2 МЕСТА',\n    rewardExpanded: 'Полка расширена · 10 мест',\n    rewardUnavailable: 'Полка не изменилась. Можно попробовать позже.',\n  },\n`,
  'russian reward copy',
);

library = replaceOnce(
  library,
  `  private completedRecipeIds: readonly string[];\n  private muted: boolean;\n`,
  `  private completedRecipeIds: readonly string[];\n  private libraryCapacity: number;\n  private muted: boolean;\n  private rewardInFlight = false;\n  private rewardMessage: string | null = null;\n`,
  'library reward state fields',
);

library = replaceOnce(
  library,
  `    this.library = [...options.initialLibrary];\n    this.completedRecipeIds = [...options.initialCompletedRecipeIds];\n    this.muted = options.muted;\n`,
  `    this.library = [...options.initialLibrary];\n    this.completedRecipeIds = [...options.initialCompletedRecipeIds];\n    this.libraryCapacity = options.libraryCapacity;\n    this.muted = options.muted;\n`,
  'library capacity initialization',
);

library = replaceOnce(
  library,
  `    const capacity = this.options.libraryCapacity;\n    const full = count >= capacity;\n    const cards = this.library.map((toy) => this.renderToyCard(toy)).join('');\n`,
  `    const capacity = this.libraryCapacity;\n    const full = count >= capacity;\n    const canExpandShelf = capacity < this.options.shelfExpansionTargetCapacity;\n    const cards = this.library.map((toy) => this.renderToyCard(toy)).join('');\n`,
  'library render capacity',
);

library = replaceOnce(
  library,
  `          ${'${'}full ? \`<p class="sandbox-library-full-note">${'${'}this.copy.full}</p>\` : ''}\n        \`}\n      </main>\n`,
  `          ${'${'}full ? \`\n            <section class="sandbox-library-full-zone">\n              <p class="sandbox-library-full-note">${'${'}this.copy.full}</p>\n              ${'${'}canExpandShelf ? \`\n                <aside class="sandbox-library-reward" data-library-reward-offer>\n                  <div class="sandbox-library-reward__copy">\n                    <span>${'${'}this.copy.rewardEyebrow}</span>\n                    <strong>${'${'}this.copy.rewardTitle}</strong>\n                    <p>${'${'}this.copy.rewardHint}</p>\n                  </div>\n                  <button type="button" data-library-expand-reward ${'${'}this.rewardInFlight ? 'disabled' : ''}>${'${'}this.copy.rewardAction}</button>\n                </aside>\n              \` : ''}\n            </section>\n          \` : ''}\n          ${'${'}this.rewardMessage ? \`<p class="sandbox-library-reward-message" data-library-reward-message aria-live="polite">${'${'}this.rewardMessage}</p>\` : ''}\n        \`}\n      </main>\n`,
  'library full reward markup',
);

library = replaceOnce(
  library,
  `    this.activeIdea = toy ? null : idea;\n    this.root.innerHTML = \`<div class="sandbox-maker-host" data-sandbox-maker-host></div>${'${'}idea ? this.renderIdeaGuideMarkup(idea) : ''}\`;\n`,
  `    this.activeIdea = toy ? null : idea;\n    this.rewardMessage = null;\n    this.root.innerHTML = \`<div class="sandbox-maker-host" data-sandbox-maker-host></div>${'${'}idea ? this.renderIdeaGuideMarkup(idea) : ''}\`;\n`,
  'clear reward message entering maker',
);

library = replaceOnce(
  library,
  `    if (this.library.length < this.options.libraryCapacity) {\n`,
  `    if (this.library.length < this.libraryCapacity) {\n`,
  'save uses live library capacity',
);

library = replaceOnce(
  library,
  `        <span class="sandbox-library-modal__eyebrow">${'${'}this.library.length} / ${'${'}this.options.libraryCapacity}</span>\n`,
  `        <span class="sandbox-library-modal__eyebrow">${'${'}this.library.length} / ${'${'}this.libraryCapacity}</span>\n`,
  'replacement modal live capacity',
);

library = replaceOnce(
  library,
  `    if (target.hasAttribute('data-library-ideas')) {\n      this.renderIdeas();\n      return;\n    }\n`,
  `    if (target.hasAttribute('data-library-expand-reward')) {\n      void this.unlockShelfExpansion();\n      return;\n    }\n    if (target.hasAttribute('data-library-ideas')) {\n      this.rewardMessage = null;\n      this.renderIdeas();\n      return;\n    }\n`,
  'reward click handling',
);

library = replaceOnce(
  library,
  `  private setMuted(muted: boolean): void {\n`,
  `  private async unlockShelfExpansion(): Promise<void> {\n    if (this.rewardInFlight || this.libraryCapacity >= this.options.shelfExpansionTargetCapacity) return;\n    this.rewardInFlight = true;\n    this.rewardMessage = null;\n    const offer = this.root.querySelector<HTMLElement>('[data-library-reward-offer]');\n    offer?.setAttribute('aria-busy', 'true');\n    const button = this.root.querySelector<HTMLButtonElement>('[data-library-expand-reward]');\n    if (button) button.disabled = true;\n\n    try {\n      const result = await this.options.onUnlockShelfExpansion();\n      if (result.granted) {\n        this.libraryCapacity = Math.max(this.libraryCapacity, result.libraryCapacity);\n        this.rewardMessage = this.copy.rewardExpanded;\n      } else {\n        this.rewardMessage = this.copy.rewardUnavailable;\n      }\n    } catch (error: unknown) {\n      console.error('[squishy:shelf-reward]', error);\n      this.rewardMessage = this.copy.rewardUnavailable;\n    } finally {\n      this.rewardInFlight = false;\n      this.renderLibrary();\n    }\n  }\n\n  private setMuted(muted: boolean): void {\n`,
  'reward grant method',
);

writeFileSync(libraryPath, library);

const bootstrapPath = 'src/app/bootstrap.ts';
let bootstrap = readFileSync(bootstrapPath, 'utf8');
bootstrap = replaceOnce(
  bootstrap,
  `import { completeRecipeIdea } from '../platform/saveV3Ideas';\n`,
  `import { completeRecipeIdea } from '../platform/saveV3Ideas';\nimport {\n  S5_SHELF_EXPANSION_CAPACITY,\n  S5_SHELF_EXPANSION_REWARD_ID,\n  grantS5ShelfExpansion,\n  hasS5ShelfExpansion,\n} from '../platform/saveV3Rewards';\n`,
  'bootstrap S5 reward imports',
);

bootstrap = replaceOnce(
  bootstrap,
  `  const completeMatchingIdea = (state: typeof saveState, draft: Parameters<typeof createSavedSquishy>[0], ideaId: string | null): typeof saveState => {\n`,
  `  if (hasS5ShelfExpansion(saveState) && saveState.libraryCapacity < S5_SHELF_EXPANSION_CAPACITY) {\n    await persistSave(grantS5ShelfExpansion(saveState));\n  }\n\n  const completeMatchingIdea = (state: typeof saveState, draft: Parameters<typeof createSavedSquishy>[0], ideaId: string | null): typeof saveState => {\n`,
  'bootstrap reward reconciliation',
);

bootstrap = replaceOnce(
  bootstrap,
  `    libraryCapacity: saveState.libraryCapacity,\n    onAppendSquishy: async (draft, ideaId) => {\n`,
  `    libraryCapacity: saveState.libraryCapacity,\n    shelfExpansionTargetCapacity: S5_SHELF_EXPANSION_CAPACITY,\n    onUnlockShelfExpansion: async () => {\n      runtime.analytics.track('shelf_reward_offer_click', {\n        count: saveState.library.length,\n        capacity: saveState.libraryCapacity,\n      });\n      let grantedCapacity = saveState.libraryCapacity;\n      const result = await runtime.ads.showRewarded({\n        rewardId: S5_SHELF_EXPANSION_REWARD_ID,\n        onReward: async () => {\n          const nextState = grantS5ShelfExpansion(saveState);\n          await persistSave(nextState);\n          grantedCapacity = nextState.libraryCapacity;\n          runtime.analytics.track('shelf_reward_granted', { capacity: nextState.libraryCapacity });\n        },\n      });\n      return {\n        granted: result.rewardEarned,\n        libraryCapacity: grantedCapacity,\n        status: result.status,\n      };\n    },\n    onAppendSquishy: async (draft, ideaId) => {\n`,
  'bootstrap rewarded callback',
);
writeFileSync(bootstrapPath, bootstrap);

const cssPath = 'src/sandbox-library.css';
let css = readFileSync(cssPath, 'utf8');
css += `\n\n/* S5 rewarded shelf expansion */\n.sandbox-library-full-zone {\n  width: min(100%, 820px);\n  margin: 14px auto 0;\n  display: grid;\n  gap: 10px;\n}\n\n.sandbox-library-full-zone .sandbox-library-full-note {\n  width: 100%;\n  margin: 0;\n}\n\n.sandbox-library-reward {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 18px;\n  padding: 13px 14px 13px 16px;\n  border: 1px solid rgba(143, 83, 213, .18);\n  border-radius: 20px;\n  background: linear-gradient(135deg, rgba(255,255,255,.88), rgba(247,237,255,.92));\n  box-shadow: 0 8px 22px rgba(75,54,94,.07);\n}\n\n.sandbox-library-reward[aria-busy="true"] { opacity: .72; }\n.sandbox-library-reward__copy { min-width: 0; display: grid; gap: 2px; text-align: left; }\n.sandbox-library-reward__copy > span { color: #9566bd; font-size: 9px; font-weight: 950; letter-spacing: .12em; }\n.sandbox-library-reward__copy > strong { color: var(--library-ink); font-size: 14px; font-weight: 950; }\n.sandbox-library-reward__copy > p { margin: 0; color: var(--library-muted); font-size: 10px; line-height: 1.3; font-weight: 700; }\n.sandbox-library-reward > button {\n  flex: 0 0 auto;\n  min-height: 42px;\n  padding: 0 15px;\n  border: 0;\n  border-radius: 14px;\n  background: linear-gradient(145deg, #b66ce8, #8f53d5);\n  color: #fff;\n  box-shadow: 0 7px 16px rgba(118,70,173,.20), inset 0 1px rgba(255,255,255,.24);\n  font-size: 10px;\n  font-weight: 950;\n  letter-spacing: .035em;\n  cursor: pointer;\n}\n.sandbox-library-reward > button:disabled { opacity: .55; cursor: default; }\n.sandbox-library-reward-message {\n  width: min(100%, 820px);\n  margin: 10px auto 0;\n  color: #4f8e69;\n  text-align: center;\n  font-size: 11px;\n  font-weight: 900;\n}\n\n@media (max-width: 700px) {\n  .sandbox-library-reward { align-items: stretch; gap: 10px; padding: 11px; }\n  .sandbox-library-reward__copy > strong { font-size: 12px; }\n  .sandbox-library-reward__copy > p { font-size: 9px; }\n  .sandbox-library-reward > button { max-width: 132px; white-space: normal; line-height: 1.05; }\n}\n\n@media (max-width: 430px) {\n  .sandbox-library-reward { display: grid; }\n  .sandbox-library-reward > button { width: 100%; max-width: none; }\n}\n\n@media (max-height: 520px) and (orientation: landscape) {\n  .sandbox-library-full-zone { margin-top: 6px; gap: 5px; }\n  .sandbox-library-reward { padding: 6px 8px; border-radius: 14px; gap: 8px; }\n  .sandbox-library-reward__copy { grid-template-columns: auto 1fr; gap: 1px 8px; align-items: center; }\n  .sandbox-library-reward__copy > span { font-size: 7px; }\n  .sandbox-library-reward__copy > strong { font-size: 10px; }\n  .sandbox-library-reward__copy > p { display: none; }\n  .sandbox-library-reward > button { min-height: 34px; padding-inline: 10px; font-size: 8px; }\n  .sandbox-library-reward-message { margin-top: 4px; font-size: 9px; }\n}\n`;
writeFileSync(cssPath, css);

const monetizationPath = 'docs/ANALYTICS_AND_MONETIZATION.md';
let monetization = readFileSync(monetizationPath, 'utf8');
const sectionStart = monetization.indexOf('## 6. Rewarded strategy');
const sectionEnd = monetization.indexOf('## 7. Reward grant contract');
if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) throw new Error('monetization rewarded section anchors not found');
const replacement = `## 6. Rewarded strategy\n\nThe original Lab XP proposal is superseded by the sandbox pivot. S4 deliberately keeps titles as derived meta with no XP/rank authority, so rewarded monetization must not resurrect XP.\n\n### S5 selected MVP: permanent shelf expansion\n\nOne explicit rewarded offer is allowed:\n\n\`8 saved slots → watch one rewarded video → 10 saved slots permanently\`\n\nWhy this fits the current product:\n\n- free creation remains unchanged;\n- the existing free replace/delete flow remains available at full capacity;\n- value is durable and easy to explain;\n- SaveState V3 already has \`libraryCapacity\` and \`unlockedRewardIds\`;\n- no currency, shop, random reward or new cosmetic production is required;\n- the CTA can appear only when the free 8-slot shelf is actually full.\n\nS5 must not add a second rewarded offer. Cosmetic/material/accessory packs remain later candidates after the rewarded lifecycle itself is proven.\n\n### Explicitly avoid for S5\n\n- rewarded XP or title progress;\n- ad-only Ideas or core creation tools;\n- random chests;\n- energy refill;\n- skip-stage ads;\n- rewarded quality boosts;\n- repeated shelf-expansion tiers;\n- rewarded prompts during active creation or first-result Squeeze.\n\n`;
monetization = monetization.slice(0, sectionStart) + replacement + monetization.slice(sectionEnd);
writeFileSync(monetizationPath, monetization);

console.log('Applied Sandbox S5 rewarded shelf implementation.');
