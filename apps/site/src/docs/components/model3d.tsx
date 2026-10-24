import { BlockModel, ModelViewport, Node3D, createBoxQuads, type ModelSceneContext } from "cobble-ui";
import { useState, type JSX } from "react";
import { Code, ComponentDoc } from "../../components/Prose.tsx";

/** A 16 x 16 x 16 cube (one block) textured with a single block texture on every face. */
function buildCube(context: ModelSceneContext): void {
  const { root, textures } = context;
  const texture = textures["block/stone"];
  if (!texture) return;
  const cube = new Node3D();
  cube.scale = 1 / 16;
  cube.addQuad(
    ...createBoxQuads({
      u: 0,
      v: 0,
      width: 16,
      height: 16,
      depth: 16,
      texture,
      fullFaces: true,
      lit: false,
    }),
  );
  root.add(cube);
}

const CODE = `<ModelViewport
  aria-label="Stone block"
  width={80}
  height={80}
  textures={['block/stone']}
  camera={{ position: [1.6, 1.3, 2.4] }}
  rotatable
  followMouse
  onSceneReady={({ root, textures }) => {
    const cube = new Node3D();
    cube.scale = 1 / 16;
    cube.addQuad(
      ...createBoxQuads({
        u: 0, v: 0, width: 16, height: 16, depth: 16,
        texture: textures['block/stone']!, fullFaces: true, lit: false,
      }),
    );
    root.add(cube);
  }}
/>`;

export function ModelViewportPage(): JSX.Element {
  const [follow, setFollow] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          A canvas for small 3D scenes, sized in GUI units and drawn at device
          resolution by the library&apos;s own software renderer (no WebGL and no
          dependencies). Textures come from the client files, sampled with
          nearest filtering. Rendering pauses off-screen and happens only when
          something changed. While loading, or if the browser cannot draw to a
          canvas, the <Code>fallback</Code> is shown. Drag or use the arrow keys to rotate; tick the box to make the
          model follow the cursor like the inventory player.
        </>
      }
      demo={
        <div className="site-row">
          <ModelViewport
            aria-label="Stone block"
            width={80}
            height={80}
            textures={["block/stone"]}
            rotatable
            autoRotate={!follow}
            followMouse={follow}
            camera={{ position: [1.6, 1.3, 2.4] }}
            onSceneReady={buildCube}
            fallback="Loading"
          />
          <label>
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
            />{" "}
            Follow mouse
          </label>
        </div>
      }
      code={CODE}
      rows={[
        { name: "aria-label", type: "string", description: "Accessible name. Required." },
        { name: "width", type: "number", defaultValue: "64", description: "Width in GUI units." },
        { name: "height", type: "number", defaultValue: "64", description: "Height in GUI units." },
        {
          name: "textures",
          type: "string[]",
          description:
            "Texture ids to load (block/stone, entity/player/wide/steve). The scene is built once all are ready; they arrive in context.textures.",
        },
        {
          name: "onSceneReady",
          type: "(context) => void | (() => void)",
          description:
            "Build the scene under context.root. The context has root (a Node3D), textures (decoded images), look and invalidate. May return a cleanup.",
        },
        {
          name: "onFrame",
          type: "(context, { delta, time }) => void",
          description: "Called before each rendered frame. Combine with animated.",
        },
        {
          name: "camera",
          type: "{ fov?, position?, target? }",
          defaultValue: "{ fov: 30, position: [0, 0, 5] }",
          description: "Perspective camera setup.",
        },
        {
          name: "rotatable",
          type: "boolean",
          defaultValue: "false",
          description: "Drag or press the arrow keys to rotate (pitch is clamped).",
        },
        {
          name: "followMouse",
          type: "boolean | 'manual'",
          defaultValue: "false",
          description:
            "Turns toward the cursor like InventoryScreen#extractEntityInInventoryFollowsMouse. 'manual' only fills context.look so head and body can move separately.",
        },
        {
          name: "autoRotate",
          type: "boolean | number",
          defaultValue: "false",
          description:
            "Spin around the vertical axis (true is 30 degrees per second). Ignored with prefers-reduced-motion.",
        },
        {
          name: "animated",
          type: "boolean",
          defaultValue: "false",
          description: "Render every frame while visible instead of on demand.",
        },
        {
          name: "initialYaw / initialPitch",
          type: "number",
          defaultValue: "0",
          description: "Starting rotation in degrees.",
        },
        {
          name: "pitchLimit",
          type: "number",
          defaultValue: "80",
          description: "Maximum pitch from dragging, in degrees.",
        },
        {
          name: "fallback",
          type: "ReactNode",
          description: "Shown while loading and when canvas drawing is unavailable.",
        },
      ]}
    />
  );
}

const BLOCK_CODE = `<BlockModel name="furnace" width={64} height={64} />
<BlockModel name="grass_block" followMouse rotatable={false} />
<BlockModel name="stone" autoRotate />`;

export function BlockModelPage(): JSX.Element {
  const [follow, setFollow] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          Any block or item model from the game files as real 3D geometry:
          the elements of <Code>models/**.json</Code> with per-face uv and
          rotation, element rotation, tints and the vanilla face shading (top
          1.0, north/south 0.8, east/west 0.6, bottom 0.5). It resolves the item
          definition like <Code>ItemIcon</Code>, but without the inventory
          display transform so it can be turned freely. Drag or use the arrow
          keys. While loading (or without canvas drawing) the flat <Code>ItemIcon</Code>{" "}
          is shown.
        </>
      }
      demo={
        <>
          <div className="site-row">
            {["stone", "grass_block", "furnace", "oak_log", "crafting_table", "torch", "oak_stairs"].map(
              (name) => (
                <BlockModel
                  key={name}
                  name={name}
                  rotatable={!follow}
                  followMouse={follow}
                  initialYaw={follow ? 0 : -35}
                />
              ),
            )}
          </div>
          <label>
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
            />{" "}
            Follow mouse
          </label>
        </>
      }
      code={BLOCK_CODE}
      rows={[
        { name: "name", type: "string", description: "Item or block id: stone, furnace, oak_stairs, ..." },
        { name: "aria-label", type: "string", description: "Accessible name. Defaults to the id." },
        { name: "width / height", type: "number", defaultValue: "64", description: "Size in GUI units." },
        { name: "rotatable", type: "boolean", defaultValue: "true", description: "Drag or press the arrow keys to turn the model." },
        { name: "followMouse", type: "boolean", defaultValue: "false", description: "Turns toward the cursor." },
        { name: "autoRotate", type: "boolean | number", defaultValue: "false", description: "Spin around the vertical axis." },
        { name: "initialYaw / initialPitch", type: "number", defaultValue: "-35 / 25", description: "Starting rotation in degrees." },
        { name: "camera", type: "{ fov?, position?, target? }", defaultValue: "{ position: [0, 0, 4.2] }", description: "Camera setup, as for ModelViewport." },
      ]}
    />
  );
}
