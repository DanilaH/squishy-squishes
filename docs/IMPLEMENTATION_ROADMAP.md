# Squishy Squishes — Implementation Roadmap

**Status:** SANDBOX PIVOT ACTIVE / S3 DECOR ENGINEERING PASSED
**Current development gate:** S4 — Ideas / Recipes + Humorous Titles
**External release gate:** real-phone/manual touch acceptance is still outstanding
**Current product thesis:** open creative squishy sandbox + personal library; recipes are optional inspiration/meta, never content gates

The recipe-first version remains useful technical evidence, but it is no longer the target product model.

Current source of truth:

- `SANDBOX_PIVOT_01_MASTER_PLAN.md`;
- `SANDBOX_PIVOT_01_REVIEW.md`;
- `SANDBOX_PIVOT_01_ASSET_PLAN.md`;
- `SANDBOX_PIVOT_S0_APPEARANCE_PROBE*.md`;
- `SANDBOX_PIVOT_S1_CORE.md`;
- `SANDBOX_PIVOT_S1_CORE_REVIEW.md`;
- `SANDBOX_PIVOT_S1_VISUAL_REVIEW.md`;
- `SANDBOX_PIVOT_S1_IMPLEMENTATION_REVIEW.md`;
- `SANDBOX_PIVOT_S2_LIBRARY.md`;
- `SANDBOX_PIVOT_S2_LIBRARY_REVIEW.md`;
- `SANDBOX_PIVOT_S2_VISUAL_REVIEW.md`;
- `SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md`.

Target product loop:

`Library → New Squishy → Shape → Free Paint → Mix-ins → Mix → Decorate → Save → Squeeze → New Squishy`

Core creation content should be broadly available from the start. Progression is optional humorous status/recipe meta rather than an unlock wall.

---

# Current roadmap

## S0 — Appearance Probe — PASS / ENGINEERING COMPLETE

Blocking question:

> Can free custom paint be saved compactly, reconstructed after reload, and remain attached to the existing deforming WebGL mesh?

Result: **yes**.

Proved:

- optional RGBA appearance texture in stable squishy UV space;
- 256×256 paint surface;
- semi-transparent overlap/blending;
- soft eraser;
- three brush sizes + Undo;
- compact quantized stroke codec;
- save → reload reconstruction;
- real squeeze with authored appearance attached to deformation;
- Pages-only probe with explicit Yandex bundle exclusion;
- permanent production-browser regression.

Persistence evidence:

- representative 3-stroke appearance: **219 B**;
- richer 48-stroke stress appearance: **4,195 B**;
- per-toy authored appearance target: **≤ 6 KB**.

---

## S1 — Sandbox Core — PASS / ENGINEERING COMPLETE

S1 replaced the normal recipe-gated player path with one coherent single-toy sandbox lifecycle:

`Shape → Free Paint → Mix-ins → Mix & Stretch → Finish → Save → Squeeze`

After reload:

`Home → Squeeze / New Squishy`

Delivered/proved:

- all six production shapes available immediately;
- no rank/XP/recipe gate in core creation;
- free paint with no coverage threshold;
- six colors, three brush sizes, eraser, Undo and Clear;
- six lightweight procedural mix-in families;
- existing real pointer-travel Mix interaction reused;
- Soft / Jelly / Holo finish selection;
- SaveState V3 with bounded authored appearance;
- conservative V2 → V3 migration without fabricated custom toys;
- one custom squishy saves, reloads and squeezes with authored shape/material/paint/mix-ins intact;
- generic `SquishSurface` retained; no per-shape renderer/physics branches;
- Save → first Squeeze ownership beat protected from interstitial interruption;
- responsive phone portrait / short landscape / desktop shell;
- Yandex lifecycle/build verifier retained;
- S0 appearance probe remains a production-browser regression.

Final branch evidence before PR cleanup:

- validation run **34958564679** — strict typecheck + Pages build + Yandex build + verifier: **PASS**;
- browser run **34958564795** — `npm run qa:release`: **8/8 PASS**;
- visual run **34958564725** — production lifecycle screenshots after bounded hero scale correction: **PASS**.

Important scope boundary:

- S1 intentionally persists exactly **one** custom toy even though V3 already uses a `library[]` envelope;
- multi-slot behavior belongs to S2;
- S1 enforces the **6 KB per-toy appearance budget**, but does not fake a final eight-/24-slot payload measurement before the real multi-slot implementation exists.

Canonical final review: `SANDBOX_PIVOT_S1_IMPLEMENTATION_REVIEW.md`.

**Release note:** S1 engineering completion is not real-device acceptance. A physical phone/touch pass is still required before release/moderation claims.

---

## S2 — Personal Library — PASS / ENGINEERING COMPLETE

S2 turns the single-toy sandbox into the retention backbone:

`Library → New Squishy → Create → Save → Squeeze → Library`

Delivered/proved:

- **8 free saved-squishy slots** as the initial product capacity;
- cards represent actual authored toys, not canonical recipes;
- cheap deterministic 2D thumbnails reconstructed from shared shape boundary + compact appearance data;
- no per-card WebGL contexts and no renderer rewrite;
- any saved toy opens directly into real Squeeze;
- append order survives reload exactly;
- delete is free, secondary and confirmation-gated;
- full 8 / 8 Library still allows `New Squishy` and full creation;
- replacement is transactional: storage is unchanged until an explicit slot is chosen;
- cancel replacement returns safely to Finish without deleting an existing toy;
- confirmed replacement preserves the selected array index and increments historical `totalCrafts`;
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

Current Yandex Games SDK docs state a **200 KB** per-player limit for `player.setData()`, so the representative 24-toy stress envelope is roughly 39% of the current cloud-data ceiling. This supports retaining 24 as a decoder hard bound, not exposing 24 slots as a product promise.

Final evidence:

- bounded validation + final visual run **34962829873**: release check + Browser QA + final visual lifecycle **PASS**;
- permanent S2 Browser QA covers empty Library, responsive containment, V2→V3 migration, Yandex lifecycle, multi-craft append/order/reload, non-latest Squeeze, confirmed delete, full-capacity cancel/replace and 1/8/24 payload measurement;
- final production visual lifecycle accepted after fixing modal token scope/contrast and compacting the phone replacement chooser.

Canonical reviews:

- `SANDBOX_PIVOT_S2_VISUAL_REVIEW.md`;
- `SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md`.

**Release note:** S2 engineering completion is not physical-phone acceptance. Real touch/device review remains outstanding before release/moderation claims.

---

## S3 — Decor MVP — PASS / ENGINEERING COMPLETE

S3 added reusable authored identity while preserving one generic squishy renderer and SaveState V3:

- eyes, mouths and blush rendered into the existing appearance texture;
- up to 12 surface stickers;
- one exclusive head accessory slot;
- generic read-only UV → deformed-mesh projection for attached accessories;
- Library thumbnails reconstruct surface decor + accessory without per-card WebGL;
- compact Decor persistence remains inside the V3 envelope;
- permanent Browser QA covers persistence, all six shapes, payload budget, responsive containment and accessory attachment during real squeeze;
- production visual acceptance passed before PR #24;
- final S3 commit on `main`: `87855d4c0483e9b0ccdc38130d0fde88a0ee3eeb`.

Physical-device/manual touch acceptance remains an external release gate.

---

## S4 — Ideas / Recipes + Humorous Titles

Repurpose canonical recipe work as optional inspiration rather than gating.

Target behavior:

- all sandbox tools remain available regardless of title;
- Ideas/Recipes suggest combinations to try;
- matching/completing an idea contributes to light meta progress;
- meta yields humorous titles such as `Новичок`, `Молодой сквишер`, `Жмякатель`, `Сквиш-стилист`, `Крутой сквишер`, `Сквишер-могер` and later tiers;
- exact XP should not dominate player-facing UI;
- titles never unlock required core content.

The existing 24 recipes are input material, not a mandatory final catalog contract.

---

## S5 — Rewarded Monetization

Only after free sandbox + library retention works:

- permanent cosmetic/material packs;
- premium finish packs;
- accessory packs;
- additional library slots.

Rules:

- rewards additive/permanent where practical;
- no “watch or you cannot continue” gate;
- no currency economy required;
- no loot-box duplicate loop;
- base creative play remains meaningful without ads.

---

## S6 — Interstitial Adaptation

Logical pauses may include:

- after saving and returning to library;
- after leaving a squeeze/revisit session;
- other clearly completed loops validated by evidence.

Never interrupt:

- painting;
- mix-ins;
- Mix;
- decorating;
- Save → first ownership/squeeze beat.

---

## S7 — Expressive Polish

Only after the core sandbox/library loop proves its appeal:

- independently draggable ears/appendages;
- richer face response under stretch;
- additional premium materials/finishes;
- stronger ASMR/juice;
- other expressive interactions backed by evidence.

---

# Historical baseline retained from recipe-first version

## Tactile interaction foundation — REUSABLE

Validated mechanics include pointer painting, motion-driven Add/filling shake, real pointer-travel Mix/stretch, generic spring/deformation response, and squeeze/release audio lifecycle.

Do not retune accepted mechanics merely because IA changes. Reuse where they serve the sandbox and delete obsolete stages where they do not.

## Renderer / shape foundation — REUSABLE

Raw WebGL2 still supports six shapes through shared geometry/boundary/deformation logic:

- Soft Square;
- Heart;
- Mochi;
- Peach;
- Mushroom;
- Paw.

S0/S1 prove authored appearance rides the same stable UV/deformation path without per-shape branches.

## Production skeleton / platform integration — REUSABLE

Retained infrastructure includes:

- app bootstrap boundary;
- mock + Yandex runtime seam;
- typed settings/storage boundaries;
- gameplay activity lifecycle;
- release analytics seam;
- Pages/Yandex dual builds;
- Yandex verifier;
- permanent Release Check;
- permanent production Chromium QA;
- GitHub Pages deployment.

Pinned shared kit remains:

`mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

unless a later phase has concrete evidence requiring an upgrade.

## Recipe progression / collection — SUPERSEDED AS PRODUCT MODEL

SaveState V2, Lab XP, ranks 1–8, deterministic recipe unlocks and the 24 canonical recipes remain migration/reference material only.

XP/rank must not regain authority over shapes, materials, recipes or the ability to create.

## UI/UX Overhaul 02 — SUPERSEDED AS IA, RETAINED AS VISUAL/QA EVIDENCE

Keep its strongest lessons:

- toy-first hierarchy;
- touch-first responsive shell;
- child-readable concise copy;
- strong ownership presentation;
- production screenshot review discipline;
- phone portrait/landscape/desktop QA.

Do not restore the recipe shelf/next-unlock dashboard model.

---

# Save/model migration rule — S1 RESULT

SaveState V3 is now the production boundary.

Historical V2 progress migrates conservatively as legacy/meta credit. It does **not** fabricate authored toys that never existed.

The V2 key is removed only after successful V3 write/flush. Corrupt/invalid V3 falls back safely rather than being partially trusted.

S2 must extend V3 through the existing bounded library envelope rather than inventing another persistence format without evidence.

---

# Cross-phase stop rules

Stop and reassess if:

- custom appearance starts requiring bitmap screenshots in player storage;
- real multi-slot payload makes the library implausible under platform limits;
- raw WebGL work becomes the dominant production burden;
- shapes require bespoke deformation/paint code;
- mix-ins demand hundreds of simulated physical particles;
- decoration demands per-asset physics before basic identity is proven;
- recipes/meta start gating the sandbox again;
- rewarded ads become necessary to continue core play;
- currency/shop complexity appears without evidence;
- interstitials interrupt active creation or ownership reward;
- mobile performance collapses during painting/deformation;
- tests modify production mechanics simply to become green;
- scope expands to hide weak paint/mix/squeeze feel.

A failed assumption is evidence. Fix or reduce the assumption before adding another system.
