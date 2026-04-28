import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

export const unauthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading), // wait until Firebase finishes
    map(() => {
      if (!authService.isLoggedIn()) {
        return true;
      } else {
        const profile = authService.getCurrentProfile();
        
        if (profile?.role === 'PLATFORM_ADMIN') {
          return router.createUrlTree(['/admin/dashboard']);
        }
    
        if (profile?.memberships && profile.memberships.length > 0) {
          const orgId = profile.memberships[0].organizationId;
          return router.createUrlTree(['/organizations', orgId, 'dashboard']);
        }
    
        return router.createUrlTree(['/dashboard']);
      }
    })
  );
};
