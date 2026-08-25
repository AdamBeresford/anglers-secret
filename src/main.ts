import { WeatherTrackingService } from './app/navbar/weather-tracker/services/weather-tracking.service';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { APP_ROUTES } from './app/app.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './app/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, ReactiveFormsModule),
        WeatherTrackingService,
        provideHttpClient(withInterceptorsFromDi(), withInterceptors([authInterceptor])),
        provideAnimations(),
        provideRouter(APP_ROUTES, withHashLocation()), provideAnimationsAsync()
    ]
})
  .catch((err) => console.error(err));
