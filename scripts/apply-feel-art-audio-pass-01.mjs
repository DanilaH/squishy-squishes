import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/game/VerticalSliceApp.ts';
let source = readFileSync(path, 'utf8');

const replaceOnce = (needle, replacement, label) => {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${label}: anchor missing`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`${label}: anchor not unique`);
  source = source.replace(needle, replacement);
};

replaceOnce(
  "import { SquishyAudio } from './SquishyAudio';\n",
  "import { SquishyAudio } from './SquishyAudio';\nimport { getPresentationTier } from './presentation';\n",
  'presentation import',
);

replaceOnce(
  "    this.shell.dataset.filling = filling.id;\n",
  "    this.shell.dataset.filling = filling.id;\n    this.shell.dataset.presentationTier = getPresentationTier(this.selected);\n",
  'presentation dataset',
);

replaceOnce(
  "        this.audio.playReveal(this.selected.material !== 'soft' || getFilling(this.selected.filling).requiresAddStage);\n",
  "        this.audio.playReveal(getPresentationTier(this.selected));\n",
  'tiered reveal audio',
);

replaceOnce(
  "        this.audio.playCollect();\n",
  "        this.audio.playCollect(getPresentationTier(this.selected));\n",
  'tiered collect audio',
);

writeFileSync(path, source);
