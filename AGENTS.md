# Squishy Squishes — Agent Contract

This repository is a bounded Squish Feel Probe, not a full game.

Read `docs/SQUISH_FEEL_PROBE.md` first. Then consult the canonical Yandex Games guidance in `DanilaH/decisions` and the public API docs in `DanilaH/mini-games-kit` when relevant.

The only decision question is whether one generic soft object can remain pleasant to squeeze 20+ times using cheap local mesh deformation, damped return, material response, and tactile audio without true soft-body physics or bespoke per-object deformation code.

PASS means Squishy Lab / Maker can move to full-project planning. FAIL means stop this thesis and return the next production slot to Custom Headphones. Do not create a MAYBE by adding product scope.

Allowed scope: one object, TypeScript, Vite, WebGL2, local mesh deformation, pointer/touch input, damped spring return, cheap pseudo-volume response, material/shadow feedback, diagnostic overlay, and tactile audio.

Forbidden in the probe: economy, progression, collection, ads, Yandex SDK, persistence/backend, merge, mystery boxes, shops/orders/customers, multiple mini-games, multiple authored objects, third-party soft-body physics, or features added to compensate for weak squeezing.

Pin `DanilaH/mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`. Use `sampleContinuousInteraction(...)` and `ContinuousNoiseTexture` where they fit. Keep hit testing, pointer geometry, mesh topology, deformation, spring tuning, pseudo-volume logic, and shaders local.

Use strict TypeScript. Keep the frame loop allocation-light, bound dt and deformation amplitudes, and clean up pointer/audio state on cancel, visibility changes, and teardown.

Acceptance is repeated-use: at least 60 seconds of interaction and 20+ deliberate presses/drags/releases. The single bounded feel-refinement pass has now been used; further edits before PASS/FAIL are limited to concrete defects or tuning exposed by hands-on testing. Do not spend a second day rescuing the thesis without new evidence.

After the probe, record PASS/FAIL and write material findings back to the canonical decision documents.
