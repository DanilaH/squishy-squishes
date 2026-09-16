// One-time guarded source edit in the migration branch. Remove with its workflow before merging.
import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/sandbox/SandboxLibraryApp.ts';
let source = readFileSync(path, 'utf8');
const from = "import { SandboxApp, type SandboxLanguage } from './SandboxApp';";
const to = "import { SandboxApp, type SandboxAppOptions, type SandboxLanguage } from './SandboxApp';";
const optionsFrom = '  readonly onMutedChange: (muted: boolean) => void | Promise<void>;';
const optionsTo = "  /** Candidate-only renderer port. Ordinary library bootstrap leaves it absent. */\n  readonly makerRendererOptions?: Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>;\n" + optionsFrom;
const makerFrom = '    this.currentMaker = new SandboxApp(host, {\n      language: this.options.language,';
const makerTo = '    this.currentMaker = new SandboxApp(host, {\n      ...this.options.makerRendererOptions,\n      language: this.options.language,';
if (source.includes('readonly makerRendererOptions?:')) {
  console.log('Library port already injected.');
  process.exit(0);
}
function once(before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  source = source.replace(before, after);
}
once(from, to, 'type-only options import');
once(optionsFrom, optionsTo, 'optional renderer factory');
once(makerFrom, makerTo, 'forward renderer factory into original maker');
writeFileSync(path, source);
console.log('Original SandboxLibraryApp now optionally forwards the candidate-only renderer port; production remains unchanged.');
