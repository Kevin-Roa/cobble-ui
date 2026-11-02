# cobble-ui

## 0.2.0

### Minor Changes

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`a644a4f`](https://github.com/Kevin-Roa/cobble-ui/commit/a644a4f3a7e9ea522561f82dd5709a6214be74ca) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Add i18n support: `useTranslation`, `Translate` and `TranslationProvider` with vanilla `%s` / `%1$s` argument substitution. The `en_us` language file is downloaded from the client jar at runtime (the asset cache name changed, so the jar is re-downloaded once). `LoadingDots` now merges `className` with `cx` like other components. There are no breaking changes: the API review found the exported surface already follows the `as` / `slotProps` / `className` conventions and every export has explicit return types (enforced by `isolatedDeclarations`).

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`e691db9`](https://github.com/Kevin-Roa/cobble-ui/commit/e691db94407c0c9d172963c48ee7ff5b520c4786) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Add `PauseScreen`, `TitleScreen` (with a logo slot, no bundled branding), `OptionsScreen`, `KeybindButton`/`KeybindRow` and `ConfirmScreen`.

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`2aac7e8`](https://github.com/Kevin-Roa/cobble-ui/commit/2aac7e8cbbfdcbd853540e036c3ec662c5e33232) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Every component's default labels, titles, placeholders and aria-labels are now translated. Without a `TranslationProvider` they show the game's `en_us` strings (or the English fallback until the language file loads); a provider overrides them by key, and explicit props still win. Keys that exist in vanilla use vanilla keys (`gui.yes`, `container.chest`, ...); the rest use `cobble.*` keys. `KeybindRow` now fills its container, with the name on the left and the buttons on the right.

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`1ea6b77`](https://github.com/Kevin-Roa/cobble-ui/commit/1ea6b774f82288d02bbd09c0532cdb0570eca08b) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Add `WorldSelectionList` (world rows with icon, name, id/date and summary, selection and keyboard navigation) and a presentational `CreateWorldScreen` form (Game, World and More tabs).

### Patch Changes

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`2aac7e8`](https://github.com/Kevin-Roa/cobble-ui/commit/2aac7e8cbbfdcbd853540e036c3ec662c5e33232) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - The docs site's language button now opens a language screen. The chosen game language is downloaded at runtime from a public mirror of the game assets and layered over `en_us` with `TranslationProvider`.

- [#2](https://github.com/Kevin-Roa/cobble-ui/pull/2) [`a461b06`](https://github.com/Kevin-Roa/cobble-ui/commit/a461b0664ec7c8fad3b46812901a28eec6440db9) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Checkbox now toggles with Enter as well as Space (`AbstractButton#keyPressed`), matching the click sound it already played. `LoomPatternButton` and `StonecutterRecipeButton` play their vanilla `ui.loom.select_pattern` and `ui.stonecutter.select_recipe` sounds instead of the generic button click. Adds tests for widget sounds and keyboard navigation, and axe cases for every remaining exported component.

## 0.1.2

### Patch Changes

- [`4f42ffc`](https://github.com/Kevin-Roa/cobble-ui/commit/4f42ffc7f8c7ed569e328b042ec5c4d95724ebdc) Thanks [@Kevin-Roa](https://github.com/Kevin-Roa)! - Publish to both npm and GitHub Packages from the release workflow.
