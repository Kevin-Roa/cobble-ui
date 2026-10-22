<img src="assets/icon.svg" width="64" height="64" alt="">

# Cobble UI

**React components for building Minecraft: Java Edition–style interfaces.**

> **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Cobble UI reproduces the menus of Java Edition 26.3 pixel for pixel: buttons, icon buttons, cycle/toggle
buttons, checkboxes, sliders, text fields, tooltips, tabs, selection lists, scroll areas, screens, the
title-screen panorama and formatted text.

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

## Fonts

Text uses [minecraft-ttf](https://github.com/tryashtar/minecraft-ttf) by tryashtar. The fonts are not
bundled; `npx cobble-ui fonts <dir>` downloads them from that project's GitHub release.

## Legal

Minecraft is a trademark of Mojang Synergies AB. Cobble UI is an independent project and follows the
[Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines). If you build something
with it, keep the disclaimer above on your product and do not imply endorsement by Mojang or Microsoft.
