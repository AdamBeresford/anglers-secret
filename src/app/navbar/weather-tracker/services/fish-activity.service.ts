import { inject, Injectable, signal } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { WeatherTrackingService } from './weather-tracking.service';
import { CurrentWeather } from '../models/current-weather';
import { HistoricalWeather } from '../models/historical-weather';
import { FishSpecies } from '../models/fish.model';
import { ActivityBand, BiteForecastMap, FactorInsight, SpeciesForecast } from '../models/bite-forecast.model';
import { SpeciesProfile, speciesProfiles } from '../models/species-profiles';

// Condition signals derived once per forecast from the weather window.
// history[0] is yesterday, history[4] five days ago.
interface ConditionSignals {
  waterTempC: number;    // recency-weighted mean air temp as a water-temp proxy
  tempTrendC: number;    // recent days minus older days, signed
  finingDown: boolean;   // rain earlier in the window, drier yesterday, not cold
  freshRain: boolean;    // mild rain yesterday without a temperature drop
  coldRain: boolean;     // rain arriving together with falling temperatures
  drySpell: boolean;     // effectively no rain across the whole window
  cloudNow: number;
  windMphNow: number;
  windDirNow: string;
  pressureDeltaMb: number; // current pressure minus yesterday midday
  month: number;           // 0-11
}

const WARM_WIND_DIRS = new Set(['S', 'SSW', 'SW', 'WSW', 'W']);
const COLD_WIND_DIRS = new Set(['NNE', 'NE', 'ENE', 'E']);

function isWinter(month: number): boolean {
  return month === 10 || month === 11 || month === 0 || month === 1; // Nov-Feb
}

function isHighSummer(month: number): boolean {
  return month >= 5 && month <= 7; // Jun-Aug
}

function toBand(score: number): ActivityBand {
  if (score >= 78) return 'prime';
  if (score >= 58) return 'good';
  if (score >= 38) return 'fair';
  if (score >= 18) return 'slow';
  return 'off';
}

@Injectable({
  providedIn: 'root'
})
export class FishActivityService {

  private weatherTrackingService = inject(WeatherTrackingService);

  biteForecast = signal<BiteForecastMap | null>(null);

  getBiteForecast(): Observable<BiteForecastMap> {
    return combineLatest([
      this.weatherTrackingService.historicalWeatherData$,
      this.weatherTrackingService.currentWeatherData$,
    ]).pipe(
      map(([history, current]) =>
        this.computeForecast(history.slice(0, 5), current, new Date().getMonth())
      )
    );
  }

  computeForecast(
    history: HistoricalWeather[],
    current: CurrentWeather | null,
    month: number
  ): BiteForecastMap {
    const result = {} as BiteForecastMap;

    if (history.length < 5 || !current) {
      for (const species of Object.values(FishSpecies)) {
        result[species] = {
          species,
          score: 50,
          band: 'fair',
          welfareWarning: false,
          insights: [],
          tip: speciesProfiles[species].tips.default,
        };
      }
      return result;
    }

    const signals = this.deriveSignals(history, current, month);
    for (const species of Object.values(FishSpecies)) {
      result[species] = this.scoreSpecies(species, signals);
    }
    return result;
  }

  private deriveSignals(
    history: HistoricalWeather[],
    current: CurrentWeather,
    month: number
  ): ConditionSignals {
    const temp = history.map(day => day.data.historicalWeather.tempC);
    const rain = history.map(day => day.data.historicalWeather.totalPrecipMm);

    const waterTempC = 0.5 * temp[0] + 0.3 * temp[1] + 0.2 * temp[2];
    const tempTrendC = (temp[0] + temp[1]) / 2 - (temp[3] + temp[4]) / 2;

    const earlierRain = rain[1] + rain[2] + rain[3];
    const coldRain = rain[0] >= 3 && tempTrendC <= -1.5;

    return {
      waterTempC,
      tempTrendC,
      finingDown: earlierRain >= 4 && rain[0] < 2 && tempTrendC > -1.5,
      freshRain: rain[0] >= 1 && rain[0] < 8 && !coldRain,
      coldRain,
      drySpell: rain.reduce((a, b) => a + b, 0) < 1.5,
      cloudNow: current.data.currentWeather.cloudCover,
      windMphNow: current.data.currentWeather.windMph,
      windDirNow: current.data.currentWeather.windDir,
      pressureDeltaMb: current.data.currentWeather.pressureMb - history[0].data.historicalWeather.midday.pressureMb,
      month,
    };
  }

  private scoreSpecies(species: FishSpecies, signals: ConditionSignals): SpeciesForecast {
    const profile = speciesProfiles[species];
    const { thermal, responses } = profile;
    const insights: FactorInsight[] = [];

    const addInsight = (label: string, points: number) => {
      if (Math.abs(points) >= 1) insights.push({ label, points: Math.round(points) });
      return points;
    };

    // Baseline: how well the water temperature suits the species, scaled by season
    const thermalFit = this.thermalFit(signals.waterTempC, thermal);
    const seasonalMultiplier = profile.seasonal[signals.month];
    let score = 60 * thermalFit * seasonalMultiplier;

    const welfareWarning =
      thermal.welfareAboveC !== undefined && signals.waterTempC >= thermal.welfareAboveC;

    // Temperature trend — signed, seasonal
    const trend = signals.tempTrendC;
    if (trend <= -1.5) {
      score += addInsight('Sharp temperature drop', -responses.tempTrend * 14 * Math.min(Math.abs(trend), 4) / 4);
    } else if (trend >= 1 && !isHighSummer(signals.month)) {
      score += addInsight('Warming trend', responses.tempTrend * 10 * Math.min(trend, 3) / 3);
    } else if (trend <= -1 && isHighSummer(signals.month) && signals.waterTempC > thermal.optimalMaxC) {
      score += addInsight('Cooling relief after heat', responses.tempTrend * 8);
    }

    // Rain pattern
    if (signals.coldRain) {
      score += addInsight('Cold rain', -responses.coldRain * 12);
    } else if (signals.finingDown && responses.finingDown > 0) {
      score += addInsight('River fining down after rain', responses.finingDown * 15);
    } else if (signals.freshRain && responses.freshRain > 0) {
      score += addInsight('Fresh mild rain', responses.freshRain * 7);
    }
    if (signals.drySpell && responses.drySpell > 0) {
      score += addInsight('Prolonged dry spell', -responses.drySpell * 10);
    }

    // Light
    if (isWinter(signals.month) && signals.cloudNow < 40) {
      score += addInsight('Winter sun on the water', responses.winterSun * 8);
    } else if (signals.cloudNow >= 60) {
      score += addInsight('Overcast skies', responses.lowLight * 10);
    } else if (signals.cloudNow < 30 && !isWinter(signals.month)) {
      score += addInsight('Bright skies', -responses.lowLight * 10);
    }

    // Wind
    if (signals.windMphNow >= 5 && signals.windMphNow <= 20) {
      score += addInsight('A good ripple on the water', responses.windRipple * 6);
    } else if (signals.windMphNow > 25) {
      score += addInsight('Strong winds', -5);
    }
    if (WARM_WIND_DIRS.has(signals.windDirNow)) {
      score += addInsight('Warm south-westerly airflow', responses.warmWindDir * 6);
    } else if (COLD_WIND_DIRS.has(signals.windDirNow)) {
      score += addInsight('Cold easterly airflow', -responses.warmWindDir * 8);
    }

    // Pressure trend
    if (signals.pressureDeltaMb <= -3) {
      score += addInsight('Falling pressure', responses.pressureTrend * 8);
    } else if (signals.pressureDeltaMb >= 5) {
      score += addInsight('Pressure rising fast', -responses.pressureTrend * 6);
    }

    if (welfareWarning) {
      score = Math.min(score, 10);
    }
    score = Math.max(0, Math.min(100, Math.round(score)));

    insights.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

    return {
      species,
      score,
      band: welfareWarning ? 'off' : toBand(score),
      welfareWarning,
      insights: insights.slice(0, 4),
      tip: this.pickTip(profile, signals, welfareWarning),
    };
  }

  private thermalFit(waterTempC: number, thermal: SpeciesProfile['thermal']): number {
    if (waterTempC < thermal.shutdownBelowC) return 0.05;
    if (waterTempC < thermal.poorBelowC) return 0.35;
    if (waterTempC < thermal.optimalMinC) return 0.7;
    if (waterTempC <= thermal.optimalMaxC) return 1;
    if (waterTempC <= thermal.poorAboveC) return 0.65;
    return 0.25;
  }

  private pickTip(profile: SpeciesProfile, signals: ConditionSignals, welfareWarning: boolean): string {
    if (welfareWarning) return profile.tips.heat;
    if (signals.waterTempC < profile.thermal.poorBelowC) return profile.tips.cold;
    if (signals.waterTempC > profile.thermal.poorAboveC) return profile.tips.heat;
    if (signals.finingDown && profile.responses.finingDown >= 0.5 && profile.tips.flood) {
      return profile.tips.flood;
    }
    if (signals.cloudNow < 30 && !isWinter(signals.month)) return profile.tips.bright;
    if (signals.cloudNow >= 60) return profile.tips.overcast;
    return profile.tips.default;
  }

}
