# Bumping the game version

Cobble UI mirrors one Minecraft: Java Edition version (`DEFAULT_GAME_VERSION` in
`packages/cobble-ui/src/assets/mojang.ts`). Never commit Mojang assets while doing this; only names,
ids and numeric constants belong in the repository.

## Checklist

1. **Version constant.** Update `DEFAULT_GAME_VERSION` in `src/assets/mojang.ts`. If the cache layout
   changes, bump `CACHE_NAME` there too. Update the "26.3" mentions in the README, the site pages
   (`apps/site/src/docs/guides/*.mdx`, `Home.tsx`) and doc comments (`grep -rn "26\.3"`).
2. **Sprite ids** (`src/assets/sprite-ids.ts`).
   - `pnpm --filter cobble-ui sprite-ids:check` lists added and removed GUI sprites. It only reads the
     jar's file listing via range requests.
   - `pnpm --filter cobble-ui sprite-ids:write`, then `pnpm format`, regenerates the file.
   - Fix every typecheck error caused by removed or renamed sprites (`pnpm typecheck`), and adopt new
     sprites where a widget changed.
   - The "Sprite ids" GitHub workflow runs the check weekly and on demand.
3. **Sounds** (`src/sound/sounds.ts`). `sounds.json` cannot be read cross-origin, so the event to file
   mapping is mirrored by hand. Compare the `ui.*` events (names, `volume`, `pitch`, variants) with
   the new client's `assets/minecraft/sounds.json` (via the asset index) and update `UiSoundEvent` and
   the table. Also check `DEFAULT_INCLUDE_OBJECT` in `mojang.ts` still covers the sound paths.
4. **Layout constants and behavior.** Diff the decompiled classes that the doc comments cite
   (`Window#calculateScale`, `AbstractWidget`, `AbstractScrollArea`, `AbstractSelectionList`, `EditBox`,
   `AbstractSliderButton`, tooltip positioners, `TabNavigationBar`, `Screen` background/blur, ...) and
   update any changed numbers: widget sizes and paddings, scroller metrics, tooltip margins, blur
   radius, text colors and shadow, font metrics. Update the doc comment when a method moves or is
   renamed. Re-check also the effect ids (`src/assets/effect-ids.ts`), creative tab data and the
   model/item lists under `src/render/model3d`.
5. **Download filters.** If the jar moved files, update `DEFAULT_INCLUDE` / `DEFAULT_INCLUDE_OBJECT`
   in `mojang.ts`.
6. **Tests and docs.** Update expected values in `src/logic.test.ts` / `src/render/render.test.ts`
   and component tests, then run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.
   Visually check the docs site (`pnpm dev`), since sprite nine-slice borders can change silently.
7. **Changeset.** Add a changeset describing the bump.
