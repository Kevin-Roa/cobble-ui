---
'cobble-ui': minor
---

Every component's default labels, titles, placeholders and aria-labels are now translated. Without a `TranslationProvider` they show the game's `en_us` strings (or the English fallback until the language file loads); a provider overrides them by key, and explicit props still win. Keys that exist in vanilla use vanilla keys (`gui.yes`, `container.chest`, ...); the rest use `cobble.*` keys. `KeybindRow` now fills its container, with the name on the left and the buttons on the right.
