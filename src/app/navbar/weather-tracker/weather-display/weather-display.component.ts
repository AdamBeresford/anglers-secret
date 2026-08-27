import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WeatherTrackingService } from '../services/weather-tracking.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FishActivityService } from '../services/fish-activity.service';
import { FishFavouritesService } from '../../fish-favourites/services/fish-favourites.service';
import { FishSpecies } from '../models/fish.model';
import { ACTIVITY_BAND_LABELS, ActivityBand, SpeciesForecast } from '../models/bite-forecast.model';

@Component({
    selector: 'app-weather-display',
    templateUrl: './weather-display.component.html',
    styleUrl: './weather-display.component.scss',
    standalone: true,
    imports: [
      CommonModule,
      AsyncPipe,
      RouterLink
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherDisplayComponent {

  public weatherTrackingService = inject(WeatherTrackingService);
  public fishActivityService = inject(FishActivityService);
  public fishFavouritesService = inject(FishFavouritesService);

  // Read reactively so favourites loaded from the account after construction still appear
  fishList = this.fishFavouritesService.selectedFish;

  forecastFor(fishName: string): SpeciesForecast | null {
    return this.fishActivityService.biteForecast()?.[this.mapFishNameToSpecies(fishName)] ?? null;
  }

  bandLabel(band: ActivityBand): string {
    return ACTIVITY_BAND_LABELS[band];
  }

  private mapFishNameToSpecies(name: string): FishSpecies {
    const key = name.replace(/\s+/g, '_').toUpperCase();
    return FishSpecies[key as keyof typeof FishSpecies];
  }

  onBack() {
    this.weatherTrackingService.clearHistoricalWeatherData();
    this.weatherTrackingService.displayWeatherData.set(false);
  }

}
