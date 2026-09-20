# Phone QA Panel — historical V2 production test utility

**Date:** 2026-09-14. **Historical status:** implemented / structural pass for the retired recipe/XP game. This is **not** a current SaveState V3 contract; do not reintroduce XP/rank controls or a production QA launcher to the freeform sandbox on the strength of this document.

## Purpose and behavior at the time

The temporary Pages phone panel let testers reach recipe/progression states without replaying the game. It edited the same canonical `SaveStateV2` repository used by that version, not a second save implementation. Controls selected rank 1–8, adjusted XP by ±25/100, toggled valid recipe completions, completed/cleared all, reset through the existing hardened path and displayed rank/XP/count. No stage skipping, renderer tuning, arbitrary localStorage editor, save bump or new progression system.

The independent review required the panel **outside** `VerticalSliceApp`, canonical-ID filtering and `totalCrafts >= completedVariantIds.length`, nonnegative XP, independent rank/recipe controls, `await write()` plus `flush()` before reload, and reset via `resetProgressSave()`. Panel open/closed preference was session-only; the ordinary bootstrap reloaded canonical persisted state after each change. The launcher lived in the debug strip and the panel was sized for phone use.

## Implementation review and evidence

The implementation review recorded those boundaries as met without changing game/craft/renderer or progression formulas. The first strict validation caught a TypeScript DOM issue because `HTMLElement.hidden` could be `boolean | 'until-found'`; converting the state explicitly to boolean fixed it. GitHub Actions run [`34849890352`](https://github.com/DanilaH/squishy-squishes/actions/runs/34849890352) then passed typecheck and production build. **This did not prove deployed physical-phone usage.** The original release rule required the temporary production QA surface to be removed or disabled before a shipping Yandex build; verify current source when assessing that rule, rather than assuming this historical panel remains installed.

## Immutable original documents

- [Original panel specification](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/PHONE_QA_PANEL.md)
- [Independent pre-implementation review](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/PHONE_QA_PANEL_REVIEW.md)
- [Implementation review](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/PHONE_QA_PANEL_IMPLEMENTATION_REVIEW.md)
