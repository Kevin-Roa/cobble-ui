# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cobble UI: a React component library that reproduces Minecraft: Java Edition **26.3** menus pixel-for-pixel, plus a docs site built with it. pnpm workspace:

- `packages/cobble-ui`: the library (TypeScript 7, tsdown, vitest + jsdom, Base UI).
- `apps/site`: Vite + React Router + MDX docs site. Its Vite config aliases `cobble-ui` to the library **sources**, so library edits show up live.

## Commands

Run from the repo root unless noted.

- `pnpm dev`: build the library (the site's predev step needs `dist/cli.js` to fetch fonts), then run the library watcher and the site.
- `pnpm test` / `pnpm typecheck` / `pnpm lint` (oxlint) / `pnpm format` (oxfmt) / `pnpm build`.
- Single test file: `cd packages/cobble-ui && npx vitest run src/logic.test.ts`. Single test by name: add `-t "slider values"`.
- Site fonts: `apps/site/scripts/ensure-fonts.mjs` downloads the minecraft-ttf TTFs into `apps/site/public/fonts` (gitignored).

## Hard constraints

- **Never commit or bundle Mojang assets** (textures, sounds, `sounds.json`, fonts). Assets are downloaded by the browser at runtime (`src/assets/mojang.ts`). Reference data that is not an asset (sprite ids, sound event → file names in `src/sound/sounds.ts`, colors, layout constants) is fine.
- Every user-facing surface (README, package description, site pages) must carry: "NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT." Do not use Minecraft branding or logos as project branding, and do not imply endorsement.
- Accuracy target: behavior and rendering mirror the decompiled 26.3 client. Doc comments cite the vanilla class/method each piece mirrors (e.g. `AbstractScrollArea#scrollerHeight`); keep doing that when adding behavior.

## Architecture

- **Assets** (`src/assets`): an `AssetSource` produces an `AssetBundle` (jar files by path + asset-index object URLs). `mojangAssets()` fetches the version manifest → client jar (SHA-1 verified) → unzips only `assets/minecraft/textures/gui/**` with fflate → caches a re-zipped copy in Cache Storage. Asset-index objects (sounds, panorama) are served from `resources.download.minecraft.net`, which has **no CORS**, so they may only be used via `<img>`/`<audio>`, never `fetch`/WebGL. `AssetStore` (one per source key, shared by nested providers) decodes sprites lazily and exposes a `useSyncExternalStore` revision.
- **Rendering** (`src/render`): `png.ts` is an exact PNG decoder (browser decoders premultiply alpha). `blit.ts` re-implements `GuiGraphicsExtractor.blitSprite`/nine-slice/tiled blits in software at **device** resolution (GUI units × `deviceScale`), sampling each device pixel at its centre. `Sprite` puts the result on a `<canvas>`. Plain repeating textures (menu backgrounds, separators) use CSS backgrounds via `TiledTexture`.
- **Units & scale**: everything is in GUI units. `CobbleProvider` resolves `guiScale` (auto mirrors `Window#calculateScale`), snaps it to whole device pixels, and sets `--cobble-scale`; CSS uses `calc(n * var(--cobble-px))`. Widgets take `width`/`height` props in GUI units but measure their real box (`useGuiSize`) so CSS overrides still draw sprites at the right size. A zero-size box counts as "not measured".
- **Text** (`src/text`): the minecraft-ttf font has 100 units per texel on a 1200-unit em, so `font-size: 12u`. `@font-face` metric overrides put the baseline on row 7 of a 9-unit line. Shadows are CSS `text-shadow` with `--cobble-text-shadow-color` (25% of the color, truncated). Strikethrough is an underline with a negative offset so it lands exactly at y+3.5. `metrics.ts` measures glyph widths with canvas; only cache widths once the `FontFace` reports `loaded` (`fontState`), because `document.fonts.check()` returns true before the face exists.
- **Components** (`src/components`): polymorphic via `as` (`PolymorphicProps`), inner parts via `slotProps`, merged with Base UI's `mergeProps` (user handlers run first). Base UI backs Button, Checkbox, Tabs and Tooltip; Slider, ScrollArea, SelectionList and TextField are custom because vanilla behavior differs (bucketed slider snapping, MC scroll math, `EditBox` drawing over a transparent native `<input>`). Tooltip uses Base UI for open/close but positions itself with the ported vanilla positioners.
- **Styles** (`src/styles.css`): all rules in `@layer cobble` and wrapped in `:where()` (zero specificity). Because every rule has equal specificity, **source order decides conflicts**; put more specific state/context rules after base rules. CSS custom properties inherit, so components that read positional vars (`--cobble-x` etc.) must reset them (as `Sprite` does).

## Conventions

- Strict TS (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `isolatedDeclarations`, so exported functions need explicit return types). Imports use explicit `.ts`/`.tsx` extensions.
- oxlint enforces the React Compiler rules: no ref reads/writes during render (use `useLatest`), no synchronous setState in effects (adjust state during render instead).
- Sprite ids are typed: `SpriteId` (`src/assets/sprite-ids.ts`) is a union of every GUI sprite in the 26.3 client jar, and `Sprite`, `WidgetSprites` and friends take it, so a typo is a compile error. The file is a name list only (no assets), generated from the jar's file listing; regenerate it when bumping the game version. Sprites that are not in the jar (custom asset sources, data-pack tooltip styles) go through `asSpriteId()`. Build computed ids from literal unions, not `string`.
- Docs: one page per component under `apps/site/src/docs/components`, registered in `registry.tsx` with a category (the sidebar groups and searches by it). Do not combine components on a page.
- Accessibility: every new component gets a case in `src/a11y.test.tsx`, which runs axe-core over it (color contrast, region and scrollable-region rules are off because jsdom has no layout). Give widgets an accessible name (`aria-label`, or `aria-labelledby` to a visible label), only use `role="tab"`/`radio`/`option` inside the parent role they require (standalone tab-like buttons use `aria-pressed`), and put `aria-label` on elements whose role allows one.
- Tests: pure math/logic in `src/logic.test.ts` and `src/render/render.test.ts`; component behavior in `src/components/components.test.tsx` using `renderWithProvider` + `memoryAssets` from `test/utils.tsx`. jsdom has no canvas or layout, so assert behavior and attributes, not pixels.
