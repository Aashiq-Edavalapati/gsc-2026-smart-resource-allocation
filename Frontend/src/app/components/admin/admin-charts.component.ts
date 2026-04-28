import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

      
      <!-- Project Analytics (Bar Chart) - 2/3 Width -->
      <div class="lg:col-span-2 rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold tracking-tight">Activity Analytics</h3>
            <p class="text-sm text-muted-foreground mt-0.5">Weekly platform interactions</p>
          </div>
          <div class="flex gap-2">
            <span class="w-3 h-3 rounded-full bg-primary inline-block shadow-sm"></span>
            <span class="w-3 h-3 rounded-full bg-muted border border-border inline-block shadow-sm"></span>
          </div>
        </div>

        <!-- Bars Container -->
        <div class="flex items-end justify-between h-48 px-4 mt-4 border-b border-border pb-2 relative">
          <!-- Grid Lines -->
          <div class="absolute inset-x-0 top-0 h-[1px] bg-border/40"></div>
          <div class="absolute inset-x-0 top-1/4 h-[1px] bg-border/40"></div>
          <div class="absolute inset-x-0 top-2/4 h-[1px] bg-border/40"></div>
          <div class="absolute inset-x-0 top-3/4 h-[1px] bg-border/40"></div>

          <!-- Sunday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-muted rounded-t-md h-16 transition-all duration-300"></div>
            <span class="text-xs font-semibold text-muted-foreground">S</span>
          </div>
          <!-- Monday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-primary rounded-t-md h-32 transition-all duration-300 shadow-sm"></div>
            <span class="text-xs font-bold text-foreground">M</span>
          </div>
          <!-- Tuesday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-muted rounded-t-md border border-border h-24 transition-all duration-300 shadow-sm"></div>
            <span class="text-xs font-semibold text-muted-foreground">T</span>
          </div>
          <!-- Wednesday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-primary rounded-t-md h-40 transition-all duration-300 shadow-sm"></div>
            <span class="text-xs font-bold text-foreground">W</span>
          </div>
          <!-- Thursday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-muted rounded-t-md h-20 transition-all duration-300"></div>
            <span class="text-xs font-semibold text-muted-foreground">T</span>
          </div>
          <!-- Friday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-muted rounded-t-md border border-border h-28 transition-all duration-300 shadow-sm"></div>
            <span class="text-xs font-semibold text-muted-foreground">F</span>
          </div>
          <!-- Saturday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-muted rounded-t-md h-12 transition-all duration-300"></div>
            <span class="text-xs font-semibold text-muted-foreground">S</span>
          </div>
        </div>
      </div>

      <!-- Project Progress (Radial Chart) - 1/3 Width -->
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between items-center relative">
        <div class="w-full text-left mb-4">
          <h3 class="text-lg font-semibold tracking-tight">Issue Resolution</h3>
          <p class="text-sm text-muted-foreground mt-0.5">Overall progress rate</p>
        </div>

        <!-- Gauge Chart SVG -->
        <div class="relative flex items-center justify-center w-44 h-44 mt-2">
          <svg class="transform -rotate-90 w-40 h-40" viewBox="0 0 100 100">
            <!-- Background Circle -->
            <circle 
              cx="50" cy="50" r="40" 
              class="stroke-muted" 
              stroke-width="12" 
              fill="transparent"
            />
            <!-- Progress Circle -->
            <circle 
              cx="50" cy="50" r="40" 
              class="stroke-primary" 
              stroke-width="12" 
              fill="transparent" 
              [attr.stroke-dasharray]="circumference" 
              [attr.stroke-dashoffset]="dashOffset" 
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out"
            />
          </svg>
          
          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-black text-foreground tracking-tight">{{ resolutionRate }}%</span>
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Resolved</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 text-xs font-semibold">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-primary inline-block shadow-sm"></span>
            <span class="text-foreground">Resolved</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-muted border border-border inline-block"></span>
            <span class="text-muted-foreground">Open</span>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: []
})
export class AdminChartsComponent {
  @Input() stats: any = null;

  radius = 40;
  circumference = 2 * Math.PI * this.radius;

  get resolutionRate(): number {
    if (!this.stats?.totalIssues || this.stats.totalIssues === 0) return 100;
    return Math.round((this.stats.resolvedIssues / this.stats.totalIssues) * 100);
  }

  get dashOffset(): number {
    const rate = this.resolutionRate;
    return this.circumference - (rate / 100) * this.circumference;
  }
}
