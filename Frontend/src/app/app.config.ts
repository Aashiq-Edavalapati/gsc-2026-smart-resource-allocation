import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { LUCIDE_ICONS, LucideIconProvider, Building, Search, Bell, Settings, LogOut, Users, TriangleAlert } from 'lucide-angular';

import { routes } from './app.routes';

const icons = { Building, Search, Bell, Settings, LogOut, Users, TriangleAlert };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    AuthService,
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }
  ]
};
