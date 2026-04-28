import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing.component';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { MapPlaceholderComponent } from './components/map-placeholder.component';
import { OrgDashboardComponent } from './components/organization/org-dashboard.component';
import { CreateOrgComponent } from './components/organization/create-org.component';
import { authGuard } from './guards/auth.guard';
import { unauthGuard } from './guards/unauth.guard';

export const routes: Routes = [
  { path: '', canActivate: [unauthGuard], component: LandingComponent, pathMatch: 'full' },
  { path: 'login', canActivate: [unauthGuard], component: LoginComponent },
  { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
  { path: 'organizations/create', canActivate: [authGuard], component: CreateOrgComponent },
  { path: 'organizations/:orgId/dashboard', canActivate: [authGuard], component: OrgDashboardComponent },
  { path: 'admin/dashboard', canActivate: [authGuard], component: AdminDashboardComponent },
  { path: 'map-test', canActivate: [authGuard], component: MapPlaceholderComponent },
  { path: '**', redirectTo: '' }
];
