import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrganizationDashboardService } from '../../services/organization-dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-org',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-background font-sans text-foreground flex flex-col">
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 w-full border-b bg-background">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2 cursor-pointer" routerLink="/">
            <div class="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            </div>
            <span class="font-bold text-xl tracking-tight hidden sm:block">Smart Resource Allocation</span>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/dashboard" class="text-sm font-medium hover:text-primary transition-colors">My Dashboard</a>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 container mx-auto px-4 py-12 flex justify-center">
        <div class="max-w-2xl w-full">
          <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight mb-2">Create an Organization</h1>
            <p class="text-muted-foreground">Register your NGO or Social Group to manage field reports and coordinate with volunteers.</p>
          </div>

          <div class="bg-card border rounded-xl shadow-sm p-6 sm:p-8">
            <form (ngSubmit)="onSubmit()" class="space-y-6">
              
              <!-- Basic Info -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold tracking-tight border-b pb-2">Basic Information</h3>
                
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Organization Name <span class="text-destructive">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="orgData.name" 
                    name="name"
                    required
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="E.g. Helping Hands Foundation"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <label class="text-sm font-medium">Type <span class="text-destructive">*</span></label>
                    <select 
                      [(ngModel)]="orgData.type" 
                      name="type"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="NGO">NGO</option>
                      <option value="SOCIAL_GROUP">Social Group</option>
                    </select>
                  </div>
                  
                  <div class="grid gap-2">
                    <label class="text-sm font-medium">City / Location <span class="text-destructive">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="orgData.city" 
                      name="city"
                      required
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="E.g. Mumbai"
                    />
                  </div>
                </div>

                <div class="grid gap-2">
                  <label class="text-sm font-medium">Description</label>
                  <textarea 
                    [(ngModel)]="orgData.description" 
                    name="description"
                    rows="3"
                    class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Briefly describe the mission of your organization..."></textarea>
                </div>
              </div>

              <!-- Location (Optional) -->
              <div class="space-y-4 pt-4">
                <h3 class="text-lg font-semibold tracking-tight border-b pb-2">Geographic Coordinates (Optional)</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <label class="text-sm font-medium">Latitude</label>
                    <input 
                      type="number" 
                      [(ngModel)]="orgData.lat" 
                      name="lat"
                      step="any"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. 19.0760"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-sm font-medium">Longitude</label>
                    <input 
                      type="number" 
                      [(ngModel)]="orgData.lng" 
                      name="lng"
                      step="any"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. 72.8777"
                    />
                  </div>
                </div>
              </div>

              @if (errorMsg()) {
                <div class="bg-destructive/15 text-destructive text-sm font-medium p-3 rounded-md flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  {{ errorMsg() }}
                </div>
              }

              <div class="pt-4 flex items-center justify-end gap-4">
                <a routerLink="/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</a>
                <button 
                  type="submit" 
                  [disabled]="isLoading() || !orgData.name || !orgData.city"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8">
                  @if (isLoading()) {
                    <span class="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    Creating...
                  } @else {
                    Create Organization
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CreateOrgComponent implements OnInit {
  private orgService = inject(OrganizationDashboardService);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = signal(false);
  errorMsg = signal('');

  orgData = {
    name: '',
    type: 'NGO',
    city: '',
    description: '',
    lat: null,
    lng: null
  };

  constructor() {
    effect(() => {
      const profile = this.authService.userProfile();
      if (profile?.memberships && profile.memberships.length > 0) {
        const orgId = profile.memberships[0].organizationId;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngOnInit() {}

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMsg.set('');

    try {
      const payload: any = {
        name: this.orgData.name,
        type: this.orgData.type,
        city: this.orgData.city,
        description: this.orgData.description
      };

      if (this.orgData.lat) payload.lat = Number(this.orgData.lat);
      if (this.orgData.lng) payload.lng = Number(this.orgData.lng);

      const created = await this.orgService.createOrganization(payload);
      
      // Navigate to the newly created organization dashboard
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMsg.set(error.message || 'Failed to create organization. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
