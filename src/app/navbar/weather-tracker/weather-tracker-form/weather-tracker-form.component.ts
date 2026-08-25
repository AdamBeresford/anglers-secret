import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { WeatherTrackingService } from '../services/weather-tracking.service';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { switchMap } from 'rxjs';
import { FishStabilityService } from '../services/fish-stability.service';

@Component({
    selector: 'app-weather-tracker-form',
    templateUrl: './weather-tracker-form.component.html',
    styleUrl: './weather-tracker-form.component.scss',
    standalone: true,
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherTrackerFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private weatherService = inject(WeatherTrackingService);
  private fishStabilityService = inject(FishStabilityService);

  weatherTrackerForm: FormGroup = new FormGroup({});
  locationControl: FormControl = new FormControl('', Validators.required);

  ngOnInit(): void {
    this.constructForm();
  }

  constructForm() {
    this.weatherTrackerForm = this.fb.group({
      location: this.locationControl
    });
  }

  onSubmit() {
    this.weatherService.loadingWeatherData.set(true);
  
    const location = this.weatherTrackerForm.get('location')?.value;
    if (!location) return;
  
    this.weatherService.getMultipleHistoricalWeather(location, 5).pipe(
      switchMap(() => this.weatherService.getCurrentWeather(location)),
      switchMap(() => this.fishStabilityService.getAllFishStability())
    ).subscribe({
      next: (stabilityBySpecies) => {
        this.fishStabilityService.fishStability.set(stabilityBySpecies)
        this.weatherService.loadingWeatherData.set(false);
        this.weatherService.displayWeatherData.set(true);
      },
      error: (err) => {
        console.error(err);
        this.weatherService.loadingWeatherData.set(false);
      }
    });
  }
  
}
