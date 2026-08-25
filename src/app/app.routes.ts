import { Routes } from '@angular/router';
import { HomeComponent } from './navbar/home/home.component';
import { WeatherTrackerComponent } from './navbar/weather-tracker/weather-tracker.component';
import { SignupComponent } from './navbar/signup/signup.component';
import { LoginComponent } from './navbar/login/login.component';
import { FishFavouritesComponent } from './navbar/fish-favourites/fish-favourites.component';
import { AccountComponent } from './navbar/account/account.component';
import { authGuard } from './auth/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'weather-tracker', component: WeatherTrackerComponent },
  { path: 'fish-favourites', component: FishFavouritesComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
];