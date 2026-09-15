import fs from 'node:fs';

const path = 'src/sandbox/SandboxLibraryApp.ts';
let content = fs.readFileSync(path, 'utf8');
const from = "      savedSquishy: toy,\n      initialShapeId: toy ? undefined : idea?.shapeId,\n      startSavedInSqueeze: toy !== null,";
const to = "      savedSquishy: toy,\n      ...(toy === null && idea ? { initialShapeId: idea.shapeId } : {}),\n      startSavedInSqueeze: toy !== null,";
if (!content.includes(from)) throw new Error('Missing exact-optional S4 patch anchor.');
content = content.replace(from, to);
fs.writeFileSync(path, content);
console.log('Sandbox S4 exact optional property fix applied.');
