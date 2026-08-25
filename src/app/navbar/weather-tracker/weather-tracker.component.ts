import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WeatherTrackerFormComponent } from './weather-tracker-form/weather-tracker-form.component';
import { WeatherDisplayComponent } from './weather-display/weather-display.component';
import { WeatherTrackingService } from './services/weather-tracking.service';

@Component({
    selector: 'app-weather-tracker',
    templateUrl: './weather-tracker.component.html',
    styleUrl: './weather-tracker.component.scss',
    standalone: true,
    imports: [WeatherTrackerFormComponent, WeatherDisplayComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherTrackerComponent {

    weatherTrackingService = inject(WeatherTrackingService);

}
