import fs from 'node:fs';

const replaceOnce = (source, from, to, label) => {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(from, to);
};

const path = 'src/game/VerticalSliceApp.ts';
let source = fs.readFileSync(path, 'utf8');
source = replaceOnce(
  source,
  "  private setStage(next: CraftStage): void {\n    this.clearTransitionTimer();\n    this.clearMoldTargetTimer();\n    this.audio.stopPour();",
  "  private setStage(next: CraftStage): void {\n    this.clearTransitionTimer();\n    this.clearMoldTargetTimer();\n    if (next !== 'collect' && this.feedbackTimer !== null) {\n      window.clearTimeout(this.feedbackTimer);\n      this.feedbackTimer = null;\n      this.progressionFeedback.hidden = true;\n    }\n    this.audio.stopPour();",
  'ownership feedback lifecycle',
);
fs.writeFileSync(path, source);
console.log('UI Overhaul 02 ownership lifecycle patch applied.');
