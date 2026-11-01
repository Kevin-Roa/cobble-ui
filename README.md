[![npm](https://img.shields.io/npm/v/cobble-ui?logo=npm)](https://www.npmjs.com/package/cobble-ui)
[![CI](https://github.com/Kevin-Roa/cobble-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Kevin-Roa/cobble-ui/actions/workflows/ci.yml)
[![Tests](https://github.com/Kevin-Roa/cobble-ui/actions/workflows/test.yml/badge.svg)](https://github.com/Kevin-Roa/cobble-ui/actions/workflows/test.yml)

<img src="assets/icon.svg" width="64" height="64" alt="">

# Cobble UI

**React components for building Minecraft: Java Edition–style interfaces.**

> **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Cobble UI reproduces the menus of Java Edition 26.3 pixel for pixel. It has 117 documented components
across these areas:

- **Buttons and inputs**: buttons, icon, cycle, toggle, lock and sprite buttons, checkboxes, sliders, text
  fields (single and multi-line, plus the anvil's), tooltips and dialogs.
- **Menus and layout**: screens, the title-screen panorama and splash, tabs, selection and options lists,
  scroll areas, separators, panels, and `LinearLayout` / `GridLayout` / `FrameLayout`.
- **Feedback**: a toast queue (`ToastProvider` and `useToasts`), progress bars and an asset-loading overlay.
- **HUD**: hotbar, health, food, armor and air bars, boss, experience, jump and locator bars, the attack
  indicator and status effects.
- **Containers and crafting**: inventory slots and grids, the creative inventory, the villager trading screen
  and the interactive parts of the anvil, furnace, brewing stand, enchanting table, stonecutter, loom,
  cartography table, grindstone, smithing table, beacon and crafter screens.
- **Lists and social**: server, world and resource pack rows, player rows, advancements, the recipe book.
- **Text and sprites**: formatted text with § codes, typed sprite ids, animated sprites and named icons.

- **Real game assets, never redistributed.** Textures and sounds are downloaded from Mojang's servers by the
  visitor's browser at runtime (the client jar is SHA-1 verified, then only the GUI files are cached).
  This repository and the npm package contain no Mojang assets.
- **Pixel-exact rendering.** Sprites are composed in software at device resolution following the game's
  nine-slice, tile and stretch rules from each `.mcmeta`, so they match the game at every GUI scale.
- **Game behaviour.** Click sounds on press, slider snapping, `EditBox` scrolling and cursors, tooltip
  positioning, tab layout and list selection all follow the decompiled 26.3 client.
- **No styling lock-in.** One plain CSS file in a cascade layer with zero-specificity selectors; restyle
  with classes, data attributes or CSS variables using any styling approach.
- **Composable.** Every component supports the `as` prop and `slotProps` for its inner parts. Built on
  [Base UI](https://base-ui.com) where its primitives fit.

## Quick start

```sh
pnpm add cobble-ui react react-dom
npx cobble-ui fonts public/fonts   # downloads the minecraft-ttf fonts
```

```tsx
import 'cobble-ui/styles.css';
import { Button, CobbleProvider, minecraftTtf } from 'cobble-ui';

export function App() {
  return (
    <CobbleProvider font={minecraftTtf('/fonts')} guiScale="auto">
      <Button width={200}>Singleplayer</Button>
    </CobbleProvider>
  );
}
```

The first visit downloads the official 26.3 client (≈41 MB) from Mojang; later visits read the cached GUI files.

## Repository

| Path                 | Contents                                                           |
| -------------------- | ------------------------------------------------------------------ |
| `packages/cobble-ui` | The component library (React, TypeScript, tsdown).                 |
| `apps/site`          | The documentation site, built with the library itself (Vite, MDX). |

```sh
pnpm install
pnpm dev        # builds the library, then runs the site at http://localhost:5173
pnpm test       # vitest
pnpm typecheck  # tsc
pnpm lint       # oxlint
pnpm format     # oxfmt
pnpm build      # library + site
```

## Visual regression tests

Playwright drives the docs site (`apps/site/e2e`). It is separate from `pnpm test` and never runs by default.

```sh
pnpm --filter cobble-ui build              # once: the site needs dist/cli.js to fetch fonts
pnpm --filter site test:visual:install   # once: downloads Chromium
pnpm test:visual                         # everything
pnpm --filter site exec playwright test --project=deterministic   # asset-free checks only
```

- `deterministic` reads computed CSS only (text shadow, underline and strikethrough offsets, `--cobble-scale` snapping to whole device pixels). It needs no Mojang assets.
- `visual` screenshots the button, slider, text-field, tooltip, tabs, scroll-area and progress-bar pages. The pages render Mojang textures that the browser downloads at runtime (needs network; the first run fetches the ≈41 MB client), so **baselines are gitignored and must never be committed**. They live in `apps/site/e2e/__screenshots__`.

To generate baselines, check out the revision to compare against and run `pnpm --filter site test:visual:update`. Then switch to your change and run `pnpm test:visual`; differences fail with a diff image in `apps/site/test-results`. Baselines depend on OS and browser version, so regenerate them on the machine you compare on.

## Fonts

Text uses [minecraft-ttf](https://github.com/tryashtar/minecraft-ttf) by tryashtar. The fonts are not
bundled; `npx cobble-ui fonts <dir>` downloads them from that project's GitHub release.

## Legal

Minecraft is a trademark of Mojang Synergies AB. Cobble UI is an independent project and follows the
[Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines). If you build something
with it, keep the disclaimer above on your product and do not imply endorsement by Mojang or Microsoft.
