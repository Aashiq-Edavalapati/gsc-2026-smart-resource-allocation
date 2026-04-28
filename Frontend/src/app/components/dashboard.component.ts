import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MapPlaceholderComponent } from './map-placeholder.component';
import { OrgDashboardComponent } from './organization/org-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapPlaceholderComponent, OrgDashboardComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <!-- Navbar -->
      <header *ngIf="!hasMembership" class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-xl tracking-tight">Smart Resource Allocation</h1>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-muted-foreground hidden sm:inline-block">{{ userEmail }}</span>
            <button
              (click)="logout()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main *ngIf="!hasMembership" class="flex-1 container mx-auto px-4 py-12 space-y-8">
        <div>
          <h2 class="text-3xl font-bold tracking-tight mb-2">Welcome back 👋</h2>
          <p class="text-muted-foreground text-lg">Manage your deployment resources and logistics mapping.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Map Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold text-xl mb-2">Logistics Map</h3>
              <p class="text-sm text-muted-foreground mb-4">Visualize live local emergency response allocations.</p>
            </div>
            <button
              (click)="toggleMap()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 w-full"
            >
              {{ showMap ? 'Hide Map View' : 'Open Interactive Map' }}
            </button>
          </div>

          <!-- Organization Card -->
          <div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold text-xl mb-2">Join the Effort</h3>
              <p class="text-sm text-muted-foreground mb-4">You do not have an existing coordination workspace.</p>
            </div>
            <a
              routerLink="/organizations/create"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent h-10 px-4 w-full text-center"
            >
              Create Organization
            </a>
          </div>
        </div>

        <!-- Map Render -->
        <div *ngIf="showMap" class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div class="p-4 border-b bg-muted/50">
            <h3 class="font-semibold">Logistics & Issues Map</h3>
          </div>
          <app-map-placeholder [showCloseButton]="false"></app-map-placeholder>
        </div>

      </main>

      <!-- Org Dashboard -->
      <app-org-dashboard *ngIf="hasMembership && orgId" [embeddedOrgId]="orgId"></app-org-dashboard>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail = '';
  showMap = false;
  hasMembership = false;
  orgId: string | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.authUser();
      this.userEmail = user?.email || 'Unknown';
    });

    effect(() => {
      const profile = this.authService.userProfile();
      if (profile) {
        if (profile.role === 'PLATFORM_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (profile.memberships && profile.memberships.length > 0) {
          this.hasMembership = true;
          this.orgId = profile.memberships[0].organizationId;
        } else {
          this.hasMembership = false;
          this.orgId = null;
        }
      }
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
