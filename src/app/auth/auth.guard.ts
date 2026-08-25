import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Session restore is in flight on a cold load, so fall back to the stored token
  // rather than bouncing a user who is actually signed in.
  if (authService.isLoggedIn() || authService.token) return true;

  return router.createUrlTree(['/login']);
};
