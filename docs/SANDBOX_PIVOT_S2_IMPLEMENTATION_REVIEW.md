# Sandbox Pivot S2 — Implementation Review

**Status:** ENGINEERING PASS / PR CANDIDATE
**Phase:** S2 — Personal Library
**Base:** `main@72b27a84020a5918b3dd79af4c1a1d3dd30b855b`
**Final validated product source:** branch `sandbox-pivot-s2-library` after modal readability fix

## Verdict

S2 satisfies its engineering exit criterion.

The game now supports a real multi-toy personal Library while preserving the sandbox thesis and the existing generic tactile/rendering foundation. A player can create several authored squishies, reopen any saved toy directly into Squeeze, delete safely, continue creating at full capacity, explicitly replace a chosen slot, and retain deterministic state across reload.

No release/moderation claim is implied. Physical-phone/manual touch acceptance remains a separate external gate.

## Delivered architecture

### Library orchestration

`SandboxLibraryApp` is a separate root controller for:

`Library ↔ Maker ↔ Squeeze`

This intentionally avoids expanding `SandboxApp` into a Library/persistence god-object. `SandboxApp` remains responsible for the tactile maker and real squeeze surface, with only narrow S2 integration seams for:

- nullable save result so replacement can be cancelled back to Finish;
- direct saved-toy start in Squeeze;
- explicit exit back to Library.

### Cheap shelf previews

Library cards use a deterministic 2D canvas thumbnail renderer reconstructed from the same persisted authored data:

- shared shape boundary;
- compact appearance document;
- lightweight Soft/Jelly/Holo treatment.

The shelf does not create one WebGL context per saved toy. The real `SquishSurface` is mounted only for maker/squeeze gameplay.

### Persistence domain

SaveState V3 remains the active schema. S2 adds pure immutable operations for:

- append;
- replace by stable saved-toy ID;
- delete by stable saved-toy ID;
- serialized V3 byte measurement.

Rules proven by tests:

- append preserves array order;
- replacement preserves the selected index;
- delete compacts later entries left;
- duplicate saved-toy IDs are rejected;
- invalid replacement/deletion targets are rejected;
- successful append/replacement increments historical `totalCrafts`;
- deletion does not decrement historical `totalCrafts`.

No SaveState V4 was introduced.

## Full-capacity transaction contract

The critical S2 behavior is intentionally transactional.

At 8 / 8:

1. `New Squishy` remains available;
2. creation proceeds normally;
3. `KEEP IT` opens the replacement decision;
4. persisted V3 remains unchanged while the decision is pending;
5. cancel resolves the maker save request with `null` and returns safely to Finish;
6. choosing an existing toy creates a new saved-toy ID and replaces exactly that index;
7. only then is the new V3 state written/flushed;
8. the newly saved toy immediately enters Squeeze.

There is no FIFO eviction, random replacement, paid/ad gate or pre-emptive deletion.

## Storage hardening

V3 decoding already enforces:

- maximum 24 saved toys;
- capacity in the supported range;
- unique bounded saved-toy IDs;
- known shape/material IDs;
- bounded appearance stroke/mix-in counts;
- bounded stroke payload strings.

S2 also escapes persisted saved-toy IDs before inserting them into Library `data-*` markup, so malformed local storage cannot turn an otherwise bounded ID into broken/injected HTML.

## Payload evidence

The permanent Browser QA builds representative valid appearances through the production appearance codec and measures the full UTF-8 `JSON.stringify(SaveStateV3)` envelope.

| Fixture | Full V3 bytes | Approx. bytes / toy |
| --- | ---: | ---: |
| 1 rich toy | 3,426 B | 3,426 B |
| 8 rich toys | 26,512 B | 3,314 B |
| 24-toy stress | 79,333 B | 3,306 B |

Largest representative appearance in the fixture: **3,214 B**.

The current authored-appearance production target remains **≤ 6 KB per toy**.

Current Yandex Games SDK documentation states that `player.setData()` supports up to **200 KB per player**. The representative 24-toy stress envelope is therefore roughly **39%** of that current cloud-data limit, while the initial eight-slot product capacity is roughly 13%.

Source checked 2026-09-15:
`https://yandex.com/dev/games/doc/en/sdk/sdk-player`

This supports keeping the decoder hard bound at 24. It does **not** make 24 slots a product commitment; product capacity can remain 8 until retention/monetization evidence justifies more.

## Permanent Browser QA contract

The S2 release suite proves:

1. production Pages boot into an empty personal Library;
2. all six maker shapes remain open;
3. phone portrait, phone landscape and short desktop primary actions stay contained;
4. V2 migrates to V3 without fabricating a custom toy;
5. Yandex SDK lifecycle, RU copy, settings persistence and QA/probe exclusions remain valid;
6. three real pointer-driven crafts append in deterministic order;
7. reload retains the library;
8. a non-latest toy opens directly into real Squeeze with the saved shape/material;
9. delete mutates nothing before confirmation and removes only the chosen middle toy;
10. a full eight-slot Library still allows creation;
11. full-capacity save mutates nothing before replacement choice;
12. replacement cancellation preserves the old library;
13. confirmed replacement keeps library length and selected index and increments totalCrafts;
14. 1 / 8 / 24 V3 payload evidence is measured from valid fixtures;
15. the S0 appearance probe remains green.

The final bounded validation/visual run `34962829873` passed release checking and all Browser QA scenarios before capturing the final visual lifecycle. The production visual artifact is `sandbox-s2-modal-fix-visuals`.

## Visual review result

The first production capture found one real defect: modal design tokens were scoped to the Library shell while delete/replace modals are sibling nodes, causing near-white text on a light sheet.

A bounded CSS fix moved/duplicated the required tokens into the modal scope and compacted the phone replacement chooser. The second visual pass is accepted.

Canonical visual review: `SANDBOX_PIVOT_S2_VISUAL_REVIEW.md`.

## Scope review

The final branch does **not** add:

- faces/decals/accessory identity;
- recipe/XP/title meta;
- rewarded ads or slot monetization;
- currency/shop/orders;
- bitmap screenshot persistence;
- per-card WebGL rendering;
- renderer/physics rewrite;
- new shape-specific renderer branches;
- SaveState V4;
- package/shared-kit upgrade.

The remaining visual identity gap is intentionally handed to S3 Decor rather than hidden with S2 scope creep.

## Final decision

**S2 engineering: PASS.**

Before merge:

- remove all temporary S2 apply/hardening/modal/visual workflows and helper scripts;
- remove the screenshot-only visual test from permanent release discovery;
- confirm the final branch-vs-main diff contains only product code, permanent QA and canonical docs;
- run permanent PR `Release Check` + `Release Browser QA`;
- merge only if those permanent gates are green;
- verify `main` build/browser QA/Pages deploy afterward.

After merge, the next development phase is **S3 — Decor MVP**. Physical-phone/manual touch acceptance remains outstanding as the external release gate.
