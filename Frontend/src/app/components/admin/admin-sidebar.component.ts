import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-64 bg-card border-r border-border flex flex-col h-full">
      <!-- Logo -->
      <div class="p-6 flex items-center gap-3">
        <div class="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
          A
        </div>
        <span class="font-semibold text-lg tracking-tight text-foreground">Platform Admin</span>
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-3 py-2 space-y-1">
        <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-3">Menu</div>
        
        <button 
          (click)="changeTab('overview')" 
          [class.bg-primary]="activeTab === 'overview'"
          [class.text-primary-foreground]="activeTab === 'overview'"
          [class.text-muted-foreground]="activeTab !== 'overview'"
          class="flex items-center gap-3 w-full px-3 py-2 rounded-md font-medium transition-colors shadow-sm hover:bg-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          Dashboard
        </button>

        <button 
          (click)="changeTab('organizations')" 
          [class.bg-primary]="activeTab === 'organizations'"
          [class.text-primary-foreground]="activeTab === 'organizations'"
          [class.text-muted-foreground]="activeTab !== 'organizations'"
          class="flex items-center gap-3 w-full px-3 py-2 rounded-md font-medium transition-colors hover:bg-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m16 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Organizations
        </button>

        <button 
          (click)="changeTab('users')" 
          [class.bg-primary]="activeTab === 'users'"
          [class.text-primary-foreground]="activeTab === 'users'"
          [class.text-muted-foreground]="activeTab !== 'users'"
          class="flex items-center gap-3 w-full px-3 py-2 rounded-md font-medium transition-colors hover:bg-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Users
        </button>
      </nav>

      <div class="px-3 py-4 space-y-1 border-t border-border">
        <button (click)="onLogout()" class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-medium transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  `,
  styles: []
})
export class AdminSidebarComponent {
  @Input() activeTab: string = 'overview';
  @Output() tabChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  changeTab(tab: string) {
    this.tabChange.emit(tab);
  }

  onLogout() {
    this.logout.emit();
  }
}

