import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/main.ts';
const source = readFileSync(path, 'utf8');
const needle = "import './interaction-pass-03.css';\n";
if (!source.includes(needle)) throw new Error('main import anchor missing');
writeFileSync(path, source.replace(needle, `${needle}import './release.css';\n`));
