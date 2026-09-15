# Sandbox Pivot S1 — Visual Review

## Pass 01 — production screenshots

**Evidence:** production Pages build, Chromium, real S1 lifecycle inputs, phone portrait + phone landscape + desktop.

**Verdict:** DIRECTION PASS / SCALE CORRECTION REQUIRED

The new sandbox shell is structurally much closer to the target product than the retired recipe-first management UI. The object is visually central, the creation steps are obvious, the controls are touch-first and the authored Holo result has clear ownership value. No return to the old recipe/rank shell is justified.

### What worked

- Shape screen communicates one clear decision and exposes all six shapes without lock language.
- Paint keeps the squishy as the direct interaction surface; palette/tools stay subordinate to the object.
- Authored paint is visibly attached to the object rather than reading as a DOM overlay.
- Mix-ins remain simple and legible; no particle-simulation visual debt appeared.
- Mix strips the UI down appropriately and leaves the object as the action target.
- Finish makes material selection visual through three large choices instead of metadata.
- Holo materially changes the authored toy and produces a stronger reward beat.
- Save → Squeeze is continuous; there is no interstitial or management screen between ownership and tactile play.
- Reloaded `Your Squishy` screen clearly presents the saved authored toy and two understandable next actions.
- Phone landscape uses a sensible left-object/right-controls split rather than stacking desktop UI into a short viewport.

### Required correction

The first capture was too conservative about hero scale:

- portrait left unnecessary empty space between the authored object and controls;
- desktop made the squishy feel closer to a demo widget than the product itself;
- landscape hierarchy was correct, but the object was visually underweighted versus the right-hand control cluster.

This is a scale problem, not an IA problem. Do not add extra panels, decoration chrome or explanatory copy to fill the space.

### Bounded correction

Increase the hero canvas/glow roughly 15–20% while preserving existing layout and touch-control sizing. In short landscape, allow approximately a 250 px hero rather than the prior ~210 px minimum presentation.

No renderer, physics, save, appearance, Mix, material or stage logic changes are justified by this review.

## Pass 02

Pending screenshot verification after the bounded scale correction. S1 visual acceptance is not complete until portrait, landscape, Finish, Squeeze and Home are re-reviewed.
