---
'cobble-ui': patch
---

Checkbox now toggles with Enter as well as Space (`AbstractButton#keyPressed`), matching the click sound it already played. `LoomPatternButton` and `StonecutterRecipeButton` play their vanilla `ui.loom.select_pattern` and `ui.stonecutter.select_recipe` sounds instead of the generic button click. Adds tests for widget sounds and keyboard navigation, and axe cases for every remaining exported component.
