# Phaser M5 — platform parity evidence and remaining gates

This is an evidence ledger, **not release approval**. `phaser-platform.html` is isolated from normal `index.html`, Pages and Yandex production builds. It mounts the **original** `bootstrapSquishyApp` with an optional Phaser maker renderer; the same release session, runtime activity coordinator, V3 repository, save/reward code and analytics handlers remain authoritative. `src/main.ts` still uses the raw renderer.

## Proven by candidate Chromium with a structural Yandex SDK

- The pinned kit's `createYandexPlatformRuntime` and `YandexAdsAdapter` receive a structural in-browser SDK. `LoadingAPI.ready` is called once; GameplayAPI starts/stops through one activity coordinator. An SDK pause overlapping an independent blocker cannot resume early.
- A complete original Library → Phaser maker → Finish → durable V3 save → Library path emits one `craft_save`; a deliberately failing V3 write leaves the maker on Finish and emits no `craft_save`. All candidate storage keys, including migration/settings, are prefixed and cannot overwrite the normal save key.
- A rewarded close without a grant leaves an eight-slot shelf unchanged. Duplicated rewarded callbacks grant only once. If the grant write fails, capacity remains eight; retry after storage recovery persists the existing S5 reward once. Closing an ad while an SDK pause remains active cannot start gameplay.
- Existing `npm run release:check` and `npm run qa:browser` continue to gate the unchanged production entry. Phaser candidate build and E2E are independently gated in GitHub Actions.

Tests: `tests/phaser-candidate/platform-runtime.spec.ts` and `platform-durability.spec.ts`. These are **mocked SDK callbacks against real kit adapters**, not real ad inventory or a hosted validation.

## Not yet proven / no silent cutover

1. The current `createSquishyPlatformRuntime()` configures Yandex `getStorage()` (safe storage), **not** optional Player Data cloud mirroring. Do not claim cloud sync was tested or introduce reconciliation policy silently.
2. Validate a SHA-addressed Phaser-specific Yandex DRAFT ZIP using the real SDK on the hosted Yandex domain: loading ready once, pause/resume, real rewarded close/grant/error/no-fill, local storage and any supported cloud behavior, ads and analytics, language, repeated sessions and resume from background.
3. Test physical-device touch/audio/performance, context-loss recovery, low-memory lifecycle, visual parity and bfcache. Chromium mobile emulation does not satisfy this gate.
4. Compare old-build readback of newly created V3 saves, V2 migration, corrupt-save preservation, all shape/material IDs, 8→10 reward across sessions, rollback artifact, and the existing **5 MiB** Yandex upload cap before switching the default entry.

Existing release/ad/save behavior must not be changed merely to satisfy the engine migration.
