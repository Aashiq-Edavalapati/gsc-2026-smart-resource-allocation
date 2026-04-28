import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <header class="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between border-b border-gray-50">
      <!-- Title/Date -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-400 font-medium">Welcome back, Platform Admin</p>
      </div>

      <!-- Search and Profile -->
      <div class="flex items-center gap-6">
        <!-- Search Bar -->
        <div class="relative hidden md:block">
          <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search everything..." 
            class="w-72 pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#68417E]/20 focus:ring-4 focus:ring-[#68417E]/5 transition-all duration-300"
          />
        </div>

        <!-- Notifications -->
        <button class="relative p-2.5 text-gray-400 hover:text-[#68417E] hover:bg-[#68417E]/5 rounded-2xl transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-[#98b65d] border-2 border-white rounded-full animate-pulse"></span>
        </button>

        <!-- Profile -->
        <div class="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#68417E] to-[#68417E]/80 flex items-center justify-center text-white font-bold shadow-md shadow-[#68417E]/10 border-2 border-white">
            PA
          </div>
          <div class="hidden lg:block text-left">
            <div class="text-sm font-semibold text-gray-800">Platform Admin</div>
            <div class="text-xs text-gray-400 font-medium">admin&#64;ngoconnect.org</div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class AdminHeaderComponent {
  @Input() stats: any = null;
}
