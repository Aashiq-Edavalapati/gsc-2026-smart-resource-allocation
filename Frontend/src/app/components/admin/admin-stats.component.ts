import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      <!-- Card 1: Total Users (Primary Theme) -->
      <div class="bg-[#68417E] text-white rounded-3xl p-6 shadow-xl shadow-[#68417E]/10 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
        <div class="relative z-10 flex flex-col justify-between h-full">
          <div>
            <span class="text-[#F5F6FA]/80 text-sm font-semibold tracking-wide uppercase">Total Users</span>
            <h2 class="text-4xl font-bold mt-2">{{ stats?.totalUsers || 0 }}</h2>
          </div>
          <div class="flex items-center gap-2 mt-6 text-xs bg-white/15 px-3 py-1.5 rounded-xl w-fit font-medium backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>+12% this month</span>
          </div>
        </div>
        <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>

      <!-- Card 2: Total Organizations -->
      <div class="bg-white text-gray-800 rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
        <div class="relative z-10 flex flex-col justify-between h-full">
          <div>
            <span class="text-gray-400 text-sm font-semibold tracking-wide uppercase">Organizations</span>
            <h2 class="text-4xl font-bold mt-2 text-gray-900">{{ stats?.totalOrgs || 0 }}</h2>
          </div>
          <div class="flex items-center gap-2 mt-6 text-xs text-[#98b65d] bg-[#98b65d]/10 px-3 py-1.5 rounded-xl w-fit font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Active platform NGOs</span>
          </div>
        </div>
        <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-[#68417E]/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>

      <!-- Card 3: Total Issues -->
      <div class="bg-white text-gray-800 rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
        <div class="relative z-10 flex flex-col justify-between h-full">
          <div>
            <span class="text-gray-400 text-sm font-semibold tracking-wide uppercase">Reported Issues</span>
            <h2 class="text-4xl font-bold mt-2 text-gray-900">{{ stats?.totalIssues || 0 }}</h2>
          </div>
          <div class="flex items-center gap-2 mt-6 text-xs text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl w-fit font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Needs attention</span>
          </div>
        </div>
        <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>

      <!-- Card 4: Resolved Issues -->
      <div class="bg-white text-gray-800 rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
        <div class="relative z-10 flex flex-col justify-between h-full">
          <div>
            <span class="text-gray-400 text-sm font-semibold tracking-wide uppercase">Resolved</span>
            <h2 class="text-4xl font-bold mt-2 text-gray-900">{{ stats?.resolvedIssues || 0 }}</h2>
          </div>
          <div class="flex items-center gap-2 mt-6 text-xs text-[#98b65d] bg-[#98b65d]/10 px-3 py-1.5 rounded-xl w-fit font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ getResolutionRate() }}% Success Rate</span>
          </div>
        </div>
        <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-[#98b65d]/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
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
