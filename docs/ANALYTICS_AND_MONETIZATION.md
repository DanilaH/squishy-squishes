# Release analytics contract — 26 October 2026

This is the current sandbox/Android contract. The superseded recipe/XP proposal
is recoverable at commit `6bb013fa7473b0071a02b5ed8a0819ceaf87cb9c` in this path.
Monetization policy remains in [MONETIZATION_RELEASE_ROADMAP_2026-10-15.md](MONETIZATION_RELEASE_ROADMAP_2026-10-15.md);
native integration and validation boundaries are in [RUSTORE_MIGRATION.md](RUSTORE_MIGRATION.md).

## Product events

| Event | Meaning / parameters |
| --- | --- |
| `session_ready` | Once per mounted game, not per Android foreground: platform, language, mode. AppMetrica owns native session lifecycle. |
| `screen_view` | Changed visible screen: room, collection, ideas, room_editor, shape, paint, mixins, decor, squeeze (legacy stages may also occur). Re-rendering the same screen does not emit again. |
| `tutorial_start` | Active first-craft guide at startup; resumed indicates an existing draft. |
| `tutorial_result` | Guide status changes to skipped/done. Repeated draft checkpoints do not emit. |
| `craft_start` | Enter a new craft from room/collection, Ideas or saved play. Section navigation is not another craft. |
| `craft_save` | Successful durable new-toy write only, including replacement: shape, material, mode=create/replace, completedCrafts, count. Preview, cancellation and failed writes do not count. |
| `craft_edit_save` | Successful durable edit: shape, material, mode=edit, completedCrafts, count. Does not increment new crafts. |
| `first_result_squeeze` | First counted interaction in each saved Squeeze visit; shape, material. Free try-on does not count. |
| `mute_toggle` | Actual resulting muted boolean. |
| `session_end_mid_craft` | Best-effort disposal marker with stage. Process termination can omit it; do not use it as an authoritative abandonment count. |
| `collection_write_failed` | Failed durable write; count, capacity. No serialized save, user text or raw error included. |

## Reward and ad events

| Event | Meaning / parameters |
| --- | --- |
| `catalog_preview`, `catalog_unlock`, `catalog_use` | Stable catalog item key. Unlock is successful offer UI completion; use is durable craft usage, with mode and legacy flags. |
| `reward_offer_click` | Explicit offer request, item key (capacity or catalog key). |
| `reward_result` | Normal result: item, earned, capacity. A storage/SDK/ack exception instead has status=storage-or-sdk-error, outcome=unknown, **no earned=false claim**: the grant may already be saved. |
| `reward_recovered` | Native receipt durably applied and acknowledged: item, capacity. May recover an already applied idempotent grant; not a new ad/impression. |
| `interstitial_request`, `interstitial_result` | Product eligible request and result, completedCrafts/status/wasShown. Separate from SDK preloads. |
| `banner_visibility_result` | Requested UI policy. Android reports managed=native and deliberately omits showing: bridge completion cannot prove an impression. |
| `ad_request`, `ad_loaded`, `ad_load_error` | Native SDK load lifecycle; format=banner/interstitial/rewarded. Requests can be preloads, not explicit player offers. |
| `ad_shown`, `ad_impression`, `ad_clicked`, `ad_closed`, `ad_show_error` | Native SDK callbacks, format. Use impression callbacks for actual ad impressions. |
| `ad_reward_earned` | SDK reward callback, before persistence; not proof of a saved entitlement. |
| `ad_reward_persisted`, `ad_reward_persist_error` | Immediate native receipt write result. A later recovery can succeed after a persist error. |

Native events add `test` from build configuration. Live service IDs are not sent
as event parameters. Preview has no analytics key by default; a separate test
key is required. `VITE_ANALYTICS=none` omits the native key and disables JS reports.
The runtime does not manually send pointer coordinates, saved toy IDs, receipt
tokens, drafts, names or other player-authored content.

## Transport and evidence

Application initialization activates AppMetrica and enables activity auto-tracking;
JS reports pass through the Capacitor plugin as JSON event parameters. This matches
[official custom-event guidance](https://appmetrica.yandex.com/docs/en/sdk/android/analytics/android-operations.html)
and [lifecycle guidance](https://appmetrica.yandex.com/docs/en/sdk/android/analytics/android-listen).

`tests/android/localization-analytics.spec.ts` exercises the production Android
web bundle with a test-only native transport: RU/EN catalogs/dialogs/offers,
page bounds, tutorial/start counts, try-on, failed write/retry, new save vs edit,
first saved squeeze, unavailable ad and acknowledgement-failure recovery.
The existing viewport suite covers RU/EN portrait and short landscape.

These tests prove event generation and bridge payloads, not delivery to the live
AppMetrica project. Final service acceptance still requires one installed live
APK session and checking its events in that project's reports. Ads and analytics
service delivery must not be claimed from an emulator demo or mocked bridge.
