import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      <!-- Project Analytics (Bar Chart) - 2/3 Width -->
      <div class="lg:col-span-2 bg-white rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Activity Analytics</h3>
            <p class="text-xs text-gray-400 font-medium mt-0.5">Weekly platform interactions</p>
          </div>
          <div class="flex gap-2">
            <span class="w-3 h-3 rounded-full bg-[#68417E] inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-[#98b65d] inline-block"></span>
          </div>
        </div>

        <!-- Bars Container -->
        <div class="flex items-end justify-between h-48 px-4 mt-4 border-b border-gray-100 pb-2 relative">
          <!-- Grid Lines -->
          <div class="absolute inset-x-0 top-0 h-[1px] bg-gray-50"></div>
          <div class="absolute inset-x-0 top-1/4 h-[1px] bg-gray-50"></div>
          <div class="absolute inset-x-0 top-2/4 h-[1px] bg-gray-50"></div>
          <div class="absolute inset-x-0 top-3/4 h-[1px] bg-gray-50"></div>

          <!-- Sunday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-gray-100/80 rounded-2xl h-16 group-hover:bg-[#68417E]/20 transition-all duration-300"></div>
            <span class="text-xs font-bold text-gray-400">S</span>
          </div>
          <!-- Monday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-[#68417E] rounded-2xl h-32 group-hover:bg-[#68417E]/90 transition-all duration-300 shadow-md shadow-[#68417E]/10"></div>
            <span class="text-xs font-bold text-[#68417E]">M</span>
          </div>
          <!-- Tuesday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-[#98b65d] rounded-2xl h-24 group-hover:bg-[#98b65d]/90 transition-all duration-300 shadow-md shadow-[#98b65d]/10"></div>
            <span class="text-xs font-bold text-[#98b65d]">T</span>
          </div>
          <!-- Wednesday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-[#68417E] rounded-2xl h-40 group-hover:bg-[#68417E]/90 transition-all duration-300 shadow-md shadow-[#68417E]/10"></div>
            <span class="text-xs font-bold text-[#68417E]">W</span>
          </div>
          <!-- Thursday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-gray-100/80 rounded-2xl h-20 group-hover:bg-[#68417E]/20 transition-all duration-300"></div>
            <span class="text-xs font-bold text-gray-400">T</span>
          </div>
          <!-- Friday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-[#98b65d] rounded-2xl h-28 group-hover:bg-[#98b65d]/90 transition-all duration-300 shadow-md shadow-[#98b65d]/10"></div>
            <span class="text-xs font-bold text-[#98b65d]">F</span>
          </div>
          <!-- Saturday -->
          <div class="flex flex-col items-center gap-2 w-8 group relative z-10">
            <div class="w-full bg-gray-100/80 rounded-2xl h-12 group-hover:bg-[#68417E]/20 transition-all duration-300"></div>
            <span class="text-xs font-bold text-gray-400">S</span>
          </div>
        </div>
      </div>

      <!-- Project Progress (Radial Chart) - 1/3 Width -->
      <div class="bg-white rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50 flex flex-col justify-between items-center relative">
        <div class="w-full text-left mb-4">
          <h3 class="text-lg font-bold text-gray-900">Issue Resolution</h3>
          <p class="text-xs text-gray-400 font-medium mt-0.5">Overall progress rate</p>
        </div>

        <!-- Gauge Chart SVG -->
        <div class="relative flex items-center justify-center w-44 h-44 mt-2">
          <svg class="transform -rotate-90 w-40 h-40" viewBox="0 0 100 100">
            <!-- Background Circle -->
            <circle 
              cx="50" cy="50" r="40" 
              stroke="#F5F6FA" 
              stroke-width="12" 
              fill="transparent"
              class="transition-all duration-1000"
            />
            <!-- Progress Circle -->
            <circle 
              cx="50" cy="50" r="40" 
              stroke="#68417E" 
              stroke-width="12" 
              fill="transparent" 
              [attr.stroke-dasharray]="circumference" 
              [attr.stroke-dashoffset]="dashOffset" 
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out shadow-sm"
            />
          </svg>
          
          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-black text-gray-800 tracking-tight">{{ resolutionRate }}%</span>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Resolved</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 text-xs font-semibold">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-md bg-[#68417E] inline-block"></span>
            <span class="text-gray-600">Resolved</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-md bg-[#F5F6FA] inline-block"></span>
            <span class="text-gray-400">Open</span>
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
