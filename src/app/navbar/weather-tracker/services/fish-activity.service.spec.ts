import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FishActivityService } from './fish-activity.service';
import { FishSpecies } from '../models/fish.model';
import { CurrentWeather } from '../models/current-weather';
import { HistoricalWeather } from '../models/historical-weather';

const JAN = 0, APR = 3, JUL = 6, OCT = 9;

function historyDay(tempC: number, rainMm: number, pressureMb = 1015): HistoricalWeather {
  const period = { cloudCover: 50, precipMm: rainMm / 3, windMph: 8, windDir: 'W', pressureMb, humidity: 70 };
  return {
    weatherId: 'test',
    data: {
      location: { name: 'Test', region: 'Test', country: 'UK' },
      historicalWeather: {
        date: '2026-01-01',
        tempC,
        totalPrecipMm: rainMm,
        uv: 2,
        morning: { ...period },
        midday: { ...period },
        evening: { ...period },
      },
    },
  };
}

function current(overrides: Partial<{
  tempC: number; windMph: number; windDir: string; pressureMb: number; cloudCover: number;
}> = {}): CurrentWeather {
  return {
    weatherId: 'test',
    data: {
      location: { name: 'Test', region: 'Test', country: 'UK' },
      currentWeather: {
        lastUpdated: '2026-01-01 12:00',
        tempC: overrides.tempC ?? 12,
        windMph: overrides.windMph ?? 8,
        windDir: overrides.windDir ?? 'W',
        pressureMb: overrides.pressureMb ?? 1015,
        precipMm: 0,
        cloudCover: overrides.cloudCover ?? 50,
        uv: 2,
      },
    },
  };
}

// history[0] is yesterday, history[4] five days ago
const flatWeek = (tempC: number, rainMm = 0) =>
  [historyDay(tempC, rainMm), historyDay(tempC, rainMm), historyDay(tempC, rainMm), historyDay(tempC, rainMm), historyDay(tempC, rainMm)];

describe('FishActivityService', () => {
  let service: FishActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FishActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns a neutral fair forecast when the window is incomplete', () => {
    const forecast = service.computeForecast([historyDay(12, 0)], current(), APR);

    expect(forecast[FishSpecies.PIKE].band).toBe('fair');
    expect(forecast[FishSpecies.PIKE].score).toBe(50);
  });

  it('gates carp hard on a stable freezing week while chub stay catchable', () => {
    const forecast = service.computeForecast(flatWeek(3), current({ tempC: 3 }), JAN);

    // The research finding the old algorithm failed: stable-but-freezing is not good carp fishing
    expect(forecast[FishSpecies.COMMON_CARP].score).toBeLessThan(20);
    // Chub famously feed in any conditions down to ~1°C
    expect(forecast[FishSpecies.CHUBB].score).toBeGreaterThan(40);
    expect(forecast[FishSpecies.CHUBB].score).toBeGreaterThan(forecast[FishSpecies.COMMON_CARP].score + 25);
  });

  it('penalises a sharp cold snap against a stable week at the same final temperature', () => {
    const snapWeek = [historyDay(6, 0), historyDay(7, 0), historyDay(10, 0), historyDay(13, 0), historyDay(14, 0)];
    const snap = service.computeForecast(snapWeek, current(), OCT);
    const stable = service.computeForecast(flatWeek(13), current(), OCT);

    expect(snap[FishSpecies.PERCH].score).toBeLessThan(stable[FishSpecies.PERCH].score);
    expect(snap[FishSpecies.PERCH].insights.some(i => i.label === 'Sharp temperature drop')).toBeTrue();
  });

  it('rewards a spring warming trend', () => {
    const warmingWeek = [historyDay(14, 0), historyDay(13, 0), historyDay(11, 0), historyDay(10, 0), historyDay(9, 0)];
    const warming = service.computeForecast(warmingWeek, current(), APR);

    expect(warming[FishSpecies.COMMON_CARP].insights.some(i => i.label === 'Warming trend' && i.points > 0)).toBeTrue();
  });

  it('treats a fining-down river as prime barbel conditions, not a penalty', () => {
    // Rain earlier in the window, drier yesterday, mild temperatures
    const spateCycle = [historyDay(14, 1), historyDay(14, 9), historyDay(13, 12), historyDay(13, 6), historyDay(13, 0)];
    const afterRain = service.computeForecast(spateCycle, current({ cloudCover: 70 }), OCT);
    const boneDry = service.computeForecast(flatWeek(13.5, 0), current({ cloudCover: 70 }), OCT);

    expect(afterRain[FishSpecies.BARBEL].score).toBeGreaterThan(boneDry[FishSpecies.BARBEL].score);
    expect(afterRain[FishSpecies.BARBEL].insights.some(i => i.label === 'River fining down after rain')).toBeTrue();
  });

  it('penalises salmon for a prolonged dry spell', () => {
    const dry = service.computeForecast(flatWeek(12, 0), current(), OCT);

    expect(dry[FishSpecies.SALMON].insights.some(i => i.label === 'Prolonged dry spell' && i.points < 0)).toBeTrue();
  });

  it('raises the welfare warning for trout in a heatwave while catfish thrive', () => {
    const heatwave = service.computeForecast(flatWeek(23), current({ tempC: 24, cloudCover: 10 }), JUL);

    expect(heatwave[FishSpecies.TROUT].welfareWarning).toBeTrue();
    expect(heatwave[FishSpecies.TROUT].band).toBe('off');
    expect(heatwave[FishSpecies.TROUT].score).toBeLessThanOrEqual(10);

    expect(heatwave[FishSpecies.CATFISH].welfareWarning).toBeFalse();
    expect(heatwave[FishSpecies.CATFISH].score).toBeGreaterThan(50);
  });

  it('scores common and mirror carp identically', () => {
    const forecast = service.computeForecast(flatWeek(15), current(), JUL);

    expect(forecast[FishSpecies.COMMON_CARP].score).toBe(forecast[FishSpecies.MIRROR_CARP].score);
  });

  it('marks bright summer skies as a negative for light-shy species', () => {
    const bright = service.computeForecast(flatWeek(15), current({ cloudCover: 5 }), JUL);

    expect(bright[FishSpecies.ZANDER].insights.some(i => i.label === 'Bright skies' && i.points < 0)).toBeTrue();
    expect(bright[FishSpecies.ZANDER].tip).toContain('dusk');
  });

  it('rewards a falling barometer and penalises a cold easterly', () => {
    const falling = service.computeForecast(flatWeek(15), current({ pressureMb: 1008 }), OCT);
    const easterly = service.computeForecast(flatWeek(15), current({ windDir: 'NE' }), OCT);
    const baseline = service.computeForecast(flatWeek(15), current(), OCT);

    expect(falling[FishSpecies.COMMON_CARP].score).toBeGreaterThan(baseline[FishSpecies.COMMON_CARP].score);
    expect(easterly[FishSpecies.COMMON_CARP].score).toBeLessThan(baseline[FishSpecies.COMMON_CARP].score);
  });
});
