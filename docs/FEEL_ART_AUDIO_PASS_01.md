# Squishy Squishes — Feel / Art / Audio Pass 01

**Status:** ACTIVE BOUNDED SPEC

## Goal

Make the finished 24-recipe loop feel like one premium tactile collectible product under repetition.

This pass owns the reward choreography around the already accepted mechanics:

`final mold press → anticipation → reveal → stable result squeeze → collect exit`

It also removes obvious validation/prototype presentation residue and adds bounded material-sensitive audio variation.

It does **not** add gameplay, recipes, progression systems or bespoke recipe effects.

## Problems to fix

1. Reveal currently has only a boolean `premium` audio distinction, while the product thesis depends on meaningful material/filling hierarchy.
2. Result presentation is mostly one generic flash + halo regardless of ordinary vs showcase content.
3. Collect is visually/audio-wise brief and can read as the object simply disappearing rather than being owned/recorded.
4. High-frequency stage-complete/reveal/collect sounds are synthetic and nearly identical under repetition.
5. Remaining copy such as `Production line · 01` / `CRAFT 01` reads like an internal vertical-slice build rather than the finished toy lab.
6. Reward hierarchy must improve without particle spam or per-recipe code.

## A. Generic presentation tier

Introduce one derived presentation concept only:

- `standard` — ordinary soft + smooth recipes;
- `special` — richer texture/material recipes such as foam or jelly;
- `showcase` — holographic and/or pearl-heavy premium results.

The tier is cosmetic. It must not affect:

- XP;
- unlocks;
- recipe identity;
- save state;
- craft progress;
- renderer physics;
- ad eligibility.

Derive it from existing `VariantChoice` material/filling data in one pure helper. Do not store it in content or save schemas.

## B. Reveal choreography

Preserve the existing mold/reveal/test state sequence.

Improve only presentation:

- short quiet/hold at the start of reveal rather than immediate full flash;
- tier-scaled environment light ownership;
- stronger but restrained object settle for special/showcase results;
- stable test-state halo/readability after the reveal;
- holographic showcase may receive bounded spectral light in the environment, but not full-screen rainbow motion;
- no continuous particle emitter;
- no recipe-specific reveal branch.

Do not materially increase time-to-squeeze. The player should regain result interaction at roughly the current cadence.

## C. Collect causality

Collect should read as ownership/progression, not deletion.

Bounded treatment:

- object lifts/contracts toward the collection/progression direction rather than simply fading upward;
- collection/progression summary receives a short response already compatible with current `collectionPulse`;
- tier may modestly change audio weight, but no long celebration screen;
- rank/unlock feedback remains concise and non-blocking.

## D. Audio hierarchy and fatigue

Use WebAudio only; no asset-production pipeline in this pass.

### Reveal

Replace the boolean premium reveal with the same `standard | special | showcase` tier.

Each tier may alter:

- low contour weight;
- high contour interval;
- duration;
- subtle filtered-noise shimmer for showcase.

Keep total reveal audio short and controlled.

### Collect

Allow tier-sensitive collect weight/interval while staying shorter/lighter than reveal.

### High-frequency stage complete

Reduce exact repetition without adding random noise soup:

- cycle through a tiny deterministic pitch variation or similarly bounded tonal variation;
- keep stage-complete quieter than reveal/collect;
- no semantic stage-specific sound library in this pass.

### Tactile squeeze

Do not rewrite the accepted tactile texture/release path. Material-specific squeeze audio is deferred unless hands-on evidence says it is necessary after this reward pass.

## E. Product copy cleanup

Remove validation residue from player-facing copy:

- brand subtitle should describe the toy-lab/product, not `Production line · 01`;
- stage kicker should become generic product language rather than `CRAFT 01`;
- preserve RU/EN parity and typed copy.

No marketing essay inside gameplay UI.

## F. Accessibility / reduced motion

- sound-off state must preserve reveal hierarchy visually;
- `prefers-reduced-motion` continues to collapse animation durations;
- presentation tier may change emphasis but not information required to proceed;
- no flashing/strobing sequence.

## Explicit non-goals

- no new shapes/recipes/palettes/materials/fillings;
- no rarity/economy system;
- no new stage/state machine;
- no shader rewrite;
- no spring/deformation changes;
- no new progression tuning;
- no bespoke per-recipe VFX/audio;
- no persistent particle systems;
- no rewarded-ad UI;
- no store art yet.

## Acceptance

Structural:

- one pure presentation-tier resolver;
- tier used by reveal/result/collect presentation and audio only;
- no recipe IDs referenced in presentation/audio code;
- craft interaction constants/handlers unchanged;
- strict typecheck + Pages build + Yandex build/verifier green.

Product:

- standard result remains clean/desirable rather than intentionally weak;
- special result feels richer without being louder/noisier everywhere;
- showcase result has noticeably stronger anticipation/light/audio ownership;
- reveal still reaches squeeze quickly;
- Collect feels causally connected to collection/progression;
- repeated stage-complete sound is less fatiguing;
- prototype copy residue is gone.

## Follow-up

After this pass the next major gate is repeated-use / lifecycle / performance QA from `QA_AND_ACCEPTANCE.md`, followed by Yandex DRAFT/store/moderation work. Manual visual/audio acceptance may remain explicitly deferred by owner decision, but must not be reported as passed without an actual check.
