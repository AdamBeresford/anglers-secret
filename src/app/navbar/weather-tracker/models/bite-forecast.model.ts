import { FishSpecies } from './fish.model';

export type ActivityBand = 'prime' | 'good' | 'fair' | 'slow' | 'off';

export interface FactorInsight {
  label: string;
  points: number; // signed contribution to the score
}

export interface SpeciesForecast {
  species: FishSpecies;
  score: number; // 0-100
  band: ActivityBand;
  // High water temperature welfare advisory: fishing for this species today
  // risks the fish (trout/salmon/pike catch-and-release mortality thresholds)
  welfareWarning: boolean;
  insights: FactorInsight[];
  tip: string;
}

export type BiteForecastMap = Record<FishSpecies, SpeciesForecast>;

export const ACTIVITY_BAND_LABELS: Record<ActivityBand, string> = {
  prime: 'Prime',
  good: 'Good',
  fair: 'Fair',
  slow: 'Slow',
  off: 'Switched off',
};
