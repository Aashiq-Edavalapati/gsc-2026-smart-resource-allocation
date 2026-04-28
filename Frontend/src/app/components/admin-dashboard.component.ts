import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

// Import child components
import { AdminSidebarComponent } from './admin/admin-sidebar.component';
import { AdminHeaderComponent } from './admin/admin-header.component';
import { AdminStatsComponent } from './admin/admin-stats.component';
import { AdminPendingOrgsComponent } from './admin/admin-pending-orgs.component';
import { AdminChartsComponent } from './admin/admin-charts.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    AdminSidebarComponent, 
    AdminHeaderComponent, 
    AdminStatsComponent, 
    AdminPendingOrgsComponent, 
    AdminChartsComponent
  ],
  template: `
    <div class="flex h-screen w-screen bg-background font-sans overflow-hidden">
      
      <!-- Sidebar Wrapper -->
      <div class="flex-none h-full w-64 hidden md:block">
        <app-admin-sidebar 
          [activeTab]="currentTab()" 
          (tabChange)="setTab($event)" 
          (logout)="logout()">
        </app-admin-sidebar>
      </div>

      <!-- Main Content Wrapper -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        <!-- Header -->
        <app-admin-header [stats]="stats()" class="flex-none"></app-admin-header>

        <!-- Dashboard Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">

          <!-- Mobile Tab Navigation -->
          <div class="flex border-b md:hidden gap-4 mb-4 overflow-x-auto">
            <button 
              (click)="setTab('overview')"
              [class.border-primary]="currentTab() === 'overview'"
              [class.text-primary]="currentTab() === 'overview'"
              class="pb-2 px-1 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
              Overview
            </button>
            <button 
              (click)="setTab('organizations')"
              [class.border-primary]="currentTab() === 'organizations'"
              [class.text-primary]="currentTab() === 'organizations'"
              class="pb-2 px-1 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
              Organizations
            </button>
            <button 
              (click)="setTab('users')"
              [class.border-primary]="currentTab() === 'users'"
              [class.text-primary]="currentTab() === 'users'"
              class="pb-2 px-1 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
              Users
            </button>
          </div>
          
          <!-- Tab: Overview -->
          <div *ngIf="currentTab() === 'overview'" class="space-y-6 animate-in fade-in duration-300">
            <!-- Stats Cards -->
            <div>
              <app-admin-stats [stats]="stats()"></app-admin-stats>
            </div>

            <!-- Charts Section -->
            <div>
              <app-admin-charts [stats]="stats()"></app-admin-charts>
            </div>

            <!-- Pending Orgs List -->
            <div>
              <app-admin-pending-orgs 
                [pendingOrgs]="pendingOrgs()" 
                (verified)="loadDashboardData()">
              </app-admin-pending-orgs>
            </div>
          </div>

          <!-- Tab: Organizations -->
          <div *ngIf="currentTab() === 'organizations'" class="space-y-6 animate-in fade-in duration-300">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold tracking-tight">All Organizations</h3>
              <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                {{ allOrgs().length }} Total
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div *ngFor="let org of allOrgs()" class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-4 mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 flex-shrink-0">
                        {{ org.name.charAt(0) }}
                      </div>
                      <div class="min-w-0">
                        <h4 class="font-semibold truncate text-sm sm:text-base" [title]="org.name">{{ org.name }}</h4>
                        <p class="text-xs text-muted-foreground">{{ org.city || 'N/A' }} • {{ org.type }}</p>
                      </div>
                    </div>
                    <span 
                      [class.bg-emerald-500]="org.verificationStatus === 'VERIFIED'"
                      [class.bg-amber-500]="org.verificationStatus === 'PENDING' || org.verificationStatus === 'CONTACT_ADDED'"
                      [class.bg-muted]="org.verificationStatus === 'UNVERIFIED'"
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white flex-shrink-0">
                      {{ org.verificationStatus }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground line-clamp-3 mb-4">{{ org.description || 'No description provided.' }}</p>
                </div>
                <div class="text-xs border-t pt-3 text-muted-foreground font-mono truncate">
                  Darpan ID: {{ org.darpanId || 'None' }}
                </div>
              </div>
            </div>

            <div *ngIf="allOrgs().length === 0" class="text-center py-12 text-muted-foreground">
              No organizations found.
            </div>
          </div>

          <!-- Tab: Users -->
          <div *ngIf="currentTab() === 'users'" class="space-y-6 animate-in fade-in duration-300">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold tracking-tight">Platform Users</h3>
              <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                {{ allUsers().length }} Total
              </span>
            </div>

            <div class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full border-collapse text-left text-sm min-w-[600px]">
                  <thead class="bg-muted/50 border-b text-muted-foreground font-medium">
                    <tr>
                      <th class="p-4">Name</th>
                      <th class="p-4">Email</th>
                      <th class="p-4">Role</th>
                      <th class="p-4">Organizations</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr *ngFor="let user of allUsers()" class="hover:bg-muted/30 transition-colors">
                      <td class="p-4 font-medium">{{ user.name }}</td>
                      <td class="p-4 text-muted-foreground">{{ user.email }}</td>
                      <td class="p-4">
                        <span 
                          [class.bg-red-500]="user.role === 'PLATFORM_ADMIN'"
                          [class.bg-indigo-500]="user.role !== 'PLATFORM_ADMIN'"
                          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white">
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="p-4">
                        <div class="flex flex-wrap gap-1">
                          <span *ngFor="let m of user.memberships" class="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {{ m.organization?.name }} ({{ m.baseRole }})
                          </span>
                          <span *ngIf="!user.memberships?.length" class="text-xs text-muted-foreground">None</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div *ngIf="allUsers().length === 0" class="text-center py-12 text-muted-foreground">
              No users found.
            </div>
          </div>

        </div>
      </div>
      
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  stats = signal<any>(null);
  pendingOrgs = signal<any[]>([]);
  allUsers = signal<any[]>([]);
  allOrgs = signal<any[]>([]);
  currentTab = signal<'overview' | 'organizations' | 'users'>('overview');
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading.set(true);
    try {
      const [statsData, pendingOrgsData, usersData, orgsData] = await Promise.all([
        this.adminService.getStats().catch(() => null),
        this.adminService.getPendingOrganizations().catch(() => []),
        this.adminService.getUsers().catch(() => []),
        this.adminService.getOrganizations().catch(() => [])
      ]);
      
      if (statsData) this.stats.set(statsData);
      if (pendingOrgsData) this.pendingOrgs.set(pendingOrgsData);
      if (usersData) this.allUsers.set(usersData);
      if (orgsData) this.allOrgs.set(orgsData);
    } catch (error) {
      console.error('Error loading dashboard data', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: any) {
    this.currentTab.set(tab);
  }

  logout() {
    this.authService.logout();
  }
}

