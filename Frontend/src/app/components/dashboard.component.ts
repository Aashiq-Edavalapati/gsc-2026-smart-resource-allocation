import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MapPlaceholderComponent } from './map-placeholder.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapPlaceholderComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground flex flex-col">
      <!-- Shadcn-style Navbar -->
      <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight">GSC Smart Resource Allocation</h1>
          </div>
          <div class="flex items-center gap-6">
            <span class="text-sm font-medium text-muted-foreground hidden sm:inline-block">{{ userEmail }}</span>
            <button
              (click)="logout()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 container mx-auto px-4 py-8 space-y-8">
        
        <!-- Welcome Section -->
        <div>
          <h2 class="text-3xl font-bold tracking-tight mb-2">Welcome back! 👋</h2>
          <p class="text-muted-foreground text-lg">You're successfully logged in.</p>
        </div>

        <!-- Success Alert -->
        <div class="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div>
            <h5 class="font-medium text-foreground leading-none tracking-tight mb-1">Firebase + Backend Auth Working!</h5>
            <div class="text-muted-foreground">Your Firebase token was verified by the backend and synced to PostgreSQL.</div>
          </div>
        </div>

        <!-- Status Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Auth Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold tracking-tight text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Auth
              </h3>
              <p class="text-sm text-muted-foreground">Email + Google OAuth configured</p>
            </div>
          </div>

          <!-- DB Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold tracking-tight text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                Database
              </h3>
              <p class="text-sm text-muted-foreground">PostgreSQL + PostGIS ready</p>
            </div>
          </div>

          <!-- Backend Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold tracking-tight text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M12 2v20"/><path d="m17 5-5-3-5 3v14l5 3 5-3v-14Z"/></svg>
                Backend
              </h3>
              <p class="text-sm text-muted-foreground">Express API running</p>
            </div>
          </div>

          <!-- Map Action Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold tracking-tight text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                Frontend Map
              </h3>
              <p class="text-sm text-muted-foreground mb-4">Open nearby issues map widget.</p>
            </div>
            <button
              (click)="toggleMap()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full mt-2"
            >
              {{ showMap ? 'Hide Map' : 'Open Map' }}
            </button>
          </div>

          <!-- Organization Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold tracking-tight text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                Organizations
              </h3>
              <p class="text-sm text-muted-foreground mb-4">Manage your NGO or Social Group.</p>
            </div>
            <a
              routerLink="/organizations/create"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full mt-2"
            >
              Create Organization
            </a>
          </div>

        </div>

        <!-- Map View -->
        <div *ngIf="showMap" class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="p-4 border-b bg-muted/50">
            <h3 class="font-semibold tracking-tight">Resource Map</h3>
          </div>
          <div class="p-6">
            <app-map-placeholder [showCloseButton]="false"></app-map-placeholder>
          </div>
        </div>

        <!-- User Info Details -->
        <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div class="p-6 border-b">
            <h3 class="font-semibold tracking-tight">Account Details</h3>
            <p class="text-sm text-muted-foreground">Information about your current session.</p>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">Email</div>
              <div class="font-medium">{{ userEmail }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">User ID (UID)</div>
              <div class="font-medium truncate" [title]="userUid">{{ userUid }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">Authentication Method</div>
              <div class="font-medium flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {{ authProvider }}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail = '';
  userUid = '';
  authProvider = '';
  showMap = false;

  constructor() {
    const user = this.authService.getCurrentUser();
    this.userEmail = user?.email || 'Unknown';
    this.userUid = user?.uid || 'Unknown';
    
    // Try to get provider info from custom claims
    user?.getIdTokenResult().then((result: any) => {
      this.authProvider = result.claims.firebase?.sign_in_provider === 'google.com' ? 'Google OAuth' : 'Email';
    }).catch(() => {
      this.authProvider = 'Email/Google';
    });
  }

  toggleMap() {
    this.showMap = !this.showMap;
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout failed:', error);
    }
  }
}

