import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <header class="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 px-8 flex items-center justify-between border-b border-border">
      <!-- Title/Date -->
      <div>
        <h1 class="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
      </div>

      <!-- Search and Profile -->
      <div class="flex items-center gap-6">
        <!-- Search Bar -->
        <div class="relative hidden md:block">
          <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search everything..." 
            class="flex h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </div>

        <!-- Notifications -->
        <button class="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-9 w-9">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <!-- Profile -->
        <div class="flex items-center gap-3 pl-4 border-l border-border">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm text-sm">
            PA
          </div>
          <div class="hidden lg:block text-left">
            <div class="text-sm font-semibold text-foreground leading-tight">Platform Admin</div>
            <div class="text-xs text-muted-foreground font-medium">admin&#64;ngoconnect.org</div>
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
