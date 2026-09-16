# Phaser M6 — Yandex DRAFT artifact and acceptance

The engine migration is **not** a production cutover. This branch builds a separate `dist-phaser-yandex/` and `squishy-squishes-phaser-draft.zip`. The existing `npm run build:yandex` and `dist-yandex/index.html` stay on the original renderer. GitHub Actions must attach the candidate ZIP to a specific commit; the SHA256 printed in the same run is the archive identity to use for Yandex DRAFT and phone checks.

## Candidate boundaries

- `npm run draft:qa` builds the candidate HTML in `phaser-yandex` mode, moves its compiled HTML to ZIP-root `index.html`, audits the actual upload root against this game's **5 MiB uncompressed** limit, then opens that exact build in Playwright using an injected structural SDK. This is not hosted Yandex verification.
- `.env.phaser-yandex` forces `VITE_PLATFORM=yandex` and disables QA. `src/experiments/phaser/yandexDraft.ts` calls the original `bootstrapSquishyApp`, injects the Phaser surface and routes through the original real `createSquishyPlatformRuntime`; there is no mock runtime, test SDK or debug/test API in the DRAFT entry.
- DRAFT prefixes **all** runtime storage keys with `squishy.phaser-yandex-draft.` to avoid mutating live V3/settings/migration data. This safety isolation is deliberate; it is **not** proof that a later production cutover reads existing unprefixed saves. V3 schema, reward logic and one runtime are unchanged.
- Rollback artifact: the existing legacy Yandex ZIP from Release Check for the same commit, not the Phaser ZIP. Keep it and verify it reads real unprefixed V3 save data before any production switch.

## Hosted signoff — requires the uploaded exact ZIP

Record the candidate workflow URL, head SHA and ZIP SHA256, Yandex DRAFT URL / game ID, phone model, OS and browser/WebView versions, and result for each gate. Confirm SDK init and `LoadingAPI.ready` once; runtime activity/overlapping pause and ad blockers; audio on mute/background/return; rewards granted exactly once, close/error gives zero; save/create/reopen/replace/delete and eight-to-ten capacity across fresh sessions; analytics event names/cadence; RU/EN and desktop, portrait and short-landscape; touch paint from outside into the shape, mix, decor, squish and Finish pointer passthrough; WebGL context loss/restore and low-memory lifecycle; visual parity and frame pacing. Real ad callbacks and storage behavior cannot be certified by a browser stub.

Before production cutover, independently verify unprefixed old↔new V3 interoperability (including V2 migration and corrupt-save preservation), compare the release/rollback archives and re-audit the final production-root ZIP. A passing candidate pipeline alone does not authorize switching `src/main.ts`, `index.html` or the normal Yandex entry.
