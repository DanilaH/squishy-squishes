# UI/UX Overhaul 02 — Product and Competitor Research

**Status:** research complete enough to design from; audience hypothesis still requires post-launch validation.

## Why this pass exists

The current game has a technically healthy tactile core, production builds, Yandex lifecycle integration, progression, a 24-recipe catalog and browser QA. The player-facing shell does not yet match the product category.

The present interface still reads like a polished internal tool / dark “lab” dashboard:

- top bar carries brand copy, Lab Rank, numeric XP, collection count, recipe button and 24 discovery dots;
- the select state is dominated by text and metadata rather than the toy itself;
- mobile recipe controls are compact web controls rather than toy-like touch controls;
- collection cards expose status, material/filling metadata and separate action controls in a dense list/grid;
- Russian craft copy explains mechanics in sentences such as “Если держать на месте, смешивание не идёт”; 
- the release visual language is dark, glassy and restrained.

This is coherent for a developer-facing prototype. It is not the strongest language for a child-oriented tactile toy game.

## Audience: what we know vs what we infer

### Platform facts

Yandex Games overall is **not** a children-first platform. Current Yandex documentation reports:

- 0–24: 11% of total platform audience;
- 35–44: 49%;
- women: 39%, men: 61%;
- phones: 50%, computers: 40%, tablet/TV: 10%;
- Yandex recommends prioritising Android mobile because it brings the most traffic.

Sources:
- https://yandex.ru/dev/games/doc/ru/
- https://yandex.ru/dev/games/doc/ru/concepts/promotion

### Category signals

The squishy niche itself is much younger than the platform average:

- `Дамплинги и Таба лапки — создавай сквиши`: 0+, “Для девочек”, and tagged for children/teens;
- `Сквиши Мерж: Дамплинги и Масло`: 0+, “Для девочек”, tagged for children/teens;
- `Таба Лапка Сделай Сквиш`: 0+, explicitly tagged “детские”, “для детей”, “для подростков”;
- Pazu’s `Squishy Maker Games For Kids` is explicitly designed for children to play independently and adapts mechanics to different ages/capabilities;
- Toca Boca describes its game as touch-first and usable across reading abilities.

Sources:
- https://yandex.ru/games/app/damplingi-i-taba-lapki-sozdavai-skvishi-569600
- https://yandex.ru/games/app/skvishi-merzh-damplingi-i-maslo-550787
- https://yandex.ru/games/app/taba-lapka-sdelai-skvish-388967
- https://play.google.com/store/apps/details?id=com.pazugames.squishy
- https://play.google.com/store/apps/details?id=com.tocaboca.tocalifeworld

### Working audience hypothesis

Design for **roughly ages 6–12 first**, with a likely female skew but without making the product unusably “for girls only”. This is a product hypothesis, not measured truth.

Implications:

- the interface must be understandable before reading all text;
- touch targets and direct manipulation matter more than compact density;
- the toy/result must visually dominate the screen;
- labels should reinforce an obvious visual action, not carry the entire instruction burden;
- progress should be visual and aspirational rather than numeric/systemic;
- the aesthetic should be playful and polished, but not toddlerish.

## Direct competitor read

### 1. Дамплинги и Таба лапки — создавай сквиши

Current direct Yandex maker competitor. 32 base squishies (16 dumplings + 16 paws) with colour, ears and decorations.

Important pattern:

`pick character → visually customise → collect`

The object is the product. Categories are simple visual choices. The interface exists to expose decoration, not to explain a system.

**Take:** keep the toy visually central and make selection visual. Do not copy its decoration breadth yet.

### 2. Сквиши Мерж: Дамплинги и Масло

Current strong category signal. Yandex shows rating around 84 and player score around 4.7. It combines squeeze + merge + boxes + orders + a 100-item collection.

Yandex’s own rating is an engagement-oriented product score built from signals including play time, players and return rate, so its much higher rating than the older maker is directionally important. It is not evidence that merge itself is the cause.

**Take:** the product needs a visible “what is next?” loop. Collection and anticipation must not be buried in a utility overlay.

### 3. Таба Лапка Сделай Сквиш

Older direct maker. Yandex rating is around 40, while player score is around 4.4. Flow:

`choose paw → mix ingredients → add stickers → pour mold → squeeze`

**Take:** one screen / one obvious action is stronger than a dashboard around the sequence. The low Yandex engagement rating is a warning against assuming that a maker loop alone guarantees retention.

Sources for Yandex rating definition:
- https://yandex.ru/dev/games/doc/ru/concepts/metric

## Mobile product references

### Squishy Maker Games For Kids — Pazu

500K+ Play downloads. Two modes: guided Kit Mode and Creative Mode. Guided mode explicitly breaks production into cut → sand → paint steps.

Useful pattern:

- one tactile job at a time;
- tool/object dominates;
- instructions support the gesture instead of forming a dashboard;
- finished object goes to a collection.

**Take:** our existing tactile grammar is good. The shell should get out of its way.

### Super Slime Simulator — Dramaton

100M+ Play downloads, ~4.5 rating, Expert Approved. Strong reference for direct manipulation, DIY sequencing and ownership of finished creations.

Repeated review themes are revealing:

Positive:
- realistic/cute material feel;
- making something yourself then being proud of it;
- many slime types, colours and decorations;
- collection/ownership and quests.

Negative:
- intrusive ads, especially directly after creating or playing with a slime;
- users eventually exhaust content;
- misleading promotional realism is punished.

Sources:
- https://play.google.com/store/apps/details?id=com.dramaton.slime
- https://apps.apple.com/gb/app/super-slime-simulator/id1375330146?see-all=reviews

**Take:** preserve tactile honesty and make “I made this” emotionally legible. Ads must not poison the post-craft reward beat.

### Mystery Dumpling Squishy

50M+ downloads but materially weaker review score (~3.2). Product mixes unboxing, squeeze, DIY, slime and collection.

Strong pattern:

`mystery / anticipation → reveal → rare-looking object → play → collection`

Review failure mode:
- extremely aggressive ads;
- lag/crashes;
- users describe the “relaxing” promise as contradicted by interruptions.

Source:
- https://play.google.com/store/apps/details?id=com.StressGame.AntistessPopToySatisfying

**Take:** borrow anticipation and reward hierarchy, not interruption density or random-box economy.

### Toca Boca World

100M+ downloads, Expert Approved. Not a squishy competitor, but a useful children’s interaction reference.

The store description explicitly emphasises:
- touch-first interaction;
- play across reading abilities;
- curiosity and direct object manipulation;
- no time pressure.

**Take:** treat the game world/toy as the interface wherever possible.

## Adjacent visual references

Useful categories beyond squishies:

- slime / fidget simulators;
- cake / cooking maker games;
- nail / salon / dress-up makers;
- blind-box / surprise toy collection games;
- simple colouring / ASMR craft games.

The consistent high-value pattern is not “rainbow UI”. It is:

1. giant central object;
2. one visible task;
3. large bottom/edge choices;
4. immediate visual feedback;
5. short transition to the next task;
6. a visually satisfying ownership/collection screen.

## Interaction guidance worth adopting

Apple game-control guidance is not child-specific but is useful as a conservative baseline:

- direct interaction with game objects is preferable to unnecessary virtual controls;
- frequently used touch controls should be at least 44×44 pt;
- controls should have visible press states;
- hide controls that are irrelevant in the current context;
- keep secondary controls away from the primary interaction region.

Sources:
- https://developer.apple.com/design/human-interface-guidelines/game-controls
- https://developer.apple.com/design/human-interface-guidelines/designing-for-games

For this game, use **52–56 px minimum** for meaningful player actions rather than merely meeting 44 px.

## Current UI audit: concrete problems

### 1. The selected toy is not the dominant decision object

Current select state has a persistent topbar, progression summary and bottom recipe dock. The selected recipe name/material metadata competes with the actual squishy.

**Change:** hero toy first; system information second.

### 2. Progression is presented as developer/system language

`Ранг лаборатории`, exact XP fractions and 24 discovery dots are informative but emotionally weak for the target segment.

**Change:** a simple star/level badge + visual fill + next unlock preview. Keep numeric XP internally.

### 3. Collection is a dense management surface

Current mobile cards still contain:
- thumbnail;
- name;
- state label;
- material/filling metadata;
- one or two action buttons;
- rank requirement.

Several mobile action controls are styled around 32–40 px high in the current CSS.

**Change:** toy shelf/grid. Mostly image + name + one obvious state. Completed items can expose squeeze as the main action and a secondary replay affordance.

### 4. The dark lab visual metaphor fights the category

The current release CSS uses dark gradients, glass panels and restrained white metadata. This looks polished but adult/tool-like.

**Change:** soft bright toy-room/workshop direction with neutral cream/sky surfaces and recipe accent colours. Avoid generic “rainbow everywhere”.

### 5. Craft instructions are too verbal

Examples:
- `Распредели основу`;
- `Зажми и тряси из стороны в сторону...`;
- `Тяни сквиш в разные стороны. Если держать на месте...`.

**Change:** verb-first instructions + gesture animation:
- `РАСКРАСЬ`;
- `ПОТРЯСИ`;
- `ТЯНИ`;
- `ЖМЯКАЙ`;
- `ГОТОВО!`.

Text remains for accessibility/localisation, but the animation must teach the gesture.

### 6. Reward ownership is too brief

The collect state automatically exits after roughly half a second. This is efficient and emotionally weak.

**Change:** result/ownership gets deliberate screen time. New unlocks should be seen, not appended to a transient text string.

## Product positioning after research

Do **not** compete by adding a shop, merge board, random loot economy or dozens of systems.

Our differentiator should be:

> **The satisfying squishy maker where the making itself actually feels good.**

Competitors often have stronger collection spectacle but weaker tactile honesty. The product should combine:

- our accepted direct-manipulation craft;
- a child-readable toy-first shell;
- strong reveal/ownership;
- visible next-object motivation;
- low-friction replay.

## Important open product hypothesis: character identity

Competitor collectible appeal is heavily helped by faces, expressions and decoration. Our 24 recipes are currently differentiated primarily by shape × palette × material × filling.

That may be sufficient once the UI is fixed — or it may still feel too abstract to a child audience.

Do **not** immediately add face/decal architecture in Overhaul 02. Instead, treat this as the next explicit visual-content experiment after the shell is validated:

- compare plain material-first recipe cards against lightweight characterised presentation;
- only add a reusable decal/face layer if the plain catalog still lacks attachment/readability.

This is a genuine product risk, not an excuse for scope creep.

## Monetisation implications

Yandex requires ads to be clearly separate from gameplay and shown at logical pauses; it warns against unexpected ads while the user is actively interacting. This is especially important for a child-skewing tactile game.

Sources:
- https://yandex.ru/dev/games/doc/ru/concepts/requirements
- https://yandex.ru/dev/games/doc/ru/requirements/4/4

Current post-loop interstitial gating is directionally safer than mid-craft monetisation. During this redesign:

- never place ad-looking UI inside the toy shelf;
- never visually disguise an ad trigger as a reward/toy;
- protect reveal → squeeze → collect as one emotional reward beat;
- if an interstitial remains, prefer a predictable transition after ownership is acknowledged, not immediately on reveal.

## Research conclusion

The next pass is not “UI polish”. It is an information-architecture replacement:

`dashboard/lab → toy-first maker`

The tactile core stays. The surrounding product becomes:

`choose a desirable toy → make it with one obvious gesture at a time → reveal it → play with it → own it → immediately see the next desirable toy`.
