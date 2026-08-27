import { FishSpecies } from './fish.model';

// Values are drawn from the August 2026 research audit ("Reading the Water"):
// UK angling consensus and peer-reviewed catch studies. Temperatures are the
// engine's water-temperature proxy (a recency-weighted mean of daily air temps),
// so bands are set slightly wide to absorb the air-to-water lag.

export interface ThermalBands {
  // Below this the species has effectively stopped feeding — score is floored
  shutdownBelowC: number;
  // Below this feeding is markedly reduced
  poorBelowC: number;
  optimalMinC: number;
  optimalMaxC: number;
  // Above this feeding drops off
  poorAboveC: number;
  // At or above this, fishing harms the fish (C&R mortality) — advisory state
  welfareAboveC?: number;
}

// How strongly a species responds to each condition signal, 0 (indifferent)
// to 1 (defining factor for the species). Signs are applied by the engine.
export interface ConditionResponses {
  tempTrend: number;      // warming-rise bonus / cold-snap penalty
  finingDown: number;     // river falling & clearing after rain (spate lovers)
  freshRain: number;      // mild recent rain (oxygen, colour, washed-in food)
  coldRain: number;       // rain arriving with a temperature drop
  drySpell: number;       // penalty for a bone-dry settled week (spate rivers)
  lowLight: number;       // overcast bonus / bright-sun penalty
  winterSun: number;      // winter sunshine warming the shallows
  windRipple: number;     // a fishable chop on the water
  warmWindDir: number;    // S/SW/W airflow bonus, E/NE penalty
  pressureTrend: number;  // falling-pressure bonus / sharp-rise penalty
}

export interface SpeciesTips {
  bright: string;
  overcast: string;
  flood?: string;
  heat: string;
  cold: string;
  default: string;
}

export interface SpeciesProfile {
  thermal: ThermalBands;
  // Monthly activity multiplier, January to December, 0-1
  seasonal: [number, number, number, number, number, number, number, number, number, number, number, number];
  responses: ConditionResponses;
  tips: SpeciesTips;
}

const carpProfile: SpeciesProfile = {
  thermal: { shutdownBelowC: 4, poorBelowC: 8, optimalMinC: 12, optimalMaxC: 22, poorAboveC: 26 },
  seasonal: [0.4, 0.4, 0.6, 0.9, 1, 1, 0.9, 0.9, 1, 0.9, 0.6, 0.4],
  responses: {
    tempTrend: 1, finingDown: 0, freshRain: 0.7, coldRain: 1, drySpell: 0,
    lowLight: 0.7, winterSun: 0.6, windRipple: 0.8, warmWindDir: 1, pressureTrend: 1,
  },
  tips: {
    bright: 'They’ll be up in the water — try zigs or surface baits rather than the bottom.',
    overcast: 'Cloud has them feeding confidently — bottom baits over a bed of feed.',
    heat: 'Fish early morning or after dark when the water holds more oxygen.',
    cold: 'Feeding spells are short — single bright hookbaits, small traps, midday onwards.',
    default: 'Find the warm wind — the windward bank collects the food.',
  },
};

export const speciesProfiles: Record<FishSpecies, SpeciesProfile> = {
  [FishSpecies.PIKE]: {
    thermal: { shutdownBelowC: 1, poorBelowC: 4, optimalMinC: 8, optimalMaxC: 18, poorAboveC: 20, welfareAboveC: 21 },
    seasonal: [1, 0.9, 0.8, 0.6, 0.5, 0.3, 0.25, 0.3, 0.6, 1, 1, 1],
    responses: {
      tempTrend: 0.7, finingDown: 0, freshRain: 0.3, coldRain: 0.8, drySpell: 0,
      lowLight: 0.9, winterSun: 0.4, windRipple: 1, warmWindDir: 0.6, pressureTrend: 0.9,
    },
    tips: {
      bright: 'Bright light pushes pike deep — fish the drop-offs, or wait for dusk.',
      overcast: 'Grey skies are prime pike weather — work lures or deadbaits with confidence.',
      heat: 'Warm water is dangerous for pike — they fight to exhaustion and struggle to recover.',
      cold: 'Slow everything down — a static deadbait will outfish a worked lure.',
      default: 'A ripple and cloud cover — cover water with lures until you find them.',
    },
  },
  [FishSpecies.PERCH]: {
    thermal: { shutdownBelowC: 2, poorBelowC: 5, optimalMinC: 10, optimalMaxC: 22, poorAboveC: 24 },
    seasonal: [0.7, 0.7, 0.8, 0.8, 0.8, 0.7, 0.7, 0.8, 1, 1, 1, 0.8],
    responses: {
      tempTrend: 0.8, finingDown: 0, freshRain: 0.5, coldRain: 0.8, drySpell: 0,
      lowLight: 1, winterSun: 0.4, windRipple: 0.7, warmWindDir: 0.6, pressureTrend: 0.6,
    },
    tips: {
      bright: 'Perch hate bright sun — fish shaded margins and structure, or wait for dusk.',
      overcast: 'Dull days keep perch hunting — small lures or worms near cover all day.',
      heat: 'Look for deeper, cooler water near structure early and late.',
      cold: 'Tiny baits, fished slow and tight to cover — they won’t chase.',
      default: 'Dawn and dusk are the reliable windows — fish near structure.',
    },
  },
  [FishSpecies.ZANDER]: {
    thermal: { shutdownBelowC: 2, poorBelowC: 4, optimalMinC: 8, optimalMaxC: 20, poorAboveC: 24 },
    seasonal: [0.9, 0.85, 0.8, 0.7, 0.6, 0.6, 0.6, 0.7, 0.9, 1, 1, 1],
    responses: {
      tempTrend: 0.4, finingDown: 0.3, freshRain: 0.8, coldRain: 0.5, drySpell: 0,
      lowLight: 1, winterSun: 0, windRipple: 0.5, warmWindDir: 0.4, pressureTrend: 0.4,
    },
    tips: {
      bright: 'In clear water and sun, zander wait for darkness — fish into dusk or find coloured water.',
      overcast: 'Heavy cloud extends the zander window — fish smelly deadbaits or slow lures all day.',
      flood: 'Extra colour in the water is your friend — zander hunt in it all day.',
      heat: 'Fish after dark — daytime heat and light both work against you.',
      cold: 'They still feed in the cold — slow ambush presentations near deeper water.',
      default: 'The lower the light, the better — dawn, dusk or coloured water.',
    },
  },
  [FishSpecies.TROUT]: {
    thermal: { shutdownBelowC: 2, poorBelowC: 5, optimalMinC: 10, optimalMaxC: 18, poorAboveC: 19, welfareAboveC: 20 },
    seasonal: [0.5, 0.6, 0.8, 1, 1, 0.9, 0.7, 0.7, 0.9, 0.9, 0.7, 0.5],
    responses: {
      tempTrend: 0.7, finingDown: 0.6, freshRain: 0.6, coldRain: 0.8, drySpell: 0.3,
      lowLight: 0.9, winterSun: 0.3, windRipple: 0.5, warmWindDir: 0.4, pressureTrend: 0.5,
    },
    tips: {
      bright: 'Bright sun sends trout deep and spooky — fish shade lines, go finer, or wait for evening.',
      overcast: 'Cloud keeps trout rising all day — great dry-fly and nymph conditions.',
      flood: 'As the river fines down, trout mop up washed-in food — fish the crease lines.',
      heat: 'Above ~19°C trout are stressed — most fisheries ask you to stop. Let them be today.',
      cold: 'Fish slow and deep through the middle of the day.',
      default: 'Match the hatch and cover water — conditions are workable.',
    },
  },
  [FishSpecies.COMMON_CARP]: carpProfile,
  [FishSpecies.MIRROR_CARP]: carpProfile,
  [FishSpecies.BARBEL]: {
    thermal: { shutdownBelowC: 3, poorBelowC: 6, optimalMinC: 10, optimalMaxC: 20, poorAboveC: 24 },
    seasonal: [0.6, 0.6, 0.6, 0.7, 0.8, 1, 1, 1, 1, 0.9, 0.8, 0.7],
    responses: {
      tempTrend: 1, finingDown: 1, freshRain: 0.8, coldRain: 1, drySpell: 0.5,
      lowLight: 0.8, winterSun: 0.3, windRipple: 0.2, warmWindDir: 0.7, pressureTrend: 0.4,
    },
    tips: {
      bright: 'Low clear water and sun — barbel tuck under cover; fish at dusk or into darkness.',
      overcast: 'Good barbel light — pellets or meat rolled through the deeper runs.',
      flood: 'A warm, coloured river is the best barbel fishing there is — fish the steady water near the bank with a big smelly bait.',
      heat: 'Fish after dark when the river cools and barbel move onto the shallows.',
      cold: 'Wait for the warmest part of the day — a rising temperature triggers short feeding spells.',
      default: 'Steady flow and a bit of colour — barbel weather.',
    },
  },
  [FishSpecies.SALMON]: {
    thermal: { shutdownBelowC: 1, poorBelowC: 3, optimalMinC: 7, optimalMaxC: 15, poorAboveC: 16, welfareAboveC: 18 },
    seasonal: [0.5, 0.6, 0.8, 0.8, 0.8, 0.7, 0.7, 0.9, 1, 1, 0.7, 0.5],
    responses: {
      tempTrend: 0.5, finingDown: 1, freshRain: 0.9, coldRain: 0.5, drySpell: 1,
      lowLight: 0.8, winterSun: 0.2, windRipple: 0.3, warmWindDir: 0.4, pressureTrend: 0.3,
    },
    tips: {
      bright: 'Bright low water is hard going — fish first light, or go small and fast.',
      overcast: 'Cloud keeps fish taking through the day — cover the pools methodically.',
      flood: 'Fresh water brings fresh fish — the falling, clearing spate is the taking window.',
      heat: 'Warm water stresses salmon badly — river authorities advise stopping. Rest the pools.',
      cold: 'Fish deep and slow — sink tips and heavy flies through the pools.',
      default: 'Salmon fishing lives on rain — watch the river height and fish the drop.',
    },
  },
  [FishSpecies.CATFISH]: {
    thermal: { shutdownBelowC: 10, poorBelowC: 12, optimalMinC: 18, optimalMaxC: 27, poorAboveC: 30 },
    seasonal: [0.1, 0.1, 0.2, 0.4, 0.7, 1, 1, 1, 0.8, 0.5, 0.2, 0.1],
    responses: {
      tempTrend: 0.8, finingDown: 0, freshRain: 0.3, coldRain: 0.8, drySpell: 0,
      lowLight: 0.8, winterSun: 0, windRipple: 0.3, warmWindDir: 0.5, pressureTrend: 1,
    },
    tips: {
      bright: 'Cats sit in cover by day — fish into darkness for the real feeding spell.',
      overcast: 'Heavy cloud brings cats out early — big smelly baits near snags.',
      heat: 'Hot, sticky, thundery weather is prime cat time — fish through the night.',
      cold: 'Below ~10°C wels barely feed — save the session for warmer water.',
      default: 'Warm water and low light — big baits, strong tackle, patience.',
    },
  },
  [FishSpecies.CHUBB]: {
    thermal: { shutdownBelowC: 0, poorBelowC: 2, optimalMinC: 4, optimalMaxC: 20, poorAboveC: 24 },
    seasonal: [1, 1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 1, 1, 1],
    responses: {
      tempTrend: 0.3, finingDown: 0.7, freshRain: 0.4, coldRain: 0.4, drySpell: 0,
      lowLight: 1, winterSun: 0.3, windRipple: 0.2, warmWindDir: 0.3, pressureTrend: 0.1,
    },
    tips: {
      bright: 'Chub sulk under cover in bright sun — creep up on the shady spots, or wait for dusk.',
      overcast: 'Dull days are chub days — they’ll feed confidently in open water.',
      flood: 'As the colour drops out, chub emerge to intercept food — cheesepaste in the slacks.',
      heat: 'Try a floating bait in the shade of cover.',
      cold: 'The one fish that always feeds — a smelly bait, fished still, will find one.',
      default: 'Almost any conditions suit a chub — stealth matters more than weather.',
    },
  },
  [FishSpecies.STURGEON]: {
    thermal: { shutdownBelowC: 2, poorBelowC: 4, optimalMinC: 8, optimalMaxC: 20, poorAboveC: 22, welfareAboveC: 25 },
    seasonal: [0.8, 0.8, 0.9, 1, 1, 0.8, 0.6, 0.6, 0.9, 1, 0.9, 0.8],
    responses: {
      tempTrend: 0.3, finingDown: 0, freshRain: 0.2, coldRain: 0.3, drySpell: 0,
      lowLight: 0.4, winterSun: 0.2, windRipple: 0.3, warmWindDir: 0.2, pressureTrend: 0,
    },
    tips: {
      bright: 'Light barely matters to a sturgeon — a smelly bottom bait will still get picked up.',
      overcast: 'Good conditions — halibut pellets or fishy baits on the patrol routes.',
      heat: 'Warm water holds too little oxygen for sturgeon — they stop feeding and can be at risk.',
      cold: 'Sturgeon keep feeding when carp shut down — a genuine winter target.',
      default: 'Follow the margins — sturgeon patrol in circuits and hunt by smell.',
    },
  },
};
