import { ArmorStand } from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const CODE = `<ArmorStand showArms rotatable followMouse />
<ArmorStand small showBasePlate={false} autoRotate />`;

export function ArmorStandPage(): JSX.Element {
  const [follow, setFollow] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          The armor stand from the smithing table screen, built from the cubes of{' '}
          <Code>ArmorStandModel</Code> (64 x 64 texture) and drawn by the library&apos;s own software renderer. Drag or use the
          arrow keys to turn it; with <Code>followMouse</Code> it turns toward the cursor like the
          inventory player. Where canvas drawing is unavailable the box stays empty. There is no armor.
        </>
      }
      demo={
        <div className="site-row">
          <ArmorStand rotatable followMouse={follow} autoRotate={!follow} showArms scale={3} />
          <ArmorStand rotatable followMouse={follow} small scale={3} showBasePlate={false} />
          <label>
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
            />{' '}
            Follow mouse
          </label>
        </div>
      }
      code={CODE}
      rows={[
        {
          name: 'scale',
          type: 'number',
          defaultValue: '1.5',
          description:
            'GUI units per model pixel. The viewport is 24 x 36 model pixels so the stand can turn without clipping.',
        },
        {
          name: 'texture',
          type: 'string',
          defaultValue: "'entity/armorstand/armorstand'",
          description: 'Texture id of the stand.',
        },
        {
          name: 'rotatable',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Drag or press the arrow keys to turn the stand.',
        },
        {
          name: 'followMouse',
          type: "boolean | 'manual'",
          defaultValue: 'false',
          description:
            'Turns toward the cursor (InventoryScreen#extractEntityInInventoryFollowsMouse).',
        },
        {
          name: 'autoRotate',
          type: 'boolean | number',
          defaultValue: 'false',
          description: 'Spins around the vertical axis (degrees per second, true is 30).',
        },
        {
          name: 'showBasePlate',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Draws the base plate (ArmorStand#showBasePlate).',
        },
        {
          name: 'small',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Half size (ArmorStand#isSmall).',
        },
        {
          name: 'showArms',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draws the arms (ArmorStand#showArms).',
        },
        {
          name: 'initialYaw / initialPitch',
          type: 'number',
          defaultValue: '0',
          description: 'Starting rotation in degrees. The smithing table panel uses 30 and 25.',
        },
        {
          name: 'aria-label',
          type: 'string',
          defaultValue: "'Armor stand'",
          description: 'Accessible name.',
        },
      ]}
    />
  );
}
