import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      
      <!-- Card 1: Total Users -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-col justify-between h-full">
          <div>
            <span class="text-muted-foreground text-sm font-medium tracking-tight">Total Users</span>
            <h2 class="text-3xl font-bold mt-1.5 tracking-tight text-foreground">{{ stats?.totalUsers || 0 }}</h2>
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-muted-foreground font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>+12% this month</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Total Organizations -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-col justify-between h-full">
          <div>
            <span class="text-muted-foreground text-sm font-medium tracking-tight">Organizations</span>
            <h2 class="text-3xl font-bold mt-1.5 tracking-tight text-foreground">{{ stats?.totalOrgs || 0 }}</h2>
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-muted-foreground font-medium">
            <span>Active platform NGOs</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Total Issues -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-col justify-between h-full">
          <div>
            <span class="text-muted-foreground text-sm font-medium tracking-tight">Reported Issues</span>
            <h2 class="text-3xl font-bold mt-1.5 tracking-tight text-foreground">{{ stats?.totalIssues || 0 }}</h2>
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-muted-foreground font-medium">
            <span>Needs attention</span>
          </div>
        </div>
      </div>

      <!-- Card 4: Resolved Issues -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-col justify-between h-full">
          <div>
            <span class="text-muted-foreground text-sm font-medium tracking-tight">Resolved</span>
            <h2 class="text-3xl font-bold mt-1.5 tracking-tight text-foreground">{{ stats?.resolvedIssues || 0 }}</h2>
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-muted-foreground font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ getResolutionRate() }}% Success Rate</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: []
})
export class AdminStatsComponent {
  @Input() stats: any = null;

  getResolutionRate(): number {
    if (!this.stats?.totalIssues || this.stats.totalIssues === 0) return 100;
    return Math.round((this.stats.resolvedIssues / this.stats.totalIssues) * 100);
  }
}
