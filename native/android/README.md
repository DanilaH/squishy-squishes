# Android host

SquishyServicesPlugin is adapted from DanilaH/seeds-bits (the inspected checkout
revision is recorded in docs/RUSTORE_MIGRATION.md). It uses Yandex Mobile Ads,
not the Yandex Games web SDK. SquishyApplication initializes AppMetrica.

Differences: native sibling banner dock rather than an overlay; AtomicFile-backed
storage and reward receipt journal; absolute capacity/catalog reward intents;
Squishy event names; preview/release application IDs. No Seeds assets or save keys.

The WebView has HTTPS localhost origin for Web Locks and compression APIs. Keep
the single activity, local bundled content, and default disallow-navigation policy.
