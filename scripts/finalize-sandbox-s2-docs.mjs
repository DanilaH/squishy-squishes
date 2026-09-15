import { readFileSync, writeFileSync } from 'node:fs';

const roadmapPath = 'docs/IMPLEMENTATION_ROADMAP.md';
let roadmap = readFileSync(roadmapPath, 'utf8');
roadmap = roadmap
  .replace('**Status:** SANDBOX PIVOT ACTIVE / S1 SANDBOX CORE ENGINEERING PASSED', '**Status:** SANDBOX PIVOT ACTIVE / S2 PERSONAL LIBRARY ENGINEERING PASSED')
  .replace('**Current development gate:** S2 — Personal Library', '**Current development gate:** S3 — Decor MVP');

const sourceAnchor = '- `SANDBOX_PIVOT_S1_IMPLEMENTATION_REVIEW.md`.';
if (roadmap.includes(sourceAnchor) && !roadmap.includes('`SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md`')) {
  roadmap = roadmap.replace(sourceAnchor, `${sourceAnchor.slice(0, -1)};\n- \`SANDBOX_PIVOT_S2_LIBRARY.md\`;\n- \`SANDBOX_PIVOT_S2_LIBRARY_REVIEW.md\`;\n- \`SANDBOX_PIVOT_S2_VISUAL_REVIEW.md\`;\n- \`SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md\`.`);
}

const start = roadmap.indexOf('## S2 — Personal Library');
const end = roadmap.indexOf('\n---\n\n## S3 — Decor MVP', start);
if (start < 0 || end < 0) throw new Error('Could not locate S2 roadmap section.');
const finalS2 = `## S2 — Personal Library — PASS / ENGINEERING COMPLETE

S2 turns the single-toy sandbox into the retention backbone:

\`Library → New Squishy → Create → Save → Squeeze → Library\`

Delivered/proved:

- **8 free saved-squishy slots** as the initial product capacity;
- cards represent actual authored toys, not canonical recipes;
- cheap deterministic 2D thumbnails reconstructed from shared shape boundary + compact appearance data;
- no per-card WebGL contexts and no renderer rewrite;
- any saved toy opens directly into real Squeeze;
- append order survives reload exactly;
- delete is free, secondary and confirmation-gated;
- full 8 / 8 Library still allows \`New Squishy\` and full creation;
- replacement is transactional: storage is unchanged until an explicit slot is chosen;
- cancel replacement returns safely to Finish without deleting an existing toy;
- confirmed replacement preserves the selected array index and increments historical \`totalCrafts\`;
- SaveState V3 remains the schema; no V4 introduced;
- malformed persisted IDs are bounded by the decoder and escaped before Library markup insertion;
- Yandex lifecycle/settings/build verification remains green;
- S0 appearance regression remains green.

Payload evidence from valid production-codec fixtures:

- 1 rich toy: **3,426 B**;
- 8 rich toys: **26,512 B**;
- 24-toy stress: **79,333 B**;
- largest representative appearance: **3,214 B**;
- current authored-appearance target remains **≤ 6 KB per toy**.

Current Yandex Games SDK docs state a **200 KB** per-player limit for \`player.setData()\`, so the representative 24-toy stress envelope is roughly 39% of the current cloud-data ceiling. This supports retaining 24 as a decoder hard bound, not exposing 24 slots as a product promise.

Final evidence:

- bounded validation + final visual run **34962829873**: release check + Browser QA + final visual lifecycle **PASS**;
- permanent S2 Browser QA covers empty Library, responsive containment, V2→V3 migration, Yandex lifecycle, multi-craft append/order/reload, non-latest Squeeze, confirmed delete, full-capacity cancel/replace and 1/8/24 payload measurement;
- final production visual lifecycle accepted after fixing modal token scope/contrast and compacting the phone replacement chooser.

Canonical reviews:

- \`SANDBOX_PIVOT_S2_VISUAL_REVIEW.md\`;
- \`SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md\`.

**Release note:** S2 engineering completion is not physical-phone acceptance. Real touch/device review remains outstanding before release/moderation claims.
`;
roadmap = roadmap.slice(0, start) + finalS2 + roadmap.slice(end);
writeFileSync(roadmapPath, roadmap);

const specPath = 'docs/SANDBOX_PIVOT_S2_LIBRARY.md';
let spec = readFileSync(specPath, 'utf8');
spec = spec.replace('**Status:** implementation specification', '**Status:** ENGINEERING COMPLETE / PR CANDIDATE');
if (!spec.includes('## 13. Final evidence')) {
  spec += `\n\n---\n\n## 13. Final evidence\n\nS2 implementation satisfies the exit criterion.\n\n- final bounded validation/visual run: **34962829873 — PASS**;\n- representative V3 payloads: **3,426 B / 26,512 B / 79,333 B** for 1 / 8 / 24 toys;\n- largest representative appearance: **3,214 B**;\n- final visual review: **PASS** after bounded modal readability fix;\n- permanent QA contract moved to the S2 multi-slot lifecycle;\n- physical-phone/manual touch acceptance remains a separate release gate.\n\nSee \`SANDBOX_PIVOT_S2_VISUAL_REVIEW.md\` and \`SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md\`.\n`;
}
writeFileSync(specPath, spec);
