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
    <div class="flex h-screen bg-[#F5F6FA] font-sans overflow-hidden">
      
      <!-- Sidebar -->
      <app-admin-sidebar (logout)="logout()"></app-admin-sidebar>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col h-full overflow-y-auto relative">
        
        <!-- Header -->
        <app-admin-header [stats]="stats()"></app-admin-header>

        <!-- Dashboard Content -->
        <div class="flex-1 p-8">
          
          <!-- Stats Cards -->
          <app-admin-stats [stats]="stats()"></app-admin-stats>

          <!-- Charts Section -->
          <app-admin-charts [stats]="stats()"></app-admin-charts>

          <!-- Pending Orgs List -->
          <app-admin-pending-orgs 
            [pendingOrgs]="pendingOrgs()" 
            (verified)="loadDashboardData()">
          </app-admin-pending-orgs>

        </div>
      </main>
      
    </div>
  `
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

