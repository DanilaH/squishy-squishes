import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`${label}: anchor not found`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`${label}: anchor is ambiguous`);
  return source.replace(before, after);
};

const appPath = 'src/sandbox/SandboxLibraryApp.ts';
let app = readFileSync(appPath, 'utf8');
app = replaceOnce(
  app,
  `    this.root.innerHTML = \`<div class="sandbox-maker-host" data-sandbox-maker-host></div>${'${'}idea ? this.renderIdeaGuideMarkup(idea) : ''}\`;\n`,
  `    this.root.innerHTML = '<div class="sandbox-maker-host" data-sandbox-maker-host></div>';\n`,
  'maker host markup',
);
app = replaceOnce(
  app,
  `    this.currentMaker = new SandboxApp(host, {\n      language: this.options.language,\n      muted: this.muted,\n      savedSquishy: toy,\n      ...(toy === null && idea ? { initialShapeId: idea.shapeId } : {}),\n      startSavedInSqueeze: toy !== null,\n      onExitToLibrary: () => this.renderLibrary(),\n      onSaveSquishy: (draft) => this.handleSaveRequest(draft),\n      onMutedChange: (muted) => this.setMuted(muted),\n    });\n    this.currentMaker.setActivityBlocked(this.activityBlocked);\n`,
  `    this.currentMaker = new SandboxApp(host, {\n      language: this.options.language,\n      muted: this.muted,\n      savedSquishy: toy,\n      ...(toy === null && idea ? { initialShapeId: idea.shapeId } : {}),\n      startSavedInSqueeze: toy !== null,\n      onExitToLibrary: () => this.renderLibrary(),\n      onSaveSquishy: (draft) => this.handleSaveRequest(draft),\n      onMutedChange: (muted) => this.setMuted(muted),\n    });\n    if (idea) {\n      const copy = host.querySelector<HTMLElement>('.sandbox-copy');\n      copy?.insertAdjacentHTML('beforeend', this.renderIdeaGuideMarkup(idea));\n    }\n    this.currentMaker.setActivityBlocked(this.activityBlocked);\n`,
  'maker guide insertion',
);
writeFileSync(appPath, app);

const cssPath = 'src/sandbox-ideas.css';
let css = readFileSync(cssPath, 'utf8');
const oldGuide = `.sandbox-idea-guide {\n  position: fixed;\n  z-index: 20;\n  top: max(51px, calc(env(safe-area-inset-top) + 45px));\n  left: 50%;\n  width: min(calc(100vw - 24px), 560px);\n  transform: translateX(-50%);\n  pointer-events: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  padding: 7px 11px;\n  border: 1px solid rgba(88, 64, 112, .11);\n  border-radius: 999px;\n  background: rgba(255,255,255,.88);\n  box-shadow: 0 8px 22px rgba(77,55,96,.11);\n  backdrop-filter: blur(10px);\n  color: #59486e;\n  font-size: 10px;\n  font-weight: 800;\n}\n\n.sandbox-idea-guide strong { white-space: nowrap; }\n.sandbox-idea-guide span { min-width: 0; display: flex; align-items: center; gap: 5px; color: #756987; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n`;
const newGuide = `.sandbox-idea-guide {\n  width: min(100%, 560px);\n  margin: 7px auto 0;\n  pointer-events: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  padding: 6px 10px;\n  border: 1px solid rgba(88, 64, 112, .11);\n  border-radius: 999px;\n  background: rgba(255,255,255,.78);\n  box-shadow: 0 5px 14px rgba(77,55,96,.08);\n  color: #59486e;\n  font-size: 10px;\n  font-weight: 800;\n}\n\n.sandbox-idea-guide strong { white-space: nowrap; }\n.sandbox-copy .sandbox-idea-guide span { min-width: 0; min-height: 0; display: flex; align-items: center; gap: 5px; color: #756987; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; letter-spacing: 0; }\n`;
css = replaceOnce(css, oldGuide, newGuide, 'guide base styles');
css = replaceOnce(
  css,
  `  .sandbox-idea-guide { top: max(48px, calc(env(safe-area-inset-top) + 42px)); font-size: 9px; gap: 6px; }\n`,
  `  .sandbox-idea-guide { font-size: 9px; gap: 6px; }\n`,
  'phone guide override',
);
css = replaceOnce(
  css,
  `  .sandbox-idea-guide { top: 47px; width: min(calc(100vw - 28px), 520px); }\n`,
  `  .sandbox-copy .sandbox-idea-guide { width: 100%; margin-top: 4px; justify-content: flex-start; padding: 5px 7px; border-radius: 10px; }\n  .sandbox-copy .sandbox-idea-guide span { display: none; }\n`,
  'landscape guide override',
);
css = replaceOnce(
  css,
  `.sandbox-idea-complete {\n  position: fixed;\n  z-index: 30;\n  top: max(94px, calc(env(safe-area-inset-top) + 88px));\n`,
  `.sandbox-idea-complete {\n  position: fixed;\n  z-index: 30;\n  top: max(124px, calc(env(safe-area-inset-top) + 118px));\n`,
  'completion notice position',
);
css += `\n@media (max-height: 520px) and (orientation: landscape) {\n  .sandbox-idea-complete { top: 48px; left: 24%; width: min(46vw, 360px); padding: 6px 10px; }\n}\n`;
writeFileSync(cssPath, css);
console.log('Applied S4 Idea guide layout polish.');
