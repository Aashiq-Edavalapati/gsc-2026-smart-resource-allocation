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
        <app-admin-sidebar (logout)="logout()"></app-admin-sidebar>
      </div>

      <!-- Main Content Wrapper -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        <!-- Header -->
        <app-admin-header [stats]="stats()" class="flex-none"></app-admin-header>

        <!-- Dashboard Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          
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
      </div>
      
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  stats = signal<any>(null);
  pendingOrgs = signal<any[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading.set(true);
    try {
      const [statsData, orgsData] = await Promise.all([
        this.adminService.getStats().catch(() => null),
        this.adminService.getPendingOrganizations().catch(() => [])
      ]);
      
      if (statsData) this.stats.set(statsData);
      if (orgsData) this.pendingOrgs.set(orgsData);
    } catch (error) {
      console.error('Error loading dashboard data', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  logout() {
    this.authService.logout();
  }
}

