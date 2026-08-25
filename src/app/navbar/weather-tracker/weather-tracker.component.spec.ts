import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { WeatherTrackerComponent } from './weather-tracker.component';

describe('WeatherTrackerComponent', () => {
  let component: WeatherTrackerComponent;
  let fixture: ComponentFixture<WeatherTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherTrackerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
