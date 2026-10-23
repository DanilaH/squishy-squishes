# RuStore migration — 23 October 2026

Owner-approved target: Android/RuStore, Yandex Mobile Ads and AppMetrica, with
browser/Yandex Games builds retained. The game, V3 IDs, content ownership and
reviewed tactile behavior remain shared. Android release acceptance is separate
from web CI and from a compiled preview APK.

## Build profiles and boundaries

- `npm run build`: existing Pages/browser profile, mock advertisements.
- `npm run build:yandex`: existing Yandex Games SDK, optional web Metrica.
- `npm run android:prepare`: isolated Android web output, generated Capacitor
  project, pinned Yandex Mobile Ads 8.5.0 / AppMetrica 8.6.0 dependencies.
- `npm run android:apk`: demo-ad preview APK (requires JDK 21 / Android SDK).
- `VITE_PLATFORM`, `VITE_ADS`, `VITE_ANALYTICS` are build-time choices. Unsupported
  combinations fail the build. The game uses a local platform contract and ad
  capabilities rather than platform-name tests. Additional providers require an
  implementation of that contract, not editing game screens.
- Native packages are imported only by the Android runtime. No web SDK script or
  web Metrica initialization is used by Android. No browser fallback grants mock
  rewards if the native bridge is absent.

Preview ID: `com.danilah.squishysquishes.preview`; proposed production ID:
`com.danilah.squishysquishes`. Generated Android projects cannot switch identity
in place. Use a clean checkout for a different flavor. No account/cloud sync is
claimed; existing website saves remain on their original origin.

## Banner and lifecycle

The native banner occupies a dedicated bottom sibling of the WebView. Its
adaptive SDK height reduces the WebView viewport, so existing CSS height units
and media queries operate on actual available game space. This deliberately
avoids overlay coordinates; the kit's CSS-to-native overlay placement helper is
not needed. Both orientations keep a banner dock, including short landscape.
The surrounding color matches the game. Loading/no-fill does not collapse it.

Native views hide during background/fullscreen ads. JS hides them for rendered
dialogs, room editing and first-craft guidance, retaining the reservation to avoid
layout jumps. On rotation obsolete banner callbacks are detached. Failed loads
retry only on later eligible activity after a bounded delay. SDK refresh remains
SDK-owned. Validate system insets/cutouts and real adaptive sizes on device.

App lifecycle and ad state feed the existing activity coordinator independently.
Android Back uses existing cancel/return actions and their draft confirmation;
from the room it minimizes the app. It must not discard a draft directly.

## Persistence and rewards

Native storage uses disk-authoritative AtomicFile replacements, not asynchronous
SharedPreferences.apply. Collection manifests remain the sole multi-record commit
point; Web Locks serialize the existing repository on the secure localhost origin.
The Android host must provide a modern WebView with Web Locks, WebGL2 and the
compression APIs used by the collection.

Before advertising, the game captures an immutable intent containing catalog key
and absolute target capacity. On the earned SDK callback Android durably journals
a receipt with its token and that intent. Dismissal is not earning. JS saves the
reward, then acknowledges the exact token. Startup and every new offer recover
pending receipts first. Capacity uses max(current, target), ownership uses set
union: duplicate delivery, acknowledgement failure and replay after a later grant
do not grant another place. This intentionally uses existing monotonic game policy
rather than introducing a second receipt-ID ledger or snapshot save engine.

Storage failures propagate. A failed native receipt write is retained in memory
and retried at dismissal/recovery; a process kill while the device cannot persist
anything cannot be guaranteed recoverable. Do not report such a case as a successful
durable grant.

## Service configuration and release

Live builds require `SQUISHY_BUILD_FLAVOR=release`, `ADS_MODE=live` and:
`APPMETRICA_API_KEY`, `YANDEX_BANNER_AD_UNIT_ID`,
`YANDEX_INTERSTITIAL_AD_UNIT_ID`, `YANDEX_REWARDED_AD_UNIT_ID`.
Set `ANDROID_VERSION_CODE` to a monotonically increasing release value.
Preview always uses demo ads; analytics are off unless a separate
`APPMETRICA_TEST_API_KEY` is explicitly provided. Values are not printed.

GitHub Actions Android RuStore builds preview APKs on PRs and signed live APKs
on manual release requests. Production signing, service IDs, store metadata,
privacy disclosure and device acceptance are still required before publication.
No new signing identity is silently created for production.

## Reuse and sources

Inspected mini-games-kit main `5450f9db344aacb5acdc103b4199fd8aeb11b10d`
and extraction branch `d4dee18c9b466e2b4a68d8d481db6dfc50ec9ee5`.
Used their Android lifecycle/receipt guidance. The existing exact kit dependency
is retained: no unmerged export or moving branch dependency is introduced.
Native SDK flow adapted from seeds-bits
`96caff6aac357e06b8373301b2b895544c9ef179`, with Squishy-specific persistence,
receipt semantics and native dock layout. No Seeds content/assets/settings copied.

Official integration references checked during implementation:
- https://ads.yandex.com/helpcenter/en/dev/android/quick-start
- https://ads.yandex.com/helpcenter/en/dev/android/rewarded
- https://appmetrica.yandex.com/docs/en/sdk/android/analytics/quick-start

## Validation boundaries

Required: strict types, existing web/Yandex release audit, browser regression,
visual regression, Android build, bridge-driven RU/EN screens at reduced viewport
heights, reward retry/restart tests. Native acceptance also needs real banner
bounds, portrait/landscape rotation, system Back, background/foreground, offline,
process death, update preservation, rewarded dismissal/earning and dashboard
event delivery. Mocked bridge tests do not prove native SDK delivery or store
readiness. Record actual results below as they become available.

## Release signing

The permanent signing identity is supplied through GitHub Actions secrets:
`ANDROID_KEYSTORE_BASE64` (base64 of the binary JKS/PKCS12 keystore),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
No key is automatically created or committed. Keep an independent secure backup.

Trusted same-repository PRs continue validating unsigned live configuration when
all signing secrets are absent. Partial signing configuration fails. With all four
values, CI aligns the release APK, signs it, verifies its signature and alignment,
and uploads `squishy-rustore-signed` containing the APK, certificate information
and checksum. Manual live release requires signing; it fails if keys are missing.
The temporary keystore is removed on exit and is never uploaded. Signing does not
publish the application or establish real-device/service acceptance.
