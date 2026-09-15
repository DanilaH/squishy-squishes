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
  `    this.root.querySelector('[data-idea-complete]')?.remove();\n    const notice = document.createElement('aside');\n`,
  `    this.root.querySelector('[data-idea-complete]')?.remove();\n    this.root.querySelector('[data-idea-guide]')?.remove();\n    const notice = document.createElement('aside');\n`,
  'completion replaces guide',
);
writeFileSync(appPath, app);

const cssPath = 'src/sandbox-ideas.css';
let css = readFileSync(cssPath, 'utf8');
css = replaceOnce(
  css,
  `  top: max(51px, calc(env(safe-area-inset-top) + 45px));\n`,
  `  top: max(116px, calc(env(safe-area-inset-top) + 110px));\n`,
  'guide vertical position',
);
css = replaceOnce(
  css,
  `  top: max(94px, calc(env(safe-area-inset-top) + 88px));\n`,
  `  top: max(116px, calc(env(safe-area-inset-top) + 110px));\n`,
  'completion vertical position',
);
css = replaceOnce(
  css,
  `  .sandbox-idea-guide { top: max(48px, calc(env(safe-area-inset-top) + 42px)); font-size: 9px; gap: 6px; }\n`,
  `  .sandbox-idea-guide { top: max(112px, calc(env(safe-area-inset-top) + 106px)); font-size: 9px; gap: 6px; }\n`,
  'phone guide position',
);
css = replaceOnce(
  css,
  `  .sandbox-idea-guide { top: 47px; width: min(calc(100vw - 28px), 520px); }\n`,
  `  .sandbox-idea-guide { top: 48px; left: 52%; width: min(44vw, 390px); transform: none; justify-content: flex-start; }\n  .sandbox-idea-guide span { display: none; }\n  .sandbox-idea-guide strong { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }\n  .sandbox-idea-complete { top: 48px; left: 52%; width: min(44vw, 390px); transform: none; padding: 7px 10px; }\n`,
  'landscape guide position',
);
writeFileSync(cssPath, css);
console.log('Applied non-overlapping S4 Idea guide polish.');
