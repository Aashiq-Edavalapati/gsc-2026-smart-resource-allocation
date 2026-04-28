import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { MapPlaceholderComponent } from './components/map-placeholder.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
  { path: 'admin/dashboard', canActivate: [authGuard], component: AdminDashboardComponent },
  { path: 'map-test', canActivate: [authGuard], component: MapPlaceholderComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
