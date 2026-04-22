import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading), // wait until Firebase finishes
    map(() => {
      if (authService.isLoggedIn()) {
        return true;
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};