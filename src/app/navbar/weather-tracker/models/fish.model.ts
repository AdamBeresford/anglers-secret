export enum FishSpecies {
  PIKE = 'pike',
  PERCH = 'perch',
  TROUT = 'trout',
  COMMON_CARP = 'commonCarp',
  MIRROR_CARP = 'mirrorCarp',
  BARBEL = 'barbel',
  SALMON = 'salmon',
  CATFISH = 'catfish',
  CHUBB = 'chubb',
  STURGEON = 'sturgeon',
  ZANDER = 'zander',
}

export type FishStabilityLevel = 'poor' | 'caution' | 'good';

export type FishStabilityMap = {
  [key in FishSpecies]: FishStabilityLevel;
};
