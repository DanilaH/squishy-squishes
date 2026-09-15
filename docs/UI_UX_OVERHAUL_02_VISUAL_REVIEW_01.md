# UI/UX Overhaul 02 — Visual Review 01

**Evidence:** production Pages build screenshots at 390×844, 844×390 and 1280×720.

**Verdict:** DIRECTION PASS / ITERATION REQUIRED

The first screenshot pass proves that the light toy-workshop direction is materially closer to the product, but it is not ready for PR.

## What worked

- Phone portrait Choose finally reads toy-first: the squishy is the dominant object and the bottom `Все сквиши / СДЕЛАТЬ` actions are obvious.
- The dark dashboard/lab feeling is substantially gone.
- The large CTA and bright background are better aligned with the working 6–12 audience hypothesis.
- Collection is more visual and less list-like than UI/UX Pass 01.
- The one-word craft title + gesture cue is immediately clearer than the old paragraph-driven instruction layer.

## Problems found from screenshots

### 1. RU shell still exposed English recipe and shape labels

The technical canonical labels are English and were being rendered directly. This makes the Russian child-facing shell feel unfinished and creates unnecessarily long names.

**Correction:** add presentation-only RU/EN catalog names keyed by the existing canonical IDs. IDs/content/save remain unchanged.

### 2. Collection still read too much like records

Cards still gave too much visual weight to long name/status/action rows. The available `Сделать` action also collapsed visually instead of reading as the card’s primary action.

**Correction:** shorter presentation names, two-line identity, stretch primary actions, keep material/filling metadata hidden.

### 3. Completed-card action priority was backwards on mobile

The existing markup placed `Make again` before `Squeeze`, while the mobile CSS hid the secondary action. This left replay as the only completed-card action.

**Correction:** `Squeeze` becomes primary; `Again` is secondary.

### 4. Landscape Choose overlapped hero and recipe identity

The full-screen canvas remained centered while the right-side action cluster also occupied the hero area.

**Correction:** shift the select-only hero/vignette/shadow left in short landscape; constrain recipe-name width; hide redundant `Кого сделаем?` there.

### 5. New CSS accidentally overrode recipe `[hidden]`

The late `.recipe-panel.recipe-dock { display:grid }` rule beat the earlier hidden-state presentation. The recipe controls therefore remained visible during `pour` despite correct application state.

**Correction:** explicit late `[hidden] { display:none !important }` for player surfaces. No state-machine change.

### 6. Craft still showed progression chrome

The star/progress header remained visible during active making.

**Correction:** hide top player chrome outside `select`; sound remains available separately.

### 7. Background pattern was too wallpaper-like

The dense repeated white dots pushed the design toward generic preschool UI.

**Correction:** retain bright pastel depth but remove the repeated dot field.

### 8. Collect ownership was still too transient

The 520 ms collect state contradicted the new ownership-focused direction.

**Correction:** extend the state to 1300 ms and keep the toy visibly settled rather than flying away to zero opacity. This is presentation timing only; save/progression timing remains immediate and unchanged.

## Iteration 02 validation target

Re-capture the same production screenshots. The second pass must show:

- localised short names;
- no craft recipe dock;
- no active-craft level chrome;
- clean landscape separation;
- stretched collection actions;
- collection cards reading as toy slots rather than records;
- a quieter light background.
