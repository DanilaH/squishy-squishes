import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/ui-ux-pass-01.css';
let source = readFileSync(path, 'utf8');
const needle = `.collection-card {
  grid-template-columns: 72px minmax(0, 1fr) auto;
`;
if (!source.includes(needle)) throw new Error('collection card grid anchor missing');
source = source.replace(needle, `.collection-card {
  grid-template-columns: 72px minmax(0, 1fr) auto;
  grid-template-rows: auto;
`);
writeFileSync(path, source);
