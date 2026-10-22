import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of every status icon sprite. */
export const STATUS_ICON_SIZE = 9;
/** Distance between icon origins (`Gui#extractHearts`: `x + i * 8`). */
export const STATUS_ICON_STRIDE = 8;

/** One icon of a row: the sprites drawn bottom to top. */
export type StatusIconLayers = readonly string[];

/**
 * Sprites of the `index`th icon of a half-point meter: a full icon for each full pair of points,
 * a half icon for an odd remainder (`Gui#extractArmor`, `Gui#extractFood`).
 */
export function halfPointIcon(
  index: number,
  value: number,
  empty: string,
  half: string,
  full: string,
): StatusIconLayers {
  const point = index * 2 + 1;
  if (point < value) return [empty, full];
  if (point === value) return [empty, half];
  return [empty];
}

interface StatusRowOwnProps {
  /** Number of icons. */
  readonly count: number;
  /** Sprites of icon `index` (0 is the first one filled). */
  readonly layers: (index: number) => StatusIconLayers;
  /** Fill from the right, like hunger and air. */
  readonly reverse?: boolean;
  /** Icon positions available; defaults to `count`. Reversed rows anchor to the last one. */
  readonly slots?: number;
}

function StatusRow(
  props: StatusRowOwnProps & {
    readonly as: ElementType | undefined;
    readonly label: string;
    readonly rest: Record<string, unknown>;
    readonly className: string;
    readonly style: CssVariables | undefined;
    readonly value: number;
    readonly max: number;
  },
): JSX.Element {
  const {
    as,
    label,
    rest,
    className,
    style,
    value,
    max,
    count,
    layers,
    reverse,
    slots = count,
  } = props;
  const Component: ElementType = as ?? 'div';
  const width = slots === 0 ? 0 : (slots - 1) * STATUS_ICON_STRIDE + STATUS_ICON_SIZE;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': STATUS_ICON_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-status-row', className),
          style: rootStyle,
          role: 'meter',
          'aria-label': label,
          'aria-valuemin': 0,
          'aria-valuemax': max,
          'aria-valuenow': value,
        },
        rest,
      )}
    >
      {Array.from({ length: count }, (_, index) => {
        const slot = reverse === true ? slots - 1 - index : index;
        return layers(index).map((sprite) => (
          <Sprite
            key={`${String(index)}:${sprite}`}
            sprite={sprite}
            width={STATUS_ICON_SIZE}
            height={STATUS_ICON_SIZE}
            style={placeAt(slot * STATUS_ICON_STRIDE, 0)}
          />
        ));
      })}
    </Component>
  );
}

/** Splits polymorphic props into the row's own and pass-through parts. */
function splitRest<P extends object>(
  props: P,
  ownKeys: readonly string[],
): {
  readonly as: ElementType | undefined;
  readonly className: string;
  readonly style: CssVariables | undefined;
  readonly rest: Record<string, unknown>;
} {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ownKeys.includes(key) && key !== 'as' && key !== 'className' && key !== 'style') {
      rest[key] = value;
    }
  }
  return {
    as: (props as { as?: ElementType }).as,
    className: (props as { className?: string }).className ?? '',
    style: (props as { style?: CssVariables }).style,
    rest,
  };
}

/** `Gui.HeartType`, the tint variants that have their own sprites. */
export type HeartVariant = 'normal' | 'poisoned' | 'withered' | 'frozen';

export interface HeartsOwnProps {
  /** Health in half hearts (`20` is a full bar). */
  readonly value: number;
  /** Maximum health in half hearts. Defaults to 20. */
  readonly max?: number;
  /** Absorption in half hearts, drawn as golden hearts after the health. */
  readonly absorption?: number;
  readonly variant?: HeartVariant;
  /** Hardcore hearts (`container_hardcore`). */
  readonly hardcore?: boolean;
}

export type HeartsProps<E extends ElementType = 'div'> = PolymorphicProps<E, HeartsOwnProps>;

/** Sprites of the `index`th heart (`Gui.HeartType#getSprite`). */
export function heartLayers(
  index: number,
  value: number,
  variant: HeartVariant,
  hardcore: boolean,
): StatusIconLayers {
  const container = hardcore ? 'hud/heart/container_hardcore' : 'hud/heart/container';
  const prefix = variant === 'normal' ? '' : `${variant}_`;
  const mode = hardcore ? 'hardcore_' : '';
  const point = index * 2 + 1;
  if (point < value) return [container, `hud/heart/${prefix}${mode}full`];
  if (point === value) return [container, `hud/heart/${prefix}${mode}half`];
  return [container];
}

/** The health bar (`Gui#extractHearts`), 10 hearts by default. */
export function Hearts<E extends ElementType = 'div'>(props: HeartsProps<E>): JSX.Element {
  const { value, max = 20, absorption = 0, variant = 'normal', hardcore = false } = props;
  const split = splitRest(props as HeartsProps<'div'>, [
    'value',
    'max',
    'absorption',
    'variant',
    'hardcore',
  ]);
  const health = Math.min(Math.max(value, 0), max);
  const hearts = Math.ceil(max / 2);
  const absorbed = Math.ceil(Math.max(absorption, 0) / 2);
  return (
    <StatusRow
      {...split}
      label="Health"
      value={health}
      max={max}
      count={hearts + absorbed}
      layers={(index) =>
        index < hearts
          ? heartLayers(index, health, variant, hardcore)
          : absorbingLayers(index - hearts, absorption, hardcore)
      }
    />
  );
}

function absorbingLayers(index: number, absorption: number, hardcore: boolean): StatusIconLayers {
  const mode = hardcore ? 'hardcore_' : '';
  const point = index * 2 + 1;
  return [
    point < absorption ? `hud/heart/absorbing_${mode}full` : `hud/heart/absorbing_${mode}half`,
  ];
}

export interface HungerOwnProps {
  /** Food level in half drumsticks (`20` is full). */
  readonly value: number;
  /** Use the green "hunger" effect sprites. */
  readonly hunger?: boolean;
}

export type HungerProps<E extends ElementType = 'div'> = PolymorphicProps<E, HungerOwnProps>;

/** The food bar (`Gui#extractFood`): 10 drumsticks filled from the right. */
export function Hunger<E extends ElementType = 'div'>(props: HungerProps<E>): JSX.Element {
  const { value, hunger = false } = props;
  const split = splitRest(props as HungerProps<'div'>, ['value', 'hunger']);
  const suffix = hunger ? '_hunger' : '';
  const food = Math.min(Math.max(value, 0), 20);
  return (
    <StatusRow
      {...split}
      label="Food"
      value={food}
      max={20}
      count={10}
      reverse
      layers={(index) =>
        halfPointIcon(
          index,
          food,
          `hud/food_empty${suffix}`,
          `hud/food_half${suffix}`,
          `hud/food_full${suffix}`,
        )
      }
    />
  );
}

export interface ArmorOwnProps {
  /** Armor points (`20` is a full bar). */
  readonly value: number;
}

export type ArmorProps<E extends ElementType = 'div'> = PolymorphicProps<E, ArmorOwnProps>;

/** The armor bar (`Gui#extractArmor`): 10 chestplates filled from the left. */
export function Armor<E extends ElementType = 'div'>(props: ArmorProps<E>): JSX.Element {
  const armor = Math.min(Math.max(props.value, 0), 20);
  const split = splitRest(props as ArmorProps<'div'>, ['value']);
  return (
    <StatusRow
      {...split}
      label="Armor"
      value={armor}
      max={20}
      count={10}
      layers={(index) =>
        halfPointIcon(index, armor, 'hud/armor_empty', 'hud/armor_half', 'hud/armor_full')
      }
    />
  );
}

export interface AirOwnProps {
  /** Remaining air in ticks (`300` is full). */
  readonly value: number;
  /** Maximum air in ticks. Defaults to 300. */
  readonly max?: number;
}

export type AirProps<E extends ElementType = 'div'> = PolymorphicProps<E, AirOwnProps>;

/** `Gui#extractAirBubbles`: bubbles remaining, and bubbles that are mid-pop. */
export function airBubbles(
  air: number,
  max = 300,
): { readonly full: number; readonly popping: number } {
  const full = Math.ceil(((air - 2) * 10) / max);
  const all = Math.ceil((air * 10) / max);
  return { full: Math.max(full, 0), popping: Math.max(all - Math.max(full, 0), 0) };
}

/** The air bubbles (`Gui#extractAirBubbles`), filled from the right. Empty when the player is not under water. */
export function Air<E extends ElementType = 'div'>(props: AirProps<E>): JSX.Element {
  const { value, max = 300 } = props;
  const split = splitRest(props as AirProps<'div'>, ['value', 'max']);
  const { full, popping } = airBubbles(value, max);
  return (
    <StatusRow
      {...split}
      label="Air"
      value={value}
      max={max}
      count={full + popping}
      slots={10}
      reverse
      layers={(index) => [index < full ? 'hud/air' : 'hud/air_bursting']}
    />
  );
}
