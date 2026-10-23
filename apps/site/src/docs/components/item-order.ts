/**
 * Orders item ids roughly the way the creative inventory does, instead of alphabetically.
 *
 * The game builds its tabs in code (`CreativeModeTabs`), so the order is not in the client files
 * this site downloads. This approximates it: items are put in the vanilla tab they belong to
 * (building blocks, colored blocks, natural blocks, …), and within a tab, variants of one
 * material stay together in the vanilla order (`oak_planks`, `oak_stairs`, `oak_slab`, …).
 */

const TABS = [
  'building',
  'colored',
  'natural',
  'functional',
  'redstone',
  'tools',
  'combat',
  'food',
  'ingredients',
  'spawn',
] as const;
type Tab = (typeof TABS)[number];

const COLORS =
  'white|light_gray|gray|black|brown|red|orange|yellow|lime|green|cyan|light_blue|blue|purple|magenta|pink';

/** First matching rule wins. */
const RULES: readonly (readonly [Tab, RegExp])[] = [
  ['spawn', /_spawn_egg$/],
  [
    'ingredients',
    /(^|_)dye$|_armor_trim_smithing_template$|_upgrade_smithing_template$|_pottery_sherd$|_banner_pattern$/,
  ],
  [
    'colored',
    new RegExp(
      `^(${COLORS})_(wool|carpet|terracotta|concrete|concrete_powder|glazed_terracotta|stained_glass|stained_glass_pane|shulker_box|bed|banner|candle|bundle|cushion)(_slab|_stairs)?$`,
    ),
  ],
  ['colored', /^(wool|terracotta|glass|glass_pane|tinted_glass|shulker_box|candle|bundle)$/],
  ['tools', /_harness$|_boat$|_raft$|_chest_boat$|_chest_raft$/],
  [
    'combat',
    /_(sword|helmet|chestplate|leggings|boots|horse_armor|nautilus_armor|spear)$|^(bow|crossbow|arrow|spectral_arrow|tipped_arrow|shield|trident|mace|totem_of_undying|turtle_helmet|elytra|wind_charge|fire_charge|ender_pearl)$/,
  ],
  [
    'tools',
    /_(pickaxe|axe|shovel|hoe|bucket)$|_on_a_stick$|_map$|^(fishing_rod|flint_and_steel|shears|brush|compass|recovery_compass|clock|spyglass|lead|saddle|name_tag|minecart|chest_minecart|furnace_minecart|tnt_minecart|hopper_minecart|command_block_minecart|rail|powered_rail|detector_rail|activator_rail|map|filled_map|elytra|goat_horn|bundle|potion|splash_potion|lingering_potion|experience_bottle|enchanted_book|writable_book|knowledge_book|debug_stick|light|armor_stand|glow_item_frame|item_frame|painting)$|^music_disc_/,
  ],
  [
    'food',
    /_stew$|_soup$|^(apple|golden_apple|enchanted_golden_apple|bread|cookie|cake|pumpkin_pie|carrot|golden_carrot|potato|baked_potato|poisonous_potato|beetroot|melon_slice|glistering_melon_slice|sweet_berries|glow_berries|chorus_fruit|dried_kelp|honey_bottle|rotten_flesh|spider_eye|beef|chicken|cod|salmon|mutton|porkchop|rabbit|tropical_fish|pufferfish|ominous_bottle|suspicious_stew)$|^cooked_/,
  ],
  [
    'redstone',
    /_(button|pressure_plate|door|trapdoor|fence_gate|bulb)$|^(redstone|redstone_block|redstone_torch|redstone_lamp|repeater|comparator|piston|sticky_piston|observer|hopper|dropper|dispenser|lever|tripwire_hook|tnt|daylight_detector|lightning_rod|target|note_block|crafter|slime_block|honey_block|sculk_sensor|calibrated_sculk_sensor|command_block|chain_command_block|repeating_command_block|iron_door|iron_trapdoor|copper_door|copper_trapdoor|jukebox|bell)$|^(waxed_)?(exposed_|weathered_|oxidized_)?(lightning_rod|copper_bulb|copper_door|copper_trapdoor)$/,
  ],
  [
    'functional',
    /_(sign|hanging_sign|shelf|bed|banner|lantern|torch|campfire|chest|barrel|head|skull)$|^(crafting_table|furnace|blast_furnace|smoker|loom|cartography_table|fletching_table|smithing_table|stonecutter|grindstone|anvil|chipped_anvil|damaged_anvil|enchanting_table|brewing_stand|cauldron|lectern|composter|beacon|conduit|respawn_anchor|lodestone|bookshelf|chiseled_bookshelf|ender_chest|shulker_box|decorated_pot|flower_pot|ladder|scaffolding|torch|soul_torch|lantern|soul_lantern|campfire|soul_campfire|end_rod|chain|spawner|trial_spawner|vault|beehive|bee_nest|cobweb|sea_lantern|glowstone|shroomlight|jack_o_lantern|carved_pumpkin|dragon_egg|end_crystal|iron_bars|trapped_chest|player_head|dragon_head|creeper_head|piglin_head|skeleton_skull|wither_skeleton_skull|zombie_head|firework_rocket|firework_star|heavy_core|creaking_heart)$/,
  ],
  [
    'ingredients',
    /_(ingot|nugget|shard|scute|dust|powder|rod|ball|seeds|clump|crystals|fragment|pearl|membrane|tear|sac|hide|foot|bone|ink_sac|template)$|^(coal|charcoal|diamond|emerald|lapis_lazuli|quartz|amethyst_shard|netherite_scrap|copper_ingot|raw_iron|raw_copper|raw_gold|stick|string|feather|flint|leather|paper|book|brick|nether_brick|resin_brick|clay_ball|sugar|egg|blue_egg|brown_egg|gunpowder|slime_ball|honeycomb|bowl|glass_bottle|bone_meal|wheat|wheat_seeds|ender_eye|nether_star|heart_of_the_sea|nautilus_shell|shulker_shell|phantom_membrane|breeze_rod|blaze_rod|blaze_powder|ghast_tear|magma_cream|fermented_spider_eye|rabbit_foot|echo_shard|disc_fragment_5|sulfur|armadillo_scute|turtle_scute|cocoa_beans|glowstone_dust|redstone|sugar_cane|trial_key|ominous_trial_key|bamboo|kelp|dragon_breath|ominous_bottle|popped_chorus_fruit|sniffer_egg|turtle_egg)$/,
  ],
  [
    'natural',
    /_(log|wood|stem|hyphae|leaves|sapling|propagule|roots|ore|coral|coral_block|coral_fan|fungus|nylium|wart_block)$|^(grass_block|dirt|coarse_dirt|rooted_dirt|podzol|mycelium|dirt_path|farmland|gravel|sand|red_sand|clay|snow|snow_block|ice|packed_ice|blue_ice|mud|moss_block|moss_carpet|stone|granite|diorite|andesite|deepslate|tuff|calcite|dripstone_block|pointed_dripstone|basalt|smooth_basalt|netherrack|soul_sand|soul_soil|end_stone|obsidian|crying_obsidian|bedrock|sponge|wet_sponge|cactus|bamboo|vine|lily_pad|seagrass|kelp|sea_pickle|sugar_cane|pumpkin|melon|hay_block|dandelion|poppy|short_grass|tall_grass|fern|large_fern|dead_bush|sunflower|lilac|rose_bush|peony|azalea|spore_blossom|glow_lichen|sculk.*|magma_block|amethyst_block|budding_amethyst|raw_.*_block|.*_bud|amethyst_cluster|chorus_flower|chorus_plant|frogspawn|bone_block|ancient_debris|gilded_blackstone|blackstone|infested_.*|mushroom_stem|red_mushroom|brown_mushroom|.*_mushroom_block|.*_flower|.*_tulip|.*_petals|allium|azure_bluet|blue_orchid|cornflower|oxeye_daisy|lily_of_the_valley|torchflower|.*_dripleaf|hanging_roots|twisting_vines|weeping_vines|nether_sprouts|.*_froglight|.*_shrub|.*_moss|pale_.*|short_dry_grass|tall_dry_grass|bush|firefly_bush|leaf_litter|closed_eyeblossom|open_eyeblossom|cactus_flower|golden_dandelion|pitcher_plant|pitcher_pod|sniffer_egg|suspicious_.*|sulfur_spike|potent_sulfur|dried_ghast)$/,
  ],
];

/** Variants of one material, in the order the creative inventory lists them. */
const SUFFIXES = [
  '',
  '_stairs',
  '_slab',
  '_fence',
  '_fence_gate',
  '_door',
  '_trapdoor',
  '_pressure_plate',
  '_button',
  '_sign',
  '_hanging_sign',
  '_shelf',
  '_wall',
  '_bricks',
  '_brick',
  '_powder',
];

function tabOf(id: string): Tab {
  for (const [tab, pattern] of RULES) if (pattern.test(id)) return tab;
  // Anything left over is a plain block: bricks, polished stone, copper, quartz, …
  return 'building';
}

function familyOf(id: string): { readonly base: string; readonly rank: number } {
  for (const [rank, suffix] of SUFFIXES.entries()) {
    if (suffix !== '' && id.endsWith(suffix)) return { base: id.slice(0, -suffix.length), rank };
  }
  return { base: id, rank: 0 };
}

/** Item ids in creative-inventory-like order: by tab, then material, then variant. */
export function sortItemIds(ids: readonly string[]): readonly string[] {
  const keyed = ids.map((id) => {
    const { base, rank } = familyOf(id);
    return { id, tab: TABS.indexOf(tabOf(id)), base, rank };
  });
  keyed.sort(
    (a, b) =>
      a.tab - b.tab ||
      (a.base < b.base ? -1 : a.base > b.base ? 1 : 0) ||
      a.rank - b.rank ||
      (a.id < b.id ? -1 : 1),
  );
  return keyed.map((entry) => entry.id);
}
