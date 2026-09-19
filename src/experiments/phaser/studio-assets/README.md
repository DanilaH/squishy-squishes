# Studio v8 — asset upload inbox

Upload **seven PNGs only** from the `studio-v8-upload-to-github.zip` archive into this exact directory on branch `feat/studio-environment-v1` (draft PR #56):

- `studio-wall.png`
- `studio-floor.png`
- `studio-desk-left.png`
- `studio-desk-middle.png`
- `studio-desk-right.png`
- `studio-decor-left.png`
- `studio-decor-right.png`

Do not upload the ZIP itself or upload the files into `main`. This directory is an **asset inbox**, not evidence of integration. After the files arrive, we must add the preview-only layout, test actual Shape/Paint in Chromium on 320×700, 390×844 and 1440×900, inspect DPR seams and pointer/touch behavior, and retain fallback. See `docs/STUDIO_ENVIRONMENT_GATE1_RESULTS.md`. The larger original candidate archive holds the editable OpenRaster master and audit.
