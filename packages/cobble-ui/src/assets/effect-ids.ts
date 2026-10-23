/**
 * Every mob effect icon of the 26.3 client (`assets/minecraft/textures/mob_effect/<id>.png`).
 *
 * This is a list of names only, not assets: the textures themselves are downloaded by the
 * browser at runtime. Generated from the client jar file listing.
 */
export type EffectId =
  | 'absorption'
  | 'bad_omen'
  | 'blindness'
  | 'breath_of_the_nautilus'
  | 'conduit_power'
  | 'darkness'
  | 'dolphins_grace'
  | 'fire_resistance'
  | 'glowing'
  | 'haste'
  | 'health_boost'
  | 'hero_of_the_village'
  | 'hunger'
  | 'infested'
  | 'instant_damage'
  | 'instant_health'
  | 'invisibility'
  | 'jump_boost'
  | 'levitation'
  | 'luck'
  | 'mining_fatigue'
  | 'nausea'
  | 'night_vision'
  | 'oozing'
  | 'poison'
  | 'raid_omen'
  | 'regeneration'
  | 'resistance'
  | 'saturation'
  | 'slow_falling'
  | 'slowness'
  | 'speed'
  | 'strength'
  | 'trial_omen'
  | 'unluck'
  | 'water_breathing'
  | 'weakness'
  | 'weaving'
  | 'wind_charged'
  | 'wither';

/** Every effect id, in alphabetical order. */
export const EFFECT_IDS: readonly EffectId[] = [
  'absorption',
  'bad_omen',
  'blindness',
  'breath_of_the_nautilus',
  'conduit_power',
  'darkness',
  'dolphins_grace',
  'fire_resistance',
  'glowing',
  'haste',
  'health_boost',
  'hero_of_the_village',
  'hunger',
  'infested',
  'instant_damage',
  'instant_health',
  'invisibility',
  'jump_boost',
  'levitation',
  'luck',
  'mining_fatigue',
  'nausea',
  'night_vision',
  'oozing',
  'poison',
  'raid_omen',
  'regeneration',
  'resistance',
  'saturation',
  'slow_falling',
  'slowness',
  'speed',
  'strength',
  'trial_omen',
  'unluck',
  'water_breathing',
  'weakness',
  'weaving',
  'wind_charged',
  'wither',
];
