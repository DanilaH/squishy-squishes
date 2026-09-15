import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/sandbox/SandboxApp.ts';
let app = readFileSync(path, 'utf8');
const replace = (from, to) => {
  if (!app.includes(from)) throw new Error(`SandboxApp missing anchor: ${from.slice(0, 100)}`);
  app = app.replace(from, to);
};

replace(
  "import { drawAccessoryGraphic, getDecorFrame, hasSurfaceDecor, renderSurfaceDecor } from './decor';",
  "import {\n  ACCESSORY_IDS,\n  EYE_STYLE_IDS,\n  MAX_DECOR_STICKERS,\n  MOUTH_STYLE_IDS,\n  STICKER_IDS,\n  createStickerPlacement,\n  drawAccessoryGraphic,\n  estimateDecorBytes,\n  getDecorFrame,\n  hasSurfaceDecor,\n  renderSurfaceDecor,\n  type AccessoryId,\n  type EyeStyleId,\n  type MouthStyleId,\n  type StickerId,\n} from './decor';",
);
replace(
  "type SandboxStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'finish' | 'squeeze';\ntype PaintTool = 'paint' | 'erase';",
  "type SandboxStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'decor' | 'finish' | 'squeeze';\ntype PaintTool = 'paint' | 'erase';\ntype DecorSection = 'face' | 'stickers' | 'accessory';",
);
replace(
  "  readonly mix: string;\n  readonly finish: string;",
  "  readonly mix: string;\n  readonly decor: string;\n  readonly finish: string;",
);
replace(
  "  readonly mixHint: string;\n  readonly finishHint: string;",
  "  readonly mixHint: string;\n  readonly decorHint: string;\n  readonly finishHint: string;",
);
replace(
  "  readonly holo: string;\n}",
  "  readonly holo: string;\n  readonly face: string;\n  readonly stickers: string;\n  readonly head: string;\n  readonly eyes: string;\n  readonly mouth: string;\n  readonly none: string;\n  readonly blush: string;\n  readonly back: string;\n}",
);
replace(
  "    mix: 'MIX & STRETCH',\n    finish: 'FINISH IT',",
  "    mix: 'MIX & STRETCH',\n    decor: 'DECORATE',\n    finish: 'FINISH IT',",
);
replace(
  "    mixHint: 'Grab the squishy and really move it around.',\n    finishHint: 'Choose how the material feels, then keep your squishy.',",
  "    mixHint: 'Grab the squishy and really move it around.',\n    decorHint: 'Give it a face, stickers or a little something on top.',\n    finishHint: 'Choose how the material feels, then keep your squishy.',",
);
replace(
  "    holo: 'Holo',\n  },",
  "    holo: 'Holo',\n    face: 'Face',\n    stickers: 'Stickers',\n    head: 'Head',\n    eyes: 'Eyes',\n    mouth: 'Mouth',\n    none: 'None',\n    blush: 'Blush',\n    back: 'BACK',\n  },",
);
replace(
  "    mix: 'ЗАМЕШАЙ',\n    finish: 'ГОТОВО!',",
  "    mix: 'ЗАМЕШАЙ',\n    decor: 'УКРАСЬ',\n    finish: 'ГОТОВО!',",
);
replace(
  "    mixHint: 'Хватай сквиш и хорошенько потяни его.',\n    finishHint: 'Выбери материал и сохрани свой сквиш.',",
  "    mixHint: 'Хватай сквиш и хорошенько потяни его.',\n    decorHint: 'Добавь мордочку, наклейки или что-нибудь на макушку.',\n    finishHint: 'Выбери материал и сохрани свой сквиш.',",
);
replace(
  "    holo: 'Голографик',\n  },",
  "    holo: 'Голографик',\n    face: 'Мордочка',\n    stickers: 'Наклейки',\n    head: 'Макушка',\n    eyes: 'Глаза',\n    mouth: 'Ротик',\n    none: 'Нет',\n    blush: 'Румянец',\n    back: 'НАЗАД',\n  },",
);
replace(
  "  private selectedMixIn: MixInId = 'glitter';",
  "  private selectedMixIn: MixInId = 'glitter';\n  private selectedSticker: StickerId = 'heart';\n  private decorSection: DecorSection = 'face';",
);

replace(
  "    const materials = MATERIALS.map((material) => `\n      <button class=\"sandbox-material\" type=\"button\" data-material=\"${material.id}\" aria-pressed=\"${material.id === 'soft'}\">\n        <span class=\"sandbox-material__orb sandbox-material__orb--${material.id}\"></span>\n        <span>${material.id === 'soft' ? this.copy.soft : material.id === 'jelly' ? this.copy.jelly : this.copy.holo}</span>\n      </button>\n    `).join('');",
  `    const materials = MATERIALS.map((material) => \`\n      <button class="sandbox-material" type="button" data-material="\${material.id}" aria-pressed="\${material.id === 'soft'}">\n        <span class="sandbox-material__orb sandbox-material__orb--\${material.id}"></span>\n        <span>\${material.id === 'soft' ? this.copy.soft : material.id === 'jelly' ? this.copy.jelly : this.copy.holo}</span>\n      </button>\n    \`).join('');\n    const eyeGlyph = (id: EyeStyleId): string => id === 'dot' ? '••' : id === 'happy' ? '⌒⌒' : '﹏﹏';\n    const mouthGlyph = (id: MouthStyleId): string => id === 'smile' ? '⌣' : id === 'o' ? '○' : 'ω';\n    const stickerGlyph = (id: StickerId): string => id === 'heart' ? '♥' : id === 'star' ? '★' : id === 'flower' ? '✿' : '✦';\n    const accessoryGlyph = (id: AccessoryId): string => id === 'cat-ears' ? '▲ ▲' : id === 'bunny-ears' ? '∩ ∩' : id === 'horns' ? '△ △' : id === 'bow' ? '⋈' : '♛';\n    const eyes = [null, ...EYE_STYLE_IDS].map((id) => \`\n      <button class="sandbox-decor-choice" type="button" data-decor-eyes="\${id ?? 'none'}" aria-pressed="\${id === null}">\n        <span>\${id ? eyeGlyph(id) : '—'}</span><small>\${id ?? this.copy.none}</small>\n      </button>\n    \`).join('');\n    const mouths = [null, ...MOUTH_STYLE_IDS].map((id) => \`\n      <button class="sandbox-decor-choice" type="button" data-decor-mouth="\${id ?? 'none'}" aria-pressed="\${id === null}">\n        <span>\${id ? mouthGlyph(id) : '—'}</span><small>\${id ?? this.copy.none}</small>\n      </button>\n    \`).join('');\n    const stickers = STICKER_IDS.map((id) => \`\n      <button class="sandbox-decor-choice" type="button" data-decor-sticker="\${id}" aria-pressed="\${id === this.selectedSticker}">\n        <span>\${stickerGlyph(id)}</span><small>\${id}</small>\n      </button>\n    \`).join('');\n    const accessories = [null, ...ACCESSORY_IDS].map((id) => \`\n      <button class="sandbox-decor-choice" type="button" data-decor-accessory="\${id ?? 'none'}" aria-pressed="\${id === null}">\n        <span>\${id ? accessoryGlyph(id) : '—'}</span><small>\${id ?? this.copy.none}</small>\n      </button>\n    \`).join('');`,
);

replace(
  "          <div class=\"sandbox-panel sandbox-panel--center\" data-panel=\"mix\">\n            <div class=\"sandbox-mix-progress\" aria-hidden=\"true\"><span data-mix-progress-fill></span></div>\n            <button class=\"sandbox-primary sandbox-panel__wide\" type=\"button\" data-action=\"mix-continue\" disabled>${this.copy.next}</button>\n          </div>\n\n          <div class=\"sandbox-panel\" data-panel=\"finish\">",
  `          <div class="sandbox-panel sandbox-panel--center" data-panel="mix">\n            <div class="sandbox-mix-progress" aria-hidden="true"><span data-mix-progress-fill></span></div>\n            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="mix-continue" disabled>\${this.copy.next}</button>\n          </div>\n\n          <div class="sandbox-panel sandbox-panel--decor" data-panel="decor">\n            <div class="sandbox-decor-tabs" role="tablist" aria-label="Decor categories">\n              <button type="button" data-decor-section="face" aria-pressed="true">☺ <span>\${this.copy.face}</span></button>\n              <button type="button" data-decor-section="stickers" aria-pressed="false">✦ <span>\${this.copy.stickers}</span></button>\n              <button type="button" data-decor-section="accessory" aria-pressed="false">♛ <span>\${this.copy.head}</span></button>\n            </div>\n            <div class="sandbox-decor-section" data-decor-panel="face">\n              <label>\${this.copy.eyes}</label><div class="sandbox-decor-grid sandbox-decor-grid--four">\${eyes}</div>\n              <label>\${this.copy.mouth}</label><div class="sandbox-decor-grid sandbox-decor-grid--four">\${mouths}</div>\n              <button class="sandbox-decor-toggle" type="button" data-action="decor-blush" aria-pressed="false">● ● <span>\${this.copy.blush}</span></button>\n            </div>\n            <div class="sandbox-decor-section" data-decor-panel="stickers" hidden>\n              <div class="sandbox-decor-grid sandbox-decor-grid--four">\${stickers}</div>\n              <p class="sandbox-decor-tip">\${this.copy.stickers}: tap the squishy</p>\n              <div class="sandbox-tool-row sandbox-tool-row--actions"><button type="button" data-action="decor-undo">\${this.copy.undo}</button><button type="button" data-action="decor-clear">\${this.copy.clear}</button></div>\n            </div>\n            <div class="sandbox-decor-section" data-decor-panel="accessory" hidden>\n              <div class="sandbox-decor-grid sandbox-decor-grid--three">\${accessories}</div>\n            </div>\n            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="decor-continue">\${this.copy.next}</button>\n          </div>\n\n          <div class="sandbox-panel" data-panel="finish">`,
);
replace(
  "            <div class=\"sandbox-material-grid\">${materials}</div>\n            <button class=\"sandbox-primary sandbox-panel__wide\" type=\"button\" data-action=\"save\">${this.copy.save}</button>",
  "            <div class=\"sandbox-material-grid\">${materials}</div>\n            <div class=\"sandbox-finish-actions\"><button class=\"sandbox-secondary\" type=\"button\" data-action=\"finish-back\">${this.copy.back}</button><button class=\"sandbox-primary\" type=\"button\" data-action=\"save\">${this.copy.save}</button></div>",
);

replace(
  "    const materialId = target.dataset.material as MaterialId | undefined;",
  `    const decorSection = target.dataset.decorSection as DecorSection | undefined;\n    if (decorSection === 'face' || decorSection === 'stickers' || decorSection === 'accessory') {\n      this.setDecorSection(decorSection);\n      return;\n    }\n\n    const decorEyes = target.dataset.decorEyes;\n    if (decorEyes !== undefined) {\n      const eyes = decorEyes === 'none' ? null : decorEyes as EyeStyleId;\n      if (eyes === null || EYE_STYLE_IDS.includes(eyes)) {\n        this.draft = { ...this.draft, decor: { ...this.draft.decor, eyes } };\n        this.replayAndUpload();\n        this.updateDecorUi();\n      }\n      return;\n    }\n\n    const decorMouth = target.dataset.decorMouth;\n    if (decorMouth !== undefined) {\n      const mouth = decorMouth === 'none' ? null : decorMouth as MouthStyleId;\n      if (mouth === null || MOUTH_STYLE_IDS.includes(mouth)) {\n        this.draft = { ...this.draft, decor: { ...this.draft.decor, mouth } };\n        this.replayAndUpload();\n        this.updateDecorUi();\n      }\n      return;\n    }\n\n    const decorSticker = target.dataset.decorSticker as StickerId | undefined;\n    if (decorSticker && STICKER_IDS.includes(decorSticker)) {\n      this.selectedSticker = decorSticker;\n      this.updatePressed('[data-decor-sticker]', 'decorSticker', decorSticker);\n      return;\n    }\n\n    const decorAccessory = target.dataset.decorAccessory;\n    if (decorAccessory !== undefined) {\n      const accessory = decorAccessory === 'none' ? null : decorAccessory as AccessoryId;\n      if (accessory === null || ACCESSORY_IDS.includes(accessory)) {\n        this.draft = { ...this.draft, decor: { ...this.draft.decor, accessory } };\n        this.refreshAccessoryGraphic();\n        this.updateDecorUi();\n      }\n      return;\n    }\n\n    const materialId = target.dataset.material as MaterialId | undefined;`,
);
replace(
  "    else if (action === 'mix-continue' && this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX) this.setStage('finish');\n    else if (action === 'save') void this.saveDraft();",
  "    else if (action === 'mix-continue' && this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX) this.setStage('decor');\n    else if (action === 'decor-blush') { this.draft = { ...this.draft, decor: { ...this.draft.decor, blush: !this.draft.decor.blush } }; this.replayAndUpload(); this.updateDecorUi(); }\n    else if (action === 'decor-undo') this.undoSticker();\n    else if (action === 'decor-clear') this.clearStickers();\n    else if (action === 'decor-continue') this.setStage('finish');\n    else if (action === 'finish-back') this.setStage('decor');\n    else if (action === 'save') void this.saveDraft();",
);

replace(
  "    if (this.stage === 'mix') {\n      this.mixPointerId = event.pointerId;",
  `    if (this.stage === 'decor' && this.decorSection === 'stickers') {\n      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);\n      if (!point || this.draft.decor.stickers.length >= MAX_DECOR_STICKERS) return;\n      const placement = createStickerPlacement(this.selectedSticker, point, this.draft.decor.stickers.length);\n      this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [...this.draft.decor.stickers, placement] } };\n      this.replayAndUpload();\n      this.updateDecorUi();\n      event.preventDefault();\n      return;\n    }\n\n    if (this.stage === 'mix') {\n      this.mixPointerId = event.pointerId;`,
);

replace(
  "  private beginMix(): void {",
  `  private undoSticker(): void {\n    if (this.draft.decor.stickers.length === 0) return;\n    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: this.draft.decor.stickers.slice(0, -1) } };\n    this.replayAndUpload();\n    this.updateDecorUi();\n  }\n\n  private clearStickers(): void {\n    if (this.draft.decor.stickers.length === 0) return;\n    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [] } };\n    this.replayAndUpload();\n    this.updateDecorUi();\n  }\n\n  private setDecorSection(next: DecorSection): void {\n    this.decorSection = next;\n    this.shell.dataset.decorSection = next;\n    this.updatePressed('[data-decor-section]', 'decorSection', next);\n    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-decor-panel]')) panel.hidden = panel.dataset.decorPanel !== next;\n  }\n\n  private updateDecorUi(): void {\n    this.updatePressed('[data-decor-eyes]', 'decorEyes', this.draft.decor.eyes ?? 'none');\n    this.updatePressed('[data-decor-mouth]', 'decorMouth', this.draft.decor.mouth ?? 'none');\n    this.updatePressed('[data-decor-accessory]', 'decorAccessory', this.draft.decor.accessory ?? 'none');\n    this.updatePressed('[data-decor-sticker]', 'decorSticker', this.selectedSticker);\n    const blush = this.root.querySelector<HTMLButtonElement>('[data-action="decor-blush"]');\n    blush?.setAttribute('aria-pressed', String(this.draft.decor.blush));\n    this.shell.dataset.decorEyes = this.draft.decor.eyes ?? 'none';\n    this.shell.dataset.decorMouth = this.draft.decor.mouth ?? 'none';\n    this.shell.dataset.decorBlush = String(this.draft.decor.blush);\n    this.shell.dataset.decorStickerCount = String(this.draft.decor.stickers.length);\n    this.shell.dataset.decorAccessory = this.draft.decor.accessory ?? 'none';\n    this.shell.dataset.decorBytes = String(estimateDecorBytes(this.draft.decor));\n  }\n\n  private beginMix(): void {`,
);

replace(
  "    this.selectedMixIn = 'glitter';\n    this.mixDistance = 0;",
  "    this.selectedMixIn = 'glitter';\n    this.selectedSticker = 'heart';\n    this.decorSection = 'face';\n    this.mixDistance = 0;",
);
replace(
  "    this.updatePressed('[data-mixin]', 'mixin', this.selectedMixIn);\n    this.shell.dataset.saveComplete = 'false';",
  "    this.updatePressed('[data-mixin]', 'mixin', this.selectedMixIn);\n    this.setDecorSection('face');\n    this.updateDecorUi();\n    this.shell.dataset.saveComplete = 'false';",
);
replace(
  "    this.updatePressed('[data-material]', 'material', saved.materialId);\n    this.updateAppearanceDataset();",
  "    this.updatePressed('[data-material]', 'material', saved.materialId);\n    this.updateAppearanceDataset();\n    this.updateDecorUi();",
);
replace(
  "    if (stage === 'shape') return { step: '1 / 5', title: this.copy.shape, hint: this.copy.chooseShape };\n    if (stage === 'paint') return { step: '2 / 5', title: this.copy.paint, hint: this.copy.paintHint };\n    if (stage === 'mixins') return { step: '3 / 5', title: this.copy.mixins, hint: this.copy.mixinsHint };\n    if (stage === 'mix') return { step: '4 / 5', title: this.copy.mix, hint: this.copy.mixHint };\n    if (stage === 'finish') return { step: '5 / 5', title: this.copy.finish, hint: this.copy.finishHint };",
  "    if (stage === 'shape') return { step: '1 / 6', title: this.copy.shape, hint: this.copy.chooseShape };\n    if (stage === 'paint') return { step: '2 / 6', title: this.copy.paint, hint: this.copy.paintHint };\n    if (stage === 'mixins') return { step: '3 / 6', title: this.copy.mixins, hint: this.copy.mixinsHint };\n    if (stage === 'mix') return { step: '4 / 6', title: this.copy.mix, hint: this.copy.mixHint };\n    if (stage === 'decor') return { step: '5 / 6', title: this.copy.decor, hint: this.copy.decorHint };\n    if (stage === 'finish') return { step: '6 / 6', title: this.copy.finish, hint: this.copy.finishHint };",
);
replace(
  "    const shouldRenderInteract = !this.activityBlocked && (this.stage === 'mix' || this.stage === 'squeeze');",
  "    const shouldRenderInteract = !this.activityBlocked && (this.stage === 'mix' || this.stage === 'squeeze');",
);
replace(
  "    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);\n  }",
  "    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);\n    this.updateDecorUi();\n  }",
);

writeFileSync(path, app);

const cssPath = 'src/sandbox-core.css';
let css = readFileSync(cssPath, 'utf8');
const cssAnchor = '.sandbox-mix-progress { grid-column: 1 / -1; height: 14px;';
if (!css.includes(cssAnchor)) throw new Error('CSS decor anchor missing');
const decorCss = `.sandbox-panel--decor { grid-template-columns: 1fr; gap: 7px; }\n.sandbox-decor-tabs { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }\n.sandbox-decor-tabs button { min-height: 42px; display:flex; align-items:center; justify-content:center; gap:6px; }\n.sandbox-decor-tabs button[aria-pressed="true"] { background: rgba(247,235,255,.96); }\n.sandbox-decor-section { display:grid; gap:6px; min-height: 102px; align-content:center; }\n.sandbox-decor-section > label { color: var(--sandbox-muted); font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; text-align:center; }\n.sandbox-decor-grid { display:grid; gap:6px; }\n.sandbox-decor-grid--four { grid-template-columns: repeat(4,minmax(0,1fr)); }\n.sandbox-decor-grid--three { grid-template-columns: repeat(3,minmax(0,1fr)); }\n.sandbox-decor-choice { min-height: 45px !important; display:grid; place-items:center; align-content:center; gap:1px; padding:2px 4px !important; }\n.sandbox-decor-choice > span { font-size: 18px; line-height:1; }\n.sandbox-decor-choice small { font-size:8px; color:var(--sandbox-muted); overflow:hidden; text-overflow:ellipsis; max-width:100%; }\n.sandbox-decor-toggle { justify-self:center; min-width:120px; min-height:38px !important; display:flex; align-items:center; justify-content:center; gap:8px; }\n.sandbox-decor-tip { margin:0; text-align:center; color:var(--sandbox-muted); font-size:10px; font-weight:700; }\n.sandbox-finish-actions { grid-column:1/-1; display:grid; grid-template-columns:minmax(90px,.38fr) minmax(140px,1fr); gap:8px; }\n.sandbox-finish-actions button { min-height:48px; }\n\n`;
css = css.replace(cssAnchor, decorCss + cssAnchor);
css += `\n@media (max-width: 620px) {\n  .sandbox-panel--decor { gap:5px; }\n  .sandbox-decor-tabs button { min-height:38px; font-size:10px; }\n  .sandbox-decor-section { min-height:94px; gap:4px; }\n  .sandbox-decor-choice { min-height:40px !important; }\n  .sandbox-decor-choice small { display:none; }\n}\n@media (max-height: 520px) and (orientation: landscape) {\n  .sandbox-panel--decor { max-height:100%; align-content:center; }\n  .sandbox-decor-section { min-height:76px; }\n  .sandbox-decor-choice { min-height:36px !important; }\n  .sandbox-decor-tabs button { min-height:34px; }\n}\n`;
writeFileSync(cssPath, css);
