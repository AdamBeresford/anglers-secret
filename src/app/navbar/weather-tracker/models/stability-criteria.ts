import { FishSpecies } from './fish.model';

export interface StabilityCriteria {
  tempThreshold: number;
  windThreshold: number;
  rainThreshold: number;
  cloudThreshold: number;
  uvThreshold: number;
}

export interface WeightedStabilityCriteria {
  thresholds: StabilityCriteria;
  weights: {
    temp: number;
    rain: number;
    cloud: number;
    wind: number;
    uv: number;
  };
}

export const stabilityCriteriaMap: Record<FishSpecies, WeightedStabilityCriteria> = {
  pike: {
    thresholds: { tempThreshold: 1.5, windThreshold: 3, rainThreshold: 0.8, cloudThreshold: 15, uvThreshold: 2 },
    weights:    { temp: 0.4, rain: 0.25, cloud: 0.2, wind: 0.1, uv: 0.05 }
  },
  perch: {
    thresholds: { tempThreshold: 2, windThreshold: 4, rainThreshold: 1.2, cloudThreshold: 20, uvThreshold: 2 },
    weights:    { temp: 0.4, rain: 0.25, cloud: 0.2, wind: 0.1, uv: 0.05 }
  },
  trout: {
    thresholds: { tempThreshold: 1, windThreshold: 2.5, rainThreshold: 0.7, cloudThreshold: 10, uvThreshold: 1 },
    weights:    { temp: 0.5, rain: 0.25, cloud: 0.15, wind: 0.05, uv: 0.05 }
  },
  salmon: {
    thresholds: { tempThreshold: 1, windThreshold: 2, rainThreshold: 0.5, cloudThreshold: 10, uvThreshold: 1 },
    weights:    { temp: 0.5, rain: 0.3, cloud: 0.15, wind: 0.03, uv: 0.02 }
  },
  commonCarp: {
    thresholds: { tempThreshold: 2.5, windThreshold: 5, rainThreshold: 2, cloudThreshold: 25, uvThreshold: 3 },
    weights:    { temp: 0.35, rain: 0.25, cloud: 0.25, wind: 0.1, uv: 0.05 }
  },
  mirrorCarp: {
    thresholds: { tempThreshold: 2.5, windThreshold: 5, rainThreshold: 2, cloudThreshold: 25, uvThreshold: 3 },
    weights:    { temp: 0.35, rain: 0.25, cloud: 0.25, wind: 0.1, uv: 0.05 }
  },
  barbel: {
    thresholds: { tempThreshold: 2, windThreshold: 4, rainThreshold: 1.2, cloudThreshold: 20, uvThreshold: 2 },
    weights:    { temp: 0.4, rain: 0.3, cloud: 0.2, wind: 0.05, uv: 0.05 }
  },
  catfish: {
    thresholds: { tempThreshold: 3, windThreshold: 5, rainThreshold: 2.5, cloudThreshold: 30, uvThreshold: 4 },
    weights:    { temp: 0.4, rain: 0.25, cloud: 0.2, wind: 0.1, uv: 0.05 }
  },
  chubb: {
    thresholds: { tempThreshold: 1.5, windThreshold: 3, rainThreshold: 1, cloudThreshold: 15, uvThreshold: 2 },
    weights:    { temp: 0.45, rain: 0.25, cloud: 0.2, wind: 0.05, uv: 0.05 }
  },
  sturgeon: {
    thresholds: { tempThreshold: 1, windThreshold: 2, rainThreshold: 0.5, cloudThreshold: 10, uvThreshold: 1 },
    weights:    { temp: 0.5, rain: 0.3, cloud: 0.15, wind: 0.03, uv: 0.02 }
  },
  zander: {
    thresholds: { tempThreshold: 2, windThreshold: 4, rainThreshold: 1, cloudThreshold: 20, uvThreshold: 2 },
    weights:    { temp: 0.45, rain: 0.25, cloud: 0.2, wind: 0.07, uv: 0.03 }
  }
};
