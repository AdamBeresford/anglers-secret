import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { WeatherTrackingService } from './weather-tracking.service';

describe('WeatherTrackingService', () => {
  let service: WeatherTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
