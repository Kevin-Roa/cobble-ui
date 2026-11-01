---
'cobble-ui': minor
---

Add i18n support: `useTranslation`, `Translate` and `TranslationProvider` with vanilla `%s` / `%1$s` argument substitution. The `en_us` language file is downloaded from the client jar at runtime (the asset cache name changed, so the jar is re-downloaded once). `LoadingDots` now merges `className` with `cx` like other components. There are no breaking changes: the API review found the exported surface already follows the `as` / `slotProps` / `className` conventions and every export has explicit return types (enforced by `isolatedDeclarations`).
